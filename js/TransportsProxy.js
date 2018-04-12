/*
This is a proxy that connects to a Service Worker running Transports.
Part of the intention is to reduce the amount of code loaded for each page, and part is to keep webtorrent, IPFS running in background
for comprehensible service worker messaging example See https://github.com/GoogleChrome/samples/blob/gh-pages/service-worker/post-message/service-worker.js
where much of this code came from

Note expect to see this loaded with const DwebTransport = require(TransportsProxy) to reuse code that calls DwebTransport
 */
const errors = require("../js/Errors");

class TransportsProxy {
    constructor(options, verbose) {
        if (verbose) console.log("Transports(%o)", options);
    }

    static async p_registerServiceWorker() {
        if ('serviceWorker' in navigator) {

            await navigator.serviceWorker.register('serviceworker_bundle.js');
            console.log('-> Registered the service worker successfully');
            navigator.serviceWorker.addEventListener('message', function(event) {
                // Set up a listener for messages posted from the service worker.
                // The service worker is set to post a message to all its clients once it's run its activation
                // handler and taken control of the page, so you should see this message event fire once.
                console.log("Client received SW message:",event.data); // Just a placeholder for async messages back
            });
        } else {
            console.log("Unable to register service worker as not in 'navigator'");
        }
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

    //TODO-SW complete this list
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
        return await this._p_proxy("p_resolveNames", [urls, opts]);
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

    /*
    static listmonitor(urls, cb) // TODO-SW -- cb isnt going to work, or maybe it can via message passing
    static async p_f_createReadStream(urls, verbose, options) // TODO-SW -- will need to figure out where to split function
    static async p_newlisturls(cl, opts)  // TODO-SW -- will need to extract info from cl
    */

    static async p_connect(options, verbose) {
        //options = { defaulttransports: ["IPFS"], statuselement: el, http: {}, ipfs: {} }
        TransportsProxy.p_registerServiceWorker(); //TODO-SW move to explicitly connect, currently connects automatically on activate
        //TODO-SW get status reports as async message to all controlled pages and forward to statuselement
    }
}
exports = module.exports = TransportsProxy;

