const errors = require('./Errors'); // Standard Dweb Errors
const Transports = require('./Transports'); // Manage all Transports that are loaded
const SmartDict = require('./SmartDict'); // General handling of JSON structures
const Signature = require('./Signature'); // Encapsulate a signature as used for items on a CommonList
const PublicPrivate = require("./PublicPrivate"); //for extends
const utils = require('./utils'); // Utility functions
//https://www.npmjs.com/package/custom-event && https://github.com/webmodules/custom-event
const CustomEvent = require('custom-event'); // From web, Not present in node - this code uses global.CustomEvent if it exists so safe on browser/node

class CommonList extends PublicPrivate {
    /*
    CommonList is a superclass for anything that manages a storable list of other urls
    e.g. MutableBlock, KeyChain, AccessControlList

    Fields:
    _list           Holds an array of signatures of items put on the list
    listurls       Urls of lists e.g. in YJS or Orbit - this is the private URL, needed for writing and never (unintentionally) stored unencrypted
    listpublicurls Public URL of list, this is the publicurl, used for reading
    Inherited from PublicPrivate: keypair, _master, _publicurls, _allowunsafestore, dontstoremaster, _listeners
    */
    //TODO extend to cover array functions, but carefully as the semantics require signing and storing.
    //concat - hard to do well as unclear semantics, do you really want a new list with the contents of both ? The signatures on 2nd might not work
    //filter - could be done - just filter list, but do you filter sig or data ?
    //reverse - can do locally, but this wont effect stored version
    //push - see p_push
    //map - can do, but sig or data ?  Maybe mapSig and mapData

    constructor(data, master, key, verbose, options) {
        /*
            Create a new instance of CommonList
            Note that in almost all cases should use p_new rather than constructor as constructor cant setup listurls and listpublicurls
            Also note that when called from SmartDict.p_fetch ONLY the data is passed.

            :param data: json string or dict to load fields from
            :param master: boolean, true if should create a master list with private key etc
            :param key: A KeyPair, or a dict of options for creating a key: valid = mnemonic, seed, keygen:true
                keygen: boolean, true means it should generate a key
                mnemonic: BIP39 string to use as a mnemonic to generate the key - TODO not implemented (in JS) yet
                seed: Seed to key generation algorithm
            :param options: dict that overrides any fields of data
         */
        super(data, master, key, verbose, options);
        this.listurls = this.listurls || [];
        this.listpublicurls = this.listpublicurls || [];
        this.table = "cl";
    }
    static async p_new(data, master, key, verbose, options) {
        let obj = await super.p_new(data, master, key, verbose, options); // Note will call constructor
        if (obj._master && (!obj.listurls || !obj.listurls.length)) {
            [obj.listurls,obj.listpublicurls] = await Transports.p_newlisturls(obj, verbose);
        }
        return obj;
    }

    _setdata(value) {
        super._setdata(value);
        this._list = this._list || [];        // Clear list (not undefined field) if setting data
    }

    preflight(dd) {
        /*
        p_store, p_storepublic and preflight work in tandem to store private and public versions of the data
        Prepare a dictionary of data for storage,
        Subclasses SmartDict to:
            convert the keypair for export and check not unintentionally exporting a unencrypted public key
            ensure that _publicurls is stored (by default it would be removed)
        and subclassed by AccessControlList

        :param dd: dict of attributes of this, possibly changed by superclass
        :return: dict of attributes ready for storage.
         */

        let master = dd._master; //Save before super.preflight
        dd = super.preflight(dd);  // Edits dd in place, in particular deletes anything starting with _
        if (! master) {
            delete dd.listurls
        }
        return dd;
    }

