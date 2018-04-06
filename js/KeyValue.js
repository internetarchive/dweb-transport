const SmartDict = require("./SmartDict");

class KeyValue extends SmartDict {
    /*
    Manages a KeyValue object intended to be stored as a single item,

    //TODO-KEYVALUE - incomplete
     */

    constructor(data, verbose, options) {
        super(data, verbose, options);
        this._dirty = true;
    }

    //TODO-KEYVALUE make sure to clear _dirty in p_store()

    dirty() {  // Overrides SmartDict.dirty()
        this._dirty = true;
    }
    stored() { // Overrides SmartDict.stored()
        return ! this._dirty;
    }

}


exports = module.exports = KeyValue;
