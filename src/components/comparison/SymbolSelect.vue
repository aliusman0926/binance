<template>
  <label class="symbol-select">
    <span class="symbol-select__label">{{ label }}</span>
    <span class="symbol-select__control" :style="{ '--accent': accent }">
      <select :value="value" :disabled="symbols.length === 0" @change="$emit('input', $event.target.value)">
        <option v-if="symbols.length === 0" :value="value">Loading markets…</option>
        <option v-for="symbol in symbols" :key="symbol.symbol" :value="symbol.symbol">
          {{ symbol.baseAsset }}/{{ symbol.quoteAsset }}
        </option>
      </select>
    </span>
  </label>
</template>

<script>
export default {
  name: 'SymbolSelect',
  props: {
    value: { type: String, default: '' },
    symbols: { type: Array, default: () => [] },
    label: { type: String, required: true },
    accent: { type: String, default: null }
  }
}
</script>

<style lang="scss" scoped>
.symbol-select { display: flex; flex-direction: column; gap: $space-2; min-width: 0; }
.symbol-select__label { color: $color-text-muted; font-size: $font-size-xs; text-transform: uppercase; letter-spacing: 0.04em; }
.symbol-select__control {
  align-items: center;
  background: $color-surface-raised;
  border: 1px solid $color-border;
  border-left: 3px solid var(--accent, #{$color-border});
  border-radius: $radius-sm;
  display: flex;
  height: 42px;
  padding: 0 $space-3;
  transition: border-color $transition-fast;
}
.symbol-select__control:focus-within { border-color: $color-brand; border-left-color: var(--accent, #{$color-brand}); }
.symbol-select__control select {
  background: transparent;
  color: $color-text-primary;
  font-size: $font-size-md;
  font-weight: $font-weight-semibold;
  outline: 0;
  width: 100%;
}
</style>
