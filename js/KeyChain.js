const CommonList = require("./CommonList");  // Superclass
const Dweb = require("./Dweb");

class KeyChain extends CommonList {
    /*
    KeyChain extends CommonList to store a users keys.

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

    static p_new(key, name, verbose) {
        let kc = new KeyChain({ name: name }, true, key, verbose);
        return kc.p_store(verbose) // Dont need to wait on store to load and fetchlist but will do so to avoid clashes
            .then(() => KeyChain.addkeychains(kc))
            .then(() => kc.p_list_then_elements(verbose))
            .then(() => kc) //Fetches blocks in p_loadandfetchlist.success
            // Note kc returned from promise NOT from p_new so have to catch in a ".then"
    }

    keytype() { return Dweb.KeyPair.KEYTYPESIGNANDENCRYPT; }  // Inform keygen

    p_list_then_elements(verbose) {
        /*
        Subclass CommonList to store elements in _keys
         */
        let self = this;
        return super.p_list_then_elements(verbose)
            .then((keys) => self._keys = keys)
            .then(() => { if (verbose) console.log("KC.p_list_then_elements Got keys", ...Dweb.utils.consolearr(self._keys))})
    }
    p_push(obj, verbose) {
        /*
         Add a obj (usually a MutableBlock or a ViewerKey) to the keychain. by signing with this key.
         Item should usually itself be encrypted (by setting its _acl field)

         :param obj: URL or a object to add (MutableBlock or ViewerKey)
         */
        let url = (typeof obj === "string") ? obj : obj._url;
        let sig = this._makesig(url, verbose);
        this._list.push(sig);                       // Add to local list
        return this.p_add(sig, verbose)             // Post to dweb, Resolves to undefined
    }

    encrypt(data, b64) {
        /*
         Encrypt an object (usually represented by the json string). Pair of .decrypt()

         :param res: The material to encrypt, usually JSON but could probably also be opaque bytes
         :param b64: True if result wanted in urlsafebase64 (usually)
         :return:    Encrypted data
         */
        return this.keypair.encrypt(data, b64, this);  // data, b64, signer
    }
    decrypt(data, verbose) {
        /*
         Decrypt data - pair of .encrypt()
         Chain is SD.p_fetch > SD.p_decryptdata > ACL|KC.decrypt, then SD.setdata

         :param data: String from json, b64 encoded
         :return: decrypted text as string
         :throws: :throws: EnryptionError if no encrypt.privateKey, CodingError if !data
         */
        if (! this.keypair._key.encrypt)
            throw new Dweb.errors.EncryptionError("No decryption key in"+JSON.stringify(this.keypair._key))
        return this.keypair.decrypt(data, this, "text"); //data, b64, signer - Throws EnryptionError if no encrypt.privateKey, CodingError if !data
    }

    accesskey() { throw new Dweb.errors.CodingError("KeyChain doesnt have an accesskey"); }

    static addkeychains(keychains) {
        /*
        Add keys I can view under to Dweb.keychains where it will be used by the ACL

        :param keychains:   keychain or Array of keychains
        */
        if (keychains instanceof Array) {
            Dweb.keychains = Dweb.keychains.concat(keychains);
        } else {
            Dweb.keychains.push(keychains);
        }
    }

    static find(publicurl, verbose) {
        /*
        Locate a needed ACL or KeyChain by its url (both are on Dweb.keychains)

        :param publicurl:  URL of ACL or KC needed
        :return: AccessControlList or KeyChain or null
        */
        for (let i in Dweb.keychains) {
            let kc = Dweb.keychains[i];
            if (kc._publicurl === publicurl) {
                if (verbose) console.log("KeyChain.find successful for",publicurl);
                return kc;
            }
        }
        return null;
    }

    _p_storepublic(verbose) {
        /*
        Store a publicly viewable version of KeyChain - note the keys should be encrypted
        Note - doesnt return a promise, the store is happening in the background
        */
        if (verbose) console.log("KeyChain._p_storepublic");
        let kc = new KeyChain({name: this.name}, false, this.keypair, verbose);
        kc.p_store(verbose); // Async, but will set _url immediately
        this._publicurl = kc._url;  //returns immediately with precalculated url
    }

    p_store(verbose) {
        /*
        Unlike other p_store this ONLY stores the public version, and sets the _publicurl,
        Private/master version should never be stored since the KeyChain is itself the encryption root.
        */
        this.dontstoremaster = true;    // Make sure p_store only stores public version
        return super.p_store(verbose);  // Stores public version and sets _publicurl
    }

    static mykeys(clstarget) {
        /*
        Utility function to find any keys in any of Dweb.keychains for the target class.
        The targetclass should be something with its own key, typically a KeyPair or a MutableBlock
         */
        // its a double loop - Dweb.keychains is an array of KeyChain which are themselves a list of keys
        let res = [];
        for (let i in Dweb.keychains) {
            let keys = Dweb.keychains[i]._keys;
            for (let j in keys) {
                let k = keys[j];
                if (k instanceof clstarget) res.push(k);
            }
        }
        return res;
    }

    static p_test(acl, verbose) {
        /* Fairly broad test of AccessControlList and KeyChain */
        if (verbose) console.log("KeyChain.test");
        console.assert(Dweb.MutableBlock, "KeyChain.p_test depends on Mutable Block, although KeyChain itself doesnt");
        return new Promise((resolve, reject) => {
            try {
                // Set mnemonic to value that generates seed "01234567890123456789012345678901"
                const mnemonic = "coral maze mimic half fat breeze thought champion couple muscle snack heavy gloom orchard tooth alert cram often ask hockey inform broken school cotton"; // 32 byte
                // Test sequence extracted from test.py
                const qbf="The quick brown fox ran over the lazy duck";
                const vkpname="test_keychain viewerkeypair";
                let kc, kcs2, mb, mblockm, mbmaster, mbm3, mm, sb, viewerkeypair;
                const keypairexport =  "NACL SEED:w71YvVCR7Kk_lrgU2J1aGL4JMMAHnoUtyeHbqkIi2Bk="; // So same result each time
                if (verbose) {
                    console.log("Keychain.test 0 - create");
                }
                KeyChain.p_new({mnemonic: mnemonic}, "test_keychain kc", verbose)
                    .then((kc1) => {
                        kc = kc1;
                        if (verbose) console.log("KEYCHAIN 1 - add MB to KC");
                    })
                    .then(() => Dweb.MutableBlock.p_new(kc, null, "test_keychain mblockm", true, qbf, true, verbose)) //acl, contentacl, name, _allowunsafestore, content, signandstore, verbose, options
                    .then((mbm) => {mbmaster=mbm;  kc.p_push(mbmaster, verbose)})   //Sign and store on KC's list (returns immediately with Sig)
                    .then(() => {
                        if (verbose) console.log("KEYCHAIN 2 - add viewerkeypair to it");
                        viewerkeypair = new Dweb.KeyPair({name: vkpname, key: keypairexport}, verbose);
                        viewerkeypair._acl = kc;
                        viewerkeypair.p_store(verbose); // Defaults to store private=True (which we want)   // Sets url, dont need to wait for it to store
                    })
                    .then(() =>  kc.p_push(viewerkeypair, verbose))
                    .then(() => {
                        if (verbose) console.log("KEYCHAIN 3: Fetching mbm url=", mbmaster._url);
                        return Dweb.SmartDict.p_fetch(mbmaster._url, verbose); //Will be MutableBlock
                    })
                    .then((mbm2) => console.assert(mbm2.name === mbmaster.name, "Names should survive round trip",mbm2.name,"!==",mbmaster.name))
                    .then(() => {
                        if (verbose) console.log("KEYCHAIN 4: reconstructing KeyChain and fetch");
                        Dweb.keychains = []; // Clear Key Chains
                    })
                    //p_new(mnemonic, keygen, name, verbose)
                    .then(() => kcs2 = KeyChain.p_new({ mnemonic: mnemonic}, "test_keychain kc", verbose))
                    // Note success is run AFTER all keys have been loaded
                    .then(() => {
                        mm = KeyChain.mykeys(Dweb.MutableBlock);
                        console.assert(mm.length, "Should find mblockm");
                        mbm3 = mm[mm.length - 1];
                        console.assert(mbm3 instanceof Dweb.MutableBlock, "Should be a mutable block", mbm3);
                        console.assert(mbm3.name === mbmaster.name, "Names should survive round trip");
                     })
                    .then(() => {
                        if (verbose) console.log("KEYCHAIN 5: Check can user ViewerKeyPair");
                        // Uses acl passed in from AccessControlList.acl
                        acl._allowunsafestore = true;
                    })
                    .then(() => verbose = true)
                    .then(() => acl.p_add_acle(viewerkeypair._url, verbose))   //Add us as viewer
                    .then(() => {
                        console.assert("acl._list.length === 1", "Should have added exactly 1 viewerkeypair",acl);
                        sb = new Dweb.StructuredBlock({"name": "test_sb", "data": qbf, "_acl": acl}, verbose); //url,data,verbose
                    })
                    .then(() => sb.p_store(verbose))
                    .then(() => {
                        let mvk = KeyChain.mykeys(Dweb.KeyPair)
                        console.assert(mvk[0].name === vkpname, "Should find viewerkeypair stored above");
                        if (verbose) console.log("KEYCHAIN 6: Check can fetch and decrypt - should use viewerkeypair stored above");
                        return Dweb.SmartDict.p_fetch(sb._url, verbose); // Will be StructuredBlock, fetched and decrypted
                    })
                    .then((sb2) => {
                        console.assert(sb2.data === qbf, "Data should survive round trip");
                        if (verbose) console.log("KEYCHAIN 7: Check can store content via an MB");
                        //MB.new(acl, contentacl, name, _allowunsafestore, content, signandstore, verbose)
                    })
                    .then(() => Dweb.MutableBlock.p_new(null, acl, "mblockm", true, qbf, true, verbose))
                    .then((newmblockm) => {
                        mblockm = newmblockm;
                        //data, master, key, contenturl, contentacl, verbose, options
                        return Dweb.SmartDict.p_fetch(mblockm._publicurl, verbose); // Will be MutableBlock
                    })
                    .then((newpublicmb) => mb = newpublicmb)
                    .then(() => mb.p_list_then_current(verbose))
                    .then(() => {
                        console.assert(mb.content() === qbf, "Data should round trip through ACL");
                    })

                    .then(() => {
                        if (verbose) console.log("KeyChain.test promises complete");
                        //console.log("KeyChain.test requires more tests defined");
                        resolve({kc: kc, mbmaster: mbmaster});
                    })
                    .catch((err) => {
                        console.log("Error in KeyChain.p_test", err);   // Log since maybe "unhandled" if just throw
                        reject(err);
                    })
            } catch (err) {
                console.log("Caught exception in KeyChain.p_test", err);
                throw err;
            }
        })
    }
}



exports = module.exports = KeyChain;
