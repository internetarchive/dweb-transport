const Transport = require('./Transport.js');
const Dweb = require('./Dweb.js');
const sodium = require("libsodium-wrappers");   // Note for now this has to be Mitra's version as live version doesn't support urlsafebase64
if (typeof(Window) === "undefined") {
    //console.log("XXX@TransportHTTP.7 Must be on Node");
    //var fetch = require('whatwg-fetch').fetch; //Not as good as node-fetch-npm, but might be the polyfill needed for browser.safari
    //XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;  // Note this doesnt work if set to a var or const, needed by whatwg-fetch
    var fetch = require('node-fetch-npm');
    console.log("XXX Node loaded");
}
//TODO-HTTP at the moment this isn't setup to work in browser, should be simple to do except for potential Cross Origin (cors) issues
//TODO-HTTP to work on Safari or mobile will require a polyfill, see https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch for comment

defaulthttpoptions = {
    ipandport: [ 'localhost',4243]
};

class TransportHTTP extends Transport {

    constructor(options, verbose) {
        super(options, verbose);
        this.options = options;
        this.ipandport = options.http.ipandport;
        this.urlschemes = ['http'];
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

         :param string|Buffer data   arbitrary data
         :return string              valid id to retrieve data via p_rawfetch
         */
        //TODO-HTTP use templating in next string
        return "http://"+this.ipandport[0]+":"+this.ipandport[1]+"/rawfetch/"+Dweb.KeyPair.multihashsha256_58(data);    // Was "BLAKE2."+ sodium.crypto_generichash(32, data, null, 'urlsafebase64');
    }

    p_httpfetch(command, url, init, verbose) { // Embrace and extend "fetch" to check result etc.
        /*
        Fetch a url based from default server at command/multihash

        url: optional - contains multihash as last component (Maybe TODO handle already parsed URL if provided).
         */
        // Locate and return a block, based on its url
        // Throws Error if fails - should be TransportError but out of scope
        //TODO-HTTP could check that rest of URL conforms to expectations.
        let httpurl=`http://${this.ipandport[0]}:${this.ipandport[1]}/${command}`;
        if (url) {
            let parsedurl = Url.parse(url);
            let multihash = parsedurl.pathname.split('/').slice(-1);
            if (multihash) httpurl += "/" + multihash;
        }
        if (verbose) console.log(command, "httpurl=",httpurl);
        return fetch(httpurl, init) // A promise
            .then((response) => {
                if(response.ok) {
                    if (response.headers.get('Content-type') === "application/json") {
                        return response.json(); // promise resolving to JSON
                    } else {
                        return response.text(); // promise resolving to text
                    }
                }   // TODO-HTTP may need to handle binary as a buffer instead of text
                throw new Error(`Transport Error ${response.status}: ${response.statusText}`); // Should be TransportError but out of scope
            })
            .then((xxx) => {console.log("p.rawfetch returning",typeof(xxx),xxx); return xxx;} )
    }

    p_get(command, url, verbose) {
        // Locate and return a block, based on its url
        // Throws Error if fails - should be TransportError but out of scope
        let init = {    //https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
            method: 'GET',
            headers: {},
            mode: 'cors',
            cache: 'default',
            redirect: 'follow',  // Chrome defaults to manual
        }; //TODO-HTTP expand this
        return this.p_httpfetch(command, url, init, verbose);
    }

    p_post(command, url, type, data, verbose) {
        // Locate and return a block, based on its url
        // Throws Error if fails - should be TransportError but out of scope
        let init = {    //https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
            method: 'POST',
            headers: { 'Content-type': type},
            body: data,
            mode: 'cors',
            cache: 'default',
            redirect: 'follow',  // Chrome defaults to manual
        }; //TODO-HTTP expand this
        return this.p_httpfetch(command, url, init, verbose);
    }

    p_rawfetch(url, verbose) {
        console.assert(url, "TransportHTTP.p_rawlist: requires url");
        return this.p_get("rawfetch", url, verbose)
    }

    p_rawlist(url, verbose) {
        // obj being loaded
        // Locate and return a block, based on its url
        console.assert(url, "TransportHTTP.p_rawlist: requires url");
        return this.p_get("rawlist", url, verbose);
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
        let value = this._add_value( url, date, signature, signedby, verbose)+ "\n";
        return this.p_post("rawadd", null, "application/json", value, verbose); // Returns immediately
    }

    async_update(self, url, type, data, verbose, success, error) { console.trace(); console.assert(false, "OBSOLETE"); //TODO-IPFS obsolete with p_*
        this.async_post("update", url, type, data, verbose, success, error);
    }

    static test() {
        return new Promise((resolve, reject)=> resolve(this));  // I think this should be a noop - fetched already
    }

    info() { console.assert(false, "XXX Undefined function Transport.info"); }

}
exports = module.exports = TransportHTTP;

