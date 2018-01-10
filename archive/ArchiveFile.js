import prettierBytes from "prettier-bytes";
import RenderMedia from 'render-media';

require('babel-core/register')({ presets: ['env', 'react']}); // ES6 JS below!
import React from './ReactFake';
import Util from './Util';
import throttle from "throttleit";

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
    async p_loadImg(jsx) {
        /*
        This is the asyncronous part of loadImg, runs in the background to update the image.

        Note it can't be inside load_img which has to be synchronous and return a jsx tree.
         */
        let urls = [this.metadata.ipfs, this.metadata.magnetlink, this.metadata.contenthash];   // Multiple potential sources
        let blk = await  Dweb.Block.p_fetch(urls, verbose);  //Typically will be a Uint8Array
        let blob = new Blob([blk._data], {type: Util.archiveMimeTypeFromFormat[this.metadata.format]}) // Works for data={Uint8Array|Blob}
        // This next code is bizarre combination needed to open a blob from within an HTML window.
        let objectURL = URL.createObjectURL(blob);    //TODO-STREAMS make this work on streams
        if (verbose) console.log("Blob URL=",objectURL);
        //jsx.src = `http://archive.org/download/${this.itemid}/${this.metadata.name}`
        jsx.src = objectURL;
    }
    async p_loadStream(jsx) {
        let urls = [this.metadata.ipfs, this.metadata.magnetlink, this.metadata.contenthash];   // Multiple potential sources
        var file = {
            name: this.metadata.name,
            createReadStream: function (opts) {
                // Return a readable stream that provides the bytes between offsets "start"
                // and "end" inclusive. This works just like fs.createReadStream(opts) from
                // the node.js "fs" module.

                return Dweb.Transports.createReadStream(urls, opts, verbose)
            }
        }

        //RenderMedia.append(file, '#videoContainer');  //TODO-STREAM move to append
        RenderMedia.render(file, jsx);  // Render into supplied element

        // TODO: port this to JSX
        if (window.WEBTORRENT_TORRENT) {
            const torrent = window.WEBTORRENT_TORRENT

            const updateSpeed = () => {
                const webtorrentStats = document.querySelector('#webtorrentStats'); // Not moved into updateSpeed as not in document when this is run first time
                var progress = (100 * torrent.progress).toFixed(1)

                const html =
                    '<b>Peers:</b> ' + torrent.numPeers + ' ' +
                    '<b>Progress:</b> ' + progress + '% ' +
                    '<b>Download speed:</b> ' + prettierBytes(torrent.downloadSpeed) + '/s ' +
                    '<b>Upload speed:</b> ' + prettierBytes(torrent.uploadSpeed) + '/s'

                if (webtorrentStats) webtorrentStats.innerHTML = html;    // May be null during loading, or not in UI
            }

            torrent.on('download', throttle(updateSpeed, 250))
            torrent.on('upload', throttle(updateSpeed, 250))
            setInterval(updateSpeed, 1000)
            updateSpeed()
        }

    }
    loadImg(jsx) {
        //asynchronously loads file from one of metadata, turns into blob, and stuffs into element
        // Usage like  {this.loadImg(<img width=10>))
        this.p_loadStream(jsx); /* Asynchronously load image*/  //TODO-STREAM was p_loadImg
        return jsx;
    }
    downloadable() {
        return Object.keys(Util.downloadableFormats).includes(this.metadata.format)
    }
}