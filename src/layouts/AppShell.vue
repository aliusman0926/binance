<template>
  <div class="app-shell">
    <header class="app-shell__header">
      <a href="#" class="app-shell__brand" @click.prevent="navigateToMarkets">
          <span class="app-shell__brand-mark">B</span>
          <span>Market Terminal</span>
      </a>
      <app-navigation />
      <connection-indicator class="app-shell__connection" />
    </header>
    <main class="app-shell__content">
      <slot />
    </main>
  </div>
</template>

<script>
import AppNavigation from '@/components/navigation/AppNavigation.vue'
import ConnectionIndicator from '@/components/navigation/ConnectionIndicator.vue'

export default {
  name: 'AppShell',
  components: { AppNavigation, ConnectionIndicator },
  methods: {
    navigateToMarkets () {
      this.$router.push({ name: 'markets' })
    }
  }
}
</script>

<style lang="scss" scoped>
.app-shell {
  min-height: 100vh;
  background: $color-background;

  &__header {
    align-items: center;
    background: $color-surface-raised;
    border-bottom: 1px solid $color-border;
    display: flex;
    height: $header-height;
    justify-content: space-between;
    padding: 0 $space-6;
  }

  &__brand {
    color: $color-text-primary;
    text-decoration: none;
  }

  &__brand { align-items: center; display: inline-flex; font-weight: $font-weight-semibold; gap: $space-2; }
  &__brand-mark { align-items: center; background: $color-brand; border-radius: $radius-sm; color: $color-background; display: inline-flex; font-weight: $font-weight-bold; height: 24px; justify-content: center; width: 24px; }
  &__connection { margin-left: $space-5; }
  &__content { margin: 0 auto; max-width: $content-max-width; padding: $space-6; width: 100%; }
}

@media (max-width: $breakpoint-sm) {
  .app-shell__header { padding: 0 $space-4; }
  .app-shell__connection span { display: none; }
  .app-shell__content { padding: $space-4; }
}
</style>
