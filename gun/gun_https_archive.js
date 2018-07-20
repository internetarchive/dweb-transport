//var port = process.env.OPENSHIFT_NODEJS_PORT || process.env.VCAP_APP_PORT || process.env.PORT || process.argv[2] || 8080;

process.env.GUN_ENV = "false";  // See other WORKAROUND-GUN-ENV hack around current default of true generating lots of errors
const Gun = require('gun');

const gun_https_hijackable = require('./gun_https_hijackable.js')
//global.verbose = true; // Include this if ever expand to use ArchiveItem

const usehttps = false;

// Create tempory gun, because have to call hijack (before 'new Gun()' for the server.
let guntemp = new Gun();
gun_https_hijackable.hijackFactory({gun: guntemp, path: 'arc/archive.org/metadata', url: 'http://dweb.me/arc/archive.org/metadata/', makepath: true, jsonify: true});

gun_https_hijackable.start( {
    usehttps: true,
    port: 4246,
    //usehttps: false,  // Use this for testing instead of above
    key: fs.readFileSync('/etc/letsencrypt/live/dweb.me/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/dweb.me/fullchain.pem'),
});