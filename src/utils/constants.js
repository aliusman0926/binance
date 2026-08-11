export const DEFAULT_SYMBOL = 'BTCUSDT'
export const DEFAULT_QUOTE_ASSET = 'USDT'
export const DEFAULT_WATCHLIST = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT']

export const DEFAULT_PAGE_SIZE = 25
export const PAGE_SIZE_OPTIONS = [25, 50, 100]

// Values double as Binance kline interval codes for both the REST call and the
// websocket stream name (e.g. btcusdt@kline_15m).
export const KLINE_INTERVALS = ['1m', '3m', '5m', '15m']
export const DEFAULT_KLINE_INTERVAL = '1m'

// Live price/volume strip. Trades are bucketed by the second and capped, giving a
// rolling two-minute window; redraws are throttled well below the trade arrival rate.
export const PRICE_VOLUME_BUCKET_MS = 1000
export const PRICE_VOLUME_MAX_POINTS = 120
export const PRICE_VOLUME_REDRAW_MS = 1000

/*
 * Display currencies. Every Binance pair here is quoted in USDT and there is no true USD
 * spot pair, so the app treats 1 USDT as 1 USD and converts outward from there.
 */
export const DEFAULT_CURRENCY = 'USD'
export const CURRENCY_OPTIONS = [
  { code: 'USD', label: 'US Dollar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'GBP', label: 'British Pound' },
  { code: 'PKR', label: 'Pakistani Rupee' },
  { code: 'INR', label: 'Indian Rupee' },
  { code: 'AED', label: 'UAE Dirham' },
  { code: 'JPY', label: 'Japanese Yen' },
  { code: 'TRY', label: 'Turkish Lira' },
  { code: 'CAD', label: 'Canadian Dollar' },
  { code: 'AUD', label: 'Australian Dollar' }
]

// Head-to-head comparison. A fixed 24-hour window at 15m granularity keeps the trend
// chart aligned with the 24h figures in the stat table. Colours are $color-brand and
// $color-info from the design tokens.
export const COMPARISON_INTERVAL = '15m'
export const COMPARISON_LIMIT = 96
export const COMPARISON_COLORS = ['#e3b409', '#3b82f6']
export const COMPARISON_DEFAULT_SYMBOLS = ['BTCUSDT', 'ETHUSDT']

export const CHART_THEME = {
  background: '#14151a',
  text: '#848e9c',
  grid: '#2b3139',
  up: '#0ecb81',
  down: '#f6465d'
}
