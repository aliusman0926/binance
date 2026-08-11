<template>
  <span class="connection-indicator" :class="`connection-indicator--${status}`" :title="label">
    <i aria-hidden="true" />
    <span>{{ label }}</span>
  </span>
</template>

<script>
import { binanceWebSocket } from '@/services/BinanceWebSocket'

const STATUS_LABELS = {
  connected: 'Live data',
  connecting: 'Connecting',
  reconnecting: 'Reconnecting',
  disconnected: 'Offline',
  error: 'Connection error'
}

export default {
  name: 'ConnectionIndicator',
  data: () => ({ status: 'disconnected', unsubscribeStatus: null }),
  computed: { label () { return STATUS_LABELS[this.status] } },
  mounted () { this.unsubscribeStatus = binanceWebSocket.onStatus(status => { this.status = status }) },
  beforeDestroy () { if (this.unsubscribeStatus) this.unsubscribeStatus() }
}
</script>

<style lang="scss" scoped>
.connection-indicator { align-items: center; color: $color-text-muted; display: inline-flex; font-size: $font-size-xs; gap: $space-2; }
.connection-indicator i { background: $color-text-muted; border-radius: 50%; height: 6px; width: 6px; }
.connection-indicator--connected i { background: $color-positive; }
.connection-indicator--connecting i, .connection-indicator--reconnecting i { background: $color-brand; }
.connection-indicator--error i { background: $color-negative; }
</style>
