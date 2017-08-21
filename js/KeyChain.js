const CommonList = require("./CommonList");  // Superclass
const Dweb = require("./Dweb");

class KeyChain extends CommonList {
    /*
    KeyChain extends CommonList to store a users keys.

    Fields:
    _keys:  Array of keys (the signed objects on the list)
     */

    constructor(hash, data, master, key, verbose) {
        /*
        Create a new KeyChain, for parameters see CommonList
         */
        super(hash, data, master, key, verbose);
        if (!this._keys) this._keys = []; // Could be overridden by data in super
        this.table = "kc";
    }

    static p_new(key, name, verbose) {  //TODO-REL3 refactor this - probably same args as constructor
        let kc = new KeyChain(null, { name: name }, true, key, verbose);
        return kc.p_store(verbose) // Dont need to wait on store to load and fetchlist but will do so to avoid clashes
            .then(() => KeyChain.addkeychains(kc))
            .then(() => kc.p_fetch_then_list(verbose))  //fetchlist gets the elements   //TODO-REL3 check if need this line
            .then(() => kc) //Fetches blocks in p_loadandfetchlist.success
            // Note kc returned from promise NOT from p_new so have to catch in a ".then"
        //if verbose: print "Created keychain for:", kc.keypair.private.mnemonic
        //if verbose and not mnemonic: print "Record these words if you want to access again"
    }

    keytype() { return Dweb.KeyPair.KEYTYPESIGNANDENCRYPT; }  // Inform keygen

    p_fetchlist(verbose) { //TODO-REL3 - I think this isthe fetch_then_list_then_elements ...
        let self = this;
        return super.p_fetchlist(verbose)
            // Called after CL.p_fetchlist has unpacked data into Signatures in _list
            .then(() => Promise.all(Dweb.Signature.filterduplicates(self._list)
                .map((sig) => Dweb.SmartDict.p_unknown_fetch(sig.hash, verbose)))) // Will be a MB or a ViewerKey (KP)
            .then((keys) => self._keys = keys)
            .then(() => { if (verbose) console.log("KC.p_fetchlist Got keys", ...Dweb.utils.consolearr(self._keys))})
    }

