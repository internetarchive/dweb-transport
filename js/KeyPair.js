const sodium = require("libsodium-wrappers");
//Uncomment to debug, check urlsafe occurs: console.log("XXX@keypair:2",sodium)
const SmartDict = require("./SmartDict");
const Dweb = require("./Dweb");

class KeyPair extends SmartDict {
    /*
    Encapsulates public key cryptography

    Fields:
    _key    Holds a structure, that may depend on cryptographic library used.

    Constants:
    KeyPair.KEYTYPESIGN=1, KEYTYPEENCRYPT=2, KEYTYPESIGNANDENCRYPT=3  specify which type of key to generate

    Libsodium implementation: Note that Uint8Array is the result of converting UrlSafeBase64 with sodium.to_urlsafebase64
    _key = {
        sign: { publicKey: Uint8Array, privateKey: Uint8Array, keyType: "ed25519" }
        encrypt: { publicKey: Uint8Array, privateKey: Uint8Array},
        seed: Uint8Array,
    }
     */

    constructor(hash, data, verbose) {
        /*
        Create a new KeyPair

        :param hash: hash to read key from
        :param data: or data to initialize with (see Fields above)
         */
        super(hash, data, verbose);    // SmartDict takes data=json or dict
        this.table = "kp";
    }

    __setattr__(name, value) {
        /*
         Subclasses SmartDict.__setattr__ to import "key"

         :param name:   String - name of field to set, if "key" then imports, else to SmartDict.__setattr__
         :param value:  Any - stored in field, for key can be urlsafebase64 string, or Uint8Array, or dict in libsodium format above.
         */
        let verbose = false;
        if (name === "key") {
            this._key_setter(value);
        } else if (name === "private") {
            console.assert(false, "XXX Undefined functionality KeyPair.private.setter");
        } else if (name === "public") {
            console.assert(false, "XXX Undefined functionality KeyPair.public.setter");
        } else {
            super.__setattr__(name, value);
        }
    }

    _key_setter(value) {
        /*
        Set a key, convert formats if required.

        value:  Dictionary in local format, or Uint8Array or urlsafebase64 string
         */
        let verbose = false;
        if (typeof value === "string" || Array.isArray(value)) {
            this._importkey(value);
        } else {    // Should be object, or maybe undefined ?
            if (typeof value === "object") {
                if (value.mnemonic) {
                    if (value.mnemonic === "coral maze mimic half fat breeze thought champion couple muscle snack heavy gloom orchard tooth alert cram often ask hockey inform broken school cotton") { // 32 byte
                        value.seed = "01234567890123456789012345678901";  // Note this is seed from mnemonic above
                        console.log("Faking mnemonic encoding for now")
                    } else {
                        console.assert(false, "MNEMONIC STILL TO BE IMPLEMENTED");    //TODO-mnemonic
                    }
                }
                if (value.keygen) {
                    value.seed = sodium.randombytes_buf(sodium.crypto_box_SEEDBYTES);
                    delete value.keygen;
                }
                if (value.seed) {
                    value = KeyPair._keyfromseed(value.seed, Dweb.KeyPair.KEYTYPESIGNANDENCRYPT, verbose);
                }
            }
            this._key = value;
        }
    }
    preflight(dd) {
        /*
        Subclasses SmartDict.preflight, checks not exporting unencrypted private keys, and exports private or public.

        :param dd: dict of fields, maybe processed by subclass
        :returns: dict of fields suitable for storing in Dweb
         */
        if (KeyPair._key_has_private(dd._key) && !dd._acl && !this._allowunsafestore) {
            Dweb.utils.SecurityWarning("Probably shouldnt be storing private key",dd);
        }
        if (dd._key) { //Based on whether the CommonList is master, rather than if the key is (key could be master, and CL not)
            dd.key = KeyPair._key_has_private(dd._key) ? this.privateexport() : this.publicexport();
        }
        return super.preflight(dd)
    }

