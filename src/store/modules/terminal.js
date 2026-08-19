import { getKlines, getRecentTrades } from '@/api/binance'
import { normalizeKline, normalizeTrade } from '@/services/marketNormalizers'
import { DEFAULT_KLINE_INTERVAL, PRICE_VOLUME_BUCKET_MS, PRICE_VOLUME_MAX_POINTS } from '@/utils/constants'

/**
 * Folds a trade into second-wide buckets: price is the last trade in the bucket, volume
 * is the sum. Returns a new array — the chart watches the array reference, so mutating
 * a bucket in place would not be observed.
 */
function appendToBuckets (buckets, trade) {
  const bucketTime = Math.floor(trade.time / PRICE_VOLUME_BUCKET_MS) * PRICE_VOLUME_BUCKET_MS
  const lastBucket = buckets[buckets.length - 1]

  if (lastBucket && lastBucket.time === bucketTime) {
    const merged = { time: bucketTime, price: trade.price, volume: lastBucket.volume + trade.quantity }
    return [...buckets.slice(0, -1), merged]
  }

  return [...buckets, { time: bucketTime, price: trade.price, volume: trade.quantity }].slice(-PRICE_VOLUME_MAX_POINTS)
}

export default {
  namespaced: true,
  state: () => ({
    symbol: null,
    interval: DEFAULT_KLINE_INTERVAL,
    candles: [],
    orderBook: { bids: [], asks: [], lastUpdateId: null },
    trades: [],
    priceVolumeSeries: [],
    isLoading: false,
    error: null
  }),
  mutations: {
    setSymbol (state, symbol) { state.symbol = symbol },
    // Named to avoid shadowing window.setInterval once mapped onto a component.
    setChartInterval (state, interval) { state.interval = interval },
    setCandles (state, candles) { state.candles = candles },
    setOrderBook (state, orderBook) { state.orderBook = orderBook },
    setTrades (state, trades) { state.trades = trades },
    prependTrade (state, trade) {
      if (state.trades.some(item => item.id === trade.id)) return
      state.trades = [trade, ...state.trades].slice(0, 50)
    },
    appendTradePoint (state, trade) {
      state.priceVolumeSeries = appendToBuckets(state.priceVolumeSeries, trade)
    },
    /** Seeds the strip from the REST trade history so it is not blank on arrival. */
    seedPriceVolumeSeries (state, chronologicalTrades) {
      state.priceVolumeSeries = chronologicalTrades.reduce(appendToBuckets, [])
    },
    upsertCandle (state, candle) {
      const lastCandle = state.candles[state.candles.length - 1]
      state.candles = lastCandle && lastCandle.openTime === candle.openTime
        ? [...state.candles.slice(0, -1), candle]
        : [...state.candles, candle]
    },
    setLoading (state, value) { state.isLoading = value },
    setError (state, error) { state.error = error }
  },
  actions: {
    async initializeChart ({ state, commit, dispatch }, { symbol, interval = state.interval }) {
      commit('setLoading', true)
      commit('setError', null)
      commit('setSymbol', symbol)
      commit('setCandles', [])
      try {
        await dispatch('loadChart', { symbol, interval })
      } catch (error) {
        commit('setError', error.message)
      } finally {
        commit('setLoading', false)
      }
    },
    async loadChart ({ state, commit }, { symbol, interval = state.interval }) {
      const klines = await getKlines(symbol, interval)
      if (state.symbol === symbol) commit('setCandles', klines.map(normalizeKline))
    },
    // The order book is owned by TradingTerminalView: a REST snapshot alone is not enough,
    // it has to be reconciled against the buffered depth diffs, so the fetch lives beside
    // the socket subscription rather than here.
    async loadTrades ({ state, commit }, symbol) {
      const trades = await getRecentTrades(symbol)
      if (state.symbol !== symbol) return

      // Binance returns these oldest-first; the table wants newest-first, the strip wants
      // them in chronological order.
      const chronologicalTrades = trades.map(normalizeTrade)
      commit('setTrades', [...chronologicalTrades].reverse())
      commit('seedPriceVolumeSeries', chronologicalTrades)
    }
  }
}
