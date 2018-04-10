module.exports = {
  entry: {
    'sw_server': './sw_server.js',
    'sw_client': './sw_client.js'
  },
  output: {
    filename: '[name]_bundle.js',
    path: __dirname
  },
    node: {
        fs: 'empty',
        net: 'empty',
        tls: 'empty',
        crypto: 'empty',
        process: true,
        module: false,
        clearImmediate: false,
        Buffer: true,
        setImmediate: false,
        console: false
    },

    resolve: {
        alias: {
            zlib: 'browserify-zlib-next'
        }
    }
}
