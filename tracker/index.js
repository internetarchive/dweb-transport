const Server = require('bittorrent-tracker').Server;
const ip = require('ip')

//TODO-WEBTORRENT - replace logging here to write to somewhere useful (currently goes to console) OR redirect in calling sript

const config = require('../seeder-config.json')
const common = require('../common')

const server = new Server({
  udp: true, // enable udp server?
  http: true, // enable http server?
  ws: true, // enable websocket server?
  stats: true, // enable web-based statistics?
  filter: function (infoHash, params, cb) {
    // Blacklist/whitelist function for allowing/disallowing torrents. If this option is
    // omitted, all torrents are allowed. It is possible to interface with a database or
    // external system before deciding to allow/deny, because this function is async.
    common.getTorrentFile(infoHash, (err) => {
      // If the callback is passed an `Error` object, the torrent will be disallowed
      // and the error's `message` property will be given as the reason.
      if (err)
        cb(new Error('disallowed torrent'))
      else
        cb(null) // If the callback is passed `null`, the torrent will be allowed.
    })
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
        // make list of peers we already have to avoid duplicates
        const peerIds = {}
        peers.forEach((p) => {
          if (p.type === 'udp')
            peerIds[p.peerId] = true
        })

        // add all seeders in our config
        config.seeders.forEach((peer) => {
          // skip dupes
          if (!peerIds[peer.peerId]) {
            // put on the front of the list
            peers.unshift({
              type: 'udp',
              complete: true,
              peerId: peer.peerId,
              ip: peer.ip || ip.address(),
              port: peer.torrentPort
            })
          }
        })
      }

      peers.splice(numwant) // don't announce more peers than desired
      return peers
    };

    cb(null, swarm)
  })
};

// start tracker server listening! Use 0 to listen on a random free port.
server.listen(6969);
