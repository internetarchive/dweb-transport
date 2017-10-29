const IPFS = require('ipfs');

var ipfs;
const CID = require('cids');
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

function test_fetch(cid, len) {
    // Retrieve with block.put OK
    console.log("XXX@70",cid,len)
    return promisified.ipfs.block.get(cid)
        .then((block)=>block.data)
        .then((buff) => { if (len !== buff.length) console.log("Expected block length", len,"but got",buff.length);})

        // Retrieve with files.get
        .then(() => ipfs.files.cat(cid)) //Error: Groups are not supported
        // BUT Thows an error on the IPFS thread, not catchable
        .then((stream) => { console.log("Should have stream, got",stream.constructor.name); return stream;})
        .then((stream) => p_streamToBuffer(stream, true))
        .then((data) => console.log("XXX@79 got",data.constructor.name, data.length))
        .then(() => delay(1000))    // Allow error on other stream to appear
        .catch((err) => console.log("Should get error here, but dont - its thrown on different thread",err))
}
function test_block() {
    let qbf = "The quick brown fox" // String for testing
    let cid_string_block;   // Will hold CID of string stored with block.get
    // Store with block.put
    return promisified.ipfs.block.put(new Buffer(qbf))
    .then((block)=>block.cid)
    // CID { codec: 'dag-pb', version: 0, multihash: <Buffer 12 20 5c ac 4f 98 0f ed c3 d3 f1 f9 9b 4b e3 47 2c 9b 30 d5 65 23 e6 32 d1 51 23 7e c9 30 90 48 bd a9> }
    .then((cid) => cid_string_block = cid)
    .then(() => test_fetch(cid_string_block, qbf.length))
}

function test_httpgetapi(multihash) {
    // Test a multihash returned by a HTTP add of a file
    return promisified.ipfs.block.get(new CID(multihash))
        .then((block) => block.data)
        .then((data) => console.log("Retrieved length=",data.length))
}
shortfilehash="QmTds3bVoiM9pzfNJX6vT2ohxnezKPdaGHLd4Ptc4ACMLa"; //184338 bytes
longfilehash="Qmbzs7jhkBZuVixhnM3J3QhMrL6bcAoSYiRPZrdoX3DhzB"; //262144

function test_ipfs() {
    p_ipfsstart(true)
    //.then(() => test_block()
    .then(() => test_fetch(new CID(longfilehash), 262144))
    .then(() => test_fetch(new CID(shortfilehash), 184338))
}

test_ipfs()
