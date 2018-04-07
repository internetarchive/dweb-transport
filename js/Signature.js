const errors = require('./Errors');
const SmartDict = require("./SmartDict");
const KeyPair = require('./KeyPair'); // Encapsulate public/private key pairs and crypto libraries

class Signature extends SmartDict {
    /*
    The Signature class holds a signed entry that can be added to a CommonList.
    The url of the signed object is stored with the signature in CommonList.p_add()

    Fields:
    date:       Date stamp (according to browser) when item signed
    urls:       URLs of object signed - note this is intentionally "urls" not "_urls" since its a stored field.
    signature:  Signature of the date and url
    signedby:   Public URLs of list signing this (list should have a public key)
    Inherits from SmartDict: _acl, _urls, _data
     */
    constructor(dic, verbose) {
        /*
        Create a new instance of Signature

        :param data: data to initialize - see Fields above
         */
        super(dic, verbose);
        //TODO-DATE turn s.date into javascript date
        //if isinstance(s.date, basestring):
        //    s.date = dateutil.parser.parse(s.date)
        this.table = "sig";
    }

    __setattr__(name, value) {
        if (name === "date" && typeof value === 'string') {
            value = new Date(value);    // Convert from presumably ISOString (note JSON.stringify does an ISOString in Javascript)
        }
        super.__setattr__(name, value);
    }

    preflight(dd) { // Called on outgoing dictionary of outgoing data prior to sending - note order of subclassing can be significant
        delete dd.data; // Dont store any saved data
        dd.date = dd.date.toISOString();
        return super.preflight(dd);  // Edits dd in place
    }

    signable() {
        /*
        Returns a string suitable for signing and dating, current implementation includes date and storage url of data.
        The string makeup is fairly arbitrary its a one way check, the parts are never pulled apart again

        :return: Signable or comparable string
        */
        return this.date.toISOString() + " "+this.urls;
    }

    static async p_sign(commonlist, urls, verbose) {
        /*
        Sign and date an array of urls, returning a new Signature

        :param commonlist: Subclass of CommonList containing a private key to sign with.
        :param urls: of item being signed
        :return: Signature (dated with current time on browser)
         */
        let date = new Date(Date.now());
        if (!commonlist.stored()) {
            await commonlist.p_store(verbose);
        }
        let sig = new Signature({"date": date, "urls": urls, "signedby": commonlist._publicurls});
        sig.signature = commonlist.keypair.sign(sig.signable());
        //console.assert(sig.verify(commonlist, verbose)) //uncomment for testing
        return sig
    }

    verify(commonlist, verbose) {
        return commonlist.verify(this, verbose);
    }

    static filterduplicates(arr) {
        /*
        Utility function to allow filtering out of duplicates

        :param arr: Array of Signature
        :returns: Array of Signature containing only the first occurring instance of a signature (note first in array, not necessarily first by date)
         */
        let res = {};
        // Remove duplicate signatures
        return arr.filter((x) => (!res[x.urls] && (res[x.urls] = true)))
    }

    async p_fetchdata({verbose=false, ignoreerrors=false} = {}) {
        /*
        Fetch the data related to a Signature, store on .data

        ignoreerrors: Passed if should ignore any failures, especially failures to decrypt
        :resolves to: obj - object that was signed
        :raises:  AuthenticationError if can't decrypt

         */
        if (!this.data) {   // Fetch data if have not already fetched it
            try {
                this.data = await SmartDict.p_fetch(this.urls, verbose); // Resolves to new obj AuthenticationError if can't decrypt
            } catch(err) {
                if (ignoreerrors) {
                    console.error("Ignoring in Signature.p_fetchdata: ", err.message);
                    return undefined;
                } else {
                    throw err;
                }
            }
        }
        return this.data;
    }

    objbrowser_fields(propname) {
        let fieldtypes = { date: "str", urls: "urlarray", signature: "str", signedby: "urlarray"};
        return fieldtypes[propname] || super.objbrowser_fields(propname);
    }

}
exports = module.exports = Signature;
