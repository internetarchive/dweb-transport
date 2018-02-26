const errors = require('./Errors');
const Transport = require('./Transport.js');
const Dweb = require('./Dweb.js');
const nodefetch = require('node-fetch-npm');
const Url = require('url');

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
    urlbase: 'https://gateway.dweb.me:443'
};

servercommands = {  // What the server wants to see to return each of these
    rawfetch: "content/rawfetch",
    rawstore: "contenturl/rawstore",
    rawadd: "void/rawadd",
    rawlist: "metadata/rawlist",
    get:    "get/table",
    set:    "set/table",
    delete: "delete/table",
    keys:    "keys/table",
    getall:    "getall/table"
};


class TransportHTTP extends Transport {

    constructor(options, verbose) {
        super(options, verbose);
        this.options = options;
        this.urlbase = options.http.urlbase;
        this.supportURLs = ['contenthash', 'http','https']; // http and https are legacy
        this.supportFunctions = ['fetch', 'store', 'add', 'list', 'reverse', 'newlisturls', "get", "set", "keys", "getall", "delete", "newtable", "newdatabase"]; //Does not support: listmonitor - reverse is disabled somewhere not sure if here or caller
        this.supportFeatures = ['fetch.range']
        this.name = "HTTP";             // For console log etc
        this.status = Transport.STATUS_LOADED;
    }

    static setup0(options, verbose) {
        let combinedoptions = Transport.mergeoptions({ http: defaulthttpoptions },options);
        try {
            let t = new TransportHTTP(combinedoptions, verbose);
            Dweb.Transports.addtransport(t);
            return t;
        } catch (err) {
            console.log("Exception thrown in TransportHTTP.p_setup", err.message);
            throw err;
        }
    }
    async p_setup1(verbose) {
        return this;
    }

    async p_status(verbose) {    //TODO-BACKPORT
        /*
        Return a string for the status of a transport. No particular format, but keep it short as it will probably be in a small area of the screen.
        resolves to: String representing type connected (always HTTP) and online if online.
         */
        try {
            this.info = await this.p_info(verbose);
            this.status = Transport.STATUS_CONNECTED;
        } catch(err) {
            console.log(this.name, ": Error in p_status.info",err.message);
            this.status = Transport.STATUS_FAILED;
        }
        return this.status;
    }

    async p_httpfetch(httpurl, init, verbose) { // Embrace and extend "fetch" to check result etc.
        /*
        Fetch a url based from default server at command/multihash

        url: optional (depends on command)
        resolves to: data as text or json depending on Content-Type header
        throws: TransportError if fails to fetch
         */
        try {
            if (verbose) console.log("httpurl=%s init=%o", httpurl, init);
            //console.log('CTX=',init["headers"].get('Content-Type'))
            // Using window.fetch, because it doesn't appear to be in scope otherwise in the browser.
            let response = await fetch(new Request(httpurl, init));
            // fetch throws (on Chrome, untested on Firefox or Node) TypeError: Failed to fetch)
            // Note response.body gets a stream and response.blob gets a blob and response.arrayBuffer gets a buffer.
            if (response.ok) {
                let contenttype = response.headers.get('Content-Type');
                if (contenttype === "application/json") {
                    return response.json(); // promise resolving to JSON
                } else if (contenttype.startsWith("text")) { // Note in particular this is used for responses to store
                    return response.text(); // promise resolving to arrayBuffer (was returning text, but distorts binaries (e.g. jpegs)
                } else { // Typically application/octetStream when don't know what fetching
                    return new Buffer(await response.arrayBuffer()); // Convert arrayBuffer to Buffer which is much more usable currently
                }
            }
            // noinspection ExceptionCaughtLocallyJS
            throw new errors.TransportError(`Transport Error ${response.status}: ${response.statusText}`);
        } catch (err) {
            // Error here is particularly unhelpful - if rejected during the COrs process it throws a TypeError
            console.log("Note error from fetch might be misleading especially TypeError can be Cors issue:",httpurl);
            if (err instanceof errors.TransportError) {
                throw err;
            } else {
                throw new errors.TransportError(`Transport error thrown by ${httpurl}: ${err.message}`);
            }
        }
    }

