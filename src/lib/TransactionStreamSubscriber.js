/*!
 * IOTA Fountain
 * Copyright(c) 2018 Peter Ryszkiewicz
 * MIT Licensed
 */

import EventEmitter from 'events'

let webSocketClient = null
let iotaTransactionStreamIP, iotaTransactionStreamPort, isIotaTransactionStreamSecured
let tps = 0
const tpsInterval = 600 // ms
let transactionsWithinInterval = 0
const eventEmitter = new EventEmitter()

const State = {
  connecting: {
    color: 'yellow'
  },
  connected: {
    color: 'green'
  },
  disconnecting: {
    color: 'yellow'
  },
  disconnected: {
    color: 'red'
  }
}

function getWebSocketURL() {
  const webSocketProtocol = (isIotaTransactionStreamSecured === true || isIotaTransactionStreamSecured === 'true') ? 'wss' : 'ws'
  return `${webSocketProtocol}://${iotaTransactionStreamIP}:${iotaTransactionStreamPort}`
}

function makeWebSocket() {
  return new WebSocket(getWebSocketURL())
}

function tryWebSocketConnection() {
  console.log(`${new Date().toISOString()}: Trying to create a new transaction stream WebSocket`)

  eventEmitter.emit('state', State.connecting)

  webSocketClient = makeWebSocket()

  webSocketClient.addEventListener('open', () => {
    console.log(`${new Date().toISOString()}: Opened transaction stream WebSocket`)
    eventEmitter.emit('state', State.connected)
  })

  webSocketClient.addEventListener('message', message => {
    try {
      const messageObject = JSON.parse(Buffer.from(message.data).toString())
      if(messageObject.clientCount) {
        return emitClientCount({ clientCount: messageObject.clientCount })
      }
      if(!messageObject.hash) { return }
      transactionCallback(messageObject)
      ++transactionsWithinInterval
    } catch (e) {
      console.error('An error occurred while deserializing', e)
    }
  })

  webSocketClient.addEventListener('close', function() {
    console.warn(`${new Date().toISOString()}: The transaction stream WebSocket closed`)
    eventEmitter.emit('state', State.disconnected)
    if(this !== webSocketClient) { return }
    setTimeout(tryWebSocketConnection, 3000 + Math.random() * 1000)
  })

  webSocketClient.addEventListener('error', (error) => {
    console.warn(`${new Date().toISOString()}: The transaction stream WebSocket got an error: ${error}`)
    eventEmitter.emit('state', State.disconnecting)
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
  eventEmitter.emit('state', State.disconnecting)
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

function emitClientCount({ clientCount }) {
  eventEmitter.emit('clientCount', clientCount)
}

export default function ({ iotaTransactionStreamIP: localIotaTransactionStreamIP,
                             iotaTransactionStreamPort: localIotaTransactionStreamPort,
                             isIotaTransactionStreamSecured: localIsIotaTransactionStreamSecured
}) {
  iotaTransactionStreamIP = localIotaTransactionStreamIP
  iotaTransactionStreamPort = localIotaTransactionStreamPort
  isIotaTransactionStreamSecured = localIsIotaTransactionStreamSecured

  tryWebSocketConnection()

  return {
    setTransactionCallback,
    start,
    stop,
    getTransactionsPerSecond,
    eventEmitter
  }
}
