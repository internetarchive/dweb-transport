const TransportHTTPBase = require('./TransportHTTPBase.js');
const sodium = require("libsodium-wrappers");   // Note for now this has to be Mitra's version as live version doesn't support urlsafebase64

//TODO-HTTP at the moment this isn't setup to work in browser, should be simple to do.

defaulthttpoptions = {
    ipandport: [ 'localhost',4243]
};

class TransportHTTP extends TransportHTTPBase {

    constructor(options, verbose) {
        super(options, verbose);
    }

    static p_setup(options, verbose) {
    /*
    Setup the resource and open any P2P connections etc required to be done just once.
    In almost all cases this will call the constructor of the subclass
    Should return a new Promise that resolves to a instance of the subclass

    :param obj transportoptions: Data structure required by underlying transport layer (format determined by that layer)
    :param boolean verbose: True for debugging output
    :param options: Data structure stored on the .options field of the instance returned.
    :resolve Transport: Instance of subclass of Transport
     */
        let combinedoptions = Transport.mergeoptions({ http: defaulthttpoptions },options);
        return new Promise((resolve, reject) => {
                try {
                    let t = new TransportHTTP(combinedoptions, verbose);
                    resolve(t);
                } catch (err) {
                    console.log("Exception thrown in TransportHTTP.p_setup");
                    reject(err);
                }
            })
        .then((t) => {
            Dweb.transports.http = t;
            Dweb.transportpriority.push(t);    // Sets to default transport if nothing else set otherwise on a list
            return t;
        })
        .catch((err) => {
            console.log("Caught error in TransportHTTP.setup", err);
            throw(err);
        })
    }

    url(data) {
        /*
         Return an identifier for the data without storing
         //TODO-REL4-MULTITRANSPORT - this needs changing the identifier should look like a real URL and use multihash

         :param string|Buffer data   arbitrary data
         :return string              valid id to retrieve data via p_rawfetch
         */
        return "BLAKE2."+ sodium.crypto_generichash(32, data, null, 'urlsafebase64');
    }

    p_rawfetch(url, verbose) {
        // Locate and return a block, based on its url
        return this.p_load("rawfetch", url, verbose);
    }
    p_rawlist(url, verbose) {
        // obj being loaded
        // Locate and return a block, based on its url
        console.assert(url, "TransportHTTP.p_rawlist: requires url");
        return this.p_load("rawlist", url, verbose);
    }
    rawreverse() { console.assert(false, "XXX Undefined function TransportHTTP.rawreverse"); }

    p_rawstore(data, verbose) {
        //PY: res = self._sendGetPost(True, "rawstore", headers={"Content-Type": "application/octet-stream"}, urlargs=[], data=data, verbose=verbose)
        console.assert(data, "TransportHttp.p_rawstore: requires data");
        return this.p_post("rawstore", null, "application/octet-stream", data, verbose) // Returns immediately with a promise
    }

    p_rawadd(url, date, signature, signedby, verbose) {
        //verbose=true;
        console.assert(url && signature && signedby, "p_rawadd args",url,signature,signedby);
        if (verbose) console.log("rawadd", url, date, signature, signedby);
        let value = TransportHTTP._add_value( url, date, signature, signedby, verbose)+ "\n";
        return this.p_post("rawadd", null, "application/json", value, verbose); // Returns immediately
    }

    async_update(self, url, type, data, verbose, success, error) { console.trace(); console.assert(false, "OBSOLETE"); //TODO-IPFS obsolete with p_*
        this.async_post("update", url, type, data, verbose, success, error);
    }

    static test() {
        return new Promise((resolve, reject)=> resolve(this));  // I think this should be a noop - fetched already
    }
}
exports = module.exports = TransportHTTP;

