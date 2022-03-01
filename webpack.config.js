// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: {
    'host.core': {
      import: ['babel-polyfill', './packages/amazon-sumerian-hosts-core/src/core/index.js'],
      filename: "./packages/amazon-sumerian-hosts-core/dist/[name].js",
    },
    'host.babylon': {
      import: './packages/amazon-sumerian-hosts-babylon/src/Babylon.js/index.js',
      filename: "./packages/amazon-sumerian-hosts-babylon/dist/[name].js",
    },
    'host.three': {
      import: './packages/amazon-sumerian-hosts-three/src/three.js/index.js',
      filename: "./packages/amazon-sumerian-hosts-three/dist/[name].js",
    },
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname),
    library: {
      name: 'HOST',
      type: 'umd',
      umdNamedDefine: true,
    },
    globalObject: '(typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : this)',
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: `Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.\nSPDX-License-Identifier: MIT-0`,
      entryOnly: true,
    })
  ],
  devServer: {
    open: ['/'],
    liveReload: true,
    hot: false,
    static: {
      directory: path.join(__dirname),
      watch: true,
    },
  }
}