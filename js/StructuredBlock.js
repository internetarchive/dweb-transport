const SmartDict = require("./SmartDict");
const Signature = require("./Signature");
const Dweb = require("./Dweb");


// ######### Parallel development to StructuredBlock.py ########

class StructuredBlock extends SmartDict {

    //p_fetch uses SmartDict ..
    constructor(data, verbose) {
        super(data, verbose);
        this._signatures = [];
        this._date = null;  // Updated in _earliestdate when loaded
        this.table = "sb";  // Note this is cls.table on python but need to separate from dictionary
    }

    __setattr__(name, value) {
        // Call chain is ...  or constructor > _setdata > _setproperties > __setattr__
        // catch equivalent of getters and setters here
        let verbose = false;
        if (name === "links") {
            let links = value;
            for (let len = links.length, i=0; i<len; i++) {
                throw new Dweb.errors.CodingError("Next line needs fixing, caller should do this expansion as its async and __setattr__ cant be");  //TODO-REL5
                links[i] = Dweb.SmartDict.p_fetch(links[i],verbose);
            }
            this[name] = links;
        } else {
            super.__setattr__(name, value);
        }
    }

    p_path(patharr, verbose, successmethod) {
        // We cant use a function here, since the closure means it would apply to the object calling this, not the object loaded.
        // successmethod is an array [ nameofmethod, args... ]
        // Warning - may change the signature of this as discover how its used.
        if (verbose) { console.log("sb.p_path",patharr, successmethod, "links=",this.links); }
        if (patharr && patharr.length && this.links && this.links.length ) { // Have a path and can do next bit of it on this sb
            let next = patharr.shift(); // Takes first element of patharr, leaves patharr as rest
            if (verbose) { console.log("StructuredBlock:path next=",next); }
            let obj = this.link(next);   //TODO-ERRS handle error if not found
            return obj.p_path(patharr, verbose)
        } else if (patharr && patharr.length) {
            throw new Error("Cant follow path"+patharr);
        } else {  // Reached end of path, can apply success
            //TODO-IPFS unsure if have this correct
            //if (success) { success(undefined); } //note this wont work as success defined on different object as "this"
            if (successmethod) {
                let methodname = successmethod.shift();
                if (verbose) { console.log("p_path success:",methodname, successmethod); }
                this[methodname](...successmethod); // Spreads successmethod into args, like *args in python
            }
            return new Promise((resolve, reject)=> resolve(null));  // I think this should be a noop - fetched already
        }
    }

    dirty() {
        super.dirty();
        this._signatures = [];
    }

    link(name) {    // Note python version allows call by number as well as name
        return this.links.find((link) => link.name === name)
    }

    content(verbose) {
        if (this.data) { return this.data; }
        if (this.links) {
            let res = "";
            for (let i in this.links) { //TODO-REL5 replace wth map ?
                //noinspection JSUnfilteredForInLoop
                let l = this.links[i];
                res = res + l.content(verbose)  //Each link is a SB
            }
            return res;
        }
        console.log("ERR - object has no content, not even empty data");
        //Not supporting url/fetch as async
        //(this.url and this.transport().rawfetch(url = self.url, verbose=verbose, **options)) or # url must point to raw data, not another SB
    }
    file() { throw new Dweb.errors.ToBeImplementedError("Undefined function StructuredBlock.file"); }
    size() { throw new Dweb.errors.ToBeImplementedError("Undefined function StructuredBlock.size"); }

    /* OBS - moved into MB.p_signandstore
    sign(commonlist, verbose) {
        /-*
         Add a signature to a StructuredBlock and add it to a list
         Note if the SB has a _acl field it will be encrypted first, then the url of the encrypted block used for signing.
         :param CommonList commonlist:   List its going on - has a ACL with a private key
         :return: sig so that CommonList can add to _list
         *-/
        //TODO should probaly disable storage here, and do assertion OR make it p_sign , either way avoids a race.
        //if (!this._url) this.p_store(verbose);  // Sets _url immediately which is needed for signatures
        //if (!commonlist._publicurl) commonlist.p_store(verbose);    // Set _publicurl immediately (required for Signature.sign)
        let sig = super.sign(commonlist, verbose);  // Checks this, and commonlist are stored
        this._signatures.push(sig);
        return sig;  // so that CommonList can add to _list
    }
    */
    verify() { throw new Dweb.errors.ToBeImplementedError("Undefined function StructuredBlock.verify"); }


    earliestdate(){    // Set the _date field to the earliest date of any signature or null if not found
        if (!this._signatures) {
            this._date = null;
        } else {
            if (!this._date) {
                this._date = this._signatures[0]["date"];
                for (let i = 1; this._signatures.length > i; i++) { //TODO-REL5 replace with map
                    if ( this._date > this._signatures[i]["date"]) {
                        this._date = this._signatures[i]["date"];
                    }
                }
            }
        }
        return this._date;
    }

    static compare(a, b) {
        if (a.earliestdate() > b.earliestdate()) { return 1; }
        if (b.earliestdate() > a.earliestdate()) { return -1; }
        return 0;
    }

    static test(document, verbose) {
        if (verbose) console.log("StructuredBlock.test");
        return new Promise((resolve, reject) => {
            let el = document.getElementById("myList.0");
            console.log("el=", el);
            try {
                let teststr = "The well structured block";
                let sb = new StructuredBlock({"data": teststr});
                let sb2;
                if (verbose) {
                    console.log("StructuredBlock.test sb=", sb);
                }
                sb.p_store(verbose)
                    .then(() => Dweb.SmartDict.p_fetch(sb._url)) // Will be StructuredBlock
                    .then((newsb) => sb2 = newsb)
                    .then(() => {
                        if (verbose) console.assert(sb2.data === teststr, "SB should round trip", sb2.data, "!==", teststr)
                    })
                    //TODO-REL5 if elimonate p_elem, remove from Transportable
                    /* //TODO-IPFS create a test set of SB's that have a path
                    .then(() => sb.p_path(["langs", "readme.md"], verbose, ["p_elem", el, verbose, null]))
                    //To debug, uncomment the el.textContent line in Transportable.p_elem
                     */
                    .then(() => {
                        if (verbose) console.log("StructuredBlock.test promises complete");
                        resolve({sb: sb, sb2: sb2});
                    })
                    .catch((err) => {
                        console.log("Error in StructuredBlock.test", err);   // Log since maybe "unhandled" if just throw
                        reject(err);
                    })
            } catch (err) {
                console.log("Caught exception in StructuredBlock.test", err);
                throw(err)
            }
        })
    }
}exports = module.exports = StructuredBlock;
