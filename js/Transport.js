const Url = require('url');

class Transport {

    constructor(options, verbose) {
        /*
        Doesnt do anything, its all done by SuperClasses,
        Superclass should merge with default options, call super
        */
    }
    p_setup(options, verbose) {
        /*
        Setup the resource and open any P2P connections etc required to be done just once.
        In almost all cases this will call the constructor of the subclass

        :param obj options: Data structure required by underlying transport layer (format determined by that layer)
        :param boolean verbose: True for debugging output
        :resolve Transport: Instance of subclass of Transport
         */
        throw new Dweb.errors.IntentionallyUnimplementedError("Intentionally undefined function Transport.p_setup should have been subclassed");
    }
    supports(url, func) {
        /*
        Determine if this transport supports a certain set of URLs

        :param url: String or parsed URL
        :return:    True if this protocol supports these URLs
        :throw:     TransportError if invalid URL
         */
        if (!url) { return true; }  // By default, can handle default URLs
        if (typeof url === "string") {
            url = Url.parse(url);    // For efficiency, only parse once.
        }
        if (!url.protocol) { throw new Error("URL failed to specific a scheme (before :) "+url.href)} //Should be TransportError but out of scope here
        // noinspection Annotator  supportURLs is defined in subclasses
        return (    (!url || this.supportURLs.includes(url.protocol.slice(0,-1)))
                &&  (!func || this.supportFunctions.includes(func)))
    }

    p_rawstore(data, verbose) {
        /*
        Store a blob of data onto the decentralised transport.
        Returns a promise that resolves to the url of the data

        :param string|Buffer data: Data to store - no assumptions made to size or content
        :param boolean verbose: True for debugging output
        :resolve string: url of data stored
         */
        throw new Dweb.errors.ToBeImplementedError("Intentionally undefined function Transport.p_rawstore should have been subclassed");
    }
    p_store() { throw new Dweb.errors.ToBeImplementedError("Undefined function Transport.p_store - may define higher level semantics here (see Python)"); }
    //noinspection JSUnusedLocalSymbols

    p_rawfetch(url, verbose) {
        /*
        Fetch some bytes based on a url, no assumption is made about the data in terms of size or structure.
        Where required by the underlying transport it should retrieve a number if its "blocks" and concatenate them.
        Returns a new Promise that resolves currently to a string.
        There may also be need for a streaming version of this call, at this point undefined.

        :param string url: URL of object being retrieved
        :param boolean verbose: True for debugging output
        :resolve string: Return the object being fetched, (note currently returned as a string, may refactor to return Buffer)
        :throws:        TransportError if url invalid - note this happens immediately, not as a catch in the promise
         */
        console.assert(false, "Intentionally undefined  function Transport.p_rawfetch should have been subclassed");
    }
    p_fetch() { throw new Dweb.errors.ToBeImplementedError("Undefined function Transport.p_fetch - may define higher level semantics here (see Python)"); }

    p_rawadd(url, sig, verbose) { //TODO-API-MULTI
        /*
        Store a new list item, it should be stored so that it can be retrieved either by "signedby" (using p_rawlist) or
        by "url" (with p_rawreverse). The underlying transport does not need to guarantee the signature,
        an invalid item on a list should be rejected on higher layers.

        :param string url: String identifying an object being added to the list.
        :param string date: Date (as returned by new Data.now() )
        :param string signature: Signature of url+date
        :param string signedby: url of the public key used for the signature.
        :param boolean verbose: True for debugging output
        :resolve undefined:
         */
        throw new Dweb.errors.ToBeImplementedError("Undefined function Transport.p_rawadd");
    }
    p_rawlist(url, verbose) {
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
        throw new Dweb.errors.ToBeImplementedError("Undefined function Transport.p_rawlist");
    }
    p_list() { throw new Dweb.errors.ToBeImplementedError("Undefined function Transport.p_list"); }
    //noinspection JSUnusedGlobalSymbols
    p_rawreverse(url, verbose) {
        /*
        Similar to p_rawlist, but return the list item of all the places where the object url has been listed.
        The url here corresponds to the "url" parameter of p_rawadd
        Returns a promise that resolves to the list.

        :param string url: String with the url that identifies the object put on a list.
        :param boolean verbose: True for debugging output
        :resolve array: An array of objects as stored on the list.
         */
        throw new Dweb.errors.ToBeImplementedError("Undefined function Transport.p_rawreverse");
    }

    listmonitor(url, callback, verbose) {
        /*
        Setup a callback called whenever an item is added to a list, typically it would be called immediately after a p_rawlist to get any more items not returned by p_rawlist.

        :param url:         string Identifier of list (as used by p_rawlist and "signedby" parameter of p_rawadd
        :param callback:    function(obj)  Callback for each new item added to the list
               	obj is same format as p_rawlist or p_rawreverse
        :param verbose:     boolean - True for debugging output
         */
        console.log("Undefined function Transport.listmonitor");    // Note intentionally a log, as legitamte to not implement it
    }

    static mergeoptions(a, b) {
        /*
        Deep merge options dictionaries
         */
        let c = Object.assign(a);
        for (let key in b) {
            let val = b[key];
            if ((typeof val === "object") && ! Array.isArray(val) && a[key]) {
                c[key] = Transport.mergeoptions(a[key], b[key]);
            } else {
                c[key] = b[key];
            }
        }
        return c;
    }

    static validFor(urls, func) { //TODO-API
        /*
        Finds an array or Transports that can support this URL.  url => [TransportInstanceA, TransportInstanceB]

        If passed an array of urls, returns a dict; [url1,url2] => {url1: [TransportInstanceA], url2: [TransportInstanceA, TransportInstanceB]}
        (note replaces old Dweb.transport() )

        urls:       Array of urls
        func:       Function to check support for: fetch, store, add, list, listmonitor, reverse - see supportFunctions on each Transport class
        returns:    Array of pairs of url & transport instance [ [ u1, t1], [u1, t2], [u2, t1]]
         */
        console.assert((urls && urls[0]) || ["store"].includes(func), "T.validFor failed - coding error - url=", urls, "func=", func) // FOr debugging old calling patterns with [ undefined ]
        if (!(urls && urls.length > 0)) {
            return Transport._transports.filter((t) => t.supports(undefined, func))
                .map((t) => [undefined, t]);
        } else {
            return [].concat(
                ...urls.map((url) => typeof url === 'string' ? Url.parse(url) : url) // parse URLs once
                    .map((url) =>
                        Transport._transports.filter((t) => t.supports(url, func)) // [ t1, t2 ]
                            .map((t) => [url, t]))); // [[ u, t1], [u, t2]]
        }
    }

    static addtransport(t) {
        /*
        Add a transport to _transports,
         */
        Transport._transports.push(t);
    }

    static setup0(transports, options, verbose) {
        /*
        Setup Transports for a range of classes

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
        return await Promise.all(Transport._transports.map((t) = t.p_setup1(verbose)))
    }
}
Transport._transports = [];    // Array of transport instances connected
Transport.STATUS_CONNECTED = 0; // Connected - all other numbers are some version of not ok to use
Transport.STATUS_FAILED = 1;    // Failed to connect
Transport.STATUS_STARTING = 2;  // In the process of connecting
Transport.STATUS_LOADED = 3;    // Code loaded, but haven't tried to connect. (this is typically hard coded in subclasses constructor)

exports = module.exports = Transport;