    async p_GET(httpurl, verbose, opts={}) {
        // Locate and return a block, based on its url
        // Throws TransportError if fails
        // resolves to: URL that can be used to fetch the resource, of form contenthash:/contenthash/Q123
        let headers = new Headers();
        if (opts.start || opts.end) headers.append("range", `bytes=${opts.start || 0}-${opts.end || ""}`);
        let init = {    //https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
            method: 'GET',
            headers: headers,
            mode: 'cors',
            cache: 'default',
            redirect: 'follow',  // Chrome defaults to manual
        };
        return await this.p_httpfetch(httpurl, init, verbose); // This s a real http url
    }
    async p_POST(httpurl, type, data, verbose) {
        // Locate and return a block, based on its url
        // Throws TransportError if fails
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
        return await this.p_httpfetch(httpurl, init, verbose);
    }

    _cmdurl(command) {
        return  `${this.urlbase}/${command}`
    }
    _url(url, command, parmstr) {
        if (!url) throw new errors.CodingError(`${command}: requires url`);
        if (typeof url !== "string") { url = url.href }
        url = url.replace('contenthash:/contenthash', this._cmdurl(command)) ;   // Note leaves http: and https: urls unchanged
        url = url.replace('getall/table', command);
        url = url + (parmstr ? "?"+parmstr : "");
        return url;
    }
    async p_rawfetch(url, verbose, opts={}) {
        /*
        Fetch from underlying transport,
        Fetch is used both for contenthash requests and table as when passed to SmartDict.p_fetch may not know what we have
        url: Of resource - which is turned into the HTTP url in p_httpfetch
        throws: TransportError if fails
         */
        //if (!(url && url.includes(':') ))
        //    throw new errors.CodingError("TransportHTTP.p_rawfetch bad url: "+url);
        if (((typeof url === "string") ? url : url.href).includes('/getall/table')) {
            console.log("XXX@176 - probably dont want to be calling p_rawfetch on a KeyValueTable, especially since dont know if its keyvaluetable or subclass"); //TODO-NAMING
            return {
                table: "keyvaluetable",
                }
        } else {
            return await this.p_GET(this._url(url, servercommands.rawfetch), verbose, opts);
        }
    }

    p_rawlist(url, verbose) {
        // obj being loaded
        // Locate and return a block, based on its url
        if (!url) throw new errors.CodingError("TransportHTTP.p_rawlist: requires url");
        return this.p_GET(this._url(url, servercommands.rawlist), verbose);
    }
    rawreverse() { throw new errors.ToBeImplementedError("Undefined function TransportHTTP.rawreverse"); }

    async p_rawstore(data, verbose) {
        /*
        Store data on http server,
        data:   string
        resolves to: {string}: url
        throws: TransportError on failure in p_POST > p_httpfetch
         */
        //PY: res = self._sendGetPost(True, "rawstore", headers={"Content-Type": "application/octet-stream"}, urlargs=[], data=data, verbose=verbose)
        console.assert(data, "TransportHttp.p_rawstore: requires data");
        let res = await this.p_POST(this._cmdurl(servercommands.rawstore), "application/octet-stream", data, verbose); // resolves to URL
        let parsedurl = Url.parse(res);
        let pathparts = parsedurl.pathname.split('/');
        return `contenthash:/contenthash/${pathparts.slice(-1)}`

    }

    p_rawadd(url, sig, verbose) { //TODO-BACKPORT turn date into ISO before adding
        //verbose=true;
        if (!url || !sig) throw new errors.CodingError("TransportHTTP.p_rawadd: invalid parms",url, sig);
        if (verbose) console.log("rawadd", url, sig);
        let value = JSON.stringify(sig.preflight(Object.assign({},sig)))+"\n";
        return this.p_POST(this._url(url, servercommands.rawadd), "application/json", value, verbose); // Returns immediately
    }

    p_newlisturls(cl, verbose) {
       let  u = cl._publicurls.map(urlstr => Url.parse(urlstr))
            .find(parsedurl =>
                (parsedurl.protocol === "https" && parsedurl.host === "gateway.dweb.me" && parsedurl.pathname.includes('/content/rawfetch'))
                || (parsedurl.protocol === "contenthash:" && (parsedurl.pathname.split('/')[1] === "contenthash")));
        if (!u) {
            u = `contenthash:/contenthash/${ Dweb.KeyPair.multihashsha256_58(cl.keypair.publicexport()[0]) }`; // Pretty random, but means same test will generate same list
        }
        return [u,u];
    }

    // ============================== Key Value support


