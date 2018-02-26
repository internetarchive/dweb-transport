/*
This Transport layers builds on WebTorrent

Y Lists have listeners and generate events - see docs at ...
*/

// WebTorrent components

const WebTorrent = require('webtorrent');
const stream = require('readable-stream');

// Other Dweb modules
const errors = require('./Errors'); // Standard Dweb Errors
const Transport = require('./Transport.js'); // Base class for TransportXyz
const Transports = require('./Transports'); // Manage all Transports that are loaded
//TODO-REQUIRE above here are done
const Dweb = require('./Dweb');

let defaultoptions = {
    webtorrent: {}
};

class TransportWEBTORRENT extends Transport {
    /*
    WebTorrent specific transport

    Fields:
    webtorrent: object returned when starting webtorrent
     */

    constructor(options, verbose) {
        super(options, verbose);
        this.webtorrent = undefined;    // Undefined till start WebTorrent
        this.options = options;         // Dictionary of options
        this.name = "WEBTORRENT";       // For console log etc
        this.supportURLs = ['magnet'];
        this.supportFunctions = ['fetch', 'createReadStream'];
        this.status = Transport.STATUS_LOADED;
    }

    p_webtorrentstart(verbose) {
        /*
        Start WebTorrent and wait until for ready.
         */
        let self = this;
        return new Promise((resolve, reject) => {
            this.webtorrent = new WebTorrent(this.options.webtorrent);
            this.webtorrent.once("ready", () => {
                console.log("WEBTORRENT READY");
                resolve();
            });
            this.webtorrent.once("error", (err) => reject(err));
            this.webtorrent.on("warning", (err) => {
                console.warn("WebTorrent Torrent WARNING: " + err.message);
            });
        })
    }

    static setup0(options, verbose) {
        /*
        First part of setup, create obj, add to Transports but dont attempt to connect, typically called instead of p_setup if want to parallelize connections.
        */
        let combinedoptions = Transport.mergeoptions(defaultoptions, options);
        console.log("WebTorrent options %o", combinedoptions);
        let t = new TransportWEBTORRENT(combinedoptions, verbose);
        Transports.addtransport(t);

        return t;
    }

    async p_setup1(verbose) {
        try {
            this.status = Transport.STATUS_STARTING;
            await this.p_webtorrentstart(verbose);
        } catch(err) {
            console.error("WebTorrent failed to connect",err);
            this.status = Transport.STATUS_FAILED;
        }
        return this;
    }

    async p_status(verbose) {
        /*
        Return a string for the status of a transport. No particular format, but keep it short as it will probably be in a small area of the screen.
         */
        if (this.webtorrent && this.webtorrent.ready) {
            this.status = Transport.STATUS_CONNECTED;
        } else if (this.webtorrent) {
            this.status = Transport.STATUS_STARTING;
        } else {
            this.status = Transport.STATUS_FAILED;
        }

        return this.status;
    }

    webtorrentparseurl(url) {
        /* Parse a URL
        url:    URL as string or already parsed into Url
        returns:    torrentid, path
         */
        if (!url) {
            throw new errors.CodingError("TransportWEBTORRENT.p_rawfetch: requires url");
        }

        const urlstring = typeof url === "string" ? url : url.href
        const index = urlstring.indexOf('/');

        if (index === -1) {
            throw new errors.CodingError("TransportWEBTORRENT.p_rawfetch: invalid url - missing path component. Should look like magnet:xyzabc/path/to/file");
        }

        const torrentId = urlstring.slice(0, index);
        const path = urlstring.slice(index + 1);

        return { torrentId, path }
    }

    async p_webtorrentadd(torrentId) {
        return new Promise((resolve, reject) => {
            // Check if this torrentId is already added to the webtorrent client
            let torrent = this.webtorrent.get(torrentId);

            // If not, then add the torrentId to the torrent client
            if (!torrent) {
                torrent = this.webtorrent.add(torrentId);

                torrent.once("error", (err) => {
                    reject(new errors.TransportError("Torrent encountered a fatal error " + err.message));
                });

                torrent.on("warning", (err) => {
                    console.warn("WebTorrent Torrent WARNING: " + err.message + " (" + torrent.name + ")");
                });
            }

            if (torrent.ready) {
                resolve(torrent);
            } else {
                torrent.once("ready", () => {
                    resolve(torrent);
                });
            }

            if (typeof window !== "undefined") {   // Check running in browser
                window.WEBTORRENT_TORRENT = torrent;
                torrent.once('close', () => {
                    window.WEBTORRENT_TORRENT = null
                })
            }
        });
    }

