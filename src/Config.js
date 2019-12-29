import BitcoinTransactionSubscriber from './lib/TransactionSubscribers/BitcoinTransactionSubscriber'
import NanoTransactionSubscriber from './lib/TransactionSubscribers/NanoTransactionSubscriber'
import TransactionStreamSubscriber from './lib/TransactionStreamSubscriber'

const hashExplorerURL = {
  VUE_APP_BITCOIN_FOUNTAIN: "",
  VUE_APP_NANO_FOUNTAIN: "",
  VUE_APP_IOTA_FOUNTAIN: ""
}

export function explorerHashURL() {

}

export function initializeTransactionStreamSubscriber() {
  let transactionStreamSubscriber
  if(process.env.VUE_APP_BITCOIN_FOUNTAIN) {
    transactionStreamSubscriber = BitcoinTransactionSubscriber()
  } else if(process.env.VUE_APP_NANO_FOUNTAIN) {
    transactionStreamSubscriber = NanoTransactionSubscriber()
  } else {
    transactionStreamSubscriber = TransactionStreamSubscriber({
      iotaTransactionStreamIP: process.env.VUE_APP_IOTA_TRANSACTION_STREAM_IP,
      iotaTransactionStreamPort: process.env.VUE_APP_IOTA_TRANSACTION_STREAM_PORT,
      isIotaTransactionStreamSecured: process.env.VUE_APP_IS_IOTA_TRANSACTION_STREAM_SECURED
    })
  }
  return transactionStreamSubscriber
}
