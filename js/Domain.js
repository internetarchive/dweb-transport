const KeyValueTable = require("./KeyValueTable"); //for extends
const SmartDict = require("./SmartDict"); //for extends
const Dweb = require("./Dweb");
//TODO-DOMAIN when "register" maybe store publicurl sa the registration, then check can fetch via p_fetch from that.

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
        return JSON.stringify({"date": date, signed: Dweb.utils.keyFilter(this, this.__proto__.fieldlist)}); //TODO-SIGMIXIN might be this.__proto__.fieldlist
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
        return this.signatures
            .filter(sig => (new Dweb.KeyPair({key: sig.signedby}).verify(this._signable(sig.date), sig.signature)))
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
    fullname: str           Names that this record applies to. e.g.  company/people/fred  family/smith/father. Mostly useful to go UP the path.

     */
    this.nameConstructor = function() {
        this.expires = this.expires || undefined;    // If Hasn't set
    };
    return this;
};
class Name extends SmartDict {
    /*
        The Name class is used to register another object in a domain.

        Fields inherited from NameMixin: expires; fullname; urls
        Fields inherited from SignatureMixin: signatures

     */
    constructor(data, verbose, options) {
        super(data, verbose, options);
        this.nameConstructor();   //
        this.signatureConstructor(); // Initialize Signatures
        this.table = 'name';

    }
    static async p_new(data, verbose, options) {
        console.assert(false);
    }
    objbrowser_fields(propname) {
        let fieldtypes = { expires: "str", "urls": "urlarray", "fullname": "str", "signatures": "arrayjsonobj"}
        return fieldtypes[propname] || super.objbrowser_fields(propname);
    }

    async p_printable({indent="  ",indentlevel=0}={}) {
        // Output something that can be displayed for debugging
        return `${indent.repeat(indentlevel)}${this.fullname} = ${this.urls.join(', ')}${this.expires ? " expires:"+this.expires : ""}\n`
    }


}
NameMixin.call(Name.prototype);
SignatureMixin.call(Name.prototype, ["urls", "fullname", "expires"]);
//TODO-SIGMIXIN

class Domain extends KeyValueTable {
    /*
    The Domain class is for name resolution across multiple technologies.

    Domains are of the form Name:/arc/somedomain/somepath/somename

    Where signed records at each level lead to the next level

    Fields:
    keys: [NACL VERIFY:xyz*]   Public Key to use to verify entries - identified by type, any of these keys can be used to sign a record

    Fields inherited from NameMixin: fullname; expires; signatures

    Fields inherited from KeyValueTable
    tablepublicurls: [ str* ]       Where to find the table.
    _map:   KeyValueTable   Mapping of name strings beneath this Domain
    */
    constructor(data, master, key, verbose, options) {
        super(data, master, key, verbose, options); // Initializes _map if not already set
        this.table = "domain"; // Superclasses may override
        this.nameConstructor();  // from the Mixin, initializes signatures
        this.signatureConstructor();
    }
    static async p_new(data, master, key, verbose, options) {
        let obj = await super.p_new(data, master, key, verbose, {keyvaluetable: "domains"}); // Will default to call constructor
        if (obj._master && obj.keypair && !(obj.keys && obj.keys.length)) {
            obj.keys = [ obj.keypair.signingexport()]
        }
        return obj;
    }

    objbrowser_fields(propname) {
        let fieldtypes = { _map: "dictobj", "keys": "arraystr"};
        return fieldtypes[propname] || super.objbrowser_fields(propname);
    }

    sign(subdomain) { // Pair of verify TODO-SIGMIXIN move to sigmixin
        subdomain._signSelf(this.keypair);
    }
    verify(name, subdomain) { // Pair of sign TODO-SIGMIXIN move to sigmixin
        /* Check the subdomain is valid.
            That is teh case if the subdomain has a cryptographically valid signatures by one of the domain's keys and the fullname matches the name we have it at.
         */
        console.log("XXX@95 verify",name,subdomain.fullname);
        // its called when we think we have a resolution.
        //TODO-DOMAIN need to be cleverer about DOS, but at moment dont have failure case if KVT only accepts signed entries from table owner or verifies on retrieval.
        // Throws error if doesnt verify
        return subdomain._verifyOwnSigs().some(key => this.keys.includes(key)) && ([this.fullname === "/" ? "" : this.fullname,name].join('/') === subdomain.fullname)
    }

    async p_register(name, registrable, verbose) {
        /*
        Register an object
        name:   What to register it under, relative to "this"
        registrable:    Either a Domain or Name, or else something with _publicurls or _urls (i.e. after calling p_store) and it will be wrapped with a Name

        Code path is domain.p_register -> domain.p_set
         */
        if (!(registrable instanceof Domain || registrable instanceof Name)) {
            // If it isnt a Domain or Name then build a name to point at it
            registrable = new Name({fullname: [this.fullname, name].join("/"), urls: registrable._publicurls || registrable._urls}, verbose)
        }
        this.sign(registrable);
        console.assert(this.verify(name, registrable));   // It better verify !
        await this.p_set(name, registrable);
    }
    /*
        ------------ Resolution ---------------------
        Strategy: At any point in resolution,
        * start with path - look that up,
        * if fails, remove right hand side and try again,
        * keep reducing till get to something can resolve.
      */

