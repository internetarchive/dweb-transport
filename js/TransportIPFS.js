/*
This Transport layers builds on IPFS and the IPFS-IIIF-Db,

The IPFS-IIIF-DB is more than needed, and should really strip it down, and just use the bits we need,
but its hard to figure out

Lists have listeners,
'started': for when started - then can read list - tested during IPFS start (which slows that down)
'resource inserted': for when something new posted
'mutation': triggered when changed

TODO-IPFS-MULTILIST
For now we use one list, and filter by hash, at some point we'll need lots of lists and its unclear where to split
- at listener; partition or list within that (resources / hits) or have to filter on content

TODO-IPFS ComeBackFor: TransportHTTP & TransportHTTPBase (make use promises)

*/


// Library packages other than IPFS
// IPFS components


const IPFS = require('ipfs');
const CID = require('cids');
//const IpfsIiifDb = require('ipfs-iiif-db');  //https://github.com/pgte/ipfs-iiif-db

const multihashes = require('multihashes'); // TODO-IPFS only required because IPFS makes it hard to get this

const crypto = require('crypto'); //TODO-IPFS only for testing - can remove

// Utility packages (ours) Aand one-loners
const promisify = require('promisify-es6');
//const makepromises = require('./utils/makepromises'); // Replaced by direct call to promisify
function delay(ms, val) { return new Promise(resolve => {setTimeout(() => { resolve(val); },ms)})}

// Other Dweb modules
const Transport = require('./Transport');
const Dweb = require('./Dweb');

//Debugging only

let defaultipfsoptions = {
    repo: '/tmp/ipfs_dweb20170820', //TODO-IPFS think through where, esp for browser
    //init: false,
    //start: false,
    //TODO-IPFS-Q how is this decentralized - can it run offline? Does it depend on star-signal.cloud.ipfs.team
    config: {
        Addresses: { Swarm: [ '/libp2p-webrtc-star/dns4/star-signal.cloud.ipfs.team/wss' ] },   // For IIIF - same as defaults
        Discovery: { webRTCStar: { Enabled: true } }    // For IIIF - same as defaults
    },
    EXPERIMENTAL: {
        pubsub: true
    }
};

// See https://github.com/pgte/ipfs-iiif-db for options
let defaultiiifoptions = { ipfs: defaultipfsoptions, store: "leveldb", partition: "dweb20170820" }; //TODO-IIIF try making parition a variable and connecting to multiple

const annotationlistexample = { //TODO-IPFS update this to better example
    "@id": "foobar",    // Only required field is @id
    "hash": "/ipfs/A1B2C3D4E5",
    "date": "20170104T1234",
    "signature": "123456ABC",
    "signedby": "123456ABC"
};

class TransportIPFS extends Transport {

    constructor(ipfsoptions, verbose, options) {
        super(verbose, options);
        this.ipfs = undefined;  // Not yet defined
        this.ipfsoptions = ipfsoptions; // Dictionary of options, currently unused
        this.options = options;

    }

    // This chunk starts up IPFS (old version w/o IIIF)
    static ipfsstart(iiifoptions, verbose) {
        //let ipfs = new IPFS(ipfsoptions); // Without CRDT (for lists)
        // Next line is for browser compatibility - there is a bug in browserify so IIIF has to be loaded separately in browser, by test.js for node
        let IIIF = typeof IpfsIiifDb === "undefined" ? TransportIPFS.IpfsIiifDb : IpfsIiifDb;
        const res = IIIF(iiifoptions); //Note this doesn't start either IPFS or annotationlist
        const ipfs = res.ipfs;
        return new Promise((resolve, reject) => {
            ipfs.version()
                .then((version) => console.log("Version=", version))
                //TODO-IPFS - have to disable init and start for CRDT/lists as it starts itself - will be a problem for TODO-IPFS-MULTILIST
                //.then((unused) => ipfs.init({emptyRepo: true, bits: 2048}))
                //.then((version) => console.log("initialized"))
                //.then((unused) => ipfs.start())
                .then((unused) => console.log("IPFS node",ipfs.isOnline() ? "and online" : "but offline"))    //TODO throw error if not online
                .then(() => resolve(res))
                //.then(() => resolve(ipfs))  // Whatever happens above, want to return ipfs to caller
                .catch((err) => {
                    console.log("UNCAUGHT ERROR in ipfsstart", err);
                    reject(err)
                })
        })
    }


