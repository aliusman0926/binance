<template>
  <base-panel title="Recent trades" flush>
    <base-state v-if="isLoading" type="loading" message="Loading recent trades…" />
    <base-state v-else-if="error" type="error" :message="error" />
    <base-state v-else-if="trades.length === 0" message="No trades available." />
    <div v-else class="recent-trades">
      <div class="recent-trades__head"><span>Price</span><span>Quantity</span><span>Time</span></div>
      <div v-for="trade in trades" :key="trade.id" class="recent-trades__row"><span class="font-mono" :class="trade.isBuyerMaker ? 'text-negative' : 'text-positive'">{{ formatPrice(trade.price) }}</span><span class="font-mono">{{ formatNumber(trade.quantity) }}</span><time class="font-mono">{{ formatTime(trade.time) }}</time></div>
    </div>
  </base-panel>
</template>

<script>
import { BasePanel, BaseState } from '@/components/base'
import { formatNumber, formatPrice, formatTime } from '@/utils/formatters'

export default {
  name: 'RecentTrades',
  components: { BasePanel, BaseState },
  props: {
    trades: { type: Array, default: () => [] },
    isLoading: { type: Boolean, default: false },
    error: { type: String, default: null }
  },
  methods: { formatNumber, formatPrice, formatTime }
}
</script>

<style lang="scss" scoped>
.recent-trades { max-height: 280px; overflow-y: auto; }
.recent-trades__head, .recent-trades__row { display: grid; grid-template-columns: 1fr 1fr 1fr; padding: $space-2 $space-4; }
.recent-trades__head { background: $color-surface-raised; color: $color-text-muted; font-size: $font-size-xs; position: sticky; top: 0; }
.recent-trades__row { border-top: 1px solid $color-border; font-size: $font-size-xs; }
.recent-trades__head span:nth-child(n+2), .recent-trades__row span:nth-child(n+2), .recent-trades__row time { text-align: right; }
</style>
