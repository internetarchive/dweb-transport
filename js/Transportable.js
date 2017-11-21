// ######### Parallel development to CommonBlock.py ########
const Dweb = require("./Dweb");

class Transportable {
    /*
    Based on Transportable class in python - generic base for anything transportable.

    Fields
    _urls   Array of URLs of data stored //TODO-API-MULTI
    _data   Data (if its opaque)
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

    stored() {  // Check if stored
        return !!(this._urls && this._urls.length);
    }
    async p_store(verbose) {
        /*
        Store the data on Dweb, if it has not already been, stores any urls in _url field
        Resolves to	obj //TODO-API
         */
        try {
            if (this.stored())
                return this;  // No-op if already stored, use dirty() if change after retrieved
            let data = this._getdata();
            if (verbose) console.log("Transportable.p_store data=", data);
            this._urls = await Promise.all(Dweb.Transport.validFor(undefined, "store").map(([u,t])=>t.p_rawstore(data, verbose)));   //TODO-MULTI might be smarter about not waiting
            if (verbose) console.log("Transportable.p_store urls=", this._urls);
            return this;
        } catch (err) {
            console.log("p_store failed");
            throw err;
        }
    }

    dirty() {
        /*
        Mark an object as needing storing again, for example because one of its fields changed.
        Flag as dirty so needs uploading - subclasses may delete other, now invalid, info like signatures
        */
        this._urls = [];
    }

    static async p_fetch(urls, verbose) { //TODO-API-MULTI
        /*
        Fetch the data for a url, subclasses act on the data, typically storing it.
        urls:	array of urls to retrieve (any are valid)
        returns:	string - arbitrary bytes retrieved.
        throws:     err from last transport tried on failure (TODO-MULTI maybe should be first transport as that is preferred)
         */
        let tt = Dweb.Transport.validFor(urls, "fetch"); //[ [u,t],[u,t]]
        if (!tt.length) {
            throw new Dweb.errors.TransportError("Transport.p_fetch cant find any transport for urls: " + urls);
        }
        //With multiple transports, it should return when the first one returns something.
        let lasterr;
        for (const [url, t] of tt) {
            try {
                let res = await t.p_rawfetch(url, verbose);
                if (res) {
                    return res; //TODO-MULTI-GATEWAY potentially copy from success to failed URLs.
                }
            } catch (err) {
                lasterr = err;
                console.log("Could not retrieve ", url, "from", t.name, err.message);
                // Don't throw anything here, loop round for next, only throw if drop out bottom
                //TODO-MULTI-GATEWAY potentially copy from success to failed URLs.
            }
        }
        throw lasterr;  //Throw err from last transport attempt.
    }

    file() { throw new Dweb.errors.ToBeImplementedError("Undefined function Transportable.file"); } //TODO-BACKPORT from Python
    content() { throw new Dweb.errors.IntentionallyUnimplementedError("Intentionally undefined function Transportable.content - superclass should define"); }
    p_updatelist() { throw new Dweb.errors.IntentionallyUnimplementedError("Intentionally undefined function Transportable.p_updatelist - meaningless except on CL"); }


    // Note for tests, best to use Block.test()
}
exports = module.exports = Transportable;

