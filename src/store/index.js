import Vue from 'vue'
import Vuex from 'vuex'
import currency from './modules/currency'
import markets from './modules/markets'
import terminal from './modules/terminal'

Vue.use(Vuex)

export default new Vuex.Store({
  strict: process.env.NODE_ENV !== 'production',
  modules: { currency, markets, terminal }
})
