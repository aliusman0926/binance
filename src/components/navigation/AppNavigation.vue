<template>
  <nav class="app-navigation" aria-label="Primary navigation">
    <a href="#" class="app-navigation__link" @click.prevent="navigateTo('markets')">Markets</a>
    <a href="#" class="app-navigation__link" @click.prevent="navigateTo('terminal', { symbol: defaultSymbol })">Trade</a>
    <a href="#" class="app-navigation__link" @click.prevent="navigateTo('compare')">Compare</a>
  </nav>
</template>

<script>
import { DEFAULT_SYMBOL } from '@/utils/constants'

export default {
  name: 'AppNavigation',
  data: () => ({ defaultSymbol: DEFAULT_SYMBOL }),
  methods: {
    navigateTo (name, params = {}) {
      this.$router.push({ name, params })
    }
  }
}
</script>

<style lang="scss" scoped>
.app-navigation { display: flex; gap: $space-5; }
.app-navigation a { color: $color-text-muted; font-size: $font-size-sm; text-decoration: none; transition: color $transition-fast; }
.app-navigation a.is-active, .app-navigation a:hover { color: $color-brand; }
</style>
