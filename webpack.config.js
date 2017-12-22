const path = require('path');
const BabiliWebpackPlugin = require('babel-minify-webpack-plugin');
const UglifyWebpackPlugin = require('uglifyjs-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
    entry: [
        './src/js/index.js',
        './src/scss/google-maps.scss'
    ],
    output: {
        filename: 'js/google-maps.min.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                test: /\.(sass|scss)$/,
                loader: ExtractTextPlugin.extract(['css-loader', 'sass-loader?outputStyle=compressed'])
            }
        ]
    },
    plugins: [
        // new UglifyWebpackPlugin(),
        new BabiliWebpackPlugin(),
        new ExtractTextPlugin('css/google-maps.min.css'),
    ],
};