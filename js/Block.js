const errors = require('./Errors');
const Transportable = require("./Transportable");
const Dweb = require("./Dweb");

// ######### Parallel development to Block.py ########

class Block extends Transportable {
    /*
    Class for opaque bytes, its mostly not used. Usually a SmartDict will be a better way to hold an object.

    Fields:
    inherits from Transportable: _urls _data
     */

    constructor(data) {
        /*
        data	opaque data to store (byte string or Buffer) - should always convert it to what you want.
         */
        super(data);
        this.table = 'b';
    }
    size() {
        /*
        Returns	size of _data
         */
        return this._data.length;
    }

    content() {
        /*
        Returns	string: from _data
         */
        return this._data;
    }
    static async p_fetch(urls, verbose) {
        return new Block(await super.p_fetch(urls, verbose)); // Fetch the data Throws TransportError immediately if url invalid, expect it to catch if Transport fails
    }
    static async p_test(verbose) {
        try {
            if (verbose) {console.log("Block.test")}
            let blk = new Block("The dirty old chicken");       // Create a block with some data
            await blk.p_store(verbose);                         // Store it to transport
            let blk2 = await Block.p_fetch(blk._urls, verbose);
            if (blk2._data.toString() !== blk._data) {          // noinspection ExceptionCaughtLocallyJS
                throw new errors.CodingError("Block should survive round trip");
            }
            return blk2;
        } catch(err) { console.log("Block Test failed"); throw err; }
    }
}

exports = module.exports = Block;

