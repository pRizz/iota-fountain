import BitcoinTransactionSubscriber from './lib/TransactionSubscribers/BitcoinTransactionSubscriber'
import NanoTransactionSubscriber from './lib/TransactionSubscribers/NanoTransactionSubscriber'
import TransactionStreamSubscriber from './lib/TransactionStreamSubscriber'

const coinFlags = new Set([
  "VUE_APP_BITCOIN_FOUNTAIN",
  "VUE_APP_NANO_FOUNTAIN",
  "VUE_APP_IOTA_FOUNTAIN"
])

function getCurrentCoinKey() {
  let existingCoinFlags = new Set()

  for(let coinFlag of coinFlags) {
    if(process.env[coinFlag]) {
      existingCoinFlags.add(coinFlag)
    }
  }

  if(existingCoinFlags.size !== 1) {
    throw `Must supply exactly one of ${JSON.stringify(Object.values(coinFlags))}, in the environment`
  }

  return existingCoinFlags.values().next().value
}

let currentCoin = getCurrentCoinKey()

const baseHashExplorerURL = {
  VUE_APP_BITCOIN_FOUNTAIN: "https://www.blockchain.com/btc/tx/",
  VUE_APP_NANO_FOUNTAIN: "https://nanocrawler.cc/explorer/block/",
  VUE_APP_IOTA_FOUNTAIN: "https://thetangle.org/transaction/"
}

export function getExplorerURLForHash(hash) {
  const baseURL = baseHashExplorerURL[currentCoin]
  return `${baseURL}${hash}`
}

const valueUnits = {
  VUE_APP_BITCOIN_FOUNTAIN: "satoshis",
  VUE_APP_NANO_FOUNTAIN: "raw NANO",
  VUE_APP_IOTA_FOUNTAIN: "IOTA"
}

export function getValueUnits() {
  return valueUnits[currentCoin]
}

const transactionStreamInitializers = {
  VUE_APP_BITCOIN_FOUNTAIN: () => BitcoinTransactionSubscriber(),
  VUE_APP_NANO_FOUNTAIN: () => NanoTransactionSubscriber(),
  VUE_APP_IOTA_FOUNTAIN: () => TransactionStreamSubscriber({
    iotaTransactionStreamIP: process.env.VUE_APP_IOTA_TRANSACTION_STREAM_IP,
    iotaTransactionStreamPort: process.env.VUE_APP_IOTA_TRANSACTION_STREAM_PORT,
    isIotaTransactionStreamSecured: process.env.VUE_APP_IS_IOTA_TRANSACTION_STREAM_SECURED
  }),
}

export function initializeTransactionStreamSubscriber() {
  return transactionStreamInitializers[getCurrentCoinKey()]()
}
