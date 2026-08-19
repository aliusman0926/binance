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
    hasRate: state => {
      const value = Number(state.rates[state.selectedCurrency])
      return Number.isFinite(value) && value > 0
    },
    /**
     * The code prices are actually displayed in. Falls back to USD whenever the selected
     * currency has no rate — a failed fetch, or a persisted selection restored before the
     * rates arrive — so the label can never disagree with the arithmetic below.
     */
    effectiveCurrency: (state, getters) => (getters.hasRate ? state.selectedCurrency : DEFAULT_CURRENCY),
    rate: (state, getters) => Number(state.rates[getters.effectiveCurrency]) || 1,
    /**
     * USD -> effective currency. Values originate as USDT, which the app treats as USD;
     * see CURRENCY_OPTIONS. Non-numeric input passes through so formatters can show a dash.
     */
    convert: (state, getters) => usdValue => {
      const numericValue = Number(usdValue)
      return Number.isFinite(numericValue) ? numericValue * getters.rate : usdValue
    },
    isConverted: (state, getters) => getters.effectiveCurrency !== DEFAULT_CURRENCY,
    /** True only while the user's pick is being ignored for want of a rate. */
    isRateMissing: (state, getters) => state.selectedCurrency !== DEFAULT_CURRENCY && !getters.hasRate
  },
  actions: {
    /** `force` skips the cache so the retry affordance can actually re-hit the provider. */
    async loadRates ({ commit }, { force = false } = {}) {
      commit('setSelectedCurrency', loadSelectedCurrency())

      const cachedRates = force ? null : loadCachedRates()
      if (cachedRates) {
        commit('setRates', cachedRates)
        commit('setError', null)
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