    async p_fetchlist(verbose) {
        /*
        Load the list from the Dweb,
        Use p_list_then_elements instead if wish to load the individual items in the list
        */
        if (!this.storedpublic())
            await this._p_storepublic(verbose);
        let lines = await Transports.p_rawlist(this.listpublicurls, verbose); // [[sig,sig],[sig,sig]]
        if (verbose) console.log("CommonList:p_fetchlist.success", this._urls, "len=", lines.length);
        this._list = lines
            .map((l) => new Signature(l, verbose))    // Turn each line into a Signature
            .sort((a,b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);  // Sort signatures by date
    }

    async p_list_then_elements(verbose) {
        /*
         Utility function to simplify nested functions, fetches body, list and each element in the list.

         :resolves: list of objects signed and added to the list
        */
        try {
            await this.p_fetchlist(verbose);
            this.listmonitor(verbose);  // Track any future objects  - will call event Handler on any added
            return await Promise.all(
                Signature.filterduplicates(this._list) // Dont load multiple copies of items on list (might need to be an option?)
                    .map((sig) => sig.p_fetchdata(verbose))
            ); // Return is array result of p_fetchdata which is array of new objs (suitable for storing in keys etc)
        } catch(err) {
            console.log("CL.p_list_then_elements: failed",err.message);
            throw err;
        }
    }

    async p_push(obj, verbose ) {
        /*
         Equivalent to Array.push but returns a promise because asynchronous
         Sign and store a object on a list, stores both locally on _list and sends to Dweb

         :param obj: Should be subclass of SmartDict, can be an array of URLs of such an obj
         :resolves: sig created in process - for adding to lists etc.
         :throws:   ForbiddenError if not master;
         */
        try {
            if (!obj) { // noinspection ExceptionCaughtLocallyJS
                throw new errors.CodingError("CL.p_push obj should never be non-empty");
            }
            let sig;
            console.assert(this.listpublicurls.length > 0); // Should be set by now
            await this.p_store(verbose);        // Make sure list is stored before store anything on it.
            if (verbose) console.log("CL.p_push", obj._urls, "onto", this._urls);
            let urls = obj;
            if (obj instanceof SmartDict) {
                await obj.p_store(verbose);     // Make sure any object is stored
                urls = obj._urls;
            }
            if (!(this._master && this.keypair))
                { // noinspection ExceptionCaughtLocallyJS
                    throw new errors.ForbiddenError("Signing a new entry when not a master list");
                }
            sig = await this.p_sign(urls, verbose);
            sig.data = obj;                     // Keep a copy of the signed obj on the sig, saves retrieving it again
            this._list.push(sig);               // Keep copy locally on _list
            await this.p_add(sig, verbose);     // Add to list in dweb
            return sig;
        } catch(err) {
            console.log("CL.p_push failed",err.message);
            throw err;
        }
    }

    p_add(sig, verbose) {
        /*
        Add a signature to the Dweb for this list
        Note, there is an assumption that sig.signedby is the same as the commonlist
        Note, normally this will be called through p_push(obj)

        :param sig: Signature
        :resolves:  undefined
         */
        if (!sig) throw new errors.CodingError("CommonList.p_add is meaningless without a sig");
        if (! utils.intersects(sig.signedby, this._publicurls)) throw new errors.CodingError(`CL.p_add: sig.signedby ${sig.signedby} should overlap with this._publicurls ${this._publicurls}`);
        return Transports.p_rawadd(this.listpublicurls, sig, verbose);
    }

    objbrowser_fields(propname) {
        let fieldtypes = { _list: "arrayobj", listurls: "urlarraynolinks", listpublicurls: "urlarraynolinks"};
        return fieldtypes[propname] || super.objbrowser_fields(propname);
    }
    async p_objbrowser(el, opts) {
        await this.p_fetchlist();   // Fetch list before displaying (but not elements)
        super.p_objbrowser(el, opts);
    }

    // ----- Listener interface ----- see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget for the pattern

    listmonitor(verbose) {
        /*
        Add a listmonitor for each transport - note this means if multiple transports support it, then will get duplicate events back if everyone else is notifying all of them.
         */
        Transports.listmonitor(this.listpublicurls,
                (obj) => {
                    if (verbose) console.log("listmonitor added",obj,"to",this.listpublicurls);
                    let sig = new Signature(obj, verbose);
                    if (this.verify(sig)) { // Ignore if not signed by this node, and verify throws Signing Error if correct list, but not verified
                        if (!this._list.some((othersig) => othersig.signature === sig.signature)) {    // Check not duplicate (esp of locally pushed one
                            this._list.push(sig);
                            this.dispatchEvent(new CustomEvent("insert", {target: this, detail: sig}));   // Note target doesnt get set here.
                        } else {
                            console.log("Duplicate signature: %o",sig);
                        }
                    } else {
                        console.log("Rejected signature: ",sig);
                    }
                });
    }
}
SmartDict.table2class["cl"] = CommonList;
exports = module.exports = CommonList;