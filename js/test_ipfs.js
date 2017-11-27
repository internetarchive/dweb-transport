const IPFS = require('ipfs');

var ipfs;
const CID = require('cids');
const multibase = require('multibase');
const multihash = require('multihashes');
const dagPB = require('ipld-dag-pb');
const DAGNode = dagPB.DAGNode;
const dagCBOR = require('ipld-dag-cbor');
//const IPLDResolver = require('ipld-resolver')
var promisified;
const promisify = require('promisify-es6');
function delay(ms, val) { return new Promise(resolve => {setTimeout(() => { resolve(val); },ms)})}

// Note to get async / await working in node, I had to update node to the current (non-default version) as starts in V7
// I also had to "npm install levelup leveldown" to upgrade them to match the current version of node.

/*
This file consists of:
A set of test routines, each of which takes a CID and an expected length and tries a different way to fetch it.
    test_block_get      using block.get
    test_dag_get        using dag.get
    test_files_cat      using files.cat
    test_universal_get  a nasty kludge that tries different ways to fetch

There are then a set of routines that upload with one method, and test retrieval by each of the non-crashing mechanisms above
    test_block          using block.put
    test_dag_string     uses dag.put to upload a string (not JSON)
    test_dag_json       same but uploads an object (not really JSON since encode with CBOR)
    test_httpapi_short  Accesses a file previously stored with the http api, short enough that it doesnt get sharded
    test_httpapi_long   Accesses a file previously stored with the http api, long enough that it doesnt get sharded
 */

let tryexpectedfailures = false; // Set to false if want to check the things we expect to fail.
let defaultipfsoptions = {
    repo: '/tmp/ipfs_testipfs', //TODO-IPFS think through where, esp for browser
    //init: true,
    //start: false,
    config: {
        Addresses: { Swarm: [ '/dns4/star-signal.cloud.ipfs.team/wss/p2p-webrtc-star']},
    },
    EXPERIMENTAL: {
        pubsub: true
    }
};
function _makepromises() {
    //Utility function to promisify Block
    promisified = { ipfs: { block: {
        put: promisify(ipfs.block.put),
        get: promisify(ipfs.block.get)
    }}}
}

function p_streamToBuffer(stream, verbose) {
    // resolve to a promise that returns a stream.
    // Note this comes form one example ...
    // There is another example https://github.com/ipfs/js-ipfs/blob/master/examples/exchange-files-in-browser/public/js/app.js#L102 very different
    return new Promise((resolve, reject) => {
        try {
            let chunks = [];
            stream
                .on('data', (chunk) => { if (verbose) console.log('on', chunk.length); chunks.push(chunk); })
                .once('end', () => { if (verbose) console.log('end chunks', chunks.length); resolve(Buffer.concat(chunks)); })
                .on('error', (err) => { // Note error behavior untested currently
                    console.log("Error event in p_streamToBuffer",err);
                    reject(new Error('Error in stream'))
                });
            stream.resume();
        } catch (err) {
            console.log("Error thrown in p_streamToBuffer", err);
            reject(err);
        }
    })
}

function p_ipfsstart(verbose) {
    return new Promise((resolve, reject) => {
        ipfs = new IPFS(defaultipfsoptions);
        ipfs.on('ready', () => {
            _makepromises();
            console.log(promisified);
            resolve();
        });
        ipfs.on('error', (err) => reject(err));
    })
        .then(() => ipfs.version())
        .then((version) => console.log('IPFS READY', version))
        .catch((err) => {
            console.log("Error caught in p_ipfsstart", err);
            throw(err);
        })
}

function check_result(name, buff, expected, expectfailure) {
    if ( (typeof(expected) === "number") && (expected !== buff.length)) {
        console.log(name, "Expected block length", expected, "but got", buff.length, expectfailure ? "Note this was expected to fail." : "");
        //console.log(buff); // Normally leave commented out - will be long if looking at 250k file !
    } else if ((typeof(expected) !== "number") && (JSON.stringify(expected) !== JSON.stringify(buff))) {
        console.log(name, "Expected:", expected.constructor.name, expected, "got", buff.constructor.name, buff);
    } else {
        console.log(name, "Retrieved successfully");
    }
    return buff; // Simplify promise chain
}

