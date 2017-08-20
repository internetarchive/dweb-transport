const SmartDict = require("./SmartDict"); //for extends
const Dweb = require("./Dweb");

class CommonList extends SmartDict {
    /*
    CommonList is a superclass for anything that manages a storable list of other hashes
    e.g. MutableBlock, KeyChain, AccessControlList

    Fields:
    keypair         Holds a KeyPair used to sign items
    _list           Holds an array of signatures of items put on the list
    _master         True if this is a master list, i.e. can add things
    _publichash     Holds the hash of publicly available version of the list.
    _allowunsafestore True if should override protection against storing unencrypted private keys (usually only during testing)
    dontstoremaster True if should not store master key
    */

    constructor(hash, data, master, key, verbose, options) {
        /*
            Create a new instance of CommonList

            :param hash: hash of list to fetch from Dweb
            :param data: json string or dict to load fields from
            :param master: boolean, true if should create a master list with private key etc
            :param key: A KeyPair, or a dict of options for creating a key: valid = mnemonic, seed, keygen:true
                keygen: boolean, true means it should generate a key
                mnemonic: BIP39 string to use as a mnemonic to generate the key - TODO not implemented (in JS) yet
                seed: Seed to key generation algorithm
            :param options: dict that overrides any fields of data
         */
        super(hash, data, verbose, options);
        this._list = [];   // Array of members of the list
        if (key) {
            this._setkeypair(key, verbose);
        }
        if (typeof master === "undefined") {
            this._master = this.keypair.has_private();
        } else {
            this._master = master;  // Note this must be AFTER _setkeypair since that sets based on keypair found and _p_storepublic for example wants to force !master
        }
        if (!this._master) { this._publichash = hash; } // For non master lists, publichash is same as hash
        this.table = "cl";
    }

    keytype() {
        /*
        Return the type of key to use from Dweb.KeyPair.KEYTYPE* constants
        By default its KEYTYPESIGN, but KeyChain subclasses

        :return: constant
         */
        return Dweb.KeyPair.KEYTYPESIGN;
    }

    __setattr__(name, value) {
        /*
        Set a field of the object, this provides the equivalent of Python setters and getters.
        Call chain is ...  or constructor > _setdata > _setproperties > __setattr__
        Subclasses SmartDict

        Default passes "keypair" to _setkeypair
        :param name: string - name of attribute to set
        :param value: anything but usually string from retrieving - what to set name to.
         */
        let verbose = false;
        if (name === "keypair") {
            this._setkeypair(value, verbose);
        } else {
            super.__setattr__(name, value);
        }
    }

    _setkeypair(value, verbose) {
        /*
        Set the keypair attribute, converts value into KeyPair if not already
        Call chain is ...  or constructor > _setdata > _setproperties > __setattr__ > _setkeypair
        Sets _master if value has a private key (note that is overridden in the constructor)

        :param value: KeyPair, or Dict like _key field of KeyPair
         */
        if (value && ! (value instanceof Dweb.KeyPair)) {
            value = new Dweb.KeyPair(null, { key: value }, verbose) // Note ignoring keytype for now
        }
        this.keypair = value;
        this._master = value && value.has_private();
    }

    preflight(dd) {
        /*
        Prepare a dictionary of data for storage,
        Subclasses SmartDict to:
            convert the keypair for export and check not unintentionally exporting a unencrypted public key
            ensure that _publichash is stored (by default it would be removed)
        and subclassed by AccessControlList

        :param dd: dict of attributes of this, possibly changed by superclass
        :return: dict of attributes ready for storage.
         */
        if (dd.keypair) {
            if (dd._master && !dd._acl && !this._allowunsafestore) {
                Dweb.utils.SecurityWarning("Probably shouldnt be storing private key", dd);
            }
            dd.keypair = dd._master ? dd.keypair.privateexport() : dd.keypair.publicexport();
        }
        let publichash = dd._publichash; // Save before preflight
        let master = dd._master;
        dd = super.preflight(dd);  // Edits dd in place
        if (master) { // Only store on Master, on !Master will be None and override storing hash as _publichash
            dd._publichash = publichash;   // May be None, have to do this AFTER the super call as super filters out "_*"
        }
        return dd;
    }

    p_fetchlist(verbose) {
        /*
        Load the list from the Dweb,
        Use p_fetch_then_list_then_elements instead if wish to load the individual items in the list
        */
        let self = this;
        if (!this._master && !this._publichash)  this._publichash = this._hash;  // We aren't master, so publichash is same as hash
        if (!this._publichash) this._p_storepublic(verbose); // Async, but sets _publichash immediately
        return Dweb.transport.p_rawlist(this._publichash, verbose)  //TODO modify to allow listmonitor
            .then((lines) => { // lines should be an array
                if (verbose) console.log("CommonList:p_fetchlist.success", self._hash, "len=", lines.length);
                self._list = lines.map((l) => new Dweb.Signature(null, l, verbose));    // Turn each line into a Signature
            })
    }

