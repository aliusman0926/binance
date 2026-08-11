import { getUsdRates } from '@/api/exchangeRates'
import {
  loadCachedRates,
  loadSelectedCurrency,
  saveCachedRates,
  saveSelectedCurrency
} from '@/services/currencyStorage'
import { DEFAULT_CURRENCY } from '@/utils/constants'

export default {
  namespaced: true,
  state: () => ({
    selectedCurrency: DEFAULT_CURRENCY,
    rates: { [DEFAULT_CURRENCY]: 1 },
    updatedAt: null,
    isLoading: false,
    error: null
  }),
  mutations: {
    setSelectedCurrency (state, currencyCode) { state.selectedCurrency = currencyCode },
    setRates (state, { rates, updatedAt }) {
      state.rates = rates
      state.updatedAt = updatedAt
    },
    setLoading (state, value) { state.isLoading = value },
    setError (state, error) { state.error = error }
  },
  getters: {
    rate: state => state.rates[state.selectedCurrency] || 1,
    /**
     * USD -> selected currency. Values originate as USDT, which the app treats as USD;
     * see CURRENCY_OPTIONS. Non-numeric input passes through so formatters can show a dash.
     */
    convert: (state, getters) => usdValue => {
      const numericValue = Number(usdValue)
      return Number.isFinite(numericValue) ? numericValue * getters.rate : usdValue
    },
    isConverted: state => state.selectedCurrency !== DEFAULT_CURRENCY
  },
  actions: {
    async loadRates ({ commit }) {
      commit('setSelectedCurrency', loadSelectedCurrency())

      const cachedRates = loadCachedRates()
      if (cachedRates) {
        commit('setRates', cachedRates)
        return
      }

      commit('setLoading', true)
      commit('setError', null)

      try {
        const payload = await getUsdRates()
        commit('setRates', saveCachedRates(payload))
      } catch (error) {
        // A rate failure must not break price display; the app stays in USD.
        commit('setError', error.message)
      } finally {
        commit('setLoading', false)
      }
    },
    selectCurrency ({ commit }, currencyCode) {
      commit('setSelectedCurrency', saveSelectedCurrency(currencyCode))
    }
  }
}
