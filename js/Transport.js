const Url = require('url');
const stream = require('readable-stream');
const errors = require('./Errors'); // Standard Dweb Errors

function delay(ms, val) { return new Promise(resolve => {setTimeout(() => { resolve(val); },ms)})}


class Transport {

    constructor(options, verbose) {
        /*
        Doesnt do anything, its all done by SuperClasses,
        Superclass should merge with default options, call super
        */
    }

    setup0(options, verbose) {
        /*
        First part of setup, create obj, add to Transports but dont attempt to connect, typically called instead of p_setup if want to parallelize connections.
        */
        throw new errors.IntentionallyUnimplementedError("Intentionally undefined function Transport.setup0 should have been subclassed");
        }

    p_setup1(options, verbose) { return this; }
    p_setup2(options, verbose) { return this; }

    static async p_setup(options, verbose) {
            /*
            Setup the resource and open any P2P connections etc required to be done just once.
            In almost all cases this will call the constructor of the subclass

            :param obj options: Data structure required by underlying transport layer (format determined by that layer)
            :param boolean verbose: true for debugging output
            :resolve Transport: Instance of subclass of Transport
             */
            let t = await this.setup0(options, verbose) // Sync version that doesnt connect
                .p_setup1(verbose); // And connect

            return t.p_setup2(verbose);     // And connect
    }
    togglePaused() {
        switch (this.status) {
            case Transport.STATUS_CONNECTED:
                this.status = Transport.STATUS_PAUSED;
                break;
            case Transport.STATUS_PAUSED:
                this.status = Transport.STATUS_CONNECTED;   // Superclass might change to STATUS_STARTING if needs to stop/restart
                break;
        }
    }

    supports(url, func) {
        /*
        Determine if this transport supports a certain set of URLs and a func

        :param url: String or parsed URL
        :return:    true if this protocol supports these URLs and this func
        :throw:     TransportError if invalid URL
         */
        if (typeof url === "string") {
            url = Url.parse(url);    // For efficiency, only parse once.
        }
        if (url && !url.protocol) {
            throw new Error("URL failed to specific a scheme (before :) " + url.href)
        } //Should be TransportError but out of scope here
        // noinspection Annotator  supportURLs is defined in subclasses
        return (    (!url || this.supportURLs.includes(url.protocol.slice(0, -1)))
            && (!func || this.supportFunctions.includes(func)))
    }

    p_rawstore(data, verbose) {
        /*
        Store a blob of data onto the decentralised transport.
        Returns a promise that resolves to the url of the data

        :param string|Buffer data: Data to store - no assumptions made to size or content
        :param boolean verbose: true for debugging output
        :resolve string: url of data stored
         */
        throw new errors.ToBeImplementedError("Intentionally undefined function Transport.p_rawstore should have been subclassed");
    }

    async p_rawstoreCaught(data, verbose) {
        try {
            return await this.p_rawstore(data, verbose);
        } catch (err) {

        }
    }
    p_store() {
        throw new errors.ToBeImplementedError("Undefined function Transport.p_store - may define higher level semantics here (see Python)");
    }

    //noinspection JSUnusedLocalSymbols

    p_rawfetch(url, {verbose=false}={}) {
        /*
        Fetch some bytes based on a url, no assumption is made about the data in terms of size or structure.
        Where required by the underlying transport it should retrieve a number if its "blocks" and concatenate them.
        Returns a new Promise that resolves currently to a string.
        There may also be need for a streaming version of this call, at this point undefined.

        :param string url: URL of object being retrieved
        :param boolean verbose: true for debugging output
        :resolve string: Return the object being fetched, (note currently returned as a string, may refactor to return Buffer)
        :throws:        TransportError if url invalid - note this happens immediately, not as a catch in the promise
         */
        console.assert(false, "Intentionally undefined  function Transport.p_rawfetch should have been subclassed");
    }

    p_fetch() {
        throw new errors.ToBeImplementedError("Undefined function Transport.p_fetch - may define higher level semantics here (see Python)");
    }

