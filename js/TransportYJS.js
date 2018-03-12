/*
This Transport layers builds on the YJS DB and uses IPFS as its transport.

Y Lists have listeners and generate events - see docs at ...
*/
const Url = require('url');

//const Y = require('yjs/dist/y.js'); // Explicity require of dist/y.js to get around a webpack warning but causes different error in YJS
const Y = require('yjs'); // Explicity require of dist/y.js to get around a webpack warning
require('y-memory')(Y);
require('y-array')(Y);
require('y-text')(Y);
require('y-map')(Y);
require('y-ipfs-connector')(Y);
require('y-indexeddb')(Y);
//require('y-leveldb')(Y); //- can't be there for browser, node seems to find it ok without this, though not sure why..

// Utility packages (ours) And one-liners
function delay(ms, val) { return new Promise(resolve => {setTimeout(() => { resolve(val); },ms)})}

// Other Dweb modules
const errors = require('./Errors'); // Standard Dweb Errors
const Transport = require('./Transport.js'); // Base class for TransportXyz
const Transports = require('./Transports'); // Manage all Transports that are loaded
const utils = require('./utils'); // Utility functions

let defaultoptions = {
    yarray: {    // Based on how IIIF uses them in bootstrap.js in ipfs-iiif-db repo
        db: {
            name: 'indexeddb',   // leveldb in node
        },
        connector: {
            name: 'ipfs',
            //ipfs: ipfs,   // Need to link IPFS here once created
        },
    }
};

class TransportYJS extends Transport {
    /*
    YJS specific transport - over IPFS, but could probably use other YJS transports

    Fields:
    ipfs: object returned when starting IPFS
    yarray: object returned when starting yarray
     */

    constructor(options, verbose) {
        super(options, verbose);
        this.options = options;         // Dictionary of options { ipfs: {...}, "yarrays", yarray: {...} }
        this.name = "YJS";             // For console log etc
        this.supportURLs = ['yjs'];
        this.supportFunctions = ['fetch', 'add', 'list', 'listmonitor', 'newlisturls',
            'connection', 'get', 'set', 'getall', 'keys', 'newdatabase', 'newtable', 'monitor'];   // Only does list functions, Does not support reverse,
        this.status = Transport.STATUS_LOADED;
    }

    async p__y(url, opts, verbose) {
        /*
        Utility function to get Y for this URL with appropriate options and open a new connection if not already

        url:        URL string to find list of
        opts:       Options to add to defaults
        resolves:   Y
        */
        if (!(typeof(url) === "string")) { url = url.href; } // Convert if its a parsed URL
        console.assert(url.startsWith("yjs:/yjs/"));
        try {
            if (this.yarrays[url]) {
                if (verbose) console.log("Found Y for", url);
                return this.yarrays[url];
            } else {
                let options = Transport.mergeoptions(this.options.yarray, {connector: {room: url}}, opts); // Copies options, ipfs will be set already
                if (verbose) console.log("Creating Y for", url); //"options=",options);
                return this.yarrays[url] = await Y(options);
            }
        } catch(err) {
            console.log("Failed to initialize Y");
            throw err;
        }
    }

    async p__yarray(url, verbose) {
        /*
        Utility function to get Yarray for this URL and open a new connection if not already
        url:        URL string to find list of
        resolves:   Y
        */
        return this.p__y(url, { share: {array: "Array"}}); // Copies options, ipfs will be set already
    }
    async p_connection(url, verbose) {
        /*
        Utility function to get Yarray for this URL and open a new connection if not already
        url:        URL string to find list of
        resolves:   Y - a connection to use for get's etc.
        */
        return this.p__y(url, { share: {map: "Map"}}); // Copies options, ipfs will be set already
    }



    static setup0(options, verbose) {
        /*
            First part of setup, create obj, add to Transports but dont attempt to connect, typically called instead of p_setup if want to parallelize connections.
        */
        let combinedoptions = Transport.mergeoptions(defaultoptions, options);
        if (verbose) console.log("YJS options %o", combinedoptions); // Log even if !verbose
        let t = new TransportYJS(combinedoptions, verbose);   // Note doesnt start IPFS or Y
        Transports.addtransport(t);
        return t;
    }

    async p_setup2(verbose) {
        /*
        This sets up for Y connections, which are opened each time a resource is listed, added to, or listmonitored.
        p_setup2 is defined because IPFS will have started during the p_setup1 phase.
        Throws: Error("websocket error") if WiFi off, probably other errors if fails to connect
        */
        try {
            this.status = Transport.STATUS_STARTING;   // Should display, but probably not refreshed in most case
            this.options.yarray.connector.ipfs = Transports.ipfs(verbose).ipfs; // Find an IPFS to use (IPFS's should be starting in p_setup1)
            this.yarrays = {};
        } catch(err) {
            console.error("YJS failed to start",err);
            this.status = Transport.STATUS_FAILED;
        }
        return this;
    }

