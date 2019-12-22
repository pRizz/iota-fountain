<template>
  <div class="section">
    <div class="container">
      <br/>
      <h2 class="title" v-if="transactions.length === 0">
        Waiting for transactions... <i class="fa fa-spinner fa-spin"></i>
      </h2>

      <b-pagination
              :total.sync="transactions.length"
              :current.sync="currentPage"
              :per-page="pageSize">
      </b-pagination>
      <br>

      <ul>
        <transition-group name="list">
          <li v-for="(tx) in displayedTransactions" v-bind:key="tx.hash">
            <div style="display: flex; align-items: center; flex-direction: column" @click="transactionItemClicked(tx)">
              <div class="title is-5" style="">Transaction hash {{tx.hash}}</div>
              <div style="text-align: center">
                <b-taglist attached style="">
                  <b-tag :type="valueType(tx)" style="">{{ tx.value }}</b-tag>
                </b-taglist>
              </div>
            <br/>
            </div>
          </li>
        </transition-group>
      </ul>

    </div>

  </div>
</template>

<script>

  import {txURL} from '../lib/Util'

  export default {
    name: 'transaction-list',
    /**
     * transaction: {
     *   value: number,
     *   hash: string
     * }
     * valueFormatter: () => {}
     * */
    props: ['transactions'],
    data() {
      return {
        currentPage: 1,
        pageSize: 8,
      }
    },
    filters: {
      shorten (str) {
        return str.length > 40 ? str.slice(0, 40) + ' . . .' : str
      },
    },
    methods: {
      valueType(tx) {
        return tx.value > 0 ? 'is-success' : 'is-danger'
      },
      txValueUnits() {
        return process.env.VUE_APP_BITCOIN_FOUNTAIN ? "satoshis" : "IOTA"
      },
      transactionItemClicked(tx) {
        window.open(txURL(tx.hash), '_blank')
      }
    },
    computed: {
      displayedTransactions() {
        const firstIndex = (this.currentPage - 1) * this.pageSize
        return this.transactions.slice(firstIndex, firstIndex + this.pageSize)
      }
    }
  }
</script>

<style scoped>
  .tag {
    font-size: 0.9rem;
  }
</style>
<style>
  .panel-content[style*="display: none;"] {
    max-height: 0
  }
  .panel-content.fade-enter-active {
    max-height: 10000px
  }
  .panel-content.fade-leave-active {
    max-height: 0
  }

  .panel-content {
    transition: all 0.2s ease;
    max-height: 10000px
  }

  .list-enter-active, .list-leave-active {
    transition: all 0.1s;
  }
  .list-enter, .list-leave-to /* .list-leave-active below version 2.1.8 */ {
    opacity: 0;
    transform: translateY(-30px);
  }

</style>
