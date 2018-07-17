//var port = process.env.OPENSHIFT_NODEJS_PORT || process.env.VCAP_APP_PORT || process.env.PORT || process.argv[2] || 8080;

//TODO-GUN move to own repo
const port = 4246;

const https = require('https');
const http = require('http');
const fs = require('fs');
process.env.GUN_ENV = "false";
const Gun = require('gun');
const path = require('path');   // Part of gun - seems strange as its a standard npm/node feature
const httptools = require('dweb-transports/httptools.js');
const errors = require('dweb-transports/Errors.js');
//ArchiveItem = require('dweb-archive/ArchiveItem');
//global.DwebTransports = require('dweb-transports/index.js'); //TODO-MIRROR move to repo
global.verbose = true; // Global needed by ArchiveItem

const usehttps = false;

const options =
    usehttps ?  {
        key: fs.readFileSync('/etc/letsencrypt/live/dweb.me/privkey.pem'),
        cert: fs.readFileSync('/etc/letsencrypt/live/dweb.me/fullchain.pem'),
    }  : {};

var h = usehttps ? https : http
//var server = h.createServer(options, (req, res) => {
var server = h.createServer((req, res) => {
	if(Gun.serve(req, res)){ return } // filters gun requests!
    res.writeHead(200);
    res.end('go away - nothing for browsers here\n');

	/*
	fs.createReadStream(path.join(__dirname, req.url))
    .on('error',function(){ // static files!
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(fs.readFileSync(path.join(__dirname, 'index.html'))); // or default to index
        })
    .pipe(res); // stream
    */
});


//TODO-GUN put this into a seperate require - not sure "best" Gun-ish way to do this extension
function hijack(cb) {
    /* Intercept outgoing message and replace result with
        result from cb({soul, key, msg, original})
        Note that hijack should be called before the 'new Gun()' call
     */
    Gun.on('opt', function (root) {
        console.log("GUN: Hikacking loading trap");
        if (root.once) {
            return
        }
        root.on('out', function (msg) {
            //console.log("GUN: Hikacking starting outgoing message=", msg);
            let to = this.to;
            // TODO-GUN - this wont work when running locally in a script ONLY when running in server
            if(msg['@'] && !msg.put) {
                console.log("GUN: Hikacking outgoing message"); //, msg);
                let tmp = root.dup.s[msg['@']];
                let original = tmp && tmp.it && tmp.it.get;
                console.log("GUN: Hikacking outgoing message original=", original);
                if (original) {
                    let soul = original['#'];
                    let key = original['.'];
                    console.log("GUN.hijack: soul=",soul,"key=", key);
                    function _updateAndForward(data) {
                        if (typeof data !== "undefined") {
                            msg.put = {
                                [soul]: {
                                    _: {
                                        '#': soul,
                                        '>': {[key]: Gun.state()}
                                    },
                                    [key]: data      // Note undefined should (hopefully) be a valid response
                                }
                            };
                            console.log("GUN.hijack updated msg with data =", data);
                        }
                        to.next(msg);           // Pass on to next callback to process
                    }

                    let res = cb({soul, key, msg, original});  // Sync or Async callback should return promise // Note can resolve to undefined if error
                    if (res instanceof Promise) {
                        res.then(data => { _updateAndForward(data); })
                        .catch(err => {
                            console.warn("Gun.hijack promise error", err);
                            to.next(msg); // Pass it on, hijack failed
                        });
                    } else { // either data, or undefined
                        _updateAndForward(res);
                    }
                    // NOTE: this doesn't necessarily save it back to
                    // this peers GUN data, (I (Mitra) thinks that may depend on other processes and order of Gun.on)
                } else {
                    to.next(msg);   // No original pass it on
                }
            } else {
                to.next(msg); // pass to next middleware
            }
        });
        this.to.next(root); // This is next for the Gun.on('opt'), not for the root.on('out')
    });
}

// Call hijack (before 'new Gun()'

hijack(function({soul=undefined, key=undefined, msg=undefined, original=undefined}={}) {
    //console.log("GUN: hijack callback", soul, key, msg, original);
    if (soul === "metadata") {
        //TODO - should this be one level deeper in GUN to save storage of long values
        url = `http://dweb.me/arc/archive.org/metadata/${key}`;
        return httptools.p_GET(url)
            .then(data => JSON.stringify(data))
            .catch(err => { if (err instanceof errors.TransportError) { return undefined } else throw err; }) ;
        //return new ArchiveItem({itemid: key}).fetch().then(ai => JSON.stringify(ai.metadata));  // Recurses into looking it up by name
    }
    return undefined; // Not hijacking
});

var gun = new Gun({
    web: server
});

server.listen(port);
console.log(usehttps ? "HTTPS" : "HTTP", 'Server started on port ' + port + ' with /gun');

//TODO-GUN tie into Leaf records for Metadata, as alternative to looking up in Leaf  gun:/gun/metadata/* or /gun/peers/metadata/*
//TODO-GUN make hijack support name lookup of /arc/archive.org/foo