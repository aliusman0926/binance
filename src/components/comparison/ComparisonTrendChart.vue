<template>
  <base-panel flush>
    <template #header>
      <div class="trend-chart__header">
        <h2 class="trend-chart__title">24h trend</h2>
        <span class="trend-chart__hint">Percentage change from 24h ago, so pairs at any price are comparable</span>
      </div>
    </template>
    <base-state v-if="isLoading" type="loading" message="Loading trend data…" />
    <base-state v-else-if="error" type="error" :message="error">
      <template #actions><button class="button-text" type="button" @click="$emit('retry')">Try again</button></template>
    </base-state>
    <div v-else ref="container" class="trend-chart__container" />
  </base-panel>
</template>

<script>
import Highcharts from 'highcharts/highstock'
import { BasePanel, BaseState } from '@/components/base'
import { CHART_THEME, COMPARISON_COLORS } from '@/utils/constants'
import { formatPercent } from '@/utils/formatters'

export default {
  name: 'ComparisonTrendChart',
  components: { BasePanel, BaseState },
  props: {
    series: { type: Array, default: () => [] },
    isLoading: { type: Boolean, default: false },
    error: { type: String, default: null }
  },
  data: () => ({ chart: null, resizeObserver: null }),
  watch: {
    series () { this.syncChart() },
    isLoading () { this.syncChart() },
    error () { this.syncChart() }
  },
  mounted () { this.syncChart() },
  beforeDestroy () { this.destroyChart() },
  methods: {
    /**
     * The container only exists when not loading or errored, so the chart is created and
     * destroyed alongside it rather than kept alive behind a v-if.
     */
    syncChart () {
      this.$nextTick(() => {
        if (!this.$refs.container) {
          this.destroyChart()
          return
        }
        if (!this.chart) this.createChart()
        this.chart.series.forEach((series, index) => {
          const next = this.series[index]
          series.update({ name: next ? next.name : '', color: COMPARISON_COLORS[index] }, false)
          series.setData(next ? next.data : [], false)
        })
        this.chart.redraw(false)
      })
    },
    createChart () {
      this.chart = Highcharts.chart(this.$refs.container, {
        chart: { backgroundColor: CHART_THEME.background, spacing: [16, 8, 8, 8], style: { fontFamily: 'inherit' } },
        credits: { enabled: false },
        title: { text: undefined },
        legend: { enabled: true, itemStyle: { color: CHART_THEME.text }, itemHoverStyle: { color: '#f0f0f0' } },
        xAxis: {
          type: 'datetime',
          gridLineColor: CHART_THEME.grid,
          lineColor: CHART_THEME.grid,
          tickColor: CHART_THEME.grid,
          labels: { style: { color: CHART_THEME.text } },
          crosshair: { color: CHART_THEME.grid }
        },
        yAxis: {
          gridLineColor: CHART_THEME.grid,
          opposite: true,
          title: { text: undefined },
          // The zero line is the reference both pairs start from.
          plotLines: [{ value: 0, color: CHART_THEME.text, width: 1, dashStyle: 'Dash', zIndex: 2 }],
          labels: { align: 'left', style: { color: CHART_THEME.text }, formatter () { return formatPercent(this.value) } }
        },
        tooltip: {
          backgroundColor: CHART_THEME.background,
          borderColor: CHART_THEME.grid,
          style: { color: CHART_THEME.text },
          shared: true,
          formatter () {
            const header = `<b>${Highcharts.dateFormat('%b %e, %H:%M', this.x)}</b>`
            const lines = this.points.map(point => `<span style="color:${point.color}">●</span> ${point.series.name} ${formatPercent(point.y)}`)
            return [header, ...lines].join('<br>')
          }
        },
        plotOptions: { series: { animation: false, marker: { enabled: false }, lineWidth: 2 } },
        series: [
          { type: 'line', name: '', data: [], color: COMPARISON_COLORS[0] },
          { type: 'line', name: '', data: [], color: COMPARISON_COLORS[1] }
        ]
      })

      if (window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(() => this.chart && this.chart.reflow())
        this.resizeObserver.observe(this.$refs.container)
      }
    },
    destroyChart () {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect()
        this.resizeObserver = null
      }
      if (this.chart) {
        this.chart.destroy()
        this.chart = null
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.trend-chart__header { align-items: baseline; display: flex; gap: $space-3; justify-content: space-between; width: 100%; }
.trend-chart__title { color: $color-text-primary; font-size: $font-size-sm; font-weight: $font-weight-semibold; margin: 0; }
.trend-chart__hint { color: $color-text-muted; font-size: $font-size-xs; }
.trend-chart__container { height: 360px; width: 100%; }
@media (max-width: $breakpoint-sm) { .trend-chart__hint { display: none; } }
</style>
