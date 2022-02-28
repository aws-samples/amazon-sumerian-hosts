// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
const path = require('path');

const corePath = path.resolve(__dirname, './src/core/');

const baseConfig = {
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            },
          },
        ],
        exclude: /(node_modules|bower_components)/,
      },
    ],
  },
  devtool: 'eval-source-map',

  resolve: {
    alias: {
      core: corePath,
    },
  },
};

const coreConfig = {
  ...baseConfig,
  resolve: {
    alias: {
      ...baseConfig.resolve.alias,
      app: corePath,
    },
  },
};

module.exports = coreConfig;
