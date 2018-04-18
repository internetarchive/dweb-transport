/* Uncomment one of the next lines to select which transport to use */

const Transports = require('dweb-transports');
var Domain = require('./Domain'); // Required in non service worker case to ensure name resolution
//const Transports = require('./TransportsProxy');

exports = module.exports = Transports;
