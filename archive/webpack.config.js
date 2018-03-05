//Based on https://www.codecademy.com/articles/react-setup-v
//ARCHIVE-BROWSER the HTMLWebPackPlugin seems to be what configures what webpack serves on localhost:8080
var HTMLWebpackPlugin = require('html-webpack-plugin');
var HTMLWebpackPluginConfig = new HTMLWebpackPlugin({
    template: __dirname + '/archive.html',
    inject: 'head',
    filename: __dirname + '/../examples/archive.html',
});

module.exports = {
    entry: __dirname + '/archive.js',
    module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /(node_modules|bower_components)/,
                    use: {
                        loader: 'babel-loader'
                        //options: {
                        //    presets: ['@babel/preset-env']
                        //}
                    }
                }
            ]
    },
    node: {
        //I copied this section from someone else's version that worked for WebTorrent, definately need fs, unclear if need others.
        //global: true,
        crypto: 'empty',
        fs: 'empty',
        process: true,
        module: false,
        clearImmediate: false,
        setImmediate: false,
        console: false
    },
    output: {
        filename: 'archive_webpacked.js',
        path: __dirname + '/../examples'
    },
    plugins: [HTMLWebpackPluginConfig]
};
