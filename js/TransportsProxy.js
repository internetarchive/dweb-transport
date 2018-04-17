/*
This is a proxy that connects to a Service Worker running Transports.
Part of the intention is to reduce the amount of code loaded for each page, and part is to keep webtorrent, IPFS running in background
for comprehensible service worker messaging example See https://github.com/GoogleChrome/samples/blob/gh-pages/service-worker/post-message/service-worker.js
where much of this code came from

Note expect to see this loaded with const DwebTransport = require(Transports) to reuse code that calls DwebTransport
 */
const errors = require("./Errors");
const utils = require("./utils");
const stream = require('readable-stream');

//TODO-SW should have one-line edit of this to give direct to Transports version so can always "require TransportsProxy
class TransportsProxy {
    constructor(options, verbose) {
        if (verbose) console.log("Transports(%o)", options);
    }

    static async p_registerServiceWorker() {
        console.log("Registering Service Worker");
        if ('serviceWorker' in navigator) {

            await navigator.serviceWorker.register(window.location.origin+'/serviceworker_bundle.js');
            console.log('-> Registered the service worker successfully');
        } else {
            console.error("Unable to register service worker as not in 'navigator'");
        }
        this.refreshstatuses(await this.p_statuses());
    }

    static _p_proxy(command, args) {
        // This wraps the message posting/response in a promise, which will resolve if the response doesn't
        // contain an error, and reject with the error if it does. If you'd prefer, it's possible to call
        // controller.postMessage() and set up the onmessage handler independently of a promise, but this is
        // a convenient wrapper.
        return new Promise(function (resolve, reject) {
            var messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = function (event) {
                if (event.data.error) {
                    console.log("Client received error", event.data.error);
                    reject(new errors.TransportError(event.data.error));
                } else {
                    console.log("Client received response")
                    resolve(event.data);
                }
            };

            // This sends the message data as well as transferring messageChannel.port2 to the service worker.
            // The service worker can then use the transferred port to reply via postMessage(), which
            // will in turn trigger the onmessage handler on messageChannel.port1.
            // See https://html.spec.whatwg.org/multipage/workers.html#dom-worker-postmessage
            navigator.serviceWorker.controller.postMessage(
                {command, args},
                [messageChannel.port2]);
        });
    }

    static async p_statuses() {
        return await this._p_proxy("p_statuses", []);
    }
    static async p_connectedNames() {
        return await this._p_proxy("p_connectedNames", []);
    }
    static async p_connectedNamesParm() {
        return await this._p_proxy("p_connectedNamesParm", []);
    }
    static async p_rawfetch(urls, opts) {
        return await this._p_proxy("p_rawfetch", [urls, opts]);
    }
    static async p_rawstore(data, opts) {
        return await this._p_proxy("p_rawstore", [data, opts]);
    }
    static async p_rawlist(urls, opts) {
        return await this._p_proxy("p_rawlist", [urls, opts]);
    }
    static async p_rawadd(urls, sig, opts) {
        return await this._p_proxy("p_rawadd", [urls, sig, opts]);
    }
    static async p_get(urls, keys, opts) {
        return await this._p_proxy("p_get", [urls, keys, opts]);
    }
    static async p_set(urls, keyvalues, value, opts) {
        return await this._p_proxy("p_set", [urls, keyvalues, value, opts]);
    }
    static async p_delete(urls, keys, opts) {
        return await this._p_proxy("p_delete", [urls, keys, opts]);
    }
    static async p_resolveNames(urls) {
        return await this._p_proxy("p_resolveNames", [urls]);
    }
    static async p_keys(urls, opts) {
        return await this._p_proxy("p_keys", [urls, opts]);
    }
    static async p_getall(urls, opts) {
        return await this._p_proxy("p_getall", [urls, opts]);
    }
    static async p_newdatabase(pubkey, opts) {
        return await this._p_proxy("p_newdatabase", [pubkey, opts]);
    }
    static async p_newtable(pubkey, table, opts) {
        return await this._p_proxy("p_newtable", [pubkey, table, opts]);
    }
    static async p_httpfetchurls(urls) {
        return await this._p_proxy("p_httpfetchurls", [urls]);
    }
    static async p_urlsFrom(url) {
        return await this._p_proxy("p_urlsFrom", [url]);
    }
    static async p_urlsValidFor(urls, func, options) {
        return await this._p_proxy("p_urlsValidFor", [urls, func, options]);
    }
    /*
    static listmonitor(urls, cb) // TODO-SW -- cb isnt going to work, or maybe it can via message passing
    static async p_newlisturls(cl, opts)  // TODO-SW -- will need to extract info from cl
    */

