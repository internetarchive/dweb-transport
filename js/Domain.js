const KeyValueTable = require("./KeyValueTable"); //for extends
const Dweb = require("./Dweb");



class Domain extends KeyValueTable {
    /*
    The Name class is for name resolution across multiple technologies.

    Names are of the form Name:/arc/somedomain/somepath/somename

    Where signed records at each level lead to the next level

    Some fields would

    Fields:
    fullnames: [ str* ]         Names that this record applies to. e.g.  company/people/fred  family/smith/father. Mostly useful to go UP the path.
    keys: [NACL VERIFY:xyz*]   Public Key to use to verify entries - identified by type, any of these keys can be used to sign a record
    signatures: [ {signedby; signedon: signature:}* ] TODO-NAME check fields - this ia a Signature record when loaded
    _publicurls: [ str* ]          Where to find the table.
    expires: ISODATE         When this name should be considered expired (it might still be resolved, but not if newer names available.
    (there is no validfrom time, this is implicitly when it was signed)

    Fields inherited from KeyValueTable
    _map:   KeyValueTable   Mapping of name strings beneath this Name
    */
    constructor(data, master, key, verbose, options) {
        super(data, master, key, verbose, options); // Initializes _map if not already set
        this.table = "domain"; // Superclasses may override
        this.signatures = this.signatures || [];  // Empty list rather than undefined
    }
    static async p_new(data, master, key, verbose, options) {
        let obj = await super.p_new(data, master, key, verbose, {keyvaluetable: "default"}); // Will default to call constructor
        if (obj._master && obj.keypair && !(obj.keys && obj.keys.length)) {
            obj.keys = [ obj.keypair.signingexport()]
        }
        //TODO-NAME what comes here
        return obj;
    }
    _signable(domains, name, date) {
        // Get a signable version of this domain
       let res = JSON.stringify({date: date, domains:domains, name: name, keys: this.keys, _publicurls: this._publicurls, expires: this.expires});
       console.log("XXX@_signable",res);
       return res;
    }
    sign(name, subdomain) { // Pair of verify
        let date = new Date(Date.now());
        let signable = subdomain._signable(this.fullnames, name, date);
        let signature = this.keypair.sign(signable);
        subdomain.signatures.push({date, signature, signedby: this.keypair.signingexport()})
    }
    verify(name, subdomain) { // Pair of sign
        // Note this verification will fail if this.fullnames has changed, it should work on master or public copy of domain.
        // Throws error if doesnt verify
        return subdomain.signatures
            .filter(sig => this.keys.includes(sig.signedby))
            .some(sig => (new Dweb.KeyPair({key: sig.signedby}).verify(subdomain._signable(this.fullnames, name, sig.date), sig.signature)));
    }
    register(name, subdomain) {
        this.sign(name, subdomain);
        console.assert(this.verify(name, subdomain));   // It better verify !
        this.set(name, subdomain);
    }
    static async p_test(verbose) {
        if (verbose) console.log("KeyValueTable testing starting");
        try {

            Domain.root = await Domain.p_new({
                fullnames: ["/"],
                keys: [],
                signatures: [],    // TODO-NAME Root record itself needs signing - but by who (maybe /arc etc)
                expires: undefined,
                _map: undefined,   // May need to define this as an empty KVT
            }, true, {passphrase: "This is the seed of the root key for testing purposes"}, verbose);   //TODO-NAME will need a secure root key
            //console.log("XXX@39", Domain.root);
            let testingtoplevel = await Domain.p_new({           // this would be "arc"
                    fullnames: [ "/testingtoplevel"],
                }, true, {passphrase: "This is the seed of testingtoplevel"}); //TODO-NAME do we need a keypair for this obj - note YJS uses this for its "database"
            Domain.root.register("testingtoplevel", testingtoplevel, verbose);
            console.log("XXX@54", Domain.root);
        } catch (err) {
            console.log("Caught exception in Domain.test", err);
            throw(err)
        }
    }


}
exports = module.exports = Domain;



/*
Only in Domain private version
privateurls [ url, url ]    Urls to use when storing info. Not stored in public version, so where would they be stored ?
*/