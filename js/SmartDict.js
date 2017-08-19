const Transportable = require("./Transportable");   //Superclass
const Dweb = require("./Dweb");

//TODO-IPFS change to go direct to Dag rather than Block - maybe by making Transport.p_store decide ?

//TODO-SEPERATE - move these to Dweb
const table2class = { // Each of these needs a constructor that takes hash, data and is ok with no other parameters, (otherwise define a set of these methods as factories)
    "cl": "CommonList",
    "sb": "StructuredBlock",
    "kc": "KeyChain",
    "kp": "KeyPair",
    "mb": "MutableBlock",
    "acl": "AccessControlList",
    "sd": "SmartDict",
    //"accesscontrollistentry", AccessControlListEntry - not listed as AccessControlListEntry is not exposed
};


// See CommonBlock.py for Python version

class SmartDict extends Transportable {
    constructor(hash, data, verbose, options) {
        // data = json string or dict
        super(hash, data); // _hash is _hash of SmartDict, not of data - will call _setdata (which usually set fields), -note does not fetch the has, but sets _needsfetch
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
        this[name] = value; //TODO: Python-Javascript: In Python can assume will get methods of property e.g. _data, in javascript need to be explicit here, or in caller.
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
                    dd[i].p_store(false);  // Stores async, but sets hash first if you need it stored first then do so before calling p_store
                    res[i] = dd[i]._hash
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
            //noinspection JSUnfilteredForInLoop
            dd[i] = this[i];    // This just copies the attributes not functions
        }
        let res = Dweb.transport.dumps(this.preflight(dd));
        if (this._acl) { //Need to encrypt
            let encdata = this._acl.encrypt(res, true);  // data, b64
            let dic = { "encrypted": encdata, "acl": this._acl._publichash, "table": this.table};
            res = Dweb.transport.dumps(dic);
        }
        return res
    }    // Should be being called on outgoing _data includes dumps and encoding etc

    _setdata(value) {
        // Note SmartDict expects value to be a dictionary, which should be the case since the HTTP requester interprets as JSON
        // Call chain is ...  or constructor > _setdata > _setproperties > __setattr__
        // COPIED FROM PYTHON 2017-5-27
        value = typeof(value) === "string" ? Dweb.transport.loads(value) : value; // If its a string, interpret as JSON
        console.assert(!( value && value.encrypted), "Should have been decrypted in p_fetch");
        this._setproperties(value); // Note value should not contain a "_data" field, so wont recurse even if catch "_data" at __setattr__()
    }

    /*OBS moved into CL.p_signandstore
    sign(commonlist, verbose) {
        /-*
         Sign, subclasses will probably add to a list.
         Note if this object has a _acl field it will be encrypted first, then the hash of the encrypted block used for signing.
         :param CommonList commonlist:   List its going on - has a ACL with a private key
         :return: sig so that CommonList can add to _list
         *-/
        console.assert(this._hash, "Items should be stored before signing")
        console.assert(commonlist._publichash, "List should be stored before signing", commonlist)
        return Dweb.Signature.sign(commonlist, this._hash, verbose); // Typically, but not necessarily added to commonlist
    }
    */

    p_fetch(verbose) {
        // See also p_fetch_then_list, p_fetch_then_list_then_current, p_fetch_then_list_then_elements
        // as in CL etc need to fetch body and only then fetchlist since for a list the body might include the publickey whose hash is needed for the list
        // :errors: Authentication Error
        let self = this;
        if (this._needsfetch) { // Only load if need to
            if (verbose) { console.log("SmartDict.p_fetch:",this._hash)}
            this._needsfetch = false;
            return Dweb.transport.p_rawfetch(this._hash, verbose)   //TODO-IPFS change to use dag storage
                .then((data) => self.constructor.p_decrypt(Dweb.transport.loads(data), verbose))
                .then((data) => { self._setdata(data); return self;})
                .catch((err) => { console.log("Unable to fetch",this._hash,err); throw(err); })
        } else {
            return new Promise((resolve, reject)=> resolve(self));  // I think this should be a noop - fetched already
        }
    }

    static p_unknown_fetch(hash, verbose) {
        /*
            Fetch a block which initially we don't know which type
            :resolves: New object - e.g. StructuredBlock or MutableBlock
            :catch: TransportError - can probably, or should throw TransportError if transport fails
            :throws: TransportError if hash invalid
            Errors: Doesn't find class should be handled seperately from can't encrypt
         */
        if (verbose) console.log("SmartDict.p_unknown_fetch", hash);
        let cls;
        return Dweb.transport.p_rawfetch(hash, verbose) // Fetch the data Throws TransportError immediately if hash invalid, expect it to catch if Transport fails
            .then((data) => {
                data = Dweb.transport.loads(data);      // Parse JSON
                let table = data["table"];              // Find the class it belongs to
                cls = Dweb[table2class[table]];         // Gets class name, then looks up in Dweb - avoids dependency
                console.assert(cls, "SmartDict.p_unknown_fetch:",table,"isnt implemented in table2class"); //TODO Should probably raise a specific subclass of Error
                //console.log(cls);
                console.assert((table2class[table] === "SmartDict") || (cls.prototype instanceof SmartDict), "Avoid data driven hacks to other classes")
                return data;
            })
            .then((data) => cls.p_decrypt(data, verbose))    // decrypt - may return string or obj , note it can be suclassed for different encryption
            .then((data) => { return new cls(hash, data)})                // Returns new block that should be a subclass of SmartDict
            .catch((err) => {console.log("cant fetch and decrypt unknown"); throw(err)});
    }

    static p_decrypt(data, verbose) {
        // This is a hook to an upper layer for decrypting data, if the layer isn't there then the data wont be decrypted.
        return (Dweb.CryptoLib && Dweb.CryptoLib.p_decryptdata) ?  Dweb.CryptoLib.p_decryptdata(data, verbose) : data
    }

}

exports = module.exports = SmartDict;
