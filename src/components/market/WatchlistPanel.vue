<template>
  <base-panel title="Watchlist" flush>
    <template #header>
      <div class="watchlist-panel__header">
        <h2 class="watchlist-panel__title">Watchlist</h2>
        <span>{{ items.length }}</span>
      </div>
    </template>
    <base-state v-if="isLoading" type="loading" message="Loading watchlist…" />
    <base-state v-else-if="items.length === 0" message="Add a market from the list to follow it here." />
    <ul v-else class="watchlist-panel__list">
      <li v-for="item in items" :key="item.symbol" class="watchlist-panel__item">
        <button class="watchlist-panel__market" type="button" @click="$emit('select', item.symbol)">
          <span>{{ item.baseAsset }}<small>/{{ item.quoteAsset }}</small></span>
          <span :class="changeClass(item.ticker)" class="font-mono">{{ formatPrice(item.ticker && item.ticker.lastPrice) }}</span>
        </button>
        <button class="watchlist-panel__remove" type="button" :aria-label="`Remove ${item.symbol} from watchlist`" @click="$emit('toggle', item.symbol)">
          <v-icon small>star</v-icon>
        </button>
      </li>
    </ul>
  </base-panel>
</template>

<script>
import { BasePanel, BaseState } from '@/components/base'
import { formatPrice } from '@/utils/formatters'

export default {
  name: 'WatchlistPanel',
  components: { BasePanel, BaseState },
  props: {
    items: { type: Array, default: () => [] },
    isLoading: { type: Boolean, default: false }
  },
  methods: {
    formatPrice,
    changeClass (ticker) {
      if (!ticker) return 'text-muted'
      return ticker.priceChangePercent >= 0 ? 'text-positive' : 'text-negative'
    }
  }
}
</script>

<style lang="scss" scoped>
.watchlist-panel__header { align-items: center; display: flex; justify-content: space-between; width: 100%; }
.watchlist-panel__title { font-size: $font-size-sm; font-weight: $font-weight-semibold; margin: 0; }
.watchlist-panel__header span { color: $color-text-muted; font-size: $font-size-xs; }
.watchlist-panel__list { list-style: none; margin: 0; padding: 0; }
.watchlist-panel__item { align-items: center; border-bottom: 1px solid $color-border; display: flex; min-height: 48px; padding-left: $space-4; }
.watchlist-panel__item:last-child { border-bottom: 0; }
.watchlist-panel__market { align-items: center; display: flex; flex: 1; justify-content: space-between; min-width: 0; padding: $space-3 0; text-align: left; }
.watchlist-panel__market:hover span:first-child { color: $color-brand; }
.watchlist-panel__market small { color: $color-text-muted; font-size: $font-size-xs; }
.watchlist-panel__market span:last-child { font-size: $font-size-xs; }
.watchlist-panel__remove { color: $color-brand; padding: $space-3 $space-4 $space-3 $space-3; }
</style>
