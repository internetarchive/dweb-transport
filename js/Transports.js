const Url = require('url');
const Dweb = require('./Dweb.js');

/*
Handles multiple transports, API should be (almost) the same as for an individual transport)
 */


class Transports {
    constructor(options, verbose) {
        if (verbose) console.log("Transports(%o)",options);
    }

    static _connected() {
        /*
        Get an array of transports that are connected, i.e. currently usable
         */
        return this._transports.filter((t) => (!t.status));
    }
    static connectedNames() {
        return this._connected().map(t => t.name);
    }
    static validFor(urls, func) {
        /*
        Finds an array or Transports that can support this URL.

        Excludes any transports whose status != 0 as they aren't connected

        urls:       Array of urls
        func:       Function to check support for: fetch, store, add, list, listmonitor, reverse - see supportFunctions on each Transport class
        returns:    Array of pairs of url & transport instance [ [ u1, t1], [u1, t2], [u2, t1]]
         */
        console.assert((urls && urls[0]) || ["store", "newlisturls", "newdatabase", "newtable"].includes(func), "Transports.validFor failed - coding error - urls=", urls, "func=", func); // FOr debugging old calling patterns with [ undefined ]
        if (!(urls && urls.length > 0)) {
            return this._connected().filter((t) => (t.supports(undefined, func)))
                .map((t) => [undefined, t]);
        } else {
            return [].concat(
                ...urls.map((url) => typeof url === 'string' ? Url.parse(url) : url) // parse URLs once
                    .map((url) =>
                        this._connected().filter((t) => (t.supports(url, func))) // [ t1, t2 ]
                            .map((t) => [url, t]))); // [[ u, t1], [u, t2]]
        }
    }
    static ipfs(verbose) {
        // Find an ipfs transport if it exists, so for example YJS can use it.
        return Transports._transports.find((t) => t instanceof Dweb.TransportIPFS)
    }

    static async p_rawstore(data, verbose) {
        /*
        data: Raw data to store - typically a string, but its passed on unmodified here
        returns:    Array of urls of where stored
        throws: TransportError with message being concatenated messages of transports if NONE of them succeed.
         */
        let tt = this.validFor(undefined, "store"); // Valid connected transports that support "store"
        if (!tt.length) {
            throw new Dweb.errors.TransportError('Transports.p_rawstore: Cant find transport for store');
        }
        let errs = [];
        let rr = await Promise.all(tt.map(async function([undef, t]) {
            try {
                return await t.p_rawstore(data, verbose); //url
            } catch(err) {
                console.log("Could not rawstore to", t.name, err.message);
                errs.push(err);
                return undefined;
            }
        }));
        rr = rr.filter((r) => !!r); // Trim any that had errors
        if (!rr.length) {
            throw new Dweb.errors.TransportError(errs.map((err)=>err.message).join(', ')); // New error with concatenated messages
        }
        return rr;
    }
    static async p_rawlist(urls, verbose) {
        let tt = this.validFor(urls, "list"); // Valid connected transports that support "store"
        if (!tt.length) {
            throw new Dweb.errors.TransportError('Transports.p_rawlist: Cant find transport for urls:'+urls.join(','));
        }
        let errs = [];
        let ttlines = await Promise.all(tt.map(async function([url, t]) {
            try {
                return await t.p_rawlist(url, verbose); // [sig]
            } catch(err) {
                console.log("Could not rawlist ", url, "from", t.name, err.message);
                errs.push(err);
                return [];
            }
        })); // [[sig,sig],[sig,sig]]
        if (errs.length >= tt.length) {
            // All Transports failed (maybe only 1)
            throw new Dweb.errors.TransportError(errs.map((err)=>err.message).join(', ')); // New error with concatenated messages
        }
        let uniques = {}; // Used to filter duplicates
        return [].concat(...ttlines)
            .filter((x) => (!uniques[x.signature] && (uniques[x.signature] = true)));
    }

    static async p_rawfetch(urls, verbose) {
        /*
        Fetch the data for a url, transports act on the data, typically storing it.
        urls:	array of urls to retrieve (any are valid)
        returns:	string - arbitrary bytes retrieved.
        throws:     TransportError with concatenated error messages if none succeed.
         */
        let tt = this.validFor(urls, "fetch"); //[ [Url,t],[Url,t]]
        if (!tt.length) {
            throw new Dweb.errors.TransportError("Transports.p_fetch cant find any transport for urls: " + urls);
        }
        //With multiple transports, it should return when the first one returns something.
        let errs = [];
        for (const [url, t] of tt) {
            try {
                return await t.p_rawfetch(url, verbose); //TODO-MULTI-GATEWAY potentially copy from success to failed URLs.
            } catch (err) {
                errs.push(err);
                console.log("Could not retrieve ", url.href, "from", t.name, err.message);
                // Don't throw anything here, loop round for next, only throw if drop out bottom
                //TODO-MULTI-GATEWAY potentially copy from success to failed URLs.
            }
        }
        throw new Dweb.errors.TransportError(errs.map((err)=>err.message).join(', '));  //Throw err with combined messages if none succeed
    }

