<template>
  <base-panel title="Order book" flush>
    <base-state v-if="isLoading" type="loading" message="Synchronizing order book…" />
    <base-state v-else-if="error" type="error" :message="error" />
    <div v-else class="order-book">
      <div class="order-book__columns"><span>Price</span><span>Quantity</span></div>
      <div class="order-book__levels order-book__levels--asks"><div v-for="level in reversedAsks" :key="`ask-${level.price}`" class="order-book__level order-book__level--ask" :style="depthStyle(level.quantity, asks)"><span class="font-mono">{{ formatPrice(level.price) }}</span><span class="font-mono">{{ formatNumber(level.quantity) }}</span></div></div>
      <div class="order-book__spread"><span>Spread</span><strong class="font-mono">{{ spread }}</strong></div>
      <div class="order-book__levels"><div v-for="level in bids" :key="`bid-${level.price}`" class="order-book__level order-book__level--bid" :style="depthStyle(level.quantity, bids)"><span class="font-mono">{{ formatPrice(level.price) }}</span><span class="font-mono">{{ formatNumber(level.quantity) }}</span></div></div>
    </div>
  </base-panel>
</template>

<script>
import { BasePanel, BaseState } from '@/components/base'
import { formatNumber, formatPrice } from '@/utils/formatters'

export default {
  name: 'OrderBook',
  components: { BasePanel, BaseState },
  props: {
    asks: { type: Array, default: () => [] },
    bids: { type: Array, default: () => [] },
    isLoading: { type: Boolean, default: false },
    error: { type: String, default: null }
  },
  computed: {
    reversedAsks () { return [...this.asks].reverse() },
    spread () {
      if (!this.asks.length || !this.bids.length) return '—'
      return formatPrice(this.asks[0].price - this.bids[0].price)
    }
  },
  methods: {
    formatNumber,
    formatPrice,
    depthStyle (quantity, levels) {
      const maxQuantity = Math.max(...levels.map(level => level.quantity), 1)
      return { '--depth-size': `${(quantity / maxQuantity) * 100}%` }
    }
  }
}
</script>

<style lang="scss" scoped>
.order-book { font-size: $font-size-xs; min-height: 440px; padding: $space-3 0; }
.order-book__columns, .order-book__level { display: grid; grid-template-columns: 1fr 1fr; padding: $space-1 $space-4; position: relative; }
.order-book__columns { color: $color-text-muted; }
.order-book__columns span:last-child, .order-book__level span:last-child { text-align: right; }
.order-book__level::before { bottom: 0; content: ''; position: absolute; right: 0; top: 0; width: var(--depth-size); z-index: 0; }
.order-book__level span { position: relative; z-index: 1; }
.order-book__level--ask { color: $color-negative; }
.order-book__level--ask::before { background: rgba($color-negative, 0.12); }
.order-book__level--bid { color: $color-positive; }
.order-book__level--bid::before { background: rgba($color-positive, 0.12); }
.order-book__spread { align-items: center; border-bottom: 1px solid $color-border; border-top: 1px solid $color-border; color: $color-text-muted; display: flex; justify-content: space-between; margin: $space-2 0; padding: $space-2 $space-4; }
.order-book__spread strong { color: $color-text-primary; }
</style>
