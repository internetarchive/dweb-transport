// Stub to run browserify on
// Javascript library for dweb
// The crypto uses https://github.com/jedisct1/libsodium.js but https://github.com/paixaop/node-sodium may also be suitable if we move to node
window.Dweb = { }
// This makes them available as "sodium" and "Dweb" from test.html etc
//window.sodium = require("libsodium-wrappers");  // Needed for cryptotest maybe move there ?

Dweb.Transports = require('dweb-transports'); // Handles multiple transports    //TODO-REFACTOR start using window.DwebTransports

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
Dweb.EventListenerHandler = require("./EventListenerHandler");
Dweb.Domain = require("./Domain");
Dweb.Leaf = Dweb.Domain.clsLeaf;
// Note that no transports are required here, the ones used are loaded in ../archive/archive.js or ./Dweb_alltransports.js
Dweb.utils = require('./utils.js'); // Some short functions of relevance multiple places.
