// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

const cognitoIdentityPoolId = require('./demo-credentials');

// If we are running an interactive devserver
const isDevServer =
  process.env.ENGINE || process.env.NODE_ENV === 'development';

// By default, devServer will open slash
// but we have build scripts for core and each engine
let webpackOpenUrls = ['/'];

if (process.env.ENGINE === 'core') {
  webpackOpenUrls = [
    '/packages/amazon-sumerian-hosts-core/test/integration_test/core/',
  ];
} else if (process.env.ENGINE === 'three') {
  webpackOpenUrls = [
    '/packages/amazon-sumerian-hosts-three/examples/three.html',
    '/packages/amazon-sumerian-hosts-three/test/integration_test/three.js/',
  ];
} else if (process.env.ENGINE === 'babylon') {
  webpackOpenUrls = [
    '/packages/amazon-sumerian-hosts-babylon/test/integration_test/Babylon.js/',
    '/packages/demos-babylon/src/',
  ];
}

let devServerOnlyEntryPoints = {};

// During a github build we pull the git commit sha out of the environment
// for local builds we hardcode 'development', so we can differentiate these(i.e. in dev the commit hash is not really accurate)
const HOSTS_VERSION = JSON.stringify(process.env.GITHUB_SHA || 'development');

let prodOnlyExternals = [];

if (isDevServer) {
  // Only build the demos & tests if we are running in the dev server
  devServerOnlyEntryPoints = {
    helloWorldDemo: {
      import: './packages/demos-babylon/src/helloWorldDemo.js',
      filename: './packages/demos-babylon/dist/[name].js',
    },
    gesturesDemo: {
      import: './packages/demos-babylon/src/gesturesDemo.js',
      filename: './packages/demos-babylon/dist/[name].js',
    },
    customCharacterDemo: {
      import: './packages/demos-babylon/src/customCharacterDemo.js',
      filename: './packages/demos-babylon/dist/[name].js',
    },
    chatbotDemo: {
      import: './packages/demos-babylon/src/chatbotDemo.js',
      filename: './packages/demos-babylon/dist/[name].js',
    },
    textToSpeechTest: {
      import:
        './packages/amazon-sumerian-hosts-babylon/test/integration_test/Babylon.js/babylon.texttospeech.js',
      filename:
        './packages/amazon-sumerian-hosts-babylon/test/integration_test/Babylon.js/dist/[name].js',
    },
    animationTest: {
      import:
        './packages/amazon-sumerian-hosts-babylon/test/integration_test/Babylon.js/babylon.animation.js',
      filename:
        './packages/amazon-sumerian-hosts-babylon/test/integration_test/Babylon.js/dist/[name].js',
    },
  };
} else {
  // do not bundle peer dependencies, unless we're running demos
  prodOnlyExternals = [
    // eslint-disable-next-line no-unused-vars
    function({context, request}, callback) {
      if (/^@babylonjs\/core.*$/.test(request)) {
        return callback(null, {
          root: 'BABYLON',
          commonjs: '@babylonjs/core',
          commonjs2: '@babylonjs/core',
          amd: '@babylonjs/core',
        });
      } else if (/^@babylonjs\/loaders.*$/i.test(request)) {
        return callback(null, {
          root: 'BABYLON',
          commonjs: '@babylonjs/loaders',
          commonjs2: '@babylonjs/loaders',
          amd: '@babylonjs/loaders',
        });
      }
      callback();
    },
  ];
}

module.exports = {
  // Turn on source maps if we aren't doing a production build, so tests and `start` for the examples.
  devtool: process.env.NODE_ENV === 'development' ? 'source-map' : undefined,
  entry: {
    'host.core': {
      import: './packages/amazon-sumerian-hosts-core/src/core/index.js',
      filename: './packages/amazon-sumerian-hosts-core/dist/[name].js',
    },
    'host.babylon': {
      import:
        './packages/amazon-sumerian-hosts-babylon/src/Babylon.js/index.js',
      filename: './packages/amazon-sumerian-hosts-babylon/dist/[name].js',
    },
    'host.three': {
      import: './packages/amazon-sumerian-hosts-three/src/three.js/index.js',
      filename: './packages/amazon-sumerian-hosts-three/dist/[name].js',
    },
    ...devServerOnlyEntryPoints,
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname),
    library: {
      name: 'HOST',
      type: 'umd',
      umdNamedDefine: true,
    },
    globalObject:
      '(typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : this)',
    hotUpdateChunkFilename: '.hot-reload/[id].[fullhash].hot-update.js',
    hotUpdateMainFilename: '.hot-reload/[runtime].[fullhash].hot-update.json',
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: `Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.\nSPDX-License-Identifier: MIT-0`,
      entryOnly: true,
    }),
    new webpack.DefinePlugin({HOSTS_VERSION}),
  ],
  devServer: {
    devMiddleware: {
      // HTML files aren't fully modeled in webpack and may refer to on-dsk files
      // So let's make sure these get written out when watching
      writeToDisk: true,
    },
    open: webpackOpenUrls,
    liveReload: true,
    hot: true,
    static: {
      directory: path.join(__dirname),
      watch: true,
    },
    setupMiddlewares: (middlewares, devServer) => {
      // Let's create a fake file to serve up config to be used by the tests
      // At some point we may move all the tests to be Webpack entry points and this could be easier
      // But this makes things straight forward to use from our raw HTML files
      devServer.app.get('/devConfig.json', (_, res) => {
        res.json({cognitoIdentityPoolId});
      });
      return middlewares;
    },
  },
  // We need to override some of the defaults for the minimization step --
  // There are issues with mangling otherwise, as logic relies on class names being preserved
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_classnames: true,
        },
      }),
    ],
  },
  resolve: {
    modules: ['node_modules'],
    // don't import @babylonjs/core from the submodule's dependencies,
    // but from the project dependencies
    alias: {
      '@babylonjs/core': path.resolve('./node_modules/@babylonjs/core'),
    },
  },
  externals: [...prodOnlyExternals],
  target: 'browserslist',
};
