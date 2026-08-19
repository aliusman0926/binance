<template>
  <div>
    <base-section-header
      eyebrow="Head to head"
      title="Compare"
      description="Put two markets side by side on value and trend."
    >
      <template #actions>
        <div class="comparison-view__currency">
          <currency-select :value="selectedCurrency" :is-loading="isCurrencyLoading" @input="selectCurrency" />
          <p v-if="currencyError && isRateMissing && !isCurrencyLoading" class="comparison-view__currency-error" role="status">
            <v-icon small color="error">error_outline</v-icon>
            <span>{{ currencyError }}</span>
            <button class="button-text" type="button" @click="reloadRates">Try again</button>
          </p>
        </div>
      </template>
    </base-section-header>

    <div class="comparison-view">
      <div class="comparison-view__pickers">
        <symbol-select :value="leftSymbol" :symbols="symbols" :accent="colors[0]" label="Market A" @input="selectLeft" />
        <button class="comparison-view__swap" type="button" aria-label="Swap the two markets" @click="swap">
          <v-icon small>swap_horiz</v-icon>
        </button>
        <symbol-select :value="rightSymbol" :symbols="symbols" :accent="colors[1]" label="Market B" @input="selectRight" />
      </div>

      <comparison-stats
        :rows="rows"
        :left-label="leftLabel"
        :right-label="rightLabel"
        :footnote="footnote"
        :is-loading="isMarketsLoading"
      />

      <comparison-trend-chart
        :series="trendSeries"
        :is-loading="isTrendLoading"
        :error="trendError"
        @retry="loadTrend"
      />
    </div>
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import { BaseSectionHeader } from '@/components/base'
import ComparisonStats from '@/components/comparison/ComparisonStats.vue'
import ComparisonTrendChart from '@/components/comparison/ComparisonTrendChart.vue'
import CurrencySelect from '@/components/currency/CurrencySelect.vue'
import SymbolSelect from '@/components/comparison/SymbolSelect.vue'
import { getKlines } from '@/api/binance'
import { normalizeKline } from '@/services/marketNormalizers'
import { subscribeMarketTickers } from '@/services/liveStreams'
import {
  COMPARISON_COLORS,
  COMPARISON_DEFAULT_SYMBOLS,
  COMPARISON_INTERVAL,
  COMPARISON_LIMIT,
  DEFAULT_CURRENCY
} from '@/utils/constants'
import { formatCurrency, formatPercent } from '@/utils/formatters'

/**
 * Rebases a kline series onto its own first close so a $64k pair and a $0.60 pair can be
 * read on one axis. Returns [timestamp, percentChange] pairs.
 */
function toNormalizedTrend (klines) {
  const candles = klines.map(normalizeKline)
  const baseline = candles.length ? candles[0].close : 0
  if (!baseline) return []

  return candles.map(candle => [candle.openTime, (candle.close / baseline - 1) * 100])
}