    static p_setup(ipfsiiifoptions, verbose, options) {
        let combinedipfsoptions = Object.assign(defaultipfsoptions, ipfsiiifoptions.ipfs);
        let combinediiifoptions = Object.assign(defaultiiifoptions, ipfsiiifoptions.iiif,{ipfs:defaultipfsoptions});   // Top level in this case
        console.log("IPFS options", JSON.stringify(combinediiifoptions));
        let t = new TransportIPFS(combinedipfsoptions, verbose, options);
        return new Promise((resolve, reject) => {
            TransportIPFS.ipfsstart(combinediiifoptions, verbose)
            .then((res) => {
                t.iiif = res;
                t.ipfs = res.ipfs;
                //Replaced promisified utility since only two to promisify
                //t.promisified = {ipfs:{}};
                //makepromises(t.ipfs, t.promisified.ipfs, [ { block: ["put", "get"] }]); // Has to be after t.ipfs defined
                t.promisified = { ipfs: { block: {
                    put: promisify(t.ipfs.block.put),
                    get: promisify(t.ipfs.block.get)
                }}}
                t.annotationList = res.annotationList(annotationlistexample);    //TODO-IPFS-MULTILIST move this to the list command - means splitting stuff under it that calls bootstrap
                t.annotationList.on('started', (event) => {
                    console.log("IPFS node after annotation list start",t.ipfs.isOnline() ? "now online" : "but still offline");   //TODO throw error if not online
                    if (verbose) { console.log("annotationList started, list at start = ", ...Dweb.utils.consolearr(t.annotationList.getResources()));}
                    resolve(t);  // Cant resolve till annotation list online
                })
            })
            .catch((err) => {
                console.log("Uncaught error in TransportIPFS.setup", err);
                reject(err);
            })
        })
    }

    link(data) {
        /*
         Return an identifier for the data without storing

         :param string|Buffer data   arbitrary data
         :return string              valid id to retrieve data via p_rawfetch
         */
        let b2 = (data instanceof Buffer) ? data : new Buffer(data);
        let b3 = crypto.createHash('sha256').update(b2).digest();   // Note this is the only dependence on crypto and exists only because IPFS makes it ridiculously hard to get the hash synchronously without storing
        let hash = multihashes.toB58String(multihashes.encode(b3, 'sha2-256'));  //TODO-IPFS-Q unclear how to make generic
        return "/ipfs/" + hash
    }

    // Everything else - unless documented here - should be opaque to the actual structure of a CID
    // or a Link. This code may change as its not clear (from IPFS docs) if this is the right mapping.
    static cid2link(cid) {
        //console.log(cid.multihash[0],cid.multihash[1],cid.multihash[2]);
        return "/ipfs/"+cid.toBaseEncodedString()
    }  //TODO-IPFS this might not be right, (TODO-IPFS-Q-CID)

    static link2cid(link) {
        let arr = link.split('/');
        if (!(arr.length===3 && arr[1]==="ipfs"))
                throw new Dweb.errors.TransportError("TransportIPFS.link2cid bad format for hash should be /ipfs/...: "+link);
        return new CID(arr[2])
    }

    p_rawfetch(hash, verbose) {
        /*
        Fetch hash from IPFS (implements Transport.p_rawfetch)

        :param hash:    Valid ipfs hash "/ipfs/*"
        :resolves:      Opaque bytes retrieved from IPFS
        :throws:        TransportError if hash invalid - note this happens immediately, not as a catch in the promise
         */
        console.assert(hash, "TransportIPFS.p_rawfetch: requires hash");
        let cid = (hash instanceof CID) ? hash : TransportIPFS.link2cid(hash);  // Throws TransportError if hash bad
        return this.promisified.ipfs.block.get(cid)
            .then((result)=> result.data.toString())
            .catch((err) => {
                console.log("Caught misc error in TransportIPFS.p_rawfetch", err);
                reject(err);
            })
    }

    p_rawlist(hash, verbose) { //TODO-IPFS-MULTILIST move initialization of annotation list here
        // obj being loaded
        // Locate and return a list, based on its multihash
        // This is coded as a p_rawlist (i.e. returning a Promise, even though it returns immediately, that is so that
        // it can be recoded for an architecture where we need to wait for the list.
        // notify is NOT part of the Python interface, needs implementing there.
        console.assert(hash, "TransportHTTP.p_rawlist: requires hash");
        return new Promise((resolve, reject) => {  //XXXREJECT
            try {
                let res = this.annotationList.getResources()
                    .filter((obj) => (obj.signedby === hash));
                if (verbose) console.log("p_rawlist found", ...Dweb.utils.consolearr(res));
                resolve(res);
            } catch(err) {
                console.log("Uncaught error in TransportIPFS.p_rawlist",err);
                reject(err);
            }
        })
    }
    listmonitor(hash, callback, verbose) {
        // Typically called immediately after a p_rawlist to get notification of future items
        //TODO-IPFS-MULTILIST will want to make more efficient.
        this.annotationList.on('resource inserted', (event) => {
            let obj = event.value;
            if (verbose) console.log('resource inserted', obj);
            //obj["signature"] = obj["@id"];
            //delete obj["@id"];
            //console.log('resource after transform', obj);
            if (callback && (obj.signedby === hash)) callback(obj);
        })
    }

