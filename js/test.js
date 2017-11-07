const TransportHTTP = require('./TransportHTTP');
const Dweb = require('./Dweb');

/*
    This file is intended to be run under node, e.g. "node test.js" to test as many features as possible.
 */


// Utility packages (ours) Aand one-liners
//UNUSED: const makepromises = require('./utils/makepromises');
function delay(ms, val) { return new Promise(resolve => {setTimeout(() => { resolve(val); },ms)})}

//Comment out one of these next two lines
//let transportclass = Dweb.TransportIPFS;
let transportclass = TransportHTTP

// Fake a browser like environment for some tests
const jsdom = require("jsdom");
const { JSDOM } = jsdom;        //TODO - figure out what this does, dont understand the Javascript
htmlfake = '<!DOCTYPE html><ul><li id="myList.0">Failed to load sb via StructuredBlock</li><li id="myList.1">Failed to load mb via MutableBlock</li><li id="myList.2">Failed to load sb via dwebfile</li><li id="myList.3">Failed to load mb via dwebfile</li></ul>';
const dom = new JSDOM(htmlfake);
document = dom.window.document;   // Note in JS can't see "document" like can in python

let verbose = false;
let sb;
let acl;
    // Note that this test setup is being mirror in test_ipfs.html
    // In general it should be possible to comment out failing tests EXCEPT where they provide a value to the next */

async function p_test() {
    try {
        await transportclass.p_setup({
            iiif: {store: "leveldb"}, // Note browser requires indexeddb
            yarray: {db: {name: "leveldb", dir: "../dbtestjs", cleanStart: true}},  // Cleanstart clears db
            listmethod: "yarrays"
            //http uses default arguments in TransportHTTP for now TODO-HTTP bring them here
        }, verbose); // Note browser requires indexeddb
        if (verbose) console.log("setup returned and transport set - including annoationList");
        await transportclass.test(Dweb.transport(), verbose);
        await Dweb.Block.p_test(verbose);
        await Dweb.Signature.p_test(verbose);
        await Dweb.KeyPair.test(verbose);
        let acl = await Dweb.AccessControlList.p_test(verbose);
        //TODO-REL4 comment out before REL4
        //* - tests for later modules
        let sb = (await Dweb.StructuredBlock.test(document, verbose)).sb;
        console.log("sb=",sb);
        await Dweb.MutableBlock.test(sb, verbose);
        await Dweb.KeyChain.p_test(acl, verbose); // depends on MutableBlock for test, though not for KeyChain itself
     //*/ /TODO-REL4 comment out before REL4
        console.log("delaying 10 secs");
        await delay(2000);
        console.log("Completed test - running IPFS in background, hit Ctrl-C to exit");
} catch(err) {
    console.log("Test failed", err);
}


}
p_test();
/* path tests not done ... old ones
 console.log("Now test path using dwebfile and sb =======");
 verbose=false;
 Dweb.p_dwebfile("sb", sburl, "langs/readme.md", ["p_elem", "myList.2", verbose, null]);
 console.log("Now test path using dwebfile and mb =======");
 Dweb.p_dwebfile("mb", mburl, "langs/readme.md", ["p_elem", "myList.3", verbose, null]);
 console.log("END testing previouslyworking()");

 */

