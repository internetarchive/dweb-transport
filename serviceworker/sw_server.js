/* global self, Response */

'use strict'

/*IPFS
const IPFS = require('ipfs')
*/
/*PROXY
const {createProxyServer} = require('ipfs-postmsg-proxy');
*/
/*IPFS
let node
*/
self.addEventListener('install', (event) => {
    console.log('service-worker 2018apr10 1102 installing');
    event.waitUntil(self.skipWaiting());
})
/*IPFS
async function ipfsstart(verbose) {
    //Just start IPFS - promise resolves when its started
    const self = this;
    return new Promise((resolve, reject) => {
        node = new IPFS({
            config: {
                Addresses: {
                    repo: '/tmp/dweb_ipfsv2700',
                    Addresses: {
                        Swarm: ['/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star']
                    }
                }
            }
        });
        node.on('ready', () => {
            resolve();
        });
        node.on('error', (err) => reject(err));
    })
        .then(() => node.version())
        .then((version) => console.log('IPFS READY', version))
        .catch((err) => {
            console.log("Error caught in ipfsstart");
            throw(err);
        });
}
*/

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
/*
async function catAndRespond(hash) {
    // Fetch file, and return in a HTTP response
    if (!node) await ipfsstart();
    const data = await node.files.cat(hash);
    const headers = {status: 200, statusText: 'OK', headers: {}};
    return new Response(data, headers)
}
*/

/*PROXY
createProxyServer(() => node, {
    addListener: self.addEventListener.bind(self),
    removeListener: self.removeEventListener.bind(self),
    async postMessage(data) {
        // TODO: post back to the client that sent the message?
        const clients = await self.clients.matchAll();
        clients.forEach(client => client.postMessage(data))
    }
});
*/