    p_rawadd(url, sig, verbose) {
        /*
        Store a new list item, ideally it should be stored so that it can be retrieved either by "signedby" (using p_rawlist) or
        by "url" (with p_rawreverse). The underlying transport does not need to guarantee the signature,
        an invalid item on a list should be rejected on higher layers.

        :param string url: String identifying an object being added to the list.
        :param Signature sig: A signature data structure.
        :param boolean verbose: true for debugging output
        :resolve undefined:
         */
        throw new errors.ToBeImplementedError("Undefined function Transport.p_rawadd");
    }

    p_rawlist(url, verbose) {
        /*
        Fetch all the objects in a list, these are identified by the url of the public key used for signing.
        (Note this is the 'signedby' parameter of the p_rawadd call, not the 'url' parameter
        Returns a promise that resolves to the list.
        Each item of the list is a dict: {"url": url, "date": date, "signature": signature, "signedby": signedby}
        List items may have other data (e.g. reference ids of underlying transport)

        :param string url: String with the url that identifies the list.
        :param boolean verbose: true for debugging output
        :resolve array: An array of objects as stored on the list.
         */
        throw new errors.ToBeImplementedError("Undefined function Transport.p_rawlist");
    }

    p_list() {
        throw new Error("Undefined function Transport.p_list");
    }
    p_newlisturls(cl, verbose) {
        /*
        Must be implemented by any list, return a pair of URLS that may be the same, private and public links to the list.
        returns: ( privateurl, publicurl) e.g. yjs:xyz/abc or orbitdb:a123
         */
        throw new Error("undefined function Transport.p_newlisturls");
    }

    //noinspection JSUnusedGlobalSymbols
    p_rawreverse(url, verbose) {
        /*
        Similar to p_rawlist, but return the list item of all the places where the object url has been listed.
        The url here corresponds to the "url" parameter of p_rawadd
        Returns a promise that resolves to the list.

        :param string url: String with the url that identifies the object put on a list.
        :param boolean verbose: true for debugging output
        :resolve array: An array of objects as stored on the list.
         */
        throw new errors.ToBeImplementedError("Undefined function Transport.p_rawreverse");
    }

    listmonitor(url, callback, verbose) {
        /*
        Setup a callback called whenever an item is added to a list, typically it would be called immediately after a p_rawlist to get any more items not returned by p_rawlist.

        :param url:         string Identifier of list (as used by p_rawlist and "signedby" parameter of p_rawadd
        :param callback:    function(obj)  Callback for each new item added to the list
               	obj is same format as p_rawlist or p_rawreverse
        :param verbose:     boolean - true for debugging output
         */
        console.log("Undefined function Transport.listmonitor");    // Note intentionally a log, as legitamte to not implement it
    }


    // ==== TO SUPPORT KEY VALUE INTERFACES IMPLEMENT THESE =====
    // Support for Key-Value pairs as per
    // https://docs.google.com/document/d/1yfmLRqKPxKwB939wIy9sSaa7GKOzM5PrCZ4W1jRGW6M/edit#

    async p_newdatabase(pubkey, verbose) {
        /*
         Create a new database based on some existing object
         pubkey:    Something that is, or has a pubkey, by default support Dweb.PublicPrivate, KeyPair or an array of strings as in the output of keypair.publicexport()
         returns: {publicurl, privateurl} which may be the same if there is no write authentication
          */
        throw new errors.ToBeImplementedError("Undefined function Transport.p_newdatabase");
    }
    //TODO maybe change the listmonitor / monitor code for to use "on" and the structure of PP.events
    //TODO but note https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy about Proxy which might be suitable, prob not as doesnt map well to lists
    async p_newtable(pubkey, table, verbose) {
        /*
        Create a new table,
        pubkey: Is or has a pubkey (see p_newdatabase)
        table:  String representing the table - unique to the database
        returns:    {privateurl, publicurl} which may be the same if there is no write authentication
         */
        throw new errors.ToBeImplementedError("Undefined function Transport.p_newtable");
    }

