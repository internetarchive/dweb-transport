/*
Based on https://stackoverflow.com/questions/30430982/can-i-use-jsx-without-react-to-inline-html-in-script
I wanted this because React was doing nasty things at run-time (like catching events) and stopping Search box working

This expanded in use to make it easier to use HTML in as unchanged form from existing react in particular.
- URLs in image tags are re-rooted, i.e. <img src="/foo"> => <img src="https://bar.com/foo">
- look at onClick's especially if set window.location
 */
import RenderMedia from 'render-media';
import ArchiveFile from "./ArchiveFile";

function deletechildren(el, keeptemplate) { //Note same function in htmlutils
    /*
    Remove all children from a node
    :param el:  An HTML element, or a string with id of an HTML element
    */
    if (typeof keeptemplate === "undefined") keeptemplate=true;
    el = (typeof(el) === "string") ? document.getElementById(el) : el;
    // Carefull - this deletes from the end, because template if it exists will be firstChild
    while (el.lastChild && !(keeptemplate && el.lastChild.classList && el.lastChild.classList.contains("template"))) {
        // Note that deletechildren is also used on Span's to remove the children before replacing with text.
        el.removeChild(el.lastChild);
    }
    return el; // For chaining
}

export default class React  {

    static async p_loadImg(jsx, name, urls, cb) {
        /*
        This is the asyncronous part of loadImg, runs in the background to update the image.
        Previous version got a static (non stream) content and puts in an existing IMG tag but this fails in Firefox
        This version appends to a tag using RenderMedia.append which means using a stream
        Note it can't be inside load_img which has to be synchronous and return a jsx tree.

         */
        /*
        //This method makes use of the full Dweb library, can get any kind of link, BUT doesnt work in Firefox, the image doesn't get rendered.
        let blk = await  Dweb.Block.p_fetch(urls, verbose);  //Typically will be a Uint8Array
        let blob = new Blob([blk._data], {type: Util.archiveMimeTypeFromFormat[this.metadata.format]}) // Works for data={Uint8Array|Blob}
        // This next code is bizarre combination needed to open a blob from within an HTML window.
        let objectURL = URL.createObjectURL(blob);
        if (verbose) console.log("Blob URL=",objectURL);
        //jsx.src = `http://archive.org/download/${this.itemid}/${this.metadata.name}`
        jsx.src = objectURL;
        //TODO-SERVICES-IMG make this get smart about kinds of urls e.g. if http or IPFS then skip the createstream and load the image
        */
        console.log("Rendering");
        if (urls instanceof ArchiveFile) {
            urls = await urls.p_urls();   // This could be slow, may have to get the gateway to cache the file in IPFS
        }
        var file = {
            name: name,
            createReadStream: function (opts) {
                // Return a readable stream that provides the bytes between offsets "start"
                // and "end" inclusive. This works just like fs.createReadStream(opts) from
                // the node.js "fs" module.

                return Dweb.Transports.createReadStream(urls, opts, verbose)
            }
        }

        RenderMedia.append(file, jsx, cb);  // Render into supplied element - have to use append, as render doesnt work, the cb will set attributes and/or add children.
    }

    static loadImg(name, urls, cb) {
        //asynchronously loads file from one of metadata, turns into blob, and stuffs into element
        // urls can be a array of URLs of an ArchiveFile (which is passed as an ArchiveFile because ArchiveFile.p_urls() is async as may require expanding metadata
        // Usage like  {this.loadImg(<img width=10>))
        var element = document.createElement("div");
        this.p_loadImg(element, name, urls, cb); /* Asynchronously load image under element - note NOT awaiting return*/
        return element;
    }

    static async p_loadImgByName(name, cb) {
        // Load an image by resolving its name, this was tested but isnt currently used as including urls of thumbnails in metadata
        //TODO-SERVICES-IMG this code might move elsewhere, since static it should be easy.
        //TODO-SERVICES-IMG Note similar code in ArchiveItem.fetch to get metadata
        if (verbose) console.log('getting image for',name); //Dont use console.group because happening in parallel
        const transports = Dweb.Transports.connectedNamesParm(); // Pass transports, as metadata (currently) much quicker if not using IPFS
        const res = await Dweb.Domain.p_rootResolve(name, {verbose});     // [ Name object, remainder ] //TODO-NAME see comments in p_rootResolve about FAKEFAKEFAKE
        if (!(res[0] && (res[0].fullname === "/"+name) && !res[1] )) {
            throw new Error(`Unable to resolve ${name}`);
        }
        el = this.loadImg(name, res[0].urls, cb);
        return el;
    }

