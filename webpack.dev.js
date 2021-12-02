// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
const merge = require('webpack-merge');
const path = require('path');
const common = require('./webpack.common.js');

module.exports = merge(common[0], {
  mode: 'development',
  devtool: 'eval-source-map',
  devServer: {
    open: 'Google Chrome',
    liveReload: true,
    hot: false,
    static: {
      directory: path.join(__dirname),
      watch: true,
    }
  },
});