    static async refreshstatuses(statuses) {
        /* Refresh display of statuses:
        statuses    [ {name, status}* ]
         */
        statuses.map(s => this.refreshstatus(s.name, s.status));
    }
    static async refreshstatus(name, status) {
        let statuselement = TransportsProxy.options.statuselement; // May be undefined
        if (statuselement) {
            let el = Array.prototype.slice.call(statuselement.getElementsByTagName("LI")).find((el) => el.getAttribute("name") === name);
            if (!el) {
                el = utils.createElement("LI",
                    {onclick: "this.source.togglePaused(DwebTransports.refreshstatus);", name}, //TODO-SW figure out how to send this back
                    name);
                statuselement.appendChild(el);
            }
            let statusclasses = ["transportstatus0","transportstatus1","transportstatus2","transportstatus3","transportstatus4"];
            el.classList.remove(...statusclasses);
            el.classList.add(statusclasses[status]);
        }

    }

    static async p_connect(options, verbose) {
        //options = { defaulttransports: ["IPFS"], statuselement: el, http: {}, ipfs: {} }
        // Chain is typically: archive.html.main > TP.p_connect > TP.p_registerServiceWorker > SW.activate ...
        this.options = options; // Save for later - esp statuselement
        this.p_registerServiceWorker();
        navigator.serviceWorker.addEventListener('message', function(event) {
            if (event.data.command === "status") {
                TransportsProxy.refreshstatus(event.data.name, event.data.status);
            } else {
                console.log("Client received uninterpretable SW message",event.data);
            }

        });
    }

    static async p_f_createReadStream(urls, options={}) {     // TODO need to tell proxy to return a url
        let wanturl = options.wanturl; // Save for interpretation below
        options.wanturl = true; // Always set wanturl for call
        let verbose = options["verbose"];
        let url = await this._p_proxy("p_f_createReadStream", [urls, options]); // Note will be a URL structure
        if (wanturl) {
            return url;
        } else {
            let self = this;
            console.log("XXX@TP.164 url=",url)
            return function(opts) { return self.createReadStream(url, opts, verbose); };
        }
    }

    static createReadStream(httpurl, opts={}, verbose) {
        /*
        This is hard! Have to return a stream immediately, but all possible ways to get it are async.

        Doesnt work on WebTorrent as is, because it returns a Browser ReadableStream, and rendermedia wants a node ReadStream
        doesnt matter for now since with Service Worker, best to go direct to <video src = '/magnet/...'>
        Revisit this for IPFS streams when they work.
         */
        console.log("XXX@TPcrs httpurl=",httpurl, opts)
        const through = new stream.PassThrough();
        let headers = new Headers();
        if (opts.start || opts.end) headers.append("range", `bytes=${opts.start || 0}-${opts.end || ""}`);
        let init = {    //https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
            method: 'GET',
            headers: headers,
            mode: 'cors',
            cache: 'default',
            redirect: 'follow',  // Chrome defaults to manual
            keepalive: true    // Keep alive - mostly we'll be going back to same places a lot
        };
        httpurl = (typeof(httpurl) === "string" ? httpurl : httpurl.href).replace('magnet:',`${window.origin}/magnet/`) // Relative to root of this window
        fetch(new Request(httpurl, init))
            .then((resp) => {
                console.log(resp);
                resp.body.pipeThrough(through);  // This might not be correct
                //resp.socket.pipe(through)
            });
        return through;
    }
}
TransportsProxy.type = "ServiceWorker";
exports = module.exports = TransportsProxy;
