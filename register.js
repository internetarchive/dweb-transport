#!/usr/bin/env node

global.DwebTransports = require('dweb-transports'); // Manage all Transports that are loaded
var DwebObjects = require('dweb-objects');
var args = process.argv; // '/usr/local/bin/node', '/usr/local/dweb-archive/register.js', '/ipfs/Q1234'

var verbose = false;
pathname = "/arc/archive.org/examples";
urls = ["https://dweb.archive.org/examples/"];

while (args.length) {
    arg = args.shift();
    //if (arg == "-v") { verbose=true; }
    if (arg.startsWith("/ipfs/")) { urls.push("ipfs:"+arg+"/"); }
}

async function p_main() {
    let patharr = pathname.split('/');
    if (patharr[0] == "") patharr.shift(); // Strip any leading /
    let name = patharr.pop()
    let pathdom = patharr.join('/')
    var res;
    let opts = {
        //http: {urlbase: "http://localhost:4244"},   // Localhost - comment out if want to use gateway.dweb.me (default args use this)
        yarray: {db: {name: "leveldb", dir: "../leveldb_dweb", connector: {}}},  // cleanStart: true  clears db so dont use that
        webtorrent: {}
    }; // Note browser requires indexeddb
    let t_http = await DwebTransports._transportclasses["HTTP"].p_setup(opts, verbose); await t_http.p_status();
    const pass1 = "all knowledge for all time to everyone for free"; // TODO-NAMING make something secret
    let kc = await DwebObjects.KeyChain.p_new({name: "Archive.org Admin"}, {passphrase: "Archive.org Admin/" + pass1}, verbose);    // Login

    //Just debugging
    //let purls = kc._keys.map(k => k._publicurls);
    //let sds = await Promise.all(purls.map(uu => DwebObjects.SmartDict.p_fetch(uu)));

    // End debugging
    res = await DwebObjects.Domain.p_rootResolve(pathname, {verbose: verbose});   // NEED TO GET PRIVATE VERSION
    console.log("path",pathname, "was registered to", res[0] ? await res[0].p_printable({maxindent: 0}) : undefined, res[1] ? "remaining:" + res[1] : "");
    leaf = await DwebObjects.Leaf.p_new({urls: urls, metadata: {htmlpath: "/"}}, verbose, {});
    res = await DwebObjects.Domain.p_rootResolve(pathdom, {verbose: verbose});
    console.assert(!res[1], "Should resolve with no remainder");
    let dommasters = kc._keys.filter(k => (k.keys[0] == res[0].keys[0]) && (k.tablepublicurls[0] == res[0].tablepublicurls[0]))
    console.assert(dommasters.length, "Looks like we dont have private key for this domain");
    dommaster = dommasters[dommasters.length-1]
    await dommaster.p_register("examples", leaf, verbose)
    res = await DwebObjects.Domain.p_rootResolve(pathname, {verbose: verbose});

    console.log("Registered path",pathname, "to", await res[0].p_printable({maxindent: 0}), res[1] ? "remaining:" + res[1] : "");
}

p_main();