    // Support for Key-Value pairs as per
    // https://docs.google.com/document/d/1yfmLRqKPxKwB939wIy9sSaa7GKOzM5PrCZ4W1jRGW6M/edit#
    async p_newdatabase(pubkey, verbose) {
        if (pubkey instanceof Dweb.PublicPrivate)
            pubkey = pubkey.keypair;
        if (pubkey instanceof Dweb.KeyPair)
            pubkey = pubkey.publicexport();
        if (Array.isArray(pubkey))
            pubkey = pubkey.find(k => k.startsWith("NACL VERIFY:"));
        // By this point pubkey should be an export of a public key of form xyz:abc where xyz
        // specifies the type of public key (NACL VERIFY being the only kind we expect currently)
        let u =  `${this.urlbase}/getall/table/${encodeURIComponent(pubkey)}`; //TODO-KEYVALUE replace with URL of server
        return {"publicurl": u, "privateurl": u};
    }


    async p_newtable(pubkey, table, verbose) {
        if (!pubkey) throw new errors.CodingError("p_newtable currently requires a pubkey");
        let database = await this.p_newdatabase(pubkey, verbose);
        // If have use cases without a database, then call p_newdatabase first
        return { privateurl: `${database.privateurl}/${table}`,  publicurl: `${database.publicurl}/${table}`}  // No action required to create it
    }

    //TODO-KEYVALUE needs signing with private key of list
    async p_set(url, keyvalues, value, verbose) {  // url = yjs:/yjs/database/table/key   //TODO-KEYVALUE-API
        if (!url || !keyvalues) throw new errors.CodingError("TransportHTTP.p_set: invalid parms",url, keyvalyes);
        if (verbose) console.log("p_set", url, keyvalues, value);
        if (typeof keyvalues === "string") {
            let kv = JSON.stringify([{key: keyvalues, value: value}]);
            await this.p_POST(this._url(url, servercommands.set), "application/json", kv, verbose); // Returns immediately
        } else {
            let kv = JSON.stringify(Object.keys(keyvalues).map((k) => ({"key": k, "value": keyvalues[k]})));
            await this.p_POST(this._url(url, servercommands.set), "application/json", kv, verbose); // Returns immediately
        }
    }

    _keyparm(key) {
        return `key=${encodeURIComponent(key)}`
    }
    //TODO-KEYALUE got to here on KEYVALUE in HTTP
    async p_get(url, keys, verbose) {
        if (!url && keys) throw new errors.CodingError("TransportHTTP.p_get: requires url and at least one key");
        let parmstr =Array.isArray(keys)  ?  keys.map(k => this._keyparm(k)).join('&') : this._keyparm(keys)
        let res = await this.p_GET(this._url(url, servercommands.get, parmstr),verbose);
        return Array.isArray(keys) ? res : res[keys]
    }

    async p_delete(url, keys, verbose) {  //TODO-KEYVALUE-API need to think this one through
        if (!url && keys) throw new errors.CodingError("TransportHTTP.p_get: requires url and at least one key");
        let parmstr =  keys.map(k => this._keyparm(k)).join('&');
        await this.p_GET(this._url(url, servercommands.delete, parmstr),verbose);
    }

    async p_keys(url, verbose) {
        if (!url && keys) throw new errors.CodingError("TransportHTTP.p_get: requires url and at least one key");
        return await this.p_GET(this._url(url, servercommands.keys), verbose);
    }
    async p_getall(url, verbose) {
        if (!url && keys) throw new errors.CodingError("TransportHTTP.p_get: requires url and at least one key");
        return await this.p_GET(this._url(url, servercommands.getall), verbose);
    }
    /* Make sure doesnt shadow regular p_rawfetch
    async p_rawfetch(url, verbose) {
        return {
            table: "keyvaluetable",
            _map: await this.p_getall(url, verbose)
        };   // Data struc is ok as SmartDict.p_fetch will pass to KVT constructor
    }
    */

    p_info(verbose) { return this.p_GET(`${this.urlbase}/info`, verbose); } //TODO-BACKPORT

    static async p_test(opts={}, verbose=false) {
        if (verbose) {console.log("TransportHTTP.test")}
        try {
            let transport = await Dweb.TransportHTTP.p_setup(opts, verbose);
            if (verbose) console.log("HTTP connected");
            let res = await transport.p_info(verbose);
            if (verbose) console.log("TransportHTTP info=",res);
            res = await transport.p_status(verbose);
            console.assert(res === Transport.STATUS_CONNECTED);
            await transport.p_test_kvt("NACL%20VERIFY", verbose);
        } catch(err) {
            console.log("Exception thrown in TransportHTTP.test:", err.message);
            throw err;
        }
    }

    static async test() {
        return this;
    }

}
exports = module.exports = TransportHTTP;