    static async p_loadStream(jsx, name, urls, cb) {
        var file = {
            name: name,
            createReadStream: function (opts) {
                // Return a readable stream that provides the bytes between offsets "start"
                // and "end" inclusive. This works just like fs.createReadStream(opts) from
                // the node.js "fs" module.

                return Dweb.Transports.createReadStream(urls, opts, verbose)
            }
        }

        RenderMedia.render(file, jsx, cb);  // Render into supplied element

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
    static loadStream(jsx, name, urls, cb) {   //TODO maybe move this into React like loadImg
        //asynchronously loads file from one of metadata, turns into blob, and stuffs into element
        // usage like <VIDEO src=<ArchiveFile instance>  >
        this.p_loadStream(jsx, name, urls, cb); /* Asynchronously load image*/
        return jsx;
    }


    static config(options) {
        /*
            Configure ReachFake

            root: protocol and host to insert before URLs (currently in img tags only) e.g. "https://archive.org"
         */
        for (x of options) React._config[x] = options[x];
    }
    static createElement(tag, attrs, children) {        // Note arguments is set to tag, attrs, child1, child2 etc
        /* Replaces React's createElement - has a number of application specific special cases
            <img src=ArchiveFile(...)> replaced by <div><img x-=u>

         */

        /* First we handle cases where we dont actually build the tag requested */

        const kids = Array.prototype.slice.call(arguments).slice(2);
        
        function cb(err, element) {
            if (err) {
                console.log("Caught error in createElement callback in loadImg",err.message);
                throw err;
            }
            //console.log("XXX@113",tag,attrs)
            React.buildoutElement(element, tag, attrs, kids);
        }
        if (tag === "img" && Object.keys(attrs).includes("src") && attrs["src"] instanceof ArchiveFile) {
            //Its an image loaded from an ArchiveFile, so wrap in a DIV and pass children and attrs to renderer
            const af = attrs.src;
            delete attrs.src;   // Make sure dont get passed to cb for building into img (which wont like an array)
            return this.loadImg(af.name(), af, cb);   //Creates a <div></div>, asynchronously creates an <img> under it and calls cb on that IMG. The <div> is returned immediately.
        } else if (tag === "img" && Object.keys(attrs).includes("src") && Array.isArray(attrs["src"])) {
            const urls = attrs.src;
            delete attrs.src;   // Make sure dont get passed to cb for building into img (which wont like an array)
            return this.loadImg(attrs["imgname"] || "DummyName.PNG", urls, cb);   //Creates a <div></div>, asynchronously creates an <img> under it and calls cb on that IMG. The <div> is returned immediately.}
        } else if (tag === "img" && Object.keys(attrs).includes("src") && (attrs["src"].startsWith('dweb:/arc') )) {
            //TODO-SERVICES-IMG check this once called
            const name = attrs["src"]
                .replace('https://archive.org/','/arc/archive.org/')
                .replace('dweb:/','');
            return this.p_loadImgByName(name, cb);   //Creates a <div></div>, asynchronously creates an <img> under it and calls cb on that IMG. The <div> is returned immediately.
        } else {
            return this.buildoutElement(document.createElement(tag), tag, attrs, kids);
        }
    }
    static buildoutElement(element, tag, attrs, kids) {
        /* Build out a created element adding Attributes and Children
        tag:    Lower case string of element e.g. "img"
        attrs:  Object {attr: value}
        kids:   Array of children
        /* This is called back by loadImg after creating the tag. */
        for (let name in attrs) {
            const attrname = (name.toLowerCase() === "classname" ? "class" : name);
            if (name === "dangerouslySetInnerHTML") {
                element.innerHTML = attrs[name]["__html"];
                delete attrs.dangerouslySetInnerHTML;
            }
            // Turn relative URLS in IMG and A into absolute urls - ideally these are also caught by special cases
            if (["img.src", "a.href"].includes(tag + "." + name) && (typeof attrs[name] === "string") && attrs[name].startsWith('/')) {
                if (!React._config.root) console.error("Need to React.config({root: 'https://xyz.abc'");
                attrs[name] = React._config.root + attrs[name];  // e.g. /foo => https://bar.com/foo
            }
            // Load ArchiveFile inside a div if specify in src
            if (["video.src", "audio.src"].includes(tag + "." + name) && attrs[name] instanceof ArchiveFile) {
                const af = attrs[name];
                const videoname = this.metadata.name XXX THIS;
                const urls = [af.metadata.ipfs, af.metadata.magnetlink, af.metadata.contenthash].filter(f=>!!f);   // Multiple potential sources, filter out nulls
                this.loadStream(element, videoname, urls);  // Cues up asynchronously to load the video/audio tag
            } else if (["a.source"].includes(tag + "." + name) && attrs[name] instanceof ArchiveFile) {
                element[name] = attrs[name];      // Store the ArchiveFile in the DOM, function e.g. onClick will access it.
            } else if (name && attrs.hasOwnProperty(name)) {
                let value = attrs[name];
                if (value === true) {
                    element.setAttribute(attrname, name);
                } else if (typeof value === "object" && !Array.isArray(value)) { // e.g. style: {{fontSize: "124px"}}
                    for (let k in value) {
                        element[attrname][k] = value[k];
                    }
                } else if (value !== false && value != null) {
                    element.setAttribute(attrname, value.toString());
                }
            }
        }
        for (let i = 0; i < kids.length; i++) {
            const child = kids[i];
            if (!child) {
            } else if (Array.isArray(child)) {
                child.map((c) => element.appendChild(c.nodeType == null ?
                    document.createTextNode(c.toString()) : c))
            }
            else {
                element.appendChild(
                    child.nodeType == null ?
                        document.createTextNode(child.toString()) : child);
            }
        }
        return element;
    }
    static domrender(els, node) {
        deletechildren(node, false);
        node.appendChild(els);
    }
};

//Default configuration
React._config = {
    root: "https://archive.org",
}