    static _keyfromseed(seed, keytype, verbose) {
        /*
        Generate a key from a seed,

        :param seed:    uint8array or binary string (not urlsafebase64) to generate key from
        :param keytype: One of KeyPair.KEYTYPExyz to specify type of key wanted
        :returns:       Dict suitable for storing in _key
         */
        let key = {};
        //console.assert(sodium.crypto_box_SEEDBYTES === sodium.crypto_sign_SEEDBYTES, "KeyPair.keygen assuming seed lengths same");
        console.assert(sodium.crypto_box_SEEDBYTES === seed.length, "Seed should be", sodium.crypto_box_SEEDBYTES, "but is", seed.length);
        key.seed = seed;
        if (keytype === Dweb.KeyPair.KEYTYPESIGN || keytype === Dweb.KeyPair.KEYTYPESIGNANDENCRYPT) {
            key.sign = sodium.crypto_sign_seed_keypair(key.seed); // Object { publicKey: Uint8Array[32], privateKey: Uint8Array[64], keyType: "ed25519" }
        }
        if (keytype === Dweb.KeyPair.KEYTYPEENCRYPT || keytype === Dweb.KeyPair.KEYTYPESIGNANDENCRYPT) {
            key.encrypt = sodium.crypto_box_seed_keypair(key.seed); // Object { publicKey: Uint8Array[32], privateKey: Uint8Array[64] } <<maybe other keyType
            // note this doesnt have the keyType field
            //console.log("XXX write this into KeyPair.js line 32", key.encrypt);
        }
        //if (verbose) { console.log("key generated:",key); }
        return key;
    }


    _importkey(value) {
        /*
        Import a key, sets fields of _key without disturbing any already set unless its SEED.

        :param value: "xyz:1234abc" where xyz is one of "NACL PUBLIC, NACL SEED, NACL VERIFY" and 1234bc is a ursafebase64 string
                    Note NACL PRIVATE, NACL SIGNING,  are not yet supported as "NACL SEED" is exported
         */
        //First tackle standard formats created by exporting functionality on keys
        // Call route is ... data.setter > ...> key.setter > _importkey
        //TODO - Note fingerprint different from Python - this stores the key, change the Python
        if (typeof value === "object") {    // Should be array, not dict
            for (let i in value) {
                //noinspection JSUnfilteredForInLoop
                this._importkey(value[i]);
            }
        } else {
            let arr = value.split(':',2);
            let tag = arr[0];
            let hash = arr[1];
            let hasharr = sodium.from_urlsafebase64(hash);
            //See https://github.com/jedisct1/libsodium.js/issues/91 for issues
            if (!this._key) { this._key = {}}   // Only handles NACL style keys
            if (tag === "NACL PUBLIC")           { this._key["encrypt"] = {"publicKey": hasharr};
            } else if (tag === "NACL PRIVATE")   { console.assert(false, "_importkey: Cant (yet) import Private key "+value+" normally use SEED");
            } else if (tag === "NACL SIGNING")   { console.assert(false, "_importkey: Cant (yet) import Signing key "+value+" normally use SEED");
            } else if (tag === "NACL SEED")      { this._key = KeyPair._keyfromseed(hasharr, Dweb.KeyPair.KEYTYPESIGNANDENCRYPT);
            } else if (tag === "NACL VERIFY")    { this._key["sign"] = {"publicKey": hasharr};
            } else                              { console.assert(false, "_importkey: Cant (yet) import "+value); }
        }
    }

    publicexport() {    // TODO probably change this on Python version as well
        /*
        :return: an array include one or more "NACL PUBLIC:abc123", or "NACL VERIFY:abc123" urlsafebase64 string.
         */
        let res = [];
        if (this._key.encrypt) { res.push("NACL PUBLIC:"+sodium.to_urlsafebase64(this._key.encrypt.publicKey)) }
        if (this._key.sign) { res.push("NACL VERIFY:"+sodium.to_urlsafebase64(this._key.sign.publicKey)) }
        return res;
    }

    //private() { console.assert(false, "XXX Undefined function KeyPair.private"); }    //TODO private is a reserved word in JS
    //public() { console.assert(false, "XXX Undefined function KeyPair.public"); }  //TODO public is a reserved word in JS
    mnemonic() { console.assert(false, "XXX Undefined function KeyPair.mnemonic"); }

    privateexport() {
        /*
        :return: an array include one or more "NACL SEED:abc123" urlsafebase64 string.
         */
        //TODO note this doesnt match the current Python implementation
        let key = this._key;
        if (key.seed) {
            return "NACL SEED:" + (typeof(key.seed) === "string" ? key.seed : sodium.to_urlsafebase64(key.seed));
        } else {
            console.assert(false, "XXX Undefined function KeyPair.privateexport witghout seed", key);  //TODO should export full set of keys prob as JSON
        }
    }

    static _key_has_private(key) {
        /*
        :return: true if the _key has a private version (or sign or encrypt or seed)
         */
        if ((key.encrypt && key.encrypt.privateKey) || (key.sign && key.sign.privateKey) || key.seed) { return true; }
        if ((key.encrypt && key.encrypt.publicKey) || (key.sign && key.sign.publicKey)) { return false; }
        console.log("_key_hash_private doesnt recognize",key);
    }

