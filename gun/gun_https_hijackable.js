//var port = process.env.OPENSHIFT_NODEJS_PORT || process.env.VCAP_APP_PORT || process.env.PORT || process.argv[2] || 8080;

const https = require('https');
const http = require('http');
const fs = require('fs');
process.env.GUN_ENV = "false";  // See other WORKAROUND-GUN-ENV hack around current default of true generating lots of errors
const Url = require('url');
const Gun = require('gun');
const path = require('gun/lib/path.js');
const httptools = require('dweb-transports/httptools.js');
const errors = require('dweb-transports/Errors.js');

//TODO-GUN put this into a seperate require - not sure "best" Gun-ish way to do this extension


function hijackFactory({soul=undefined, path=undefined, url=undefined, cb=undefined, jsonify=false}={}) {
    console.log("GUN: Hikacking loading trap");
    Gun.on('opt',root => {
        if (!root.once) {
            _hijackFactory(root, this, {soul, path, url, cb, jsonify});  // This is next for the Gun.on('opt'), not for the root.on('out')
        } } ); // _hijackFactory is async and calls to.next(root) to chain to next.
}



function _hijackFactory(root, self, {soul=undefined, path=undefined, url=undefined, cb=undefined, jsonify=false}={}) {
    /* Intercept outgoing message and replace result with
        result from cb({soul, key, msg, original})
        Note that hijack should be called before the 'new Gun()' call
     */

    if (typeof soul === "undefined" && typeof path !== "undefined") {
        root.gun.path(path.split('/')).put({}) // Find the path, create if doesnt exist
            .get(function(soul){ _hijackFactory(root, self, {soul, url, cb, jsonify});}, true); // Get its soul and recurse (allowing recursion to call to.next
            //TODO-GUN handle errors if cant make that path.
        return;
    }
    if (url) {
        let urltoextend = Url.parse(url).href;    // Support url as string or Url structure
        let soulwanted = soul;
        cb = function({soul=undefined, key=undefined}={}) { // Doesnt use msg or original parameters to cb
            if (soul === soulwanted) {
                return httptools.p_GET(urltoextend + key)
                    .then(data => jsonify ? JSON.stringify(data) : data)
                    .catch(err => { if (err instanceof errors.TransportError) { return undefined } else throw err; }) ;
            }
            return undefined; // Not hijacking
        }
    }
    // By here cb and soul should always be defined


    if (cb) {

        root.on('out', function (msg) {   // Wrap a simple callback function so it captures a soul and returns message
            //console.log("GUN: Hikacking starting outgoing message=", msg);
            let to = this.to;
            // TODO-GUN - this wont work when running locally in node ONLY when running in server
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
        console.log("Hijacked",path || "", "at soul", soul, "to", url ? Url.parse(url).href : "a callback");
    }
    self.to.next();
}

function start({usehttps=true, key=undefined, cert=undefined, dirname=undefined, port=undefined}={}) {
    /*
    usehttps:   True if should use https, otherwise uses http (sometimes better for testing)
    key:    Path to key certificate
    cert:   Path to cert
    dirname:    Path to directory to serve static files from (without trailing "/")
     */
    function _serve(req, res) {
        if(Gun.serve(req, res)){ return } // filters gun requests!
        if (dirname) {  // Note this is untested, copied from something I got form @amark
            fs.createReadStream(path.join(dirname, req.url))    // Note I'm assuming this is the Gun "path" model - intent might be the NPM module ?
                .on('error',function(){ // static files!
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.end(fs.readFileSync(path.join(__dirname, 'index.html'))); // or default to index
                })
                .pipe(res);
            return;
        } // stream
        // Drop through to a "Go away" prompt
        res.writeHead(200);
        res.end('go away - nothing for browsers here\n');
    }

    const server = usehttps
        ? https.createServer( {key, cert}, _serve)
        : http.createServer(_serve); // HTTPS.createServer has different syntax

    // noinspection JSUnusedLocalSymbols
    var gun = new Gun({
        web: server
    });
    server.listen(port);
    console.log(usehttps ? "HTTPS" : "HTTP", 'Server started on port ' + port + ' with /gun');
}

exports = module.exports = { start, hijackFactory };
