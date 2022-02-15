// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
const webpack = require('webpack');
const path = require('path');

const babylonPath = path.resolve(__dirname, './src/Babylon.js/');

const baseConfig = {
  mode: 'none',
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
          }
        ],
        exclude: /(node_modules|bower_components)/,
      },
    ],
  },
  devtool: 'eval-source-map',
};

const babylonConfig = {
  ...baseConfig,
  resolve: {
    alias: {
      app: babylonPath,
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      BABYLON: 'babylonjs',
    }),
  ],
};

module.exports = [babylonConfig];
