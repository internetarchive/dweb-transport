const CommonList = require("./CommonList"); // AccessControlList extends this
const SmartDict = require("./SmartDict");   // _AccessControlListEntry extends this
const Dweb = require("./Dweb");

class AccessControlList extends CommonList {
    /*
    An AccessControlList is a list for each control domain, with the entries being who has access.

    To create a list, it just requires a key pair, like any other List

    Fields:
    accesskey:  Secret key with which things are encrypted. We are controlling who gets this.
    _list: Contains a list of signatures, each for a SmartDict each of which is:
        viewerkeypair: public URL of the KeyPair of an authorised viewer
        token:  accesskey encrypted with PublicKey from the KeyPair
        name:   Name of this token

    */

    constructor(data, master, key, verbose, options) {
        /*
        Create a new AccessControlList - see CommonList for parameters
         */
        super(data, master, key, verbose, options);
        if (this._master && !this.accesskey) {
            this.accesskey = Dweb.KeyPair.b64enc(Dweb.KeyPair.randomkey());
        }
        this.table = "acl";
    }

    static p_new(data, master, key, verbose, options, kc) {
        /*
            Create a new AccessControlList, store, add to keychain

            :param data,master,key,verbose,options: see new CommonList
            :param kc: Optional KeyChain to add to
         */
        if (verbose) console.log("AccessControlList.p_new");
        let acl = new Dweb.AccessControlList(data, master, key, verbose, options); // Create ACL
        if (master) {
            kc = kc || Dweb.keychains[0];    // Default to first KeyChain
            if (kc) {
                return kc.p_push(acl, verbose).then((sig) => acl);
            } else {
                return acl.p_store(verbose).then((ur) => acl); // Ensure stored even if not put on KeyChain
            }
        }
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
        if (!dd._master)  delete dd.accesskey;   // Dont store the accesskey on the public version
        // Super has to come after above as overrights keypair, also cant put in CommonList as MB's dont have a publickey and are only used for signing, not encryption
        return super.preflight(dd);
    }

    async p_add_acle(viewerpublicurl, data, verbose) {
        /*
        Add a new ACL entry - that gives a viewer the ability to see the accesskey of this URL

        :param viewerpublicurl: The url of the viewers KeyPair object (contains a publickey)
        :resolves to: this for chaining
        */
        let self = this;
        if (verbose) console.log("AccessControlList.p_add_acle viewerpublicurl=",viewerpublicurl);
        if (!this._master) throw new Dweb.errors.ForbiddenError("Cant add viewers to a public copy of an ACL");
        if (!viewerpublicurl) throw new Dweb.errors.CodingError("Cant pass empty viewerpublicurl to ACL.p_add_acle");
        let viewerpublickeypair = await Dweb.SmartDict.p_fetch(viewerpublicurl, verbose); // Fetch the public key will be KeyPair
            // Create a new ACLE with access key, encrypted by publickey
        let acle = new SmartDict({
                    //Need to go B64->binary->encrypt->B64
                    "token": viewerpublickeypair.encrypt(Dweb.KeyPair.b64dec(self.accesskey), true, self),
                    "viewer": viewerpublicurl,
                    "name": data["name"]
                }, verbose); //data,verbose
        await self.p_push(acle, verbose);
        return acle;
    }

    p_tokens(verbose) { //TODO-BACKPORT
        /*
        Return the list of tokens on this ACL. Side effect of loading data on each Signature in this._list
        resolves to: [ SmartDict{token:, viewer:, name: }, ... ]
         */
        return this.p_list_then_elements(verbose);      // Trivial
    }
    _findtokens(viewerkeypair, decrypt, verbose) {
        /*
        Find the entries, if any, in the ACL for a specific viewer
        There might be more than one if either the accesskey changed or the person was added multiple times.
        Entries are SmartDict with token being the decryptable accesskey we want
        The ACL should have been p_tokens() before so that this can run synchronously.

        :param viewerkeypair:  KeyPair of viewer
        :param decrypt: If should decrypt the
        :return:    Array of encrypted tokens (strings) or array of uint8Array
        :throws:    CodingError if not yet fetched
        */

        if (verbose) console.log(`ACL._findtokens (decrypt=${decrypt} looking for tokens in ${this._publicurl}, matching viewerkeypair=`,viewerkeypair);
        let viewerurl = viewerkeypair._publicurl; // Note this was erroneously _url, has to be _publicurl as cant store the private url on a ACL as person setting up ACL doesn't know it
        if (! this._list.length) { return []}
        let toks = this._list
            .filter((sig) => sig.data.viewer === viewerurl)    // Find any sigs that match this viewerurl - should be decryptable
            .map((sig) => sig.data.token);
        if (decrypt) {  // If requested, decrypt each of them
            toks = toks.map((tok) => viewerkeypair.decrypt(tok, this, "uint8array"));
        }
        if (verbose) console.log(`ACL._findtokens found ${toks.length}`);
        return toks;
    }

    encrypt(data, b64) {
        /*
        Encrypt some data based on the accesskey of this list.

        :param data: string - data to be encrypted
        :param b64: true if want result as urlbase64 string, otherwise string
        :return: string, possibly encoded in urlsafebase64
        :throws: CodingError if this.accesskey not set
         */
        if (!this.accesskey) {
            console.log("ACL.encrypt no accesskey, prob Public",this)
            throw new Dweb.errors.EncryptionError("ACL.encrypt needs an access key - is this a Public _acl?")
        }
        return Dweb.KeyPair.sym_encrypt(data, this.accesskey, b64); };  //CodingError if accesskey not set

