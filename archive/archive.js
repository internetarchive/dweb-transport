//var React = require('react');
//var ReactDOM = require('react-dom');
var Details = require('./Details').default;
var Search = require('./Search').default;
var Nav = require('./Nav').default;
//window.Dweb = require('../js/Dweb');
window.Nav = Nav;
/*
TODO-DETAILS-DIST outline of work
O can I search on contenthash - ask if doesnt work
    If ... DG Add contenthash search
BREW check if should add to metadata and/or search
DT Transport refactor
    For lists ... waiting on S @ Orbit

* rework rest of code to use ArchiveFile & ArchiveItem instead of plain dicts with metadata
* Fix Search to properly match HTML returned by Search & Collection
    - dowmload example, then can work on it offline

Make links point at Dweb OR at gateway.dweb.me/content/archiveid/xxx/yyy
C Fetch from contenthash or ipfs if available
    - fix tests so works on HTTP, IPFS or HTTP+IPFS
    - embedded images etc - routine plus object pointed to in body
    - content objects, probably just in images for now
    - figure out how AV dispays and how to pass stream to it (maybe wait on Feross)
    - figure out how text displays and how to pass stream to it    
O Talk to Ferross
    DT Add BitTorrent to library
    DA Recognize magnet links
    DG Add the improvements from the doc
Naming - start implementing - need outline on both DT and DG and DA
Later
    Add other ways to fetch to metadata returned e.g webtorrent
        @IA Need to know how to get to Magnet link
    ArchiveItem - CL - for item
    ArchiveFile - SmartDict - holds metadata
    @IA C (later) make UI display IPFS/HTTP status indicators consistent.


*/


