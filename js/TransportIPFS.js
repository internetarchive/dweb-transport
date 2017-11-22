/*
This Transport layers builds on IPFS and the YJS DB

Y Lists have listeners and generate events - see docs at ...
*/


// Library packages other than IPFS
// IPFS components

//TODO-API scan this file and add documentation

const IPFS = require('ipfs');
const CID = require('cids');

// The following only required for Y version
const Y = require('yjs');
require('y-memory')(Y);
require('y-array')(Y);
require('y-text')(Y);
require('y-ipfs-connector')(Y);
require('y-indexeddb')(Y);
//require('y-leveldb')(Y); //- can't be there for browser, node seems to find it ok without this, though not sure why..
const Url = require('url');
// noinspection NpmUsedModulesInstalled
const dagPB = require('ipld-dag-pb');
// noinspection Annotator
const DAGNode = dagPB.DAGNode; // So can check its type




// Utility packages (ours) And one-liners
const promisify = require('promisify-es6');
//const makepromises = require('./utils/makepromises'); // Replaced by direct call to promisify
function delay(ms, val) { return new Promise(resolve => {setTimeout(() => { resolve(val); },ms)})}

// Other Dweb modules
const Transport = require('./Transport');
const Dweb = require('./Dweb');

//Debugging only

let defaultipfsoptions = {
    repo: '/tmp/ipfs_dweb20171029', //TODO-IPFS think through where, esp for browser
    //init: false,
    //start: false,
    //TODO-IPFS-Q how is this decentralized - can it run offline? Does it depend on star-signal.cloud.ipfs.team
    config: {
        Addresses: { Swarm: [ '/dns4/star-signal.cloud.ipfs.team/wss/p2p-webrtc-star']},  // For Y - same as defaults
//      Addresses: { Swarm: [ ] },   // Disable WebRTC to test browser crash, note disables Y so doesnt work.
    },
    //init: true, // Comment out for Y
    EXPERIMENTAL: {
        pubsub: true
    }
};

let defaultyarrayoptions = {    // Based on how IIIF uses them in bootstrap.js in ipfs-iiif-db repo
    db: {
        name: 'indexeddb',   // leveldb in node
    },
    connector: {
        name: 'ipfs',
        room: 'dweb20170908'
        //ipfs: ipfs,   // Need to link IPFS here once created
    },
    share: {
        //textfield: 'Text'
        array: 'Array'
    }
};

let defaultoptions = {
    yarray: defaultyarrayoptions,
    ipfs:   defaultipfsoptions,
    listmethod: "yarrays"
};


class TransportIPFS extends Transport {
    /*
    IPFS specific transport

    Fields:
    ipfs: object returned when starting IPFS
    yarray: object returned when starting yarray
     */

