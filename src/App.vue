<template>
  <div id="app">

    <nav class="navbar is-dark" role="navigation" aria-label="main navigation">
      <div class="container">

      <div class="navbar-brand">
        <div class="navbar-item glow code" style="font-size: 1.5rem">
          {{appTitle}}
        </div>
        <a role="button" class="navbar-burger burger" aria-label="menu" aria-expanded="false" data-target="navbarBurger" :class="{ 'is-active': navVisible }" @click="navVisible = !navVisible">
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </a>
      </div>

      <div id="navbarBurger" class="navbar-menu" :class="{ 'is-active': navVisible }">
        <div class="navbar-start"></div>

        <div class="navbar-end">

          <div class="navbar-item">
            <svg width="10" height="10">
              <circle r="5px" cx="5px" cy="5px" :fill="clientState.color"></circle>
            </svg>
          </div>

          <div class="navbar-item">
            {{ clientStateText }}
          </div>

          <div class="navbar-item has-dropdown is-hoverable">
            <a class="navbar-link">
              More
            </a>

            <div class="navbar-dropdown">

              <div class="navbar-item">
                <div class="field">
                  <b-checkbox v-model="shouldMockFountain">
                    Sprinkles!!
                  </b-checkbox>
                </div>
              </div>

              <div class="navbar-item">
                <div class="field">
                  <b-checkbox v-model="useMoonGravity">
                    Moon Gravity
                  </b-checkbox>
                </div>
              </div>

              <hr class="navbar-divider">

              <div class="navbar-item">
                Rendering Mode
              </div>

              <section>
                <div class="field">
                  <b-radio v-model="renderStyle" :native-value="Style.basicStyle" class="dark-text">
                    Basic
                  </b-radio>
                </div>
                <div class="field">
                  <b-radio v-model="renderStyle" :native-value="Style.shaderStyle" class="dark-text">
                    Fancy
                  </b-radio>
                </div>
              </section>

            </div>
          </div>

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

    <Fountain :tx-emitter="txEmitter"
              :should-mock-fountain="shouldMockFountain"
              :useMoonGravity="useMoonGravity"
              :renderStyle="renderStyle"
    />

    <b-switch v-model="showTransactionList" size="is-medium" style="margin: 20px">
      Show Transaction List
    </b-switch>

    <transaction-list v-if="showTransactionList" :transactions="transactions" />

    <footer class="footer is-dark" style="background-color: #111111;">
      <div class="container">

        <div class="content has-text-centered">
          <div class="columns" style="color: gray;">
            <div class="column">
              <BitcoinFountainDescription v-if="isBitcoinFountain"/>
              <IOTAFountainDescription v-if="!isBitcoinFountain"/>
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
            BANANO: <code class="code-color dark-background" style="overflow-wrap: break-word;">{{ tipAddresses.BANANO }}</code>
          </div>
          <div>
            ETH: <code class="code-color dark-background" style="overflow-wrap: break-word;">{{ tipAddresses.ETH }}</code>
          </div>
          <div>
            BTC: <code class="code-color dark-background" style="overflow-wrap: break-word;">{{ tipAddresses.BTC }}</code>
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
import BCheckbox from "buefy/src/components/checkbox/Checkbox"
import BRadio from "buefy/src/components/radio/Radio"
import Style from './lib/Style'
import BitcoinTransactionSubscriber from './lib/TransactionSubscribers/BitcoinTransactionSubscriber'
import BitcoinFountainDescription from './components/BitcoinFountainDescription'
import IOTAFountainDescription from './components/IOTAFountainDescription'
import ConnectionStatusEnum from './lib/ConnectionStatusEnum'
import TransactionList from './components/TransactionList'
import NanoTransactionSubscriber from './lib/TransactionSubscribers/NanoTransactionSubscriber'
import {initializeTransactionStreamSubscriber} from './Config'

export default {
  name: 'app',
  components: {
    TransactionList,
    IOTAFountainDescription,
    BitcoinFountainDescription,
    BRadio,
    BCheckbox,
    Fountain
  },
  data() {
    return {
      transactions: [],
      transactionStreamSubscriber: null,
      txEmitter: new EventEmitter(),
      clientCount: 0,
      tipAddresses,
      shouldMockFountain: false,
      clientState: ConnectionStatusEnum.disconnected,
      navVisible: false,
      renderStyle: Style.shaderStyle,
      Style,
      isBitcoinFountain: !!process.env.VUE_APP_BITCOIN_FOUNTAIN,
      appTitle: process.env.VUE_APP_TITLE,
      showTransactionList: false,
      useMoonGravity: false
    }
  },
  computed: {
    clientStateText() {
      if(this.clientCount) {
        return `${this.clientCount} Users Online`
      }
      return this.clientState.displayText
    },
    coinName() {
      if(this.isBitcoinFountain) {
        return "Bitcoin"
      }
      return "IOTA"
    },
  },
  mounted() {
    this.transactionStreamSubscriber = initializeTransactionStreamSubscriber()

    this.transactionStreamSubscriber.setTransactionCallback(tx => {
      this.transactions.unshift(tx)
      this.txEmitter.emit('tx', tx)
    })

    this.transactionStreamSubscriber.eventEmitter.on('state', (clientState) => {
      this.clientState = clientState
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

  .dark-text {
    color: #4a4a4a;
  }
</style>
