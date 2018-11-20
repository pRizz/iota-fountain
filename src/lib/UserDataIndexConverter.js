/*!
 * IOTA Fountain
 * Copyright(c) 2018 Peter Ryszkiewicz
 * MIT Licensed
 */

// Hack class until user data can be attached to particles or particle groups

function userDataIndexFromColor({ r, g, b, a }) {
  return r * (256 ** 3) + g * (256 ** 2) + b * 256 + a // TODO: optimize
}

function colorFromUserDataIndex({ userDataIndex }) {
  let r, g, b, a

  r = 0
  g = 0
  b = 0
  a = userDataIndex // FIXME

  return new b2ParticleColor(r, g, b, a)
}

function userDataIndexFromColorBuffer({ colorBuffer, index }) {
  return userDataIndexFromColor({
    r: colorBuffer[index * 4],
    g: colorBuffer[index * 4 + 1],
    b: colorBuffer[index * 4 + 2],
    a: colorBuffer[index * 4 + 3]
  })
}

export default {
  colorFromUserDataIndex,
  userDataIndexFromColorBuffer
}
