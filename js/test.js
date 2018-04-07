// Fake a browser like environment for some tests inc in Node CreateCustomEvent
const jsdom = require("jsdom");
const { JSDOM } = jsdom;        //TODO - figure out what this does, dont understand the Javascript
htmlfake = '<!DOCTYPE html></html>';
const dom = new JSDOM(htmlfake);
document = dom.window.document;   // Note in JS can't see "document" like can in python

const Transports = require('dweb-transports'); // Manage all Transports that are loaded //TODO-REFACTOR mvoe to DwebTransports
//SEE-OTHER-ADDTRANSPORT
// Higher level object classes
const SmartDict = require('./SmartDict');
const KeyPair = require('./KeyPair'); // Encapsulate public/private key pairs and crypto libraries
const Signature = require('./Signature'); // Encapsulate a signature as used for items on a CommonList
const KeyValueTable = require('./KeyValueTable'); // Typically for small tables where mirror the whole thing
const CommonList = require('./CommonList');
const KeyChain = require('./KeyChain'); // Hold a set of keys, and locked objects
const AccessControlList = require('./AccessControlList'); // Parent of list classes
const VersionList = require('./VersionList'); // Hold a list that manages versions of something
const Domain = require('./Domain');

/*
    This file is intended to be run under node, e.g. "node test.js" to test as many features as possible.
 */


// Utility packages (ours) And one-liners
//UNUSED: const makepromises = require('./utils/makepromises');
function delay(ms, val) { return new Promise(resolve => {setTimeout(() => { resolve(val); },ms)})}


require('y-leveldb')(Transports._transportclasses["YJS"].Y); //- can't be there for browser, node seems to find it ok without this, though not sure why, though its the cause of the warning: YJS: Please do not depend on automatic requiring of modules anymore! Extend modules as follows `require('y-modulename')(Y)`
let verbose = false;
    // Note that this test setup is being mirror in test_ipfs.html
    // In general it should be possible to comment out failing tests EXCEPT where they provide a value to the next */

async function p_test(verbose) {
    try {
        //SEE-OTHER-ADDTRANSPORT - note these are options just for testing that override default options for the transport.
        let opts = {
            http: {urlbase: "http://localhost:4244"},   // Localhost - comment out if want to use gateway.dweb.me (default args use this)
            yarray: {db: {name: "leveldb", dir: "../dbtestjs", cleanStart: true, connector: {}}},  // Cleanstart clears db
            webtorrent: {}
        }; // Note browser requires indexeddb

        // Note the order of these is significant, it will retrieve by preference from the first setup, try with both orders if in doubt.
        //SEE-OTHER-ADDTRANSPORT
        let t_http = await Transports._transportclasses["HTTP"].p_test(opts, verbose);
        //let t_ipfs = await Transports._transportclasses["IPFS"].p_test(opts, verbose); // Note browser requires indexeddb
        //let t_yjs = await Transports._transportclasses["YJS"].p_test(opts, verbose); // Should find ipfs transport
        //let t_webtorrent = await Transports._transportclasses["WEBTORRENT"].p_test(opts, verbose); //
        // Note that p_tests call p_status which is needed on some protocols or they wont be used
        if (verbose) console.log("setup returned and transport(s) set");
        await Transports.test(verbose);
        if (verbose) console.log("Transports tested");
        await p_test_Signature(verbose);
        await KeyPair.test(verbose);
        let res = await AccessControlList.p_test(verbose);
        let acl = res.acl;
        await VersionList.test(verbose);
        await p_test_KeyChain(acl, verbose); // depends on VersionList for test, though not for KeyChain itself
        await KeyValueTable.p_test(verbose);
        await Domain.p_test(verbose);

        console.log("------END OF PREVIOUS TESTING PAUSING=====");
        await delay(1000);
        console.log("------AWAITED ANY BACKGROUND OUTPUT STARTING NEXT TEST =====");
        verbose=true;
        let t = Transports.http();
        turlbaseold = t.urlbase;
        t.urlbase = "https://gateway.dweb.me:443";  // Switchc to real gateway to test resolution
        await Domain.p_test_gateway(verbose);
        t.urlbase = turlbaseold;
        console.log("------END OF NEW TESTING PAUSING=====");
        await delay(1000);
        console.log("------AND FINISHED WAITING =====");
        console.log("Completed test - running IPFS in background, hit Ctrl-C to exit");
    } catch (err) {
        console.log("Test failed", err);
    }


}
p_test(verbose);


