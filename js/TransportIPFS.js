/*
This Transport layers builds on IPFS and the YJS DB

Y Lists have listeners and generate events - see docs at ...
*/


// Library packages other than IPFS
// IPFS components

//TODO-REL4-API scan this file and add documentation

const IPFS = require('ipfs');
const CID = require('cids');
// Leave IpfsIiiifDb commented out as there is (or at least "was") a bug where browserify crashes if included directly - include seperately in the app.
//const IpfsIiifDb = require('ipfs-iiif-db');  //https://github.com/pgte/ipfs-iiif-db

// The following only required for Y version
const Y = require('yjs');
require('y-memory')(Y);
require('y-array')(Y);
require('y-text')(Y);
require('y-ipfs-connector')(Y);
require('y-indexeddb')(Y);
//require('y-leveldb')(Y); - can't be there for browser, node seems to find it ok without this, though not sure why..
const Url = require('url');



// Utility packages (ours) Aand one-loners
const promisify = require('promisify-es6');
//const makepromises = require('./utils/makepromises'); // Replaced by direct call to promisify
function delay(ms, val) { return new Promise(resolve => {setTimeout(() => { resolve(val); },ms)})}

// Other Dweb modules
const Transport = require('./Transport');
const Dweb = require('./Dweb');

//Debugging only