    _naclprivate() { return this._key.encrypt.privateKey; }
    _naclpublic() { return this._key.encrypt.publicKey; }

    has_private() {
        /*
        :return: true if key has a private version (or sign or encrypt or seed)
         */
        return KeyPair._key_has_private(this._key)
    }
    encrypt(data, b64, signer) {
        /*
         Encrypt a string, the destination string has to include any information needed by decrypt, e.g. Nonce etc

         :param data:   String to encrypt
         :b64 bool:  True if want result encoded in urlsafebase64
         :signer AccessControlList or KeyPair: If want result signed (currently ignored for RSA, reqd for NACL)
         :return: str, binary encryption of data or urlsafebase64
         */
        // Assumes nacl.public.PrivateKey or nacl.signing.SigningKey
        console.assert(signer, "Until PyNaCl bindings have secretbox we require a signer and have to add authentication");
        //box = nacl.public.Box(signer.keypair._naclprivate, self._naclpublic)
        //return box.encrypt(data, encoder=(nacl.encoding.URLSafeBase64Encoder if b64 else nacl.encoding.RawEncoder))
        const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
        const ciphertext = sodium.crypto_box_easy(data, nonce, this._naclpublic(), signer.keypair._naclprivate(), "uint8array"); //(message, nonce, publicKey, secretKey, outputFormat)

        const combined = Dweb.utils.mergeTypedArraysUnsafe(nonce, ciphertext);
        return b64 ? sodium.to_urlsafebase64(combined) : sodium.to_string(combined);
    }
    decrypt(data, signer, outputformat) {
        /*
         Decrypt date encrypted with encrypt (above)

         :param data:  urlsafebase64 or Uint8array, starting with nonce
         :signer AccessControlList: If result was signed (currently ignored for RSA, reqd for NACL)
         :outputformat: Compatible with LibSodium, typicall "text" to return a string
         :return: Data decrypted to outputformat
        */
        console.assert(data, "KeyPair.decrypt: meaningless to decrypt undefined, null or empty strings");
        if (this._key.encrypt.privateKey) {
            console.assert(signer, "Until PyNaCl bindings have secretbox we require a signer and have to add authentication");
             // Note may need to convert data from unicode to str
             if (typeof(data) === "string") {   // If its a string turn into a Uint8Array
                data = sodium.from_urlsafebase64(data);
             }
             let nonce = data.slice(0,sodium.crypto_box_NONCEBYTES);
             data = data.slice(sodium.crypto_box_NONCEBYTES);
             return sodium.crypto_box_open_easy(data, nonce, signer.keypair._naclpublic(), this._naclprivate(), outputformat);
         } else {
            throw new Dweb.errors.ToBeImplementedError("KeyPair.decrypt for " + this._key);
         }
    }
    sign(date, hash, verbose) {
        /*
        Sign and date a hash using public key function.
        Pair of "verify()"

        :param date: Date that signing (usually now)
        :param hash: Hash being signed, it could really be any data,
        :return: signature that can be verified with verify
        */
        console.assert(date && hash);
        let signable = date.toISOString() + hash;   // Signable string
        if (! this._key.sign.privateKey) {
            throw new Dweb.errors.EncryptionError("Can't sign with out private key. Key =" + JSON.stringify(this._key));
        }
        let sig = sodium.crypto_sign_detached(signable, this._key.sign.privateKey, "urlsafebase64");    //TODO may need to be crypto_sign_detached to match verify (better anyway)
        //Can implement and uncomment next line if seeing problems verifying things that should verify ok - tests immediate verification
        this.verify(signable, sig);
        return sig;
    }

    verify(signable, urlb64sig) {
        /*
        Verify a signature generated by sign()
        TODO - this is not yet incorporated - should be in CommonList and currently just generates an assertion fail if not verified.

        :param signable: date and hash exactly as signed.
        :param urlb64sig: urlsafebase64 encoded signature
         */
        let sig = sodium.from_urlsafebase64(urlb64sig);
        let tested = sodium.crypto_sign_verify_detached(sig, signable, this._key.sign.publicKey);
        console.assert(tested, "Signature not verified");   //TODO decide what to do at this point - might throw exception
    }
}

KeyPair.KEYTYPESIGN = 1;            // Want a signing key
KeyPair.KEYTYPEENCRYPT = 2;         // Want a key for encryption
KeyPair.KEYTYPESIGNANDENCRYPT = 3;  // Want both types of key - this is usually used for encryption due to libsodium-wrappers limitations.


exports = module.exports = KeyPair;

