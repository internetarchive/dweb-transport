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

const common = require('../common')
const makePassthroughStore = require('./passthrough-chunk-store')
const config = global.SEEDER_CONFIG || require('../seeder-config')

const CACHE_PATH = config.cachePath
if (!CACHE_PATH)
  badConfig('cache path not specified')

const MAX_CACHE = filesizeParser(config.maxCacheSize || 0)
const CACHE_CHECK_INTERVAL = config.cacheCheckIntervalSeconds
if (MAX_CACHE && !CACHE_CHECK_INTERVAL)
  badConfig('cache check interval not specified')

let configSeederIndex = 0
if (process.argv.length >= 3) {
  configSeederIndex = +process.argv[2]
}

let seederEntry = config.seeders[configSeederIndex]
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

var seeder = new WebTorrent({
	peerId: seederEntry.peerId,
	torrentPort: seederEntry.torrentPort,
  dht: false
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
      onTorrentFound(torrent, peer, peerId)
    } else {
      debug('unknown torrent')
      handleUnknownTorrent(infoHash, peer, peerId)
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

function onTorrentFound (torrent, peer, peerId) {
  peer.swarm = torrent
  torrent._addIncomingPeer(peer)
  peer.onHandshake(torrent.infoHash, peerId)
}

function handleUnknownTorrent (infoHash, peer, peerId) {
  function error(err) {
    peer.destroy(err)
  }

  common.getTorrentFile(infoHash, function (err, torrentFile) {
    if (err) return error(err)
    makeStore(infoHash, torrentFile, function (err, storeConstructor) {
      if (err) return error(err)

      debug('creating seeder torrent')
      startTorrent(seeder, infoHash, torrentFile, {
        store: storeConstructor,
        skipVerify: true
      }, function (err, seedingTorrent) {
        debug('starting to seed')
        onTorrentFound(seedingTorrent, peer, peerId)
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

function noop () {}
