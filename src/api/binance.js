import client from './client'

/*
 * Binance offers no server-side pagination. Both /exchangeInfo and /ticker/24hr reject
 * limit/offset with HTTP 400 (-1104 "Not all sent parameters were read"), so the markets
 * list is paginated client-side; see the markets store.
 *
 * The full response is ~17.5 MB. Restricting to spot and dropping the permission sets —
 * which nothing here reads — brings it to ~6.6 MB without losing a single consumed field.
 */
export function getExchangeInfo () {
  return client.get('/api/v3/exchangeInfo', {
    params: { permissions: 'SPOT', showPermissionSets: false }
  })
}

export function get24HourTickers () {
  return client.get('/api/v3/ticker/24hr')
}

export function getKlines (symbol, interval = '1m', limit = 500) {
  return client.get('/api/v3/klines', { params: { symbol, interval, limit } })
}

export function getDepthSnapshot (symbol, limit = 100) {
  return client.get('/api/v3/depth', { params: { symbol, limit } })
}

export function getRecentTrades (symbol, limit = 50) {
  return client.get('/api/v3/trades', { params: { symbol, limit } })
}
