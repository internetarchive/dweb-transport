// ######### Parallel development to CommonBlock.py ########
const Dweb = require("./Dweb");

//FILE REVIEWED FOR URLS STILL HAS STUFF NEEDED SEE COMMENTS

class Transportable {
    /*
    Based on Transportable class in python - generic base for anything transportable.

    Fields
    _urls   Array of URLs of data stored
    _data   Data (if its opaque)
     */

    constructor(data) {
        /*
        Construct a new Transportable object,
        data	object to store as fields of the object, if it's a object we are constructing and will store.
         */
        this._setdata(data); // The data being stored - note _setdata usually subclassed
    }

    transports() { //TODO-API  //TODO-API-MULTI //TODO-MULTI check all callers (was "transport")
        /*
        Find transport for this object,
        if not yet stored this._url will be undefined and will return any available transports

        returns: instance of subclass of Transport
        */
        return Dweb.Transport.validFor(this._urls); //TODO-MULTI check Dweb.transport=>transports to handle plural
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

    stored() {  // Check if stored  //TODO-MULTI all checks for stored should use this rather than testing this._url
        return (this._urls && this._urls.length) ? true : false
    }
    async p_store(verbose) {    // Python has a "data" parameter to override this._data but probably not needed
        /*
        Store the data on Dweb, if it has not already been.

        It calculates and store the url in _url immediately before starting the asynchronous storage and returning the Promise, and then checks the underlying transport agrees on the url variable. This allows a caller to use the url before the storage has completed.
        Resolves to	string: url of data stored
         */
        try {
            if (this.stored())
                return this;  // No-op if already stored, use dirty() if change after retrieved
            let data = this._getdata();
            if (verbose) console.log("Transportable.p_store data=", data);
            this._urls = await Promise.all(this.transports().map((t)=>t.p_rawstore(data, verbose)));   //TODO-MULTI might be smarter about not waiting
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
        this._urls = [];    //TODO-MULTI make sure at initialization it does this
    }

    static p_fetch(urls, verbose) { //TODO-API-MULTI //TODO-MULTI check all callers and subclasses and switch to using urls
        /*
        Fetch the data for a url, subclasses act on the data, typically storing it.
        urls:	array of urls to retrieve (any are valid)
        returns:	string - arbitrary bytes retrieved.
         */
        let tt = Dweb.Transport.validFor(urls);
        if (!t.length) throw new Dweb.errors.TransportError("Transport.p_fetch cant find any transport for urls: "+urls);
        //With multiple transports, it should return when the first one returns something.
        return Promise.any(tt.map((t)=>t.p_rawfetch(urls, verbose))) // Fetch the data Throws TransportError immediately if url invalid, expect it to catch if Transport fails
    }

    file() { throw new Dweb.errors.ToBeImplementedError("Undefined function Transportable.file"); } //TODO-BACKPORT from Python
    content() { throw new Dweb.errors.IntentionallyUnimplementedError("Intentionally undefined function Transportable.content - superclass should define"); }
    p_updatelist() { throw new Dweb.errors.IntentionallyUnimplementedError("Intentionally undefined function Transportable.p_updatelist - meaningless except on CL"); }


    // Note for tests, best to use Block.test()
}
exports = module.exports = Transportable;