    static async p_rawadd(urls, sig, verbose) {
        /*
        urls: of lists to add to
        sig: Sig to add
        returns:    undefined
        throws: TransportError with message being concatenated messages of transports if NONE of them succeed.
         */
        //TODO-MULTI-GATEWAY might be smarter about not waiting but Promise.race is inappropriate as returns after a failure as well.
        let tt = this.validFor(urls, "add"); // Valid connected transports that support "store"
        if (!tt.length) {
            throw new Dweb.errors.TransportError('Transports.p_rawstore: Cant find transport for urls:'+urls.join(','));
        }
        let errs = [];
        await Promise.all(tt.map(async function([u, t]) {
            try {
                await t.p_rawadd(u, sig, verbose); //undefined
                return undefined;
            } catch(err) {
                console.log("Could not rawlist ", u, "from", t.name, err.message);
                errs.push(err);
                return undefined;
            }
        }));
        if (errs.length >= tt.length) {
            // All Transports failed (maybe only 1)
            throw new Dweb.errors.TransportError(errs.map((err)=>err.message).join(', ')); // New error with concatenated messages
        }
        return undefined;

    }

    static listmonitor(urls, cb) {
        /*
        Add a listmonitor for each transport - note this means if multiple transports support it, then will get duplicate events back if everyone else is notifying all of them.
         */
        this.validFor(urls, "listmonitor")
            .map(([u, t]) => t.listmonitor(u, cb));
    }

    static async p_newlisturls(cl, verbose) {
        // Create a new list in any transport layer that supports lists.
        // cl is a CommonList or subclass and can be used by the Transport to get info for choosing the list URL (normally it won't use it)
        // Note that normally the CL will not have been stored yet, so you can't use its urls.
        let uuu = await Promise.all(this.validFor(undefined, "newlisturls")
            .map(([u, t]) => t.p_newlisturls(cl, verbose)) );   // [ [ priv, pub] [ priv, pub] [priv pub] ]
        return [uuu.map(uu=>uu[0]), uuu.map(uu=>uu[1])];    // [[ priv priv priv ] [ pub pub pub ] ]
    }

    // Stream handling ===========================================

    static createReadStream(urls, options, verbose) {
        let tt = this.validFor(urls, "createReadStream", options); //[ [Url,t],[Url,t]]  // Passing options - most callers will ignore TODO-STREAM support options in validFor
        if (!tt.length) {
            throw new Dweb.errors.TransportError("Transports.p_createReadStream cant find any transport for urls: " + urls);
        }
        //With multiple transports, it should return when the first one returns something.
        let errs = [];
        for (const [url, t] of tt) {
            try {
                return t.createReadStream(url, options, verbose);
            } catch (err) {
                errs.push(err);
                console.log("Could not retrieve ", url.href, "from", t.name, err.message);
                // Don't throw anything here, loop round for next, only throw if drop out bottom
                //TODO-MULTI-GATEWAY potentially copy from success to failed URLs.
            }
        }
        throw new Dweb.errors.TransportError(errs.map((err)=>err.message).join(', '));  //Throw err with combined messages if none succeed
    }

    // KeyValue support ===========================================

    static async p_get(urls, keys, verbose) {
        /*
        Fetch the values for a url and one or more keys, transports act on the data, typically storing it.
        urls:	array of urls to retrieve (any are valid)
        keys:   array of keys wanted
        returns:	string - arbitrary bytes retrieved or dict of key: value
        throws:     TransportError with concatenated error messages if none succeed.
         */
        let tt = this.validFor(urls, "get"); //[ [Url,t],[Url,t]]
        if (!tt.length) {
            throw new Dweb.errors.TransportError("Transports.p_get cant find any transport for urls: " + urls);
        }
        //With multiple transports, it should return when the first one returns something.
        let errs = [];
        for (const [url, t] of tt) {
            try {
                return await t.p_get(url, keys, verbose); //TODO-MULTI-GATEWAY potentially copy from success to failed URLs.
            } catch (err) {
                errs.push(err);
                console.log("Could not retrieve ", url.href, "from", t.name, err.message);
                // Don't throw anything here, loop round for next, only throw if drop out bottom
            }
        }
        throw new Dweb.errors.TransportError(errs.map((err)=>err.message).join(', '));  //Throw err with combined messages if none succeed
    }
    static async p_set(urls, keyvalues, value, verbose) {
        /* Set a series of key/values or a single value
         keyvalues:    Either dict or a string
         value: if kv is a string, this is the value to set
        throws: TransportError with message being concatenated messages of transports if NONE of them succeed.
        */
        let tt = this.validFor(urls, "set"); //[ [Url,t],[Url,t]]
        if (!tt.length) {
            throw new Dweb.errors.TransportError("Transports.p_set cant find any transport for urls: " + urls);
        }
        let errs = [];
        let success = false;
        let rr = await Promise.all(tt.map(async function([url, t]) {
            try {
                await t.p_set(url, keyvalues, value, verbose);
                success = true; // Any one success will return true
            } catch(err) {
                console.log("Could not rawstore to", t.name, err.message);
                errs.push(err);
            }
        }));
        if (!success) {
            throw new Dweb.errors.TransportError(errs.map((err)=>err.message).join(', ')); // New error with concatenated messages
        }
    }