    async p_set(url, keyvalues, value, verbose) {  // url = yjs:/yjs/database/table/key
        /*
        Set one or more keys in a table.
        url:    URL of the table
        keyvalues:  String representing a single key OR dictionary of keys
        value:  String or other object to be stored (its not defined yet what objects should be supported, e.g. any object ?
         */
        throw new errors.ToBeImplementedError("Undefined function Transport.p_set");
    }
    async p_get(url, keys, verbose) {
        /* Get one or more keys from a table
        url:    URL of the table
        keys:   Array of keys
        returns:    Dictionary of values found (undefined if not found)
         */
        throw new errors.ToBeImplementedError("Undefined function Transport.p_get");
    }

    async p_delete(url, keys, verbose) {
        /* Delete one or more keys from a table
        url:    URL of the table
        keys:   Array of keys
         */
        throw new errors.ToBeImplementedError("Undefined function Transport.p_delete");
    }

    async p_keys(url, verbose) {
        /* Return a list of keys in a table (suitable for iterating through)
        url:    URL of the table
        returns:    Array of strings
         */
        throw new errors.ToBeImplementedError("Undefined function Transport.p_keys");
    }
    async p_getall(url, verbose) {
        /* Return a dictionary representing the table
        url:    URL of the table
        returns:    Dictionary of Key:Value pairs, note take care if this could be large.
         */
        throw new errors.ToBeImplementedError("Undefined function Transport.p_keys");
    }
    // ------ UTILITY FUNCTIONS, NOT REQD TO BE SUBCLASSED ----

    static mergeoptions(a) {
        /*
        Deep merge options dictionaries
         */
        let c = {};
        for (let i = 0; i < arguments.length; i++) {
            let b = arguments[i];
            for (let key in b) {
                let val = b[key];
                if ((typeof val === "object") && !Array.isArray(val) && c[key]) {
                    c[key] = Transport.mergeoptions(a[key], b[key]);
                } else {
                    c[key] = b[key];
                }
            }
        }
        return c;
    }

    async p_test_kvt(urlexpectedsubstring, verbose=false) {
        /*
            Test the KeyValue functionality of any transport that supports it.
            urlexpectedsubstring:   Some string expected in the publicurl of the table.
         */
        if (verbose) {console.log(this.name,"p_test_kvt")}
        try {
            let table = await this.p_newtable("NACL VERIFY:1234567","mytable", verbose);
            let mapurl = table.publicurl;
            if (verbose) console.log("newtable=",mapurl);
            console.assert(mapurl.includes(urlexpectedsubstring));
            await this.p_set(mapurl, "testkey", "testvalue", verbose);
            let res = await this.p_get(mapurl, "testkey", verbose);
            console.assert(res === "testvalue");
            await this.p_set(mapurl, "testkey2", {foo: "bar"}, verbose);   // Try setting to an object
            res = await this.p_get(mapurl, "testkey2", verbose);
            console.assert(res.foo === "bar");
            await this.p_set(mapurl, "testkey3", [1,2,3], verbose);    // Try setting to an array
            res = await this.p_get(mapurl, "testkey3", verbose);
            console.assert(res[1] === 2);
            res = await this.p_keys(mapurl);
            console.assert(res.includes("testkey") && res.includes("testkey3"));
            res = await this.p_delete(mapurl, ["testkey"]);
            res = await this.p_getall(mapurl, verbose);
            if (verbose) console.log("getall=>",res);
            console.assert(res.testkey2.foo === "bar" && res.testkey3["1"] === 2 && !res.testkey1);
            await delay(200);
            if (verbose) console.log(this.name, "p_test_kvt complete")
        } catch(err) {
            console.log("Exception thrown in ", this.name, "p_test_kvt:", err.message);
            throw err;
        }
    }


}
Transport.STATUS_CONNECTED = 0; // Connected - all other numbers are some version of not ok to use
Transport.STATUS_FAILED = 1;    // Failed to connect
Transport.STATUS_STARTING = 2;  // In the process of connecting
Transport.STATUS_LOADED = 3;    // Code loaded, but haven't tried to connect. (this is typically hard coded in subclasses constructor)
Transport.STATUS_PAUSED = 4;    // It was launched, probably connected, but now paused so will be ignored by validFor
exports = module.exports = Transport;
