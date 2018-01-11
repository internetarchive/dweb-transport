const Url = require('url');
const stream = require('readable-stream');

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
        throw new Dweb.errors.IntentionallyUnimplementedError("Intentionally undefined function Transport.setup0 should have been subclassed");
        }

    p_setup1(options, verbose) { return this; }
    p_setup2(options, verbose) { return this; }

    static async p_setup(options, verbose) {
            /*
            Setup the resource and open any P2P connections etc required to be done just once.
            In almost all cases this will call the constructor of the subclass

            :param obj options: Data structure required by underlying transport layer (format determined by that layer)
            :param boolean verbose: True for debugging output
            :resolve Transport: Instance of subclass of Transport
             */
            let t = await this.setup0(options, verbose) // Sync version that doesnt connect
                .p_setup1(verbose); // And connect

            return t.p_setup2(verbose);     // And connect
    }

    supports(url, func) {
        /*
        Determine if this transport supports a certain set of URLs and a func

        :param url: String or parsed URL
        :return:    True if this protocol supports these URLs and this func
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
        :param boolean verbose: True for debugging output
        :resolve string: url of data stored
         */
        throw new Dweb.errors.ToBeImplementedError("Intentionally undefined function Transport.p_rawstore should have been subclassed");
    }

    async p_rawstoreCaught(data, verbose) {
        try {
            return await this.p_rawstore(data, verbose);
        } catch (err) {

        }
    }
    p_store() {
        throw new Dweb.errors.ToBeImplementedError("Undefined function Transport.p_store - may define higher level semantics here (see Python)");
    }

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

    p_fetch() {
        throw new Dweb.errors.ToBeImplementedError("Undefined function Transport.p_fetch - may define higher level semantics here (see Python)");
    }

    p_rawadd(url, sig, verbose) {
        /*
        Store a new list item, ideally it should be stored so that it can be retrieved either by "signedby" (using p_rawlist) or
        by "url" (with p_rawreverse). The underlying transport does not need to guarantee the signature,
        an invalid item on a list should be rejected on higher layers.

        :param string url: String identifying an object being added to the list.
        :param Signature sig: A signature data structure.
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

    p_list() {
        throw new Error("Undefined function Transport.p_list");
    }
    p_newlisturls(cl, verbose) {
        /*
        Must be implemented by any list, return a pair of URLS that may be the same, private and public links to the list.
        returns: ( privateurl, publicurl) e.g. yjs:xxx/yyy or orbitdb:a123
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
        :param boolean verbose: True for debugging output
        :resolve array: An array of objects as stored on the list.
         */
        throw new Dweb.errors.ToBeImplementedError("Undefined function Transport.p_rawreverse");
    }

    createReadStream(url, opts = {}, verbose = false) {
        /*
            Locate and read a stream, based on its url
            This is the default version if the Transport hasn't defined one, and so by assumption doesnt natively support createReadStream.
        */
        if (verbose) console.log("%s:createReadStream: %o, %o", this.name, url, opts);
        const through = new stream.PassThrough();
        ((opts.start || opts.end) && !this.supportFeatures.includes('fetch.range'))
        ? this.p_rawfetch(url, verbose)
            .then((buff) => buff.slice(opts.start || 0, opts.end || buff.length))
        : this.p_rawfetch(url, verbose, opts)
            //TODO-STREAMS to be totally accurate we should check the range returned and check it matches what sent as HTTP servers can ignore range
        .then((buff) => {
            console.log("createReadStream read %s bytes",buff.length);
            through.write(buff);
            through.end();
        }); // Should be a buffer we can pass to through
        // Return the stream immediately. wont output anything till promise above resolves and writes the buffer to it.
        return through;
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
            if ((typeof val === "object") && !Array.isArray(val) && a[key]) {
                c[key] = Transport.mergeoptions(a[key], b[key]);
            } else {
                c[key] = b[key];
            }
        }
        return c;
    }

}
Transport.STATUS_CONNECTED = 0; // Connected - all other numbers are some version of not ok to use
Transport.STATUS_FAILED = 1;    // Failed to connect
Transport.STATUS_STARTING = 2;  // In the process of connecting
Transport.STATUS_LOADED = 3;    // Code loaded, but haven't tried to connect. (this is typically hard coded in subclasses constructor)

exports = module.exports = Transport;
