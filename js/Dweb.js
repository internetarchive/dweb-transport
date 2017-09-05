//exports.TransportHTTP = require('./TransportHTTP');   //TODO-IPFS breaks
exports.Block = require('./Block');
exports.SmartDict = require("./SmartDict");
exports.KeyPair = require("./KeyPair");
exports.Signature = require("./Signature");
exports.CommonList = require("./CommonList");
exports.AccessControlList = require("./AccessControlList");
exports.KeyChain = require('./KeyChain');
exports.TransportIPFS = require('./TransportIPFS');
//* Later libraries //TODO-REL4 comment out before REL4
exports.StructuredBlock = require('./StructuredBlock');
exports.MutableBlock = require("./MutableBlock");
//*/

const table2class = { // Each of these needs a constructor that takes data and is ok with no other parameters, (otherwise define a set of these methods as factories)
    "cl": "CommonList",
    "sb": "StructuredBlock",
    "kc": "KeyChain",
    "kp": "KeyPair",
    "mb": "MutableBlock",
    "acl": "AccessControlList",
    "sd": "SmartDict",
};



Url = require("url"); // Doesnt appear to be needed - also gets node interface which looks different

// Javascript library for dweb
// The crypto uses https://github.com/jedisct1/libsodium.js but https://github.com/paixaop/node-sodium may also be suitable if we move to node

exports.utils = {}; //utility functions
exports.errors = require("./Errors");
exports.transports = {}; // Transports - instances NOT CLASSES of loaded transports

/* Only applicable to HTTP...
    exports.dwebserver = 'localhost';
    //exports.dwebserver = '192.168.1.156';
    exports.dwebport = '4243';
*/
exports.keychains = [];
exports.transportpriority = []; // First on list is top priority

//TODO-ASYNC - fix objbrowser esp its path
// ==== OBJECT ORIENTED JAVASCRIPT ===============

// These are equivalent of python exceptions, will log and raise alert in most cases - exceptions aren't caught

exports.utils.SecurityWarning = function(msg, self) {
    console.log("Security Warning:", msg, self);
    alert("Security Warning: "+ msg);
};

// Utility function to print a array of items but just show number and last.
exports.utils.consolearr  = (arr) => ((arr && arr.length >0) ? [arr.length+" items inc:", arr[arr.length-1]] : arr );

// Utility functions

exports.utils.mergeTypedArraysUnsafe = function(a, b) { // Take care of inability to concatenate typed arrays
    //http://stackoverflow.com/questions/14071463/how-can-i-merge-typedarrays-in-javascript also has a safe version
    const c = new a.constructor(a.length + b.length);
    c.set(a);
    c.set(b, a.length);
    return c;
};

exports.transport = function(url) { //TODO-REL4-API
    /*
    Pick between associated transports based on URL

    url     URL or string that can be parsed into a URL
    returns subclass of Transport that can support this kind of URL or undefined if none.
    */
    //TODO-efficiency, could parse URL once at higher level and pass URL down
    if (url && (typeof url === 'string')) {
        url = Url.parse(url);    // For efficiency, only parse once.
    }
    return exports.transportpriority.find((t) => t.supports(url))  // First transport that can support this URL
}
