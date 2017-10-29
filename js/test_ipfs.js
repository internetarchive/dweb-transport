const IPFS = require('ipfs');

var ipfs;
const CID = require('cids');
const multibase = require('multibase')
const dagPB = require('ipld-dag-pb')
const DAGNode = dagPB.DAGNode
const dagCBOR = require('ipld-dag-cbor')
const IPLDResolver = require('ipld-resolver')
var promisified;
const promisify = require('promisify-es6');
function delay(ms, val) { return new Promise(resolve => {setTimeout(() => { resolve(val); },ms)})}

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
                    reject(new Dweb.errors.TransportError('Error in stream'))
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

function check_result(name, buff, expected) {
    if ( (typeof(expected) === "number") && (expected !== buff.length)) {
        console.log(name, "Expected block length", expected, "but got", buff.length);
        console.log(buff); // Normally leave commented out - will be long if looking at 250k file !
    } else if ((typeof(expected) !== "number") && (expected !== buff)) {
        console.log(name, "Expected:", expected.constructor.name, expected, "got", buff.constructor.name, buff);
    } else {
        console.log(name, "Retrieved successfully");
    }
    return buff; // Simplify promise chain
}

function test_block_get(cid, expected) {
    return promisified.ipfs.block.get(cid)
        .then((block)=>block.data)
        .then((buff) => check_result("block.get",buff, expected))
        .then(() => delay(500))    // Allow error on other stream to appear
        .catch((err) => console.log("Error thrown in block.cat", err))
}
function test_dag_get(cid, expected) {
    //Try and retrieve with dag.get
    return ipfs.dag.get(cid)                // fails (never returns nor throws err) if cid came from block.put
        .then((res) => res.value)   // If we store with dag.put of a string or buffer the result is here
        .then((buff) => check_result("dag.get",buff, expected))
        .then(() => delay(500))    // Allow error on other stream to appear
        .catch((err) => console.log("Error thrown in dag.cat", err))
}
function test_files_cat(cid, expected) {
    return ipfs.files.cat(cid) //Error: Groups are not supported in the blocks case - never returns from this call.
    // BUT Thows an error on the IPFS thread, not catchable
        .then((stream) => p_streamToBuffer(stream, true))
        .then((buff) => check_result("files.cat",buff, expected))
        .then(() => delay(500))    // Allow error on other stream to appear
        .catch((err) => console.log("Error thrown in files.cat", err)) // Note the HTTP test doesn't throw here, but in separate thread
}
function test_universal_get(cid, expected) {
    // This is an attempt at a retriever that works no matter what the type of multihash
    //TODO check works with v0 CID or always with v1
    return ipfs.dag.get(cid)
        // Three possible cases -
        // a) short file, get from _serialized as there's a Chrome bug in files.cat (it works in Node)
        // b) long file use files.cat
        // c) Not a file, value != DAGNode, return the value (works on strings or JSON)
        .then((res) => { console.assert(!res.remainderPath.length); return res;} ) // Unsupported
        .then((res) => {
            if (res.value.constructor.name instanceof DAGNode) {
                console.log("Case a or b");
                if (res.value._links.length > 0) {
                    console.log("Case b");
                    return ipfs.files.cat(cid)
                        .then((stream) => p_streamToBuffer(stream, true))
                } else {
                    console.log("Case a");
                    return ipfs.files.cat(cid) // Works on Node, but fails on Chrome, cant figure out how to get data from the DAGNode otherwise (its the wrong size)
                        .then((stream) => p_streamToBuffer(stream, true))
                }
            } else {
                //Case c
                return res.value;
            }
        })
        .then((buff) => check_result("universal.get",buff, expected))
        .then(() => delay(500))    // Allow error on other stream to appear
        .catch((err) => console.log("Error thrown in files.cat", err)) // Note the HTTP test doesn't throw here, but in separate thread
}

