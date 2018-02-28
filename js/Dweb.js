// Stub to run browserify on
// Javascript library for dweb
// The crypto uses https://github.com/jedisct1/libsodium.js but https://github.com/paixaop/node-sodium may also be suitable if we move to node
window.Dweb = { }
// This makes them available as "sodium" and "Dweb" from test.html etc
//window.sodium = require("libsodium-wrappers");  // Needed for cryptotest maybe move there ?

Dweb.errors = require('./Errors');
Dweb.Transportable = require('./Transportable');
Dweb.Block = require('./Block');
Dweb.SmartDict = require("./SmartDict");
Dweb.KeyPair = require("./KeyPair");
Dweb.Signature = require("./Signature");
Dweb.PublicPrivate = require("./PublicPrivate");
Dweb.CommonList = require("./CommonList");
Dweb.KeyValueTable = require("./KeyValueTable");
Dweb.AccessControlList = require("./AccessControlList");
Dweb.KeyChain = require('./KeyChain');
Dweb.VersionList = require('./VersionList');
Dweb.StructuredBlock = require('./StructuredBlock'); //TODO - will remove SB once have path traversal.
Dweb.EventListenerHandler = require("./EventListenerHandler");
Dweb.Domain = require("./Domain");
Dweb.Leaf = Dweb.Domain.clsLeaf;
Dweb.Transports = require('./Transports'); // Handles multiple transports

