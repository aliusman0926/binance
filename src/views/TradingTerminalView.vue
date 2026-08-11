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
      <order-book :asks="orderBook.asks" :bids="orderBook.bids" :is-loading="isOrderBookLoading" :error="orderBookError" />
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
import { subscribeDepth, subscribeKlines, subscribeTrades } from '@/services/liveStreams'

export default {
  name: 'TradingTerminalView',
  components: { BaseState, CandlestickChart, OrderBook, PriceVolumeChart, RecentTrades, SymbolHeader, TerminalLayout },
  props: { symbol: { type: String, required: true } },
  data: () => ({
    unsubscribeDepth: null,
    unsubscribeKlines: null,
    unsubscribeTrades: null,
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
    ...mapActions('markets', { initializeMarkets: 'initialize' }),
    ...mapActions('terminal', ['initializeChart', 'loadTrades']),
    async loadTerminal () {
      const requestId = ++this.loadRequest
      this.clearSubscriptions()
      this.resetPanelState()
      if (this.$store.state.markets.symbols.length === 0) await this.initializeMarkets()
      if (requestId !== this.loadRequest) return

      this.isInvalidSymbol = !this.market
      if (this.isInvalidSymbol) return

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
        this.synchronizeDepthSnapshot(requestId)
        return
      }
      this.$store.commit('terminal/setOrderBook', this.synchronizer.getOrderBook())
    },
    async synchronizeDepthSnapshot (requestId) {
      if (this.isDepthSnapshotLoading) return
      this.isDepthSnapshotLoading = true
      this.isOrderBookLoading = true
      this.orderBookError = null

      try {
        for (let attempt = 0; attempt < 3; attempt += 1) {
          const snapshot = normalizeDepthSnapshot(await getDepthSnapshot(this.symbol))
          if (requestId !== this.loadRequest) return
          if (this.synchronizer.applySnapshot(snapshot)) {
            this.$store.commit('terminal/setOrderBook', this.synchronizer.getOrderBook())
            this.isOrderBookLoading = false
            return
          }
        }
        this.orderBookError = 'Unable to synchronize the order book. Retrying…'
        this.isOrderBookLoading = false
      } catch (error) {
        this.orderBookError = error.message
      } finally {
        this.isDepthSnapshotLoading = false
      }
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
      ;[this.unsubscribeDepth, this.unsubscribeKlines, this.unsubscribeTrades].forEach(unsubscribe => {
        if (unsubscribe) unsubscribe()
      })
      this.unsubscribeDepth = null
      this.unsubscribeKlines = null
      this.unsubscribeTrades = null
    },
    resetPanelState () {
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
