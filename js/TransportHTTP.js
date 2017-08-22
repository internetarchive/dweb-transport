const TransportHTTPBase = require('./TransportHTTPBase.js');
const sodium = require("libsodium-wrappers");   // Note for now this has to be Mitra's version as live version doesn't support urlsafebase64

//TODO-HTTP at the moment this isn't setup to work in browser, should be simple to do.

defaulthttpoptions = {
    ipandport: [ 'localhost',4243]
};

class TransportHTTP extends TransportHTTPBase {

    constructor(ipandport, verbose, options) {
        super(ipandport, options);
        this.options = options; // Dictionary of options, currently unused
    }


    static p_setup(httpoptions, verbose, options) {
        let combinedhttpoptions = Object.assign(defaulthttpoptions, httpoptions);
        return new Promise((resolve, reject) => {
            try {
                let t = new TransportHTTP(combinedhttpoptions.ipandport, verbose, options);
                resolve(t);
            } catch (err) {
                console.log("Exception thrown in TransportHTTP.p_setup");
                reject(err);
            }
        })
    }

    static setup(ipandport, options) {
        let verbose = false;    //TODO check if should be in args
        return new TransportHTTP(ipandport, verbose, options);
    }

    url(data) {
        /*
         Return an identifier for the data without storing
         //TODO - this needs changing the identifier should look like a real URL

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

