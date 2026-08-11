<template>
  <base-panel flush>
    <div class="symbol-header">
      <div class="symbol-header__identity">
        <h1>{{ baseAsset }}<span>/{{ quoteAsset }}</span></h1>
        <p>{{ symbol }}</p>
      </div>
      <div class="symbol-header__price">
        <strong class="font-mono" :class="changeClass">{{ formatPrice(ticker && ticker.lastPrice) }}</strong>
        <span :class="changeClass" class="font-mono">{{ formatPercent(ticker && ticker.priceChangePercent) }}</span>
      </div>
      <dl class="symbol-header__stats">
        <div><dt>24h high</dt><dd class="font-mono">{{ formatPrice(ticker && ticker.highPrice) }}</dd></div>
        <div><dt>24h low</dt><dd class="font-mono">{{ formatPrice(ticker && ticker.lowPrice) }}</dd></div>
        <div><dt>24h volume</dt><dd class="font-mono">{{ formatCompactNumber(ticker && ticker.quoteVolume) }}</dd></div>
      </dl>
    </div>
  </base-panel>
</template>

<script>
import { BasePanel } from '@/components/base'
import { formatCompactNumber, formatPercent, formatPrice } from '@/utils/formatters'

export default {
  name: 'SymbolHeader',
  components: { BasePanel },
  props: {
    symbol: { type: String, required: true },
    market: { type: Object, default: null },
    ticker: { type: Object, default: null }
  },
  computed: {
    baseAsset () { return this.market ? this.market.baseAsset : this.symbol },
    quoteAsset () { return this.market ? this.market.quoteAsset : '' },
    changeClass () {
      if (!this.ticker) return 'text-muted'
      return this.ticker.priceChangePercent >= 0 ? 'text-positive' : 'text-negative'
    }
  },
  methods: { formatCompactNumber, formatPercent, formatPrice }
}
</script>

<style lang="scss" scoped>
.symbol-header { align-items: center; display: flex; gap: $space-6; min-height: 88px; padding: $space-4; }
.symbol-header__identity { min-width: 130px; }
.symbol-header__identity h1 { font-size: $font-size-lg; margin: 0; }
.symbol-header__identity h1 span, .symbol-header__identity p { color: $color-text-muted; font-size: $font-size-sm; font-weight: $font-weight-regular; }
.symbol-header__identity p { font-family: $font-family-mono; font-size: $font-size-xs; margin: $space-1 0 0; }
.symbol-header__price { display: flex; flex-direction: column; gap: $space-1; min-width: 100px; }
.symbol-header__price strong { font-size: $font-size-lg; }
.symbol-header__price span { font-size: $font-size-xs; }
.symbol-header__stats { display: flex; gap: $space-6; margin: 0 0 0 auto; }
.symbol-header__stats div { min-width: 90px; }
.symbol-header__stats dt { color: $color-text-muted; font-size: $font-size-xs; }
.symbol-header__stats dd { color: $color-text-secondary; font-size: $font-size-sm; margin: $space-1 0 0; }
@media (max-width: $breakpoint-md) { .symbol-header { align-items: flex-start; flex-wrap: wrap; } .symbol-header__stats { margin-left: 0; width: 100%; } }
</style>
