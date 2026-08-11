<template>
  <div class="base-section-header">
    <div>
      <p v-if="eyebrow" class="base-section-header__eyebrow">{{ eyebrow }}</p>
      <h1 class="base-section-header__title">{{ title }}</h1>
      <p v-if="description" class="base-section-header__description">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="base-section-header__actions"><slot name="actions" /></div>
  </div>
</template>

<script>
export default {
  name: 'BaseSectionHeader',
  props: {
    eyebrow: { type: String, default: '' },
    title: { type: String, required: true },
    description: { type: String, default: '' }
  }
}
</script>

<style lang="scss" scoped>
.base-section-header { align-items: flex-end; display: flex; gap: $space-4; justify-content: space-between; margin-bottom: $space-6; }
.base-section-header__eyebrow { color: $color-brand; font-size: $font-size-xs; font-weight: $font-weight-semibold; letter-spacing: 0.08em; margin: 0 0 $space-1; text-transform: uppercase; }
.base-section-header__title { font-size: $font-size-xl; line-height: 1.2; margin: 0; }
.base-section-header__description { color: $color-text-secondary; font-size: $font-size-sm; margin: $space-2 0 0; }
@media (max-width: $breakpoint-sm) { .base-section-header { align-items: flex-start; flex-direction: column; } }
</style>
