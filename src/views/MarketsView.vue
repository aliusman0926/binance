<template>
  <div class="c-markets-view">
    <base-section-header eyebrow="Market overview" title="Markets" description="Discover live cryptocurrency market data.">
      <template #actions><market-search v-model="searchQuery" /></template>
    </base-section-header>
    <market-layout>
      <template #watchlist>
        <watchlist-panel :items="watchlistMarkets" :is-loading="isLoading" @select="openMarket" @toggle="toggleWatchlist" />
      </template>
      <market-table :markets="markets" :is-loading="isLoading" :error="error" @retry="initialize" @select="openMarket" @toggle="toggleWatchlist" />
      <market-pagination
        v-if="!isLoading && !error && totalMarkets > 0"
        :page="currentPage"
        :page-size="pageSize"
        :total-items="totalMarkets"
        @page-change="setPage"
        @page-size-change="setPageSize"
      />
    </market-layout>
  </div>
</template>

<script>
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import { BaseSectionHeader } from '@/components/base'
import MarketPagination from '@/components/market/MarketPagination.vue'
import MarketSearch from '@/components/market/MarketSearch.vue'
import MarketTable from '@/components/market/MarketTable.vue'
import WatchlistPanel from '@/components/market/WatchlistPanel.vue'
import MarketLayout from '@/layouts/MarketLayout.vue'
import { subscribeMarketTickers } from '@/services/liveStreams'

export default {
  name: 'MarketsView',
  components: { BaseSectionHeader, MarketLayout, MarketPagination, MarketSearch, MarketTable, WatchlistPanel },
  data: () => ({ unsubscribeTickers: null }), //use undefined instead of null
  computed: {
    ...mapState('markets', ['tickers', 'isLoading', 'error', 'pageSize']),
    ...mapGetters('markets', ['currentPage']),
    searchQuery: {
      get () { 
        const self = this;
        return self.$store.state.markets.searchQuery 
      }, // follow self format
      set (query) { this.$store.commit('markets/setSearchQuery', query) }
    },
    totalMarkets () { return this.$store.getters['markets/filteredSymbols'].length },
    markets () {
      // Only the visible page is decorated with live ticker data; before pagination this
      // remapped all 489 pairs on every ticker frame.
      return this.$store.getters['markets/paginatedSymbols'].map(symbol => ({
        ...symbol,
        ticker: this.tickers[symbol.symbol],
        isWatched: this.$store.state.markets.watchlist.includes(symbol.symbol)
      }))
    },
    watchlistMarkets () {
      return this.$store.getters['markets/watchlistSymbols'].map(symbol => ({
        ...symbol,
        ticker: this.tickers[symbol.symbol]
      }))
    }
  },
  async mounted () {
    await this.initialize()
    this.unsubscribeTickers = subscribeMarketTickers(tickers => this.updateTickers(tickers))
  },
  beforeDestroy () {
    if (this.unsubscribeTickers) this.unsubscribeTickers()
  },
  methods: {
    ...mapActions('markets', ['initialize', 'toggleWatchlist', 'updateTickers']),
    ...mapMutations('markets', ['setPage', 'setPageSize']),
    openMarket (symbol) {
      this.$router.push({ name: 'terminal', params: { symbol } })
    }
  }
}
</script>
