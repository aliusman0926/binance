import { binanceWebSocket } from './BinanceWebSocket'
import { normalizeStreamDepth, normalizeStreamKline, normalizeStreamTicker, normalizeStreamTrade } from './webSocketNormalizers'

export function subscribeMarketTickers (onTickers) {
  return binanceWebSocket.subscribe('!ticker@arr', tickers => {
    onTickers(tickers.map(normalizeStreamTicker))
  })
}

export function subscribeKlines ({ symbol, interval = '1m', onKline }) {
  return binanceWebSocket.subscribe(`${symbol.toLowerCase()}@kline_${interval}`, event => {
    onKline(normalizeStreamKline(event))
  })
}

export function subscribeDepth ({ symbol, onDepth }) {
  return binanceWebSocket.subscribe(`${symbol.toLowerCase()}@depth@100ms`, event => {
    onDepth(normalizeStreamDepth(event))
  })
}

export function subscribeTrades ({ symbol, onTrade }) {
  return binanceWebSocket.subscribe(`${symbol.toLowerCase()}@trade`, event => {
    onTrade(normalizeStreamTrade(event))
  })
}

export function subscribeTerminalStreams ({ symbol, interval = '1m', onKline, onDepth, onTrade }) {
  const streamPrefix = symbol.toLowerCase()
  const cleanups = [
    binanceWebSocket.subscribe(`${streamPrefix}@kline_${interval}`, event => onKline(normalizeStreamKline(event))),
    binanceWebSocket.subscribe(`${streamPrefix}@depth@100ms`, event => onDepth(normalizeStreamDepth(event))),
    binanceWebSocket.subscribe(`${streamPrefix}@trade`, event => onTrade(normalizeStreamTrade(event)))
  ]

  return () => cleanups.forEach(cleanup => cleanup())
}
