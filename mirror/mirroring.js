//require('babel-core/register')({ presets: ['env', 'react']}); // ES6 JS below!
//TODO unclear if need babel - esp if dont serve JSX internally
const errors = require("../js/Errors.js"); // ToBeImplementedError
const MirrorFS = require('./MirrorFS.js');
const HashStore = require('./HashStore.js');

config = {
    hashstore: { file: "level_db" }
};

class Mirror {

    static async init() {
        await MirrorFS.init(config);
        await HashStore.init(config.hashstore);
    }
    static async test() {
        await HashStore.test();
    }
}


Mirror.init();
Mirror.test();
console.log("tested waiting for output");
