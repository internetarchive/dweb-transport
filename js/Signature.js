const SmartDict = require("./SmartDict");
const Dweb = require("./Dweb");

class Signature extends SmartDict {
    /*
    The Signature class holds a signed entry that can be added to a CommonList.
    The url of the signed object is stored with the signature in CommonList.p_add()

    Fields:
    date:       Date stamp (according to browser) when item signed
    url:       URL of object signed
    signature:  Signature of the date and url
    signedby:   Public URL of list signing this (list should have a public key)
     */
    constructor(dic, verbose) {
        /*
        Create a new instance of Signature

        :param data: data to initialize - see Fields above
         */
        super(dic, verbose);
        //TODO-DATE turn s.date into java date
        //if isinstance(s.date, basestring):
        //    s.date = dateutil.parser.parse(s.date)
        this.table = "sig"; //TODO- consider passing as options to super, need to do across all classes
    }

    static sign(commonlist, url, verbose) {
        /*
        Sign and date a url.

        :param commonlist: Subclass of CommonList containing a private key to sign with.
        :param url: of item being signed
        :return: Signature (dated with current time on browser)
         */
        let date = new Date(Date.now());  //TODO-DATE
        let signature = commonlist.keypair.sign(date, url);
        if (!commonlist._publicurl) commonlist.p_store(verbose); // Sets _publicurl sync, while storing async
        console.assert(commonlist._publicurl, "Signature.sign should be a publicurl by here");
        return new Signature({"date": date, "url": url, "signature": signature, "signedby": commonlist._publicurl})
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
        return arr.filter((x) => (!res[x.url] && (res[x.url] = true)))
    }

    p_fetchdata(verbose) {
        let self = this;
        if (!this.data) {
            return Dweb.SmartDict.p_fetch(this.url, verbose)
                .then((obj) => self.data = obj); // Reslves to new obj
        } else { // Return data if we've aleady fetched it
            return new Promise((resolve, reject) => resolve(self.data));
        }
    }

}
exports = module.exports = Signature;
