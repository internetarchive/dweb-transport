#!/usr/bin/env node

const debug = require('debug')('seeder')
const WebTorrent = require('webtorrent')
const Peer = require('webtorrent/lib/peer')
const request = require('request')
const trammel = require('trammel')
const path = require('path')
const mkdirp = require('mkdirp')
const rimraf = require('rimraf')
const filesizeParser = require('filesize-parser')
const arrayRemove = require('unordered-array-remove')
const WebSocketTracker = require('bittorrent-tracker/lib/client/websocket-tracker')
const parseTorrent = require('parse-torrent')
const WebSocket = require('simple-websocket')

const makePassthroughStore = require('./passthrough-chunk-store')
const config = global.SEEDER_CONFIG || require('../seeder-config')

const CACHE_PATH = config.cachePath
if (!CACHE_PATH)
  badConfig('cache path not specified')

const TRACKER_RECONNECT_SECONDS = config.trackerReconnectSeconds || 60

const MAX_CACHE = filesizeParser(config.maxCacheSize || 0)
const CACHE_CHECK_INTERVAL = config.cacheCheckIntervalSeconds
if (MAX_CACHE && !CACHE_CHECK_INTERVAL)
  badConfig('cache check interval not specified')

let configSeederIndex = 0
if (process.argv.length >= 3) {
  configSeederIndex = +process.argv[2]
}

let seederEntry = config.superPeers[configSeederIndex]
if (!seederEntry.peerId || !seederEntry.torrentPort)
  badConfig('invalid peer id or port')

function badConfig(message) {
  console.error(message)
  process.exit(1)
}

rimraf.sync(CACHE_PATH)
mkdirp.sync(CACHE_PATH)

// least recent at front
let lruFetcherTorrents = []

function cacheManagementError (err) {
  console.error('Error while maintaining maximum cache size:', err)
  setCacheTimer()
}

// deletes oldest torrents while too much space is being used
function deleteOldest (size) {
  debug('total size:', size)
  if (size < MAX_CACHE)
    return setCacheTimer()

  debug('doing eviction; torrent list:', lruFetcherTorrents.map(t => t.infoHash))
  const oldest = lruFetcherTorrents.shift()
  oldest.destroy(function (err) {
    if (err) return cacheManagementError(err)
    debug('destroyed torrent object')
    trammel(oldest.path, {
      type: 'raw'
    }, function (err, torrentSize) {
      if (err) return cacheManagementError(err)
      debug('evictable torrent size:', torrentSize)
      rimraf(oldest.path, function (err) {
        if (err) return cacheManagementError(err)
        debug('deleted torrent files')
        deleteOldest(size - torrentSize)
      })
    })
  })
}

function setCacheTimer () {
  setTimeout(function () {
    trammel(CACHE_PATH, {
      type: 'raw'
    }, function (err, size) {
      if (err) return cacheManagementError(err)

      deleteOldest(size)
    })
  }, CACHE_CHECK_INTERVAL * 1000)
}

if (MAX_CACHE)
  setCacheTimer()

const socketPool = WebSocketTracker._socketPool
let trackerSocket
function createWSTrackerConnection () {
  const url = config.trackerUrl
  if (socketPool[url])
    return

  debug('connecting to websocket traker')
  const socket = socketPool[url] = new WebSocket(url)
  socket.consumers = 1
  trackerSocket = socket

  socket.on('error', remove)
  socket.on('close', remove)
  socket.on('data', onData)

  function remove () {
    debug('disconnecting from websocket server')
    if (socketPool[url] === socket) {
      trackerSocket = null
      delete socketPool[url]
    }

    socket.removeEventListener('error', remove)
    socket.removeEventListener('close', remove)
    socket.removeEventListener('data', onData)

    setTimeout(createWSTrackerConnection, TRACKER_RECONNECT_SECONDS * 1000)
  }

  function onData (data) {
    try {
      data = JSON.parse(data)
    } catch (err) {
      return console.warn('bad tracker data:', err)
    }

    const infoHash = Buffer.from(data.info_hash, 'binary').toString('hex')
    if (data.action === 'announce') {
      const torrent = seeder.get(infoHash)
      if (!torrent) {
        debug('unknown torrent (webrtc)')
        // this torrent is unknown. Add it.
        handleUnknownTorrent(infoHash, (err, torrent) => {
          if (err) {
            return console.error('failure to handle unknown torrent:', err)
          }

          const success = torrent.discovery.tracker._trackers.some(tracker => {
            if (tracker.announceUrl === url && tracker._onSocketDataBound) {
              // found it! replay data event
              tracker._onSocketDataBound(data)
              return true
            }
            return false
          })

          if (!success) {
            console.error('failed to find tracker connection for newly-created torrent; infoHash:', infoHash)
          }
        })
      }
    }
  }
}

if (config.trackerUrl)
  createWSTrackerConnection()

