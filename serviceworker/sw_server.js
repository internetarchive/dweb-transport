/* global self, Response */

'use strict'

const DwebTransports = require('dweb-transports'); // Handles multiple transports
const Domain = require('../js/Domain');
const Leaf = Domain.clsLeaf;

self.addEventListener('install', (event) => {
    console.log('service-worker 2018apr10 1102 installing');
    event.waitUntil(self.skipWaiting());
})

self.addEventListener('activate', (event) => {
    console.log('service-worker activating');
    /*
    ipfsstart();  // Ignore promise
    */
    event.waitUntil(self.clients.claim())
});

self.addEventListener('fetch', (event) => {
    //Called each time client tries to load a URL in the domain
    if (event.request.url.startsWith(self.location.origin + '/ping')) {
        // Just for testing
        event.respondWith(p_ping(event.request.url));
    } else if (event.request.url.startsWith(self.location.origin + '/ipfs')) {
        console.log('Handling IPFS fetch event for', event.request.url);
        const multihash = event.request.url.split('/ipfs/')[1];
        //event.respondWith(catAndRespond(multihash));
        event.respondWith(p_ping(event.request.url, "Not implemented yet"))
    } else {
        event.respondWith(p_responseFrom(url))
            .catch((err) => return console.log('Fetch not in scope', event.request.url));
    }
    // The browser will now attempt to get it in the normal way
    // return console.log('Fetch not in scope', event.request.url);
})

async function p_responseFrom(url) {
    // Resolves to a HTTP response with the data from the url
    return new Response(await filefrom(url), {status: 200, statusText: 'OK', headers: {}});

}
async function p_ping(url, text) {
    //TODO check here that any persistent things like IPFS still running.
    const headers = {status: 200, statusText: 'OK', headers: {}};
    return new Response(`${text || "Ping response to:"} ${url}`, headers)
}
async function filefrom(url) {
    /* Retrieve a URL being smart about resolving domains etc */
    let name;
    if (url.hostname.startsWith("dweb.")) {                                 // e.g. https://dweb.archive.org/details/commute
        name = ["arc/", url.hostname.substring(5), url.pathname].join("");   // arc/archive.org/details/commute
    } else if ( url.pathname.startsWith("/archive.org")) {                     // e.g. https://localhost:4244/archive.org/details/commu
        name = ["arc",url.pathname].join("");                               // arc/archive.org/details/commute
    } else {
        console.error("Unable to bootstrap",url.href, "unrecognized pattern");
        return `Unable to bootstrap ${url.href} unrecognized pattern`;
    }
    const search_supplied = url.search.slice(1); // Skip initial ?
    console.log("Name to lookup=",name);
    console.log("Connecting to decentralized transports");
    //document.write('<div id="statuselement"></div>');
    await DwebTransports.p_connect({transports: searchparams.getAll("transport")}); //statuselement: document.getElementById("statuselement")
    try {
        const res = await Domain.p_rootResolve(name, {verbose});
        const resolution = res[0];
        const remainder = res[1];
        const opentarget="_self";
        if ((resolution instanceof Leaf) && ["text/html"].includes(resolution.mimetype)) {
            OK - WEVE GOT A PROBLEM HERE - CANT PASS THE REMAINDER TO THE FILE - NOR IS IT IN THE URL SO CLIENT WONT SEE IT
            TRY PASSING BACK IN A FAKE HTTP HEADER
            //Its an HTML file, open it
            if (resolution.metadata.htmlusesrelativeurls) {
                console.log("Not handling metadata.htmlusesrelativeurls YET"); // see bootstrap.html for how this was handled
                /*
                let tempurls = resolution.urls;
                const pathatt = resolution.metadata.htmlpath || "path";
                while (tempurls.length) {
                    url = new URL(tempurls.shift());
                    try {
                        if (remainder) url.search = url.search + (url.search ? '&' : "") + `${pathatt}=${remainder}`;
                        if (search_supplied) url.search = url.search + (url.search ? '&' : "") + search_supplied;
                        if (verbose) console.log("Bootstrap loading url:", url.href);
                        window.open(url.href, opentarget); //if opentarget is blank then I think should end this script.
                        break; // Only try and open one
                    } catch(err) {
                        console.error("Unable to load ",url.href)
                    }
                }
                */
            }
                return DwebTransports.p_rawfetch()
                //TODO-BOOTSTRAP Not clear if parms make sense to a blob, if so can copy from above
                // Not setting timeoutMS as could be a slow load of a big file TODO-TIMEOUT make dependent on size
                Dweb.utils.display_blob(await DwebTransports.p_rawfetch(resolution.urls, {verbose}), {type: resolution.mimetype, target: opentarget});
            }
        }
    } catch(err) {
        console.error("Got error",err);
    }
}