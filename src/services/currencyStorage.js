import { DEFAULT_CURRENCY } from '@/utils/constants'

const RATES_KEY = 'binance-market-terminal:exchange-rates'
const CURRENCY_KEY = 'binance-market-terminal:currency'

/**
 * Rates refresh roughly once a day, so the cached copy is reused until the timestamp the
 * provider itself supplies. Returns null when absent, unparseable or stale.
 */
export function loadCachedRates () {
  try {
    const savedValue = window.localStorage.getItem(RATES_KEY)
    if (!savedValue) return null

    const parsedValue = JSON.parse(savedValue)
    const isUsable = parsedValue && parsedValue.rates && parsedValue.expiresAt > Date.now()

    return isUsable ? parsedValue : null
  } catch (error) {
    return null
  }
}

export function saveCachedRates (payload) {
  try {
    window.localStorage.setItem(RATES_KEY, JSON.stringify(payload))
  } catch (error) {
    // Local storage may be unavailable in private or restricted browser contexts.
  }
  return payload
}

export function loadSelectedCurrency () {
  try {
    return window.localStorage.getItem(CURRENCY_KEY) || DEFAULT_CURRENCY
  } catch (error) {
    return DEFAULT_CURRENCY
  }
}

export function saveSelectedCurrency (currencyCode) {
  try {
    window.localStorage.setItem(CURRENCY_KEY, currencyCode)
  } catch (error) {
    // Local storage may be unavailable in private or restricted browser contexts.
  }
  return currencyCode
}
