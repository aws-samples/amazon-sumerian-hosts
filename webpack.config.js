// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
const path = require('path');
const webpack = require('webpack');

// By default, devServer will open slash
// but we have build scripts for core and each engine
let webpackOpenUrls = ["/"];

if (process.env.ENGINE === "core") {
  webpackOpenUrls = ['/packages/amazon-sumerian-hosts-core/test/integration_test/core/'];
}
else if (process.env.ENGINE === "three") {
  webpackOpenUrls = ['/packages/amazon-sumerian-hosts-three/examples/three.html', '/packages/amazon-sumerian-hosts-three/test/integration_test/three.js/'];
}
else if (process.env.ENGINE === "babylon") {
  webpackOpenUrls = ['/packages/demos-babylon/src/', '/packages/amazon-sumerian-hosts-babylon/test/integration_test/Babylon.js/'];
}

module.exports = {
  // Turn on source maps if we aren't doing a production build, so tests and `start` for the examples.
  devtool: process.env.NODE_ENV === "development" ? "source-map" : undefined,
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
    helloWorldDemo: {
      import: './packages/demos-babylon/src/helloWorldDemo.js',
      filename: "./packages/demos-babylon/dist/[name].js",
    },
    gesturesDemo: {
      import: './packages/demos-babylon/src/gesturesDemo.js',
      filename: "./packages/demos-babylon/dist/[name].js",
    },
    customCharacterDemo: {
      import: './packages/demos-babylon/src/customCharacterDemo.js',
      filename: "./packages/demos-babylon/dist/[name].js",
    }
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
    open: webpackOpenUrls,
    liveReload: true,
    hot: true,
    static: {
      directory: path.join(__dirname),
      watch: true,
    },
  }
}