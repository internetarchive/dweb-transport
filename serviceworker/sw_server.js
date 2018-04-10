/* global self, Response */

'use strict'

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
    /* Called each time client tries to load a URL in the domain
     */
    if (event.request.url.startsWith(self.location.origin + '/ping')) {
        // Just for testing
        event.respondWith(p_ping(event.request.url));
    } else if (event.request.url.startsWith(self.location.origin + '/ipfs')) {
        console.log('Handling IPFS fetch event for', event.request.url);
        const multihash = event.request.url.split('/ipfs/')[1];
        event.respondWith(p_ping(event.request.url, "Not implemented yet"))
    } else {
        // The browser will now attempt to get it in the normal way
        return console.log('Fetch not in scope', event.request.url);
    }
    //event.respondWith(catAndRespond(multihash));
})

async function p_ping(url, text) {
    //TODO check here that any persistent things like IPFS still running.
    const headers = {status: 200, statusText: 'OK', headers: {}};
    return new Response(`${text || "Ping response to:"} ${url}`, headers)
}
