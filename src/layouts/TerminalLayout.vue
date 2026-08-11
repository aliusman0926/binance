<template>
  <div class="terminal-layout">
    <section class="terminal-layout__symbol"><slot name="symbol" /></section>
    <section class="terminal-layout__chart"><slot name="chart" /></section>
    <aside class="terminal-layout__order-book"><slot name="order-book" /></aside>
    <section class="terminal-layout__trades"><slot name="trades" /></section>
    <section class="terminal-layout__price-volume"><slot name="price-volume" /></section>
  </div>
</template>

<script>
export default { name: 'TerminalLayout' }
</script>

<style lang="scss" scoped>
.terminal-layout { display: grid; gap: $space-4; grid-template-columns: minmax(0, 1fr) minmax(260px, 320px); }
.terminal-layout__symbol { grid-column: 1 / -1; }
.terminal-layout__chart { min-height: 480px; }
.terminal-layout__trades { grid-column: 1; }
.terminal-layout__order-book { grid-column: 2; grid-row: 2 / span 2; }
.terminal-layout__price-volume { grid-column: 1 / -1; }
@media (max-width: $breakpoint-md) { .terminal-layout { grid-template-columns: 1fr; } .terminal-layout__symbol, .terminal-layout__chart, .terminal-layout__trades, .terminal-layout__order-book, .terminal-layout__price-volume { grid-column: 1; grid-row: auto; } .terminal-layout__chart { min-height: 380px; } }
</style>
