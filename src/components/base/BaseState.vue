<template>
  <div class="base-state" :class="`base-state--${type}`" role="status">
    <v-progress-circular v-if="type === 'loading'" color="primary" indeterminate :size="24" :width="2" />
    <v-icon v-else-if="type === 'error'" color="error" small>error_outline</v-icon>
    <v-icon v-else color="secondary" small>info_outline</v-icon>
    <p><slot>{{ message }}</slot></p>
    <div v-if="$slots.actions" class="base-state__actions"><slot name="actions" /></div>
  </div>
</template>

<script>
export default {
  name: 'BaseState',
  props: {
    type: { type: String, default: 'empty', validator: value => ['loading', 'empty', 'error'].includes(value) },
    message: { type: String, default: 'Nothing to display.' }
  }
}
</script>

<style lang="scss" scoped>
.base-state { align-items: center; color: $color-text-muted; display: flex; flex-direction: column; gap: $space-3; justify-content: center; min-height: 140px; padding: $space-6; text-align: center; }
.base-state p { font-size: $font-size-sm; margin: 0; }
.base-state--error p { color: $color-negative; }
.base-state__actions { margin-top: $space-1; }
</style>
