// Fake a browser like environment for some tests
const jsdom = require("jsdom");
const { JSDOM } = jsdom;        //TODO - figure out what this does, dont understand the Javascript
htmlfake = '<!DOCTYPE html><ul><li id="myList.0">Failed to load sb via StructuredBlock</li><li id="myList.1">Failed to load mb via MutableBlock</li><li id="myList.2">Failed to load sb via dwebfile</li><li id="myList.3">Failed to load mb via dwebfile</li></ul>';
const dom = new JSDOM(htmlfake);
document = dom.window.document;   // Note in JS can't see "document" like can in python

const Dweb = require('./Dweb');

/*
    This file is intended to be run under node, e.g. "node test.js" to test as many features as possible.
 */


// Utility packages (ours) Aand one-liners
//UNUSED: const makepromises = require('./utils/makepromises');
function delay(ms, val) { return new Promise(resolve => {setTimeout(() => { resolve(val); },ms)})}


require('y-leveldb')(Dweb.TransportYJS.Y); //- can't be there for browser, node seems to find it ok without this, though not sure why, though its the cause of the warning: YJS: Please do not depend on automatic requiring of modules anymore! Extend modules as follows `require('y-modulename')(Y)`
let verbose = false;
let acl;
    // Note that this test setup is being mirror in test_ipfs.html
    // In general it should be possible to comment out failing tests EXCEPT where they provide a value to the next */

async function p_test(verbose) {
    try {
        //Comment out one of these next two lines
        //let transportclass = Dweb.TransportIPFS;
        //SEE-OTHER-ADDTRANSPORT - note these are options just for testing that override default options for the transport.
        let opts = {
            http: {urlbase: "http://localhost:4244"},   // Localhost - comment out if want to use gateway.dweb.me (default args use this)
            yarray: {db: {name: "leveldb", dir: "../dbtestjs", cleanStart: true, connector: {}}},  // Cleanstart clears db
            webtorrent: {}
        }; // Note browser requires indexeddb

        // Note the order of these is significant, it will retrieve by preference from the first setup, try with both orders if in doubt.
        //SEE-OTHER-ADDTRANSPORT
        //let t_http = await Dweb.TransportHTTP.p_test(opts, verbose);
        let t_ipfs = await Dweb.TransportIPFS.p_test(opts, verbose); // Note browser requires indexeddb
        let t_yjs = await Dweb.TransportYJS.p_test(opts, verbose); // Should find ipfs transport
        //let t_webtorrent = await Dweb.TransportWEBTORRENT.p_test(opts, verbose); //
        // Note that p_tests call p_status which is needed on some protocols or they wont be used
        if (verbose) console.log("setup returned and transport(s) set");
        await Dweb.Transports.test(verbose);
        if (verbose) console.log("Transports tested");
        //TODO-KEYVALUE reenable these tests on http
        await Dweb.KeyValueTable.p_test(verbose);
        verbose=true;
        await Dweb.Domain.p_test(verbose);
        console.log("---EXITING AFTER PARTIAL TEST") //TODO-KEYVALUE remove this and "return" once done
        return

        await Dweb.Block.p_test(verbose);
        await Dweb.Signature.p_test(verbose);
        await Dweb.KeyPair.test(verbose);
        let res = await Dweb.AccessControlList.p_test(verbose);
        acl = res.acl;
        await Dweb.VersionList.test(verbose);
        await Dweb.KeyChain.p_test(acl, verbose); // depends on VersionList for test, though not for KeyChain itself
        console.log("------END OF PREVIOUS TESTING PAUSING=====");
        await delay(1000);
        console.log("------AWAITED ANY BACKGROUND OUTPUT STARTING NEXT TEST =====");
        console.log("------END OF NEW TESTING PAUSING=====");
        await delay(1000);
        console.log("------AND FINISHED WAITING =====");
        //let sb = (await Dweb.StructuredBlock.test(document, verbose)).sb;
        console.log("Completed test - running IPFS in background, hit Ctrl-C to exit");
    } catch (err) {
        console.log("Test failed", err);
    }


}
p_test(verbose);
/* path tests not done ... old ones
 console.log("Now test path using dwebfile and sb =======");
 verbose=false;
 Dweb.p_dwebfile("sb", sburl, "langs/readme.md", ["p_elem", "myList.2", verbose, null]);
 console.log("Now test path using dwebfile and mb =======");
 Dweb.p_dwebfile("mb", mburl, "langs/readme.md", ["p_elem", "myList.3", verbose, null]);
 console.log("END testing previouslyworking()");

 */

