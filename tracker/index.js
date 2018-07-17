const Server = require('bittorrent-tracker').Server;

const httptools = require('dweb-transports/httptools');

const config = {
    validateurl: 'https://archive.org/advancedsearch.php?fl=identifier,btih&output=json&rows=1&q=btih:',
    opentracker: true,  // Set to false to check BTIH exists before tracking
    superpeers: [],
    /*
    superpeers: [ {
        type: 'udp',
        complete: true,
        peerId:  '2d5757303039382d494c414465783166346c7351', // random peer id must match that in superpeer
        ip: '12.34.56.78',
        port: 6881
    } ]
    */
};

//TODO-WEBTORRENT - replace logging here to write to somewhere useful (currently goes to console) OR redirect in calling sript

const server = new Server({
  udp: true, // enable udp server?
  http: true, // enable http server?
  ws: true, // enable websocket server?
  stats: true, // enable web-based statistics?
  filter: async function (infoHash, params, cb) {
    // Blacklist/whitelist function for allowing/disallowing torrents. If this option is
    // omitted, all torrents are allowed. It is possible to interface with a database or
    // external system before deciding to allow/deny, because this function is async.

    // It is possible to block by peer id (whitelisting torrent clients) or by secret
    // key (private trackers). Full access to the original HTTP/UDP request parameters
    // are available in `params`.
    // infohash - TODO - figure out what the format of this is - looks like its hex
    try {
        if (opentracker) { cb(null); } // If its open its easy
        let onarchive = await httptools.p_GET(config.validateurl + infoHash)
        if (onarchive.response.numFound) { //ensure that torrent is an Internet Archive torrent
            // If the callback is passed `null`, the torrent will be allowed.
            console.log("Ok for btih", infoHash);
            cb(null)
        } else {
            // If the callback is passed an `Error` object, the torrent will be disallowed
            // and the error's `message` property will be given as the reason.
            console.log("Denying btih", infoHash);
            cb(new Error('disallowed torrent'))
        }
    } catch(err) {
      console.error("Error in Webtorrent tracker filter", err);
      cb(err);
    }
  }
});

server.on('error', (err) => {
  // fatal server error!
  console.error('ERROR: ' + err.message)
});

server.on('warning', (err) => {
  // client sent bad data. probably not a problem, just a buggy client.
  console.error('WARNING: ' + err.message)
});

server.on('listening', () => {
  // fired when all requested servers are listening
  console.log('listening on http port: ' + server.http.address().port);
  console.log('listening on udp port: ' + server.udp.address().port);
  console.log('listening on ws port: ' + server.ws.address().port)
});

/**
 * Always return an extra Internet Archive torrent peer(s).
 *
 * Monkey-patch the "createSwarm" function, so we can get at the swarm object
 * and monkey-patch the "_getPeers" function to always return an extra peer.
 */
const createSwarmOriginal = server.createSwarm;
server.createSwarm = (infoHash, cb) => {
  createSwarmOriginal.call(server, infoHash, (err, swarm) => {
    if (err) return cb(err)

    const getPeersOriginal = swarm._getPeers;
    swarm._getPeers = (numwant, ownPeerId, isWebRTC) => {
      const peers = getPeersOriginal.call(swarm, numwant, ownPeerId, isWebRTC);
      if (!isWebRTC) {
        config.superpeers.forEach(p => peers.push(p));
      }
      return peers
    };

    cb(null, swarm)
  })
};

// start tracker server listening! Use 0 to listen on a random free port.
server.listen(6969);
