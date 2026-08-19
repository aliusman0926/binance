import axios from 'axios'

/*
 * Binance answers an exceeded request-weight budget with HTTP 429, and escalates a
 * repeatedly-ignored 429 to HTTP 418 — an IP ban lasting from two minutes to three days,
 * increasing each time. The budget is per-IP and shared by every view in the app, so the
 * cooldown below is deliberately global: once we are told to back off, nothing calls
 * Binance again until it expires.
 */
const RATE_LIMIT_STATUSES = [429, 418]

/*
 * Retry-After is only readable from the browser when the server lists it in
 * Access-Control-Expose-Headers, which Binance does not guarantee. These defaults are
 * therefore the protection that actually runs most of the time; the header, when present,
 * only ever overrides them upward.
 */
const DEFAULT_COOLDOWN_MS = { 429: 60000, 418: 600000 }

const client = axios.create({
  baseURL: 'https://api.binance.com',
  timeout: 10000
})

let rateLimitedUntil = 0

/** Remaining global cooldown in ms, or 0 when Binance calls are allowed. */
export function getRateLimitCooldownMs () {
  return Math.max(0, rateLimitedUntil - Date.now())
}

function readCooldownMs (response) {
  const headers = response.headers || {}
  const retryAfter = Number(headers['retry-after'] || headers['Retry-After'])
  const fallbackMs = DEFAULT_COOLDOWN_MS[response.status] || DEFAULT_COOLDOWN_MS[429]

  return Number.isFinite(retryAfter) && retryAfter > 0
    ? Math.max(retryAfter * 1000, fallbackMs)
    : fallbackMs
}

function cooldownRejection (cooldownMs) {
  return {
    code: null,
    status: 429,
    isRateLimited: true,
    retryAfterMs: cooldownMs,
    message: `Binance rate limit reached. Pausing requests for ${Math.ceil(cooldownMs / 1000)}s.`
  }
}

client.interceptors.request.use(config => {
  const cooldownMs = getRateLimitCooldownMs()
  if (cooldownMs === 0) return config

  return Promise.reject(cooldownRejection(cooldownMs))
})

client.interceptors.response.use(
  response => response.data,
  error => {
    /*
     * Axios routes a rejected request interceptor through the response error handler too,
     * so the synthetic cooldown rejection above arrives here already normalized. Passing
     * it straight through keeps its retryAfterMs intact instead of flattening it into the
     * generic message below.
     */
    if (error && error.isRateLimited) return Promise.reject(error)

    const response = error.response
    const status = response ? response.status : null
    const isRateLimited = RATE_LIMIT_STATUSES.includes(status)

    if (isRateLimited) {
      const cooldownMs = readCooldownMs(response)
      rateLimitedUntil = Math.max(rateLimitedUntil, Date.now() + cooldownMs)
      return Promise.reject(cooldownRejection(cooldownMs))
    }

    const message = response && response.data && response.data.msg
      ? response.data.msg
      : 'Unable to retrieve market data. Please try again.'

    return Promise.reject({
      code: response && response.data && response.data.code ? response.data.code : null,
      message,
      status,
      isRateLimited: false,
      retryAfterMs: null
    })
  }
)

export default client
