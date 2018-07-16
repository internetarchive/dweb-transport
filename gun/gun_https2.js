//var port = process.env.OPENSHIFT_NODEJS_PORT || process.env.VCAP_APP_PORT || process.env.PORT || process.argv[2] || 8080;

const port = 4246;

const https = require('https');
const http = require('http');
const fs = require('fs');
process.env.GUN_ENV = "false";
const Gun = require('gun');
const path = require('path');

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

//TODO-GUN put this into a seperate require
Gun.on('opt', function (root) {
    if (root.once) {
        return
    }

    root.on('out', function (msg) {
        var to = this.to;
        // PSEUDO CODE!!!!!!! MAY NOT WORK (probably won't);
        if(msg['@']){
            if(!msg.put){
                console.log("XXX@C29: HIJACK!", msg);
                setTimeout(function(){

                    var tmp = msg['@'];
                    tmp = root.dup.s[tmp];
                    console.log("XXX@34 result of root.dup.s[msg['a']]", tmp)
                    tmp = tmp && tmp.it;
                    // REFACTOR THIS CODE TO MAKE SURE IT DOESN'T CRASH ON
                    // NON EXISTENT DATA OR ORIGINAL MESSAGE COULD NOT
                    // BE FOUND OR OTHER EDGE CASES
                    var soul = tmp && tmp.get && tmp.get['#'];
                    var key = tmp && tmp.get && tmp.get['.'];
                    var state = {};
                    console.log('XXX@41: soul key', soul, key);

                    msg.put = {};
                    msg.put[soul] = {_:{'#': soul, '>': state}};
                    state[key] = Gun.state();
                    msg.put[soul][key] = 'hello Mitra!';
                    // NOTE: this doesn't necessarily save it back to
                    // this peers GUN data.

                    to.next(msg);
                }, 100);
                return;
            }
        }
        to.next(msg) // pass to next middleware
    });
    this.to.next(root);
});


var gun = new Gun({
    web: server
});


server.listen(port);

console.log('Server started on port ' + port + ' with /gun');
