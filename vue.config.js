'use strict'
const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')

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