let defaultipfsoptions = {
    repo: '/tmp/ipfs_dweb20170908', //TODO-IPFS think through where, esp for browser
    //init: false,
    //start: false,
    //TODO-IPFS-Q how is this decentralized - can it run offline? Does it depend on star-signal.cloud.ipfs.team
    config: {
//        Addresses: { Swarm: [ '/p2p-webrtc-star/dns4/star-signal.cloud.ipfs.team/wss' ] },   // For IIIF or Y - same as defaults (Old pre IPFS26)
        Addresses: { Swarm: [ '/dns4/star-signal.cloud.ipfs.team/wss/p2p-webrtc-star']},
//      Addresses: { Swarm: [ ] },   // Disable WebRTC to test browser crash, note disables IIIF or Y so doesnt work.
    },
    //init: true, // Comment out for IIIF or Y
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


/* OBS - only required for IIIF
// See https://github.com/pgte/ipfs-iiif-db for options
let defaultiiifoptions = {
        //store: "leveldb", // leveldb is needed on Node, indexeddb on browser, see test.js for how overridden in node.
        store: "indexeddb",
        partition: "dweb20170828" //TODO-IIIF try making parition a variable and connecting to multiple lists.
        //ipfs: ..., //Will have ipfsoptions stored during startup
};

const annotationlistexample = { //TODO-IPFS update this to better example, not required for Y, only IIIF
    "@id": "foobar",    // Only required field is @id
    "url": "ipfs:/ipfs/A1B2C3D4E5",
    "date": "20170104T1234",
    "signature": "123456ABC",
    "signedby": "123456ABC"
};
*/

let defaultoptions = {
    //iiif:   defaultiiifoptions,   // Stopping support for IIIF, using Y directly
    yarray: defaultyarrayoptions,
    ipfs:   defaultipfsoptions,
    listmethod: "yarrays"
};


class TransportIPFS extends Transport {
    /*
    IPFS specific transport

    Fields:
    ipfs: object returned when starting IPFS
    iiif: object returned when starting iiif
    yarray: object returned when starting yarray
     */

    constructor(options, verbose) {
        super(options, verbose);
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

    /* OBS Aug2017 - using "yarrays" now to support multiple connections not IIIF, leave code here for month or two in case go back.
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
                    this.annotationList = this.iiif.annotationList(annotationlistexample);    //inefficient ... move this to the list command - means splitting stuff under it that calls bootstrap
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
    */

    p_ipfsstart(verbose) { //TODO-REL4-API
    /*
    Just start IPFS - not Y or IIIF (note used with "yarrays" and will be used for non-IPFS list management)

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
            console.log("Error caught in p_ipfsstart",err);
            throw(err);
        })
    }

    /* OBS Aug2017 - using "yarrays" now to support multiple connections, leave code here for month or two in case go back.
    p_yarraystart(verbose) { //TODO-REL4-API
        // Singular version - one Yarray, on one IPFS connection, monitoring everything.
        let yarrayoptions = this.options.yarray;
        let self = this;
        return p_ipfsstart(verbose)
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
    */
    p_yarraysstart(verbose) { //TODO-REL4-API
        /*
        This starts IPFS, but only sets up for Y connections, which are opened each time a resource is listed, added to, or listmonitored.
         */
        let self = this;
        return this.p_ipfsstart(verbose)
            .then(() => {
                self.yarrays = {};
            })
            .catch((err) => {
                console.log("Error caught in p_yarraystart",err);
                throw(err);
            })
        //Lots of issues with "init" not knowing state before it//  this.ipfs.init({emptyRepo: true, bits: 2048})     //.then((unused) => ipfs.init({emptyRepo: true, bits: 2048}))
    }

    p__yarray(url, verbose) {
        /*
        Utility function to get Yarray for this URL and open a new connection if not already

        url:        URL string to find list of
        resolves:   Y
        */
        if (this.yarrays[url]) {
            if (verbose) console.log("Found Y for",url);
            return new Promise((resolve, reject) => resolve(this.yarrays[url]));
        } else {
            if (verbose) console.log("Creating Y for",url);
            let options = Transport.mergeoptions(this.options.yarray, {connector: { room: url}}); // Copies options
            options.connector.ipfs = this.ipfs;
            return Y(options)
                .then((y) => this.yarrays[url] = y);
        }
    }


    static p_setup(options, verbose ) {
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
        let t = new TransportIPFS(combinedoptions, verbose);   // Note doesnt start IPFS or IIIF or Y
        Dweb.transports.ipfs = t;
        Dweb.transportpriority.push(t);    // Sets to default transport if nothing else set otherwise on a list
        //Switch the comments on the next two lines to switch back and forth between IIIF or Y for testing
        //TODO-REL5 try multiple Y-lists
        return  (   (t.options.listmethod === "iiif")    ? t.p_iiifstart(verbose)   // Not currently supported
                :   (t.options.listmethod === "yarray")  ? t.p_yarraystart(verbose)  // Not currently supported
                :   (t.options.listmethod === "yarrays") ? t.p_yarraysstart(verbose)
                :   undefined   )
            .then(() => t);
    }

    supports(url) { //TODO-REL4-API
        /*
        Determine if this transport supports a certain set of URLs

        url     String or parsed URL
        returns True if this protocol supports these URLs
         */
        if (!url) return true; // Can handle default URLs
        if (url && (typeof url === 'string')) {
            url = Url.parse(url);    // For efficiency, only parse once.
        }
        let protocol = url.protocol;    // Lower case, Includes trailing :
        return protocol === 'ipfs:';
    }

    p_status() {
        /*
        Return a string for the status of a transport. No particular format, but keep it short as it will probably be in a small area of the screen.
         */
        return new Promise(resolve => resolve(this.ipfs.isOnline() ? "IPFS Online" : "IPFS Offline"));
    }

    url(data) {
        /*
         Return an identifier for the data without storing typically ipfs:/ipfs/a1b2c3d4...

         :param string|Buffer data   arbitrary data
         :return string              valid url to retrieve data via p_rawfetch
         */
        return "ipfs:/ipfs/" + Dweb.KeyPair.multihashsha256_58(data)
    }

    // Everything else - unless documented here - should be opaque to the actual structure of a CID
    // or a url. This code may change as its not clear (from IPFS docs) if this is the right mapping.
    static cid2url(cid) {
        /*
        Convert a CID into a standardised URL e.g. ipfs:/ipfs/abc123
         */
        //console.log(cid.multihash[0],cid.multihash[1],cid.multihash[2]);
        return "ipfs:/ipfs/"+cid.toBaseEncodedString()
    }

    static url2cid(url) {
        /*
        Convert a URL e.g. ipfs:/ipfs/abc123 into a CID structure suitable for retrieval
         */
        let arr = url.split('/');
        if (!(arr.length===3 && arr[0] === "ipfs:" && arr[1]==="ipfs"))
                throw new Dweb.errors.TransportError("TransportIPFS.url2cid bad format for url should be ipfs:/ipfs/...: "+url);
        return new CID(arr[2])
    }

    p_rawfetch(url, verbose) {
        /*
        Fetch some bytes based on a url, no assumption is made about the data in terms of size or structure.
        Where required by the underlying transport it should retrieve a number if its "blocks" and concatenate them.
        Returns a new Promise that resolves currently to a string.
        There may also be need for a streaming version of this call, at this point undefined.

        :param string url: URL of object being retrieved
        :param boolean verbose: True for debugging output
        :resolve string: Return the object being fetched, (note currently returned as a string, may refactor to return Buffer)
        :throws:        TransportError if url invalid - note this happens immediately, not as a catch in the promise
         */
        if (verbose) { console.log("IPFS p_rawfetch",url)}
        if (!url) throw new CodingError("TransportIPFS.p_rawfetch: requires url");
        let cid = (url instanceof CID) ? url : TransportIPFS.url2cid(url);  // Throws TransportError if url bad
        if (verbose) console.log("CID=",cid)
        //return this.promisified.ipfs.block.get(cid).then((result) => result.data) // OLD way, works below 250k bytes, where files.cat doesnt !
        return this.ipfs.files.cat(cid)
            .then((stream) => Dweb.utils.p_streamToBuffer(stream, verbose))
            .then((data) => {   // Horrible Kludge - stream returns 0 length if short file not IPLD
                if (data.length) {
                    return data
                } else {
                    if (verbose) console.log("Kludge alert - files.cat failed, trying block.get");
                    return this.promisified.ipfs.block.get(cid)
                        .then((blk) => blk.data);
                }
            })
            .then((data)=> { if (verbose) console.log("fetched ",data.length); return data; })
            .catch((err) => {
                console.log("Caught misc error in TransportIPFS.p_rawfetch", err);
                throw(err);
            })
    }

    p_rawlist(url, verbose) {
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
        if (this.options.listmethod !== "yarrays") throw new CodingError("Only support yarrays");
        return this.p__yarray(url, verbose)
            .then((y) => y.share.array.toArray().filter((obj) => (obj.signedby === url)))
            .then((res) => {
                if (verbose) console.log("p_rawlist found", ...Dweb.utils.consolearr(res));
                return res;
            })
            .catch((err) => {
                console.log("Uncaught error in TransportIPFS.p_rawlist", err);
                throw(err);
            })
    }

    /*OBS - not supporting IIIF or YARRAY (singular)
    p_rawlist(url, verbose) {
        console.assert(url, "TransportHTTP.p_rawlist: requires url");
        //The listmethods are handled slightly differently as iiif & yarray is sync while the other is potentially async as may have to connect first

        return new Promise((resolve, reject) => {  //XXXREJECT
            try {
                let res = (
                      (this.options.listmethod === "iiif")      ? this.annotationList.getResources()    // IIIF
                    : (this.options.listmethod === "yarray")    ? this.yarray.share.array.toArray() : undefined)    // YARRAY (singular)
                    .filter((obj) => (obj.signedby === url));
                if (verbose) console.log("p_rawlist found", ...Dweb.utils.consolearr(res));
                resolve(res);
            } catch(err) {
                console.log("Uncaught error in TransportIPFS.p_rawlist",err);
                reject(err);
            }
        })
    }
    */

    listmonitor(url, callback, verbose) {
    /*
    Setup a callback called whenever an item is added to a list, typically it would be called immediately after a p_rawlist to get any more items not returned by p_rawlist.

    :param url:         string Identifier of list (as used by p_rawlist and "signedby" parameter of p_rawadd
    :param callback:    function(obj)  Callback for each new item added to the list
               obj is same format as p_rawlist or p_rawreverse
    :param verbose:     boolean - True for debugging output
     */
        console.assert(this.options.listmethod === "yarrays");
        let y = this.yarrays[url];
        console.assert(y,"Should always exist before calling listmonitor - async call p__yarray(url) to create");
        y.share.array.observe((event) => {
            if (event.type === 'insert') { // Currently ignoring deletions.
                if (verbose) console.log('resources inserted', event.values);
                event.values.filter((obj) => obj.signedby === url).map(callback)
            }
        })
    }

    /*OBS - not supporting IIIF or YARRAY(Singular)
    listmonitor(url, callback, verbose) {
        if ( this.options.listmethod === "iiif") {
            this.annotationList.on('resource inserted', (event) => {
                let obj = event.value;
                if (verbose) console.log('resource inserted', obj);
                if (callback && (obj.signedby === url)) callback(obj);
            });
        } else {
            this.yarray.share.array.observe((event) => {
                if (event.type === 'insert') { // Currently ignoring deletions.
                    if (verbose) console.log('resources inserted', event.values);
                    event.values.filter((obj) => obj.signedby === url).map(callback)
                }
            });
        }
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

    p_rawstore(data, verbose) {
        /*
        Store a blob of data onto the decentralised transport.
        Returns a promise that resolves to the url of the data

        :param string|Buffer data: Data to store - no assumptions made to size or content
        :param boolean verbose: True for debugging output
        :resolve string: url of data stored
         */
        console.assert(data, "TransportIPFS.p_rawstore: requires data");
        let buf = (data instanceof Buffer) ? data : new Buffer(data);
        return this.promisified.ipfs.block.put(buf).then((block) => TransportIPFS.cid2url(block.cid));
        return this.ipfs.files.put(buf).then((block) => TransportIPFS.cid2url(block.cid));
    }

    p_rawadd(url, date, signature, signedby, verbose) {
        /*
        Store a new list item, it should be stored so that it can be retrieved either by "signedby" (using p_rawlist) or
        by "url" (with p_rawreverse). The underlying transport does not need to guarrantee the signature,
        an invalid item on a list should be rejected on higher layers.

        :param string url: String identifying an object being added to the list.
        :param string date: Date (as returned by new Data.now() )
        :param string signature: Signature of url+date
        :param string signedby: url of the public key used for the signature.
        :param boolean verbose: True for debugging output
        :resolve undefined:
        */
        console.assert(url && signature && signedby, "p_rawadd args",url,signature,signedby);
        if (verbose) console.log("p_rawadd", url, date, signature, signedby);
        let value = {url: url, date: date.toISOString(), signature: signature, signedby: signedby};
        return this.p__yarray(signedby, verbose)
            .then((y) => y.share.array.push([value]));
    }
    /*OBS - not supporting IIIF or YARRAY singular
    rawadd(url, date, signature, signedby, verbose) {
        console.assert(url && signature && signedby, "p_rawadd args",url,signature,signedby);
        if (verbose) console.log("p_rawadd", url, date, signature, signedby);
        let value = {"url": url, "date": date, "signature": signature, "signedby": signedby};
        if ( this.options.listmethod === "iiif") {
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
    */
    async_update(self, url, type, data, verbose, success, error) {
        throw new ObsoleteError("OBSOLETE"); //TODO-IPFS obsolete with p_*
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
                    .then((data) => console.assert(data.toString() === qbf, "Should fetch block stored above"))
                    .then(() => transport.p_rawlist(testurl, verbose))
                    .then((res) => {
                        listlen = res.length;
                        if (verbose) console.log("rawlist returned ", ...Dweb.utils.consolearr(res))
                    })
                    .then(() => transport.listmonitor(testurl, (obj) => console.log("Monitored", obj), verbose))
                    .then((res) => transport.p_rawadd("123", new Date(Date.now()), "Joe Smith", testurl, verbose))
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
