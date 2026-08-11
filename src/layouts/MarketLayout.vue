<template>
  <div class="market-layout">
    <aside class="market-layout__watchlist"><slot name="watchlist" /></aside>
    <section class="market-layout__content"><slot /></section>
  </div>
</template>

<script>
export default { name: 'MarketLayout' }
</script>

<style lang="scss" scoped>
.market-layout { display: grid; gap: $space-5; grid-template-columns: minmax(220px, 280px) minmax(0, 1fr); }
@media (max-width: $breakpoint-md) { .market-layout { grid-template-columns: 1fr; } .market-layout__watchlist { order: 2; } }
</style>
