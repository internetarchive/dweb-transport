//Based on https://www.codecademy.com/articles/react-setup-v
//ARCHIVE-BROWSER the HTMLWebPackPlugin seems to be what configures what webpack serves on localhost:8080
var HTMLWebpackPlugin = require('html-webpack-plugin');
var HTMLWebpackPluginConfig = new HTMLWebpackPlugin({
    template: __dirname + '/archive.html',
    inject: 'body'
});

module.exports = {
    entry: __dirname + '/archive.js',
    module: {
        loaders: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader'
            }
        ]
    },
    output: {
        filename: 'archive_webpacked.js',
        path: __dirname + '/build'
    },
    plugins: [HTMLWebpackPluginConfig]
};
