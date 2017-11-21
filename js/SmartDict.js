const Transportable = require("./Transportable");   //Superclass
const Dweb = require("./Dweb");

// See CommonBlock.py for Python version


class SmartDict extends Transportable {
    /*
    Subclass of Transport that stores a data structure, usually a single layer Javascript dictionary object.
    SmartDict is intended to support the mechanics of storage and retrieval while being  subclassed to implement functionality
    that understands what the data means.

    By default any fields not starting with “_” will be stored, and any object will be converted into its url.

    The hooks for encrypting and decrypting data are at this level, depending on the _acl field, but are implemented by code in CryptoLib.

    Fields:
    _acl    if set (on master) to a AccessControlList or KeyChain, defines storage as encrypted -
     */

    constructor(data, verbose, options) {
        /*
        Creates and initialize a new SmartDict.

        data	String|Object, If a string (typically JSON), then parse first.
                A object with attributes to set on SmartDict via _setdata
        options	Passed to _setproperties, by default overrides attributes set by data
         */
        super(data); // will call _setdata (which usually set fields), does not store or set _url
        this._setproperties(options);   // Note this will override any properties set with data
        if (!this.table) { this.table = "sd"; } // Set it if the data doesnt set it, should be overridden by subclasses
    }

    __setattr__(name, value) { // Call chain is ... success or constructor > _setdata > _setproperties > __setattr__
        // Subclass this to catch any field (other than _data) which has its own setter
        //Note how Signature transforms date to a string
        this[name] = value;
    }

    _setproperties(dict) { // Call chain is ... onloaded or constructor > _setdata > _setproperties > __setattr__
        if (dict) { // Ignore dict if null
            for (let prop in dict) {
                //noinspection JSUnfilteredForInLoop
                this.__setattr__(prop, dict[prop]);
            }
        }
    }

    preflight(dd) { // Called on outgoing dictionary of outgoing data prior to sending - note order of subclassing can be significant
        /*
        Default handler for preflight, strips attributes starting “_” and stores and converts objects to urls.
            Subclassed in AccessControlList and KeyPair to avoid storing private keys.
            dd	dictionary to convert..
            Returns	converted dictionary
        */
        let res = {};
        for (let i in dd) {
            if (i.indexOf('_') !== 0) { // Ignore any attributes starting _
                if (dd[i] instanceof Transportable) {
                    // Any field that contains an object will be turned into an array of urls for the object.
                    if (!dd[i].stored()) throw new Dweb.errors.CodingError("Should store subobjects before calling preflight");
                    res[i] = dd[i]._urls
                } else {
                    res[i] = dd[i];
                }
            }
        }
        // Note table is a object attribute in JS, so copied above (in Python its a class attribute that needs copying
        return res
    }

    _getdata() {
        /*
        Prepares data for sending. Retrieves attributes, runs through preflight.
            If there is an _acl field then it passes data through it for encrypting (see AccessControl library)
        Returns	String suitable for p_rawstore
        */
        let dd = {};
        for (let i in this) {
            //noinspection JSUnfilteredForInLoop don't use "of" because want inherited attributes
            dd[i] = this[i];    // This just copies the attributes not functions
        }
        let res = JSON.stringify(this.preflight(dd));
        if (this._acl) { //Need to encrypt, _acl is an object, not a url
            let encdata = this._acl.encrypt(res, true);  // data, b64
            let dic = { "encrypted": encdata, "acl": this._acl._publicurls, "table": this.table};
            res = JSON.stringify(dic);
        }
        return res
    }    // Should be being called on outgoing _data includes dumps and encoding etc

    _setdata(value) {
        /*
        Stores data, subclass this if the data should be interpreted as its stored.
        value	Object, or JSON string to load into object.
         */
        // Note SmartDict expects value to be a dictionary, which should be the case since the HTTP requester interprets as JSON
        // Call chain is ...  or constructor > _setdata > _setproperties > __setattr__
        // COPIED FROM PYTHON 2017-5-27
        value = typeof(value) === "string" ? JSON.parse(value) : value; // If its a string, interpret as JSON
        if (value && value.encrypted)
            throw new Dweb.errors.EncryptionError("Should have been decrypted in p_fetch");
        this._setproperties(value); // Note value should not contain a "_data" field, so wont recurse even if catch "_data" at __setattr__()
    }

    match(dict) {
        /*
        Checks if a object matches for each key:value pair in the dictionary.
        Any key starting with "." is treated specially esp:
        .instanceof: class: Checks if this is a instance of the class
        other fields will be supported here, any unsupported field results in a false.

        :returns: boolean, true if matches
         */
        return Object.keys(dict).every((key) => {
            return (
                (["_publicurls","_urls"].includes(key))  ? Dweb.utils.intersects(this[key], dict[key])
                :   (key[0] !== '.')            ? (this[key] === dict[key])
                :   ( key === ".instanceof")    ? (this instanceof dict[key])
                :   false)
        })
    }

    copy(verbose) {
        /*
        Copy a SmartDict or subclass, will treat "this" as a dict and add to fields, note will shallow copy, not deep copy.
        returns: new instance of SmartDict or subclass
        */
        return new this.constructor(this, verbose);
    }

    static async p_fetch(urls, verbose) {
        /*
        Fetches the object from Dweb, passes to p_decrypt in case it needs decrypting,
        and creates an object of the appropriate class and passes data to _setdata
        This should not need subclassing, (subclass _setdata or p_decrypt instead).

        :resolves: New object - e.g. StructuredBlock or MutableBlock
        :catch: TransportError - can probably, or should throw TransportError if transport fails
        :throws: TransportError if url invalid
        :errors: Authentication Error

         */
        try {
            if (verbose) console.log("SmartDict.p_fetch", urls);
            let data = await super.p_fetch(urls, verbose);  // Fetch the data Throws TransportError immediately if url invalid, expect it to catch if Transport fails
            let maybeencrypted = JSON.parse(data);          // Parse JSON
            let table = maybeencrypted.table;               // Find the class it belongs to
            let cls = Dweb[Dweb.table2class[table]];        // Gets class name, then looks up in Dweb - avoids dependency
            if (!cls) { // noinspection ExceptionCaughtLocallyJS
                throw new Dweb.errors.ToBeImplementedError("SmartDict.p_fetch: " + table + " is not implemented in table2class");
            }
            //console.log(cls);
            if (!((Dweb.table2class[table] === "SmartDict") || (cls.prototype instanceof SmartDict))) { // noinspection ExceptionCaughtLocallyJS
                throw new Dweb.errors.ForbiddenError("Avoiding data driven hacks to other classes - seeing " + table);
            }
            let decrypted = await cls.p_decrypt(maybeencrypted, verbose);    // decrypt - may return string or obj , note it can be subclassed for different encryption
            decrypted._urls = urls;                         // Save where we got it - preempts a store - must do this after decrypt
            return new cls(decrypted);
            // Returns new object that should be a subclass of SmartDict
        } catch(err) {
            console.log(`cant fetch and decrypt ${urls}`);
            throw(err);
        }
    }

    static async p_decrypt(data, verbose) {
        /*
         This is a hook to an upper layer for decrypting data, if the layer isn't there then the data wont be decrypted.
         Chain is SD.p_fetch > SD.p_decryptdata > ACL|KC.decrypt, then SD.setdata

         :param data: possibly encrypted object produced from json stored on Dweb
         :return: same object if not encrypted, or decrypted version
         */
        return await Dweb.AccessControlList.p_decryptdata(data, verbose);
    }

}

exports = module.exports = SmartDict;
