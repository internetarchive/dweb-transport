const Url = require('url');
const Dweb = require('./Dweb.js');

/*
Handles multiple transports, API should be (almost) the same as for an individual transport)
 */


class Transports {
    constructor(options, verbose) {
        if (verbose) console.log("Transports(%o)",options);
    }

    static validFor(urls, func) {
        /*
        Finds an array or Transports that can support this URL.

        Excludes any transports whose status != 0 as they aren't connected

        urls:       Array of urls
        func:       Function to check support for: fetch, store, add, list, listmonitor, reverse - see supportFunctions on each Transport class
        returns:    Array of pairs of url & transport instance [ [ u1, t1], [u1, t2], [u2, t1]]
         */
        console.assert((urls && urls[0]) || ["store"].includes(func), "Transports.validFor failed - coding error - url=", urls, "func=", func) // FOr debugging old calling patterns with [ undefined ]
        if (!(urls && urls.length > 0)) {
            return Dweb.Transports._transports.filter((t) => (!t.status && t.supports(undefined, func)))
                .map((t) => [undefined, t]);
        } else {
            return [].concat(
                ...urls.map((url) => typeof url === 'string' ? Url.parse(url) : url) // parse URLs once
                    .map((url) =>
                        Dweb.Transports._transports.filter((t) => (!t.status && t.supports(url, func))) // [ t1, t2 ]
                            .map((t) => [url, t]))); // [[ u, t1], [u, t2]]
        }
    }

    static async p_rawstore(data, verbose) {
        /*
        data: Raw data to store
        returns:    Array of urls of where stored
        throws: TransportError with message being concatenated messages of transports if NONE of them succeed.
         */
        let tt = Dweb.Transports.validFor(undefined, "store"); // Valid connected transports that support "store"
        if (!tt.length) {
            throw new Dweb.errors.TransportError('Transports.p_rawstore: Cant find transport for urls:'+urls.join(','));
        }
        let errs = [];
        let rr = await Promise.all(tt.map(async function([undef, t]) {
            try {
                return await t.p_rawstore(data, verbose); //url
            } catch(err) {
                console.log("Could not rawlist ", url, "from", t.name, err.message);
                errs.push(err)
                return undefined;
            }
        }));
        rr = rr.filter((r) => !!r); // Trim any that had errors
        if (!rr.length) {
            throw new Dweb.errors.TransportError(errs.map((err)=>err.message).join(', ')); // New error with concatentated messages
        }
        return rr;
    }
    static async p_rawlist(urls, verbose) {
        let tt = Dweb.Transports.validFor(urls, "list"); // Valid connected transports that support "store"
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
            throw new Dweb.errors.TransportError(errs.map((err)=>err.message).join(', ')); // New error with concatentated messages
        }
        let uniques = {}; // Used to filter duplicates
        let lines = [].concat(...ttlines)
            .filter((x) => (!uniques[x.signature] && (uniques[x.signature] = true)));
        return lines;
    }

    static async p_rawfetch(urls, verbose) {
        /*
        Fetch the data for a url, subclasses act on the data, typically storing it.
        urls:	array of urls to retrieve (any are valid)
        returns:	string - arbitrary bytes retrieved.
        throws:     TransportError with concatenated error messages if none succeed.
         */
        let tt = Dweb.Transports.validFor(urls, "fetch"); //[ [u,t],[u,t]]
        if (!tt.length) {
            throw new Dweb.errors.TransportError("Transports.p_fetch cant find any transport for urls: " + urls);
        }
        //With multiple transports, it should return when the first one returns something.
        let errs = [];
        for (const [url, t] of tt) {
            try {
                let res = await t.p_rawfetch(url, verbose);
                return res; //TODO-MULTI-GATEWAY potentially copy from success to failed URLs.
            } catch (err) {
                errs.push(err);
                console.log("Could not retrieve ", url, "from", t.name, err.message);
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
        //TODO-MULTI might be smarter about not waiting but Promise.race is inappropriate as returns after a failure as well.
        let tt = Dweb.Transports.validFor(urls, "add"); // Valid connected transports that support "store"
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
                errs.push(err)
                return undefined;
            }
        }));
        if (errs.length >= tt.length) {
            // All Transports failed (maybe only 1)
            throw new Dweb.errors.TransportError(errs.map((err)=>err.message).join(', ')); // New error with concatentated messages
        }
        return undefined;

    }

    static listmonitor(urls, cb) {
        /*
        Add a listmonitor for each transport - note this means if multiple transports support it, then will get duplicate events back if everyone else is notifying all of them.
         */
        Dweb.Transports.validFor(urls, "listmonitor")
            .map(([u, t]) => t.listmonitor(u, cb));
    }


    static addtransport(t) {
        /*
        Add a transport to _transports,
         */
        Transports._transports.push(t);
    }

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
        return await Promise.all(Dweb.Transports._transports.map((t) = t.p_setup1(verbose)))
    }
}
Transports._transports = [];    // Array of transport instances connected


exports = module.exports = Transports;