    p_fetch_then_list(verbose) {
        /*
         Utility function to simplify nested functions, fetches body and then the list (need sync as body might inc publickey).
          */
        let self=this;
        return this.p_fetch(verbose)
            .then(()=>self.p_fetchlist(verbose))
    }

    p_fetch_then_list_then_elements(verbose) {
        /*
         Utility function to simplify nested functions, fetches body, list and each element in the list.

         :resolves: list of objects signed and added to the list
        */
        let self=this;
        return this.p_fetch_then_list(verbose)
            .then(() => Promise.all(Dweb.Signature.filterduplicates(self._list) // Dont load multiple copies of items on list (might need to be an option?)
                .map((sig) => sig.p_unknown_fetch(verbose)))) // Return is array result of p_fetch which is array of new objs (suitable for storing in keys etc)
        }

    _p_storepublic(verbose) {
        /*
         Store a public version of the object, just stores name field and public key
         Typically subclassed to save specific fields
         Note that this returns immediately after setting hash, so caller may not need to wait for success
         */
        //CL(hash, data, master, key, verbose, options)
        let cl = new CommonList(null, null, false, this.keypair, verbose, {"name": this.name});
        let prom = cl.p_store(verbose);    // Returns immediately but sets _hash first
        this._publichash = cl._hash;
    }

    p_store(verbose) {
        /*
            Store on Dweb, if _master will ensure that stores a public version as well, and saves in _publichash
            Will store master unless dontstoremaster is set.
         */
        if (this._master && ! this._publichash) {
            this._p_storepublic(verbose); //Stores asynchronously, but _publichash set immediately
        }
        if ( ! (this._master && this.dontstoremaster)) {
            return super.p_store(verbose);    // Transportable.store(verbose)
        } else {
            return new Promise((resolve, reject)=> resolve(null));  // I think this should be a noop - fetched already
        }
    }

    publicurl() { console.assert(false, "XXX Undefined function CommonList.publicurl"); }   // For access via web
    privateurl() { console.assert(false, "XXX Undefined function CommonList.privateurl"); }   // For access via web

    p_signandstore(obj, verbose ) {
        /*
         Sign and store a object on a list, stores both locally on _list and sends to Dweb

         :param obj: Should be subclass of SmartDict, (Block is not supported)
         :resolves: sig created in process - for adding to lists etc.
         :throws:   ForbiddenError if not master;
         */
        let self = this;
        let sig;
        return this.p_fetch(verbose)
            .then(() => this.p_store()) // Make sure stored - fetch might be a Noop if created locally
            .then(() => obj.p_store())
            .then(() => {
                if (!(self._master && self.keypair)) throw new Dweb.errors.ForbiddenError("Signing a new entry when not a master list");
                sig = this._makesig(obj._hash, verbose);
                self._list.push(sig);   // Keep copy locally on _list
            })
            .then(() => self.p_add(obj._hash, sig, verbose))    // Add to list in dweb
            .then(() => sig);
    }

    _makesig(hash, verbose) {
        /*
        Utility function to create a signature - used by p_signandstore and in KeyChain.p_addobj
        :param hash:    Hash of object to sign
        :returns:       Signature
         */
        if (!hash) throw new Dweb.errors.CodingError("Empty hash is a coding error");
        if (!this._master) throw new Dweb.errors.ForbiddenError("Must be master to sign something");
        let sig = Dweb.Signature.sign(this, hash, verbose); //returns a new Signature
        console.assert(sig.signature, "Must be a signature");
        return sig
    }
    p_add(hash, sig, verbose) {
        /*
        Add a signature to the Dweb for this list

        :param sig: Signature
         */
        console.assert(sig,"CommonList.p_add is meaningless without a sig");
        return Dweb.transport.p_rawadd(hash, sig.date, sig.signature, sig.signedby, verbose);
    }

    listmonitor(callback, verbose) {
        Dweb.transport.listmonitor(this._publichash, (obj) => {
            if (verbose) console.log("CL.listmonitor",this._publichash,"Added",obj);
            let sig = new Dweb.Signature(null, obj, verbose);
            this._list.push(sig);
            callback(sig);
        })
    }
    //TODO add many of the methods of Array to CommonList see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
}
exports = module.exports = CommonList;
