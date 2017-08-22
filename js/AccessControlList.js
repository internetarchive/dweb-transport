const CommonList = require("./CommonList"); // AccessControlList extends this
const SmartDict = require("./SmartDict");   // _AccessControlListEntry extends this
const Dweb = require("./Dweb");

//TODO-REL3-API - whole file

class AccessControlList extends CommonList {
    /*
    An AccessControlList is a list for each control domain, with the entries being who has access.

    To create a list, it just requires a key pair, like any other List

    See Authentication.rst //TODO-REL3 incorporate in docs

    Fields:
    accesskey:  Secret key with which things are encrypted. We are controlling who gets this.
    */

    constructor(data, master, key, verbose, options) {
        /*
        Create a new AccessControlList - see CommonList for parameters
         */
        super(data, master, key, verbose, options);
        this.table = "acl";
    }

    preflight(dd) {
        /*
        Prepare data for storage, ensure publickey available
        :param dd: dict containing data preparing for storage (from subclass)
        :returns: dict ready for storage if not modified by subclass
         */
        if ((!this._master) && this.keypair._key.sign.publicKey) {
            dd["publickey"] = dd.publickey || dd.keypair.publicexport();   // Store publickey for verification
        }
        // Super has to come after above as overrights keypair, also cant put in CommonList as MB's dont have a publickey and are only used for signing, not encryption
        return super.preflight(dd);
    }

    p_add_acle(viewerpublicurl, verbose) {
        /*
        Add a new ACL entry - that gives a viewer the ability to see the accesskey

        :param viewerpublicurl: The url of the viewers KeyPair object (contains a publickey)
        :resolves to: this for chaining
        */
        let self = this;
        if (verbose) console.log("AccessControlList.add viewerpublicurl=",viewerpublicurl);
        if (!this._master) {
            throw new Dweb.errors.ForbiddenError("Cant add viewers to a public copy of an ACL");
        }
        return Dweb.SmartDict.p_fetch(viewerpublicurl, verbose) // Fetch the public key will be KeyPair
            // Create a new ACLE with access key, encrypted by publickey
            .then((viewerpublickeypair) => new SmartDict({
                    //Need to go B64->binary->encrypt->B64
                    "token": viewerpublickeypair.encrypt(Dweb.KeyPair.b64dec(self.accesskey), true, self),
                    "viewer": viewerpublicurl
                }, verbose) //data,verbose
            )
            .then((acle) => self.p_push(acle, verbose))
            .then(() => self);
    }

    tokens(viewerkeypair, decrypt, verbose) {
        /*
        Find the entries, if any, in the ACL for a specific viewer
        There might be more than one if either the accesskey changed or the person was added multiple times.
        Entries are SmartDict with token being the decryptable accesskey we want
        The ACL should have been p_list_then_elements() before so that this can run synchronously.

        :param viewerkeypair:  KeyPair of viewer
        :param decrypt: If should decrypt the
        :return:    Array of encrypted tokens (strings) or array of uint8Array
        :throws:    CodingError if not yet fetched
        */

        if (verbose) console.log("AccessControlList.tokens decrypt=",decrypt);
        let viewerurl = viewerkeypair._url;
        if (! this._list.length) { return []}
        let toks = this._list
            .filter((sig) => sig.data.viewer === viewerurl)    // Find any sigs that match this viewerurl - should be decryptable
            .map((sig) => sig.data.token);
        if (decrypt) {  // If requested, decrypt each of them
            toks = toks.map((tok) => viewerkeypair.decrypt(tok, this, "uint8array"));
        }
        return toks;
    }

    encrypt(data, b64) {
        /*
        Encrypt some data based on the accesskey of this list.

        :param data: string - data to be encrypted
        :param b64: true if want result as urlbase64 string, otherwise string
        :return: string, possibly encoded in urlsafebase64
         */
        return Dweb.KeyPair.sym_encrypt(data, this.accesskey, b64); };

