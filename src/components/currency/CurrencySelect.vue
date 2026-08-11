<template>
  <label class="currency-select">
    <span class="sr-only">Display currency</span>
    <v-icon class="currency-select__icon" small>payments</v-icon>
    <select :value="value" :disabled="isLoading" @change="$emit('input', $event.target.value)">
      <option v-for="option in options" :key="option.code" :value="option.code">
        {{ option.code }} — {{ option.label }}
      </option>
    </select>
  </label>
</template>

<script>
import { CURRENCY_OPTIONS } from '@/utils/constants'

export default {
  name: 'CurrencySelect',
  props: {
    value: { type: String, required: true },
    options: { type: Array, default: () => CURRENCY_OPTIONS },
    isLoading: { type: Boolean, default: false }
  }
}
</script>

<style lang="scss" scoped>
.currency-select {
  align-items: center;
  background: $color-surface-raised;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  display: flex;
  height: 36px;
  padding: 0 $space-3;
  transition: border-color $transition-fast;
}
.currency-select:focus-within { border-color: $color-brand; }
.currency-select__icon { color: $color-text-muted; margin-right: $space-2; }
.currency-select select {
  background: transparent;
  color: $color-text-primary;
  font-size: $font-size-sm;
  outline: 0;
  padding-right: $space-2;
}
.currency-select select:disabled { color: $color-text-muted; }
</style>
