const Transportable = require("./Transportable");   //Superclass
const Dweb = require("./Dweb");

//TODO-IPFS change to go direct to Dag rather than Block - maybe by making Transport.p_store decide ?

// See CommonBlock.py for Python version

class SmartDict extends Transportable {
    constructor(data, verbose, options) {
        // data = json string or dict
        super(data); // _url is _url of SmartDict, not of data - will call _setdata (which usually set fields), -note does not fetch the has, but sets _needsfetch
        this._setproperties(options);   // Note this will override any properties set with data
        if (!this.table) { this.table = "sd"; } // Set it if the data doesnt set it, should be overridden by subclasses
    }

    __setattr__(name, value) { // Call chain is ... success or constructor > _setdata > _setproperties > __setattr__
        // Subclass this to catch any field (other than _data) which has its own setter
        //TODO-DATE Need a javascript equivalent way of transforming date
        // if (name[0] != "_") {
        //    if "date" in name and isinstance(value,basestring):
        //        value = dateutil.parser.parse(value)
        //}
        //TODO - instead of calling "setter" automatically, assuming that __setattr__ in each class does so.
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
        let res = {};
        for (let i in dd) {
            if (i.indexOf('_') !== 0) { // Ignore any attributes starting _
                if (dd[i] instanceof Transportable) {
                    dd[i].p_store(false);  // Stores async, but sets url first if you need it stored first then do so before calling p_store
                    res[i] = dd[i]._url
                } else {
                    res[i] = dd[i];
                }
            }
        }
        // Note table is a object attribute in JS, so copied above (in Python its a class attribute that needs copying
        return res
    }

    _getdata() {
        let dd = {};
        for (let i in this) {
            //noinspection JSUnfilteredForInLoop don't use "of" because want inherited attributes
            dd[i] = this[i];    // This just copies the attributes not functions
        }
        let res = this.transport().dumps(this.preflight(dd));
        if (this._acl) { //Need to encrypt
            let encdata = this._acl.encrypt(res, true);  // data, b64
            let dic = { "encrypted": encdata, "acl": this._acl._publicurl, "table": this.table};
            res = this.transport().dumps(dic);
        }
        return res
    }    // Should be being called on outgoing _data includes dumps and encoding etc

    _setdata(value) {
        // Note SmartDict expects value to be a dictionary, which should be the case since the HTTP requester interprets as JSON
        // Call chain is ...  or constructor > _setdata > _setproperties > __setattr__
        // COPIED FROM PYTHON 2017-5-27
        value = typeof(value) === "string" ? this.transport().loads(value) : value; // If its a string, interpret as JSON
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
            return      (key[0] !== '.'             ? (this[key] === dict[key])
                :   ( key === ".instanceof")    ? (this instanceof dict[key])
                    :   false)
        })
    }


    static p_fetch(url, verbose) {
        /*
            Fetch a block which initially we don't know which type
            See also p_fetchlist, p_list_then_current, p_list_then_elements

            :resolves: New object - e.g. StructuredBlock or MutableBlock
            :catch: TransportError - can probably, or should throw TransportError if transport fails
            :throws: TransportError if url invalid
            :errors: Authentication Error

         */
        if (verbose) console.log("SmartDict.p_fetch", url);
        let cls;
        return super.p_fetch(url, verbose) // Fetch the data Throws TransportError immediately if url invalid, expect it to catch if Transport fails
            .then((data) => {
                data = Dweb.transport(url).loads(data);      // Parse JSON //TODO-REL3 maybe function in Transportable
                let table = data.table;              // Find the class it belongs to
                cls = Dweb[Dweb.table2class[table]];         // Gets class name, then looks up in Dweb - avoids dependency
                if (!cls) throw new Dweb.errors.ToBeImplementedError("SmartDict.p_fetch: "+table+" isnt implemented in table2class");
                //console.log(cls);
                if (!((Dweb.table2class[table] === "SmartDict") || (cls.prototype instanceof SmartDict))) throw new Dweb.errors.ForbiddenError("Avoiding data driven hacks to other classes - seeing "+table);
                return data;
            })
            .then((data) => cls.p_decrypt(data, verbose))    // decrypt - may return string or obj , note it can be suclassed for different encryption
            .then((data) => {
                    data._url = url;                         // Save where we got it - preempts a store - must do this afer decrypt
                    return new cls(data);
            })                // Returns new block that should be a subclass of SmartDict
            .catch((err) => {console.log("cant fetch and decrypt unknown"); throw(err)});
    }

    static p_decrypt(data, verbose) {
        /*
         This is a hook to an upper layer for decrypting data, if the layer isn't there then the data wont be decrypted.
         Chain is SD.p_fetch > SD.p_decryptdata > ACL|KC.decrypt, then SD.setdata

         :param data: possibly encrypted object produced from json stored on Dweb
         :return: same object if not encrypted, or decrypted version
         */
        return (Dweb.AccessControlList && Dweb.AccessControlList.p_decryptdata) ?  Dweb.AccessControlList.p_decryptdata(data, verbose) : data
    }

}

exports = module.exports = SmartDict;
