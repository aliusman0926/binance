import { DEFAULT_WATCHLIST } from '@/utils/constants'

const STORAGE_KEY = 'binance-market-terminal:watchlist'

function uniqueSymbols (symbols) {
  return [...new Set(symbols.map(symbol => String(symbol).toUpperCase()).filter(Boolean))]
}

export function loadWatchlist () {
  try {
    const savedValue = window.localStorage.getItem(STORAGE_KEY)
    if (!savedValue) return [...DEFAULT_WATCHLIST]

    const parsedValue = JSON.parse(savedValue)
    return Array.isArray(parsedValue) ? uniqueSymbols(parsedValue) : [...DEFAULT_WATCHLIST]
  } catch (error) {
    return [...DEFAULT_WATCHLIST]
  }
}

export function saveWatchlist (symbols) {
  const normalizedSymbols = uniqueSymbols(symbols)
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedSymbols))
  } catch (error) {
    // Local storage may be unavailable in private or restricted browser contexts.
  }
  return normalizedSymbols
}
