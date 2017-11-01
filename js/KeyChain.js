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
            let kc = new KeyChain(data, true, key, verbose);
            await kc.p_store(verbose);
            KeyChain.addkeychains(kc);
            await kc.p_list_then_elements(verbose);
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
            console.log("KeyChains.p_list_then_elements: Unable to retrieve keys", err);
            throw(err);
        }
    }

    encrypt(data, b64) {
        /*
         Encrypt an object (usually represented by the json string). Pair of .decrypt()

         :param res: The material to encrypt, usually JSON but could probably also be opaque bytes
         :param b64: True if result wanted in urlsafebase64 (usually)
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

    static addkeychains(keychains) {
        /*
        Add keys I can use for viewing to Dweb.keychains where it will be iterated over during decryption.

        :param keychains:   keychain or Array of keychains
        */
        if (keychains instanceof Array) {
            Dweb.keychains = Dweb.keychains.concat(keychains);
        } else {
            Dweb.keychains.push(keychains);
        }
    }

    static logout() {
        /*
        Logout user - which means removing from Dweb.keychains
         */
        Dweb.keychains = []
    }
    static default() {  //TODO-API
        return Dweb.keychains.length ? Dweb.keychains[Dweb.keychains.length-1] : undefined;
    }

    p_store(verbose) {
        /*
        Unlike other p_store this ONLY stores the public version, and sets the _publicurl, on the assumption that the private key of a KeyChain should never be stored.
        Private/master version should never be stored since the KeyChain is itself the encryption root.
        */
        this.dontstoremaster = true;    // Make sure p_store only stores public version
        return super.p_store(verbose);  // Stores public version and sets _publicurl
    }

    static keychains_find(dict, verbose) {
        /*
        Locate a needed KeyChain on Dweb.keychains by some filter.

        :param dict:    dictionary to check against the keychain (see CommonList.match() for interpretation
        :return:        AccessControlList or KeyChain or null
        */
        return Dweb.keychains.find((kc) => kc.match(dict))  // Returns undefined if none match or keychains is empty, else first match
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


    static async p_test(acl, verbose) {
        /* Fairly broad test of AccessControlList and KeyChain */
        if (verbose) console.log("KeyChain.test");
        let testasync = false;  // Set to true to wait between chunks to check for async functions that haven't been await-ed
        console.assert(Dweb.MutableBlock, "KeyChain.p_test depends on Mutable Block, although KeyChain itself doesnt");
        try {
            // Set mnemonic to value that generates seed "01234567890123456789012345678901"
            const mnemonic = "coral maze mimic half fat breeze thought champion couple muscle snack heavy gloom orchard tooth alert cram often ask hockey inform broken school cotton"; // 32 byte
            // Test sequence extracted from test.py
            const qbf = "The quick brown fox ran over the lazy duck";
            const vkpname = "test_keychain viewerkeypair";
            const keypairexport = "NACL SEED:w71YvVCR7Kk_lrgU2J1aGL4JMMAHnoUtyeHbqkIi2Bk="; // So same result each time
            if (verbose) console.log("Keychain.test 0 - create");
            let kc = await KeyChain.p_new({name: "test_keychain kc"}, {mnemonic: mnemonic}, verbose);    //Note in KEYCHAIN 4 we recreate exactly same way.
            if (verbose) console.log("KEYCHAIN 1 - add MB to KC");
            let mbmaster = await Dweb.MutableBlock.p_new(kc, null, "test_keychain mblockm", true, qbf, true, verbose); //acl, contentacl, name, _allowunsafestore, content, signandstore, verbose, options
            await kc.p_push(mbmaster, verbose);   //Sign and store on KC's list (returns immediately with Sig)
            if (testasync) { console.log("Waiting - expect no output"); await delay(1000); }
            if (verbose) console.log("KEYCHAIN 2 - add viewerkeypair to it");
            let viewerkeypair = new Dweb.KeyPair({name: vkpname, key: keypairexport}, verbose);
            viewerkeypair._acl = kc;
            await viewerkeypair.p_store(verbose); // Defaults to store private=True (which we want)
            await kc.p_push(viewerkeypair, verbose);
            if (testasync) { console.log("Waiting - expect no output"); await delay(1000); }
            if (verbose) console.log("KEYCHAIN 3: Fetching mbm url=", mbmaster._url);
            let mbm2 = await Dweb.SmartDict.p_fetch(mbmaster._url, verbose); //Will be MutableBlock
            console.assert(mbm2.name === mbmaster.name, "Names should survive round trip", mbm2.name, "!==", mbmaster.name);
            if (testasync) { console.log("Waiting - expect no output"); await delay(1000); }
            if (verbose) console.log("KEYCHAIN 4: reconstructing KeyChain and fetch");
            Dweb.KeyChain.logout();     // Clear Key Chains
            //p_new(data, key, verbose)
            await KeyChain.p_new({name: "test_keychain kc"}, {mnemonic: mnemonic}, verbose);
            // Note success is run AFTER all keys have been loaded
            let mm = KeyChain.mykeys(Dweb.MutableBlock);
            console.assert(mm.length, "Should find mblockm");
            let mbm3 = mm[mm.length - 1];
            console.assert(mbm3 instanceof Dweb.MutableBlock, "Should be a mutable block", mbm3);
            console.assert(mbm3.name === mbmaster.name, "Names should survive round trip");
            if (testasync) { console.log("Waiting - expect no output"); await delay(1000); }
            if (verbose) console.log("KEYCHAIN 5: Check can user ViewerKeyPair");
            // Uses acl passed in from AccessControlList.acl
            acl._allowunsafestore = true;
            await acl.p_add_acle(viewerkeypair._url, {"name": "my token"}, verbose);   //Add us as viewer - resolves to tok
            console.assert("acl._list.length === 1", "Should have added exactly 1 viewerkeypair", acl);
            let sb = new Dweb.StructuredBlock({"name": "test_sb", "data": qbf, "_acl": acl}, verbose); //url,data,verbose
            await sb.p_store(verbose);
            if (testasync) { console.log("Waiting - expect no output"); await delay(1000); }
            let mvk = KeyChain.mykeys(Dweb.KeyPair);
            if (mvk[0].name !== vkpname) throw new Dweb.errors.CodingError("Should find viewerkeypair stored above");
            if (testasync) { console.log("Waiting - expect no output"); await delay(1000); }
            if (verbose) console.log("KEYCHAIN 6: Check can fetch and decrypt - should use viewerkeypair stored above");
            let sb2 = await Dweb.SmartDict.p_fetch(sb._url, verbose); // Will be StructuredBlock, fetched and decrypted
            if (sb2.data !== qbf) throw new Dweb.errors.CodingError("Data should survive round trip");
            if (testasync) { console.log("Waiting - expect no output"); await delay(1000); }
            if (verbose) console.log("KEYCHAIN 7: Check can store content via an MB");
            //MB.new(acl, contentacl, name, _allowunsafestore, content, signandstore, verbose)
            let mblockm = await Dweb.MutableBlock.p_new(null, acl, "mblockm", true, qbf, true, verbose);
            //data, master, key, contenturl, contentacl, verbose, options
            let mb = await Dweb.SmartDict.p_fetch(mblockm._publicurl, verbose); // Will be MutableBlock
            await mb.p_list_then_current(verbose);
            if (mb.content() !== qbf) throw new Dweb.errors.CodingError("Data should round trip through ACL");
            if (verbose) console.log("KeyChain.test promises complete");
            //console.log("KeyChain.test requires more tests defined");
            return {kc: kc, mbmaster: mbmaster};
        } catch (err) {
            console.log("Caught exception in KeyChain.p_test", err);
            throw err;
        }
    }
}



exports = module.exports = KeyChain;
