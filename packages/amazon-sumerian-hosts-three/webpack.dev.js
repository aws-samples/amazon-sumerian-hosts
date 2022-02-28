// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
const {merge} = require('webpack-merge');
const path = require('path');
const common = require('./webpack.common');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-source-map',
  resolve: {
    modules: [path.resolve(__dirname, '../../node_modules'), 'node_modules'],
  },
  devServer: {
    open: 'Google Chrome',
    liveReload: true,
    hot: false,
    static: {
      directory: path.join(__dirname),
      watch: true,
    },
  },
});
