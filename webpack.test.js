// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// This file extends the base webpack with some stuff so Karma can run the tests
const webpack = require('webpack');
const baseConfig = require('./webpack.config');

// Removing the output will stop webpack from outputing chunks for the integration test code
delete baseConfig.output;

// We need external dependencies to be packaged with the tests so that they may run
delete baseConfig.externals;

module.exports = {
  ...baseConfig,
  plugins: [
    ...baseConfig.plugins,
    // three is a peerDependency and is expected to be loaded on the page
    // We emulate that with ProvidePlugin like this
    new webpack.ProvidePlugin({
      THREE: 'three',
    }),
  ],
};
