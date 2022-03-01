// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// This file extends the base webpack with some stuff so Karma can run the tests
const webpack = require('webpack');
const baseConfig = require("./webpack.config");

const testConfig = {
  ...baseConfig,
  plugins: [
    ...baseConfig.plugins,
    // Babylon/three are peerDependencies and are expected to be loaded on the page
    // We emulate that with ProvidePlugin like this
    new webpack.ProvidePlugin({
      BABYLON: 'babylonjs',
    }),
    new webpack.ProvidePlugin({
      THREE: 'three',
    }),
  ]
};

module.exports = testConfig;
