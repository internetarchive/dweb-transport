const errors = require('./Errors');
const CommonList = require("./CommonList");  // Superclass
const KeyPair = require('./KeyPair'); // Encapsulate public/private key pairs and crypto libraries
const utils = require('./utils'); // Utility functions
const SmartDict = require('./SmartDict'); // General handling of JSON structures
const EventListenerHandler = require("./EventListenerHandler"); // Allow sending and listening for events on this class

function delay(ms, val) { return new Promise(resolve => {setTimeout(() => { resolve(val); },ms)})}

class KeyChain extends CommonList {
    /*
    KeyChain extends CommonList to store a users keys, MutableBlocks and AccessControlLists

    Fields:
    _keys:  Array of keys (the signed objects on the list)
     */

    constructor(data, master, key, verbose) {
        /*
        Create a new KeyChain, for parameters see CommonList
         */
        super(data, master, key, verbose);
        if (!this._keys) this._keys = []; // Could be overridden by data in super
        this.table = "kc";
    }

    static async p_new(data, key, verbose) {
        /*
        Create a new KeyChain object based on a new or existing key.
        Store and add to this.keychains, list any elements already on the KeyChain (relevant for existing keys)
        data, key:  See CommonList for parameters
        resolves to:    KeyChain created
         */
        let kc = await super.p_new(data, true, key, verbose); // Calls CommonList.p_new -> new KC() -> new CL() and then sets listurls and listpublicurls
        try {
            await kc.p_store(verbose);
        } catch (err) { // Should be a Transport Error
            throw new errors.AuthenticationError("Unable to login as transport failed")
        }
        // The order here is important - kc has to be on keychains to decrypt the elements, and eventhandler has to be
        // after elements are loaded so cant be inside addkeychains()
        KeyChain.addkeychains(kc);  // Could trigger events - which would then be incomplete, but some of the items retrievd for the list in p_list_then_elements() might need this to be on keychains in order to self-decrypt.
        await kc.p_list_then_elements({verbose, ignoreerrors: true});
        this.eventHandler.callEventListeners({type: "login", values: kc})
        return kc;
    }

    keytype() {
        return KeyPair.KEYTYPESIGNANDENCRYPT;
    }  // Inform keygen

    async p_list_then_elements({verbose=false, ignoreerrors=false}={}) {
        /*
        Subclasses CommonList to store elements in a _keys array.

        resolves to:    Array of KeyPair
        throws: AuthenticationError if cant decrypt keys
         */
        try {
            this._keys = await super.p_list_then_elements({verbose, ignoreerrors});
            if (verbose) console.log("KC.p_list_then_elements Got keys", ...utils.consolearr(this._keys))
            return this._keys;
        } catch (err) {
            console.log("KeyChains.p_list_then_elements: Unable to retrieve keys", err.message);
            throw(err);
        }
    }

    encrypt(data, b64) {
        /*
         Encrypt an object (usually represented by the json string). Pair of .decrypt()

         :param res: The material to encrypt, usually JSON but could probably also be opaque bytes
         :param b64: true if result wanted in urlsafebase64 (usually)
         :return:    Data encrypted by Public Key of this KeyChain.
         */
        return this.keypair.encrypt(data, b64, this);  // data, b64, signer
    }

    decrypt(data, verbose) {
        /*
         Decrypt data with this KeyChain - pair of .encrypt()
         Chain is SD.p_fetch > SD.p_decryptdata > ACL|KC.decrypt, then SD.setdata

         :param data: String from json, b64 encoded
         :return: decrypted text as string
         :throws: :throws: EnryptionError if no encrypt.privateKey, CodingError if !data
         */
        if (!this.keypair._key.encrypt)
            throw new errors.EncryptionError("No decryption key in" + JSON.stringify(this.keypair._key));
        return this.keypair.decrypt(data, this, "text"); //data, signer, outputformat - Throws EnryptionError if no encrypt.privateKey, CodingError if !data
    }

    accesskey() {
        throw new errors.CodingError("KeyChain doesnt have an accesskey");
    }

    p_store(verbose) {
        /*
        Unlike other p_store this ONLY stores the public version, and sets the _publicurls, on the assumption that the private key of a KeyChain should never be stored.
        Private/master version should never be stored since the KeyChain is itself the encryption root.
        */
        this.dontstoremaster = true;    // Make sure p_store only stores public version
        return super.p_store(verbose);  // Stores public version and sets _publicurls
    }

    // ====  Stuff to do with managing this.keychains - this could be a separate class at some point ======
    static addkeychains(keychain) {
        /*
        Add keys I can use for viewing to this.keychains where it will be iterated over during decryption.

        :param keychains:   keychain or Array of keychains
        */
        if (keychain instanceof Array) {
            keychain.map((kc) => this.addkeychains(kc));
        } else {
            this.keychains.push(keychain);
        }
    }

    static logout() {
        /*
        Logout user - which means removing from this.keychains
         */
        this.keychains = []
    }

    static default() {
        return this.keychains.length ? this.keychains[this.keychains.length - 1] : undefined;
    }

    static keychains_find(dict, verbose) {
        /*
        Locate a needed KeyChain on this.keychains by some filter.

        :param dict:    dictionary to check against the keychain (see CommonList.match() for interpretation
        :return:        AccessControlList or KeyChain or null
        */
        return this.keychains.find((kc) => kc.match(dict))  // Returns undefined if none match or keychains is empty, else first match
    }

    static mykeys(clstarget) {
        /*
        Utility function to find any keys in any of this.keychains for the target class.

        clstarget:  Class to search this.keychains for, KeyPair, or something with a KeyPair e.g. subclass of CommonList(ACL, MB)
        returns:    (possibly empty) array of KeyPair or CommonList
         */
        //this.keychains is an array of arrays so have to flatten the result.
        return [].concat(...this.keychains.map(                     // Iterate over keychains, and flatten resulting arrays
            (kc) => kc._keys.filter(                                // Filter only members of _keys
                (key) => key.match({".instanceof": clstarget}))))   // That are instances of the target
    }

    objbrowser_fields(propname) {
        let fieldtypes = {_keys: "arrayobj"}
        return fieldtypes[propname] || super.objbrowser_fields(propname);
    }
}
KeyChain.keychains = [];    // List of keychains managed by KeyChain
KeyChain.eventHandler = new EventListenerHandler(); //TODO-EVENTS push this back - use mechanism in PublicPrivate.js
SmartDict.table2class["kc"] = KeyChain;

exports = module.exports = KeyChain;
