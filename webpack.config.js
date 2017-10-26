const path = require('path');

module.exports = {
    entry: './src/js/index.js',
    output: {
        filename: 'google-maps.js',
        path: path.resolve(__dirname, 'dist/js')
    }
};