    webtorrentfindfile (torrent, path) {
        /*
        Given a torrent object and a path to a file within the torrent, find the given file.
         */
        const filePath = torrent.name + '/' + path;
        const file = torrent.files.find(file => {
            return file.path === filePath;
        });

        if (!file) {
            //debugger;
            throw new errors.TransportError("Requested file (" + path + ") not found within torrent ");
        }

        return file;
    }

    p_rawfetch(url, verbose) {
        /*
        Fetch some bytes based on a url of the form:

            magnet:xyzabc/path/to/file

        (Where xyzabc is the typical magnet uri contents)

        No assumption is made about the data in terms of size or structure.         Returns a new Promise that resolves to a buffer.

        :param string url: URL of object being retrieved
        :param boolean verbose: true for debugging output
        :resolve buffer: Return the object being fetched.
        :throws:        TransportError if url invalid - note this happens immediately, not as a catch in the promise
         */
        return new Promise((resolve, reject) => {
            if (verbose) console.log("WebTorrent p_rawfetch", url);

            const { torrentId, path } = this.webtorrentparseurl(url);
            this.p_webtorrentadd(torrentId)
                .then((torrent) => {
                    torrent.deselect(0, torrent.pieces.length - 1, false); // Dont download entire torrent as will pull just the file we want
                    const file = this.webtorrentfindfile(torrent, path);
                    file.getBuffer((err, buffer) => {
                        if (err) {
                            return reject(new errors.TransportError("Torrent encountered a fatal error " + err.message + " (" + torrent.name + ")"));
                        }
                        resolve(buffer);
                    });
                })
                .catch((err) => reject(err));
        });
    }

    createReadStream(url, opts, verbose) {
        /*
        Fetch bytes progressively, using a node.js readable stream, based on a url of the form:

            magnet:xyzabc/path/to/file

        (Where xyzabc is the typical magnet uri contents)

        No assumption is made about the data in terms of size or structure.         Returns a new Promise that resolves to a node.js readable stream.

        Node.js readable stream docs:
        https://nodejs.org/api/stream.html#stream_readable_streams

        :param string url: URL of object being retrieved
        :param boolean verbose: true for debugging output
        :returns stream: The readable stream.
        :throws:        TransportError if url invalid - note this happens immediately, not as a catch in the promise
         */
        if (verbose) console.log("TransportWEBTORRENT createreadstream %o %o", url, opts);

        const through = new stream.PassThrough();
        const { torrentId, path } = this.webtorrentparseurl(url);

        this.p_webtorrentadd(torrentId)
            .then((torrent) => {
                const file = this.webtorrentfindfile(torrent, path);
                const fileStream = file.createReadStream(opts);
                fileStream.pipe(through);
            })
            .catch((err) => {
                if (typeof through.destroy === 'function') through.destroy(err)
                else through.emit('error', err)
            });

        return through;
    }

    static async p_test(opts, verbose) {
        try {
            let transport = await this.p_setup(opts, verbose); // Assumes IPFS already setup
            if (verbose) console.log(transport.name, "setup");
            let res = await transport.p_status(verbose);
            console.assert(res === Transport.STATUS_CONNECTED)

            // Creative commons torrent, copied from https://webtorrent.io/free-torrents
            let bigBuckBunny = 'magnet:?xt=urn:btih:dd8255ecdc7ca55fb0bbf81323d87062db1f6d1c&dn=Big+Buck+Bunny&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fbig-buck-bunny.torrent/Big Buck Bunny.en.srt';

            let data1 = await transport.p_rawfetch(bigBuckBunny, verbose);
            data1 = data1.toString();
            assertData(data1);

            const stream = await transport.createReadStream(bigBuckBunny, verbose);

            const chunks = [];
            stream.on("data", (chunk) => {
                chunks.push(chunk);
            });
            stream.on("end", () => {
                const data2 = Buffer.concat(chunks).toString();
                assertData(data2);
            });

            function assertData(data) {
                // Test for a string that is contained within the file
                let expectedWithinData = "00:00:02,000 --> 00:00:05,000";

                console.assert(data.indexOf(expectedWithinData) !== -1, "Should fetch 'Big Buck Bunny.en.srt' from the torrent");

                // Test that the length is what we expect
                console.assert(data.length, 129, "'Big Buck Bunny.en.srt' was " + data.length);
            }
        } catch (err) {
            console.log("Exception thrown in TransportWEBTORRENT.p_test:", err.message);
            throw err;
        }
    }

}
Transports._transportclasses["WEBTORRENT"] = TransportWEBTORRENT;

exports = module.exports = TransportWEBTORRENT;
