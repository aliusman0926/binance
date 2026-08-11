<template>
  <v-app dark class="app">
    <app-shell>
      <router-view />
    </app-shell>
  </v-app>
</template>

<script>
import AppShell from '@/layouts/AppShell.vue'

export default {
  name: 'App',
  components: { AppShell },
  mounted () {
    // Rates change about once a day and are cached, so fetching once at app level keeps
    // the comparison page instant.
    this.$store.dispatch('currency/loadRates')
  }
}
</script>
