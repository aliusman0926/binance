<template>
  <section class="base-panel" :class="{ 'base-panel--flush': flush }">
    <header v-if="$slots.header || title" class="base-panel__header">
      <slot name="header">
        <h2 class="base-panel__title">{{ title }}</h2>
      </slot>
    </header>
    <div class="base-panel__content">
      <slot />
    </div>
  </section>
</template>

<script>
export default {
  name: 'BasePanel',
  props: {
    title: { type: String, default: '' },
    flush: { type: Boolean, default: false }
  }
}
</script>

<style lang="scss" scoped>
.base-panel {
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  min-width: 0;

  &__header { align-items: center; border-bottom: 1px solid $color-border; display: flex; min-height: 48px; padding: 0 $space-4; }
  &__title { color: $color-text-primary; font-size: $font-size-sm; font-weight: $font-weight-semibold; margin: 0; }
  &__content { padding: $space-4; }
  &--flush .base-panel__content { padding: 0; }
}
</style>
