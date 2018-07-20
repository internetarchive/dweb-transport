//var port = process.env.OPENSHIFT_NODEJS_PORT || process.env.VCAP_APP_PORT || process.env.PORT || process.argv[2] || 8080;
const fs = require('fs');
const gun_https_hijackable = require('./gun_https_hijackable.js')
//global.verbose = true; // Include this if ever expand to use ArchiveItem

// Create tempory gun, because have to call hijack (before 'new Gun()' for the server.
gun_https_hijackable.hijackFactory({path: 'arc/archive.org/metadata', url: 'http://dweb.me/arc/archive.org/metadata/', jsonify: true});

usehttps = false;

gun_https_hijackable.start( {
    usehttps:   usehttps,
    port:       4246,
    key:        usehttps ? fs.readFileSync('/etc/letsencrypt/live/dweb.me/privkey.pem') : undefined,
    cert:       usehttps ? fs.readFileSync('/etc/letsencrypt/live/dweb.me/fullchain.pem') : undefined,
});