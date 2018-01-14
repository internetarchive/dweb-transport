const Dweb = require("./Dweb");

class KeyValue extends SmartDict {
    constructor(data, verbose, options) {
        super(data, verbose, options);
        this._dirty = true;
    }

    //TODO-KEYVALUE make sure to clear _dirty in p_store()

    dirty() {  // Overrides Transportable.dirty()
        this._dirty = true;
    }
    stored() { // Overrides Transportable.stored()
        return ! this._dirty;
    }
}


exports = module.exports = SmartDict;
