/*!
 * IOTA Fountain
 * Copyright(c) 2018 Peter Ryszkiewicz
 * MIT Licensed
 */

import Emitter from 'events'

const emitter = new Emitter()
const bufferedItems = []
const emissionDelay = 50

function itemReceived(item) {
  bufferedItems.push(item)
}

const emissionInterval = setInterval(() => {
  const bufferedItem = bufferedItems.shift()
  if(bufferedItem === undefined) { return }

  emitter.emit('item', bufferedItem)
}, emissionDelay)

// TODO: refactor to subclass Emitter
export default {
  itemReceived,
  emitter
}
