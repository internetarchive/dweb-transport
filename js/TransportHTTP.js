const Transport = require('./Transport.js');
const Dweb = require('./Dweb.js');
const sodium = require("libsodium-wrappers");   // Note for now this has to be Mitra's version as live version doesn't support urlsafebase64
const nodefetch = require('node-fetch-npm');
var fetch,Headers,Request;
if (typeof(Window) === "undefined") {
    //var fetch = require('whatwg-fetch').fetch; //Not as good as node-fetch-npm, but might be the polyfill needed for browser.safari
    //XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;  // Note this doesnt work if set to a var or const, needed by whatwg-fetch
    console.log("Node loaded");
    fetch = nodefetch;
    Headers = fetch.Headers;      // A class
    Request = fetch.Request;      // A class
} else {
    // If on a browser, need to find fetch,Headers,Request in window
    console.log("Loading browser version of fetch,Headers,Request");
    fetch = window.fetch;
    Headers = window.Headers;
    Request = window.Request;
}
//TODO-HTTP to work on Safari or mobile will require a polyfill, see https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch for comment

defaulthttpoptions = {
    //ipandport: [ 'localhost',4243]
    //ipandport: [ 'sandbox.dweb.me', 443]
    ipandport: [ 'gateway.dweb.me', 443]
};

class TransportHTTP extends Transport {

    constructor(options, verbose) {
        super(options, verbose);
        this.options = options;
        this.ipandport = options.http.ipandport;
        this.urlschemes = ['http','https'];
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
        return `https://${this.ipandport[0]}:${this.ipandport[1]}/contenthash/rawfetch/${Dweb.KeyPair.multihashsha256_58(data)}`;
    }

    p_status() {    //TODO-BACKPORT
        /*
        Return a string for the status of a transport. No particular format, but keep it short as it will probably be in a small area of the screen.
        resolves to: String representing type connected (always HTTP) and online if online.
         */
        let self = this;
        return this.p_info()
            .then((info) => {
                self.info = info;
                return self.info.type.toUpperCase() + " online"
            })
            .catch((err) => {
                console.log("Error in p_status.info",err);
                return "OFFLINE ERROR";
            })
    }


    p_httpfetch(command, url, init, verbose) { // Embrace and extend "fetch" to check result etc.
        /*
        Fetch a url based from default server at command/multihash

        url: optional - contains multihash as last component (Maybe TODO handle already parsed URL if provided).
        throws: TODO if fails to fetch
         */
        // Locate and return a block, based on its url
        // Throws Error if fails - should be TransportError but out of scope
        //TODO-HTTP could check that rest of URL conforms to expectations.
        let httpurl=`https://${this.ipandport[0]}:${this.ipandport[1]}/${command}`;
        if (url) {
            let parsedurl = Url.parse(url);
            let multihash = parsedurl.pathname.split('/').slice(-1);
            if (multihash) httpurl += "/" + multihash;
        }
        if (verbose) console.log(command, "httpurl=",httpurl);
        if (verbose) console.log(command, "init=",init);
        //console.log('CTX=',init["headers"].get('Content-Type'))
        // Using window.fetch, because it doesn't appear to be in scope otherwise in the browser.
        return fetch(new Request(httpurl, init)) // A promise, throws (on Chrome, untested on Ffox or Node) TypeError: Failed to fetch)
            .then((response) => {
                if(response.ok) {
                    if (response.headers.get('Content-Type') === "application/json") {
                        return response.json(); // promise resolving to JSON
                    } else {
                        return response.text(); // promise resolving to text
                    }
                }   // TODO-HTTP may need to handle binary as a buffer instead of text
                throw new Error(`Transport Error ${response.status}: ${response.statusText}`); // Should be TransportError but out of scope
            })
            .catch((err) => { console.log("Probably misleading error from fetch:",httpurl,err); throw new Error(`Transport error thrown by ${httpurl}`)})   // Error here is particularly unhelpful - if rejected during the COrs process it throws a TypeError
    }

    p_get(command, url, verbose) {
        // Locate and return a block, based on its url
        // Throws Error if fails - should be TransportError but out of scope
        let init = {    //https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
            method: 'GET',
            headers: new Headers(),
            mode: 'cors',
            cache: 'default',
            redirect: 'follow',  // Chrome defaults to manual
        };
        return this.p_httpfetch(command, url, init, verbose);
    }

    p_post(command, url, type, data, verbose) {
        // Locate and return a block, based on its url
        // Throws Error if fails - should be TransportError but out of scope
        //let headers = new window.Headers();
        //headers.set('content-type',type); Doesn't work, it ignores it
        let init = {
            //https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
            //https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_header_name for headers tat cant be set
            method: 'POST',
            headers: {}, //headers,
            //body: new Buffer(data),
            body: data,
            mode: 'cors',
            cache: 'default',
            redirect: 'follow',  // Chrome defaults to manual
        };
        return this.p_httpfetch(command, url, init, verbose);
    }

    p_rawfetch(url, verbose) {
        console.assert(url, "TransportHTTP.p_rawlist: requires url");
        return this.p_get("content/rawfetch", url, verbose)
    }

    p_rawlist(url, verbose) {
        // obj being loaded
        // Locate and return a block, based on its url
        console.assert(url, "TransportHTTP.p_rawlist: requires url");
        return this.p_get("metadata/rawlist", url, verbose); //TODO-GATEWAY add rawlist to Python
    }
    rawreverse() { console.assert(false, "XXX Undefined function TransportHTTP.rawreverse"); }

    p_rawstore(data, verbose) {
        //PY: res = self._sendGetPost(True, "rawstore", headers={"Content-Type": "application/octet-stream"}, urlargs=[], data=data, verbose=verbose)
        console.assert(data, "TransportHttp.p_rawstore: requires data");
        return this.p_post("contenthash/rawstore", null, "application/octet-stream", data, verbose) // Returns immediately with a promise
    }

    p_rawadd(url, date, signature, signedby, verbose) { //TODO-BACKPORT turn date into ISO before adding
        //verbose=true;
        console.assert(url && signature && signedby, "p_rawadd args",url,signature,signedby);
        if (verbose) console.log("rawadd", url, date, signature, signedby);
        let value = this._add_value( url, date.toISOString(), signature, signedby, verbose)+ "\n";
        return this.p_post("void/rawadd", null, "application/json", value, verbose); // Returns immediately
    }

    async_update(self, url, type, data, verbose, success, error) { console.trace(); console.assert(false, "OBSOLETE"); //TODO-IPFS obsolete with p_*
        this.async_post("update", url, type, data, verbose, success, error);
    }

    static test() {
        return new Promise((resolve, reject)=> resolve(this));  // I think this should be a noop - fetched already
    }

    p_info() { return this.p_get("info"); } //TODO-BACKPORT

}
exports = module.exports = TransportHTTP;

