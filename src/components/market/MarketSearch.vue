<template>
  <label class="market-search">
    <span class="sr-only">Search trading pairs</span>
    <v-icon class="market-search__icon" small>search</v-icon>
    <input :value="value" type="search" placeholder="Search pairs" @input="$emit('input', $event.target.value)">
  </label>
</template>

<script>
export default {
  name: 'MarketSearch',
  props: { value: { type: String, default: '' } }
}
</script>

<style lang="scss" scoped>
.market-search { align-items: center; background: $color-surface-raised; border: 1px solid $color-border; border-radius: $radius-sm; display: flex; height: 36px; padding: 0 $space-3; transition: border-color $transition-fast; width: min(100%, 280px); }
.market-search:focus-within { border-color: $color-brand; }
.market-search__icon { color: $color-text-muted; margin-right: $space-2; }
.market-search input { color: $color-text-primary; font-size: $font-size-sm; outline: 0; width: 100%; }
.market-search input::placeholder { color: $color-text-muted; }
</style>
