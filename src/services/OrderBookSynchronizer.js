/**
 * Reconciles Binance diff-depth events with a REST snapshot. Events are buffered
 * until a snapshot is applied, and a sequence gap explicitly reports desync.
 */
export default class OrderBookSynchronizer {
  constructor (depthLimit = 20, maxBufferedEvents = 600) {
    this.depthLimit = depthLimit
    this.maxBufferedEvents = maxBufferedEvents
    this.bids = new Map()
    this.asks = new Map()
    this.lastUpdateId = null
    this.buffer = []
    this.isSynchronized = false
  }

  bufferUpdate (event) {
    if (!this.isSynchronized) {
      this.buffer.push(event)
      /*
       * Backstop for a desync that outlives the consumer's retry ceiling: frames keep
       * arriving 10x/s for as long as the stream is subscribed. Dropping the oldest events
       * can only make the next applySnapshot report a gap — which is the truth — and can
       * never merge a stale event into a live book.
       */
      if (this.buffer.length > this.maxBufferedEvents) {
        this.buffer = this.buffer.slice(-this.maxBufferedEvents)
      }
      return true
    }
    return this.applyUpdate(event)
  }

  applySnapshot (snapshot) {
    this.bids = this.toLevelMap(snapshot.bids)
    this.asks = this.toLevelMap(snapshot.asks)
    this.lastUpdateId = snapshot.lastUpdateId

    /*
     * Events at or below the snapshot are already reflected in it and can never be needed
     * again. Narrowing the buffer here rather than only on the success path below is what
     * keeps a long desync from growing it without bound across repeated attempts.
     */
    const pendingEvents = this.buffer.filter(event => event.finalUpdateId > this.lastUpdateId)
    this.buffer = pendingEvents

    const initialEvent = pendingEvents[0]
    if (initialEvent && initialEvent.firstUpdateId > this.lastUpdateId + 1) {
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
