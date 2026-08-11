<template>
  <base-panel flush>
    <template #header>
      <div class="comparison-stats__header">
        <h2 class="comparison-stats__title">Head to head</h2>
        <span v-if="footnote" class="comparison-stats__footnote">{{ footnote }}</span>
      </div>
    </template>
    <base-state v-if="isLoading" type="loading" message="Loading market data…" />
    <table v-else class="comparison-stats">
      <thead>
        <tr>
          <th class="comparison-stats__metric"><span class="sr-only">Metric</span></th>
          <th :style="{ color: colors[0] }">{{ leftLabel }}</th>
          <th :style="{ color: colors[1] }">{{ rightLabel }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.key">
          <th scope="row" class="comparison-stats__metric">{{ row.label }}</th>
          <td class="font-mono" :class="{ 'is-winner': row.winner === 'left' }">
            {{ row.leftText }}
            <v-icon v-if="row.winner === 'left'" small>arrow_upward</v-icon>
          </td>
          <td class="font-mono" :class="{ 'is-winner': row.winner === 'right' }">
            {{ row.rightText }}
            <v-icon v-if="row.winner === 'right'" small>arrow_upward</v-icon>
          </td>
        </tr>
      </tbody>
    </table>
  </base-panel>
</template>

<script>
import { BasePanel, BaseState } from '@/components/base'
import { COMPARISON_COLORS } from '@/utils/constants'

export default {
  name: 'ComparisonStats',
  components: { BasePanel, BaseState },
  props: {
    rows: { type: Array, default: () => [] },
    leftLabel: { type: String, default: '' },
    rightLabel: { type: String, default: '' },
    footnote: { type: String, default: '' },
    isLoading: { type: Boolean, default: false },
    colors: { type: Array, default: () => COMPARISON_COLORS }
  }
}
</script>

<style lang="scss" scoped>
.comparison-stats__header { align-items: baseline; display: flex; gap: $space-3; justify-content: space-between; width: 100%; }
.comparison-stats__title { color: $color-text-primary; font-size: $font-size-sm; font-weight: $font-weight-semibold; margin: 0; }
.comparison-stats__footnote { color: $color-text-muted; font-size: $font-size-xs; }
.comparison-stats { border-collapse: collapse; width: 100%; }
.comparison-stats th, .comparison-stats td { padding: $space-3 $space-4; text-align: right; white-space: nowrap; }
.comparison-stats thead th { background: $color-surface-raised; font-size: $font-size-sm; font-weight: $font-weight-semibold; }
.comparison-stats tbody th, .comparison-stats__metric { color: $color-text-muted; font-size: $font-size-xs; font-weight: $font-weight-regular; text-align: left; }
.comparison-stats tbody td { border-top: 1px solid $color-border; color: $color-text-secondary; font-size: $font-size-sm; width: 34%; }
.comparison-stats tbody tr:hover td { background: $color-surface-hover; }
.comparison-stats td.is-winner { color: $color-positive; font-weight: $font-weight-semibold; }
.comparison-stats td.is-winner .v-icon { color: $color-positive; margin-left: $space-1; }
</style>
