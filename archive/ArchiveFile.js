import RenderMedia from 'render-media';
require('babel-core/register')({ presets: ['env', 'react']}); // ES6 JS below!
import React from './ReactFake';
import Util from './Util';
import throttle from "throttleit";
import prettierBytes from "prettier-bytes";

export default class ArchiveFile {
    /*
    Represents a single file, currently one that is in the item, but might create sub/super classes to handle other types
    of file e.g. images used in the UI

    Fields:
    metadata: metadata of item - (note will be a pointer into a Detail or Search's metadata so treat as read-only)
    sd: pointer to SmartDict or Block ? created with Urls (see how did it with Academic)
     */

    constructor({itemid = undefined, metadata = undefined}={}) {
        this.itemid = itemid;
        this.metadata = metadata;
    }

    name() {
        /* Name suitable for downloading etc */
        return this.metadata.name;
    }
    async p_urls() {
        /*
        Return an array of URLs that might be a good place to get this item
         */
        if (!this.metadata.ipfs && Dweb.Transports.connectedNames().includes("IPFS")) {   // Connected to IPFS but dont have IPFS URL yet (not included by default because IPFS caching is slow)
            this.metadata = await Util.fetch_json(`${Util.gateway.url_metadata}${this.itemid}/${this.metadata.name}`);
        }
        return [this.metadata.ipfs, this.metadata.magnetlink, this.metadata.contenthash].filter(f => !!f);   // Multiple potential sources elimate any empty
    }

    async p_download(a, options) {
        let urls = await this.p_urls()   // Multiple potential sources elimating any empty
        let blk = await  Dweb.Block.p_fetch(urls, verbose);  //Typically will be a Uint8Array
        let blob = new Blob([blk._data], {type: Util.archiveMimeTypeFromFormat[this.metadata.format]}) // Works for data={Uint8Array|Blob}
        let objectURL = URL.createObjectURL(blob);
        if (verbose) console.log("Blob URL=",objectURL);
        //browser.downloads.download({filename: this.metadata.name, url: objectURL});   //Doesnt work
        //Downloads.fetch(objectURL, this.metadata.name);   // Doesnt work
        a.href = objectURL;
        a.target= (options && options.target) || "_blank";                      // Open in new window by default
        a.onclick = undefined;
        a.download = this.metadata.name;
        a.click();
        //URL.revokeObjectURL(objectURL)    //TODO figure out when can do this - maybe last one, or maybe dont care?


    }

    downloadable() {
        return Object.keys(Util.downloadableFormats).includes(this.metadata.format)
    }
    sizePretty() {
        return prettierBytes(parseInt(this.metadata.size));
    }
}