//exports.TransportHTTP = require('./TransportHTTP');   //TODO-IPFS breaks
exports.Block = require('./Block');
exports.SmartDict = require("./SmartDict");
exports.KeyPair = require("./KeyPair");
exports.Signature = require("./Signature");
exports.CommonList = require("./CommonList");
/* Later libraries
exports.StructuredBlock = require('./StructuredBlock');
exports.MutableBlock = require('./MutableBlock');
exports.CryptoLib = require('./CryptoLib');
exports.KeyChain = require('./KeyChain');
exports.MutableBlock = require("./MutableBlock");
exports.AccessControlList = require("./AccessControlList");
*/

// Javascript library for dweb
// The crypto uses https://github.com/jedisct1/libsodium.js but https://github.com/paixaop/node-sodium may also be suitable if we move to node

exports.utils = {}; //utility functions
exports.errors = {}; //Errors - as classes

/* Only applicable to HTTP...
    exports.dwebserver = 'localhost';
    //exports.dwebserver = '192.168.1.156';
    exports.dwebport = '4243';
*/
exports.keychains = [];

//TODO-ASYNC - fix objbrowser esp its path
// ==== OBJECT ORIENTED JAVASCRIPT ===============

// These are equivalent of python exceptions, will log and raise alert in most cases - exceptions aren't caught

exports.utils.SecurityWarning = function(msg, self) {
    console.log("Security Warning:", msg, self);
    alert("Security Warning: "+ msg);
};

exports.utils.consolearr  = (arr) => ((arr && arr.length >0) ? [arr.length+" items inc:", arr[arr.length-1]] : arr );

class ToBeImplementedError extends Error {
    constructor(message) {
        super("To be implemented: " + message);
        this.name = "ToBeImplementedError"
    }
}
exports.errors.ToBeImplementedError = ToBeImplementedError;

//TODO TransportError is wanted in TransportHTTP but its out of scope there. Think about moving to Transport class
class TransportError extends Error {
    constructor(message) {
        super(message || "Transport failure");
        this.name = "TransportError"
    }
}
exports.errors.TransportError = TransportError;

// Use this when the code logic has been broken - e.g. something is called with an undefined parameter, its preferable to console.assert
// Typically this is an error, that should have been caught higher up.
class CodingError extends Error {
    constructor(message) {
        super(message || "Coding Error");
        this.name = "CodingError"
    }
}
exports.errors.CodingError = CodingError;

// Use this when the logic of encryption wont let you do something, typically something higher should have stopped you trying.
// Examples include signing something when you only have a public key.
class EncryptionError extends Error {
    constructor(message) {
        super(message || "Encryption Error");
        this.name = "EncryptionError"
    }
}
exports.errors.EncryptionError = EncryptionError;

class ForbiddenError extends Error {
    constructor(message) {
        super(message || "Forbidden failure");
        this.name = "ForbiddenError"
    }
}
exports.errors.ForbiddenError = ForbiddenError;

class AuthenticationError extends Error {
    constructor(message) {
        super(message || "Authentication failure");
        this.name = "AuthenticationError"
    }
}
exports.errors.AuthenticationError = AuthenticationError;


// Utility functions

exports.utils.mergeTypedArraysUnsafe = function(a, b) { // Take care of inability to concatenate typed arrays
    //http://stackoverflow.com/questions/14071463/how-can-i-merge-typedarrays-in-javascript also has a safe version
    const c = new a.constructor(a.length + b.length);
    c.set(a);
    c.set(b, a.length);
    return c;
};


// ==== NON OBJECT ORIENTED FUNCTIONS ==============

/*TODO: NOT PORTED OR TESTED WITH PROMISES
exports.p_dwebfile = function(table, hash, path, successmethod) {
    // Simple utility function to load into a hash without dealing with individual objects
    // successmethod - see "path()" for definition.
    let verbose = false;
    if (path && (path.length > 0)) {
        path = path.split('/');
    }
    if (verbose) { console.log("Dweb.p_dwebfile",table,hash,path,successmethod);}
    if (table === "mb") {
        //(hash, data, master, keypair, keygen, mnemonic, contenthash, contentacl, verbose)
        const mb = new exports.MutableBlock(hash, null, false, null, false, null, null, null, verbose, null);
        // for dwebfile:mb, we want to apply the success function to the file - which is in the content after fetchlist
        return mb.p_fetch_then_list_then_current(verbose)
            .then(() => mb.p_path(path, verbose, successmethod))
        // Note success is applied once after list is fetched, content isn't loaded before that.
    } else if (table === "sb") {
        const sb = new exports.StructuredBlock(hash, null, verbose);
        sb.p_fetch(verbose)
            .then((msg) => sb.p_path(path, verbose, successmethod))
    } else {
        alert("dwebfile called with invalid table="+table);
    }
};
*/


/*TODO: NOT PORTED OR TESTED WITH PROMISES
exports.p_dwebupdate = function(hash, type, data, successmethod) {
    let verbose = false;
    //(hash, data, master, keypair, keygen, mnemonic, contenthash, contentacl, verbose)
    let mbm = new exports.MutableBlock(hash, null, true, null, false, null, null, null, verbose, null);
    mbm.async_update( type, data, verbose,
        function(msg){
            if (successmethod) {
                let methodname = successmethod.shift();
                //if (verbose) console.log("p_elem",methodname, successmethod);
                mbm[methodname](...successmethod); // Spreads successmethod into args, like *args in python
            }
        },
        error);
};
*/


/*TODO: NOT PORTED OR TESTED WITH PROMISES
exports.p_dweblist = function(div, hash, verbose, success, successmethodeach) {
    //TODO-UNUSED doesnt appear to be used, though should have been in example.html
    //Retrieve a list, and create <li> elements of div to hold it.
    //success, if present, is run after list retrieved, asynchronous with elements retrieved
    //successeach, is run on each object in the list.
    //TODO-LISTS this should probably be a different lsit from MB where multiple is assumed.
    //TODO-LISTS success isnt used, presume something in chain runs success
    verbose = false;
    //(hash, data, master, keypair, keygen, mnemonic, contenthash, contentacl, verbose)
    const mb = new exports.MutableBlock(hash, null, false, null, false, null, null, null, verbose, null);
    return mb.p_fetch_then_list_then_elements(verbose)
        .then(()=> mb.p_elem(div, verbose, successmethodeach)) // p_elem loads the block
};
*/


