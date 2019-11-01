#!/usr/bin/env node

// Test gun independently of testing dweb-transports/TransportGUN

GUN = require('gun');
options = {peers: [ "https://dweb.me:4246/gun" ]}
let g = new GUN(options);
g.get('arc').get('archive.org').get('metadata').get('AboutBan1935').once(res => console.log("Result of once", res));
console.log("Trying '.on'");
// Note shouldnt have leading slash as none in gun_https_archive.js
g.get('arc').get('archive.org').get('metadata').get('AboutBan1935').on(res => console.log("Result of on", res));
