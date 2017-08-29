/*
This Transport layers builds on IPFS and the IPFS-IIIF-Db,

The IPFS-IIIF-DB is more than needed, and should really strip it down, and just use the bits we need,
but its hard to figure out

Lists have listeners,
'started': for when started - then can read list - tested during IPFS start (which slows that down)
'resource inserted': for when something new posted
'mutation': triggered when changed

TODO-IPFS-MULTILIST
For now we use one list, and filter by url, at some point we'll need lots of lists and its unclear where to split
- at listener; partition or list within that (resources / hits) or have to filter on content

TODO-IPFS ComeBackFor: TransportHTTP & TransportHTTPBase (make use promises)

*/


// Library packages other than IPFS
// IPFS components


const IPFS = require('ipfs');
const CID = require('cids');
//const IpfsIiifDb = require('ipfs-iiif-db');  //https://github.com/pgte/ipfs-iiif-db
const Y = require('yjs')
require('y-memory')(Y)
require('y-array')(Y)
require('y-text')(Y)
require('y-ipfs-connector')(Y)


const multihashes = require('multihashes'); // TODO-IPFS only required because IPFS makes it hard to get this

const crypto = require('crypto'); //TODO-IPFS only for testing - can remove
//Buffer seems to be built in, require('Buffer') actually breaks things

// Utility packages (ours) Aand one-loners
const promisify = require('promisify-es6');
//const makepromises = require('./utils/makepromises'); // Replaced by direct call to promisify
function delay(ms, val) { return new Promise(resolve => {setTimeout(() => { resolve(val); },ms)})}

// Other Dweb modules
const Transport = require('./Transport');
const Dweb = require('./Dweb');

//Debugging only

let defaultipfsoptions = {
    repo: '/tmp/ipfs_dweb20170828', //TODO-IPFS think through where, esp for browser
    //init: false,
    //start: false,
    //TODO-IPFS-Q how is this decentralized - can it run offline? Does it depend on star-signal.cloud.ipfs.team
    config: {
        Addresses: { Swarm: [ '/libp2p-webrtc-star/dns4/star-signal.cloud.ipfs.team/wss' ] },   // For IIIF - same as defaults
//      Addresses: { Swarm: [ ] },   // For IIIF - same as defaults - disable WebRTC to test browser crash, note disables IIIF so doesnt work.
                                    // For IIIF - same as defaults
    },
    //init: true, // Comment out for IIIF
    EXPERIMENTAL: {
        pubsub: true
    }
};

let defaultyarrayoptions = {
    db: {
        name: 'memory'
    },
    connector: {
        name: 'ipfs',
        room: 'dweb20170828'
        //ipfs: ipfs,   // Need to link IPFS here once created
    },
    share: {
        //textfield: 'Text'
        array: 'Array'
    }
};

// See https://github.com/pgte/ipfs-iiif-db for options
let defaultiiifoptions = {
        //ipfs: ..., //Will have ipfsoptions stored during startup
        store: "leveldb",
        partition: "dweb20170828" //TODO-IIIF try making parition a variable and connecting to multiple.
};

const annotationlistexample = { //TODO-IPFS update this to better example
    "@id": "foobar",    // Only required field is @id
    "url": "ipfs:/ipfs/A1B2C3D4E5",
    "date": "20170104T1234",
    "signature": "123456ABC",
    "signedby": "123456ABC"
};

class TransportIPFS extends Transport {
    /*
    IPFS specific transport

    Fields:
    ipfs: object returned when starting IPFS
    iiif: object returned when starting iiif
    yarray: object returned when starting yarray
     */

    constructor(verbose, options) {
        super(verbose, options);
        this.ipfs = undefined;          // Undefined till start IPFS
        this.options = options;         // Dictionary of options { ipfs: {...}, iiif: {...}, yarray: {...} }
    }


