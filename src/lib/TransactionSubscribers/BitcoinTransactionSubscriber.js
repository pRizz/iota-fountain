/*!
 * IOTA Fountain
 * Copyright(c) 2019 Peter Ryszkiewicz
 * MIT Licensed
 */

import EventEmitter from 'events'
import ConnectionStatusEnum from '../ConnectionStatusEnum'

let webSocketClient = null
let tps = 0
const tpsInterval = 600 // ms
let transactionsWithinInterval = 0
const eventEmitter = new EventEmitter()

function getWebSocketURL() {
  return `wss://ws.blockchain.info/inv`
}

function makeWebSocket() {
  return new WebSocket(getWebSocketURL())
}

function valueForBitcoinOuts(outArray) {
  return outArray.reduce((acc, cur) => { return acc + cur.value }, 0)
}

function tryWebSocketConnection() {
  console.log(`${new Date().toISOString()}: Trying to create a new transaction stream WebSocket`)

  eventEmitter.emit('state', ConnectionStatusEnum.connecting)

  webSocketClient = makeWebSocket()

  webSocketClient.addEventListener('open', () => {
    console.log(`${new Date().toISOString()}: Opened transaction stream WebSocket`)
    eventEmitter.emit('state', ConnectionStatusEnum.connected)
    webSocketClient.send(JSON.stringify({"op":"unconfirmed_sub"}))
  })

  webSocketClient.addEventListener('message', message => {
    try {
      const messageObject = JSON.parse(Buffer.from(message.data).toString())
      if(!messageObject.op) { return console.warn(`${new Date().toISOString()}: received unserializable message; no op`) }
      if(messageObject.op !== "utx") { return console.warn(`${new Date().toISOString()}: received unserializable message; not utx`) }
      if(!messageObject.x) { return console.warn(`${new Date().toISOString()}: received unserializable message; no x`) }
      if(!messageObject.x.hash) { return console.warn(`${new Date().toISOString()}: received unserializable message; no x.hash`) }
      if(!messageObject.x.out) { return console.warn(`${new Date().toISOString()}: received unserializable message; no x.out`) }
      if(!messageObject.x.out.length) { return console.warn(`${new Date().toISOString()}: received unserializable message; no x.out.length`) }

      console.log(messageObject)
      transactionCallback({
        hash: messageObject.x.hash,
        value: valueForBitcoinOuts(messageObject.x.out)
      })
      ++transactionsWithinInterval
    } catch (e) {
      console.error('An error occurred while deserializing', e)
    }
  })

  webSocketClient.addEventListener('close', function() {
    console.warn(`${new Date().toISOString()}: The transaction stream WebSocket closed`)
    eventEmitter.emit('state', ConnectionStatusEnum.disconnected)
    if(this !== webSocketClient) { return }
    setTimeout(tryWebSocketConnection, 3000 + Math.random() * 1000)
  })

  webSocketClient.addEventListener('error', (error) => {
    console.warn(`${new Date().toISOString()}: The transaction stream WebSocket got an error: ${error}`)
    eventEmitter.emit('state', ConnectionStatusEnum.disconnecting)
  })
}

let transactionCallback = () => {}

function setTransactionCallback(callback) {
  transactionCallback = callback
}

function start() {
  stop()
  tryWebSocketConnection()
}

function stop() {
  if(!webSocketClient) { return }
  eventEmitter.emit('state', ConnectionStatusEnum.disconnecting)
  const localWebSocketClient = webSocketClient
  webSocketClient = null
  localWebSocketClient.close()
}

function getTransactionsPerSecond() {
  return tps
}

setInterval(() => {
  tps = transactionsWithinInterval / tpsInterval * 1000.0
  transactionsWithinInterval = 0
}, tpsInterval)

export default function () {
  tryWebSocketConnection()

  return {
    setTransactionCallback,
    start,
    stop,
    getTransactionsPerSecond,
    eventEmitter
  }
}