// Note this test is in test.js because it introduces cross-dependencies between KeyChain and VirtualList if in KeyCHain.js

async function p_test_KeyChain(acl, verbose) {
    /* Fairly broad test of AccessControlList and KeyChain */
    if (verbose) console.log("KeyChain.test");
    let testasync = false;  // Set to true to wait between chunks to check for async functions that haven't been await-ed
    try {
        // Set mnemonic to value that generates seed "01234567890123456789012345678901"
        const mnemonic = "coral maze mimic half fat breeze thought champion couple muscle snack heavy gloom orchard tooth alert cram often ask hockey inform broken school cotton"; // 32 byte
        // Test sequence extracted from test.py
        const qbf = "The quick brown fox ran over the lazy duck";
        const vkpname = "test_keychain viewerkeypair";
        const keypairexport = "NACL SEED:w71YvVCR7Kk_lrgU2J1aGL4JMMAHnoUtyeHbqkIi2Bk="; // So same result each time
        if (verbose) console.log("Keychain.test 0 - create");
        let kc = await KeyChain.p_new({name: "test_keychain kc"}, {mnemonic: mnemonic}, verbose);    //Note in KEYCHAIN 4 we recreate exactly same way.

        if (verbose) console.log("KEYCHAIN 1 - add VL to KC");
        let vlmaster = await VersionList.p_new({name: "test_keychain vlmaster"}, true, {passphrase: "TESTING VLMASTER"},
            await new SmartDict({content: qbf}, verbose),
            verbose); //(data, master, key, firstinstance, verbose)
        if (testasync) { console.log("Waiting - expect no output"); await delay(1000); }

        if (verbose) console.log("KEYCHAIN 2 - add viewerkeypair to it");
        let viewerkeypair = new KeyPair({name: vkpname, key: keypairexport}, verbose);
        viewerkeypair._acl = kc;
        await viewerkeypair.p_store(verbose); // Defaults to store private=true (which we want)
        await kc.p_push(viewerkeypair, verbose);
        if (testasync) { console.log("Waiting - expect no output"); await delay(1000); }

        if (verbose) console.log("KEYCHAIN 3: Fetching vlm url=", vlmaster._urls);
        let vlm2 = await SmartDict.p_fetch(vlmaster._urls, verbose); //Will be MutableBlock
        console.assert(vlm2.name === vlmaster.name, "Names should survive round trip", vlm2.name, "!==", vlmaster.name);
        if (testasync) { console.log("Waiting - expect no output"); await delay(1000); }

        if (verbose) console.log("KEYCHAIN 4: reconstructing KeyChain and fetch");
        KeyChain.logout();     // Clear Key Chains
        //p_new(data, key, verbose)
        let kc2 = await KeyChain.p_new({name: "test_keychain kc"}, {mnemonic: mnemonic}, verbose);
        console.assert(kc2._list[0].data._urls[0] === kc._list[0].data._urls[0])
        console.assert(kc2._list[0].data._publicurls[0] === kc._list[0].data._publicurls[0])
        // Note success is run AFTER all keys have been loaded
        let mm = KeyChain.mykeys(VersionList);
        console.assert(mm.length, "Should find vlmaster");
        let vlm3 = mm[mm.length - 1];
        console.assert(vlm3 instanceof VersionList, "Should be a Version List", vlm3);
        console.assert(vlm3.name === vlmaster.name, "Names should survive round trip");
        if (testasync) { console.log("Waiting - expect no output"); await delay(1000); }

        if (verbose) console.log("KEYCHAIN 5: Check can user ViewerKeyPair");
        // Uses acl passed in from AccessControlList.acl
        acl._allowunsafestore = true;
        await acl.p_add_acle(viewerkeypair, {"name": "my token"}, verbose);
        console.assert("acl._list.length === 1", "Should have added exactly 1 viewerkeypair", acl);
        let sb = new SmartDict({"name": "test_sb", "data": qbf, "_acl": acl}, verbose); //url,data,verbose
        await sb.p_store(verbose);
        if (testasync) { console.log("Waiting - expect no output"); await delay(1000); }
        let mvk = KeyChain.mykeys(KeyPair);
        if (mvk[0].name !== vkpname) throw new errors.CodingError("Should find viewerkeypair stored above");
        if (testasync) { console.log("Waiting - expect no output"); await delay(1000); }

        if (verbose) console.log("KEYCHAIN 6: Check can fetch and decrypt - should use viewerkeypair stored above");
        let sb2 = await SmartDict.p_fetch(sb._urls, verbose); // Will be SmartDict, fetched and decrypted
        if (sb2.data !== qbf) throw new errors.CodingError("Data should survive round trip");
        if (testasync) { console.log("Waiting - expect no output"); await delay(1000); }

        if (verbose) console.log("KEYCHAIN 7: Check can store content via an VL");
        let vlmasterwithacl = await VersionList.p_new({name: "test_keychain vlmaster", contentacl: acl._urls}, true, {passphrase: "TESTING VLMASTER"},
            await new SmartDict({content: qbf}, verbose),
            verbose); //(data, master, key, firstinstance, verbose)
        await vlmasterwithacl.p_store(verbose);
        await vlmasterwithacl.p_saveversion(verbose);
        let vl = await SmartDict.p_fetch(vlmasterwithacl._publicurls, verbose); // Will be VersionList
        await vl.p_fetchlistandworking(verbose);
        if (vl._working.content !== qbf) throw new errors.CodingError("Data should round trip through ACL");
        if (verbose) console.log("KeyChain.test promises complete");
        //console.log("KeyChain.test requires more tests defined");
        return {kc: kc, vlmaster: vlmaster};
    } catch (err) {
        console.log("Caught exception in KeyChain.p_test", err);
        throw err;
    }
}