    _makepromises() {
        //Utility function to promisify Block
        //Replaced promisified utility since only two to promisify
        //this.promisified = {ipfs:{}};
        //makepromises(this.ipfs, this.promisified.ipfs, [ { block: ["put", "get"] }]); // Has to be after this.ipfs defined
        this.promisified = { ipfs: { block: {
            put: promisify(this.ipfs.block.put),
            get: promisify(this.ipfs.block.get)
        }}}
    }
    // This starts up IPFS under IIIF
    p_iiifstart(verbose) { //TODO-REL4-API

        //let ipfs = new IPFS(ipfsoptions); // Without CRDT (for lists)
        // Next line is for browser compatibility - there is a bug in browserify so IIIF has to be loaded separately in browser, by test.js for node
        let IIIF = typeof IpfsIiifDb === "undefined" ? TransportIPFS.IpfsIiifDb : IpfsIiifDb;
        let iiifoptions = Object.assign(this.options.iiif, {ipfs: this.options.ipfs}); // IIIF wants to see the IPFS options.
        const res = IIIF(iiifoptions); //Note this doesn't start either IPFS or annotationlist
        this.iiif = res;
        this.ipfs = res.ipfs;
        this._makepromises()
        let self = this;
        return new Promise((resolve, reject) => {
            self.ipfs.version()
                .then((version) => console.log("Version=", version))
                .then(() => {
                    console.log("IPFS/IIIF node",self.ipfs.isOnline() ? "and online" : "but offline");    //TODO throw error if not online
                    this.annotationList = this.iiif.annotationList(annotationlistexample);    //TODO-IPFS-MULTILIST move this to the list command - means splitting stuff under it that calls bootstrap
                    this.annotationList.on('started', (event) => {
                        console.log("IPFS node after annotation list start",self.ipfs.isOnline() ? "now online" : "but still offline");   //TODO throw error if not online
                        if (verbose) { console.log("annotationList started, list at start = ", ...Dweb.utils.consolearr(this.annotationList.getResources()));}
                        resolve();  // Cant resolve till annotation list online
                    }) // Note delayed resole after really online
                })
                .catch((err) => {
                    console.log("UNCAUGHT ERROR in TransportIPFS.iiifstart", err);
                    reject(err)
                })
        })
    }

    p_yarraystart(verbose) { //TODO-REL4-API

        let yarrayoptions = this.options.yarray;
        let self = this;
        return new Promise((resolve, reject) => {
            this.ipfs = new IPFS(this.options.ipfs)
            this.ipfs.on('ready', () => {
                this._makepromises()
                resolve();
            });
            this.ipfs.on('error', (err) => reject(err));
        })
        .then(() => self.ipfs.version())
        .then((version) => console.log('IPFS READY',version))
        .then(() => {
            yarrayoptions.connector.ipfs = this.ipfs; // Note that Y needs the IPFS instance, while IIIF needs the IPFS options.
            return Y(yarrayoptions)
        })
        .then((y) => {
            this.yarray = y
            console.log("Y started");
        })
        .catch((err) => {
            console.log("Error caught in p_yarraystart",err);
            throw(err);
        })
        //Lots of issues with "init" not knowing state before it//  this.ipfs.init({emptyRepo: true, bits: 2048})     //.then((unused) => ipfs.init({emptyRepo: true, bits: 2048}))
    }


    static p_setup(verbose, options) { // Note can pass multiple options dictionaries - furthest right overrides. //TODO-REL4-API
        let combinedoptions = {
            iiif: Object.assign(defaultiiifoptions, options.iiif),  //TODO-YARRAY comment out
            yarray: Object.assign(defaultyarrayoptions, options.yarray),
            ipfs: Object.assign(defaultipfsoptions, options.ipfs)
        }
        console.log("IPFS options", JSON.stringify(combinedoptions));
        let t = new TransportIPFS(verbose, combinedoptions);   // Note doesnt start IPFS or IIIF or Y
        return t.p_iiifstart(verbose)
        //return t.p_yarraystart(verbose)
            .then(() => t)
            .catch((err) => {
                console.log("Uncaught error in TransportIPFS.setup", err);
                throw(err);
            })
    }

