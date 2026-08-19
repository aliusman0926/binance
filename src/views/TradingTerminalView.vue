<template>
  <div>
    <base-state v-if="isInvalidSymbol" type="error" :message="`${symbol} is not an available spot market.`" />
    <terminal-layout v-else>
    <template #symbol>
      <symbol-header :symbol="symbol" :market="market" :ticker="ticker" />
    </template>
    <template #chart>
      <base-state v-if="error" type="error" :message="error"><template #actions><button class="button-text" type="button" @click="loadTerminal">Try again</button></template></base-state>
      <candlestick-chart
        v-else
        :candles="candles"
        :interval="interval"
        :is-loading="isLoading"
        @interval-change="changeInterval"
      />
    </template>
    <template #order-book>
      <order-book :asks="orderBook.asks" :bids="orderBook.bids" :is-loading="isOrderBookLoading" :error="orderBookError" @retry="retryDepthSynchronization" />
    </template>
    <template #trades>
      <recent-trades :trades="trades" :is-loading="isTradesLoading" :error="tradesError" />
    </template>
    <template #price-volume>
      <price-volume-chart :series="priceVolumeSeries" />
    </template>
    </terminal-layout>
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import { BaseState } from '@/components/base'
import { getDepthSnapshot } from '@/api/binance'
import CandlestickChart from '@/components/terminal/CandlestickChart.vue'
import OrderBook from '@/components/terminal/OrderBook.vue'
import PriceVolumeChart from '@/components/terminal/PriceVolumeChart.vue'
import RecentTrades from '@/components/terminal/RecentTrades.vue'
import SymbolHeader from '@/components/terminal/SymbolHeader.vue'
import OrderBookSynchronizer from '@/services/OrderBookSynchronizer'
import TerminalLayout from '@/layouts/TerminalLayout.vue'
import { normalizeDepthSnapshot } from '@/services/marketNormalizers'
import { subscribeDepth, subscribeKlines, subscribeTicker, subscribeTrades } from '@/services/liveStreams'
import { DEPTH_RESYNC_BASE_DELAY_MS, DEPTH_RESYNC_JITTER_MS, DEPTH_RESYNC_MAX_ATTEMPTS, DEPTH_RESYNC_MAX_DELAY_MS } from '@/utils/constants'