    static async p_delete(urls, keys, verbose) {  //TODO-KEYVALUE-API
        /* Delete a key or a list of keys
         kv:    Either dict or a string
         value: if kv is a string, this is the value to set
        throws: TransportError with message being concatenated messages of transports if NONE of them succeed.
        */
        let tt = this.validFor(urls, "set"); //[ [Url,t],[Url,t]]
        if (!tt.length) {
            throw new Dweb.errors.TransportError("Transports.p_set cant find any transport for urls: " + urls);
        }
        let errs = [];
        let success = false;
        let rr = await Promise.all(tt.map(async function([url, t]) {
            try {
                await t.p_delete(url, keys, verbose);
                success = true; // Any one success will return true
            } catch(err) {
                console.log("Could not rawstore to", t.name, err.message);
                errs.push(err);
            }
        }));
        if (!success) {
            throw new Dweb.errors.TransportError(errs.map((err)=>err.message).join(', ')); // New error with concatenated messages
        }
    }
    static async p_keys(urls, verbose) {
        /*
        Fetch the values for a url and one or more keys, transports act on the data, typically storing it.
        urls:	array of urls to retrieve (any are valid)
        keys:   array of keys wanted
        returns:	string - arbitrary bytes retrieved or dict of key: value
        throws:     TransportError with concatenated error messages if none succeed.
         */
        let tt = this.validFor(urls, "keys"); //[ [Url,t],[Url,t]]
        if (!tt.length) {
            throw new Dweb.errors.TransportError("Transports.p_keys cant find any transport for urls: " + urls);
        }
        //With multiple transports, it should return when the first one returns something.
        let errs = [];
        for (const [url, t] of tt) {
            try {
                return await t.p_keys(url, verbose); //TODO-MULTI-GATEWAY potentially copy from success to failed URLs.
            } catch (err) {
                errs.push(err);
                console.log("Could not retrieve keys for", url.href, "from", t.name, err.message);
                // Don't throw anything here, loop round for next, only throw if drop out bottom
            }
        }
        throw new Dweb.errors.TransportError(errs.map((err)=>err.message).join(', '));  //Throw err with combined messages if none succeed
    }

    static async p_getall(urls, verbose) {
        /*
        Fetch the values for a url and one or more keys, transports act on the data, typically storing it.
        urls:	array of urls to retrieve (any are valid)
        keys:   array of keys wanted
        returns:	string - arbitrary bytes retrieved or dict of key: value
        throws:     TransportError with concatenated error messages if none succeed.
         */
        let tt = this.validFor(urls, "getall"); //[ [Url,t],[Url,t]]
        if (!tt.length) {
            throw new Dweb.errors.TransportError("Transports.p_getall cant find any transport for urls: " + urls);
        }
        //With multiple transports, it should return when the first one returns something.
        let errs = [];
        for (const [url, t] of tt) {
            try {
                return await t.p_getall(url, verbose); //TODO-MULTI-GATEWAY potentially copy from success to failed URLs.
            } catch (err) {
                errs.push(err);
                console.log("Could not retrieve all keys for", url.href, "from", t.name, err.message);
                // Don't throw anything here, loop round for next, only throw if drop out bottom
            }
        }
        throw new Dweb.errors.TransportError(errs.map((err)=>err.message).join(', '));  //Throw err with combined messages if none succeed
    }

    static async p_newdatabase(pubkey, verbose) {
        /*
            Create a new database in any transport layer that supports databases (key value pairs).
            pubkey: CommonList, KeyPair, or exported public key
            resolves to: [ privateurl, publicurl]
         */
        let uuu = await Promise.all(this.validFor(undefined, "newdatabase")
            .map(([u, t]) => t.p_newdatabase(pubkey, verbose)) );   // [ { privateurl, publicurl} { privateurl, publicurl} { privateurl, publicurl} ]
        return { privateurls: uuu.map(uu=>uu.privateurl), publicurls: uuu.map(uu=>uu.publicurl) };    // { privateurls: [], publicurls: [] }
    }