    async p_resolve(path, {verbose=false}={}) { // Note merges verbose into options, makes more sense since both are optional
        //TODO check for / at start, if so remove it and get root
        if (verbose) console.log("resolving",path,"in",this.fullname);
        const pathArray = path.split('/');
        const remainder = [];
        let res;
        // Look for path, try longest combination first, then work back to see if can find partial path
        while (pathArray.length > 0) {
            const name = pathArray.join('/');
            res = await this.p_get(name, verbose);
            if (res) {
                res = await Dweb.SmartDict._after_fetch(res, [], verbose);  //Turn into an object
                this.verify(name, res); //TODO-SIGMIXIN move to sigmixin
                break;
            }
            remainder.unshift(pathArray.pop())
        }
        if (res) { // Found one
            if (!remainder.length) // We found it
                return res;
            return res.p_resolve(remainder.join('/'), {verbose});           // ===== Note recursion ====
            //TODO need other classes e.g. SD  etc to handle p_resolve as way to get path
        } else {
            console.log("Unable to completely resolve",path,"in",this.fullname);
            return undefined;
        }
    }

    async p_printable({indent="  ",indentlevel=0}={}) {
        // Output something that can be displayed for debugging
        return `${indent.repeat(indentlevel)}${this.fullname} @ ${this.tablepublicurls.join(', ')}${this.expires ? " expires:"+this.expires : ""}\n`
            + (await Promise.all((await this.p_keys()).map(k => this._map[k].p_printable({indent, indentlevel: indentlevel + 1})))).join('')
    }

    static async p_test(verbose) {
        if (verbose) console.log("KeyValueTable testing starting");
        try {
            const pass = "Testing pass phrase";
            //Register the toplevel domain
            Domain.root = await Domain.p_new({
                fullname: "/",
                keys: [],
                signatures: [],    // TODO-NAME Root record itself needs signing - but by who (maybe /arc etc)
                expires: undefined,
                _allowunsafestore: true,    //TODO-NAME - undo this and add encryption of private data
                _map: undefined,   // May need to define this as an empty KVT
            }, true, {passphrase: pass+"/"}, verbose);   //TODO-NAME will need a secure root key
            //console.log("XXX@39", Domain.root);
            //Now register a subdomain
            const testingtoplevel = await Domain.p_new({           // this would be "arc"
                fullname: "/testingtoplevel",
                _allowunsafestore: true,    //TODO-NAME - undo this and add encryption of private data
            }, true, {passphrase: pass+"/testingtoplevel"});
            await Domain.root.p_register("testingtoplevel", testingtoplevel, verbose);
            const adomain = await Domain.p_new({           // this would be "arc"
                fullname: "/testingtoplevel/adomain",   //TODO set this field at registration
                _allowunsafestore: true,    //TODO-NAME - undo this and add encryption of private data
            }, true, {passphrase: pass+"/testingtoplevel/adomain"});
            await testingtoplevel.p_register("adomain", adomain, verbose);
            const item1 = await new Dweb.SmartDict({"name": "My name", "birthdate": "2001-01-01"}).p_store();
            await adomain.p_register("item1", item1, verbose);
            // Now try resolving on a client - i.e. without the Domain.root privte keys
            const ClientDomainRoot = await Dweb.SmartDict.p_fetch(Domain.root._publicurls, verbose);
            let res= await ClientDomainRoot.p_resolve('testingtoplevel/adomain/item1', {verbose});
            if (verbose) console.log("Resolved to",res);
            console.assert(res.urls[0] === item1._urls[0]);
            // Now some failure cases / errors
            if (verbose) console.log("-Expect unable to completely resolve");
            res= await Domain.root.p_resolve('testingtoplevel/adomain/itemxx', {verbose});
            console.assert(typeof res === "undefined");
            if (verbose) console.log("-Expect unable to completely resolve");
            res= await Domain.root.p_resolve('testingtoplevel/adomainxx/item1', {verbose});
            console.assert(typeof res === "undefined");
            if (verbose) console.log("-Expect unable to completely resolve");
            res= await Domain.root.p_resolve('testingtoplevelxx/adomain/item1', {verbose});
            console.assert(typeof res === "undefined");
            if (verbose) console.log("Structure of registrations");
            if (verbose) console.log(await Domain.root.p_printable());
            //TODO-NAME build some failure cases (bad key, (done unregistered item))
            //TODO-NAME add http resolver for items to gateway and test case here
            //TODO-NAME try resolving on other machine
        } catch (err) {
            console.log("Caught exception in Domain.test", err);
            throw(err)
        }
    }


}
NameMixin.call(Domain.prototype);   // Add in the Mixin
SignatureMixin.call(Domain.prototype, ["tablepublicurls", "fullname", "keys", "expires"]);

//TODO-SIGMIXIN include here
Domain.clsName = Name;  // Just So exports can find it and load into Dweb TODO move to own file

exports = module.exports = Domain;



/*
Only in Domain private version
privateurls [ url, url ]    Urls to use when storing info. Not stored in public version, so where would they be stored ?
*/