export function txURL(hash) {
  if(process.env.VUE_APP_BITCOIN_FOUNTAIN) {
    return `https://www.blockchain.com/btc/tx/${hash}`
  } else {
    return `https://thetangle.org/transaction/${hash}`
  }
}