    constructor(options, verbose) {
        super(options, verbose);
        this.ipfs = undefined;          // Undefined till start IPFS
        this.options = options;         // Dictionary of options { ipfs: {...}, listmethod: "yarrays", yarray: {...} }
        this.name = "IPFS";             // For console log etc
        this.supportURLs = ['ipfs'];
        this.supportFunctions = ['fetch', 'store', 'add', 'list', 'listmonitor'];   // Does not support reverse
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

    p_ipfsstart(verbose) { //TODO-API
    /*
    Just start IPFS - not Y (note used with "yarrays" and will be used for non-IPFS list management)
    Note - can't figure out how to use async with this, as we resolve the promise based on the event callback
     */
        let self = this;
        return new Promise((resolve, reject) => {
            this.ipfs = new IPFS(this.options.ipfs);
            this.ipfs.on('ready', () => {
                this._makepromises();
                resolve();
            });
            this.ipfs.on('error', (err) => reject(err));
        })
        .then(() => self.ipfs.version())
        .then((version) => console.log('IPFS READY',version))
        .catch((err) => {
            console.log("Error caught in p_ipfsstart");
            throw(err);
        })
    }

    /* OBS Aug2017 - using "yarrays" now to support multiple connections, leave code here for month or two in case go back.
    p_yarraystart(verbose) { //TODO-API
        // Singular version - one Yarray, on one IPFS connection, monitoring everything.
        let yarrayoptions = this.options.yarray;
        let self = this;
        return p_ipfsstart(verbose)
        .then(() => {
            yarrayoptions.connector.ipfs = this.ipfs; // Note that Y needs the IPFS instance, while IIIF needed the IPFS options.
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
    */
    async p_yarraysstart(verbose) { //TODO-API
        /*
        This starts IPFS, but only sets up for Y connections, which are opened each time a resource is listed, added to, or listmonitored.
         */
        try {
            let self = this;
            await this.p_ipfsstart(verbose);
            self.yarrays = {};
        } catch(err) {
            console.log("Error caught in p_yarraysstart");
            throw(err);
        }
        //Lots of issues with "init" not knowing state before it//  this.ipfs.init({emptyRepo: true, bits: 2048})     //.then((unused) => ipfs.init({emptyRepo: true, bits: 2048}))
    }

    async p__yarray(url, verbose) {
        /*
        Utility function to get Yarray for this URL and open a new connection if not already

        url:        URL string to find list of
        resolves:   Y
        */
        try {
            if (this.yarrays[url]) {
                if (verbose) console.log("Found Y for", url);
                return this.yarrays[url];
            } else {
                let options = Transport.mergeoptions(this.options.yarray, {connector: {room: url}}); // Copies options
                if (verbose) console.log("Creating Y for", url); //"options=",options);
                options.connector.ipfs = this.ipfs;
                return this.yarrays[url] = await Y(options);
            }
        } catch(err) {
            console.log("Failed to initialize Y");
            throw err;
        }
    }


    static async p_setup(options, verbose ) {
        /*
        Setup the resource and open any P2P connections etc required to be done just once.
        In almost all cases this will call the constructor of the subclass
        Should return a new Promise that resolves to a instance of the subclass

        :param obj transportoptions: Data structure required by underlying transport layer (format determined by that layer)
        :param boolean verbose: True for debugging output
        :param options: Data structure stored on the .options field of the instance returned.
        :resolve Transport: Instance of subclass of Transport
         */
        let combinedoptions = Transport.mergeoptions(defaultoptions, options);
        console.log("IPFS options", JSON.stringify(combinedoptions));
        let t = new TransportIPFS(combinedoptions, verbose);   // Note doesnt start IPFS or Y
        Transport.addtransport(t);
        //Switch the comments on the next two lines to switch back and forth between Yarray (one connection) or Yarrays (one per list) for testing
        //(t.options.listmethod === "yarray")  ? t.p_yarraystart(verbose) : // Not currently supported
        if (t.options.listmethod === "yarrays") await t.p_yarraysstart(verbose);    // Only listmethod supported currently
        return t;
    }

    p_status() {
        /*
        Return a string for the status of a transport. No particular format, but keep it short as it will probably be in a small area of the screen.
         */
        return new Promise(resolve => resolve(this.ipfs.isOnline() ? "IPFS Online" : "IPFS Offline"));
    }

    // Everything else - unless documented here - should be opaque to the actual structure of a CID
    // or a url. This code may change as its not clear (from IPFS docs) if this is the right mapping.
    static cid2url(cid) {
        /*
        Convert a CID into a standardised URL e.g. ipfs:/ipfs/abc123
         */
        return "ipfs:/ipfs/"+cid.toBaseEncodedString()
    }

    static cidFrom(url) { //TODO-API
        /*
        Convert a URL e.g. ipfs:/ipfs/abc123 into a CID structure suitable for retrieval
        url: String of form "ipfs://ipfs/<hash>" or parsed URL or CID
        returns: CID
        throws:  TransportError if cant convert
         */
        if (url instanceof CID) return url;
        if (typeof(url) === "string") url = Url.parse(url);
        if (url && url["pathname"]) { // On browser "instanceof Url" isn't valid)
            let patharr = url.pathname.split('/');
            if ((url.protocol !== "ipfs:") || (patharr[1] != 'ipfs') || (patharr.length < 3))
                throw new Dweb.errors.TransportError("TransportIPFS.cidFrom bad format for url should be ipfs:/ipfs/...: " + url.href);
            if (patharr.length > 3)
                throw new Dweb.errors.TransportError("TransportIPFS.cidFrom not supporting paths in url yet, should be ipfs:/ipfs/...: " + url.href);
            return new CID(patharr[2]);
        } else {
            throw new Dweb.errors.CodingError("TransportIPFS.cidFrom: Cant convert url",url);
        }
    }

    async p_rawfetch(url, verbose) {
        /*
        Fetch some bytes based on a url of the form ipfs:/ipfs/Qm..... or ipfs:/ipfs/z....  .
        No assumption is made about the data in terms of size or structure, nor can we know whether it was created with dag.put or ipfs add or http /api/v0/add/

        Where required by the underlying transport it should retrieve a number if its "blocks" and concatenate them.
        Returns a new Promise that resolves currently to a string.
        There may also be need for a streaming version of this call, at this point undefined since we havent (currently) got a use case..

        TODO - there is still the failure case of short files like  ipfs/QmTds3bVoiM9pzfNJX6vT2ohxnezKPdaGHLd4Ptc4ACMLa
        TODO - added with http /api/v0/add/ but unretrievable on a browser (it retrieves below in Node).
        TODO - see https://github.com/ipfs/interface-ipfs-core/issues/164 but since can't get acknowledgement from David that this is even an issue its unlikely to get fixed

        :param string url: URL of object being retrieved
        :param boolean verbose: True for debugging output
        :resolve buffer: Return the object being fetched. (may in the future return a stream and buffer externally)
        :throws:        TransportError if url invalid - note this happens immediately, not as a catch in the promise
         */
        if (verbose) console.log("IPFS p_rawfetch", url);
        if (!url) throw new Dweb.errors.CodingError("TransportIPFS.p_rawfetch: requires url");
        let cid = TransportIPFS.cidFrom(url);  // Throws TransportError if url bad

        try {
            let res = await this.ipfs.dag.get(cid);
            // noinspection Annotator
            if (res.remainderPath.length)
                { // noinspection ExceptionCaughtLocallyJS
                    throw new Dweb.errors.TransportError("Not yet supporting paths in p_rawfetch");
                } //TODO-PATH
            let buff;
            if (res.value instanceof DAGNode) { // Its file or something added with the HTTP API for example, TODO not yet handling multiple files
                //console.log("Case a or b" - we can tell the difference by looking at (res.value._links.length > 0) but dont need to
                // as since we dont know if we are on node or browser best way is to try the file.get and if it fails try the block to get an approximate file);
                // Works on Node, but fails on Chrome, cant figure out how to get data from the DAGNode otherwise (its the wrong size)
                buff = await Dweb.utils.p_streamToBuffer(await this.ipfs.files.cat(cid), true);
                if (buff.length === 0) {    // Hit the Chrome bug
                    // This will get a file padded with ~14 bytes - 4 at front, 4 at end and cant find the other 6 !
                    // but it seems to work for PDFs which is what I'm testing on.
                    if (verbose) console.log("Kludge alert - files.cat fails in Chrome, trying block.get");
                    let blk = await this.promisified.ipfs.block.get(cid);
                    buff = blk.data;
                }
            } else { //c: not a file
                buff = res.value;
            }
            if (verbose) console.log("fetched ", buff.length);
            return buff;
        } catch (err) {
            console.log("Caught misc error in TransportIPFS.p_rawfetch");
            throw err;
        }
    }

    async p_rawlist(url, verbose) {
    /*
    Fetch all the objects in a list, these are identified by the url of the public key used for signing.
    (Note this is the 'signedby' parameter of the p_rawadd call, not the 'url' parameter
    Returns a promise that resolves to the list.
    Each item of the list is a dict: {"url": url, "date": date, "signature": signature, "signedby": signedby}
    List items may have other data (e.g. reference ids of underlying transport)

    :param string url: String with the url that identifies the list.
    :param boolean verbose: True for debugging output
    :resolve array: An array of objects as stored on the list.
     */
        try {
            if (!(typeof(url) === "string")) { url = url.href; } // Convert if its a parsed URL
            if (this.options.listmethod !== "yarrays") { // noinspection ExceptionCaughtLocallyJS
                throw new Dweb.errors.CodingError("Only support yarrays");
            }
            let y = await this.p__yarray(url, verbose);
            let res = y.share.array.toArray().filter((obj) => (obj.signedby.includes(url))); //TODO-MULTI May do this at higher level when merge results from multi transports
            if (verbose) console.log("p_rawlist found", ...Dweb.utils.consolearr(res));
            return res;
        } catch(err) {
            console.log("TransportIPFS.p_rawlist failed",err.message);
            throw(err);
        }
    }

    listmonitor(url, callback, verbose) {
    /*
    Setup a callback called whenever an item is added to a list, typically it would be called immediately after a p_rawlist to get any more items not returned by p_rawlist.

    :param url:         string Identifier of list (as used by p_rawlist and "signedby" parameter of p_rawadd
    :param callback:    function(obj)  Callback for each new item added to the list
               obj is same format as p_rawlist or p_rawreverse
    :param verbose:     boolean - True for debugging output
     */
        console.assert(this.options.listmethod === "yarrays");
        if (!(typeof(url) === "string")) { url = url.href; } // Convert if its a parsed URL
        let y = this.yarrays[url];
        console.assert(y,"Should always exist before calling listmonitor - async call p__yarray(url) to create");
        y.share.array.observe((event) => {
            if (event.type === 'insert') { // Currently ignoring deletions.
                if (verbose) console.log('resources inserted', event.values);
                event.values.filter((obj) => obj.signedby.includes(url)).map(callback);
            }
        })
    }

    /*OBS - not supporting YARRAY(Singular)
    listmonitor(url, callback, verbose) {
        this.yarray.share.array.observe((event) => {
            if (event.type === 'insert') { // Currently ignoring deletions.
                if (verbose) console.log('resources inserted', event.values);
                event.values.filter((obj) => obj.signedby === url).map(callback) // Note - no longer works with multi urls
            }
        });
    }
    */

    rawreverse() {
        /*
        Similar to p_rawlist, but return the list item of all the places where the object url has been listed.
        The url here corresponds to the "url" parameter of p_rawadd
        Returns a promise that resolves to the list.

        :param string url: String with the url that identifies the object put on a list.
        :param boolean verbose: True for debugging output
        :resolve array: An array of objects as stored on the list.
         */
        //TODO-REVERSE this needs implementing once list structure on IPFS more certain
        throw new Dweb.errors.ToBeImplementedError("Undefined function TransportHTTP.rawreverse"); }

    async p_rawstore(data, verbose) {
        /*
        Store a blob of data onto the decentralised transport.
        Returns a promise that resolves to the url of the data

        :param string|Buffer data: Data to store - no assumptions made to size or content
        :param boolean verbose: True for debugging output
        :resolve string: url of data stored
         */
        console.assert(data, "TransportIPFS.p_rawstore: requires data");
        let buf = (data instanceof Buffer) ? data : new Buffer(data);
        //return this.promisified.ipfs.block.put(buf).then((block) => block.cid)
        //https://github.com/ipfs/interface-ipfs-core/blob/master/SPEC/DAG.md#dagput
        let cid = await this.ipfs.dag.put(buf,{ format: 'dag-cbor', hashAlg: 'sha2-256' });
        return TransportIPFS.cid2url(cid);
        //return this.ipfs.files.put(buf).then((block) => TransportIPFS.cid2url(block.cid));
    }

    async p_rawadd(urls, date, signature, signedby, verbose) {
        /*
        Store a new list item, it should be stored so that it can be retrieved either by "signedby" (using p_rawlist) or
        by "url" (with p_rawreverse). The underlying transport does not need to guarrantee the signature,
        an invalid item on a list should be rejected on higher layers.

        :param string urls: String identifying places to find an object being added to the list.
        :param string date: Date (as returned by new Data.now() )
        :param string signature: Signature of url+date
        :param string signedby: url of the public key used for the signature. TODO-MULTI this is currently singular
        :param boolean verbose: True for debugging output
        :resolve undefined:
        */
        console.assert(urls && signature && signedby, "p_rawadd args",urls,signature,signedby);
        if (verbose) console.log("p_rawadd", urls, date, signature, signedby);
        let value = {urls: urls, date: date.toISOString(), signature: signature, signedby: signedby};
        let y = await this.p__yarray(signedby, verbose);
        y.share.array.push([value]);
    }
    /*OBS - not supporting YARRAY singular
    rawadd(url, date, signature, signedby, verbose) {
        console.assert(url && signature && signedby, "p_rawadd args",url,signature,signedby);
        if (verbose) console.log("p_rawadd", url, date, signature, signedby);
        let value = {"url": url, "date": date, "signature": signature, "signedby": signedby};
        this.yarray.share.array.push([value]);
    }

    p_rawadd(url, date, signature, signedby, verbose) {
        return new Promise((resolve, reject)=> { try {
            this.rawadd(url, date, signature, signedby, verbose);
            resolve(undefined);
        } catch(err) {
            reject(err);
        } })
    }
    */

    static async test(transport, verbose) {
        if (verbose) {console.log("TransportIPFS.test")}
        try {
            let urlqbf;
            let qbf = "The quick brown fox";
            let qbf_url = "ipfs:/ipfs/zdpuAscRnisRkYnEyJAp1LydQ3po25rCEDPPEDMymYRfN1yPK"; // Expected url
            let testurl = "1114";  // Just a predictable number can work with
            let url = await transport.p_rawstore(qbf, verbose);
            if (verbose) console.log("rawstore returned", url);
            let newcid = TransportIPFS.cidFrom(url);  // Its a CID which has a buffer in it
            console.assert(url === qbf_url, "url should match url from rawstore");
            let cidmultihash = url.split('/')[2];  // Store cid from first block in form of multihash
            let newurl = TransportIPFS.cid2url(newcid);
            console.assert(url === newurl, "Should round trip");
            urlqbf = url;
            let data = await transport.p_rawfetch(urlqbf, verbose);
            console.assert(data.toString() === qbf, "Should fetch block stored above");
            let res = await transport.p_rawlist(testurl, verbose);
            let listlen = res.length;   // Holds length of list run intermediate
            if (verbose) console.log("rawlist returned ", ...Dweb.utils.consolearr(res));
            transport.listmonitor(testurl, (obj) => console.log("Monitored", obj), verbose);
            await transport.p_rawadd("123", new Date(Date.now()), "Joe Smith", testurl, verbose);
            if (verbose) console.log("p_rawadd returned ");
            res = await transport.p_rawlist(testurl, verbose);
            if (verbose) console.log("rawlist returned ", ...Dweb.utils.consolearr(res)); // Note not showing return
            await delay(500);
            res = await transport.p_rawlist(testurl, verbose);
            console.assert(res.length === listlen + 1, "Should have added one item");
            //console.log("TransportIPFS test complete");
        } catch(err) {
            console.log("Exception thrown in TransportIPFS.test:", err.message);
            throw err;
        }
    }

}
TransportIPFS.Y = Y; // Allow node tests to find it
exports = module.exports = TransportIPFS;