async function p_test_Signature(verbose) {
    // Test Signatures
    //verbose=true
    let mydic = { "a": "AAA", "1":100, "B_date": Date.now()}; // Dic can't contain integer field names
    let signedblock = new SmartDict(mydic, verbose);
    let keypair = new KeyPair({"key":{"keygen":true}}, verbose);
    // This test should really fail, BUT since keypair has private it passes signature
    // commonlist0 = CommonList(keypair=keypair, master=false)
    // print commonlist0
    // signedblock.sign(commonlist0, verbose) # This should fail, but
    if (verbose) console.log("test_Signatures CommonList");
    let commonlist = await CommonList.p_new({name: "test_Signatures.commonlist" }, true, keypair, verbose); //data,master,key,verbose
    commonlist.table = "BOGUS";
    if (verbose) console.log("test_Signatures sign");
    commonlist._allowunsafestore = true;
    let sig;
    await signedblock.p_store(verbose);
    sig = await Signature.p_sign(commonlist, signedblock._urls, verbose); //commonlist, urls, verbose
    commonlist._allowunsafestore = false;
    if (verbose) console.log("test_Signatures verification");
    if (!commonlist.verify(sig, verbose)) throw new errors.CodingError("Should verify");
}

async function p_test_TransportYJS(opts={}, verbose) {
    if (verbose) {console.log("TransportYJS.test")}
    try {
        let transport = await TransportYJS.p_setup(opts, verbose); // Assumes IPFS already setup
        if (verbose) console.log(transport.name, "setup");
        let res = await transport.p_status(verbose);
        console.assert(res === Transport.STATUS_CONNECTED)
        //TODO move this to Transport.p_test_list -=-=-=-=
        let testurl = "yjs:/yjs/THISATEST";  // Just a predictable number can work with
        res = await transport.p_rawlist(testurl, {verbose});
        let listlen = res.length;   // Holds length of list run intermediate
        if (verbose) console.log("rawlist returned ", ...utils.consolearr(res));
        let monitoredobj;
        transport.listmonitor(testurl, (obj) => (monitoredobj = obj), verbose);
        let sig = new Signature({urls: ["123"], date: new Date(Date.now()), signature: "Joe Smith", signedby: [testurl]}, verbose);
        await transport.p_rawadd(testurl, sig, {verbose});
        if (verbose) console.log("TransportYJS.p_rawadd returned ");
        res = await transport.p_rawlist(testurl, {verbose});
        if (verbose) console.log("rawlist returned ", ...utils.consolearr(res)); // Note not showing return
        await delay(500);
        console.assert(monitoredobj.urls[0] === "123"); // Should have been caught by the listmonitor above
        res = await transport.p_rawlist(testurl, {verbose});
        console.assert(res.length === listlen + 1, "Should have added one item");
        //console.log("TransportYJS test complete");
        // -=-=-=-===-=- Now test KeyValue using common test -=-=-=-=-=-=-
        await transport.p_test_kvt("yjs:/yjs/NACL%20VERIFY", verbose);
        return transport;
    } catch(err) {
        console.log("Exception thrown in TransportYJS.test:", err.message);
        throw err;
    }
}