    decrypt(data, verbose) {
        /*
            Decrypt data for a viewer.
            Chain is SD.p_fetch > SD.p_decryptdata > ACL|KC.decrypt, then SD.setdata

            :param data: string from json of encrypted data - b64 encrypted
            :param viewerkeypair:   Keypair of viewer wanting to decrypt, or array, defaults to all KeyPair in Dweb.keychains
            :return:                Decrypted data
            :throw:                 AuthenticationError if there are no tokens for our ViewerKeyPair that can decrypt the data
        */
        let vks = Dweb.KeyChain.mykeys(Dweb.KeyPair);
        if (!Array.isArray(vks)) { vks = [ vks ]; } // Convert singular key into an array
        for (let i in vks) {
            let vk = vks[i];
            let accesskeys = this._findtokens(vk, true, verbose); // Find any tokens in ACL for this KeyPair and decrypt to get accesskey (maybe empty)
            for (let j in accesskeys) { // Try each of these keys
                let accesskey = accesskeys[j];
                try {   // If can descrypt then return the data
                    return Dweb.KeyPair.sym_decrypt(data, accesskey, "text"); //data. symkey #Exception DecryptionFail
                } catch(err) { //TODO Should really only catch DecryptionFailError, but presume not experiencing other errors
                    //do nothing,
                }
            }
        }
        // If drop out of nested loop then there was no token for our ViewerKey that contained a accesskey that can decrypt the data
        throw new Dweb.errors.AuthenticationError("ACL.decrypt: No valid keys found");
    };

    static async p_decryptdata(value, verbose) {
        /*
         Takes a dict,
         checks if encrypted (by presence of "encrypted" field, and returns immediately if not
         Otherwise if can find the ACL's url in our keychains then decrypt with it (it will be a KeyChain, not a ACL in that case.
         Else returns a promise that resolves to the data
         No assumption is made about what is in the decrypted data

         Chain is SD.p_fetch > SD.p_decryptdata > ACL.p_decrypt > ACL|KC.decrypt, then SD.setdata

         :param value: object from parsing incoming JSON that may contain {acl, encrypted} acl will be url of AccessControlList or KeyChain
         :return: data or promise that resolves to data
         :throws: AuthenticationError if cannot decrypt
         */
        try {
            if (!value.encrypted) {
                return value;
            } else {
                if (verbose) console.log("ACL.p_decryptdata of:",value);
                let aclurl = value.acl;
                let decryptor = Dweb.KeyChain.keychains_find({_publicurl: aclurl});  // Matching KeyChain or None
                if (!decryptor) {
                    // TODO-AUTHENTICATION probably add person - to - person version encrypted with receivers Pub Key
                    if (verbose) console.log("ACL.p_decryptdata: Looking for our own ACL:",aclurl);
                    decryptor = Dweb.KeyChain.acl_find({_publicurl: aclurl});
                    if (verbose) console.log("ACL.p_decryptdata: fetching ACL:",aclurl);
                    if (!decryptor) {
                        decryptor = await Dweb.SmartDict.p_fetch(aclurl, verbose); // Will be AccessControlList
                        if (verbose) console.log("ACL.p_decryptdata: fetched ACL:", decryptor);
                        if (decryptor instanceof Dweb.KeyChain) {
                            if (verbose) console.log(`ACL.p_decryptdata: encrypted with KC name=${decryptor.name}, but not logged in`);
                            throw new Dweb.errors.AuthenticationError(`Must be logged in as ${decryptor.name}`);
                        }
                    }
                    if (verbose) console.log("ACL.p_decryptdata: fetching ACL tokens");
                    await decryptor.p_tokens(verbose); // Will load blocks in sig as well
                    if (verbose) console.log("ACL.p_decryptdata: fetched ACL tokens for",decryptor._publicurl, decryptor._list.map((sig) => sig.data) );
                }
                let decrypted = Transport.loads(decryptor.decrypt(value.encrypted, verbose));  // Resolves to data or throws AuthentictionError
                if (!decrypted._acl) decrypted._acl = decryptor;    // Save the _acl used for encryption in case write it back TODO not sure we can encrypt it back
                return decrypted;
            }
        } catch(err) {
            console.log("Unable to decrypt:", value, err);
            throw(err);
        }
    }

    static p_test(verbose) { //TODO-BACKPORT - copy into Python/test_client
        // Test ACL - note creates and returns a ACL suitable for other tests
        if (verbose) console.log("AccessControlList.p_test");
        return new Promise((resolve, reject) => {
            try {
                if (verbose) console.log("Creating AccessControlList");
                // Create a acl for testing, - full breakout is in test_keychain
                let accesskey = Dweb.KeyPair.randomkey();
                let aclseed = "01234567890123456789012345678902";    // Note seed with 01 at end used in mnemonic faking
                let keypair = new Dweb.KeyPair({key: "NACL SEED:"+Dweb.KeyPair.b64enc(Buffer(aclseed))}, verbose);
                //ACL(data, master, keypair, keygen, mnemonic, verbose, options)
                let acl = new Dweb.AccessControlList({
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

}
exports = module.exports = AccessControlList;


