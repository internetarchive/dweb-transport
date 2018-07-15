//var port = process.env.OPENSHIFT_NODEJS_PORT || process.env.VCAP_APP_PORT || process.env.PORT || process.argv[2] || 8080;

const port = 4246;

const https = require('https');
const fs = require('fs');
const Gun = require('gun');
const path = require('path');

const options = {
    key: fs.readFileSync('/etc/letsencrypt/live/dweb.me/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/dweb.me/fullchain.pem'),
};

var server = https.createServer(options, (req, res) => {
	if(Gun.serve(req, res)){ return } // filters gun requests!
    res.writeHead(200);
    res.end('hello world\n');

	/*
	fs.createReadStream(path.join(__dirname, req.url))
    .on('error',function(){ // static files!
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(fs.readFileSync(path.join(__dirname, 'index.html'))); // or default to index
        })
    .pipe(res); // stream
    */
});

var gun = Gun({
	web: server
});

server.listen(port);

console.log('Server started on port ' + port + ' with /gun');
