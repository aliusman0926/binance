const DEFAULT_URL = 'wss://stream.binance.com:9443/stream'

/**
 * A shared, combined-stream connection. Consumers subscribe by stream name and
 * receive a cleanup function, so view lifecycles cannot leave stale listeners.
 */
export class BinanceWebSocket {
  constructor ({ url = process.env.VUE_APP_BINANCE_WS_URL || DEFAULT_URL, reconnectDelay = 1000, maxReconnectDelay = 30000 } = {}) {
    this.url = url
    this.reconnectDelay = reconnectDelay
    this.maxReconnectDelay = maxReconnectDelay
    this.socket = null
    this.subscriptions = new Map()
    this.statusListeners = new Set()
    this.reconnectTimer = null
    this.reconnectAttempts = 0
    this.requestId = 0
    this.isManuallyClosed = false
  }

  subscribe (stream, handler) {
    const streamName = stream.toLowerCase()
    const isNewStream = !this.subscriptions.has(streamName)
    const handlers = this.subscriptions.get(streamName) || new Set()
    handlers.add(handler)
    this.subscriptions.set(streamName, handlers)

    if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
      this.connect()
    } else if (isNewStream && this.socket.readyState === WebSocket.OPEN) {
      this.sendSubscriptionRequest('SUBSCRIBE', [streamName])
    }

    return () => this.unsubscribe(streamName, handler)
  }

  onStatus (listener) {
    this.statusListeners.add(listener)
    listener(this.getStatus())
    return () => this.statusListeners.delete(listener)
  }

  connect () {
    if (this.socket || this.subscriptions.size === 0) return

    this.isManuallyClosed = false
    this.emitStatus('connecting')
    const socket = new WebSocket(this.url)
    this.socket = socket
    socket.onopen = () => {
      if (this.socket !== socket) return
      this.reconnectAttempts = 0
      this.emitStatus('connected')
      this.sendSubscriptionRequest('SUBSCRIBE', [...this.subscriptions.keys()])
    }
    socket.onmessage = event => this.handleMessage(event)
    socket.onerror = () => this.emitStatus('error')
    socket.onclose = () => {
      if (this.socket !== socket) return
      this.socket = null
      if (!this.isManuallyClosed && this.subscriptions.size > 0) this.scheduleReconnect()
      else this.emitStatus('disconnected')
    }
  }

  disconnect () {
    this.isManuallyClosed = true
    window.clearTimeout(this.reconnectTimer)
    this.reconnectTimer = null
    const socket = this.socket
    this.socket = null
    if (socket) socket.close()
    this.emitStatus('disconnected')
  }

  unsubscribe (stream, handler) {
    const handlers = this.subscriptions.get(stream)
    if (!handlers) return

    handlers.delete(handler)
    if (handlers.size > 0) return

    this.subscriptions.delete(stream)
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.sendSubscriptionRequest('UNSUBSCRIBE', [stream])
    }
    if (this.subscriptions.size === 0) this.disconnect()
  }

  sendSubscriptionRequest (method, params) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || params.length === 0) return
    this.socket.send(JSON.stringify({ method, params, id: ++this.requestId }))
  }

  handleMessage (event) {
    let payload
    try {
      payload = JSON.parse(event.data)
    } catch (error) {
      return
    }

    if (!payload.stream || !Object.prototype.hasOwnProperty.call(payload, 'data')) return
    const handlers = this.subscriptions.get(payload.stream.toLowerCase())
    if (handlers) handlers.forEach(handler => handler(payload.data))
  }

  scheduleReconnect () {
    const delay = Math.min(this.reconnectDelay * (2 ** this.reconnectAttempts), this.maxReconnectDelay)
    this.reconnectAttempts += 1
    this.emitStatus('reconnecting')
    this.reconnectTimer = window.setTimeout(() => this.connect(), delay)
  }

  emitStatus (status) {
    this.statusListeners.forEach(listener => listener(status))
  }

  getStatus () {
    if (!this.socket) return 'disconnected'
    return this.socket.readyState === WebSocket.OPEN ? 'connected' : 'connecting'
  }
}

export const binanceWebSocket = new BinanceWebSocket()
