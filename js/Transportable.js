const errors = require('./Errors'); // Standard Dweb Errors
const Transports = require('./Transports'); // Manage all Transports that are loaded

class Transportable {
    /*
    Based on Transportable class in python - generic base for anything transportable.

    Fields
    _urls   Array of URLs of data stored
    _data   Data (if its opaque)
    table   Name of class as looked up in Dweb.table2class
     */

    constructor(data) {
        /*
        Construct a new Transportable object,
        data	object to store as fields of the object, if it's a object we are constructing and will store.
         */
        this._urls = []; // Empty URLs - will be loaded by SmartDict.p_fetch if loading from an URL
        this._setdata(data); // The data being stored - note _setdata usually subclassed
    }

    _setdata(data) {
        /*
        data	object, stored in data field - subclassed by SmartDict
         */
        this._data = data;  // Default behavior, assumes opaque bytes, and not a dict - note subclassed in SmartDict
    }
    _getdata() {
        /*
        Returns	Contents of _data field
         */
        return this._data;  // Default behavior - opaque bytes
    }

    stored() {  // Check if stored (Note overridden in KeyValue to use a _dirty flag)
        return !!(this._urls && this._urls.length);
    }

    async p_store(verbose) {
        /*
        Store the data on Dweb, if it has not already been, stores any urls in _url field
        Resolves to	obj
        Throws TransportError if no transports or unable to fetch, leaves in !stored state (empty _urls field)
         */
        try {
            if (this.stored())
                return this;  // No-op if already stored, use dirty() if change after retrieved
            let data = this._getdata();
            if (verbose) console.log("Transportable.p_store data=", data);
            this._urls = await Transports.p_rawstore(data, verbose);
            if (verbose) console.log("Transportable.p_store urls=", this._urls);
            return this;
        } catch (err) {
            console.log("p_store failed");
            throw err;
        }
    }

    dirty() {  //(Note overridden in KeyValue to use a _dirty flag)
        /*
        Mark an object as needing storing again, for example because one of its fields changed.
        Flag as dirty so needs uploading - subclasses may delete other, now invalid, info like signatures
        */
        this._urls = [];
    }

    static async p_fetch(urls, verbose) { //TODO-IPFSIMAGE Propogate API
        /*
        Fetch the data for a url, subclasses act on the data, typically storing it.
        urls:	array of urls to retrieve (any are valid)
        returns:	string - arbitrary bytes retrieved or possibly Buffer or sometimes even an object (like a dictionary)
        throws:     TransportError with messages of any errors if none succeeded
         */
        return Transports.p_rawfetch(urls, {verbose});
    }

    file() { throw new errors.ToBeImplementedError("Undefined function Transportable.file"); } //TODO-BACKPORT from Python
    content() { throw new errors.IntentionallyUnimplementedError("Intentionally undefined function Transportable.content - superclass should define"); }
    p_updatelist() { throw new errors.IntentionallyUnimplementedError("Intentionally undefined function Transportable.p_updatelist - meaningless except on CL"); }


    // Note for tests, best to use Block.test()
}
exports = module.exports = Transportable;

