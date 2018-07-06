const request = require('request')

// cache positive responses, indexed by infoHash
const cache = {}

exports.getTorrentFile = function (infoHash, cb) {
  const cacheEntry = cache[infoHash]
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
    cache[infoHash] = body
    cb(null, body)
  })
}