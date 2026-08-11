<template>
  <base-panel flush class="price-volume-chart">
    <template #header>
      <div class="price-volume-chart__header">
        <h2 class="price-volume-chart__title">Price &amp; trade volume</h2>
        <span class="price-volume-chart__status" :class="{ 'is-live': hasData }">
          {{ hasData ? 'Live' : 'Waiting for trades' }}
        </span>
      </div>
    </template>
    <div class="price-volume-chart__body">
      <div ref="container" class="price-volume-chart__container" />
      <div v-if="!hasData" class="price-volume-chart__empty">No trades received yet.</div>
    </div>
  </base-panel>
</template>

<script>
import Highcharts from 'highcharts/highstock'
import { BasePanel } from '@/components/base'
import { CHART_THEME, PRICE_VOLUME_REDRAW_MS } from '@/utils/constants'
import { formatNumber, formatPrice } from '@/utils/formatters'

export default {
  name: 'PriceVolumeChart',
  components: { BasePanel },
  props: {
    series: { type: Array, default: () => [] }
  },
  data: () => ({ chart: null, resizeObserver: null, renderTimer: null, lastRenderAt: 0 }),
  computed: {
    hasData () { return this.series.length > 0 }
  },
  watch: {
    series () { this.scheduleRender() }
  },
  mounted () {
    this.createChart()
    this.renderSeries()
  },
  beforeDestroy () {
    if (this.renderTimer) window.clearTimeout(this.renderTimer)
    if (this.resizeObserver) this.resizeObserver.disconnect()
    else window.removeEventListener('resize', this.reflow)
    if (this.chart) this.chart.destroy()
  },
  methods: {
    createChart () {
      this.chart = Highcharts.chart(this.$refs.container, {
        chart: { backgroundColor: CHART_THEME.background, spacing: [12, 8, 8, 8], style: { fontFamily: 'inherit' } },
        credits: { enabled: false },
        legend: { enabled: false },
        title: { text: undefined },
        xAxis: {
          type: 'datetime',
          gridLineColor: CHART_THEME.grid,
          lineColor: CHART_THEME.grid,
          tickColor: CHART_THEME.grid,
          labels: { style: { color: CHART_THEME.text } },
          crosshair: { color: CHART_THEME.grid }
        },
        // Two stacked panes on one time axis: price on top, volume beneath.
        yAxis: [
          {
            height: '68%',
            gridLineColor: CHART_THEME.grid,
            opposite: true,
            title: { text: undefined },
            labels: { align: 'left', style: { color: CHART_THEME.text }, formatter () { return formatPrice(this.value) } }
          },
          {
            top: '74%',
            height: '26%',
            offset: 0,
            gridLineColor: CHART_THEME.grid,
            opposite: true,
            title: { text: undefined },
            labels: { align: 'left', style: { color: CHART_THEME.text }, formatter () { return formatNumber(this.value, '0.[00]a') } }
          }
        ],
        tooltip: {
          backgroundColor: CHART_THEME.background,
          borderColor: CHART_THEME.grid,
          style: { color: CHART_THEME.text },
          shared: true,
          formatter () {
            const [pricePoint, volumePoint] = this.points
            return [
              `<b>${Highcharts.dateFormat('%H:%M:%S', this.x)}</b>`,
              `Price ${formatPrice(pricePoint && pricePoint.y)}`,
              `Volume ${formatNumber(volumePoint && volumePoint.y, '0,0.[0000]')}`
            ].join('<br>')
          }
        },
        plotOptions: {
          series: { animation: false, states: { inactive: { opacity: 1 } } }
        },
        series: [
          {
            type: 'line',
            name: 'Price',
            yAxis: 0,
            data: [],
            color: CHART_THEME.up,
            lineWidth: 1.5,
            marker: { enabled: false }
          },
          {
            type: 'column',
            name: 'Volume',
            yAxis: 1,
            data: [],
            color: CHART_THEME.grid,
            borderWidth: 0,
            groupPadding: 0.05
          }
        ]
      })

      if (window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(this.reflow)
        this.resizeObserver.observe(this.$refs.container)
      } else {
        window.addEventListener('resize', this.reflow)
      }
    },
    /**
     * Trades can arrive dozens of times a second. This is a trailing throttle: at most one
     * redraw per PRICE_VOLUME_REDRAW_MS, and the redraw always uses the newest data.
     */
    scheduleRender () {
      if (this.renderTimer) return

      const elapsed = Date.now() - this.lastRenderAt
      const delay = Math.max(0, PRICE_VOLUME_REDRAW_MS - elapsed)

      this.renderTimer = window.setTimeout(() => {
        this.renderTimer = null
        this.renderSeries()
      }, delay)
    },
    renderSeries () {
      if (!this.chart) return

      this.lastRenderAt = Date.now()
      this.chart.series[0].setData(this.series.map(point => [point.time, point.price]), false, false, false)
      this.chart.series[1].setData(this.series.map(point => [point.time, point.volume]), false, false, false)
      this.chart.redraw(false)
    },
    reflow () {
      if (this.chart) this.chart.reflow()
    }
  }
}
</script>

<style lang="scss" scoped>
.price-volume-chart__header { align-items: center; display: flex; justify-content: space-between; width: 100%; }
.price-volume-chart__title { color: $color-text-primary; font-size: $font-size-sm; font-weight: $font-weight-semibold; margin: 0; }
.price-volume-chart__status { color: $color-text-muted; font-size: $font-size-xs; }
.price-volume-chart__status.is-live { color: $color-positive; }
.price-volume-chart__status.is-live::before { content: '● '; }
.price-volume-chart__body { position: relative; }
.price-volume-chart__container { height: 260px; width: 100%; }
.price-volume-chart__empty {
  align-items: center;
  color: $color-text-muted;
  display: flex;
  font-size: $font-size-sm;
  inset: 0;
  justify-content: center;
  position: absolute;
}
</style>
