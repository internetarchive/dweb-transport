const errors = require('./Errors'); // Standard Dweb Errors
const Transports = require('./Transports'); // Manage all Transports that are loaded
const SmartDict = require("./SmartDict"); //for extends
const KeyPair = require('./KeyPair'); // Encapsulate public/private key pairs and crypto libraries
const utils = require('./utils'); // Utility functions
const KeyValueTable = require("./KeyValueTable"); //for extends
const KeyChain = require('./KeyChain'); // Hold a set of keys, and locked objects

//Mixins based on https://javascriptweblog.wordpress.com/2011/05/31/a-fresh-look-at-javascript-mixins/

const SignatureMixin = function(fieldlist) {
    /*
        This mixin is a generic signature tool, allows to specify which fields of an object should be signed/verified.

        Fields:
        signatures: [{
            date,                   ISODate when signed
            signature,              Signature (see KeyPair)
            signedby,               Exported Public Key of Signer (see KeyPair)
            }]                      Each signature is of JSON.stringify({date, domains, name, keys, urls|tablepublicurls, expires})
     */
    this.fieldlist = fieldlist;

    this.signatureConstructor = function() {
        this.signatures = this.signatures || [];
    };
    this._signable = function(date) {
        return JSON.stringify({"date": date, signed: utils.keyFilter(this, this.__proto__.fieldlist)});
    };
    this._signSelf = function(keypair) { // Pair of verify
        const date = new Date(Date.now());
        this.signatures.push({date,
            signature: keypair.sign(  this._signable(date)),
            signedby: keypair.signingexport()
        })
    };
    this._verifyOwnSigs = function() { // Pair of sign
        // Return an array of keys that signed this match, caller should check it accepts those keys
        console.debug("WARNING - faking signature verification while testing gateway to archive metadata")
        return this.signatures
            .filter(sig => ( sig.signature === "FAKEFAKEFAKE"  ||       // TODO=DOMAIN obviously this is faking verification while testing gateway to archive metadata
                new KeyPair({key: sig.signedby}).verify(this._signable(sig.date), sig.signature)))
            .map(sig => sig.signedby);
    };

    return this;
};

const NameMixin = function(options) {
    /*
        This Mixin defines fields and methods needed to name something in a Domain,
        Typically this will be either: another Domain; another SmartDict or class; raw content (e.g a PDF or HTML.

    Signed Fields
    urls | tablepublicurls    Where to find the object (or table if its a domain)
    expires: ISODATE         When this name should be considered expired (it might still be resolved, but not if newer names available.
    (there is no validfrom time, this is implicitly when it was signed)
    name: str               Names that this record applies to relative to table its in. e.g.  fred, father

     */
    this.nameConstructor = function() {
        this.expires = this.expires || undefined;    // If Hasn't set
    };
    return this;
};
class Leaf extends SmartDict {
    /*
        The Leaf class is used to register another object in a domain.

        Fields inherited from NameMixin: expires; name;
        urls: Points at object being named (for a SmartDict object its obj._publicurls)
        mimetype:   Mimetype of content esp application/json
        metadata:   Other information about the object needed before or during retrieval.
                    This is a good place to extend, please document any here for now.
                    jsontype: archive.org.dweb   is a way to say its a Dweb object,
                    jsontype: archive.org.metadata is for archive.org metadata
        Fields inherited from SignatureMixin: signatures

     */
    constructor(data, verbose, options) {
        super(data, verbose, options);
        this.nameConstructor();   //
        this.signatureConstructor(); // Initialize Signatures
        this.table = 'leaf';
        this.mimetype = this.mimetype || undefined;  // Mime type of object retrieved
        this.metadata = this.metadata || {};         // Other information about the object needed before or during retrieval
    }
    static async p_new(data, verbose, options) {
        if (data instanceof SmartDict) {
            data = {urls: data._publicurls || data._urls };  // Public if appropriate else _urls
        }
        return new this(data, verbose, options)
    }

    objbrowser_fields(propname) {
        const fieldtypes = { expires: "str", "urls": "urlarray", "name": "str", "signatures": "arrayjsonobj"};
        return fieldtypes[propname] || super.objbrowser_fields(propname);
    }

