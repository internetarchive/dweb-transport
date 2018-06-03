Collection = require('dweb-archive/Collection');

class MirrorCollection extends Collection {
    constructor(itemid, options={}) {
        super(itemid); // Note not passing item
        this.options = options;
    }


    async test() {
        let foo = new Collection(itemid);
        await foo.fetch() // Note this hasn't been passed the "item" just the itemid
        console.log("Completed test");
    }

}
exports = module.exports = MirrorCollection;