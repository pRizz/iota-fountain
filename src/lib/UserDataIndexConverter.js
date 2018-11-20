/*!
 * IOTA Fountain
 * Copyright(c) 2018 Peter Ryszkiewicz
 * MIT Licensed
 */

// Hack class until user data can be attached to particles or particle groups

const n256pow1 = 256 ** 1
const n256pow2 = 256 ** 2
const n256pow3 = 256 ** 3

function userDataIndexFromColor({ r, g, b, a }) {
  return r * n256pow3 + g * n256pow2 + b * n256pow1 + a
}

function colorFromUserDataIndex({ userDataIndex }) {
  let r, g, b, a, quotient

  quotient = Math.trunc(userDataIndex / n256pow3)
  r = quotient
  userDataIndex -= quotient * n256pow3

  quotient = Math.trunc(userDataIndex / n256pow2)
  g = quotient
  userDataIndex -= quotient * n256pow2

  quotient = Math.trunc(userDataIndex / n256pow1)
  b = quotient
  userDataIndex -= quotient * n256pow1

  a = userDataIndex

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
