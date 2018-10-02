//var port = process.env.OPENSHIFT_NODEJS_PORT || process.env.VCAP_APP_PORT || process.env.PORT || process.argv[2] || 8080;
const fs = require('fs');
const os = require('os');
const gun_https_hijackable = require('./gun_https_hijackable.js')

// Create tempory gun, because have to call hijack (before 'new Gun()' for the server.
//usehttps = ['wwwb-dev0.fnf.archive.org'].includes(os.hostname()); // Are we running on a site with the key below
// Use existence of certificate as reason to go https
// On dweb.me it does https, on mitraglass not, on docker probably will have this cert in ingress
//TODO figure out how to configure where gun is storing its data

usehttps = fs.existsSync('/etc/letsencrypt/live/dweb.me/privkey.pem');

gun = gun_https_hijackable.start( {
            usehttps:   usehttps,
            port:       4246,
            key:        usehttps ? fs.readFileSync('/etc/letsencrypt/live/dweb.me/privkey.pem') : undefined,
            cert:       usehttps ? fs.readFileSync('/etc/letsencrypt/live/dweb.me/fullchain.pem') : undefined,
});

gun_https_hijackable.hijackFactory(gun, {path: 'arc/archive.org/metadata', url: 'http://dweb.me/arc/archive.org/metadata/', jsonify: true});
//gun_https_hijackable.hijackFactory( gun, {soul: 'jjtc2zr99fqIZp9t0RxE', url: 'http://dweb.me/arc/archive.org/metadata/', jsonify: true});
