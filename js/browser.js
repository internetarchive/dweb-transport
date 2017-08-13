// Stub to run browserify on
// This makes them available as "sodium" and "Dweb" from test.html etc
window.Dweb = require('./Dweb');
window.sodium = require("libsodium-wrappers");  // Needed for cryptotest
//window.IpfsIiifDb = require('ipfs-iiif-db');  // Currently fails in browserify - doesnt load anything after this
window.TransportIPFS = require('./TransportIPFS');
//window.TransportHTTP = require('./TransportHTTP');