    p_push(obj, verbose) {
        /*
         Add a obj (usually a MutableBlock or a ViewerKey) to the keychain. by signing with this key.
         Item should usually itself be encrypted (by setting its _acl field)

         :param obj: Hash or a object to add (MutableBlock or ViewerKey)
         */
        let hash = (typeof obj === "string") ? obj : obj._hash;
        let sig = this._makesig(hash, verbose);
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

    static find(publichash, verbose) {
        /*
        Locate a needed ACL or KeyChain by its hash (both are on Dweb.keychains)

        :param publichash:  Hash of ACL or KC needed
        :return: AccessControlList or KeyChain or null
        */
        for (let i in Dweb.keychains) {
            let kc = Dweb.keychains[i];
            if (kc._publichash === publichash) {
                if (verbose) console.log("KeyChain.find successful for",publichash);
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
        let kc = new KeyChain(null, {name: this.name}, false, this.keypair, verbose);
        kc.p_store(verbose); // Async, but will set _hash immediately
        this._publichash = kc._hash;  //returns immediately with precalculated hash
    }

    p_store(verbose) {
        /*
        Unlike other p_store this ONLY stores the public version, and sets the _publichash,
        Private/master version should never be stored since the KeyChain is itself the encryption root.
        */
        this.dontstoremaster = true;    // Make sure p_store only stores public version
        return super.p_store(verbose);  // Stores public version and sets _publichash
    }

    static _findbyclass(clstarget) {
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

    static myviewerkeys() {
        /*
        Find all the ViewerKeys on Dweb.keychains, used to see possible decrypters

        :return: Array of KeyPair
        */
        return KeyChain._findbyclass(Dweb.KeyPair);
    }

    static mymutableBlocks() {
        /*
        Find all the ViewerKeys on Dweb.keychains, used to see possible decrypters

        :return: Array of MutableBlock on the KeyChains
        */
        return KeyChain._findbyclass(Dweb.MutableBlock);    //TODO-REL3 remove dependency on MutableBlock
    }

    static p_test(acl, verbose) {
        /* Fairly broad test of AccessControlList and KeyChain */
        if (verbose) console.log("KeyChain.test");
        return new Promise((resolve, reject) => {
            try {
                // Set mnemonic to value that generates seed "01234567890123456789012345678901"
                const mnemonic = "coral maze mimic half fat breeze thought champion couple muscle snack heavy gloom orchard tooth alert cram often ask hockey inform broken school cotton"; // 32 byte
                // Test sequence extracted from test.py
                const qbf="The quick brown fox ran over the lazy duck";
                const vkpname="test_keychain viewerkeypair";
                let kc, kcs2, mb, mblockm, mbmaster, mbm2, mbm3, mm, sb, sb2, viewerkeypair;
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
                        viewerkeypair = new Dweb.KeyPair(null, {name: vkpname, key: keypairexport}, verbose);
                        viewerkeypair._acl = kc;
                        viewerkeypair.p_store(verbose); // Defaults to store private=True (which we want)   // Sets hash, dont need to wait for it to store
                    })
                    .then(() =>  kc.p_push(viewerkeypair, verbose))
                    .then(() => {
                        if (verbose) console.log("KEYCHAIN 3: Fetching mbm hash=", mbmaster._hash);
                        //MB(hash, data, master, key, contenthash, contentacl, verbose, options)
                        mbm2 = new Dweb.MutableBlock(mbmaster._hash, null, true, null, null, null, verbose, null);
                    })
                    .then(() =>  mbm2.p_fetch(verbose))
                    .then(() => console.assert(mbm2.name === mbmaster.name, "Names should survive round trip",mbm2.name,"!==",mbmaster.name))
                    .then(() => {
                        if (verbose) console.log("KEYCHAIN 4: reconstructing KeyChain and fetch");
                        Dweb.keychains = []; // Clear Key Chains
                    })
                    //p_new(mnemonic, keygen, name, verbose)
                    .then(() => kcs2 = KeyChain.p_new({ mnemonic: mnemonic}, "test_keychain kc", verbose))
                    // Note success is run AFTER all keys have been loaded
                    .then(() => {
                        mm = KeyChain.mymutableBlocks();
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
                    .then(() => acl.p_add_acle(viewerkeypair._hash, verbose))   //Add us as viewer
                    .then(() => {
                        console.assert("acl._list.length === 1", "Should have added exactly 1 viewerkeypair",acl);
                        sb = new Dweb.StructuredBlock(null, {"name": "test_sb", "data": qbf, "_acl": acl}, verbose); //hash,data,verbose
                    })
                    .then(() => sb.p_store(verbose))
                    .then(() => {
                        let mvk = KeyChain.myviewerkeys();
                        console.assert(mvk[0].name === vkpname, "Should find viewerkeypair stored above");
                        if (verbose) console.log("KEYCHAIN 6: Check can fetch and decrypt - should use viewerkeypair stored above");
                        sb2 = new Dweb.StructuredBlock(sb._hash, null, verbose);
                    })
                    .then (() => sb2.p_fetch(verbose))   //Fetch & decrypt
                    .then(() => {
                        console.assert(sb2.data === qbf, "Data should survive round trip");
                        if (verbose) console.log("KEYCHAIN 7: Check can store content via an MB");
                        //MB.new(acl, contentacl, name, _allowunsafestore, content, signandstore, verbose)
                    })
                    .then(() => Dweb.MutableBlock.p_new(null, acl, "mblockm", true, qbf, true, verbose))
                    .then((newmblockm) => {
                        mblockm = newmblockm;
                        //hash, data, master, key, contenthash, contentacl, verbose, options
                        mb = new Dweb.MutableBlock(mblockm._publichash, null, false, null, null, null, verbose);
                    })
                    .then(() => mb.p_fetch_then_list_then_current(verbose))
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
