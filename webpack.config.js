// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import path from 'path';
// import { fileURLToPath } from 'url';
import webpack from 'webpack';
import CopyPlugin from 'copy-webpack-plugin';
import cognitoIdentityPoolId from './demo-credentials.js';


// This is how we get the equivalent of Node's __dirname in an ES6 module
const __dirname = new URL('.', import.meta.url).pathname;

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
  webpackOpenUrls = ['/packages/demos-babylon/dist/', '/packages/amazon-sumerian-hosts-babylon/test/integration_test/Babylon.js/'];
}


class WatchRunPlugin {
  apply(compiler) {
      compiler.hooks.watchRun.tap('WatchRun', (comp) => {
          if (comp.modifiedFiles) {
              const changedFiles = Array.from(comp.modifiedFiles, (file) => `\n  ${file}`).join('');
              console.log('===============================');
              console.log('FILES CHANGED:', changedFiles);
              console.log('===============================');
          }
      });
  }
}

export default {
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
    }),
    // Copy the demo/test static assets to the dist directories
    // The integration test HTML files get the cognito Id substituted during the copy
    new CopyPlugin({
      patterns: [
        {
          from: "*.html",
          to: 'dist/',
          context: 'packages/demos-babylon'
        },
        {
          from: '*',
          to: "./packages/amazon-sumerian-hosts-core/dist/integration_tests/",
          context: "packages/amazon-sumerian-hosts-core/test/integration_test/core",
          transform(content) {
            return content
              .toString()
              .replace('$COGNITO_POOL_ID', cognitoIdentityPoolId);
          },
        }
      ]
    }),
    new webpack.WatchIgnorePlugin({paths:["packages/demos-babylon/dist/*"]}),
    new WatchRunPlugin(),

  ],
  devServer: {
    devMiddleware: {
      // HTML files aren't fully modeled in webpack and may refer to on-dsk files
      // So let's make sure these get written out when watching
      writeToDisk: true
    },
    open: webpackOpenUrls,
    liveReload: true,
    hot: true,
    // watchOptions: {
    //   ignored: ["packages/demos-babylon"]
    // },
  
    static: {
      directory: path.join(__dirname),
      watch: true,
    },
    onBeforeSetupMiddleware: (devServer) => {
      devServer.app.get('/devConfig.json', (req, res) => {
        res.json({ cognitoIdentityPoolId });
      });
    }
  }
}
