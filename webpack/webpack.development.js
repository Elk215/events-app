'use strict';

const HtmlWebpackPlugin = require('html-webpack-plugin');

const development = {
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html',
    }),
  ]
};

module.exports = development;