async function test_block_get(cid, expected, expectfailure) {
    // Note we don't use block.get anymore , but its here for testing
    if (expectfailure && !tryexpectedfailures) return;
    try {
        let block = await promisified.ipfs.block.get(cid);
        let data = block.data;
        check_result("block.get", data, expected, expectfailure);
        await delay(500);    // Allow error on other stream to appear
    } catch(err) {
        console.log("Error thrown in block.cat", err);
    }
}

function test_dag_get(cid, expected, expectfailure) {
    //Try and retrieve with dag.get
    if (expectfailure && !tryexpectedfailures) return;
    return ipfs.dag.get(cid)                // fails (never returns nor throws err) if cid came from block.put
        .then((res) => res.value)   // If we store with dag.put of a string or buffer the result is here
        .then((buff) => check_result("dag.get",buff, expected, expectfailure))
        .then(() => delay(500))    // Allow error on other stream to appear
        .catch((err) => console.log("Error thrown in dag.cat", err))
}
function test_files_cat(cid, expected, expectfailure) {
    if (expectfailure && !tryexpectedfailures) return;
    return ipfs.files.cat(cid) //Error: Groups are not supported in the blocks case - never returns from this call.
    // BUT Thows an error on the IPFS thread, not catchable
        .then((stream) => p_streamToBuffer(stream, true))
        .then((buff) => check_result("files.cat",buff, expected, expectfailure))
        .then(() => delay(500))    // Allow error on other stream to appear
        .catch((err) => console.log("Error thrown in files.cat", err)) // Note the HTTP test doesn't throw here, but in separate thread
}
async function test_universal_get(cid, expected, expectfailure) {
    if (expectfailure && !tryexpectedfailures) return;
    // This is an attempt at a retriever that works no matter what the type of multihash
    // Three possible cases -
    // a) short file, get from _serialized as there's a Chrome bug in files.cat (it works in Node)
    // b) long file use files.cat
    // c) Not a file, value != DAGNode, return the value (works on strings or JSON)
    try {
        let res = await ipfs.dag.get(cid);
        console.assert(!res.remainderPath.length);  // Unsupported remainderPath - TODO throw error
        let buff;
        if (res.value instanceof DAGNode) {
            //console.log("Case a or b");
            //if (res.value._links.length > 0) { //b: Long file else short file but read stream anyway.
            buff = await p_streamToBuffer(await ipfs.files.cat(cid), true);
            // Previously was going back to read as a block if got 0 bytes
            if (buff.length === 0) {    // Hit the Chrome bug
                // This will get a file padded with ~14 bytes - 4 at front, 4 at end and cant find the other 6 !
                // but it seems to work for PDFs which is what I'm testing on.
                console.log("Kludge alert - files.cat fails in Chrome or Firefox, trying block.get");
                let blk = await promisified.ipfs.block.get(cid);
                buff = blk.data;
            }

        } else { //c: not a file
            buff = res.value;
        }
        check_result("universal.get",buff, expected, expectfailure);
        await delay(500); // Allow error on other stream to appear
    } catch(err) {
        console.log("Error thrown in files.cat", err);
    }
}

/* Each of this set of routines uploads with one method, and tries retrieving with multiple */

async function test_block() {
    let qbf = "The quick brown fox"; // String for testing
    console.log("--------testing block.put:",qbf);
    // Store with block.put
    let block = await promisified.ipfs.block.put(new Buffer(qbf));
    let cid = block.cid;       // Will hold CID of string stored with block.put
    let len = qbf.length;      // Will hold length expected
    await test_block_get(cid,len, false);                  // Works
    //NEXT TWO TESTS COMMENTED OUT AS FAIL *AND* HANG THE THREAD - NASTY IPFS BUG
    console.log("Commented out other ways to retrieve result of block.put as all crash with nasty IPFS bug ");
    //await test_dag_get(cid, len, true);                   // Fails - BUG throws "Groups are not supported in different thread, never returns or throws error
    //await test_files_cat(cid, len, true);                 // Fails - same as dag_get
    //await test_universal_get(cid, len, true);             // Untested but dont expect to work as will fail in dag.get
    console.log("test_block completed");
}

