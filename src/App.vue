<template>
  <div id="app">

    <nav class="navbar is-dark" role="navigation" aria-label="main navigation">
      <div class="container">

      <div class="navbar-brand">
        <div class="navbar-item glow code" style="font-size: 1.5rem">
          IOTA Fountain
        </div>
        <a role="button" class="navbar-burger burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </a>
      </div>

      <div class="navbar-menu">
        <div class="navbar-start"></div>

        <div class="navbar-end">

          <a href="https://github.com/pRizz/iota-fountain" class="navbar-item" target="_blank">
              <span class="icon">
                <i class="fab fa-github"></i>
              </span>
            <span>&nbsp;GitHub</span>
          </a>

        </div>

      </div>
      </div>
    </nav>

    <Fountain :tx-emitter="txEmitter"></Fountain>

    <footer class="footer is-dark" style="background-color: #111111;">
      <div class="container">

        <div class="content has-text-centered">
          <div class="columns" style="color: gray;">
            <div class="column">
              <h1 class="heading title is-4" style="color: gray;">IOTA Fountain</h1>
              <h1 class="subtitle is-6" style="color: gray;">A visualizer for an <a target="_blank" href="https://www.npmjs.com/package/iota-transaction-stream"></a> IOTA Transaction Stream that utilizes particle physics to render a fountain. Displays new transactions as they are emitted by an IOTA node.</h1>
            </div>
            <div class="column">
              <p>View source code at
                <a href="https://github.com/pRizz/iota-fountain" class="button is-small is-dark" target="_blank">
                  <span class="icon">
                    <i class="fab fa-github"></i>
                  </span>
                  <span>&nbsp;GitHub</span>
                </a>
              </p>
              <a href="https://www.prizzventuresllc.com/PrivacyPolicy.txt" target="_blank">Privacy Policy</a>
            </div>
            <div class="column">
              <p>Copyright © 2018 Peter Ryszkiewicz</p>
              <p>MIT Licensed</p>
              <p>Check out my other crypto projects at <a href="https://www.prizzventuresllc.com" target="_blank">https://www.prizzventuresllc.com</a></p>
            </div>
          </div>
        </div>

        <div class="has-text-centered" style="color: gray;">
          <p>If you like these apps and want to support me making more, please consider tipping me at these addresses:</p>
          <div>
            IOTA: <code class="code-color dark-background" style="overflow-wrap: break-word;">{{ tipAddresses.IOTA }}</code>
          </div>
          <div>
            NANO: <code class="code-color dark-background" style="overflow-wrap: break-word;">{{ tipAddresses.NANO }}</code>
          </div>
          <div>
            Thanks for your support!
          </div>
        </div>

      </div>
    </footer>

  </div>
</template>

<script>
import Fountain from './components/Fountain'
import TransactionStreamSubscriber from './lib/TransactionStreamSubscriber'
import EventEmitter from 'events'
import tipAddresses from 'prizz-tip-addresses'

export default {
  name: 'app',
  components: {
    Fountain
  },
  data() {
    return {
      transactions: [],
      transactionStreamSubscriber: null,
      txEmitter: new EventEmitter(),
      clientCount: 0,
      tipAddresses
    }
  },
  mounted() {
    this.transactionStreamSubscriber = TransactionStreamSubscriber({
      iotaTransactionStreamIP: process.env.VUE_APP_IOTA_TRANSACTION_STREAM_IP,
      iotaTransactionStreamPort: process.env.VUE_APP_IOTA_TRANSACTION_STREAM_PORT,
      isIotaTransactionStreamSecured: process.env.VUE_APP_IS_IOTA_TRANSACTION_STREAM_SECURED
    })

    this.transactionStreamSubscriber.setTransactionCallback(tx => {
      this.transactions.unshift(tx)
      this.txEmitter.emit('tx', tx)
    })

    this.transactionStreamSubscriber.eventEmitter.on('clientCount', (clientCount) => {
      this.clientCount = clientCount
    })
  }
}
</script>

<style>
  #app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
  }

  .dark-background {
    background-color: #111111;
  }

  .code {
    font-family: 'Menlo', 'Lucida Grande', Geneva, Helvetica, Arial, sans-serif;
  }

  .code-color {
    color: #e9b7ff;
  }

  .glow {
    color: #e9b7ff;
    text-shadow: 0px 0px 3px #b819ff;
  }
</style>
