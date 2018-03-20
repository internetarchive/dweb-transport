//const errors = require('./Errors'); // Standard Dweb Errors
const Transport = require('./Transport'); // Base class for TransportXyz
const Transports = require('./Transports'); // Manage all Transports that are loaded
const Domain  = require('./Domain'); // Note Domain requires lots of other stuff, so require TransportNAME late in the process
//const nodefetch = require('node-fetch'); // Note, were using node-fetch-npm which had a warning in webpack see https://github.com/bitinn/node-fetch/issues/421 and is intended for clients
//const Url = require('url');

defaultnameoptions = {
    //urlbase: 'https://gateway.dweb.me:443'
};

class TransportNAME extends Transport {

    constructor(options, verbose) {
        super(options, verbose);
        this.options = options;
        this.supportURLs = ['dweb:/arc'];
        //TODO-TRANSPORTNAME check this support
        this.supportFunctions = ['fetch', 'store', 'add', 'list', 'reverse', 'newlisturls', "get", "set", "keys", "getall", "delete", "newtable", "newdatabase"]; //Does not support: listmonitor - reverse is disabled somewhere not sure if here or caller
        this.supportFeatures = ['fetch.range']
        this.name = "NAME";             // For console log etc
        this.status = Transport.STATUS_LOADED;
    }

    static setup0(options, verbose) {
        let combinedoptions = Transport.mergeoptions({ http: defaulthttpoptions },options);
        try {
            let t = new TransportNAME(combinedoptions, verbose);
            Transports.addtransport(t);
            return t;
        } catch (err) {
            console.log("Exception thrown in TransportNAME.p_setup", err.message);
            throw err;
        }
    }
    async p_setup1(verbose) {
        return this;
    }

    async p_status(verbose) {    //TODO-BACKPORT
        /*
        Return a string for the status of a transport. No particular format, but keep it short as it will probably be in a small area of the screen.
        resolves to: String representing type connected (always HTTP) and online if online.
         */
        try {
            //TODO-TRANSPORTNAME - check Domain loads root
            this.status = Transport.STATUS_CONNECTED;
        } catch(err) {
            console.log(this.name, ": Error in starting name service",err.message);
            this.status = Transport.STATUS_FAILED;
        }
        return this.status;
    }

    static async p_urlsFromName(name) {
        /* Try and resolve a name,
        name:   Names of the form dweb:/ especially dweb:/arc/archive.org/foo
        returns:    [ url ]  Array of urls which will be empty if not resolved (which is quite likely if relative name not defined)
        */
        name = name.replace("dweb:/",""); // Strip leading dweb:/ before resolving in root
        const res = await Domain.p_rootResolve(name, {verbose});     // [ Leaf object, remainder ] //TODO-NAME see comments in p_rootResolve about FAKEFAKEFAKE
        if (!(res[0] && (res[0].name === name) && !res[1] )) {
            return undefined
        }
        return res[0].urls;
    }
    static async p_resolveNames(urls) {
        // Turn an array of urls into another array, resolving any names if possible and leaving other URLs untouched
        return [].concat(...await Promise.all(urls.map(u => u.startsWith("dweb:/arc")  ? this.p_urlsFromName(u) : [u])))
    }

    static async p_test(opts={}, verbose=false) {
        if (verbose) {console.log("TransportNAME.test")}
        try {
            let transport = await this.p_setup(opts, verbose);
            if (verbose) console.log("NAMES connected");
            let res = this.p_resolveNames(["dweb:/arc/archive.org/metadata/commute"]);
            console.log("XXX@78", res);
            //TODO-TRANSPORTNAME - need to define tests
        } catch(err) {
            console.log("Exception thrown in TransportNAME.test:", err.message);
            throw err;
        }
    }

}
//Dont stick in transportclasses, done before then. Transports._transportclasses["HTTP"] = TransportHTTP;
Transports.resolveNamesWith(TransportNAME.p_resolveNames)
exports = module.exports = TransportNAME;

