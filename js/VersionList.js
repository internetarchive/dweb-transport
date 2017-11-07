const CommonList = require("./CommonList"); // VersionList extends this
const Dweb = require("./Dweb");

//TODO-API document VersionList

class VersionList extends CommonList {
    /*
    Superclass for any kind of Version List, though in many cases will be able to use this directly.

    Fields:
    contentacl: ACL that should be used to lock content
    _working:   Version currently working on


    Inherited Fields worth commenting on:
    _acl:       Typically will be set to prevent access to the VersionList itself
    _list:      List of versions, last on list should be the current version
     */

    constructor(data, master, key, verbose, options) {
        super(data, master, key, verbose, options);
        this.table = "vl";
    }

    static async p_expanddata(data, verbose) {
        // Expand any known URLs in the data
        try {
            if (data.contentacl) data.contentacl = await Dweb.SmartDict.p_fetch(data.contentacl, verbose); // THis is the one that gets "Must be logged in as Mary Smith"
        } catch(err) {
                console.log("Unable to expand data in p_expanddata",err);
        }
    }

    static async p_new(data, master, key, firstinstance, verbose) {
        data._acl = Dweb.KeyChain.default();
        if (verbose) console.log("VL.p_new acl=",data._acl);
        await VersionList.p_expanddata(data, verbose);  // Expands _contentacl url
        let vl = new VersionList(data, master, key, verbose);
        await vl.p_store(verbose);
        data._acl.p_push(vl)    // Store on the KeyChain so can find again
        vl._working = firstinstance;
        vl._working["_acl"] = vl.contentacl;
        return vl;
    }

    async p_saveversion(verbose) {
        // Update the content edited i.e. sign a copy and store on the list, then make a new copy to work with. Triggered by Save.
        let sig = await this.p_push(this._working, verbose);
        this._working = this._working.copy(verbose);
        return sig;             // New copy to work with, should copy _acl as well.
    }

    async p_restoreversion(sig, verbose) {
        // Go back to version from a specific sig
        await sig.p_fetchdata(verbose); // Get data - we won't necessarily have fetched it, since it could be large.
        this._working = sig.data.copy(verbose);
    }
    async p_fetchlistandworking(verbose) {
        await this.p_fetchlist(verbose);    // Get the list
        if (this._list.length) { // There was some data
            this._working = await this._list[this._list.length - 1].p_fetchdata(verbose);    // Find last sig, fetch the data
        }
    }

    preflight(dd) {
        /*
        Prepare data for storage, ensure publickey available

        :param dd: dict containing data preparing for storage (from subclass)
        :returns: dict ready for storage if not modified by subclass
         */
        if (!this._master) {
            delete dd.contentacl;   // Contentacl is the private ACL, no need to send at all
        }
        return super.preflight(dd); //CL preservers _master and _publicurl
    }
}

exports = module.exports = VersionList;
