export function normalizeStreamTicker (ticker) {
  return {
    symbol: ticker.s,
    lastPrice: Number(ticker.c),
    priceChange: Number(ticker.p),
    priceChangePercent: Number(ticker.P),
    highPrice: Number(ticker.h),
    lowPrice: Number(ticker.l),
    volume: Number(ticker.v),
    quoteVolume: Number(ticker.q),
    openTime: ticker.O,
    closeTime: ticker.C
  }
}

export function normalizeStreamKline (event) {
  const kline = event.k
  return {
    time: Math.floor(kline.t / 1000),
    openTime: kline.t,
    closeTime: kline.T,
    open: Number(kline.o),
    high: Number(kline.h),
    low: Number(kline.l),
    close: Number(kline.c),
    volume: Number(kline.v),
    isClosed: kline.x
  }
}

export function normalizeStreamDepth (event) {
  return {
    firstUpdateId: event.U,
    finalUpdateId: event.u,
    bids: event.b.map(([price, quantity]) => ({ price: Number(price), quantity: Number(quantity) })),
    asks: event.a.map(([price, quantity]) => ({ price: Number(price), quantity: Number(quantity) }))
  }
}

export function normalizeStreamTrade (event) {
  return {
    id: event.t,
    price: Number(event.p),
    quantity: Number(event.q),
    time: event.T,
    isBuyerMaker: event.m
  }
}
