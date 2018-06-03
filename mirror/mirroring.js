//require('babel-core/register')({ presets: ['env', 'react']}); // ES6 JS below!
//TODO unclear if need babel - esp if dont serve JSX internally
const HashStore = require('./HashStore.js');
const MirrorCollection = require('./MirrorCollection.js');

config = {
    hashstore: { file: "level_db" },
    ui: {},
    fs: {},
};

class Mirror {

    static async init() {
        await HashStore.init(config.hashstore);
    }
    static async test() {
        await HashStore.test();
    }
    static async dev_mirror() {
        // Incremental development building and testing components to path in README.md
        foo = new MirrorCollection("prelinger", {});
    }
}


Mirror.init();
//Mirror.test();
Mirror.dev_mirror();
console.log("tested waiting for output");