    url(data) {
        /*
         Return an identifier for the data without storing typically ipfs:/ipfs/a1b2c3d4...

         :param string|Buffer data   arbitrary data
         :return string              valid url to retrieve data via p_rawfetch
         */
        let b2 = (data instanceof Buffer) ? data : new Buffer(data);
        let b3 = crypto.createHash('sha256').update(b2).digest();   // Note this is the only dependence on crypto and exists only because IPFS makes it ridiculously hard to get the hash synchronously without storing
        let hash = multihashes.toB58String(multihashes.encode(b3, 'sha2-256'));  //TODO-IPFS-Q unclear how to make generic
        return "ipfs:/ipfs/" + hash
    }

    // Everything else - unless documented here - should be opaque to the actual structure of a CID
    // or a url. This code may change as its not clear (from IPFS docs) if this is the right mapping.
    static cid2url(cid) {
        //console.log(cid.multihash[0],cid.multihash[1],cid.multihash[2]);
        return "ipfs:/ipfs/"+cid.toBaseEncodedString()
    }

    static url2cid(url) {
        let arr = url.split('/');
        if (!(arr.length===3 && arr[0] === "ipfs:" && arr[1]==="ipfs"))
                throw new Dweb.errors.TransportError("TransportIPFS.url2cid bad format for url should be ipfs:/ipfs/...: "+url);
        return new CID(arr[2])
    }

    p_rawfetch(url, verbose) {
        /*
        Fetch url from IPFS (implements Transport.p_rawfetch)

        :param url:    Valid ipfs url "ipfs:/ipfs/*"
        :resolves:      Opaque bytes retrieved from IPFS
        :throws:        TransportError if url invalid - note this happens immediately, not as a catch in the promise
         */
        console.assert(url, "TransportIPFS.p_rawfetch: requires url");
        let cid = (url instanceof CID) ? url : TransportIPFS.url2cid(url);  // Throws TransportError if url bad
        return this.promisified.ipfs.block.get(cid)
            .then((result)=> result.data.toString())
            .catch((err) => {
                console.log("Caught misc error in TransportIPFS.p_rawfetch", err);
                reject(err);
            })
    }

    p_rawlist(url, verbose) { //TODO-IPFS-MULTILIST move initialization of annotation list here
        // obj being loaded
        // Locate and return a list, based on its url
        // This is coded as a p_rawlist (i.e. returning a Promise, even though it returns immediately, that is so that
        // it can be recoded for an architecture where we need to wait for the list.
        // notify is NOT part of the Python interface, needs implementing there.
        console.assert(url, "TransportHTTP.p_rawlist: requires url");
        return new Promise((resolve, reject) => {  //XXXREJECT
            try {
                let res = (this.iiif ? this.annotationList.getResources() : this.yarray.share.array.toArray()) // Support IIIF or Y for now
                    .filter((obj) => (obj.signedby === url));
                if (verbose) console.log("p_rawlist found", ...Dweb.utils.consolearr(res));
                resolve(res);
            } catch(err) {
                console.log("Uncaught error in TransportIPFS.p_rawlist",err);
                reject(err);
            }
        })
    }
    listmonitor(url, callback, verbose) {
        // Typically called immediately after a p_rawlist to get notification of future items
        //TODO-IPFS-MULTILIST will want to make more efficient.
        if (this.iiif) {
            this.annotationList.on('resource inserted', (event) => {
                let obj = event.value;
                if (verbose) console.log('resource inserted', obj);
                if (callback && (obj.signedby === url)) callback(obj);
            });
        } else {
            this.yarray.share.array.observe((event) => {
                if (event.type === 'insert') { // Currently ignoring deletions.
                    //console.log("XXX@273", event);
                    if (verbose) console.log('resources inserted', event.values);
                    event.values.filter((obj) => obj.signedby === url).map(callback)
                }
            });
        }
    }

