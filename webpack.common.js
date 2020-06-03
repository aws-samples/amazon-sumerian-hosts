// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

const corePath = path.resolve(__dirname, './src/core/');
const threePath = path.resolve(__dirname, 'src/three.js/');
const babylonPath = path.resolve(__dirname, 'src/Babylon.js/');

const baseConfig = {
  mode: 'production',
  devtool: 'eval-source-map',
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    library: 'HOST',
    libraryTarget: 'umd',
    libraryExport: 'default',
    umdNamedDefine: true,
    globalObject: '(typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : this)'
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        sourceMap: true,
        parallel: true,
      }),
    ],
  },
  module: {
    rules: [
      {
        test: /\.(ico)$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'file-loader?name=[name].[ext]',
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /(node_modules|bower_components)/,
        query: {
          presets: ['@babel/preset-env'],
        },
      },
    ],
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: `Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.\nSPDX-License-Identifier: MIT-0`,
      entryOnly: true
    }),
  ],
  resolve: {
    alias: {
      core: corePath,
    },
  },
};

const coreConfig = {
  ...baseConfig,
  entry: {
    'host.core': ['babel-polyfill', './src/core/index.js'],
  },
  resolve: {
    alias: {
      ...baseConfig.resolve.alias,
      app: corePath,
    },
  },
};

const threeConfig = {
  ...baseConfig,
  entry: {
    'host.three': ['babel-polyfill', './src/three.js/index.js'],
  },
  resolve: {
    alias: {
      ...baseConfig.resolve.alias,
      app: threePath,
    },
  },
};

const babylonConfig = {
  ...baseConfig,
  entry: {
    'host.babylon': ['babel-polyfill', './src/Babylon.js/index.js'],
  },
  resolve: {
    alias: {
      ...baseConfig.resolve.alias,
      app: babylonPath,
    },
  },
};

module.exports = [coreConfig, threeConfig, babylonConfig];
