// ######### Parallel development to CommonBlock.py ########
const Dweb = require("./Dweb");

class Transportable {
    /*
    Based on Transportable class in python - generic base for anything transportable.

    Fields
    _url   URL of data stored
    _data   Data (if its opaque)
    _needsfetch True if need to fetch from Dweb
     */




    constructor(data) {
        this._setdata(data); // The data being stored - note _setdata usually subclassed
    }

    transport() { //TODO-REL4-API
        /*
        Find transport for this object,
        if not yet stored this._url will be undefined and will return default transport

        returns: instance of subclass of Transport
        */
        return Dweb.transport(this._url);
    }

    _setdata(value) {
        this._data = value;  // Default behavior, assumes opaque bytes, and not a dict - note subclassed in SmartDict
    }
    _getdata() {
        return this._data;  // Default behavior - opaque bytes
    }

    p_store(verbose) {    // Python has a "data" parameter to override this._data but probably not needed
        if (this._url)
            return new Promise((resolve, reject)=> resolve(this));  // Noop if already stored, use dirty() if change after retrieved
        let data = this._getdata();
        if (verbose) console.log("Transportable.p_store data=", data);
        this._url = this.transport().url(data); //store the url since the HTTP is async (has form "ipfs:/ipfs/xyz123" or "BLAKE2.xyz123"
        if (verbose) console.log("Transportable.p_store url=", this._url);
        let self = this;
        return this.transport().p_rawstore(data, verbose)
            .then((msg) => {
                if (msg !== self._url) {
                    console.log("Transportable.p_store: ERROR URL returned ",msg,"doesnt match url expected",self._url);
                    throw new Dweb.errors.TransportError("URL returned "+msg+" doesnt match url expected "+self._url)
                }
                return(msg); // Note this will be a return from the promise.
            }) // Caller should handle error and success
    }

    dirty() {   // Flag as dirty so needs uploading - subclasses may delete other, now invalid, info like signatures
        this._url = null;
    }

    static p_fetch(url, verbose) {
        return Dweb.transport(url).p_rawfetch(url, verbose) // Fetch the data Throws TransportError immediately if url invalid, expect it to catch if Transport fails
    }

    file() { console.assert(false, "XXX Undefined function Transportable.file"); }
    url() { console.assert(false, "XXX Undefined function Transportable.url"); }
    content() { console.log("Intentionally undefined function Transportable.content - superclass should define"); }
    p_updatelist() { console.log("Intentionally undefined function Transportable.p_updatelist - meaningless except on CL"); }

    // ==== UI method =====

    p_elem(el, verbose, successmethodeach) {
        // NOte this looks a little odd from the Promise perspective and might need work, assuming nothing following this and nothing to return
        // TODO-IPFS may want to get rid of successmethodeach and use a Promise.all in the caller.
        // Called from success methods
        //successeach is function to apply to each element, will be passed "this" for the object being stored at the element.
        if (typeof el === 'string') {
            el = document.getElementById(el);
        }
        let data = this.content(verbose);
        if (typeof data === 'string') {
            if (verbose) {
                console.log("elem:Storing data to element", el, encodeURI(data.substring(0, 20)));
            }
            el.innerHTML = data;
            if (successmethodeach) {
                let methodname = successmethodeach.shift();
                //if (verbose) console.log("p_elem",methodname, successmethodeach);
                this[methodname](...successmethodeach); // Spreads successmethod into args, like *args in python
            }
        } else if (Array.isArray(data)) {
            if (verbose) {
                console.log("elem:Storing list of len", data.length, "to element", el);
            }
            this.p_updatelist(el, verbose, successmethodeach);  //Note cant do success on updatelist as multi-thread //TODO using updatelist not replacing
        } else {
            console.log("ERROR: unknown type of data to elem", typeof data, data);
        }
        if (verbose) console.log("EL set to", el.textContent);
    }

    // Note for tests, best to use Block.test()
}
exports = module.exports = Transportable;

