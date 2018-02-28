const errors = require('./Errors');
// SEE-OTHER-ADDTRANSPORT */
exports.Transportable = require('./Transportable');
exports.Block = require('./Block');
exports.SmartDict = require("./SmartDict");
exports.KeyPair = require("./KeyPair");
exports.Signature = require("./Signature");
exports.PublicPrivate = require("./PublicPrivate");
exports.CommonList = require("./CommonList");
exports.KeyValueTable = require("./KeyValueTable");
exports.AccessControlList = require("./AccessControlList");
exports.KeyChain = require('./KeyChain');
exports.VersionList = require('./VersionList');
exports.StructuredBlock = require('./StructuredBlock'); //TODO - will remove SB once have path traversal.
exports.EventListenerHandler = require("./EventListenerHandler");
exports.Domain = require("./Domain");
exports.Leaf = exports.Domain.clsLeaf;
exports.Transports = require('./Transports'); // Handles multiple transports

// Javascript library for dweb
// The crypto uses https://github.com/jedisct1/libsodium.js but https://github.com/paixaop/node-sodium may also be suitable if we move to node

exports.objbrowser = function(el, {maxdepth=2, verbose=false}={}) {
    if (typeof el === 'string') el = document.getElementById(el);
    (new SmartDict()).objbrowser_arrayobj(el, "keychains", KeyChain.keychains, {links: true});
};
