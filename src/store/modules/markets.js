import { get24HourTickers, getExchangeInfo } from '@/api/binance'
import { normalizeSymbol, normalizeTicker } from '@/services/marketNormalizers'
import { loadWatchlist, saveWatchlist } from '@/services/watchlistStorage'
import { DEFAULT_PAGE_SIZE, DEFAULT_QUOTE_ASSET } from '@/utils/constants'

export default {
  namespaced: true,
  state: () => ({
    symbols: [],
    tickers: {},
    watchlist: [],
    searchQuery: '',
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    isLoading: false,
    error: null
  }),
  mutations: {
    setSymbols (state, symbols) { state.symbols = symbols },
    setTickers (state, tickers) { state.tickers = tickers },
    mergeTickers (state, tickers) { state.tickers = { ...state.tickers, ...tickers } },
    setWatchlist (state, watchlist) { state.watchlist = watchlist },
    // Resetting the page here rather than in the view means no caller can narrow the
    // result set and leave the user stranded on a page that no longer exists.
    setSearchQuery (state, query) {
      state.searchQuery = query
      state.page = 1
    },
    setPage (state, page) { state.page = page },
    setPageSize (state, pageSize) {
      state.pageSize = pageSize
      state.page = 1
    },
    setLoading (state, value) { state.isLoading = value },
    setError (state, error) { state.error = error }
  },
  getters: {
    tradableSymbols: state => state.symbols.filter(symbol => symbol.status === 'TRADING' && symbol.isSpotTradingAllowed),
    usdtSymbols: (state, getters) => getters.tradableSymbols.filter(symbol => symbol.quoteAsset === DEFAULT_QUOTE_ASSET),
    filteredSymbols: (state, getters) => {
      const query = state.searchQuery.trim().toUpperCase()
      return query ? getters.usdtSymbols.filter(symbol => symbol.symbol.includes(query)) : getters.usdtSymbols
    },
    totalPages: (state, getters) => Math.max(1, Math.ceil(getters.filteredSymbols.length / state.pageSize)),
    // Clamped so a stale page number can never render an empty table.
    currentPage: (state, getters) => Math.min(Math.max(1, state.page), getters.totalPages),
    paginatedSymbols: (state, getters) => {
      const startIndex = (getters.currentPage - 1) * state.pageSize
      return getters.filteredSymbols.slice(startIndex, startIndex + state.pageSize)
    },
    watchlistSymbols: state => state.watchlist
      .map(symbolName => state.symbols.find(symbol => symbol.symbol === symbolName))
      .filter(Boolean)
  },
  actions: {
    async initialize ({ commit }) {
      commit('setLoading', true)
      commit('setError', null)

      try {
        const [exchangeInfo, tickers] = await Promise.all([getExchangeInfo(), get24HourTickers()])
        const tickerMap = tickers.reduce((result, ticker) => {
          result[ticker.symbol] = normalizeTicker(ticker)
          return result
        }, {})

        commit('setSymbols', exchangeInfo.symbols.map(normalizeSymbol))
        commit('setTickers', tickerMap)
        commit('setWatchlist', loadWatchlist())
      } catch (error) {
        commit('setError', error.message)
      } finally {
        commit('setLoading', false)
      }
    },
    updateTickers ({ commit }, tickers) {
      const tickerMap = tickers.reduce((result, ticker) => {
        result[ticker.symbol] = normalizeTicker(ticker)
        return result
      }, {})
      commit('mergeTickers', tickerMap)
    },
    toggleWatchlist ({ state, commit }, symbol) {
      const isWatched = state.watchlist.includes(symbol)
      const watchlist = isWatched
        ? state.watchlist.filter(watchedSymbol => watchedSymbol !== symbol)
        : [...state.watchlist, symbol]
      commit('setWatchlist', saveWatchlist(watchlist))
    }
  }
}
