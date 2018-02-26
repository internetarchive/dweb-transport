const errors = require('./Errors'); // Standard Dweb Errors
const Transports = require('./Transports'); // Manage all Transports that are loaded
const SmartDict = require("./SmartDict"); //for extends
const KeyPair = require('./KeyPair'); // Encapsulate public/private key pairs and crypto libraries
const Signature = require('./Signature'); // Encapsulate a signature as used for items on a CommonList
const utils = require('./utils'); // Utility functions


class PublicPrivate extends SmartDict {
    /*
    PublicPrivate is a superclass for anything (except KeyPair) that has both private and publicly stored components because it has a KeyPair.
    e.g. CommonList KeyValue*

    Fields:
    keypair         Holds a KeyPair used to sign items
    _master         true if this is a master list, i.e. can add things
    _publicurls     Holds the urls of publicly available version of the list.
    _allowunsafestore true if should override protection against storing unencrypted private keys (usually only during testing)
    dontstoremaster true if should not store master key
    _listeners      Any event listeners  //TODO-LISTENER - maybe move to SmartDict as generically useful

    CL.p_store, KVP.p_store, _p_storepublic, _getdata and preflight work closely together as summarised below.
    CL.p_store:  this._p_storepublic; Transportable.p_store
    KVP.p_store: Transportable.p_store
    _p_storepublic: constructor(preflight, false) -> p_store -> set _publicurls
    Transportable.p_store: this._getdata -> Transports.p_rawstore
        SD._getdata: build dd -> preflight -> JSON.stringify
            SD.preflight: filter out _*
            <class>.preflight: other filters
    Most subclassing is done either at preflight to filter specific fields, or at p_store if dont have separate public/private versions.


    */

    constructor(data, master, key, verbose, options) {
        /*
            Create a new instance of CommonList
            Note that in almost all cases should use p_new rather than constructor as constructor cant setup listurls and listpublicurls
            Also note that when called from SmartDict.p_fetch ONLY the data is passed.

            :param data: json string or dict to load fields from
            :param master: boolean, true if should create a master list with private key etc
            :param key: A KeyPair, or a dict of options for creating a key: valid = mnemonic, seed, keygen:true
                keygen: boolean, true means it should generate a key
                mnemonic: BIP39 string to use as a mnemonic to generate the key - TODO not implemented (in JS) yet
                seed: Seed to key generation algorithm
            :param options: dict that overrides any fields of data
         */
        super(data, verbose, options);
        this._listeners = {};
        if (key) {
            this._setkeypair(key, verbose);
        }
        this._master = (typeof master === "undefined") ? (this.keypair && this.keypair.has_private()) : master;  // Note this must be AFTER _setkeypair since that sets based on keypair found and _p_storepublic for example wants to force !master
        if (!this._master && (!this._publicurls || !this._publicurls.length)) {
            this._publicurls = this._urls;  // We aren't master, so publicurl is same as url - note URL will only have been set if constructor called from SmartDict.p_fetch
        } else {
            if (!this._publicurls) this._publicurls = [];
        }
        this.table = "pp";
    }

    static async p_new(data, master, key, verbose, options) {
        return new this(data, master, key, verbose, options); // Note will call superclass if called from there.
    }

    keytype() {
        /*
        Return the type of key to use from KeyPair.KEYTYPE* constants
        By default its KEYTYPESIGN, but KeyChain subclasses

        :return: constant
         */
        return KeyPair.KEYTYPESIGN;
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
        if (value && !(value instanceof KeyPair)) {
            if (value["table"]) {
                value = SmartDict._sync_after_fetch(value, [], verbose)
            } else {
                value = new KeyPair({key: value}, verbose) // Note ignoring keytype for now
            }
        }
        this.keypair = value;
        this._master = value && value.has_private();
    }

    preflight(dd) {
        /*
        p_store, p_storepublic and preflight work in tandem to store private and public versions of the data
        Prepare a dictionary of data for storage,
        Subclasses SmartDict to:
            convert the keypair for export and check not unintentionally exporting a unencrypted public key
            ensure that _publicurls is stored (by default it would be removed)
        and subclassed by AccessControlList

        :param dd: dict of attributes of this, possibly changed by superclass
        :return: dict of attributes ready for storage.
         */

        if (dd.keypair) {
            // Check that we don't unintentionally store an unencrypted version with a private key
            if (dd._master && !dd._acl && !this._allowunsafestore) {
                throw new errors.SecurityWarning("Probably shouldnt be storing private key" + JSON.stringify(dd));
            }
            dd.keypair = dd._master ? dd.keypair.privateexport() : dd.keypair.publicexport();
        }
        // Note same code on KeyPair
        let publicurls = dd._publicurls; // Save before preflight
        let master = dd._master;
        dd = super.preflight(dd);  // Edits dd in place, in particular deletes anything starting with _
        if (master) { // Only store on Master, on !Master will be None and override storing urls as _publicurls
            dd._publicurls = publicurls;   // May be None, have to do this AFTER the super call as super filters out "_*"
        }
        return dd;
    }


