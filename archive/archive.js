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

class ArchiveItem - CL - for item
class ArchiveFile - SmartDict - holds metadata
rework rest of code to use them instead of plain dicts with metadata
{createImage(Archivefile) } or { ArchiveFileInstance.createImageJSX() }
    returns Image tag with no src
    runs async to fetch it - passed pointer to image element -
    on fetch turns into blob

gateway.dweb.me/content/archiveid/xxx/yyy
    DT links maybe should point at above (even prior to fetching via Dweb)
TEST DA add Transport libraries
    C (later) make UI display IPFS/HTTP consistent.
C Fetch from contenthash or ipfs if available
    - embedded images etc - routine plus object pointed to in body
    - content objects, probably just in images for now
    - figure out how AV dispays and how to pass stream to it (maybe wait on Feross)
    - figure out how text displays and how to pass stream to it    
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


