'use strict'
const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const bitcoinAppConfig = {
  VUE_APP_TITLE: "Bitcoin Fountain",
  VUE_APP_URL: "https://www.bitcoin-fountain.com",
  VUE_APP_SOCIAL_IMAGE: "https://www.bitcoin-fountain.com/iota-fountain-reduced.png",
  VUE_APP_DESCRIPTION: "Watch transactions flow on the Bitcoin network"
}

const iotaAppConfig = {
  VUE_APP_TITLE: "IOTA Fountain",
  VUE_APP_URL: "https://www.iota-fountain.com",
  VUE_APP_SOCIAL_IMAGE: "https://www.iota-fountain.com/iota-fountain-reduced.png",
  VUE_APP_DESCRIPTION: "Watch transactions flow on the IOTA network"
}

let activeConfig = iotaAppConfig

if(process.env.VUE_APP_BITCOIN_FOUNTAIN) {
  activeConfig = bitcoinAppConfig
}

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
