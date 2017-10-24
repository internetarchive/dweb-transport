const CommonList = require("./CommonList"); // VersionList extends this
const SmartDict = require("./SmartDict");   // VersionListEntry extends this   //TODO do we need this subclass
const Dweb = require("./Dweb");


class VersionList extends CommonList {
    /*
    Superclass for any kind of Version List, though in many cases will be able to use this directly.

    Fields:
    contentacl: ACL that should be used to lock content
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
