const Dweb = require("./Dweb");

class KeyValueTable extends SmartDict {
    /*
    Manages a KeyValue object intended for each field to be a separate item

    Fields:
    _tableurl    Is the url of the table at which fields are stored
    //TODO-KEYVALUE - incomplete
     */

    constructor(data, verbose, options) {
        super(data, verbose, options);
        if (! this._tablepublicurls) {
            [this._tableurls, this._tablepublicurls] = Transports.newtable(this.pubkey..., this.table)
        }
    }


}


exports = module.exports = KeyValueTable;
