<template>
  <nav class="market-pagination" aria-label="Market list pagination">
    <p class="market-pagination__range">
      Showing <strong>{{ rangeStart }}–{{ rangeEnd }}</strong> of <strong>{{ formatNumber(totalItems, '0,0') }}</strong> pairs
    </p>

    <div class="market-pagination__controls">
      <label class="market-pagination__size">
        <span>Rows</span>
        <select :value="pageSize" @change="$emit('page-size-change', Number($event.target.value))">
          <option v-for="option in pageSizeOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </label>

      <ul class="market-pagination__pages">
        <li>
          <button type="button" aria-label="Previous page" :disabled="page <= 1" @click="$emit('page-change', page - 1)">
            <v-icon small>chevron_left</v-icon>
          </button>
        </li>
        <li v-for="(entry, index) in visiblePages" :key="`${entry}-${index}`">
          <span v-if="entry === ELLIPSIS" class="market-pagination__ellipsis">{{ ELLIPSIS }}</span>
          <button
            v-else
            type="button"
            :class="{ 'is-current': entry === page }"
            :aria-label="`Go to page ${entry}`"
            :aria-current="entry === page ? 'page' : false"
            @click="$emit('page-change', entry)"
          >{{ entry }}</button>
        </li>
        <li>
          <button type="button" aria-label="Next page" :disabled="page >= totalPages" @click="$emit('page-change', page + 1)">
            <v-icon small>chevron_right</v-icon>
          </button>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script>
import { PAGE_SIZE_OPTIONS } from '@/utils/constants'
import { formatNumber } from '@/utils/formatters'

const ELLIPSIS = '…'
const MAX_PAGES_WITHOUT_GAPS = 7

export default {
  name: 'MarketPagination',
  props: {
    page: { type: Number, required: true },
    pageSize: { type: Number, required: true },
    totalItems: { type: Number, required: true },
    pageSizeOptions: { type: Array, default: () => PAGE_SIZE_OPTIONS }
  },
  data: () => ({ ELLIPSIS }),
  computed: {
    totalPages () { return Math.max(1, Math.ceil(this.totalItems / this.pageSize)) },
    rangeStart () { return this.totalItems === 0 ? 0 : (this.page - 1) * this.pageSize + 1 },
    rangeEnd () { return Math.min(this.page * this.pageSize, this.totalItems) },
    /** First, last and the pages either side of the current one, with gaps collapsed. */
    visiblePages () {
      if (this.totalPages <= MAX_PAGES_WITHOUT_GAPS) {
        return Array.from({ length: this.totalPages }, (item, index) => index + 1)
      }

      const anchors = [1, this.page - 1, this.page, this.page + 1, this.totalPages]
      const uniquePages = [...new Set(anchors)]
        .filter(pageNumber => pageNumber >= 1 && pageNumber <= this.totalPages)
        .sort((first, second) => first - second)

      return uniquePages.reduce((entries, pageNumber, index) => {
        if (index > 0 && pageNumber - uniquePages[index - 1] > 1) entries.push(ELLIPSIS)
        entries.push(pageNumber)
        return entries
      }, [])
    }
  },
  methods: { formatNumber }
}
</script>

<style lang="scss" scoped>
.market-pagination { align-items: center; display: flex; flex-wrap: wrap; gap: $space-4; justify-content: space-between; margin-top: $space-4; }
.market-pagination__range { color: $color-text-muted; font-size: $font-size-xs; margin: 0; }
.market-pagination__range strong { color: $color-text-secondary; font-weight: $font-weight-medium; }
.market-pagination__controls { align-items: center; display: flex; gap: $space-4; }
.market-pagination__size { align-items: center; color: $color-text-muted; display: flex; font-size: $font-size-xs; gap: $space-2; }
.market-pagination__size select {
  background: $color-surface-raised;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  color: $color-text-primary;
  font-size: $font-size-xs;
  padding: $space-1 $space-2;
}
.market-pagination__size select:focus { border-color: $color-brand; outline: 0; }
.market-pagination__pages { align-items: center; display: flex; gap: $space-1; list-style: none; margin: 0; padding: 0; }
.market-pagination__pages button {
  background: transparent;
  border: 1px solid transparent;
  border-radius: $radius-sm;
  color: $color-text-secondary;
  font-size: $font-size-xs;
  min-width: 30px;
  padding: $space-1 $space-2;
  transition: background-color $transition-fast, color $transition-fast;
}
.market-pagination__pages button:hover:not(:disabled) { background: $color-surface-hover; color: $color-text-primary; }
.market-pagination__pages button:disabled { color: $color-border; cursor: default; }
.market-pagination__pages button.is-current { background: $color-brand; color: $color-background; font-weight: $font-weight-semibold; }
.market-pagination__ellipsis { color: $color-text-muted; font-size: $font-size-xs; padding: 0 $space-1; }
@media (max-width: $breakpoint-sm) { .market-pagination { justify-content: center; } }
</style>
