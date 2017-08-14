const SmartDict = require("./SmartDict");
const Dweb = require("./Dweb");

class Signature extends SmartDict {
    /*
    The Signature class holds a signed entry that can be added to a CommonList.
    Not the signature does NOT include the hash of the object being signed, typically its stored as a list of _signatures on that object.
    The hash of the signed object is stored with the signature in CommonList.p_add()

    Fields:
    date:       Date stamp (according to browser) when item signed
    signature:  Signature of the date and hash
    signedby:   Public key of signer
     */
    constructor(hash, dic, verbose) {
        /*
        Create a new instance of Signature

        :param hash: Hash to read from - usually this is null
        :param data: data to initialize - see Fields above
         */
        super(hash, dic, verbose);
        //console.log("Signature created",this.hash);
        //TODO-DATE turn s.date into java date
        //if isinstance(s.date, basestring):
        //    s.date = dateutil.parser.parse(s.date)
        this.table = "sig";
    }

    static sign(commonlist, hash, verbose) {
        /*
        Sign and date a hash.

        :param commonlist: Subclass of CommonList containing a private key to sign with.
        :param hash: of item being signed
        :return: Signature (dated with current time on browser)
         */
        let date = new Date(Date.now());  //TODO-DATE
        let signature = commonlist.keypair.sign(date, hash);
        if (!commonlist._publichash) commonlist.p_store(verbose); // Sets _publichash sync, while storing async
        console.assert(commonlist._publichash, "Signature.sign should be a publichash by here");
        return new Signature(null, {"date": date, "signature": signature, "signedby": commonlist._publichash})
    }

    verify() { console.assert(false, "XXX Undefined function Signature.verify, available in CommonList and KeyPair"); }

    static filterduplicates(arr) {
        /*
        Utility function to allow filtering out of duplciates

        :param arr: Array of Signature
        :returns: Array of Signature containing on the first occuring instance of a signature (note first in array, not necessarily first by date)
         */
        let res = {};
        // Remove duplicate signatures
        return arr.filter((x) => (!res[x.hash] && (res[x.hash] = true)))
    }

}
exports = module.exports = Signature;