function test_block() {
    let qbf = "The quick brown fox" // String for testing
    let cid;   // Will hold CID of string stored with block.put
    let len;    // Will hold length expected
    // Store with block.put
    return promisified.ipfs.block.put(new Buffer(qbf))
    .then((block)=>block.cid)
    .then((cid_stored) => { cid = cid_stored; len = qbf.length; })
    .then(() => test_block_get(cid,len))        // Works
    //NEXT TWO TESTS COMMENTED OUT AS FAIL *AND* HANG THE THREAD - NASTY IPFS BUG
    .then(() => console.log("Commented out other ways to retrieve result of block.put as all crash with nasty IPFS bug "))
    //.then(() => test_dag_get(cid, len))         // Fails - BUG throws "Groups are not supported in different thread, never returns or throws error
    //.then(() => test_files_cat(cid, len))       // Fails - same as dag_get
    //.then(() => test_universal_get(cid, len))     // Untested but dont expect to work as will fail in dag.get
    //.then(() => console.log("test_block completed"))
}

function test_dag_string() {
    let qbf = "the quick brown fox" // String for testing
    let cid;   // Will hold CID of string stored with dag.put
    let len;    // Will hold length expected
    //https://github.com/ipfs/interface-ipfs-core/blob/master/SPEC/DAG.md#dagput
    //let qbf = new Buffer(qbf);    // Uncomment to test storing as buffer (behavior same as for string)
    console.log("dag.put:",qbf);
    return ipfs.dag.put(qbf,{ format: 'dag-cbor', hashAlg: 'sha3-512' }) //TODO try different hash
        .then((cid_stored) => { cid = cid_stored; len = qbf.length; })
        .then(() => test_block_get(cid,len))    // Gets 1 byte too long
        .then(() => test_dag_get(cid, len))     // Works
        .then(() => test_files_cat(cid, len))   // Throws  Error: invalid node type
        .then(() => test_universal_get(cid, len))
}

function test_dag_json() {
    let j = { fox: "the quick brown"} // String for testing
    let cid;   // Will hold CID of string stored with dag.put
    //https://github.com/ipfs/interface-ipfs-core/blob/master/SPEC/DAG.md#dagput
    console.log("dag.put:",j);
    return ipfs.dag.put(j,{ format: 'dag-cbor', hashAlg: 'sha2-256' })
        .then((cid_stored) => { cid = cid_stored; })
        .then(() => test_block_get(cid, j))    // Wrong - gets buffer
        .then(() => test_dag_get(cid, j))     // Works
        //.then(() => test_files_cat(cid, j))   // Throws  Error: invalid node type
        .then(() => test_universal_get(cid, j))
}

function test_httpapi_short() {
    console.log("Testing short file sent to http API");
    let multihash="QmTds3bVoiM9pzfNJX6vT2ohxnezKPdaGHLd4Ptc4ACMLa"; //184324 bytes
    let cid = new CID(multihash)
    let len = 184324;
    return test_block_get(cid,len)              // Seems to work as a PDF, but gets 184338 not 184324 bytes
    //.then(() => test_dag_get(cid, len))     // As expected, Fails gets a data structure, not a buffer
        .then(() => test_files_cat(cid, len))   // Works in node (correct size), fails in Chrome (immediate 'end' event) !! IPFS BUG !!
        //.then(() => test_universal_get(cid, len))
}
function test_httpapi_long() {
    console.log("Testing long file sent to http API");
    let multihash="Qmbzs7jhkBZuVixhnM3J3QhMrL6bcAoSYiRPZrdoX3DhzB";
    let cid = new CID(multihash)
    let len = 262438;
    return test_block_get(cid,len)              //  As expected, Doesnt work - just gets the IPLD as a buffer
        //.then(() => test_dag_get(cid, len))     // As expected,  Fails gets a data structure, not a buffer
        .then(() => test_files_cat(cid, len))   // Works in node and in Chrome
        //.then(() => test_universal_get(cid, len))
}

function test_ipfs() {
    p_ipfsstart(true)
    .then(() => test_httpapi_short())
    .then(() => test_httpapi_long())
    //.then(() => test_block()) // Run last because fails and never returns from files.cat
    //.then(() => test_dag_string()) // Gets 1 byte extra with block.get (node type); fails on file - that is to be expected, note CIDs are dag-cbor, version 1
    //.then(() => test_dag_json()) // Gets 1 byte extra with block.get (node type); fails on file - that is to be expected, note CIDs are dag-cbor, version 1
}

test_ipfs()
