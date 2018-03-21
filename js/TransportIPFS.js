/*
This is a shim to the IPFS library, (Lists are handled in YJS or OrbitDB)
See https://github.com/ipfs/js-ipfs but note its often out of date relative to the generic API doc.
*/

// IPFS components

const IPFS = require('ipfs');
const CID = require('cids');
// noinspection NpmUsedModulesInstalled
const dagPB = require('ipld-dag-pb');
// noinspection Annotator
const DAGNode = dagPB.DAGNode; // So can check its type
const stream = require('readable-stream');  // Needed for the pullthrough - this is NOT Ipfs streams

// Library packages other than IPFS
const Url = require('url');

// Utility packages (ours) And one-liners
const promisify = require('promisify-es6');
//const makepromises = require('./utils/makepromises'); // Replaced by direct call to promisify

// Other Dweb modules
const errors = require('./Errors'); // Standard Dweb Errors
const Transport = require('./Transport.js'); // Base class for TransportXyz
const Transports = require('./Transports'); // Manage all Transports that are loaded
const utils = require('./utils'); // Utility functions

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
        this.supportFunctions = ['fetch', 'store'];   // Does not support reverse, createReadStream fails as cant seek
        this.status = Transport.STATUS_LOADED;
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
        if (verbose) console.log("IPFS loading options %o", combinedoptions);
        let t = new TransportIPFS(combinedoptions, verbose);   // Note doesnt start IPFS
        Transports.addtransport(t);
        return t;
    }

    async p_setup1(verbose) {
        try {
            if (verbose) console.log("IPFS starting and connecting");
            this.status = Transport.STATUS_STARTING;   // Should display, but probably not refreshed in most case
            await this.p_ipfsstart(verbose);    // Throws Error("websocket error") and possibly others.
            this.status =  (await this.ipfs.isOnline()) ? Transport.STATUS_CONNECTED : Transport.STATUS_FAILED;
        } catch(err) {
            console.error("IPFS failed to connect",err);
            this.status = Transport.STATUS_FAILED;
        }
        return this;
    }

    async p_status(verbose) {
        /*
        Return a string for the status of a transport. No particular format, but keep it short as it will probably be in a small area of the screen.
         */
        this.status =  (await this.ipfs.isOnline()) ? Transport.STATUS_CONNECTED : Transport.STATUS_FAILED;
        return this.status;
    }

    // Everything else - unless documented here - should be opaque to the actual structure of a CID
    // or a url. This code may change as its not clear (from IPFS docs) if this is the right mapping.
    static urlFrom(unknown) {
        /*
        Convert a CID into a standardised URL e.g. ipfs:/ipfs/abc123
         */
        if (unknown instanceof CID)
            return "ipfs:/ipfs/"+unknown.toBaseEncodedString();
        if (typeof unknown === "object" && unknown.hash) // e.g. from files.add
                return "ipfs:/ipfs/"+unknown.hash;
        if (typeof unknown === "string")    // Not used currently
            return "ipfs:/ipfs/"+unknown;
        throw new errors.CodingError("TransportIPFS.urlFrom: Cant convert to url from",unknown);
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
                throw new errors.TransportError("TransportIPFS.cidFrom bad format for url should be ipfs:/ipfs/...: " + url.href);
            if (patharr.length > 3)
                throw new errors.TransportError("TransportIPFS.cidFrom not supporting paths in url yet, should be ipfs:/ipfs/...: " + url.href);
            return new CID(patharr[2]);
        } else {
            throw new errors.CodingError("TransportIPFS.cidFrom: Cant convert url",url);
        }
    }

    static ipfsFrom(url) {
        /*
        Convert to a ipfspath i.e. /ipfs/Qm....
        Required because of strange differences in APIs between files.cat and dag.get  see https://github.com/ipfs/js-ipfs/issues/1229
         */
        return (typeof(url) === "string" ? url : url.href).slice(5);
    }
    async p_rawfetch(url, {verbose=false, timeoutMS=60000, relay=false}={}) {
        /*
        Fetch some bytes based on a url of the form ipfs:/ipfs/Qm..... or ipfs:/ipfs/z....  .
        No assumption is made about the data in terms of size or structure, nor can we know whether it was created with dag.put or ipfs add or http /api/v0/add/

        Where required by the underlying transport it should retrieve a number if its "blocks" and concatenate them.
        Returns a new Promise that resolves currently to a string.
        There may also be need for a streaming version of this call, at this point undefined since we havent (currently) got a use case..

        :param string url: URL of object being retrieved
        :param boolean verbose: true for debugging output
        :resolve buffer: Return the object being fetched. (may in the future return a stream and buffer externally)
        :throws:        TransportError if url invalid - note this happens immediately, not as a catch in the promise
         */
        if (verbose) console.log("IPFS p_rawfetch", utils.stringfrom(url));
        if (!url) throw new errors.CodingError("TransportIPFS.p_rawfetch: requires url");
        const cid = TransportIPFS.cidFrom(url);  // Throws TransportError if url bad
        const ipfspath = TransportIPFS.ipfsFrom(url) // Need because dag.get has different requirement than file.cat

        try {
            let res = await utils.p_timeout(this.ipfs.dag.get(cid), timeoutMS);
            // noinspection Annotator
            if (res.remainderPath.length)
                { // noinspection ExceptionCaughtLocallyJS
                    throw new errors.TransportError("Not yet supporting paths in p_rawfetch");
                } //TODO-PATH
            let buff;
            if (res.value instanceof DAGNode) { // Its file or something added with the HTTP API for example, TODO not yet handling multiple files
                if (verbose) console.log("IPFS p_rawfetch looks like its a file", url);
                //console.log("Case a or b" - we can tell the difference by looking at (res.value._links.length > 0) but dont need to
                // as since we dont know if we are on node or browser best way is to try the files.cat and if it fails try the block to get an approximate file);
                // Works on Node, but fails on Chrome, cant figure out how to get data from the DAGNode otherwise (its the wrong size)
                //buff = await utils.p_streamToBuffer(await this.ipfs.files.cat(cid), true); //js-ipfs v0.26 version
                buff = await this.ipfs.files.cat(ipfspath); //See js-ipfs v0.27 version and  https://github.com/ipfs/js-ipfs/issues/1229 and https://github.com/ipfs/interface-ipfs-core/blob/master/SPEC/FILES.md#cat
                /* Was needed on v0.26, not on v0.27
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
            if (verbose) console.log(`IPFS fetched ${buff.length} from ${ipfspath}`);
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
        :param boolean verbose: true for debugging output
        :resolve string: url of data stored
         */
        console.assert(data, "TransportIPFS.p_rawstore: requires data");
        let buf = (data instanceof Buffer) ? data : new Buffer(data);
        //return this.promisified.ipfs.block.put(buf).then((block) => block.cid)
        //https://github.com/ipfs/interface-ipfs-core/blob/master/SPEC/DAG.md#dagput
        //let res = await this.ipfs.dag.put(buf,{ format: 'dag-cbor', hashAlg: 'sha2-256' });
        let res = (await this.ipfs.files.add(buf,{ "cid-version": 1, hashAlg: 'sha2-256'}))[0];
        //TODO-IPFS has been suggested to move this to files.add with no filename.
        return TransportIPFS.urlFrom(res);
        //return this.ipfs.files.put(buf).then((block) => TransportIPFS.urlFrom(block.cid));
    }

    createReadStream(url, opts = {}, verbose = false) {
        //TODO-API needs documentation and API update when working
        //TODO-STREAMS untested - doesnt work since cant seek into streams.
        if (verbose) console.log("TransportIPFS:createReadStream:%o, %o", url, opts);
        if (!url) throw new errors.CodingError("TransportIPFS.p_rawfetch: requires url");
        let stream = this.ipfs.files.catReadableStream(TransportIPFS.cidFrom(url));   // cidFrom Throws TransportError if url bad
        return stream;
    }

    static async p_test(opts, verbose) {
        if (verbose) {console.log("TransportIPFS.test")}
        try {
            let transport = await this.p_setup(opts, verbose); // Assumes IPFS already setup
            if (verbose) console.log(transport.name,"setup");
            let res = await transport.p_status(verbose);
            console.assert(res === Transport.STATUS_CONNECTED)

            let urlqbf;
            let qbf = "The quick brown fox";
            let qbf_url = "ipfs:/ipfs/zdpuAscRnisRkYnEyJAp1LydQ3po25rCEDPPEDMymYRfN1yPK"; // Expected url
            let testurl = "1114";  // Just a predictable number can work with
            let url = await transport.p_rawstore(qbf, verbose);
            if (verbose) console.log("rawstore returned", url);
            let newcid = TransportIPFS.cidFrom(url);  // Its a CID which has a buffer in it
            console.assert(url === qbf_url, "url should match url from rawstore");
            let cidmultihash = url.split('/')[2];  // Store cid from first block in form of multihash
            let newurl = TransportIPFS.urlFrom(newcid);
            console.assert(url === newurl, "Should round trip");
            urlqbf = url;
            let data = await transport.p_rawfetch(urlqbf, {verbose});
            console.assert(data.toString() === qbf, "Should fetch block stored above");
            //console.log("TransportIPFS test complete");
            return transport
        } catch(err) {
            console.log("Exception thrown in TransportIPFS.test:", err.message);
            throw err;
        }
    }

}
Transports._transportclasses["IPFS"] = TransportIPFS;
exports = module.exports = TransportIPFS;
