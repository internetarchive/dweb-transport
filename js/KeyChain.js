const CommonList = require("./CommonList");  // Superclass
const Dweb = require("./Dweb");

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
        Store and add to the Dweb.keychains, list any elements already on the KeyChain (relevant for existing keys)
        data, key:  See CommonList for parameters
        resolves to:    KeyChain created
         */
            let kc = await super.p_new(data, true, key, verbose); // Calls CommonList.p_new -> new KC() -> new CL() and then sets listurls and listpublicurls
            try {
                await kc.p_store(verbose);
            } catch(err) { // Should be a Transport Error
                throw new Dweb.errors.AuthenticationError("Unable to login as transport failed")
            }
            // The order here is important - kc has to be on keychains to decrypt the elements, and eventhandler has to be
            // after elements are loaded so cant be inside addkeychains()
            KeyChain.addkeychains(kc);  // Add after fetching elements as triggers events
            await kc.p_list_then_elements(verbose);
            Dweb.eventHandler.callEventListeners({type: "login", values: kc})
            return kc;
    }

    keytype() { return Dweb.KeyPair.KEYTYPESIGNANDENCRYPT; }  // Inform keygen

    async p_list_then_elements(verbose) {
        /*
        Subclasses CommonList to store elements in a _keys array.

        resolves to:    Array of KeyPair
        throws: AuthenticationError if cant decrypt keys
         */
        try {
            this._keys = await super.p_list_then_elements(verbose);
            if (verbose) console.log("KC.p_list_then_elements Got keys", ...Dweb.utils.consolearr(this._keys))
            return this._keys;
        } catch(err) {
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
        if (! this.keypair._key.encrypt)
            throw new Dweb.errors.EncryptionError("No decryption key in"+JSON.stringify(this.keypair._key));
        return this.keypair.decrypt(data, this, "text"); //data, signer, outputformat - Throws EnryptionError if no encrypt.privateKey, CodingError if !data
    }

    accesskey() { throw new Dweb.errors.CodingError("KeyChain doesnt have an accesskey"); }

    p_store(verbose) {
        /*
        Unlike other p_store this ONLY stores the public version, and sets the _publicurls, on the assumption that the private key of a KeyChain should never be stored.
        Private/master version should never be stored since the KeyChain is itself the encryption root.
        */
        this.dontstoremaster = true;    // Make sure p_store only stores public version
        return super.p_store(verbose);  // Stores public version and sets _publicurls
    }

    // ====  Stuff to do with managing Dweb.keychains - this could be a separate class at some point ======
    static addkeychains(keychain) {
        /*
        Add keys I can use for viewing to Dweb.keychains where it will be iterated over during decryption.

        :param keychains:   keychain or Array of keychains
        */
        if (keychain instanceof Array) {
            keychain.map((kc) => KeyChain.addkeychains(kc));
        } else {
            Dweb.keychains.push(keychain);
        }
    }

    static logout() {
        /*
        Logout user - which means removing from Dweb.keychains
         */
        Dweb.keychains = []
    }

    static default() {
        return Dweb.keychains.length ? Dweb.keychains[Dweb.keychains.length-1] : undefined;
    }
    static keychains_find(dict, verbose) {
        /*
        Locate a needed KeyChain on Dweb.keychains by some filter.

        :param dict:    dictionary to check against the keychain (see CommonList.match() for interpretation
        :return:        AccessControlList or KeyChain or null
        */
        return Dweb.keychains.find((kc) => kc.match(dict))  // Returns undefined if none match or keychains is empty, else first match
    }
    static acl_find(dict, verbose) {
        return Dweb.KeyChain.mykeys(Dweb.AccessControlList).find((acl) => acl.match(dict));  // Returns undefined if none match or keychains is empty, else first match
    }

    static mykeys(clstarget) {
        /*
        Utility function to find any keys in any of Dweb.keychains for the target class.

        clstarget:  Class to search Dweb.keychains for, KeyPair, or something with a KeyPair e.g. subclass of CommonList(ACL, MB)
        returns:    (possibly empty) array of KeyPair or CommonList
         */
        //Dweb.keychains is an array of arrays so have to flatten the result.
        return [].concat(...Dweb.keychains.map(                     // Iterate over keychains, and flatten resulting arrays
            (kc) => kc._keys.filter(                                // Filter only members of _keys
                (key) => key.match({".instanceof": clstarget}))))   // That are instances of the target
    }

    objbrowser_fields(propname) {
        let fieldtypes = { _keys: "arrayobj"}
        return fieldtypes[propname] || super.objbrowser_fields(propname);
    }


    static async p_test(acl, verbose) {
        /* Fairly broad test of AccessControlList and KeyChain */
        if (verbose) console.log("KeyChain.test");
        let testasync = false;  // Set to true to wait between chunks to check for async functions that haven't been await-ed
        try {
            // Set mnemonic to value that generates seed "01234567890123456789012345678901"
            const mnemonic = "coral maze mimic half fat breeze thought champion couple muscle snack heavy gloom orchard tooth alert cram often ask hockey inform broken school cotton"; // 32 byte
            // Test sequence extracted from test.py
            const qbf = "The quick brown fox ran over the lazy duck";
            const vkpname = "test_keychain viewerkeypair";
            const keypairexport = "NACL SEED:w71YvVCR7Kk_lrgU2J1aGL4JMMAHnoUtyeHbqkIi2Bk="; // So same result each time
            if (verbose) console.log("Keychain.test 0 - create");
            let kc = await KeyChain.p_new({name: "test_keychain kc"}, {mnemonic: mnemonic}, verbose);    //Note in KEYCHAIN 4 we recreate exactly same way.

            if (verbose) console.log("KEYCHAIN 1 - add VL to KC");
            let vlmaster = await Dweb.VersionList.p_new({name: "test_keychain vlmaster"}, true, {passphrase: "TESTING VLMASTER"},
                await new Dweb.SmartDict({content: qbf}, verbose),
                verbose); //(data, master, key, firstinstance, verbose)
            if (testasync) { console.log("Waiting - expect no output"); await delay(1000); }

            if (verbose) console.log("KEYCHAIN 2 - add viewerkeypair to it");
            let viewerkeypair = new Dweb.KeyPair({name: vkpname, key: keypairexport}, verbose);
            viewerkeypair._acl = kc;
            await viewerkeypair.p_store(verbose); // Defaults to store private=true (which we want)
            await kc.p_push(viewerkeypair, verbose);
            if (testasync) { console.log("Waiting - expect no output"); await delay(1000); }

            if (verbose) console.log("KEYCHAIN 3: Fetching vlm url=", vlmaster._urls);
            let vlm2 = await Dweb.SmartDict.p_fetch(vlmaster._urls, verbose); //Will be MutableBlock
            console.assert(vlm2.name === vlmaster.name, "Names should survive round trip", vlm2.name, "!==", vlmaster.name);
            if (testasync) { console.log("Waiting - expect no output"); await delay(1000); }

            if (verbose) console.log("KEYCHAIN 4: reconstructing KeyChain and fetch");
            Dweb.KeyChain.logout();     // Clear Key Chains
            //p_new(data, key, verbose)
            let kc2 = await KeyChain.p_new({name: "test_keychain kc"}, {mnemonic: mnemonic}, verbose);
            console.assert(kc2._list[0].data._urls[0] === kc._list[0].data._urls[0])
            console.assert(kc2._list[0].data._publicurls[0] === kc._list[0].data._publicurls[0])
            // Note success is run AFTER all keys have been loaded
            let mm = KeyChain.mykeys(Dweb.VersionList);
            console.assert(mm.length, "Should find vlmaster");
            let vlm3 = mm[mm.length - 1];
            console.assert(vlm3 instanceof Dweb.VersionList, "Should be a Version List", vlm3);
            console.assert(vlm3.name === vlmaster.name, "Names should survive round trip");
            if (testasync) { console.log("Waiting - expect no output"); await delay(1000); }

            if (verbose) console.log("KEYCHAIN 5: Check can user ViewerKeyPair");
            // Uses acl passed in from AccessControlList.acl
            acl._allowunsafestore = true;
            await acl.p_add_acle(viewerkeypair, {"name": "my token"}, verbose);
            console.assert("acl._list.length === 1", "Should have added exactly 1 viewerkeypair", acl);
            let sb = new Dweb.StructuredBlock({"name": "test_sb", "data": qbf, "_acl": acl}, verbose); //url,data,verbose
            await sb.p_store(verbose);
            if (testasync) { console.log("Waiting - expect no output"); await delay(1000); }
            let mvk = KeyChain.mykeys(Dweb.KeyPair);
            if (mvk[0].name !== vkpname) throw new Dweb.errors.CodingError("Should find viewerkeypair stored above");
            if (testasync) { console.log("Waiting - expect no output"); await delay(1000); }

            if (verbose) console.log("KEYCHAIN 6: Check can fetch and decrypt - should use viewerkeypair stored above");
            let sb2 = await Dweb.SmartDict.p_fetch(sb._urls, verbose); // Will be StructuredBlock, fetched and decrypted
            if (sb2.data !== qbf) throw new Dweb.errors.CodingError("Data should survive round trip");
            if (testasync) { console.log("Waiting - expect no output"); await delay(1000); }

            if (verbose) console.log("KEYCHAIN 7: Check can store content via an VL");
            let vlmasterwithacl = await Dweb.VersionList.p_new({name: "test_keychain vlmaster", contentacl: acl._urls}, true, {passphrase: "TESTING VLMASTER"},
                await new Dweb.SmartDict({content: qbf}, verbose),
                verbose); //(data, master, key, firstinstance, verbose)
            await vlmasterwithacl.p_store(verbose);
            await vlmasterwithacl.p_saveversion(verbose);
            let vl = await Dweb.SmartDict.p_fetch(vlmasterwithacl._publicurls, verbose); // Will be VersionList
            await vl.p_fetchlistandworking(verbose);
            if (vl._working.content !== qbf) throw new Dweb.errors.CodingError("Data should round trip through ACL");
            if (verbose) console.log("KeyChain.test promises complete");
            //console.log("KeyChain.test requires more tests defined");
            return {kc: kc, vlmaster: vlmaster};
        } catch (err) {
            console.log("Caught exception in KeyChain.p_test", err);
            throw err;
        }
    }
}

exports = module.exports = KeyChain;