    async OBS_p_storepublic(verbose) {
        this._publicurls = await Transports.p_rawstore(
            JSON.stringify(
                this.preflight(                 // Hides master urls and _acl since !master
                    Object.assign({}, this,     // Copy the data
                        {_master: false}))),    // cause preflight to trim keys to public
            verbose);
    }

    async _p_storepublic(verbose) {
        // Store public version, dont encrypt on storing as want public part to be publicly visible (esp for Domain)
        this._publicurls = await Transports.p_rawstore( this._getdata({publicOnly: true, encryptIfAcl:false}), verbose);
    }
    storedpublic() {
        return this._publicurls.length > 0
    }

    async p_store(verbose) {
        /*
            Store on Dweb, if _master will ensure that stores a public version as well, and saves in _publicurls
            Will store master unless dontstoremaster is set.
            Subclassed in KeyValueTable
         */
        if (this._master && !this.storedpublic()) {
            await this._p_storepublic(verbose); // Stores a public copy and sets _publicurls
        }
        if (!(this._master && this.dontstoremaster)) {
            await super.p_store(verbose);    // Transportable.store(verbose)
        }
    }

    stored() {
        // Its stored if:
        //  its either !master or we've stored the !master version
        //  and we've either stored it already, OR  its a master flagged as dontstoremaster
        return (!this._master || this._publicurls.length) && ((this._master && this.dontstoremaster) || super.stored())
    }

    async p_sign(urls, verbose) {
        /*
        Create a signature -
        Note - its normally better to use p_push as stores signature and puts on _list and on Dweb
        TODO-KEYVALUE its unclear if this is specific to CL and do differently on KV etc, if so move to CL from PP

        :param urls:    URL of object to sign
        :returns:       Signature
        */
        if (!urls || !urls.length) throw new errors.CodingError("Empty url is a coding error");
        if (!this._master) throw new errors.ForbiddenError("Must be master to sign something");
        let sig = await Signature.p_sign(this, urls, verbose); //returns a new Signature
        if (!sig.signature) throw new errors.CodingError("Must be a signature");
        return sig
    }

    verify(sig, verbose) {
        /*
        Check that a signature is valid for this list, i.e. signed by this keypair.
        TODO-KEYVALUE its unclear if this is specific to CL and do differently on KV etc, if so move to CL from PP

        sig:    Signature object
        returns:    true if verifies
        throws:     assertion error if doesn't //TODO handle that gracefully depending on caller
         */
        return utils.intersects(this._publicurls, sig.signedby)    // Check signedby assertion is for this list -
            && this.keypair.verify(sig.signable(), sig.signature)    //TODO currently throws assertion error if doesnt - not sure that is correct
    }
    objbrowser_fields(propname) {
        let fieldtypes = { keypair: "obj", _master: "str", _publicurls: "urlarray", _allowunsafestore: "str",
            dontstoremaster: "str", _listeners: "jsonobj" }  //TODO-OBJBROWSER check booleans work, and conversion of listners to strings.
        return fieldtypes[propname] || super.objbrowser_fields(propname);
    }

    // ----- Listener interface ----- see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget for the pattern

    addEventListener(type, callback) {
        /*
        Add an event monitor for this list, for example if the UI wants to monitor when things are added.
        type:  Currently supports "insert"
        callback:   function({target: this, detail: sig})
         */
        if (!(type in this._listeners)) this._listeners[type] = [];
        this._listeners[type].push(callback);
    }

    removeEventListener(type, callback) {
        /*
        Remove an eventListener,
        type, callback should be as supplied to addEventListener
         */
        if (!(type in this._listeners)) return;
        let stack = this._listeners[type];
        for (let i = 0, l = stack.length; i < l; i++) {
            if (stack[i] === callback) {
                stack.splice(i, 1);
                return;
            }
        }
    }

    dispatchEvent(event) {
        /* Called when event triggered by monitor or listmonitor
           Stack: KVT()|KVT.p_new => KVT.monitor => (a: Transports.monitor => YJS.monitor)(b: dispatchEvent)
         */


        console.log("PP.dispatchEvent", event);
        if (!(event.type in this._listeners)) return true;
        let stack = this._listeners[event.type];
        console.log("THIS=", this, "event.target=", event.target);
        //event.target = this;   //https://developer.mozilla.org/en-US/docs/Web/API/EventTarget but fails because target is readonly, with no apparent way to set it
        for (let i = 0, l = stack.length; i < l; i++) { //TODO-EVENTS add try/catch around this next call - like in EventListenerHandler
            stack[i].call(this, event);
        }
        return !event.defaultPrevented;
    }
}

SmartDict.table2class["pp"] = PublicPrivate;
exports = module.exports = PublicPrivate;