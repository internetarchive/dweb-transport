import ArchiveFile from "./ArchiveFile";
import Util from "./Util";

require('babel-core/register')({ presets: ['env', 'react']}); // ES6 JS below!

//const Dweb = require('../js/Dweb');     // Gets SmartDict and the Transports
//TODO-REFACTOR extends SmartDict to eventually allow loading via URL - having problems with webpack ... libsodium -> fs
//TODO-NAMING url could be a name

export default class ArchiveItem { //extends SmartDict {  //TODO should extend SmartDict, but having Webpack issues loading it
    /*
    Base class representing an Item and/or a Search query (A Collection is both).
    This is just storage, the UI is in ArchiveBase and subclasses, theoretically this class could be used for a server or gateway app with no UI.

    Fields:
    itemid: Archive.org reference for object
    item:   Metadata decoded from JSON from metadata search.
    items:  Array of data from a search.
    _list:  Will hold a list of files when its a single item, TODO-REFACTOR maybe this holds a array of ArchiveItem when its a search BUT only have partial metadata info

    Once subclass SmartDict
    _urls:  Will be list of places to retrieve this data (not quite a metadata call)
     */


    constructor({itemid = undefined, item = undefined}={}) {
        this.itemid = itemid;
        this.item = item; // Havent fetched yet, subclass constructors may override
    }

    _listLoad() {
        /*
         After set this.item, load the _list with an array for ArchiveFile
        */
        this._list = (this.item && this.item.files )
            ? this.item.files.map((f) => new ArchiveFile({itemid: this.itemid, metadata: f})) // Allow methods on files of item
            : [];   // Default to empty, so usage simpler.
    }

    async fetch() {
        /* Fetch what we can about this item, it might be an item or something we have to search for.
            Fetch item metadata as JSON by talking to Metadata API
            Fetch collection info by an advanced search.
            Goes through gateway.dweb.me so that we can work around a CORS issue (general approach & security questions confirmed with Sam!)

            this.itemid Archive Item identifier
            throws: TypeError or Error if fails
            resolves to: this
         */
        if (this.itemid && !this.item) {
            console.log('get metadata for ' + this.itemid);
            //this.item = await Util.fetch_json(`https://archive.org/metadata/${this.itemid}`);
            this.item = await Util.fetch_json(`https://gateway.dweb.me/metadata/archiveid/${this.itemid}`);
            this._listLoad();   // Load _list with ArchiveFile
        }   //TODO-REFACTOR make Collections automatically load query and do both
        if (this.query) {   // This is for Search, Collection and Home.
            let j = await Util.fetch_json(
                //`https://archive.org/advancedsearch?output=json&q=${this.query}&rows=${this.limit}&sort[]=${this.sort}`, // Archive (CORS fail)
                `https://gateway.dweb.me/metadata/advancedsearch?output=json&q=${this.query}&rows=${this.limit}&sort[]=${this.sort}`,
                //`http://localhost:4244/metadata/advancedsearch?output=json&q=${this.query}&rows=${this.limit}&sort[]=${this.sort}`, //Testing
            );
            this.items = j.response.docs;
        }
        return this; // For chaining, but note will need to do an "await fetch"
    }


}
