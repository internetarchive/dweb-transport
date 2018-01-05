const Server = require('bittorrent-tracker').Server

const server = new Server({
  udp: true, // enable udp server?
  http: true, // enable http server?
  ws: true, // enable websocket server?
  stats: true, // enable web-based statistics?
  filter: function (infoHash, params, cb) {
    // Blacklist/whitelist function for allowing/disallowing torrents. If this option is
    // omitted, all torrents are allowed. It is possible to interface with a database or
    // external system before deciding to allow/deny, because this function is async.

    // It is possible to block by peer id (whitelisting torrent clients) or by secret
    // key (private trackers). Full access to the original HTTP/UDP request parameters
    // are available in `params`.

    if (true /* TODO: ensure that torrent is an Internet Archive torrent */) {
      // If the callback is passed `null`, the torrent will be allowed.
      cb(null)
    } else {
      // If the callback is passed an `Error` object, the torrent will be disallowed
      // and the error's `message` property will be given as the reason.
      cb(new Error('disallowed torrent'))
    }
  }
})

server.on('error', (err) => {
  // fatal server error!
  console.error('ERROR: ' + err.message)
})

server.on('warning', (err) => {
  // client sent bad data. probably not a problem, just a buggy client.
  console.error('WARNING: ' + err.message)
})

server.on('listening', () => {
  // fired when all requested servers are listening
  console.log('listening on http port: ' + server.http.address().port)
  console.log('listening on udp port: ' + server.udp.address().port)
  console.log('listening on ws port: ' + server.ws.address().port)
})

/**
 * Always return an extra Internet Archive torrent peer.
 *
 * Monkey-patch the "createSwarm" function, so we can get at the swarm object
 * and monkey-patch the "_getPeers" function to always return an extra peer.
 */
const createSwarmOriginal = server.createSwarm
server.createSwarm = (infoHash, cb) => {
  createSwarmOriginal.call(server, infoHash, (err, swarm) => {
    if (err) return cb(err)

    const getPeersOriginal = swarm._getPeers
    swarm._getPeers = (numwant, ownPeerId, isWebRTC) => {
      const peers = getPeersOriginal.call(swarm, numwant, ownPeerId, isWebRTC)
      if (!isWebRTC) {
        peers.push({
          type: 'udp',
          complete: true,
          peerId: '2d5757303039382d494c414465783166346c7351', // random peer id
          ip: '12.34.56.78',
          port: 6881
        })
      }
      return peers
    }

    cb(null, swarm)
  })
}

// start tracker server listening! Use 0 to listen on a random free port.
server.listen(6969)
