const CommonList = require("./CommonList"); // AccessControlList extends this
const SmartDict = require("./SmartDict");   // _AccessControlListEntry extends this
const Dweb = require("./Dweb");

class _AccessControlListEntry extends SmartDict {    // Local class

    constructor(hash, data, verbose, options) {
        super(hash, data, verbose, options);
        this.table = "AccessControlListEntry";
    }
}

class AccessControlList extends CommonList {
    /*
    An AccessControlList is a list for each control domain, with the entries being who has access.

    To create a list, it just requires a key pair, like any other List

    See Authentication.rst //TODO-REL3 incorporate in docs

    Fields:
    accesskey:  Secret key with which things are encrypted. We are controlling who gets this.
    */

    constructor(hash, data, master, key, verbose, options) {
        /*
        Create a new AccessControlList - see CommonList for parameters
         */
        super(hash, data, master, key, verbose, options);
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

    p_add_acle(viewerpublichash, verbose) {
        /*
        Add a new ACL entry - that gives a viewer the ability to see the accesskey

        :param viewerpublichash: The hash of the viewers KeyPair object (contains a publickey)
        :resolves to: this for chaining
        */
        let self = this;
        if (verbose) console.log("AccessControlList.add viewerpublichash=",viewerpublichash);
        if (!this._master) {
            throw new Dweb.errors.ForbiddenError("Cant add viewers to a public copy of an ACL");
        }
        let viewerpublickeypair = new Dweb.KeyPair(viewerpublichash, null, verbose);
        return viewerpublickeypair.p_fetch(verbose) // Fetch the public key
        // Create a new ACLE with access key, encrypted by publickey
            .then(() => new _AccessControlListEntry(null, {
                    //Need to go B64->binary->encrypt->B64 //TODO-REL3 remove dependency on CryptoLib
                    "token": viewerpublickeypair.encrypt(Dweb.CryptoLib.b64dec(self.accesskey), true, self),
                    "viewer": viewerpublichash
                }, verbose) //hash,data,verbose
            )
            .then((acle) => self.p_push(acle, verbose))
            .then(() => self);
    }

    tokens(viewerkeypair, decrypt, verbose) {
        /*
        Find the entries, if any, in the ACL for a specific viewer
        There might be more than one if either the accesskey changed or the person was added multiple times.
        Entries are AccessControlListEntry with token being the decryptable accesskey we want
        The ACL should have been p_fetch_then_list_then_elements() before so that this can run synchronously.

        :param viewerkeypair:  KeyPair of viewer
        :param decrypt: If should decrypt the
        :return:    Array of encrypted tokens (strings) or array of uint8Array
        :throws:    CodingError if not yet fetched
        */

        if (verbose) console.log("AccessControlList.tokens decrypt=",decrypt);
        if (this._needsfetch) throw new CodingError("Need to p_fetch_then_list_then_elements before calling ACL.tokens");
        let viewerhash = viewerkeypair._hash;
        if (! this._list.length) { return []}
        let toks = this._list
            .filter((sig) => sig.data.viewer === viewerhash)    // Find any sigs that match this viewerhash - should be decryptable
            .map((sig) => sig.data.token);
        if (decrypt) {  // If requested, decrypt each of them
            toks = toks.map((tok) => viewerkeypair.decrypt(tok, this, "uint8array"));
        }
        return toks;
    }

    p_fetch_then_list_then_elements(verbose) {
        /*
        Like CL.p_fetch_then_list_then_elements, but fetch the blocks the sigs point to which are ACLE
         */
        let self=this;
        return this.p_fetch_then_list(verbose)  //Dont use p_fetch_then_list_then_elements because CL has to assume its a unknown type of block
            .then(() => this._list.map((sig) => { sig.data = new _AccessControlListEntry(sig.hash, null, verbose)}))
            .then(() => Promise.all(self._list.map((sig) => sig.data.p_fetch(verbose))))
    }

    encrypt(data, b64) {
        /*
        Encrypt some data based on the accesskey of this list.

        :param data: string - data to be encrypted
        :param b64: TODO-REL3 is this bool or outputformat
         */
        //TODO-REL3 remove dependency on CryptoLib
        return Dweb.CryptoLib.sym_encrypt(data, this.accesskey, b64); }; //TODO-REL3 remove dependency on CryptoLib

    decrypt(data, viewerkeypair, verbose) {
        /*
             Chain is SD.p_fetch > CryptoLib.p_decryptdata > ACL.decrypt > SD.setdata   //TODO-REL3 check this

            :param data: string from json of encrypted data - b64 encrypted
            :param viewerkeypair:   Keypair of viewer wanting to decrypt, or array, defaults to Dweb.myviewerkeys
            :return:                Decrypted data
            :throw:                 AuthenticationError if there are no tokens for our ViewerKeyPair that can decrypt the data
        */
        if (this._needsfetch) throw new CodingError("Need to p_fetch_then_list_then_elements before calling ACL.decrypt");
        let vks = viewerkeypair || Dweb.KeyChain.myviewerkeys();
        if (!Array.isArray(vks)) { vks = [ vks ]; } // Convert singular key into an array
        for (let i in vks) {
            let vk = vks[i];
            let accesskeys = this.tokens(vk, true, verbose); // Find any tokens in ACL for this KeyPair and decrypt to get accesskey (maybe empty)
            for (let j in accesskeys) { // Try each of these keys
                let accesskey = accesskeys[j];
                try {   // If can descrypt then return the data
                    //TODO-REL3 remove dependency on CryptoLib
                    return Dweb.CryptoLib.sym_decrypt(data, accesskey, "text"); //data. symkey #Exception DecryptionFail
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
        //AC(hash, data, master, key, verbose, options) {
        let acl = new AccessControlList(null, {"name": this.name}, false, this.keypair, verbose, {});
        acl.p_store(verbose); // Async, but will set _hash immediately
        this._publichash = acl._hash;  //returns immediately with precalculated hash
    }

    static p_test(verbose) {
        // Test ACL - note creates and returns a ACL suitable for other tests
        if (verbose) console.log("AccessControlList.p_test");
        return new Promise((resolve, reject) => {
            try {
                if (verbose) console.log("Creating AccessControlList");
                // Create a acl for testing, - full breakout is in test_keychain
                let accesskey = Dweb.CryptoLib.randomkey(); //TODO-REL3 remove dependency on CryptoLib
                let aclseed = "01234567890123456789012345678902";    // Note seed with 01 at end used in mnemonic faking
                let keypair = new Dweb.KeyPair(null, {key: {seed: aclseed}}, verbose);
                //ACL(hash, data, master, keypair, keygen, mnemonic, verbose, options)
                let acl = new Dweb.AccessControlList(null, {
                    name: "test_acl.acl",
                    accesskey: Dweb.CryptoLib.b64enc(accesskey) //TODO-REL3 remove dependency on CryptoLib
                }, true, keypair, verbose, {});
                acl._allowunsafestore = true;    // Not setting _acl on this
                acl.p_store(verbose)
                .then(() => {
                    acl._allowunsafestore = false;
                    if (verbose) console.log("Creating AccessControlList hash=", acl._hash);
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

}
exports = module.exports = AccessControlList;


