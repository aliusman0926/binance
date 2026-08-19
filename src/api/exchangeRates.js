import axios from 'axios'

/*
 * Fiat rates come from open.er-api.com: no API key, CORS-enabled, ~166 currencies
 * including the ones Binance has no spot pair for (PKR, INR, AED…). It is a separate
 * axios instance because api/client.js is pinned to the Binance base URL.
 */
const client = axios.create({
  baseURL: 'https://open.er-api.com/v6',
  timeout: 10000
})

client.interceptors.response.use(
  response => response.data,
  () => Promise.reject({ message: 'Unable to retrieve currency rates. Prices are shown in USD.' })
)

export async function getUsdRates () {
  const payload = await client.get('/latest/USD')

  // The endpoint answers 200 with result: "error" rather than an HTTP error status.
  if (!payload || payload.result !== 'success' || !payload.rates) {
    return Promise.reject({ message: 'Unable to retrieve currency rates. Prices are shown in USD.' })
  }

  return {
    rates: payload.rates,
    updatedAt: payload.time_last_update_unix ? payload.time_last_update_unix * 1000 : Date.now(),
    expiresAt: payload.time_next_update_unix ? payload.time_next_update_unix * 1000 : Date.now() + 3600000
  }
}