    decrypt(data, viewerkeypair, verbose) {
        /*
            Chain is SD.p_fetch > SD.p_decryptdata > ACL|KC.decrypt, then SD.setdata

            :param data: string from json of encrypted data - b64 encrypted
            :param viewerkeypair:   Keypair of viewer wanting to decrypt, or array, defaults to all KeyPair in Dweb.keychains
            :return:                Decrypted data
            :throw:                 AuthenticationError if there are no tokens for our ViewerKeyPair that can decrypt the data
        */
        let vks = viewerkeypair || Dweb.KeyChain.mykeys(Dweb.KeyPair);
        if (!Array.isArray(vks)) { vks = [ vks ]; } // Convert singular key into an array
        for (let i in vks) {
            let vk = vks[i];
            let accesskeys = this.tokens(vk, true, verbose); // Find any tokens in ACL for this KeyPair and decrypt to get accesskey (maybe empty)
            for (let j in accesskeys) { // Try each of these keys
                let accesskey = accesskeys[j];
                try {   // If can descrypt then return the data
                    return Dweb.KeyPair.sym_decrypt(data, accesskey, "text"); //data. symkey #Exception DecryptionFail
                } catch(err) {
                    //Should really only catch DecryptionFail
                    //do nothing,
                }
            }
        }
        // If drop out of nested loop then there was no token for our ViewerKey that contained a accesskey that can decrypt the data
        throw new Dweb.errors.AuthenticationError("ACL.decrypt: No valid keys found");
    };

    _p_storepublic(verbose) {
        /*
        Store a public version of the ACL - shouldnt include accesskey, or privatekey
        Note - doesnt return a promise, the store is happening in the background
        */
        if (verbose) console.log("AccessControlList._p_storepublic");
        //AC(data, master, key, verbose, options) {
        let acl = new AccessControlList({"name": this.name}, false, this.keypair, verbose, {});
        acl.p_store(verbose); // Async, but will set _url immediately
        this._publicurl = acl._url;  //returns immediately with precalculated url
    }

    static p_test(verbose) {
        // Test ACL - note creates and returns a ACL suitable for other tests
        if (verbose) console.log("AccessControlList.p_test");
        return new Promise((resolve, reject) => {
            try {
                if (verbose) console.log("Creating AccessControlList");
                // Create a acl for testing, - full breakout is in test_keychain
                let accesskey = Dweb.KeyPair.randomkey();
                let aclseed = "01234567890123456789012345678902";    // Note seed with 01 at end used in mnemonic faking
                let keypair = new Dweb.KeyPair({key: {seed: aclseed}}, verbose);
                //ACL(data, master, keypair, keygen, mnemonic, verbose, options)
                let acl = new Dweb.AccessControlList({
                    name: "test_acl.acl",
                    accesskey: Dweb.KeyPair.b64enc(accesskey)
                }, true, keypair, verbose, {});
                acl._allowunsafestore = true;    // Not setting _acl on this
                acl.p_store(verbose)
                .then(() => {
                    acl._allowunsafestore = false;
                    if (verbose) console.log("Creating AccessControlList url=", acl._url);
                    resolve(acl);
                })
                .catch((err) => {
                    console.log("Error in AccessControlList.p_test", err);   // Log since maybe "unhandled" if just throw
                    reject(err);
                });
            } catch(err) {
                console.log("Caught exception in AccessControlList.p_test", err);
                throw err;
            }
        })
    }

    static p_decryptdata(value, verbose) {
        /*
         Takes a dict,
         checks if encrypted (by presence of "encrypted" field, and returns immediately if not
         Otherwise if can find the ACL's url in our keychains then decrypt with it.
         Else returns a promise that resolves to the data
         No assumption is made about what is in the decrypted data

         Chain is SD.p_uknwon_fetch > SD.p_decryptdata > ACL.p_decrypt > ACL|KC.decrypt, then SD.setdata

         :param value: object from parsing incoming JSON that may contain {acl, encrypted}
         :return: data or promise that resolves to data
         :throws: AuthenticationError if cant decrypt
         */
        if (! value.encrypted) {
            return value;
        } else {
            let aclurl = value.acl;
            let kc = Dweb.KeyChain.find(aclurl);  // Matching KeyChain or None
            if (kc) {
                return kc.decrypt(value.encrypted, verbose) // Exception: DecryptionFail - unlikely since publicurl matches
            } else {
                //ACL(url, data, master, key, verbose, options)
                // TODO-AUTHENTICATION probably add person - to - person version
                let acl;
                return Dweb.SmartDict.p_fetch(aclurl, verbose) // Will be AccessControlList
                    .then((newacl) => acl = newacl)
                    .then(() => acl.p_list_then_elements(verbose)) // Will load blocks in sig as well
                    .then(() => acl.decrypt(value.encrypted, null, verbose))  // Resolves to data or throws AuthentictionError
                    .catch((err) => { console.log("Unable to decrypt:",value); throw(err);});
            }
        }
    };



}
exports = module.exports = AccessControlList;