async function test_dag_string() {
    let qbf = "the quick brown fox"; // String for testing
    //https://github.com/ipfs/interface-ipfs-core/blob/master/SPEC/DAG.md#dagput
    //let qbf = new Buffer(qbf);    // Uncomment to test storing as buffer (behavior same as for string)
    console.log("--------testing dag.put:",qbf);
    let cid = await ipfs.dag.put(qbf,{ format: 'dag-cbor', hashAlg: 'sha3-512' }); //TODO try different hash
    let len = qbf.length;
    await test_block_get(cid,len, true);    // Gets 1 byte too long - expected since encoded by dag
    await test_dag_get(cid, len, false);     // Works
    await test_files_cat(cid, len, true);   // Throws  Error: invalid node type as expected since its not a file
    await test_universal_get(cid, len, false);
}

async function test_dag_json() {
    let j = { fox: "the quick brown"}; // String for testing
    //https://github.com/ipfs/interface-ipfs-core/blob/master/SPEC/DAG.md#dagput
    console.log("--------Testing dag.put:",j);
    let cid = await ipfs.dag.put(j,{ format: 'dag-cbor', hashAlg: 'sha2-256' }); // Will hold CID of string stored with dag.put
    //console.log(cid);                                   // For debugging
    //console.log(multihash.toB58String(cid.multihash));  // Debugging QmehRkRt4xipvY6sj5X79SMmsCfpryEsUWxYqwddFEjsDr
    //console.log(cid.toBaseEncodedString());             // Debugging zdpuB2nDXFEoAMVCiKLLqrdHEqpdhvTD2qwtxymA3V9fAb68g
    await test_block_get(cid, j, true);                       // Wrong - gets buffer as expected since encoded as a dag.
    await test_dag_get(cid, j, false);                         // Works
    await test_files_cat(cid, j, true);                     // Throws  Error: invalid node type - expected since its not a file
    await test_universal_get(cid, j, false);
}

async function test_httpapi_short() {
    console.log("--------Testing short file sent to http API");
    let multihash="QmTds3bVoiM9pzfNJX6vT2ohxnezKPdaGHLd4Ptc4ACMLa"; //184324 bytes
    let cid = new CID(multihash);
    let len = 184324;
    await test_block_get(cid,len, true);        // Seems to work as a PDF, but gets 184338 not 184324 bytes
    await test_dag_get(cid, len, true);         // As expected, Fails gets a data structure, not a buffer
    await test_files_cat(cid, len, false);       // Works in node (correct size), fails in Chrome (immediate 'end' event) !! IPFS BUG !!
    await test_universal_get(cid, len, false);
}
async function test_httpapi_long() {
    console.log("--------Testing long file sent to http API");
    let multihash="Qmbzs7jhkBZuVixhnM3J3QhMrL6bcAoSYiRPZrdoX3DhzB";
    let cid = new CID(multihash);
    let len = 262438;
    await test_block_get(cid,len,true);              // As expected, Doesnt work - just gets the IPLD as a buffer
    await test_dag_get(cid, len,true);               // As expected,  Fails gets a data structure, not a buffer
    await test_files_cat(cid, len,false);             // Works in node and in Chrome
    await test_universal_get(cid, len,false);
}

async function sandbox() {
    console.log("--------Sandbox");
    // Just a place to try things - dont expect them to work or make sense !
    let m = "zdpuB2nDXFEoAMVCiKLLqrdHEqpdhvTD2qwtxymA3V9fAb68g";
}

async function test_ipfs() {
    await p_ipfsstart(true);
    //await sandbox();
    await test_httpapi_short();     // No solution: *IPFS BUG* on files.cat; (work around also has bug of adding 14 bytes)
    await test_httpapi_long();      // Works only on files.cat; Fails as expected on others
    await test_block();             // Works on block.get; Fails *IPFS BUG REALLY BAD* on anything other than block.get
    await test_dag_string();        // Works on dag.get; fails (as expected) on others
    await test_dag_json();         // Works on dag.get; fails as expected on others
    console.log('---- finished --- ')
}

test_ipfs();
