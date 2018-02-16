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
    urls() {
        /*
        Return an array of URLs that might be a good place to get this item
         */
        return [this.metadata.ipfs, this.metadata.magnetlink, this.metadata.contenthash].filter(f => !!f);   // Multiple potential sources elimate any empty
    }

    async p_download(a, options) {
        let urls = [this.metadata.ipfs, this.metadata.magnetlink, this.metadata.contenthash].filter(f=>!!f);   // Multiple potential sources elimate any empty
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

    async p_loadStream(jsx, atts, childrenarr) {
        let urls = [this.metadata.ipfs, this.metadata.magnetlink, this.metadata.contenthash].filter(f=>!!f);   // Multiple potential sources
        var file = {
            name: this.metadata.name,
            createReadStream: function (opts) {
                // Return a readable stream that provides the bytes between offsets "start"
                // and "end" inclusive. This works just like fs.createReadStream(opts) from
                // the node.js "fs" module.

                return Dweb.Transports.createReadStream(urls, opts, verbose)
            }
        }

        RenderMedia.render(file, jsx);  // Render into supplied element

        if (window.WEBTORRENT_TORRENT) {
            const torrent = window.WEBTORRENT_TORRENT

            const updateSpeed = () => {
                if (window.WEBTORRENT_TORRENT === torrent) {    // Check still displaying ours
                    const webtorrentStats = document.querySelector('#webtorrentStats'); // Not moved into updateSpeed as not in document when this is run first time
                    const els = (
                        <span>
                        <b>Peers:</b> {torrent.numPeers}{' '}
                        <b>Progress:</b> {(100 * torrent.progress).toFixed(1)}%{' '}
                        <b>Download speed:</b> {prettierBytes(torrent.downloadSpeed)}/s{' '}
                        <b>Upload speed:</b> {prettierBytes(torrent.uploadSpeed)}/s
                        </span>
                    )
                    if (webtorrentStats) {
                        deletechildren(webtorrentStats);
                        webtorrentStats.appendChild(els);
                    }
                }
            }

            torrent.on('download', throttle(updateSpeed, 250));
            torrent.on('upload', throttle(updateSpeed, 250));
            setInterval(updateSpeed, 1000)
            updateSpeed(); //Do it once
        }

    }
    loadStream(jsx) {   //TODO maybe move this into React like loadImg
        //asynchronously loads file from one of metadata, turns into blob, and stuffs into element
        // Usage like  {this.loadStream(<img width=10>))
        this.p_loadStream(jsx); /* Asynchronously load image*/
        return jsx;
    }
    downloadable() {
        return Object.keys(Util.downloadableFormats).includes(this.metadata.format)
    }
    sizePretty() {
        return prettierBytes(parseInt(this.metadata.size));
    }
}