    async p_printable({indent="  ",indentlevel=0}={}) {
        // Output something that can be displayed for debugging
        return `${indent.repeat(indentlevel)}${this.name} = ${this.urls.join(', ')}${this.expires ? " expires:"+this.expires : ""}\n`
    }
    async p_resolve(path, {verbose=false}={}) {
        let obj;
        try {
            if (["application/json"].includes(this.mimetype) ) {
                let data = Transports.p_rawfetch(this.urls, { verbose, timeoutMS: 5000});
                let datajson = (typeof data === "string" || data instanceof Buffer) ? JSON.parse(data) : data;          // Parse JSON (dont parse if p_fetch has returned object (e.g. from KeyValueTable
                if (this.metadata["jsontype"] === "archive.org.dweb") {
                    let obj = await this._after_fetch(datajson, urls, verbose);   // Interpret as dweb - look at its "table" and possibly decrypt
                    return obj.p_resolve(path, {verbose: false});   // This wont work unless the object implements p_resolve (most dont)
                } else {
                    console.error("Leaf.p_resolve unknown type of JSON", this.mimetype);
                    throw new errors.ResolutionError(`Leaf.p_resolve unable to resolve path: ${path} in ${this.name} because jsontype ${this.metadata["jsontype"]} unrecognized`);
                }
            } else if (["text/html"].includes(this.mimetype) ) {
                return [ this, path];
            } else {
                console.error("Leaf.p_resolve, unknown mimetype", this.mimetype)
                throw new errors.ResolutionError(`Leaf.p_resolve unable to resolve path: ${path} in ${this.name} because mimetype ${this.mimetype} unrecognized`);
            }
        } catch(err) {
            throw new errors.ResolutionError(err.message);
        }
    }

}
NameMixin.call(Leaf.prototype);
SignatureMixin.call(Leaf.prototype, ["urls", "name", "expires"]);
SmartDict.table2class["leaf"] = Leaf;

class Domain extends KeyValueTable {
    /*
    The Domain class is for name resolution across multiple technologies.

    Domains are of the form /arc/somedomain/somepath/somename

    Where signed records at each level lead to the next level

    Fields:
    keys: [NACL VERIFY:xyz*]   Public Key to use to verify entries - identified by type, any of these keys can be used to sign a record

    Fields inherited from NameMixin: name; expires; signatures

    Fields inherited from KeyValueTable
    tablepublicurls: [ str* ]       Where to find the table.
    _map:   KeyValueTable   Mapping of name strings beneath this Domain
    */
    constructor(data, master, key, verbose, options) {
        super(data, master, key, verbose, options); // Initializes _map if not already set
        this.table = "domain"; // Superclasses may override
        this.nameConstructor();  // from the Mixin, initializes signatures
        this.signatureConstructor();
        if (this._master && this.keypair && !(this.keys && this.keys.length)) {
            this.keys = [ this.keypair.signingexport()]
        }
    }
    static async p_new(data, master, key, verbose, seedurls, kids) {
        const obj = await super.p_new(data, master, key, verbose, {keyvaluetable: "domain", seedurls: seedurls}); // Will default to call constructor and p_store if master
        for (let j in kids ) {
            await obj.p_register(j, kids[j]);
        }
        return obj;
    }

    objbrowser_fields(propname) {
        const fieldtypes = { _map: "dictobj", "keys": "arraystr"};
        return fieldtypes[propname] || super.objbrowser_fields(propname);
    }

    sign(subdomain) { // Pair of verify
        subdomain._signSelf(this.keypair);
    }
    verify(name, subdomain) { // Pair of sign
        /* Check the subdomain is valid.
            That is teh case if the subdomain has a cryptographically valid signatures by one of the domain's keys and the name matches the name we have it at.
         */
        // its called when we think we have a resolution.
        //TODO-NAME need to be cleverer about DOS, but at moment dont have failure case if KVT only accepts signed entries from table owner or verifies on retrieval.
        // Throws error if doesnt verify
        return subdomain._verifyOwnSigs().some(key => this.keys.includes(key))                       // Check valid sig by this
            && (name === subdomain.name); // Check name matches
    }

    async p_register(name, registrable, verbose) {
        /*
        Register an object
        name:   What to register it under, relative to "this"
        registrable:    Either a Domain or Leaf, or else something with _publicurls or _urls (i.e. after calling p_store) and it will be wrapped with a Leaf

        Code path is domain.p_register -> domain.p_set
         */
        if (!(registrable instanceof Domain || registrable instanceof Leaf)) {
            // If it isnt a Domain or Leaf then build a name to point at it
            registrable = await Leaf.p_new(registrable, verbose)
        }
        registrable.name =  name;
        this.sign(registrable);
        console.assert(this.verify(name, registrable));   // It better verify !
        await this.p_set(name, registrable, {publicOnly: true, encryptIfAcl: false, verbose: verbose});
    }
    /*
        ------------ Resolution ---------------------
        Strategy: At any point in resolution,
        * start with path - look that up,
        * if fails, remove right hand side and try again,
        * keep reducing till get to something can resolve.
      */

