const Transportable = require("./Transportable");
const Dweb = require("./Dweb");


// ######### Parallel development to Block.py ########

class Block extends Transportable {
    constructor(data) {
        super(data);
        this.table = 'b';
    }
    size() { return this._data.length; }

    content() {
        return this._data;
    }
    static p_fetch(url, verbose) {
        return super.p_fetch(url, verbose) // Fetch the data Throws TransportError immediately if url invalid, expect it to catch if Transport fails
            .then((data) => new Block(data));
    }
    static test(verbose) {
        if (verbose) {console.log("Block.test")}
        return new Promise((resolve, reject) => {
            let blk;
            let blk2;
            blk = new Block("The dirty old chicken");       // Create a block with some data
            blk.p_store(verbose)                            // Store it to transport
            .then(() => Block.p_fetch(blk._url, verbose))
            .then((blk2) => {
                console.assert(blk2._data === blk._data, "Block should survive round trip");
                resolve(blk2);
            })
            .catch((err) => { console.log("Block Test failed", err); reject(err); })
        })
    }
}

exports = module.exports = Block;

