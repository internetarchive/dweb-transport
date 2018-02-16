// Fake a browser like environment for some tests inc in Node CreateCustomEvent
const jsdom = require("jsdom");
const { JSDOM } = jsdom;        //TODO - figure out what this does, dont understand the Javascript
htmlfake = '<!DOCTYPE html><ul><li id="myList.0">Failed to load sb via StructuredBlock</li><li id="myList.1">Failed to load mb via MutableBlock</li><li id="myList.2">Failed to load sb via dwebfile</li><li id="myList.3">Failed to load mb via dwebfile</li></ul>';
const dom = new JSDOM(htmlfake);
document = dom.window.document;   // Note in JS can't see "document" like can in python

const Dweb = require('./Dweb');


/*
    This file sets up various data structures,

    It can be run multiple times and new runs should override old ones.
    Generally its best to use deterministic keys here, rather than newly generated ones as multiple runs can otherwise cause unneccessary merkle-cascades.

    Usage:  > node setup.js


 */


// Utility packages (ours) And one-liners
//function delay(ms, val) { return new Promise(resolve => {setTimeout(() => { resolve(val); },ms)})}

require('y-leveldb')(Dweb.TransportYJS.Y); //- can't be there for browser, node seems to find it ok without this and auto-loads with a warning.
let verbose = true;
// Note that this test setup is being mirror in test_ipfs.html
// In general it should be possible to comment out failing tests EXCEPT where they provide a value to the next */

async function p_setup(verbose) {
    try {
        //SEE-OTHER-ADDTRANSPORT - note these are options just for testing that override default options for the transport.
        let opts = {
            //http: {urlbase: "http://localhost:4244"},   // Localhost - comment out if want to use gateway.dweb.me (default args use this) //TODO-BOOTSTRAP
            yarray: {db: {name: "leveldb", dir: "../leveldb_dweb", connector: {}}},  // cleanStart: true  clears db so dont use that
            webtorrent: {}
        }; // Note browser requires indexeddb

        // Note the order of these is significant, it will retrieve by preference from the first setup, try with both orders if in doubt.
        //SEE-OTHER-ADDTRANSPORT
        let t_ipfs = await Dweb.TransportIPFS.p_setup(opts, verbose); await t_ipfs.p_status(); // Note browser requires indexeddb
        let t_yjs = await Dweb.TransportYJS.p_setup(opts, verbose);  await t_yjs.p_status(); // Should find ipfs transport
        let t_http = await Dweb.TransportHTTP.p_setup(opts, verbose); await t_http.p_status();
        //let t_webtorrent = await Dweb.TransportWEBTORRENT.p_test(opts, verbose); await t_webtorrent.p_status();
        if (verbose) console.log("setup returned and transport(s) connected:", Dweb.Transports.connectedNames());
        await Dweb.Domain.p_setupOnce(verbose);
    } catch (err) {
        console.log("Test failed", err);
    }


}
p_setup(verbose);
/* path tests not done ... old ones
 console.log("Now test path using dwebfile and sb =======");
 verbose=false;
 Dweb.p_dwebfile("sb", sburl, "langs/readme.md", ["p_elem", "myList.2", verbose, null]);
 console.log("Now test path using dwebfile and mb =======");
 Dweb.p_dwebfile("mb", mburl, "langs/readme.md", ["p_elem", "myList.3", verbose, null]);
 console.log("END testing previouslyworking()");

 */

