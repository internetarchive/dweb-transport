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

    __setattr__(name, value) {
        if (name === "date" && typeof value === 'string') {
            value = new Date(value);    // Convert from presumably ISOString (note JSON.stringify does an ISOString in Javascript)
        }
        super.__setattr__(name, value);
    }

    signable() {
        /*
        Returns a string suitable for signing and dating, current implementation includes date and storage url of data.

        :return: Signable or comparable string
        */
        return this.date.toISOString() + this.url;
    }

    static sign(commonlist, url, verbose) {
        /*
        Sign and date a url, returning a new Signature

        :param commonlist: Subclass of CommonList containing a private key to sign with.
        :param url: of item being signed
        :return: Signature (dated with current time on browser)
         */
        let date = new Date(Date.now());
        if (!commonlist._publicurl) commonlist.p_store(verbose); // Sets _publicurl sync, while storing async
        console.assert(commonlist._publicurl, "Signature.sign should be a publicurl by here");
        let sig = new Signature({"date": date, "url": url, "signedby": commonlist._publicurl})
        sig.signature = commonlist.keypair.sign(sig.signable());
        return sig
    }

    verify(commonlist, verbose) {
        return commonlist.verify(this, verbose);
    }

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
        /*
        Fetch the data related to a Signature, store on .data

        :resolves to: obj - object that was signed
         */
        let self = this;
        if (!this.data) {
            return Dweb.SmartDict.p_fetch(this.url, verbose)
                .then((obj) => self.data = obj); // Reslves to new obj
        } else { // Return data if we've aleady fetched it
            return new Promise((resolve, reject) => resolve(self.data));
        }
    }

    static p_test(verbose) {
        // Test Signatures
        //verbose=True
        let mydic = { "a": "AAA", "1":100, "B_date": Date.now()}  // Dic can't contain integer field names
        let signedblock = new Dweb.SmartDict(mydic, verbose);
        let keypair = new Dweb.KeyPair({"key":{"keygen":true}}, verbose);
        // This test should really fail, BUT since keypair has private it passes signature
        // commonlist0 = CommonList(keypair=keypair, master=False)
        // print commonlist0
        // signedblock.sign(commonlist0, verbose) # This should fail, but
        if (verbose) console.log("test_Signatures CommonList");
        let commonlist = new Dweb.CommonList({name: "test_Signatures.commonlist" }, true, keypair, verbose); //data,master,key,verbose
        commonlist.table = "BOGUS";
        if (verbose) console.log("test_Signatures sign");
        commonlist._allowunsafestore = true;
        let sig;
        return signedblock.p_store(verbose)
            .then(()=> {
            sig = Dweb.Signature.sign(commonlist,signedblock._url, verbose); //commonlist, url, verbose
            commonlist._allowunsafestore = false
            if (verbose) console.log("test_Signatures verification");
            console.assert(commonlist.verify(sig, verbose),"Should verify");
            })
    }

}
exports = module.exports = Signature;
