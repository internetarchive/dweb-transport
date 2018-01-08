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

INCREMENTAL BRANCH
*   Fix content in ia-details-about   <<<#1
    Fix Search to properly match HTML returned by Search & Collection - see examples
    Below item-details
    Above Nav

Make links point at Dweb OR at gateway.dweb.me/content/archiveid/xxx/yyy
    Make React look in tag, and replace with a call

C Fetch from contenthash or ipfs if available
    - embedded images etc - routine plus object pointed to in body
    - NEEDS STREAMS: figure out how AV dispays and how to pass stream to it (maybe wait on Feross)
    - NEEDS STREAMS: figure out how text displays and how to pass stream to it

O Talk to Ferross
    DT Add BitTorrent to library
    DA Recognize magnet links
    DG Add the improvements from the doc

Naming - start implementing - need outline on both DT and DG and DA
    DT implement name

NEEDS PATH: Figure out pushing entire examples dir to ipfs and accessing via paths

Later
    Add other ways to fetch to metadata returned e.g webtorrent
    ArchiveItem - CL - for item
    ArchiveFile - SmartDict - holds metadata
    Make UI display IPFS/HTTP status indicators consistent.


STREAMS - fetches to return streams if req
PATH - URLs with paths in
REACT - React clone to spot img tag
LISTS - support for multiple list transports
*/


