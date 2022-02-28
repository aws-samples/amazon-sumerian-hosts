// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
const webpackConfig = require('./webpack.test');

const TEST_BROWSERS =
  process.env.TEST_BROWSERS !== undefined
    ? process.env.TEST_BROWSERS.split(',')
      .map(s => s.trim())
      .filter(s => s !== '')
    : ['Chrome'];
console.log(`TEST_BROWSERS=${TEST_BROWSERS.join(',')}`);

module.exports = function(config) {
  config.set({
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine', 'webpack'],

    client: {
      jasmine: {
        random: false,
      },
    },

    plugins: [
      'karma-jasmine',
      'karma-webpack',
      'karma-firefox-launcher',
      'karma-chrome-launcher',
      'karma-spec-reporter',
    ],

    // list of files / patterns to load in the browser
    files: [
      '../../node_modules/regenerator-runtime/runtime.js',
      'test/unit/**/*.spec.js',
      {
        pattern: 'test/assets/*',
        watched: false,
        served: true,
        included: false,
      },
    ],

    // list of files / patterns to exclude
    exclude: [],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/unit/**/*.spec.js': ['webpack'],
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['spec'],

    specReporter: {
      suppressErrorSummary: false, // print error summary
      suppressFailed: false, // print information about failed tests
      suppressPassed: false, // print information about passed tests
      suppressSkipped: false, // print information about skipped tests
      showSpecTiming: true, // print the time elapsed for each spec
    },

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: TEST_BROWSERS,

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,

    webpack: webpackConfig,

    webpackServer: {
      noInfo: true,
    },
  });
};
