/* global self, Response */

'use strict'

const DwebTransports = require('dweb-transports'); // Handles multiple transports
//TODO-SW put Domain back in, then figure out why rawfetch fails (see sw_client XXX1)
const Domain = require('./Domain'); // Must be after DwebTransports, plugs into DwebTransports to resolve names
const Leaf = Domain.clsLeaf;

self.addEventListener('install', (event) => {
    console.log('service-worker installing');
    event.waitUntil(self.skipWaiting());
    console.log('service-worker clients.skipWaiting completed');
})

self.addEventListener('activate', (event) => {
    console.log('service-worker activating');
    event.waitUntil(DwebTransports.p_connect()); //{transports: searchparams.getAll("transport")}; statuselement: document.getElementById("statuselement")
    /*
    ipfsstart();  // Ignore promise
    */
    console.log('service-worker p_connect complete');
    event.waitUntil(self.clients.claim())
    console.log('service-worker clients.claim completed');
    // After the activation and claiming is complete, send a message to each of the controlled
    // pages letting it know that it's active.
    // This will trigger navigator.serviceWorker.onmessage in each client.
    //TODO-SW do something useful here, like returning status
    return self.clients.matchAll().then(function(clients) {
        return Promise.all(clients.map(function (client) {
            return client.postMessage('The service worker has activated and taken control.');
        }));
    });
});

self.addEventListener('fetch', (event) => {
    // self.location.origin is e.g. "localhost:8080" and URL should always match this or Service Worker wont catch it
    //Called each time client tries to load a URL in the domain
    let url = new URL(event.request.url);
    let verbose = url.searchParams.get("verbose") || false;
    console.log("Service Worker called with url=",url.href);
    if (url.pathname.startsWith('/ping')) {                 // Just for testing
        event.respondWith(p_ping(`Ping: ${url.href}`));
    } else if (url.pathname.startsWith('/test')) {          // Feel free to change this
        event.respondWith(p_redirect("./temp.html"));
    } else if (url.hostname.startsWith("dweb.") && (url.hostname !== "dweb.me")) {          // https://dweb.archive.org/details/foo -> dweb.archive.org/arc/archive.org/details/foo
        url.pathname = `/arc/${url.hostname.substring(5)}${url.pathname}`
        event.respondWith(p_redirect(url.href));
    } else if ( url.pathname.startsWith("/archive.org")) {  // https://localhost:4244/archive.org/details/foo -> /arc/archive.org/details/foo
        url.pathname = `/arc${url.pathname}`
        event.respondWith(p_redirect(url.href));
    //TODO-SW this group just here till "BASE" in version on gateway
    } else if (url.pathname.startsWith("/arc/archive.org/details/includes/")) {
        event.respondWith(p_redirect(`https://dweb.me/examples/includes/${url.pathname.slice(34)}`));
    } else if (url.pathname === "/arc/archive.org/details/htmlutils.js") {
        event.respondWith(p_redirect(`https://dweb.me/examples/htmlutils.js`));
    } else if (url.pathname === "/arc/archive.org/details/loginutils.js") {
        event.respondWith(p_redirect(`https://dweb.me/examples/loginutils.js`));
    } else if (url.pathname === "/arc/archive.org/details/example_styles.css") {
        event.respondWith(p_redirect(`https://dweb.me/examples/example_styles.css`));
    } else if (url.pathname === "/arc/archive.org/details/archive_webpacked.js") {
        event.respondWith(p_redirect(`https://dweb.me/examples/archive_webpacked.js`));
    //TODO-SW end of material to remove once BASE established
    } else if ( url.pathname.startsWith("/arc/")) {         // https://localhost:4244/arc/archive.org/details/foo -> archive.html (from resolution)
        event.respondWith(p_responseFromName(url.pathname, url.search.slice(1), {verbose}));   // Skip initial "?" in search
    //TODO-SW implement ipfs catch (and magnet)
    //TODO-SW makesure archive.html doesnt start p_connect, and passes requests to SW
    //TODO-SW see how handling /metadata
    //TODO-SW build bootstrap into things like archive.html
    } else if ((url.pathname.startsWith('/ipfs')) && (url.hostname !== "ipfs.io")) {
        //TODO-SW move https://ipfs.io check into TransportsIPFS so use one URL dweb:/ipfs of ipfs:/ipfs and tries IPFS & http://ipfs.io
        event.respondWith(p_respondFromDwebUrl(`ipfs:${url.pathname}`));
    }
    // The browser will now attempt to get it in the normal way
    else {
        return console.log("Out of scope trying from browser", url.href);
    }
})

async function p_ping(url, text) {
    const headers = {status: 200, statusText: 'OK', headers: {"Location": "FOO.html"}};
    return new Response(`${text || "Ping response to:"} ${url}`, headers)
}
async function p_redirect(newurl) {
    //TODO-SW maybe use the redirect status that doesnt change the URL
    //TODO-SW make sure search queries make it htrough the redirections
    console.log("Redirecting to", newurl)
    return new Response(undefined,  {status: 307, statusText: 'OK', headers: {"Location": newurl}})
}
async function p_respondFromDwebUrl(url) {
    let data = await DwebTransports.p_rawfetch(resolution.urls, {verbose});
    //TODO-SW one problem is that we dont know the mime type here
    return new Response(data, {status: 200, statusText: 'OK', headers: {}});
}
async function p_responseFromName(name, search_supplied, {verbose=false}={}) {
    /* Retrieve a URL being smart about resolving domains etc */
    console.log("Name to lookup=",name);
    console.log("Connecting to decentralized transports");
    //document.write('<div id="statuselement"></div>');
    //TODO - connect at start
    try {
        const res = await Domain.p_rootResolve(name, {verbose});
        const resolution = res[0];
        const remainder = res[1];
        if (remainder.length) {
            // TODO make leaf clear about remainder - can specify to ignore it, or its a redirect (which would only work with one URL returned)
        }
        let data = await DwebTransports.p_rawfetch(resolution.urls, {verbose});
        return new Response(data, {status: 200, statusText: 'OK', headers: {"Content-type": resolution.mimetype}});

    } catch(err) {
        console.error("Got error",err);
        throw(err);
    }
}

self.addEventListener('message', (event) => {
    /* This ia proxy for Transports
    event.command = p_rawfetch|.... //TODO-SW extend to cover all commands used
     */
    console.log("SW handling event", event);
    let res;
    if (typeof DwebTransports[event.data.command] !== "function") {
        event.ports[0].postMessage({error: `No such command on DwebTransports: ${event.data.command}`});
    }
    DwebTransports[event.data.command](...event.data.args)
    .then((res) => { console.log("XXX@123 res=", res); return res; }) //TODO-SW remove debugging
        .then((res) => event.ports[0].postMessage(res))
        .catch((err) => event.ports[0].postMessage({error: err.message}));
    return false;
})