    static async p_newtable(pubkey, table, verbose) {
        /*
            Create a new table in any transport layer that supports the function (key value pairs).
            pubkey: CommonList, KeyPair, or exported public key
            resolves to: [ privateurl, publicurl]
         */
        let uuu = await Promise.all(this.validFor(undefined, "newtable")
            .map(([u, t]) => t.p_newtable(pubkey, table, verbose)) );   // [ [ priv, pub] [ priv, pub] [priv pub] ]
        return { privateurls: uuu.map(uu=>uu.privateurl), publicurls: uuu.map(uu=>uu.publicurl)};    // {privateurls: [ priv priv priv ], publicurls: [ pub pub pub ] }
    }

    static monitor(urls, cb, verbose) {
        /*
        Add a listmonitor for each transport - note this means if multiple transports support it, then will get duplicate events back if everyone else is notifying all of them.
         */
        this.validFor(urls, "monitor")
            .map(([u, t]) => t.monitor(u, cb, verbose));
    }



    static addtransport(t) {
        /*
        Add a transport to _transports,
         */
        Transports._transports.push(t);
    }

    // Setup Transports - setup0 is called once, and should return quickly, p_setup1 and p_setup2 are asynchronous and p_setup2 relies on p_setup1 having resolved.

    static setup0(transports, options, verbose) {
        /*
        Setup Transports for a range of classes
        transports is abbreviation HTTP, IPFS, LOCAL or list of them e.g. "HTTP,IPFS"
        Handles "LOCAL" specially, turning into a HTTP to a local server (for debugging)

        returns array of transport instances
         */
        // "IPFS" or "IPFS,LOCAL,HTTP"
        transports = transports.split(','); // [ "IPFS", "LOCAL", "HTTP" ]
        let localoptions = {http: {urlbase: "http://localhost:4244"}};
        return transports.map((tabbrev) => {
            let transportclass;
            if (tabbrev === "LOCAL") {
                transportclass = Dweb["TransportHTTP"];
            } else {
                transportclass = Dweb["Transport" + tabbrev];
            }
            return transportclass.setup0(tabbrev === "LOCAL" ? localoptions : options, verbose);
        });
    }
    static async p_setup1(verbose) {
        /* Second stage of setup, connect if possible */
        // Does all setup1a before setup1b since 1b can rely on ones with 1a, e.g. YJS relies on IPFS
        await Promise.all(Dweb.Transports._transports.map((t) => t.p_setup1(verbose)));
    }
    static async p_setup2(verbose) {
        /* Second stage of setup, connect if possible */
        // Does all setup1a before setup1b since 1b can rely on ones with 1a, e.g. YJS relies on IPFS
        await Promise.all(Dweb.Transports._transports.map((t) => t.p_setup2(verbose)));
    }
    static async test(verbose) {
        if (verbose) {console.log("Transports.test")}
        try {
            /*
            let testurl = "yjs:/yjs/THISATEST";  // Just a predictable number can work with
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
            */
            //console.log("TransportYJS test complete");
            let db = await this.p_newdatabase("TESTNOTREALLYAKEY", verbose);    // { privateurls, publicurls }
            console.assert(db.privateurls[0] === "yjs:/yjs/TESTNOTREALLYAKEY");
            let table = await this.p_newtable("TESTNOTREALLYAKEY","TESTTABLE", verbose);         // { privateurls, publicurls }
            let mapurls = table.publicurls;
            console.assert(mapurls[0] === "yjs:/yjs/TESTNOTREALLYAKEY/TESTTABLE");
            await this.p_set(mapurls, "testkey", "testvalue", verbose);
            let res = await this.p_get(mapurls, "testkey", verbose);
            console.assert(res === "testvalue");
            await this.p_set(mapurls, "testkey2", {foo: "bar"}, verbose);
            res = await this.p_get(mapurls, "testkey2", verbose);
            console.assert(res.foo === "bar");
            await this.p_set(mapurls, "testkey3", [1,2,3], verbose);
            res = await this.p_get(mapurls, "testkey3", verbose);
            console.assert(res[1] === 2);
            res = await this.p_keys(mapurls);
            console.assert(res.length === 3 && res.includes("testkey3"));
            res = await this.p_getall(mapurls, verbose);
            console.assert(res.testkey2.foo === "bar");


        } catch(err) {
            console.log("Exception thrown in Transports.test:", err.message);
            throw err;
        }
    }

}
Transports._transports = [];    // Array of transport instances connected


exports = module.exports = Transports;
