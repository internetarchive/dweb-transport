/*
This Transport layers uses OrbitDB and IPFS as its transport.
*/
const OrbitDB = require('orbit-db')

// Utility packages (ours) And one-liners
function delay(ms, val) { return new Promise(resolve => {setTimeout(() => { resolve(val); },ms)})}

// Other Dweb modules
const Transport = require('./Transport');
const Dweb = require('./Dweb');

let defaultoptions = {
}

class TransportORBITDB extends Transport {
    /*
    OrbitDB specific transport - over IPFS

    Fields:
    ipfs: object returned when starting IPFS
    orbitdb: object returned when starting OrbitDB
     */

    constructor(options, verbose) {
        super(options, verbose);
        this.options = options;
        this.ipfs = options.ipfs;
        this.orbitdb = options.orbitdb;
        this.name = "ORBITDB";
        this.supportURLs = ['orbitdb'];
        //TODO-ORBIT - Samuli, what is fetch in orbit context?
        this.supportFunctions = ['add', 'list', 'fetch', 'listmonitor', 'newlisturls'];
        this.status = Dweb.Transport.STATUS_LOADED;
    }

    async p__database(url, options, verbose) {
        /*
        Utility function to get a database for this URL and open a new connection if not already

        url:        URL string to find list of
        resolves:   OrbitDB database
        */
        try {
            if (this.databases[url]) {
                if (verbose) console.log("Found database for", url);
                return this.databases[url];
            } else {
                if (verbose) console.log("Creating database for", url); //"options=",options);
                const db = await this.orbitdb.eventlog(url, options);
                await db.load()
                const u = `orbitdb:${db.address.toString()}`; // Pretty random, but means same test will generate same list
                //TODO-ORBIT - Samuli, this looks wrong, I think it should be this.databases[url] = db and we dont need the u= line above.
                //TODO-ORBUT - Samuli, also it looks like you assume that you stored it under "url" in some places below (e.g. p_newlisturls)
                this.databases[u] = db
                return this.databases[u];
            }
        } catch(err) {
            console.log("Failed to initialize OrbitDB database");
            throw err;
        }
    }

    static setup0(options, verbose) {
        /*
            First part of setup, create obj, add to Transports but dont attempt to connect, typically called instead of p_setup if want to parallelize connections.
        */
        let combinedoptions = Transport.mergeoptions(defaultoptions, options);
        console.log("OrbitDB options %o", combinedoptions); // Log even if !verbose
        let t = new TransportORBITDB(combinedoptions, verbose);   // Note doesnt start IPFS or OrbitDB
        Dweb.Transports.addtransport(t);
        return t;
    }

    async p_setup2(verbose) {
        /*
        This sets up for OrbitDB.
        p_setup2 is defined because IPFS will have started during the p_setup1 phase.
        Throws: Error("websocket error") if WiFi off, probably other errors if fails to connect
        */
        try {
            this.status = Dweb.Transport.STATUS_STARTING;   // Should display, but probably not refreshed in most case
            this.ipfs = Dweb.Transports.ipfs(verbose).ipfs; // Find an IPFS to use (IPFS's should be starting in p_setup1)
            this.orbitdb = new OrbitDB(this.ipfs)
            this.databases = {};
        } catch(err) {
            console.error("OrbitDB failed to start",err);
            this.status = Dweb.Transport.STATUS_FAILED;
        }
        return this;
    }

    async p_status(verbose) {
        /*
        Return a string for the status of a transport. No particular format, but keep it short as it will probably be in a small area of the screen.
        For OrbitDB, its online if IPFS is.
         */
        this.status =  (await this.ipfs.isOnline()) ? Dweb.Transport.STATUS_CONNECTED : Dweb.Transport.STATUS_FAILED;
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
            //TODO-ORBIT Samuli, if we want url parts its probably best to turn into parsed URL and use that.
            //TODO-ORBIT Samuli, but I think this is wrong, and that url should be passed to p__database like you are doing in p_rawadd
            if (!(typeof(url) === "string")) { url = url.href; } // Convert if its a parsed URL
            let db = this.databases[url]
            if (!db) {
                console.log("URLURLURLURL", url)
                const parts = url.split(':')
                console.log("PARTSPARTSPARTS", parts)
                url = parts[1]
                db = await this.p__database(url, {create: false}, verbose)
            }
            const res = db.iterator({ limit: -1 }).collect().map(e => e.payload.value);
            console.log("RES-->", res)
            if (verbose) console.log("p_rawlist found", ...Dweb.utils.consolearr(res));
            return res;
        } catch(err) {
            console.log("TransportORBITDB.p_rawlist failed",err.message);
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
        //TODO-ORBIT Samuli, presuming this is not complete
        let y = this.databases[url];
        console.assert(y,"Should always exist before calling listmonitor - async call p__database(url) to create");
        // y.share.array.observe((event) => {
        //     if (event.type === 'insert') { // Currently ignoring deletions.
        //         if (verbose) console.log('resources inserted', event.values);
        //         event.values.filter((obj) => obj.signedby.includes(url)).map(callback);
        //     }
        // })
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
        if (verbose) console.log("TransportORBITDB.p_rawadd", url, sig);
        let value = sig.preflight(Object.assign({}, sig));
        const db = this.databases[url]
        try {
            await db.add(value)
        } catch (e) {
            console.error(e)
        }
    }

    async p_newlisturls(cl, verbose) {
        let  u = cl._publicurls.map(urlstr => Url.parse(urlstr))
            .find(parsedurl => (parsedurl.protocol === "orbitdb:"));
        //TODO-ORBIT Orbit doesnt need the check against ipfs: that is for handling legacy lists where the YJS URl was same as IPFS
        //(parsedurl.protocol === "ipfs" && parsedurl.pathname.includes('/ipfs/'))
        //|| (parsedurl.protocol === "orbitdb:"));
        if (!u) {
            // TODO: pass 'Dweb.KeyPair.multihashsha256_58(cl.keypair.publicexport()[0])' to orbitdb options.write
            const options = {
                create: true,
                // write: ['ABC'],
            }
            const db = await this.p__database(cl.name, options, verbose);
            u = `orbitdb:${db.address.toString()}`;
        }
        return [u,u];
    }


    static async test(transport, verbose) {
        if (verbose) {console.log("TransportORBITDB.test")}
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
        } catch(err) {
            console.log("Exception thrown in TransportORBITDB.test:", err.message);
            throw err;
        }
    }

}
TransportORBITDB.OrbitDB = OrbitDB; // Allow node tests to find it
exports = module.exports = TransportORBITDB;
