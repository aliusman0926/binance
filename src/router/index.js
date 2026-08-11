import Vue from 'vue'
import VueRouter from 'vue-router'
import MarketsView from '@/views/MarketsView.vue'

Vue.use(VueRouter)

const TradingTerminalView = () =>
  import('@/views/TradingTerminalView.vue')

const ComparisonView = () =>
  import('@/views/ComparisonView.vue')

const router = new VueRouter({
  mode: 'history',
  linkActiveClass: 'is-active',
  routes: [
    { path: '/', redirect: { name: 'markets' } },
    { path: '/markets', name: 'markets', component: MarketsView },
    {
      path: '/trade/:symbol',
      name: 'terminal',
      component: TradingTerminalView,
      props: route => ({
        symbol: route.params.symbol.toUpperCase()
      })
    },
    // Symbols travel as query params so a comparison can be linked and shared.
    { path: '/compare', name: 'compare', component: ComparisonView },
    { path: '*', redirect: { name: 'markets' } }
  ]
})

export default router