    rawreverse() { console.assert(false, "XXX Undefined function TransportHTTP.rawreverse"); }

    p_rawstore(data, verbose) { // Note async_rawstore took extra "self" parameter but unued and unclear that any of
        //PY-HTTP: res = self._sendGetPost(True, "rawstore", headers={"Content-Type": "application/octet-stream"}, urlargs=[], data=data, verbose=verbose)
        console.assert(data, "TransportIPFS.p_rawstore: requires data");
        let buf = (data instanceof Buffer) ? data : new Buffer(data);
        return this.promisified.ipfs.block.put(buf).then((block) => TransportIPFS.cid2link(block.cid));
    }

    rawadd(hash, date, signature, signedby, verbose) {
        console.assert(hash && signature && signedby, "p_rawadd args",hash,signature,signedby);
        if (verbose) console.log("p_rawadd", hash, date, signature, signedby);
        let value = {"@id": signature, "hash": hash, "date": date, "signature": signature, "signedby": signedby};
        this.annotationList.pushResource(value);
    }
    p_rawadd(hash, date, signature, signedby, verbose) {
        return new Promise((resolve, reject)=> { try {
            this.rawadd(hash, date, signature, signedby, verbose);
            resolve(undefined);
        } catch(err) {
            reject(err);
        } })
    }

    async_update(self, hash, type, data, verbose, success, error) { console.trace(); console.assert(false, "OBSOLETE"); //TODO-IPFS obsolete with p_*
        this.async_post("update", hash, type, data, verbose, success, error);
    }


    static test(transport, verbose) {
        if (verbose) {console.log("TransportIPFS.test")}
        return new Promise((resolve, reject) => {
            try {
                let hashqbf;
                let qbf = "The quick brown fox";
                let testhash = "1114";  // Just a predictable number can work with
                let listlen;    // Holds length of list run intermediate
                let cidmultihash;   // Store cid from first block in form of multihash
                transport.p_rawstore(qbf, verbose)
                    .then((hash) => {
                        if (verbose) console.log("rawstore returned", hash);
                        let newcid = TransportIPFS.link2cid(hash);  // Its a CID which has a buffer in it
                        console.assert(hash === transport.link(qbf),"link should match hash from rawstore");
                        cidmultihash = hash.split('/')[2];
                        let newhash = TransportIPFS.cid2link(newcid);
                        console.assert(hash === newhash, "Should round trip");
                        hashqbf = hash;
                        //console.log("hashqbf=",hash);
                    })
                    /*
                    .then(() => transport.p_rawstore(null, rold, verbose))
                    .then((hash) => {
                            if (verbose) console.log("p_rawstore got", hash);
                            hashrold = hash;
                        })
                    */
                    // Note above returns immediately and runs async, we don't wait for it before below
                    .then(() => transport.p_rawfetch(hashqbf, verbose))
                    .then((data) => console.assert(data === qbf, "Should fetch block stored above"))
                    .then(() => transport.p_rawlist(testhash, verbose))
                    .then((res) => {
                        listlen = res.length;
                        if (verbose) console.log("rawlist returned ", ...Dweb.utils.consolearr(res))
                    })
                    .then(() => transport.listmonitor(testhash, (obj) => console.log("Monitored", obj), verbose))
                    .then((res) => transport.p_rawadd("123", "TODAY", "Joe Smith", testhash, verbose))
                    .then(() => { if (verbose) console.log("p_rawadd returned ")  })
                    .then(() => transport.p_rawlist(testhash, verbose))
                    .then((res) => { if (verbose) console.log("rawlist returned ", ...Dweb.utils.consolearr(res)) }) // Note not showing return
                    .then(() => delay(500))
                    .then(() => transport.p_rawlist(testhash, verbose))
                    .then((res) => console.assert(res.length === listlen + 1, "Should have added one item"))
                    //.then(() => console.log("TransportIPFS test complete"))
                    .then(() => resolve())
                    .catch((err) => {
                        console.log("test ERR=", err);
                        reject(err)
                    });
            } catch (err) {
                    console.log("Exception thrown in TransportIPFS.test", err);
                    reject(err);
            }
        })
    }

}
exports = module.exports = TransportIPFS;
