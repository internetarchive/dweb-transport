const PublicPrivate = require("./PublicPrivate"); //for extends
const Dweb = require("./Dweb");
const CustomEvent = require('custom-event'); // From web, Not present in node - this code uses global.CustomEvent if it exists so safe on browser/node

class KeyValueTable extends PublicPrivate {
    /*
    Manages a KeyValue object intended for each field to be a separate item

    Fields:
    _autoset:       When set to true, any changes will be stored to server its set after p_new writes initial data

    Fields Inherited from PublicPrivate:
    _urls           The urls of the table e.g. YJS where keys will be stored
    tableurls       Urls needed to write to the table
    tablepublicurls Urls needed to read from the table, e.g. YJS which can be retrieved from.
    keypair         Isn't used yet ... but will be by Superclasses
    _map           Where the KV mapping is stored.

    Three ordering use cases
    a) Create new object via p_new, store it the setart setting
    b) Retrieve object via SmartDict - want to start monitor after get, and start set
    TODO-KEYVALUE think through whether we need a Private Key (other than in the url) and if so, where its stored and whether need another pointer to get it. (or maybe even store it encrypted with acl)

    Comments on functions in subclasses.
    p_store - default in PublicPrivate will store public and private versions, which isnt what we want so override here.
     */

    constructor(data, master, key, verbose, options) {
        super(data, master, key, verbose, options);
        this.table = "keyvaluetable"; // Superclasses may override
        if (typeof this._autoset === "undefined") {
            // If we haven't explicitly set _autoset then set if it looks like we are a master with a table to connect to.
            this._autoset = this._master && this["tablepublicurls"] && this.tablepublicurls.length
        }
        if (this.tablepublicurls && this.tablepublicurls.length) {
            this.monitor(verbose);
        }
        this._map = this._map || {};
    }

    static async p_new(data, master, key, verbose, options) {
        // p_fetch is standard via SmartDict - gets passed to TransportYJS etc which returns a dict which goes to constructor
        // options: {keyvaluetable} Which table at the DB to store this in
        const keyvaluetable = options.keyvaluetable;  // Dont store this, use it to generate newtable
        delete options.keyvaluetable;
        const obj = await super.p_new(data, master, key, verbose, options);
        // Should set this._autoset to true if and only if master && urls set in data or options
        if (master && !(obj.tablepublicurls && obj.tablepublicurls.length)) {
            const res = await Dweb.Transports.p_newtable(obj, keyvaluetable);
            obj.tableurls = res.privateurls;
            obj.tablepublicurls = res.privateurls;
            obj._autoset = true;
            await obj.p_store();
        }
        if (obj.tablepublicurls.length) {
            await obj.p_getall(); // Load it up, this will have side-effect of connecting YJS etc.
            obj.monitor(verbose);
        }
        return obj;
    }

    _storageFromMap(mapVal) {
        /*
        Convert a value as stored on a transport medium into a value suitable for the _map dictionary. Pair of _storageFromMap.
        This is working from the assumption that the underlying transport needs a JSON string to store.
        If change that assumption - and store Objects - then these two functions should be only place that needs changing.
        This pair should be able to be subclassed safely as long as _mapFromStorage(_storageFromMap(x)) == x for your definition of equality.
         */
        if (mapVal instanceof Dweb.Transportable) {
            return mapVal._getdata();               // This should also take care of not storing unencrypted private keys, and encrypting if requested.
        } else {
            return JSON.stringify(mapVal)
        }
    }
    _mapFromStorage(storageVal, verbose=false) {
        /*
        Convert a value as stored in the map into a value suitable for storage dictionary. Pair of _mapFromStorage.
         */
        let obj = storageVal && JSON.parse(storageVal);   // Could be a string, or an integer, or a object or array of any of these
        if (Array.isArray(obj)) {
            return obj.map( m => this._storageFromMap(m))
        } else if (typeof(obj) === "object") {
            if (obj["table"]) {
                obj = Dweb.SmartDict._sync_after_fetch(obj, [], verbose);   // Convert object to subclass of Transportable, note cant decrypt as sync
            }
            //else If no "table" field, then just return the object.
        }
        //else  if its not an object, return the string or integer.
        return obj;
    }
    preflight(dd) {
        let master = dd._master; //Save before super.preflight
        dd = super.preflight(dd);  // Edits dd in place, in particular deletes anything starting with _
        if (! master) {
            delete dd.tableurls
        }
        return dd;
    }