export default {
  name: 'TradingTerminalView',
  components: { BaseState, CandlestickChart, OrderBook, PriceVolumeChart, RecentTrades, SymbolHeader, TerminalLayout },
  props: { symbol: { type: String, required: true } },
  data: () => ({
    unsubscribeDepth: null,
    unsubscribeKlines: null,
    unsubscribeTicker: null,
    unsubscribeTrades: null,
    depthResyncAttempts: 0,
    depthResyncTimer: null,
    hasExhaustedDepthResync: false,
    isDepthSnapshotLoading: false,
    isInvalidSymbol: false,
    isOrderBookLoading: true,
    isTradesLoading: true,
    chartRequest: 0,
    loadRequest: 0,
    orderBookError: null,
    synchronizer: null,
    tradesError: null
  }),
  computed: {
    ...mapState('terminal', ['candles', 'error', 'interval', 'isLoading', 'orderBook', 'priceVolumeSeries', 'trades']),
    market () { return this.$store.state.markets.symbols.find(item => item.symbol === this.symbol) || null },
    ticker () { return this.$store.state.markets.tickers[this.symbol] || null }
  },
  watch: {
    symbol: { immediate: true, handler () { this.loadTerminal() } }
  },
  beforeDestroy () {
    this.clearSubscriptions()
  },
  methods: {
    ...mapActions('markets', { initializeMarkets: 'initialize', updateTickers: 'updateTickers' }),
    ...mapActions('terminal', ['initializeChart', 'loadTrades']),
    async loadTerminal () {
      const requestId = ++this.loadRequest
      this.clearSubscriptions()
      this.resetPanelState()
      if (this.$store.state.markets.symbols.length === 0) await this.initializeMarkets()
      if (requestId !== this.loadRequest) return

      this.isInvalidSymbol = !this.market
      if (this.isInvalidSymbol) return

      this.startTickerSubscription()
      this.startDepthSynchronization(requestId)
      this.loadRecentTrades(requestId)
      await this.loadChartForInterval(this.interval)
    },
    /**
     * The interval drives two independent things: the REST kline fetch and the websocket
     * stream name (btcusdt@kline_15m). Reloading one without the other silently feeds
     * 1m ticks into 15m candles.
     *
     * This tracks its own request counter rather than reusing loadRequest — the depth
     * subscription captured loadRequest at subscribe time, so bumping it here would make
     * handleDepthEvent reject every subsequent frame and freeze the order book.
     */
    async loadChartForInterval (interval) {
      const chartRequestId = ++this.chartRequest
      const symbol = this.symbol

      if (this.unsubscribeKlines) {
        this.unsubscribeKlines()
        this.unsubscribeKlines = null
      }

      await this.initializeChart({ symbol, interval })
      if (chartRequestId !== this.chartRequest || symbol !== this.symbol || this.error) return

      this.unsubscribeKlines = subscribeKlines({
        symbol,
        interval,
        onKline: candle => this.$store.commit('terminal/upsertCandle', candle)
      })
    },
    async changeInterval (interval) {
      if (interval === this.interval) return
      this.$store.commit('terminal/setChartInterval', interval)
      await this.loadChartForInterval(interval)
    },
    /**
     * markets.tickers is otherwise only filled by markets/initialize (one REST snapshot) and
     * by the !ticker@arr stream, which lives and dies with the Markets and Compare views. On
     * this route neither keeps running, so the header froze at its snapshot while the candles
     * ticked. A per-symbol @ticker stream writes into the same store slot, so Markets stays
     * warm on the way back and no component needs to know where the numbers came from.
     */
    startTickerSubscription () {
      this.unsubscribeTicker = subscribeTicker({
        symbol: this.symbol,
        // Wrapped in an array: updateTickers is the shared array-shaped merge path, and
        // mergeTickers replaces the map by identity so a single-key merge still reacts.
        onTicker: ticker => this.updateTickers([ticker])
      })
    },
    startDepthSynchronization (requestId) {
      this.synchronizer = new OrderBookSynchronizer()
      this.unsubscribeDepth = subscribeDepth({
        symbol: this.symbol,
        onDepth: event => this.handleDepthEvent(event, requestId)
      })
    },
    handleDepthEvent (event, requestId) {
      if (requestId !== this.loadRequest || !this.synchronizer) return
      const isInSequence = this.synchronizer.bufferUpdate(event)
      if (!this.synchronizer.isSynchronized || !isInSequence) {
        this.requestDepthResync(requestId)
        return
      }
      this.$store.commit('terminal/setOrderBook', this.synchronizer.getOrderBook())
    },
    /**
     * The gate between a 10/s event stream and a weight-5 REST endpoint. Every frame that
     * arrives while the book is desynced lands here — including the first one, which is how
     * the book bootstraps — so it has to be idempotent: a snapshot in flight, a retry timer
     * already armed, or an exhausted ceiling all mean "do nothing".
     *
     * Without the timer and ceiling checks this is the runaway: the in-flight flag alone
     * prevents overlap but not repetition, so each completed failure is immediately re-armed
     * by the next frame, forever.
     */
    requestDepthResync (requestId) {
      if (this.isDepthSnapshotLoading || this.depthResyncTimer || this.hasExhaustedDepthResync) return
      this.synchronizeDepthSnapshot(requestId)
    },
    async synchronizeDepthSnapshot (requestId) {
      this.isDepthSnapshotLoading = true

      try {
        const snapshot = normalizeDepthSnapshot(await getDepthSnapshot(this.symbol))
        if (requestId !== this.loadRequest) return
        if (this.synchronizer.applySnapshot(snapshot)) {
          this.$store.commit('terminal/setOrderBook', this.synchronizer.getOrderBook())
          this.depthResyncAttempts = 0
          this.orderBookError = null
          this.isOrderBookLoading = false
          return
        }
        this.scheduleDepthResync(requestId)
      } catch (error) {
        if (requestId !== this.loadRequest) return
        this.scheduleDepthResync(requestId, error)
      } finally {
        // Guarded: a superseded load must not clear the flag out from under the load that
        // replaced it. resetPanelState owns the reset for the abandoned request.
        if (requestId === this.loadRequest) this.isDepthSnapshotLoading = false
      }
    },
    /**
     * Exponential backoff with jitter, mirroring BinanceWebSocket.scheduleReconnect so the
     * app has one backoff idiom. One request per scheduled attempt — the spacing that the
     * old immediate three-attempt loop lacked — and after DEPTH_RESYNC_MAX_ATTEMPTS it stops
     * re-arming entirely and hands the decision to the user.
     */
    scheduleDepthResync (requestId, error = null) {
      this.depthResyncAttempts += 1
      // Cleared unconditionally: the panel checks isLoading before error, so leaving it set
      // would hide every failure behind a permanent "Synchronizing…" spinner.
      this.isOrderBookLoading = false

      if (this.depthResyncAttempts >= DEPTH_RESYNC_MAX_ATTEMPTS) {
        this.hasExhaustedDepthResync = true
        this.orderBookError = error && error.isRateLimited
          ? error.message
          : 'Unable to synchronize the order book.'
        return
      }

      const backoffMs = Math.min(
        DEPTH_RESYNC_BASE_DELAY_MS * (2 ** (this.depthResyncAttempts - 1)),
        DEPTH_RESYNC_MAX_DELAY_MS
      )
      // A 429/418 states exactly how long to stay away; never retry sooner than that.
      const retryAfterMs = (error && error.retryAfterMs) || 0
      const delayMs = Math.max(backoffMs, retryAfterMs) + Math.round(Math.random() * DEPTH_RESYNC_JITTER_MS)

      this.orderBookError = error && error.isRateLimited
        ? error.message
        : `Resynchronizing the order book… (attempt ${this.depthResyncAttempts + 1} of ${DEPTH_RESYNC_MAX_ATTEMPTS})`

      this.depthResyncTimer = window.setTimeout(() => {
        this.depthResyncTimer = null
        if (requestId !== this.loadRequest || !this.synchronizer) return
        this.synchronizeDepthSnapshot(requestId)
      }, delayMs)
    },
    /**
     * Manual escape hatch from the ceiling. Also usable mid-backoff, where it cancels the
     * pending timer and retries at once. The depth subscription is deliberately left alive
     * while exhausted, so the synchronizer still holds recent events to reconcile against.
     */
    retryDepthSynchronization () {
      if (!this.synchronizer) return
      this.cancelDepthResync()
      this.depthResyncAttempts = 0
      this.hasExhaustedDepthResync = false
      this.orderBookError = null
      this.isOrderBookLoading = true
      this.requestDepthResync(this.loadRequest)
    },
    cancelDepthResync () {
      if (!this.depthResyncTimer) return
      window.clearTimeout(this.depthResyncTimer)
      this.depthResyncTimer = null
    },
    async loadRecentTrades (requestId) {
      try {
        await this.loadTrades(this.symbol)
        if (requestId !== this.loadRequest) return
        this.unsubscribeTrades = subscribeTrades({
          symbol: this.symbol,
          onTrade: trade => {
            this.$store.commit('terminal/prependTrade', trade)
            this.$store.commit('terminal/appendTradePoint', trade)
          }
        })
      } catch (error) {
        if (requestId === this.loadRequest) this.tradesError = error.message
      } finally {
        if (requestId === this.loadRequest) this.isTradesLoading = false
      }
    },
    clearSubscriptions () {
      this.cancelDepthResync()
      ;[this.unsubscribeDepth, this.unsubscribeKlines, this.unsubscribeTicker, this.unsubscribeTrades].forEach(unsubscribe => {
        if (unsubscribe) unsubscribe()
      })
      this.unsubscribeDepth = null
      this.unsubscribeKlines = null
      this.unsubscribeTicker = null
      this.unsubscribeTrades = null
    },
    resetPanelState () {
      this.cancelDepthResync()
      this.depthResyncAttempts = 0
      this.hasExhaustedDepthResync = false
      this.isDepthSnapshotLoading = false
      this.isOrderBookLoading = true
      this.isTradesLoading = true
      this.orderBookError = null
      this.tradesError = null
      this.synchronizer = null
      this.$store.commit('terminal/setOrderBook', { bids: [], asks: [], lastUpdateId: null })
      this.$store.commit('terminal/setTrades', [])
    }
  }
}
</script>
