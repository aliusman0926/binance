<template>
  <base-panel title="Market prices" flush>
    <base-state v-if="isLoading" type="loading" message="Loading market data…" />
    <base-state v-else-if="error" type="error" :message="error"><template #actions><button class="button-text" type="button" @click="$emit('retry')">Try again</button></template></base-state>
    <base-state v-else-if="markets.length === 0" message="No markets match your search." />
    <div v-else class="market-table__scroll">
      <table class="market-table">
        <thead><tr><th>Pair</th><th>Last price</th><th>24h change</th><th>24h high</th><th>24h low</th><th>24h volume</th><th><span class="sr-only">Watchlist</span></th></tr></thead>
        <tbody>
          <tr v-for="market in markets" :key="market.symbol" tabindex="0" @click="$emit('select', market.symbol)" @keyup.enter="$emit('select', market.symbol)">
            <td><strong>{{ market.baseAsset }}</strong><small>/{{ market.quoteAsset }}</small></td>
            <td class="font-mono">{{ formatPrice(market.ticker && market.ticker.lastPrice) }}</td>
            <td :class="changeClass(market.ticker)" class="font-mono">{{ formatPercent(market.ticker && market.ticker.priceChangePercent) }}</td>
            <td class="font-mono">{{ formatPrice(market.ticker && market.ticker.highPrice) }}</td>
            <td class="font-mono">{{ formatPrice(market.ticker && market.ticker.lowPrice) }}</td>
            <td class="font-mono">{{ formatCompactNumber(market.ticker && market.ticker.quoteVolume) }}</td>
            <td><button class="market-table__watch" type="button" :aria-label="watchLabel(market)" @click.stop="$emit('toggle', market.symbol)"><v-icon small>{{ market.isWatched ? 'star' : 'star_border' }}</v-icon></button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </base-panel>
</template>

<script>
import { BasePanel, BaseState } from '@/components/base'
import { formatCompactNumber, formatPercent, formatPrice } from '@/utils/formatters'

export default {
  name: 'MarketTable',
  components: { BasePanel, BaseState },
  props: {
    markets: { type: Array, default: () => [] },
    isLoading: { type: Boolean, default: false },
    error: { type: String, default: null }
  },
  methods: {
    formatCompactNumber,
    formatPercent,
    formatPrice,
    changeClass (ticker) {
      if (!ticker) return 'text-muted'
      return ticker.priceChangePercent >= 0 ? 'text-positive' : 'text-negative'
    },
    watchLabel (market) {
      return `${market.isWatched ? 'Remove' : 'Add'} ${market.symbol} ${market.isWatched ? 'from' : 'to'} watchlist`
    }
  }
}
</script>

<style lang="scss" scoped>
.market-table__scroll { overflow-x: auto; }
.market-table { border-collapse: collapse; min-width: 760px; width: 100%; }
.market-table th { background: $color-surface-raised; color: $color-text-muted; font-size: $font-size-xs; font-weight: $font-weight-medium; padding: $space-3 $space-4; text-align: right; white-space: nowrap; }
.market-table th:first-child, .market-table td:first-child { text-align: left; }
.market-table td { border-top: 1px solid $color-border; font-size: $font-size-sm; padding: $space-3 $space-4; text-align: right; white-space: nowrap; }
.market-table tbody tr { cursor: pointer; transition: background-color $transition-fast; }
.market-table tbody tr:hover, .market-table tbody tr:focus { background: $color-surface-hover; outline: 0; }
.market-table td small { color: $color-text-muted; font-size: $font-size-xs; }
.market-table__watch { color: $color-brand; padding: $space-1; }
</style>