    async p_set(name, value, {verbose=false, fromNet=false}={}) {
        // Subclased in Domain to avoid overwriting private version with public version from net
        //TODO-KEYVALUE these sets need to be signed
        if (this._autoset && !fromNet && (this._map[name] !== value)) {
            Dweb.Transports.p_set(this.tableurls, name, this._storageFromMap(value), verbose); // Note this is aync and not waiting for result
        }
        if (!((value instanceof Dweb.PublicPrivate) && this._map[name] && this._map[name]._master)) {
            // Dont overwrite the name:value pair if we already hold the master copy. This is needed for Domain, but probably generally useful
            // The typical scenario is that a p_set causes a monitor event back on same machine, but value is the public version
            this._map[name] = value;
        }
        //TODO_KEYVALUE copy semantics from __setattr_ for handling Dates, maybe other types
    }
    _updatemap(res) {
        Object.keys(res).map(key => { this._map[key] = this._mapFromStorage(res[key])});
    }
    async p_get(keys, verbose) {
        /*
        keys:   single key or array of keys
         */
        if (!Array.isArray(keys)) { // Handle single by doing plural and returning the key
            return (await this.p_get([keys], verbose))[keys]
        }
        if (!keys.every(k => this._map[k])) {
            // If we dont have all the keys, get from transport
            const res = await Dweb.Transports.p_get(this.tablepublicurls, keys, verbose);
            this._updatemap(res);
        }
        // Return from _map after possibly updating it
        let map = this._map;
        return keys.reduce(function(prev, key) { prev[key] = map[key]; return prev; }, {});
    }
    async p_keys(verbose) {
        /*
        returns array of all keys
         */
        return await Dweb.Transports.p_keys(this.tablepublicurls, verbose)
    }
    async p_getall(verbose) {
        /*
        returns dictionary of all keys
         */
        const res = await Dweb.Transports.p_getall(this.tablepublicurls, verbose);
        this._updatemap(res);
        return this._map;
    }

    async p_delete(name, {fromNet=false, verbose=false}={}) {
        delete this._map[name]; // Delete locally
        if (!fromNet) {
            Dweb.Transports.delete(this.tablepublicurls, name, verbose);    // and remotely.
        }
    }
    //get(name, default) cant be defined as overrides this.get()

    // ----- Listener interface ----- see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget for the pattern
    monitor(verbose) {
        /*
        Add a monitor for each transport - note this means if multiple transports support it, then will get duplicate events back if everyone else is notifying all of them.
         */
        if (verbose) console.log("Monitoring", this.tablepublicurls);
        Dweb.Transports.monitor(this.tablepublicurls,
            (event) => {    // event of form {type, key, value} with value being an obj, so already done JSON.parse (see YJS for example)
                if (verbose) console.log("KVT monitor",event,this.tablepublicurls);
                switch (event.type) {
                    case "set": // YJS mapped from ad
                        this.p_set(event.key, this._mapFromStorage(event.value), {fromNet: true, verbose: verbose}); // Loop broken in set if value unchanged
                        break;
                    case "delete":
                        if (!["tablepublicurls", "tableurls"].includes(event.key)) { //Potentially damaging, may need to check other fields
                            this.p_delete(event.key, {fromNet: true, verbose: verbose});
                        }
                        break;
                }
                this.dispatchEvent(new CustomEvent(event.type, {target: this, detail: event}));   // Pass event on to application after updating local object
            },
            verbose);
    }


    static async p_test(verbose) {
        if (verbose) console.log("KeyValueTable testing starting");
        try {
            let masterobj = await this.p_new({name: "TEST KEYVALUETABLE", _allowunsafestore: true}, true, {passphrase: "This is a test this is only a test of VersionList"}, verbose, { keyvaluetable: "TESTTABLENAME"});
            await masterobj.p_set("address","Nowhere", verbose);
            let publicobj = await Dweb.SmartDict.p_fetch(masterobj._publicurls, verbose);
            await publicobj.p_getall(); // Load from table
            console.assert(publicobj._map["address"] === "Nowhere"); // Shouldnt be set yet
            await masterobj.p_set("address","Everywhere", verbose);
            await delay(500);
            if (Dweb.Transports.validFor(masterobj.tablepublicurls, "monitor").length) {
                console.assert(publicobj._map["address"] === "Everywhere"); // Should be set after allow time for monitor event
            } else {
                console.log('Loaded transports dont support "monitor"');
            }
        } catch (err) {
            console.log("Caught exception in KeyValueTable.test", err);
            throw(err)
        }
    }


}
function delay(ms, val) { return new Promise(resolve => {setTimeout(() => { resolve(val); },ms)})}


exports = module.exports = KeyValueTable;
