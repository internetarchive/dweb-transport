const PublicPrivate = require("./PublicPrivate"); //for extends
const Dweb = require("./Dweb");
const CustomEvent = require('custom-event'); // From web, Not present in node - this code uses global.CustomEvent if it exists so safe on browser/node

class KeyValueTable extends PublicPrivate {
    //TODO-NAME redo this so data stored in a sub-field and add set, get, delete functions
    /*
    Manages a KeyValue object intended for each field to be a separate item

    Fields:
    keyvaluetable:  Name of table (in database) to store in
    _autoset:       When set to true, any changes will be stored to server its set after p_new writes initial data

    Fields Inherited from PublicPrivate:
    _urls           The urls of the table e.g. YJS where keys will be stored
    _publicurls     The urls of the table, e.g. YJS which can be retrieved from.
    keypair         Isn't used yet ... but will be by Superclasses
    _map           Where the KV mapping is stored.

    Note unlike CommonLists which have _urls, _publicurls for the metadata and listurls listpublicurls for the list itself,
    this just has _urls _publicurls as the data is completely specified in the table.


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
            this._autoset = this._master && this.keyvaluetable && this._urls.length
        }
        if (this._urls.length) {
            this.monitor(verbose);
        }
        this._map = this._map || {};
    }

    static async p_new(data, master, key, verbose, options) {
        // p_fetch is standard via SmartDict - gets passed to TransportYJS etc which returns a dict which goes to constructor
        let obj = await super.p_new(data, master, key, verbose, options);
        // Should set this._autoset to true if and only if master && keyvaluetable set in data or options
        if (master && !obj._urls.length) {
            let res = await Dweb.Transports.p_newtable(obj, obj.keyvaluetable);
            obj._urls = res.privateurls;
            obj._publicurls = res.privateurls;
            obj._autoset = true;
            await obj.p_store();
        }
        if (obj.keyvaluetable && obj._urls.length) {
            obj.monitor(verbose);
        }
        return obj;
    }

    preflight(dd) {
        dd._master = false;  // There is no privateversion
        return super.preflight(dd); //TODO-KEYVALUE may need to process map to turn links into urls
    }
    async p_store(verbose) {
        /*
        Unlike PP and SD _urls should already have been set
        */
        if (! (this._master && this._urls.length))
            // If this assumption isnt true then maybe want to do a p_newtable here if master and not set
            throw new Dweb.errors.CodingError("Assumed cant store unless master and already have table");
        await Dweb.Transports.p_set(this._urls, this._map, null, verbose )   // Set whole dictionary
    }

    async p_set(name, value, verbose) {
        if (this._autoset && (this._map[name] !== value)) {
            Dweb.Transports.p_set(this._urls, name, value, verbose); // Note this is aync and not waiting for result
        }
        this._map[name] = value;
        //TODO_KEYVALUE copy semantics from __setattr_ for handling Dates, maybe other types
    }
    async p_get(keys, verbose) {
        /*
        keys:   single key or array of keys
         */
        return await Dweb.Transports.p_get(this._publicurls, keys, verbose)
    }
    async p_keys(verbose) {
        /*
        returns array of all keys
         */
        return await Dweb.Transports.p_keys(this._publicurls, verbose)
    }
    async p_getall(verbose) {
        /*
        returns dictionary of all keys
         */
        return Dweb.Transports.p_getall(this._publicurls, verbose)
    }

    async p_delete(name) {
        delete this._map[name];
    }
    //get(name, default) cant be defined as overrides this.get()

    // ----- Listener interface ----- see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget for the pattern
    monitor(verbose) {
        /*
        Add a monitor for each transport - note this means if multiple transports support it, then will get duplicate events back if everyone else is notifying all of them.
         */
        if (verbose) console.log("Monitoring", this._publicurls);
        Dweb.Transports.monitor(this._publicurls,
            (event) => {    // event of form {type, key, value} with value being an obj, so already done JSON.parse (see YJS for example)
                if (verbose) console.log("KVT monitor",event,this._publicurls);
                switch (event.type) {
                    case "set": // YJS mapped from ad
                        this.p_set(event.key, event.value); // Loop broken in set if value unchanged
                        break;
                    case "delete":
                        if (!["_publicurls", "_urls"].includes(event.key)) { //Potentially damaging, may need to check other fields
                            this.p_delete(event.key);
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
            let masterobj = await this.p_new({name: "TEST KEYVALUETABLE", _allowunsafestore: true, keyvaluetable: "TESTTABLENAME"}, true, {passphrase: "This is a test this is only a test of VersionList"}, verbose);
            let privateurls = masterobj._urls;
            let publicurls = masterobj._publicurls;
            await masterobj.p_set("address","Nowhere", verbose);
            let publicobj = await Dweb.SmartDict.p_fetch(publicurls, verbose);
            console.assert(publicobj._map["address"] === "Nowhere"); // Shouldnt be set yet
            await masterobj.p_set("address","Everywhere", verbose);
            await delay(500);
            if (Dweb.Transports.validFor(publicurls, "monitor").length) {
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