let trackerConfig
if (seederEntry.wrtc === 'wrtc') {
  trackerConfig = {
    wrtc: require('wrtc')
  }
} else if (seederEntry.wrtc === 'electron-webrtc') {
  trackerConfig = {
    wrtc: require('electron-webrtc')()
  }
}

var seeder = new WebTorrent({
	peerId: seederEntry.peerId,
	torrentPort: seederEntry.torrentPort,
  dht: false,
  tracker: trackerConfig
})

var fetcher = new WebTorrent({
  tracker: false,
  dht: false
})

// ugly monkey patch (for now)
seeder._tcpPool._onConnection = function (conn) {
 var self = this

  // If the connection has already been closed before the `connect` event is fired,
  // then `remoteAddress` will not be available, and we can't use this connection.
  // - Node.js issue: https://github.com/nodejs/node-v0.x-archive/issues/7566
  // - WebTorrent issue: https://github.com/webtorrent/webtorrent/issues/398
  if (!conn.remoteAddress) {
    conn.on('error', noop)
    conn.destroy()
    return
  }

  self._pendingConns.push(conn)
  conn.once('close', cleanupPending)

  var peer = Peer.createTCPIncomingPeer(conn)

  var wire = peer.wire
  wire.once('handshake', onHandshake)

  function onHandshake (infoHash, peerId) {
    debug('onHandshake')
    cleanupPending()

    var torrent = self._client.get(infoHash)
    if (torrent) {
      onTorrentFound(torrent)
    } else {
      debug('unknown torrent (tcp)')
      handleUnknownTorrent(infoHash, function (err, torrent) {
        if (err) {
          console.error('failure to handle unknown torrent:', err)
          return peer.destroy(err)
        }
        onTorrentFound(torrent)
      })
    }

    function onTorrentFound (torrent) {
      peer.swarm = torrent
      torrent._addIncomingPeer(peer)
      peer.onHandshake(torrent.infoHash, peerId)
    }
  }

  function cleanupPending () {
    conn.removeListener('close', cleanupPending)
    wire.removeListener('handshake', onHandshake)
    if (self._pendingConns) {
      arrayRemove(self._pendingConns, self._pendingConns.indexOf(conn))
    }
  }
}

// call when torrent accessed; moves torrent to back of lru list
function setRecentlyUsed (torrent) {
  const index = lruFetcherTorrents.indexOf(torrent)
  if (index >= 0)
    lruFetcherTorrents.splice(index, 1)

  lruFetcherTorrents.push(torrent)
}

function handleUnknownTorrent (infoHash, cb) {
  getTorrentFile(infoHash, function (err, torrentFile) {
    if (err) return cb(err)
    makeStore(infoHash, torrentFile, function (err, storeConstructor) {
      if (err) return cb(err)

      debug('creating seeder torrent')
      const parsed = parseTorrent(torrentFile)
      if (config.trackerUrl)
        parsed.announce.push(config.trackerUrl) // ensure correct tracker is added (for webrtc/websocket case)

      startTorrent(seeder, infoHash, parsed, {
        store: storeConstructor,
        skipVerify: true
      }, function (err, seedingTorrent) {
        debug('starting to seed')
        cb(err, seedingTorrent)
      })
    })
  })
}

function makeStore (infoHash, torrentFile, cb) {
  debug('creating fetcher torrent')
  startTorrent(fetcher, infoHash, torrentFile, {
    path: path.join(CACHE_PATH, infoHash)
  }, function (err, torrent) {
    if (err) return cb(err)
    setRecentlyUsed(torrent)

    torrent.on('close', function () {
      const index = lruFetcherTorrents.indexOf(torrent)
      lruFetcherTorrents.splice(index, 1)
    })

    torrent.deselect(0, torrent.pieces.length - 1, false)
    cb(null, makePassthroughStore(torrent, function () {
      setRecentlyUsed(torrent)
    }))
  })
}

function startTorrent (client, infoHash, torrentFile, opts, cb) {
  let torrent = client.get(infoHash)
  if (torrent) {
    if (torrent.ready)
      cb(null, torrent)
    else
      torrent.once('ready', function () {
        cb(null, torrent)
      })
    return
  }

  torrent = client.add(torrentFile, opts, function () {
    cb(null, torrent)
  })
}

// cache positive responses, indexed by infoHash
const torrentFileCache = {}

function getTorrentFile (infoHash, cb) {
  const cacheEntry = torrentFileCache[infoHash]
  if (cacheEntry) {
    return cb(null, cacheEntry)
  }

  var url = 'https://dweb.me/btih/' + infoHash + '?output=torrent'
  request({
    url: url,
    encoding: null
  }, function (err, response, body) {
    if (err) return cb(err)
    if (response.statusCode !== 200) cb(new Error('torrent file not found'))
    torrentFileCache[infoHash] = body
    cb(null, body)
  })
}

function noop () {}
