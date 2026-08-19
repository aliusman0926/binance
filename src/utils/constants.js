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

/*
 * Order-book resynchronization. Diff-depth frames arrive 10x/s and every one of them
 * reports an unsynchronized book, so resyncs are timer-driven rather than frame-driven.
 * /api/v3/depth?limit=100 costs request weight 5 against a 6000/min per-IP budget, so a
 * retry loop with no delay and no ceiling exhausts the budget in about a minute and earns
 * a 429, then a 418 IP ban. The ceiling is what stops the loop re-arming for good.
 *
 * The delay is not only rate-limit protection: the usual failure is a REST snapshot that
 * lags the buffered stream, which heals only once the snapshot's lastUpdateId advances
 * past the buffer — that takes wall-clock time, so an immediate retry cannot fix it.
 */
export const DEPTH_RESYNC_MAX_ATTEMPTS = 6
export const DEPTH_RESYNC_BASE_DELAY_MS = 1000
export const DEPTH_RESYNC_MAX_DELAY_MS = 30000
export const DEPTH_RESYNC_JITTER_MS = 250

export const CHART_THEME = {
  background: '#14151a',
  text: '#848e9c',
  grid: '#2b3139',
  up: '#0ecb81',
  down: '#f6465d'
}