    rawreverse() { console.assert(false, "XXX Undefined function TransportHTTP.rawreverse"); }

    p_rawstore(data, verbose) { // Note async_rawstore took extra "self" parameter but unued and unclear that any of
        //PY-HTTP: res = self._sendGetPost(True, "rawstore", headers={"Content-Type": "application/octet-stream"}, urlargs=[], data=data, verbose=verbose)
        console.assert(data, "TransportIPFS.p_rawstore: requires data");
        let buf = (data instanceof Buffer) ? data : new Buffer(data);
        return this.promisified.ipfs.block.put(buf).then((block) => TransportIPFS.cid2url(block.cid));
    }

    rawadd(url, date, signature, signedby, verbose) {
        console.assert(url && signature && signedby, "p_rawadd args",url,signature,signedby);
        if (verbose) console.log("p_rawadd", url, date, signature, signedby);
        let value = {"url": url, "date": date, "signature": signature, "signedby": signedby};
        if (this.iiif) {
            value["@id"] = signature;
            this.annotationList.pushResource(value);
        } else {
            this.yarray.share.array.push([value]);
        }
    }
    p_rawadd(url, date, signature, signedby, verbose) {
        return new Promise((resolve, reject)=> { try {
            this.rawadd(url, date, signature, signedby, verbose);
            resolve(undefined);
        } catch(err) {
            reject(err);
        } })
    }

    async_update(self, url, type, data, verbose, success, error) { console.trace(); console.assert(false, "OBSOLETE"); //TODO-IPFS obsolete with p_*
        this.async_post("update", url, type, data, verbose, success, error);
    }


    static test(transport, verbose) {
        if (verbose) {console.log("TransportIPFS.test")}
        return new Promise((resolve, reject) => {
            try {
                let urlqbf;
                let qbf = "The quick brown fox";
                let testurl = "1114";  // Just a predictable number can work with
                let listlen;    // Holds length of list run intermediate
                let cidmultihash;   // Store cid from first block in form of multihash
                transport.p_rawstore(qbf, verbose)
                    .then((url) => {
                        if (verbose) console.log("rawstore returned", url);
                        let newcid = TransportIPFS.url2cid(url);  // Its a CID which has a buffer in it
                        console.assert(url === transport.url(qbf),"url should match url from rawstore");
                        cidmultihash = url.split('/')[2];
                        let newurl = TransportIPFS.cid2url(newcid);
                        console.assert(url === newurl, "Should round trip");
                        urlqbf = url;
                        //console.log("urlqbf=",url);
                    })
                    /*
                    .then(() => transport.p_rawstore(null, rold, verbose))
                    .then((url) => {
                            if (verbose) console.log("p_rawstore got", url);
                            urlold = url;
                        })
                    */
                    // Note above returns immediately and runs async, we don't wait for it before below
                    .then(() => transport.p_rawfetch(urlqbf, verbose))
                    .then((data) => console.assert(data === qbf, "Should fetch block stored above"))
                    .then(() => transport.p_rawlist(testurl, verbose))
                    .then((res) => {
                        listlen = res.length;
                        if (verbose) console.log("rawlist returned ", ...Dweb.utils.consolearr(res))
                    })
                    .then(() => transport.listmonitor(testurl, (obj) => console.log("Monitored", obj), verbose))
                    .then((res) => transport.p_rawadd("123", "TODAY", "Joe Smith", testurl, verbose))
                    .then(() => { if (verbose) console.log("p_rawadd returned ")  })
                    .then(() => transport.p_rawlist(testurl, verbose))
                    .then((res) => { if (verbose) console.log("rawlist returned ", ...Dweb.utils.consolearr(res)) }) // Note not showing return
                    .then(() => delay(500))
                    .then(() => transport.p_rawlist(testurl, verbose))
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