    async p_status(verbose) {
        /*
        Return a string for the status of a transport. No particular format, but keep it short as it will probably be in a small area of the screen.
        For YJS, its online if IPFS is.
         */
        this.status =  (await this.options.yarray.connector.ipfs.isOnline()) ? Transport.STATUS_CONNECTED : Transport.STATUS_FAILED;
        return this.status;
    }

    async p_rawlist(url, verbose) {
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
        try {
            let y = await this.p__yarray(url, verbose);
            let res = y.share.array.toArray();
            // .filter((obj) => (obj.signedby.includes(url))); Cant filter since url is the YJS URL, not the URL of the CL that signed it. (upper layers verify, which filters)
            if (verbose) console.log("p_rawlist found", ...utils.consolearr(res));
            return res;
        } catch(err) {
            console.log("TransportYJS.p_rawlist failed",err.message);
            throw(err);
        }
    }

    listmonitor(url, callback, verbose) {
        /*
         Setup a callback called whenever an item is added to a list, typically it would be called immediately after a p_rawlist to get any more items not returned by p_rawlist.

         :param url:         string Identifier of list (as used by p_rawlist and "signedby" parameter of p_rawadd
         :param callback:    function(obj)  Callback for each new item added to the list
                    obj is same format as p_rawlist or p_rawreverse
         :param verbose:     boolean - true for debugging output
          */
        let y = this.yarrays[typeof url === "string" ? url : url.href];
        console.assert(y,"Should always exist before calling listmonitor - async call p__yarray(url) to create");
        y.share.array.observe((event) => {
            if (event.type === 'insert') { // Currently ignoring deletions.
                if (verbose) console.log('resources inserted', event.values);
                //cant filter because url is YJS local, not signer, callback should filter
                //event.values.filter((obj) => obj.signedby.includes(url)).map(callback);
                event.values.map(callback);
            }
        })
    }

    rawreverse() {
        /*
        Similar to p_rawlist, but return the list item of all the places where the object url has been listed.
        The url here corresponds to the "url" parameter of p_rawadd
        Returns a promise that resolves to the list.

        :param string url: String with the url that identifies the object put on a list.
        :param boolean verbose: true for debugging output
        :resolve array: An array of objects as stored on the list.
         */
        //TODO-REVERSE this needs implementing once list structure on IPFS more certain
        throw new errors.ToBeImplementedError("Undefined function TransportYJS.rawreverse"); }

    async p_rawadd(url, sig, verbose) {
        /*
        Store a new list item, it should be stored so that it can be retrieved either by "signedby" (using p_rawlist) or
        by "url" (with p_rawreverse). The underlying transport does not need to guarantee the signature,
        an invalid item on a list should be rejected on higher layers.

        :param string url: String identifying list to post to
        :param Signature sig: Signature object containing at least:
            date - date of signing in ISO format,
            urls - array of urls for the object being signed
            signature - verifiable signature of date+urls
            signedby - urls of public key used for the signature
        :param boolean verbose: true for debugging output
        :resolve undefined:
        */
        console.assert(url && sig.urls.length && sig.signature && sig.signedby.length, "TransportYJS.p_rawadd args", url, sig);
        if (verbose) console.log("TransportYJS.p_rawadd", typeof url === "string" ? url : url.href, sig);
        let value = sig.preflight(Object.assign({}, sig));
        let y = await this.p__yarray(url, verbose);
        y.share.array.push([value]);
    }

    p_newlisturls(cl, verbose) {
        let  u = cl._publicurls.map(urlstr => Url.parse(urlstr))
            .find(parsedurl =>
                (parsedurl.protocol === "ipfs" && parsedurl.pathname.includes('/ipfs/'))
                || (parsedurl.protocol === "yjs:"));
        if (!u) {
            u = `yjs:/yjs/${ cl.keypair.verifyexportmultihashsha256_58() }`; // Pretty random, but means same test will generate same list
        }
        return [u,u];
    }


    // Support for Key-Value pairs as per
    // https://docs.google.com/document/d/1yfmLRqKPxKwB939wIy9sSaa7GKOzM5PrCZ4W1jRGW6M/edit#
    async p_newdatabase(pubkey, verbose) {
        //if (pubkey instanceof Dweb.PublicPrivate)
        if (pubkey.hasOwnProperty("keypair"))
            pubkey = pubkey.keypair.signingexport()
        // By this point pubkey should be an export of a public key of form xyz:abc where xyz
        // specifies the type of public key (NACL VERIFY being the only kind we expect currently)
        let u =  `yjs:/yjs/${encodeURIComponent(pubkey)}`;
        return {"publicurl": u, "privateurl": u};
    }

