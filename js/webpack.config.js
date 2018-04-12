module.exports = {
  entry: {
    'serviceworker': './serviceworker.js',
    'test_serviceworker': './test_serviceworker.js'
  },
  output: {
    filename: '[name]_bundle.js',
    path: __dirname + '/../examples'
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
