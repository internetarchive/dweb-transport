const CommonList = require("./CommonList"); // VersionList extends this
const SmartDict = require("./SmartDict");   // VersionListEntry extends this   //TODO do we need this subclass
const Dweb = require("./Dweb");


class VersionList extends CommonList {
    /*
    Superclass for any kind of Version List, though in many cases will be able to use this directly.

    Fields:
    contentacl: ACL that should be used to lock content //TODO make sure only stored on master
    _entryclass: Class to be used for instances
    _working:   Version currently working on


    Inherited Fields worth commenting on:
    _acl:       Typically will be set to prevent access to the VersionList itself
    _list:      List of versions, last on list should be the current version
     */

    constructor(data, master, key, verbose, options) {
        super(data, master, key, verbose, options);
        this.table = "vl";
        this._entryclass = _VersionListEntry;
    }

    static p_expanddata(data, verbose) {
        return new Promise((resolve, reject) => {
            try {
                if (data.contentacl) {
                    SmartDict.p_fetch(data.contentacl, verbose)
                        .then((acl) => {
                            data.contentacl = acl;
                            resolve();
                        })
                        .catch((err) => { console.log("unable to p_expanddata",err); reject(err);}) // THis is the one that gets "Must be logged in as Mary Smith"
                } else resolve();
            } catch(err) {
                console.log("Uncaught error in p_expanddata",err);
                reject(err);
            }
        });
    }

    static p_new(data, master, key, verbose) {
        data._acl = Dweb.KeyChain.default()
        console.log("XXX@VL.p_new",data._acl)
        return VersionList.p_expanddata(data, verbose)
            .then(() => new VersionList(data, master, key, verbose));
    }
    p_saveversion(verbose) {
        // Update the content edited i.e. sign a copy and store on the list, then make a new copy to work with. Triggered by Save.
        return this.p_push(this._working, verbose)
            .then((sig) => { this._working = this._working.copy(verbose); return sig}); // New copy to work with, should copy _acl as well.
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

class _VersionListEntry extends SmartDict {
    /*
    Superclass for all kinds of Version Lists

    Inherited Fields worth commenting on:
    _acl:   Used to lock the content - set from VL.contentacl
     */
    constructor(data, verbose, options) {
        super(data, verbose, options);
    }
}

exports = module.exports = VersionList;