    //TODO maybe change the listmonitor / monitor code for to use "on" and the structure of PP.events
    //TODO but note https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy about Proxy which might be suitable, prob not as doesnt map well to lists
    async p_newtable(pubkey, table, verbose) {
        if (!pubkey) throw new errors.CodingError("p_newtable currently requires a pubkey");
        let database = await this.p_newdatabase(pubkey, verbose);
        // If have use cases without a database, then call p_newdatabase first
        return { privateurl: `${database.privateurl}/${table}`,  publicurl: `${database.publicurl}/${table}`}  // No action required to create it
    }

    async p_set(url, keyvalues, value, verbose) {  // url = yjs:/yjs/database/table/key   //TODO-KEYVALUE-API
        let y = await this.p_connection(url, verbose);
        if (typeof keyvalues === "string") {
            y.share.map.set(keyvalues, JSON.stringify(value));
        } else {
            Object.keys(keyvalues).map((key) => y.share.map.set(key, keyvalues[key]));
        }
    }
    _p_get(y, keys, verbose) {
        if (Array.isArray(keys)) {
            return keys.reduce(function(previous, key) {
                let val = y.share.map.get(key);
                previous[key] = typeof val === "string" ? JSON.parse(val) : val;    // Handle undefined
                return previous;
            }, {});
        } else {
            let val = y.share.map.get(keys);
            return typeof val === "string" ? JSON.parse(val) : val;  // Surprisingly this is sync, the p_connection should have synchronised
        }
    }
    async p_get(url, keys, verbose) {  //TODO-KEYVALUE-API - return dict or single
        return this._p_get(await this.p_connection(url, verbose), keys);
    }

    async p_delete(url, keys, verbose) {  //TODO-KEYVALUE-API
        let y = await this.p_connection(url, verbose);
        if (typeof keys === "string") {
            y.share.map.delete(keys);
        } else {
            keys.map((key) => y.share.map.delete(key));  // Surprisingly this is sync, the p_connection should have synchronised
        }
    }

    async p_keys(url, verbose) {
        let y = await this.p_connection(url, verbose);
        return y.share.map.keys();   // Surprisingly this is sync, the p_connection should have synchronised
    }
    async p_getall(url, verbose) {
        let y = await this.p_connection(url, verbose);
        let keys = y.share.map.keys();   // Surprisingly this is sync, the p_connection should have synchronised
        return this._p_get(y, keys);
    }
    async p_rawfetch(url, {verbose=false}={}) {
        return { // See identical structure in TransportHTTP
            table: "keyvaluetable",         //TODO-KEYVALUE its unclear if this is the best way, as maybe want to know the real type of table e.g. domain
            _map: await this.p_getall(url, verbose)
        };   // Data struc is ok as SmartDict.p_fetch will pass to KVT constructor
    }
    async monitor(url, callback, verbose) {
        /*
         Setup a callback called whenever an item is added to a list, typically it would be called immediately after a p_rawlist to get any more items not returned by p_rawlist.
         Stack: KVT()|KVT.p_new => KVT.monitor => (a: Transports.monitor => YJS.monitor)(b: dispatchEvent)

         :param url:         string Identifier of list (as used by p_rawlist and "signedby" parameter of p_rawadd
         :param callback:    function({type, key, value})  Callback for each new item added to the list

         :param verbose:     boolean - true for debugging output
          */
        url = typeof url === "string" ? url : url.href;
        let y = this.yarrays[url];
        if (!y) {
            throw new errors.CodingError("Should always exist before calling monitor - async call p__yarray(url) to create");
        }
        y.share.map.observe((event) => {
            if (['add','update'].includes(event.type)) { // Currently ignoring deletions.
                if (verbose) console.log("YJS monitor:", url, event.type, event.name, event.value);
                // ignores event.path (only in observeDeep) and event.object
                if (!(event.type === "update" && event.oldValue === event.value)) {
                    // Dont trigger on update as seeing some loops with p_set
                    let newevent = {
                        "type": {"add": "set", "update": "set", "delete": "delete"}[event.type],
                        "value": JSON.parse(event.value),
                        "key": event.name,
                    };
                    callback(newevent);
                }
            }
        })
    }

}
TransportYJS.Y = Y; // Allow node tests to find it
Transports._transportclasses["YJS"] = TransportYJS;
exports = module.exports = TransportYJS;
