/*
This Transport layers builds on IPFS and the YJS DB

Y Lists have listeners and generate events - see docs at ...
*/

// IPFS components

const IPFS = require('ipfs');
const CID = require('cids');
// noinspection NpmUsedModulesInstalled
const dagPB = require('ipld-dag-pb');
// noinspection Annotator
const DAGNode = dagPB.DAGNode; // So can check its type

// Library packages other than IPFS
const Url = require('url');

// Utility packages (ours) And one-liners
const promisify = require('promisify-es6');
//const makepromises = require('./utils/makepromises'); // Replaced by direct call to promisify

// Other Dweb modules
const Transport = require('./Transport');
const Dweb = require('./Dweb');

let defaultoptions = {
    ipfs: {
        repo: '/tmp/dweb_ipfsv2700', //TODO-IPFS think through where, esp for browser
        //init: false,
        //start: false,
        //TODO-IPFS-Q how is this decentralized - can it run offline? Does it depend on star-signal.cloud.ipfs.team
        config: {
            //      Addresses: { Swarm: [ '/dns4/star-signal.cloud.ipfs.team/wss/p2p-webrtc-star']},  // For Y - same as defaults
            //      Addresses: { Swarm: [ ] },   // Disable WebRTC to test browser crash, note disables Y so doesnt work.
            Addresses: {Swarm: ['/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star']}, // from https://github.com/ipfs/js-ipfs#faq 2017-12-05 as alternative to webrtc
        },
        //init: true, // Comment out for Y
        EXPERIMENTAL: {
            pubsub: true
        }
    }
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
        this.options = options;         // Dictionary of options { ipfs: {...}, "yarrays", yarray: {...} }
        this.name = "IPFS";             // For console log etc
        this.supportURLs = ['ipfs'];
        this.supportFunctions = ['fetch', 'store'];   // Does not support reverse
        this.status = Dweb.Transport.STATUS_LOADED;
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

    p_ipfsstart(verbose) {
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
            });
    }

    static setup0(options, verbose) {
        /*
            First part of setup, create obj, add to Transports but dont attempt to connect, typically called instead of p_setup if want to parallelize connections.
        */
        let combinedoptions = Transport.mergeoptions(defaultoptions, options);
        console.log("IPFS options %o", combinedoptions);
        let t = new TransportIPFS(combinedoptions, verbose);   // Note doesnt start IPFS
        Dweb.Transports.addtransport(t);
        return t;
    }

    async p_setup1a(verbose) {
        try {
            this.status = Dweb.Transport.STATUS_STARTING;   // Should display, but probably not refreshed in most case
            await this.p_ipfsstart(verbose);    // Throws Error("websocket error") and possibly others.
        } catch(err) {
            console.error("IPFS failed to connect",err);
            this.status = Dweb.Transport.STATUS_FAILED;
        }
        return this;
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
        return await TransportIPFS.setup0(options, verbose) // Create instance but dont connect
            .p_setup1(verbose);             // Connect
    }

    async p_status(verbose) {
        /*
        Return a string for the status of a transport. No particular format, but keep it short as it will probably be in a small area of the screen.
         */
        this.status =  (await this.ipfs.isOnline()) ? Dweb.Transport.STATUS_CONNECTED : Dweb.Transport.STATUS_FAILED;
        return this.status;
    }

    // Everything else - unless documented here - should be opaque to the actual structure of a CID
    // or a url. This code may change as its not clear (from IPFS docs) if this is the right mapping.
    static cid2url(cid) {
        /*
        Convert a CID into a standardised URL e.g. ipfs:/ipfs/abc123
         */
        return "ipfs:/ipfs/"+cid.toBaseEncodedString()
    }

    static cidFrom(url) {
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
            if ((url.protocol !== "ipfs:") || (patharr[1] !== 'ipfs') || (patharr.length < 3))
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
                if (verbose) console.log("IPFS p_rawfetch looks like its a file", url);
                //console.log("Case a or b" - we can tell the difference by looking at (res.value._links.length > 0) but dont need to
                // as since we dont know if we are on node or browser best way is to try the files.cat and if it fails try the block to get an approximate file);
                // Works on Node, but fails on Chrome, cant figure out how to get data from the DAGNode otherwise (its the wrong size)
                //buff = await Dweb.utils.p_streamToBuffer(await this.ipfs.files.cat(cid), true); //js-ipfs v0.26 version
                buff = await this.ipfs.files.cat(cid); //js-ipfs v0.27 version
                /* Was only needed on v0.26
                if (buff.length === 0) {    // Hit the Chrome bug
                    // This will get a file padded with ~14 bytes - 4 at front, 4 at end and cant find the other 6 !
                    // but it seems to work for PDFs which is what I'm testing on.
                    if (verbose) console.log("Kludge alert - files.cat fails in Chrome, trying block.get");
                    let blk = await this.promisified.ipfs.block.get(cid);
                    buff = blk.data;
                }
                END of v0.26 version */
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
            //console.log("TransportIPFS test complete");
        } catch(err) {
            console.log("Exception thrown in TransportIPFS.test:", err.message);
            throw err;
        }
    }

}
exports = module.exports = TransportIPFS;
