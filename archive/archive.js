//var React = require('react');
//var ReactDOM = require('react-dom');
var Details = require('./Details').default;
var Search = require('./Search').default;
var Nav = require('./Nav').default;
window.Nav = Nav;
/*
TODO-DETAILS-DIST outline of work
O can I search on contenthash - ask if doesnt work
    If ... DG Add contenthash search
BREW check if should add to metadata and/or search
DT Transport refactor
    For lists ... waiting on S @ Orbit
    Support http urls https://github.com/internetarchive/dweb-transport/issues/17
DA add Transport libraries
    C (later) make UI display IPFS/HTTP consistent.
    C Fetch from contenthash or ipfs if available
O Talk to Ferross
    DT Add BitTorrent to library
    DA Recognize magnet links
    DG Add the improvements from the doc
O talk to Brew re Naming
    DT implement name
Later
    Add other ways to fetch to metadata returned e.g webtorrent
        Need to know how to get to Magnet link


*/


