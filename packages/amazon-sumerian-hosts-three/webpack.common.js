// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

const threePath = path.resolve(__dirname, 'src/three.js/');

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
    globalObject:
      '(typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : this)',
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          sourceMap: true,
        },
      }),
    ],
  },
  module: {
    rules: [
      {
        test: /\.(ico)$/,
        exclude: /(node_modules|bower_components)/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
            },
          },
        ],
      },
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
  plugins: [
    new webpack.BannerPlugin({
      banner: `Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.\nSPDX-License-Identifier: MIT-0`,
      entryOnly: true,
    }),
  ],
};

const threeConfig = {
  ...baseConfig,
  entry: {
    'host.three': ['babel-polyfill', './src/three.js/index.js'],
  },
  resolve: {
    alias: {
      app: threePath,
    },
  },
};

module.exports = threeConfig;
