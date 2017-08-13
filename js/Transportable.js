// ######### Parallel development to CommonBlock.py ########
const Dweb = require("./Dweb");

class Transportable {
    /*
    Based on Transportable class in python - generic base for anything transportable.

    Fields
    _hash   Hash of data stored
    _data   Data (if its opaque)
    _needsfetch True if need to fetch from Dweb
     */




    constructor(hash, data) {
        this._hash = hash;  // Hash of the _data
        this._setdata(data); // The data being stored - note _setdata usually subclassed
        if (hash && !data) { this._needsfetch = true; }
    }

    _setdata(value) {
        this._data = value;  // Default behavior, assumes opaque bytes, and not a dict - note subclassed in SmartDict
    }
    _getdata() {
        return this._data;  // Default behavior - opaque bytes
    }

    p_store(verbose) {    // Python has a "data" parameter to override this._data but probably not needed
        let data = this._getdata();
        if (verbose) console.log("Transportable.p_store data=", data);
        this._hash = Dweb.transport.link(data); //store the hash since the HTTP is async (has form "/ipfs/xyz123" or "BLAKE2.xyz123"
        if (verbose) console.log("Transportable.p_store hash=", this._hash);
        let self = this;
        return Dweb.transport.p_rawstore(data, verbose)
            .then((msg) => {
                if (msg !== self._hash) {
                    console.log("ERROR Hash returned ",msg,"doesnt match hash expected",self._hash);
                    throw new Dweb.errors.TransportError("Hash returned "+msg+" doesnt match hash expected "+self._hash)
                }
                return(msg); // Note this will be a return from the promise.
            }) // Caller should handle error and success
    }

    dirty() {   // Flag as dirty so needs uploading - subclasses may delete other, now invalid, info like signatures
        this._hash = null;
    }

    p_fetch(verbose) {
        // Promise equiv of PY:fetch and async_load
        // Resolves whether needs to load or not as will often load and then do something.
        if (verbose) { console.log("Transportable.p_fetch hash=",this._hash,this._needsfetch); }
        let self = this;
        if (this._needsfetch) { // Only load if need to
            this._needsfetch = false;    // Set false before return so not multiply fetched
            return Dweb.transport.p_rawfetch(this._hash, verbose)
                .then((data) => { if (data) self._setdata(data); return self});
        } else {
            return new Promise((resolve, reject)=> resolve(self));  // I think this should be a noop - fetched already
        }
        // Block fetched in the background - dont assume loaded here - see success for actions post-load

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
        if (this._needsfetch) {
            let self = this;
            this.p_load(verbose)
                .then((msg) => self.p_elem(el, verbose, successmethodeach));
        } else {
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
        }
        if (verbose) console.log("EL set to", el.textContent);
    }

    // Note for tests, best to use Block.test()
}
exports = module.exports = Transportable;