    async p_get(key, verbose) {
        if (Array.isArray(key)) {
            const res = {};
            const self = this;
            await Promise.all(key.map((n) => { res[n] = self.p_get(n, verbose)}));
            return res;
        }
        if (this._map[key])
            return this._map[key]; // If already have a defined result then return it (it will be from this session so reasonable to cache)
        const rr = (await Promise.all(this.tablepublicurls.map(u => Transports.p_get([u], key, verbose).catch((err) => undefined))))
            .map(r => this._mapFromStorage(r))
        // Errors in above will result in an undefined in the res array, which will be filtered out.
        // res is now an array of returned values in same order as tablepublicurls
        //TODO-NAME should verify here before do this test but note Python gateway is still using FAKEFAKEFAKE as a signature
        //
        const indexOfMostRecent = rr.reduce((iBest, r, i, arr) => (r && r.signatures[0].date) > (arr[iBest] || "" && arr[iBest].signatures[0].date) ? i : iBest, 0);
        //TODO-NAME save best results to others.
        const value = rr[indexOfMostRecent];
        this._map[key] = value;
        return value;
    }
    // use p_getall to get all registered names

    static async p_rootSet( {verbose=false}={}){
        //TODO-CONFIG put this (and other TODO-CONFIG into config file)
        const rootpublicurls = [ 'ipfs:/ipfs/zdj7WmmDLq6W3GvWFuPoPSw53dbij2oPRYBTVa7hbRWoNeE5P',
            'contenthash:/contenthash/QmRQUywWx6jxc32FPBNAZT6LdWvqFMwN3cmshSn32Pcwan' ];
        this.root = await SmartDict.p_fetch(rootpublicurls,  {verbose, timeoutMS: 5000});
    }

    static async p_rootResolve(path, {verbose=false}={}) {
        console.group("Resolving:",path);
        if (!this.root)
            await this.p_rootSet({verbose});
        const res = this.root.p_resolve(path, {verbose});
        console.log("Resolved path",path);
        console.groupEnd();
        return res;

    }
    async p_resolve(path, {verbose=false}={}) { // Note merges verbose into options, makes more sense since both are optional
        /*
        Resolves a path, should resolve to the leaf
        resolves to:    [ Leaf, remainder ]
         */

        //TODO check for / at start, if so remove it and get root
        if (verbose) console.log("resolving",path,"in",this.name);
        let res;
        /*
        // Look for path, try longest combination first, then work back to see if can find partial path
        const pathArray = path.split('/');
        const remainder = [];
        while (pathArray.length > 0) {
            const name = pathArray.join('/');
            res = await this.p_get(name, verbose);
            if (res) {
                res = await SmartDict._after_fetch(res, [], verbose);  //Turn into an object
                this.verify(name, res);                                     // Check its valid
                break;
            }
            remainder.unshift(pathArray.pop());                             // Loop around on subset of path
        }
        */
        const remainder = path.split('/');
        const name = remainder.shift();
        res = await this.p_get(name, verbose);
        if (res) {
            res = await SmartDict._after_fetch(res, [], verbose);  //Turn into an object
            this.verify(name, res);                                     // Check its valid
        }
        if (res) { // Found one
            if (!remainder.length) // We found it
                return [ res, undefined ] ;
            return await res.p_resolve(remainder.join('/'), {verbose});           // ===== Note recursion ====
            //TODO need other classes e.g. SD  etc to handle p_resolve as way to get path
        } else {
            console.log("Unable to resolve",name,"in",this.name);
            return [ undefined, path ];
        }
    }

