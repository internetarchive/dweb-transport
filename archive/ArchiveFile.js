require('babel-core/register')({ presets: ['env', 'react']}); // ES6 JS below!
import React from './ReactFake';

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
        //TODO-DETAILS-SD create when loading metadata with files - done in image.constructor, maybe move to detail and call superclass
    }
    async p_loadImg(jsx) {
        /*
        This is the asyncronous part of loadImg, runs in the background to update the image.

        Note it can't be inside load_img which has to be synchronous and return a jsx tree.
         */
        let ipfsfile = this.metadata.ipfs
        let blk = await  Dweb.Block.p_fetch([ipfsfile], verbose);  //Typically will be a Uint8Array
        let options = {type: 'image/jpeg'}  //TODO-DETAILS-DWEB get correct file type
        let blob = new Blob([blk.data], {type: options.type}) // Works for data={Uint8Array|Blob}
        // This next code is bizarre combination needed to open a blob from within an HTML window.
        let objectURL = URL.createObjectURL(blob);    //TODO-STREAMS make this work on streams
        console.log("OURL=",objectURL)
        jsx.src = `http://archive.org/download/${this.itemid}/${this.metadata.name}`
        //jsx.src = objectURL;
    }
    loadImg(jsx) {
        //TODO-DETAILS-SD return a React.Createelement with the img,  parms should be fields of that
        //TODO-DETAILS-SD step 1 create element; step2 blob
        //asynchronously loads file from one of metadata, turns into blob, and stuffs into element
        //TODO blob making part goes here
        this.p_loadImg(jsx); /* Asynchronously load image*/
        //jsx.src=`http://archive.org/download/${this.itemid}/${this.metadata.name}`
        return jsx;
        //<img class="rot0 carousel-image" alt="item image #1"
        //src={`http://archive.org/download/${itemid}/${mainfile.name}`}/> {/*Note archive.org details page erroneously doesnt close this tag*/}

    }
}