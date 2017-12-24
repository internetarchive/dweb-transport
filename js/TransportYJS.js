/*
This Transport layers builds on the YJS DB and uses IPFS as its transport.

Y Lists have listeners and generate events - see docs at ...
*/
// The following only required for Y version
const Y = require('yjs');
require('y-memory')(Y);
require('y-array')(Y);
require('y-text')(Y);
require('y-ipfs-connector')(Y);
require('y-indexeddb')(Y);
//require('y-leveldb')(Y); //- can't be there for browser, node seems to find it ok without this, though not sure why..

// Utility packages (ours) And one-liners
function delay(ms, val) { return new Promise(resolve => {setTimeout(() => { resolve(val); },ms)})}

// Other Dweb modules
const Transport = require('./Transport');
const Dweb = require('./Dweb');

let defaultoptions = {
    yarray: {    // Based on how IIIF uses them in bootstrap.js in ipfs-iiif-db repo
        db: {
            name: 'indexeddb',   // leveldb in node
        },
        connector: {
            name: 'ipfs',
            //ipfs: ipfs,   // Need to link IPFS here once created
        },
        share: {
            //textfield: 'Text'
            array: 'Array'
        }
    }
}

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
        this.supportFunctions = ['add', 'list', 'listmonitor', 'newlisturls'];   // Only does list functions, Does not support reverse,
        this.status = Dweb.Transport.STATUS_LOADED;
    }

    async p_yarraysstart(verbose) {
        /*
        This starts IPFS, but only sets up for Y connections, which are opened each time a resource is listed, added to, or listmonitored.
            Throws: Error("websocket error") if WiFi off, probably other errors if fails to connect
        */
        try {
            let self = this;
            self.yarrays = {};
            //await this.p_ipfsstart(verbose); // Throws Error("websocket error") if Wifi is off
        } catch(err) {
            console.log("p_yarraysstart: Error caught:", err.message);
            throw(err);
        }
        //Lots of issues with "init" not knowing state before it//  this.ipfs.init({emptyRepo: true, bits: 2048})     //.then((unused) => ipfs.init({emptyRepo: true, bits: 2048}))
    }

    async p__yarray(url, verbose) {
        /*
        Utility function to get Yarray for this URL and open a new connection if not already

        url:        URL string to find list of
        resolves:   Y
        */
        try {
            if (this.yarrays[url]) {
                if (verbose) console.log("Found Y for", url);
                return this.yarrays[url];
            } else {
                let options = Transport.mergeoptions(this.options.yarray, {connector: {room: url}}); // Copies options, ipfs will be set already
                if (verbose) console.log("Creating Y for", url); //"options=",options);
                return this.yarrays[url] = await Y(options);
            }
        } catch(err) {
            console.log("Failed to initialize Y");
            throw err;
        }
    }

    static setup0(options, verbose) {
        /*
            First part of setup, create obj, add to Transports but dont attempt to connect, typically called instead of p_setup if want to parallelize connections.
        */
        let combinedoptions = Transport.mergeoptions(defaultoptions, options);
        console.log("YJS options %o", combinedoptions);
        let t = new TransportYJS(combinedoptions, verbose);   // Note doesnt start IPFS or Y
        Dweb.Transports.addtransport(t);
        return t;
    }

    async p_setup1b(verbose) {
        try {
            this.status = Dweb.Transport.STATUS_STARTING;   // Should display, but probably not refreshed in most case
            this.options.yarray.connector.ipfs = Dweb.Transports.ipfs(verbose).ipfs; // Find an IPFS to use (IPFS's should be starting in p_setup1a)
            await this.p_yarraysstart(verbose);    // Throws Error("websocket error") and possibly others.
        } catch(err) {
            console.error("IPFS failed to connect",err);
            this.status = Dweb.Transport.STATUS_FAILED;
        }
        return this;
    }

    static async p_setup(options, verbose ) {
        /*
        Setup the resource and open any P2P connections etc required to be done just once.
        In almost all cases this will call the constructor of the subclass
        Should return a new Promise that resolves to a instance of the subclass

        :param obj transportoptions: Data structure required by underlying transport layer (format determined by that layer)
        :param boolean verbose: True for debugging output
        :param options: Data structure stored on the .options field of the instance returned.
        :resolve Transport: Instance of subclass of Transport
         */
        return await TransportYJS.setup0(options, verbose) // Create instance but dont connect
            .p_setup1(verbose);             // Connect
    }

    async p_status(verbose) {
        /*
        Return a string for the status of a transport. No particular format, but keep it short as it will probably be in a small area of the screen.
        For YJS, its online if IPFS is.
         */
        this.status =  (await this.options.yarray.connector.ipfs.isOnline()) ? Dweb.Transport.STATUS_CONNECTED : Dweb.Transport.STATUS_FAILED;
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
    :param boolean verbose: True for debugging output
    :resolve array: An array of objects as stored on the list.
     */
        try {
            if (!(typeof(url) === "string")) { url = url.href; } // Convert if its a parsed URL
            let y = await this.p__yarray(url, verbose);
            let res = y.share.array.toArray()
            // .filter((obj) => (obj.signedby.includes(url))); Cant filter since url is the YJS URL, not the URL of the CL that signed it. (upper layers verify, which fiters)
            if (verbose) console.log("p_rawlist found", ...Dweb.utils.consolearr(res));
            return res;
        } catch(err) {
            console.log("TransportIPFS.p_rawlist failed",err.message);
            throw(err);
        }
    }

    listmonitor(url, callback, verbose) {
        /*
         Setup a callback called whenever an item is added to a list, typically it would be called immediately after a p_rawlist to get any more items not returned by p_rawlist.

         :param url:         string Identifier of list (as used by p_rawlist and "signedby" parameter of p_rawadd
         :param callback:    function(obj)  Callback for each new item added to the list
                    obj is same format as p_rawlist or p_rawreverse
         :param verbose:     boolean - True for debugging output
          */
        if (!(typeof(url) === "string")) { url = url.href; } // Convert if its a parsed URL
        let y = this.yarrays[url];
        console.assert(y,"Should always exist before calling listmonitor - async call p__yarray(url) to create");
        y.share.array.observe((event) => {
            if (event.type === 'insert') { // Currently ignoring deletions.
                if (verbose) console.log('resources inserted', event.values);
                event.values.filter((obj) => obj.signedby.includes(url)).map(callback);
            }
        })
    }

    rawreverse() {
        /*
        Similar to p_rawlist, but return the list item of all the places where the object url has been listed.
        The url here corresponds to the "url" parameter of p_rawadd
        Returns a promise that resolves to the list.

        :param string url: String with the url that identifies the object put on a list.
        :param boolean verbose: True for debugging output
        :resolve array: An array of objects as stored on the list.
         */
        //TODO-REVERSE this needs implementing once list structure on IPFS more certain
        throw new Dweb.errors.ToBeImplementedError("Undefined function TransportHTTP.rawreverse"); }

    async p_rawadd(url, sig, verbose) {
        /*
        Store a new list item, it should be stored so that it can be retrieved either by "signedby" (using p_rawlist) or
        by "url" (with p_rawreverse). The underlying transport does not need to guarrantee the signature,
        an invalid item on a list should be rejected on higher layers.

        :param string url: String identifying list to post to
        :param Signature sig: Signature object containing at least:
            date - date of signing in ISO format,
            urls - array of urls for the object being signed
            signature - verifiable signature of date+urls
            signedby - urls of public key used for the signature
        :param boolean verbose: True for debugging output
        :resolve undefined:
        */
        if (typeof url !== "string") url = url.href; // Assume its an Url if its not a string
        console.assert(url && sig.urls.length && sig.signature && sig.signedby.length, "TransportIPFS.p_rawadd args", url, sig);
        if (verbose) console.log("TransportYJS.p_rawadd", url, sig);
        let value = sig.preflight(Object.assign({}, sig));
        let y = await this.p__yarray(url, verbose);
        y.share.array.push([value]);
    }

    p_newlisturls(cl, verbose) {
        let  u = cl._publicurls.map(urlstr => Url.parse(urlstr))
            .find(parsedurl =>
                (parsedurl.protocol === "ipfs" && parsedurl.pathname.includes('/ipfs/'))
                || (parsedurl.protocol === "yjs:"));
        if (!u) { //TODO-LIST-REFACTOR - solutions here prob needed on YJS
            u = `yjs:/yjs/${ Dweb.KeyPair.multihashsha256_58(cl.keypair.publicexport()[0]) }`; // Pretty random, but means same test will generate same list
        }
        return [u,u];
    }


    static async test(transport, verbose) {
        if (verbose) {console.log("TransportYJS.test")}
        try {
            let testurl = "1114";  // Just a predictable number can work with
            let res = await transport.p_rawlist(testurl, verbose);
            let listlen = res.length;   // Holds length of list run intermediate
            if (verbose) console.log("rawlist returned ", ...Dweb.utils.consolearr(res));
            transport.listmonitor(testurl, (obj) => console.log("Monitored", obj), verbose);
            let sig = new Dweb.Signature({urls: ["123"], date: new Date(Date.now()), signature: "Joe Smith", signedby: [testurl]}, verbose);
            await transport.p_rawadd(testurl, sig, verbose);
            if (verbose) console.log("TransportIPFS.p_rawadd returned ");
            res = await transport.p_rawlist(testurl, verbose);
            if (verbose) console.log("rawlist returned ", ...Dweb.utils.consolearr(res)); // Note not showing return
            await delay(500);
            res = await transport.p_rawlist(testurl, verbose);
            console.assert(res.length === listlen + 1, "Should have added one item");
            //console.log("TransportYJS test complete");
        } catch(err) {
            console.log("Exception thrown in TransportYJS.test:", err.message);
            throw err;
        }
    }

}
TransportYJS.Y = Y; // Allow node tests to find it
exports = module.exports = TransportYJS;