    async p_printable({indent="  ",indentlevel=0, maxindent=9}={}) {
        // Output something that can be displayed for debugging
        return `${indent.repeat(indentlevel)}${this.name} @ ${this.tablepublicurls.join(', ')}${this.expires ? " expires:"+this.expires : ""}\n`
            + ((indentlevel >= maxindent) ? "..." : (await Promise.all((await this.p_keys()).map(k => this._map[k].p_printable({indent, indentlevel: indentlevel + 1, maxindent: maxindent})))).join(''))
    }
    static async p_setupOnce({verbose=false} = {}) {
        //const metadatagateway = 'http://localhost:4244/leaf/archiveid';
        const metadataGateway = 'https://gateway.dweb.me/leaf/archiveid'; //TODO-BOOTSTRAP need to run this against main gateway
        const pass = "Replace this with something secret";
        const kc = await KeyChain.p_new({name: "test_keychain kc"}, {passphrase: pass}, verbose);    //TODO-NAME replace with secret passphrase
        //TODO-NAME add ipfs address and ideally ipns address to archiveOrgDetails record
        //p_new should add registrars at whichever compliant transports are connected (YJS, HTTP)
        Domain.root = await Domain.p_new({_acl: kc, name: ""}, true, {passphrase: pass+"/"}, verbose, [], {   //TODO-NAME will need a secure root key
            arc: await Domain.p_new({_acl: kc},true, {passphrase: pass+"/arc"}, verbose, [], { // /arc domain points at our top level resolver.
                "archive.org": await Domain.p_new({_acl: kc}, true, {passphrase: pass+"/arc/archive.org"}, verbose, [], {
                            "details": await Leaf.p_new({urls: ["https://dweb.me/examples/archive.html"], mimetype: "text/html",
                                metadata: {htmlusesrelativeurls: true, htmlpath: "item"}}, verbose,[], {}),
                            metadata: await Domain.p_new({_acl: kc}, true, {passphrase: pass+"/arc/archive.org/metadata"}, verbose, [metadataGateway], {}),
                            "search.php": await Leaf.p_new({urls: ["https://dweb.me/examples/archive.html"], mimetype: "text/html",
                                metadata: {htmlusesrelativeurls: true, htmlpath: "path"}}, verbose,[], {})
                            //Note I was seeing a lock error here, but cant repeat now - commenting out one of these last two lines seemed to clear it.
                })
            })
        }); //root
        const testing = Domain.root.tablepublicurls.map(u => u.includes("localhost")).includes(true);
        console.log("Domain.root publicurls for",testing ? "testing:" : "inclusion in bootloader.html:",Domain.root._publicurls);
        const metadatatableurl = Domain.root._map["arc"]._map["archive.org"]._map["metadata"].tablepublicurls.find(u=>u.includes("getall/table"))
        if (!testing) {
            console.log("Put this in gateway config.py config.domains.metadata:", metadatatableurl);
        }
        if (verbose) console.log(await this.root.p_printable());
    }

    static async p_resolveNames(name, {verbose=false}={}) {
        /* Turn an array of urls into another array, resolving any names if possible and leaving other URLs untouched
        /* Try and resolve a name,
        name:   One, or an array of Names of the form dweb:/ especially dweb:/arc/archive.org/foo
        resolves to:    [ url ]  Array of urls which will be empty if not resolved (which is quite likely if relative name not defined)
        */
        if (Array.isArray(name)) {
            // Note can't use "this" in here, as since its passed as a callback to Transports, "this" is Transports
            return [].concat(...await Promise.all(name.map(u => u.startsWith("dweb:/arc") ? Domain.p_resolveNames(u, {verbose}) : [u])))
        } else {
            name = name.replace("dweb:/", ""); // Strip leading dweb:/ before resolving in root
            const res = await Domain.p_rootResolve(name, {verbose});     // [ Leaf object, remainder ] //TODO-NAME see comments in p_rootResolve about FAKEFAKEFAKE
            if (!(res[0] && (res[0].name === name.split('/').splice(-1)[0]) && !res[1])) {
                return undefined
            }
            return res[0].urls;
        }
    }

