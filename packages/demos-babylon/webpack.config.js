const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'eval-source-map',
  resolve: {
    modules: ['node_modules'],
  },
  plugins: [
    // This CopyPlugin config ensures that all static assets used for the demos
    // are included in the build including HTML, CSS, images, and the character
    // assets.
    new CopyPlugin({
      patterns: [
        {
          from: '**/*.*',
          context: 'src/',
          globOptions: { ignore: ['**/*.js' ]}
        }
      ]
    }),
  ],
  entry: {
    helloWorldDemo: './src/helloWorldDemo.js',
    gesturesDemo: './src/gesturesDemo.js',
    customCharacterDemo: './src/customCharacterDemo.js',
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  devServer: {
    open: ['/'],
    liveReload: true,
    hot: false,
    static: {
      directory: path.join(__dirname),
      watch: true,
    },
  },
};