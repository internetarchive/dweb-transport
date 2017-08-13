const Transportable = require("./Transportable");

// ######### Parallel development to Block.py ########

class Block extends Transportable {
    constructor(hash, data) {
        super(hash, data);
        this.table = 'b';
    }
    size() { return this._data.length; }

    content() {
        console.assert(!this._needsfetch,"Block should be loaded first as content is sync");
        return this._data;
    }

    static test(verbose) {
        if (verbose) {console.log("Block.test")}
        return new Promise((resolve, reject) => {
            let blk;
            let blk2;
            blk = new Block(null, "The dirty old chicken");      // Create a block with some data
            blk.p_store(verbose)                                // Store it to transport
            .then(() => {blk2 = new Block(blk._hash, null)})    // Create a new block with the hash of the old
            .then(() => blk2.p_fetch(verbose))                  // and fetch it
            .then(() => { console.assert(blk2._data === blk._data, "Block should survive round trip"); resolve(blk2); })
            .catch((err) => { console.log("Block Test failed", err); reject(err); })
        })
    }
}

exports = module.exports = Block;