    static async p_test(verbose) {
        if (verbose) console.log("KeyValueTable testing starting");
        try {
            const pass = "Testing pass phrase";
            //Register the toplevel domain
            // Set mnemonic to value that generates seed "01234567890123456789012345678901"
            const mnemonic = "coral maze mimic half fat breeze thought champion couple muscle snack heavy gloom orchard tooth alert cram often ask hockey inform broken school cotton"; // 32 byte
            const kc = await KeyChain.p_new({name: "test_keychain kc"}, {mnemonic: mnemonic}, verbose);    //Note in KEYCHAIN 4 we recreate exactly same way.
            Domain.root = await Domain.p_new({
                name: "",   // Root is "" so that [name,name].join('/' is consistent for next level.
                keys: [],
                signatures: [],    // TODO-NAME Root record itself needs signing - but by who (maybe /arc etc)
                expires: undefined,
                _acl: kc,
                _map: undefined,   // May need to define this as an empty KVT
            }, true, {passphrase: pass+"/"}, verbose);   //TODO-NAME will need a secure root key
            //Now register a subdomain
            const testingtoplevel = await Domain.p_new({_acl: kc}, true, {passphrase: pass+"/testingtoplevel"});
            await Domain.root.p_register("testingtoplevel", testingtoplevel, verbose);
            const adomain = await Domain.p_new({_acl: kc}, true, {passphrase: pass+"/testingtoplevel/adomain"});
            await testingtoplevel.p_register("adomain", adomain, verbose);
            const item1 = await new SmartDict({"name": "My name", "birthdate": "2001-01-01"}).p_store();
            await adomain.p_register("item1", item1, verbose);
            // Now try resolving on a client - i.e. without the Domain.root privte keys
            const ClientDomainRoot = await SmartDict.p_fetch(Domain.root._publicurls, verbose);
            let res= await ClientDomainRoot.p_resolve('testingtoplevel/adomain/item1', {verbose});
            if (verbose) console.log("Resolved to",await res[0].p_printable({maxindent:2}),res[1]);
            console.assert(res[0].urls[0] === item1._urls[0]);
            // Now some failure cases / errors
            if (verbose) console.log("-Expect unable to completely resolve");
            res= await Domain.root.p_resolve('testingtoplevel/adomain/itemxx', {verbose});
            console.assert(typeof res[0] === "undefined");
            if (verbose) console.log("-Expect unable to completely resolve");
            res= await Domain.root.p_resolve('testingtoplevel/adomainxx/item1', {verbose});
            console.assert(typeof res[0] === "undefined");
            if (verbose) console.log("-Expect unable to completely resolve");
            res= await Domain.root.p_resolve('testingtoplevelxx/adomain/item1', {verbose});
            console.assert(typeof res[0] === "undefined");
            if (verbose) console.log("Structure of registrations");
            if (verbose) console.log(await Domain.root.p_printable());
            // Commented out as should run under setup.js with correct transports
            // await this.p_setupOnce(verbose);

            /* Dont expect this to quite work now not doing setupOnce in above test
            verbose=true;
            if (verbose) console.log("Next line should attempt to find in metadata table *YJS or HTTP) then try leaf/archiveid?key=commute");
            let itemid = "commute";
            let name = `arc/archive.org/metadata/${itemid}`;
            res = await Domain.root.p_resolve(name, {verbose});
            //TODO-NAME note p_resolve is faking signature verification on FAKEFAKEFAKE - will also need to error check that which currently causes exception
            console.assert(res[0].name === "/"+name);
            if (verbose) console.log("Resolved",name,"to",await res[0].p_printable({maxindent:2}), res[1]);
            let metadata = await Transports.p_rawfetch(res[0].urls); // Using Block as its multiurl and might not be HTTP urls
            if (verbose) console.log("Retrieved metadata",JSON.stringify(metadata));
            console.log("---Expect failure to resolve 'arc/archive.org/details/commute'");
            console.assert(metadata.metadata.identifier === itemid);
            //TODO-NAME dont think next will work.
            try { //TODO-NAME will need to figure out what want this to do
                res = await Domain.root.p_resolve("arc/archive.org/details/commute", {verbose});
                console.log("resolved to",await res[0].p_printable({maxindent:2}), res[1] ? `Remainder=${res[1]}`: "");
            } catch(err) {
                console.log("Got error",err);
            }
            console.log('------');
            */

        } catch (err) {
            console.log("Caught exception in Domain.test", err);
            throw(err)
        }
    }
    static async p_test_gateway(opts={}, verbose=false) {
        // Has to be tested against the gateway, not localhost
        if (verbose) {console.log("Domain.p_test_gateway")}
        try {
            Domain.root = undefined; // Clear out test root
            if (verbose) console.log("NAMES connected");
            let res = await this.p_resolveNames(["dweb:/arc/archive.org/metadata/commute"], {verbose});
            console.assert(res.includes("https://gateway.dweb.me/metadata/archiveid/commute"))
        } catch(err) {
            console.log("Exception thrown in Domain.p_test_gateway:", err.message);
            throw err;
        }
    }


}
NameMixin.call(Domain.prototype);   // Add in the Mixin
SignatureMixin.call(Domain.prototype, ["tablepublicurls", "name", "keys", "expires"]);

Domain.clsLeaf = Leaf;  // Just So exports can find it and load into Dweb TODO move to own file
SmartDict.table2class["domain"] = Domain;
Transports.resolveNamesWith(Domain.p_resolveNames)
exports = module.exports = Domain;
