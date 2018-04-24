const CopyWebpackPlugin = require('copy-webpack-plugin');
module.exports = {
    entry: { // This wont work till have something need to webpack !
        //'dweb-serviceworker': './dweb-serviceworker.js',
        //'dweb-serviceworker-boot': './dweb-serviceworker-boot.js',
        //'dweb-serviceworker-proxy': './dweb-serviceworker-proxy.js'
    },
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
        filename: 'archive_bundle.js',
        path: __dirname + '/dist'
    },
    //plugins: [HTMLWebpackPluginConfig]

    plugins: [
        new CopyWebpackPlugin(
            [
                { from: '../../dweb-transports/dist/dweb-transports-bundle.js', to: './' },
                { from: '../../dweb-objects/dist/dweb-objects-bundle.js', to: './' },
                { from: '../../dweb-serviceworker/dist/dweb-serviceworker-bundle.js', to: './' },
                { from: '../../dweb-serviceworker/dist/dweb-serviceworker-proxy-bundle.js', to: './' },
                { from: '../../dweb-serviceworker/dist/dweb-serviceworker-boot.js', to: './' },
            ],
            { }
        )
    ]
};
