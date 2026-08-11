/**
 * Reconciles Binance diff-depth events with a REST snapshot. Events are buffered
 * until a snapshot is applied, and a sequence gap explicitly reports desync.
 */
export default class OrderBookSynchronizer {
  constructor (depthLimit = 20) {
    this.depthLimit = depthLimit
    this.bids = new Map()
    this.asks = new Map()
    this.lastUpdateId = null
    this.buffer = []
    this.isSynchronized = false
  }

  bufferUpdate (event) {
    if (!this.isSynchronized) {
      this.buffer.push(event)
      return true
    }
    return this.applyUpdate(event)
  }

  applySnapshot (snapshot) {
    this.bids = this.toLevelMap(snapshot.bids)
    this.asks = this.toLevelMap(snapshot.asks)
    this.lastUpdateId = snapshot.lastUpdateId

    const pendingEvents = this.buffer.filter(event => event.finalUpdateId > this.lastUpdateId)
    const initialEvent = pendingEvents[0]
    if (initialEvent && (initialEvent.firstUpdateId > this.lastUpdateId + 1 || initialEvent.finalUpdateId < this.lastUpdateId + 1)) {
      return false
    }

    this.isSynchronized = true
    this.buffer = []
    return pendingEvents.every(event => this.applyUpdate(event))
  }

  applyUpdate (event) {
    if (event.finalUpdateId <= this.lastUpdateId) return true
    if (event.firstUpdateId > this.lastUpdateId + 1) {
      this.isSynchronized = false
      return false
    }

    this.applyLevels(this.bids, event.bids)
    this.applyLevels(this.asks, event.asks)
    this.lastUpdateId = event.finalUpdateId
    return true
  }

  getOrderBook () {
    const toLevels = (levels, direction) => [...levels.entries()]
      .map(([price, quantity]) => ({ price: Number(price), quantity }))
      .sort((left, right) => direction * (left.price - right.price))
      .slice(0, this.depthLimit)

    return {
      lastUpdateId: this.lastUpdateId,
      bids: toLevels(this.bids, -1),
      asks: toLevels(this.asks, 1)
    }
  }

  toLevelMap (levels) {
    const levelMap = new Map()
    this.applyLevels(levelMap, levels)
    return levelMap
  }

  applyLevels (levelMap, levels) {
    levels.forEach(({ price, quantity }) => {
      const key = String(price)
      if (quantity === 0) levelMap.delete(key)
      else levelMap.set(key, quantity)
    })
  }
}
