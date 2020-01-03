'use strict'
const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')

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
    throw `Must supply exactly one of ${JSON.stringify(coinFlags)}, in the environment`
  }

  return existingCoinFlags.values().next().value
}

const socialConfigs = {
  VUE_APP_BITCOIN_FOUNTAIN: {
    VUE_APP_TITLE: "Bitcoin Fountain",
    VUE_APP_URL: "https://www.bitcoin-fountain.com",
    VUE_APP_SOCIAL_IMAGE: "https://www.bitcoin-fountain.com/bitcoin-fountain-reduced.png",
    VUE_APP_DESCRIPTION: "Watch transactions flow on the Bitcoin network"
  },
  VUE_APP_IOTA_FOUNTAIN: {
    VUE_APP_TITLE: "IOTA Fountain",
    VUE_APP_URL: "https://www.iota-fountain.com",
    VUE_APP_SOCIAL_IMAGE: "https://www.iota-fountain.com/iota-fountain-reduced.png",
    VUE_APP_DESCRIPTION: "Watch transactions flow on the IOTA network"
  },
  VUE_APP_NANO_FOUNTAIN: {
    VUE_APP_TITLE: "NANO Fountain",
    VUE_APP_URL: "https://www.nano-fountain.com",
    VUE_APP_SOCIAL_IMAGE: "https://www.nano-fountain.com/nano-fountain-reduced.png",
    VUE_APP_DESCRIPTION: "Watch transactions flow on the NANO network"
  }
}

function getActiveSocialConfig() {
  return socialConfigs[getCurrentCoinKey()]
}

const activeConfig = getActiveSocialConfig()

process.env = {...process.env, ...activeConfig}

module.exports = {
  configureWebpack: {
    plugins: [
      new CopyWebpackPlugin([
        {
          from: path.resolve(__dirname, './node_modules/liquidfun-prizz/liquidfun.js'),
          to: 'static',
          ignore: ['.*']
        }
      ])
    ]
  }
}
