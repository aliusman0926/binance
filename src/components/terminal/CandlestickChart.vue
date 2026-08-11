<template>
  <base-panel flush class="candlestick-chart">
    <template #header>
      <div class="candlestick-chart__header">
        <h2 class="candlestick-chart__title">Candlestick chart</h2>
        <div class="candlestick-chart__intervals" role="group" aria-label="Chart interval">
          <button
            v-for="option in intervals"
            :key="option"
            type="button"
            :class="{ 'is-active': option === interval }"
            :aria-pressed="option === interval ? 'true' : 'false'"
            @click="$emit('interval-change', option)"
          >{{ option }}</button>
        </div>
      </div>
    </template>
    <div class="candlestick-chart__body">
      <div ref="container" class="candlestick-chart__container" />
      <div v-if="isLoading" class="candlestick-chart__overlay">Loading {{ interval }} candles…</div>
    </div>
  </base-panel>
</template>

<script>
import Highcharts from 'highcharts/highstock'
import { BasePanel } from '@/components/base'
import { CHART_THEME, KLINE_INTERVALS } from '@/utils/constants'
import { formatPrice } from '@/utils/formatters'

/**
 * lightweight-charts consumed seconds; Highcharts expects milliseconds, which the
 * normalizer already carries as openTime.
 */
function toOhlcPoint (candle) {
  return [candle.openTime, candle.open, candle.high, candle.low, candle.close]
}

export default {
  name: 'CandlestickChart',
  components: { BasePanel },
  props: {
    candles: { type: Array, default: () => [] },
    interval: { type: String, default: KLINE_INTERVALS[0] },
    intervals: { type: Array, default: () => KLINE_INTERVALS },
    isLoading: { type: Boolean, default: false }
  },
  data: () => ({ chart: null, series: null, resizeObserver: null, renderedCandleCount: 0 }),
  watch: {
    candles (candles) { this.renderCandles(candles) }
  },
  mounted () {
    this.createChart()
    this.renderCandles(this.candles)
  },
  beforeDestroy () {
    if (this.resizeObserver) this.resizeObserver.disconnect()
    else window.removeEventListener('resize', this.reflow)
    if (this.chart) this.chart.destroy()
  },
  methods: {
    createChart () {
      this.chart = Highcharts.stockChart(this.$refs.container, {
        chart: { backgroundColor: CHART_THEME.background, style: { fontFamily: 'inherit' } },
        credits: { enabled: false },
        // The interval buttons above replace Highstock's own range UI.
        rangeSelector: { enabled: false },
        navigator: { enabled: false },
        scrollbar: { enabled: false },
        xAxis: {
          gridLineColor: CHART_THEME.grid,
          gridLineWidth: 1,
          lineColor: CHART_THEME.grid,
          tickColor: CHART_THEME.grid,
          labels: { style: { color: CHART_THEME.text } }
        },
        yAxis: {
          gridLineColor: CHART_THEME.grid,
          lineColor: CHART_THEME.grid,
          opposite: true,
          labels: { align: 'left', style: { color: CHART_THEME.text } }
        },
        tooltip: {
          backgroundColor: CHART_THEME.background,
          borderColor: CHART_THEME.grid,
          style: { color: CHART_THEME.text },
          split: false,
          shared: true,
          formatter () {
            return [
              `<b>${Highcharts.dateFormat('%Y-%m-%d %H:%M', this.x)}</b>`,
              `O ${formatPrice(this.point.open)}`,
              `H ${formatPrice(this.point.high)}`,
              `L ${formatPrice(this.point.low)}`,
              `C ${formatPrice(this.point.close)}`
            ].join('<br>')
          }
        },
        plotOptions: {
          // We control the bucket size ourselves, so Highstock must not re-bucket it.
          candlestick: { dataGrouping: { enabled: false } }
        },
        series: [{
          type: 'candlestick',
          name: 'Price',
          data: [],
          color: CHART_THEME.down,
          lineColor: CHART_THEME.down,
          upColor: CHART_THEME.up,
          upLineColor: CHART_THEME.up
        }]
      })
      this.series = this.chart.series[0]

      if (window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(this.reflow)
        this.resizeObserver.observe(this.$refs.container)
      } else {
        window.addEventListener('resize', this.reflow)
      }
    },
    renderCandles (candles) {
      if (!this.series) return

      const data = candles.map(toOhlcPoint)
      const isLiveUpdate = data.length > 0 && data.length === this.renderedCandleCount
      const lastPoint = this.series.data[this.series.data.length - 1]

      // A same-length change means the in-progress candle ticked; updating that single
      // point avoids re-seeding several hundred points on every websocket frame.
      if (isLiveUpdate && lastPoint) lastPoint.update(data[data.length - 1], true, false)
      else this.series.setData(data, true, false, false)

      this.renderedCandleCount = data.length
    },
    reflow () {
      if (this.chart) this.chart.reflow()
    }
  }
}
</script>

<style lang="scss" scoped>
.candlestick-chart { height: 100%; }
.candlestick-chart__header { align-items: center; display: flex; justify-content: space-between; width: 100%; }
.candlestick-chart__title { color: $color-text-primary; font-size: $font-size-sm; font-weight: $font-weight-semibold; margin: 0; }
.candlestick-chart__intervals { display: flex; gap: $space-1; }
.candlestick-chart__intervals button {
  background: transparent;
  border: 1px solid transparent;
  border-radius: $radius-sm;
  color: $color-text-muted;
  font-family: $font-family-mono;
  font-size: $font-size-xs;
  min-width: 34px;
  padding: $space-1 $space-2;
  transition: background-color $transition-fast, color $transition-fast;
}
.candlestick-chart__intervals button:hover { background: $color-surface-hover; color: $color-text-primary; }
.candlestick-chart__intervals button.is-active { background: $color-brand; color: $color-background; font-weight: $font-weight-semibold; }
.candlestick-chart__body { position: relative; }
.candlestick-chart__container { height: 430px; width: 100%; }
.candlestick-chart__overlay {
  align-items: center;
  background: rgba($color-surface, 0.72);
  bottom: 0;
  color: $color-text-muted;
  display: flex;
  font-size: $font-size-sm;
  justify-content: center;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
}
</style>