export default {
  name: 'ComparisonView',
  components: { BaseSectionHeader, ComparisonStats, ComparisonTrendChart, CurrencySelect, SymbolSelect },
  data: () => ({
    colors: COMPARISON_COLORS,
    trendSeries: [],
    trendError: null,
    isTrendLoading: true,
    trendRequest: 0,
    unsubscribeTickers: null
  }),
  computed: {
    ...mapState('markets', { isMarketsLoading: 'isLoading', tickers: 'tickers' }),
    ...mapState('currency', {
      selectedCurrency: 'selectedCurrency',
      isCurrencyLoading: 'isLoading',
      currencyError: 'error'
    }),
    // The code the figures are really in — differs from selectedCurrency when no rate is available.
    effectiveCurrency () { return this.$store.getters['currency/effectiveCurrency'] },
    isRateMissing () { return this.$store.getters['currency/isRateMissing'] },
    symbols () { return this.$store.getters['markets/usdtSymbols'] },
    leftSymbol () { return this.resolveSymbol(this.$route.query.a, COMPARISON_DEFAULT_SYMBOLS[0]) },
    rightSymbol () { return this.resolveSymbol(this.$route.query.b, COMPARISON_DEFAULT_SYMBOLS[1]) },
    // Watched instead of $route.query: an unknown symbol in the URL resolves to the
    // fallback only once the symbol list arrives, and that change must retrigger the fetch.
    symbolPair () { return `${this.leftSymbol}|${this.rightSymbol}` },
    leftMarket () { return this.findMarket(this.leftSymbol) },
    rightMarket () { return this.findMarket(this.rightSymbol) },
    leftLabel () { return this.leftMarket ? `${this.leftMarket.baseAsset}/${this.leftMarket.quoteAsset}` : this.leftSymbol },
    rightLabel () { return this.rightMarket ? `${this.rightMarket.baseAsset}/${this.rightMarket.quoteAsset}` : this.rightSymbol },
    footnote () {
      if (this.isRateMissing) return `Rates unavailable — values shown in ${DEFAULT_CURRENCY}`
      return this.effectiveCurrency === DEFAULT_CURRENCY
        ? 'Values in USD (1 USDT ≈ 1 USD)'
        : `Values converted from ${DEFAULT_CURRENCY} to ${this.effectiveCurrency}`
    },
    rows () {
      const leftTicker = this.tickers[this.leftSymbol] || null
      const rightTicker = this.tickers[this.rightSymbol] || null

      // effectiveCurrency, not selectedCurrency: convert() falls back to a rate of 1 when the
      // selected currency has no rate, so stamping the selected code would label USD figures
      // with a foreign symbol.
      const asCurrency = value => formatCurrency(this.convert(value), this.effectiveCurrency)
      const asCompactCurrency = value => formatCurrency(this.convert(value), this.effectiveCurrency, { compact: true })

      // higherIsBetter is null where "bigger" carries no verdict — a higher price does not
      // make a market better, so those rows are shown without a winner.
      const definitions = [
        { key: 'price', label: 'Last price', read: ticker => ticker.lastPrice, format: asCurrency, higherIsBetter: null },
        { key: 'change', label: '24h change', read: ticker => ticker.priceChangePercent, format: formatPercent, higherIsBetter: true },
        { key: 'high', label: '24h high', read: ticker => ticker.highPrice, format: asCurrency, higherIsBetter: null },
        { key: 'low', label: '24h low', read: ticker => ticker.lowPrice, format: asCurrency, higherIsBetter: null },
        { key: 'range', label: '24h range', read: ticker => (ticker.lowPrice ? ((ticker.highPrice - ticker.lowPrice) / ticker.lowPrice) * 100 : null), format: formatPercent, higherIsBetter: null },
        { key: 'volume', label: '24h volume', read: ticker => ticker.quoteVolume, format: asCompactCurrency, higherIsBetter: true }
      ]

      return definitions.map(definition => {
        const leftValue = leftTicker ? definition.read(leftTicker) : null
        const rightValue = rightTicker ? definition.read(rightTicker) : null

        return {
          key: definition.key,
          label: definition.label,
          leftText: definition.format(leftValue),
          rightText: definition.format(rightValue),
          winner: this.pickWinner(leftValue, rightValue, definition.higherIsBetter)
        }
      })
    }
  },
  watch: {
    symbolPair () { this.loadTrend() }
  },
  async mounted () {
    if (this.symbols.length === 0) await this.initializeMarkets()
    this.loadTrend()
    this.unsubscribeTickers = subscribeMarketTickers(tickers => this.updateTickers(tickers))
  },
  beforeDestroy () {
    if (this.unsubscribeTickers) this.unsubscribeTickers()
  },
  methods: {
    ...mapActions('markets', { initializeMarkets: 'initialize', updateTickers: 'updateTickers' }),
    ...mapActions('currency', ['selectCurrency']),
    convert (usdValue) { return this.$store.getters['currency/convert'](usdValue) },
    reloadRates () { return this.$store.dispatch('currency/loadRates', { force: true }) },
    findMarket (symbol) { return this.symbols.find(item => item.symbol === symbol) || null },
    /** Falls back to the default when the query string names an unknown or untradable pair. */
    resolveSymbol (candidate, fallback) {
      if (!candidate) return fallback
      const upperCased = String(candidate).toUpperCase()
      if (this.symbols.length === 0) return upperCased

      return this.symbols.some(item => item.symbol === upperCased) ? upperCased : fallback
    },
    pickWinner (leftValue, rightValue, higherIsBetter) {
      if (higherIsBetter === null) return null
      if (!Number.isFinite(leftValue) || !Number.isFinite(rightValue) || leftValue === rightValue) return null

      return leftValue > rightValue ? 'left' : 'right'
    },
    selectLeft (symbol) { this.applySelection(symbol, this.rightSymbol) },
    selectRight (symbol) { this.applySelection(this.leftSymbol, symbol) },
    swap () { this.applySelection(this.rightSymbol, this.leftSymbol) },
    applySelection (a, b) {
      if (a === this.leftSymbol && b === this.rightSymbol) return
      // Router rejects a duplicate navigation; nothing to recover from if it happens.
      this.$router.push({ name: 'compare', query: { a, b } }).catch(() => {})
    },
    async loadTrend () {
      const requestId = ++this.trendRequest
      const [a, b] = [this.leftSymbol, this.rightSymbol]

      this.isTrendLoading = true
      this.trendError = null

      try {
        const [leftKlines, rightKlines] = await Promise.all([
          getKlines(a, COMPARISON_INTERVAL, COMPARISON_LIMIT),
          getKlines(b, COMPARISON_INTERVAL, COMPARISON_LIMIT)
        ])
        if (requestId !== this.trendRequest) return

        this.trendSeries = [
          { name: this.leftLabel, data: toNormalizedTrend(leftKlines) },
          { name: this.rightLabel, data: toNormalizedTrend(rightKlines) }
        ]
      } catch (error) {
        if (requestId === this.trendRequest) this.trendError = error.message
      } finally {
        if (requestId === this.trendRequest) this.isTrendLoading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.comparison-view { display: grid; gap: $space-5; }
.comparison-view__pickers { align-items: end; display: grid; gap: $space-3; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); }
.comparison-view__swap {
  background: $color-surface-raised;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  color: $color-text-muted;
  height: 42px;
  transition: border-color $transition-fast, color $transition-fast;
  width: 42px;
}
.comparison-view__swap:hover { border-color: $color-brand; color: $color-brand; }
.comparison-view__currency { align-items: flex-end; display: flex; flex-direction: column; gap: $space-2; }
.comparison-view__currency-error {
  align-items: center;
  color: $color-negative;
  display: flex;
  font-size: $font-size-xs;
  gap: $space-1;
  margin: 0;
  text-align: right;
}
.comparison-view__currency-error .button-text { padding: 0 0 0 $space-1; }
</style>
