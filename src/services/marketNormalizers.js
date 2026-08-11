export function normalizeSymbol (symbol) {
  return {
    symbol: symbol.symbol,
    baseAsset: symbol.baseAsset,
    quoteAsset: symbol.quoteAsset,
    status: symbol.status,
    isSpotTradingAllowed: symbol.isSpotTradingAllowed,
    pricePrecision: symbol.quotePrecision,
    quantityPrecision: symbol.baseAssetPrecision
  }
}

export function normalizeTicker (ticker) {
  return {
    symbol: ticker.symbol,
    lastPrice: Number(ticker.lastPrice),
    priceChange: Number(ticker.priceChange),
    priceChangePercent: Number(ticker.priceChangePercent),
    highPrice: Number(ticker.highPrice),
    lowPrice: Number(ticker.lowPrice),
    volume: Number(ticker.volume),
    quoteVolume: Number(ticker.quoteVolume),
    openTime: ticker.openTime,
    closeTime: ticker.closeTime
  }
}

export function normalizeKline (kline) {
  return {
    time: Math.floor(kline[0] / 1000),
    openTime: kline[0],
    closeTime: kline[6],
    open: Number(kline[1]),
    high: Number(kline[2]),
    low: Number(kline[3]),
    close: Number(kline[4]),
    volume: Number(kline[5]),
    isClosed: true
  }
}

export function normalizeDepthSnapshot (snapshot) {
  return {
    lastUpdateId: snapshot.lastUpdateId,
    bids: snapshot.bids.map(([price, quantity]) => ({ price: Number(price), quantity: Number(quantity) })),
    asks: snapshot.asks.map(([price, quantity]) => ({ price: Number(price), quantity: Number(quantity) }))
  }
}

export function normalizeTrade (trade) {
  return {
    id: trade.id,
    price: Number(trade.price),
    quantity: Number(trade.qty),
    time: trade.time,
    isBuyerMaker: trade.isBuyerMaker
  }
}
