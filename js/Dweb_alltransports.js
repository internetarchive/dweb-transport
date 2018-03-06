require("./Dweb.js");
// Order is significant as should search earlier ones first
// put IPFS before Webtorrent for showcasing, as Webtorrent works in some cases IPFS doesnt so that way we exercise both
require("./TransportHTTP.js");
require("./TransportIPFS.js");
require("./TransportYJS.js");
require("./TransportWEBTORRENT.js");

