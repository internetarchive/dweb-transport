/*
This Transport layers builds on WebTorrent

Y Lists have listeners and generate events - see docs at ...
*/

// WebTorrent components

const WebTorrent = require('webtorrent');

// Other Dweb modules
const Transport = require('./Transport');
const Dweb = require('./Dweb');

let defaultoptions = {
    webtorrent: {}
};

class TransportWebTorrent extends Transport {
    /*
    WebTorrent specific transport

    Fields:
    webtorrent: object returned when starting webtorrent
     */

    constructor(options, verbose) {
        super(options, verbose);
        this.webtorrent = undefined;    // Undefined till start WebTorrent
        this.options = options;         // Dictionary of options
        this.name = "WebTorrent";       // For console log etc
        this.supportURLs = ['magnet'];
        this.supportFunctions = ['fetch', 'createreadstream'];
        this.status = Dweb.Transport.STATUS_LOADED;
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
            })
        })
    }

    static setup0(options, verbose) {
        /*
        First part of setup, create obj, add to Transports but dont attempt to connect, typically called instead of p_setup if want to parallelize connections.
        */
        let combinedoptions = Transport.mergeoptions(defaultoptions, options);
        console.log("WebTorrent options %o", combinedoptions);
        let t = new TransportWebTorrent(combinedoptions, verbose);
        Dweb.Transports.addtransport(t);

        return t;
    }

    async p_setup1(verbose) {
        try {
            this.status = Dweb.Transport.STATUS_STARTING;
            await this.p_webtorrentstart(verbose);
        } catch(err) {
            console.error("WebTorrent failed to connect",err);
            this.status = Dweb.Transport.STATUS_FAILED;
        }
        return this;
    }

    async p_status(verbose) {
        /*
        Return a string for the status of a transport. No particular format, but keep it short as it will probably be in a small area of the screen.
         */
        if (this.webtorrent && this.webtorrent.ready) {
            this.status = Dweb.Transport.STATUS_CONNECTED;
        } else if (this.webtorrent) {
            this.status = Dweb.Transport.STATUS_STARTING;
        } else {
            this.status = Dweb.Transport.STATUS_FAILED;
        }

        return this.status;
    }

    p_rawfetch(url, verbose) {
        /*
        Fetch some bytes based on a url of the form:

            magnet:XXXXXX/path/to/file

        (Where XXXXXX is the typical magnet uri contents)

        No assumption is made about the data in terms of size or structure.         Returns a new Promise that resolves to a buffer.

        :param string url: URL of object being retrieved
        :param boolean verbose: True for debugging output
        :resolve buffer: Return the object being fetched.
        :throws:        TransportError if url invalid - note this happens immediately, not as a catch in the promise
         */
        return new Promise((resolve, reject) => {
            if (verbose) console.log("WebTorrent p_rawfetch", url);

            if (!url) {
                return reject(new Dweb.errors.CodingError("TransportWebTorrent.p_rawfetch: requires url"));
            }

            const index = url.indexOf('/');

            if (index === -1) {
                return reject(new Dweb.errors.CodingError("TransportWebTorrent.p_rawfetch: invalid url - missing path component. Should look like magnet:XXXXXX/path/to/file"));
            }

            const torrentId = url.slice(0, index);
            const path = url.slice(index + 1);

            // Check if this torrentId is already added to the webtorrent client
            let torrent = this.webtorrent.get(torrentId);

            // If not, then add the torrentId to the torrent client
            if (!torrent) {
                torrent = this.webtorrent.add(torrentId);
            }

            torrent.once("error", (err) => {
                reject(new Dweb.errors.TransportError("Torrent encountered a fatal error " + err.message));
            })

            torrent.on("warning", (err) => {
                console.warn("WebTorrent Torrent WARNING: " + err.message + " (" + torrent.name + ")");
            })

            torrent.on("ready", () => {
                const filePath = torrent.name + '/' + path;
                const file = torrent.files.find(file => {
                    return file.path === filePath;
                });

                if (!file) {
                    return reject(new Dweb.errors.TransportError("Requested file (" + path + ") not found within torrent " + err.message));
                }

                file.getBuffer((err, buffer) => {
                    if (err) {
                        return reject(new Dweb.errors.TransportError("Torrent encountered a fatal error " + err.message + " (" + torrent.name + ")"));
                    }
                    resolve(buffer);
                })
            })
        })
    }

    // TODO
    static async test(transport, verbose) {
        // Creative commons torrent, copied from https://webtorrent.io/free-torrents
        let bigBuckBunny = 'magnet:?xt=urn:btih:dd8255ecdc7ca55fb0bbf81323d87062db1f6d1c&dn=Big+Buck+Bunny&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fbig-buck-bunny.torrent/Big Buck Bunny.en.srt'

        let data = await transport.p_rawfetch(bigBuckBunny, verbose);
        data = data.toString()

        // Test for a string that is contained within the file
        let expectedWithinData = '00:00:02,000 --> 00:00:05,000'
        console.assert(data.indexOf(expectedWithinData) !== -1, "Should fetch 'Big Buck Bunny.en.srt' from the torrent");

        // Test that the length is what we expect
        console.assert(data.length, 129, "'Big Buck Bunny.en.srt' was " + data.length)
    }

}
exports = module.exports = TransportWebTorrent;
