const debug = require('debug')('seeder:passthrough-chunk-store')

module.exports = makePassthroughStore

/*
 * Note that this *will not* pass the abstract-chunk-store tests since it's read only!
 *
 * This will take ownership of underlyingTorrent, in the sense that when the store is
 * closed (or destroyed) underlyingTorrent will be destroyed as well.
 *
 * onUse is called whenever the store is accessed, so this can be used to keep the
 * torrent in the cache.
 */
function makePassthroughStore (underlyingTorrent, onUse) {
  function PassthroughChunkStore (chunkLength) {
    if (!(this instanceof PassthroughChunkStore)) return new PassthroughChunkStore(chunkLength)
    const self = this
    if (chunkLength !== underlyingTorrent.pieceLength)
      throw new Error('unexpected chunk length')

    debug('constructor')
    self.chunkLength = chunkLength
    self.destroyed = false
  }

  // map of piece number to array of {opts, cb} objects
  // an entry here indicates that the given piece has already been selected by this chunk store
  const waiting = {}

  PassthroughChunkStore.prototype.put = function (index, chunkBuffer, cb) {
    throw new Error('put called on read-only chunk store')
  }

  PassthroughChunkStore.prototype.get = function (index, opts, cb) {
    const self = this
    if (self.destroyed) return

    onUse()
    debug('get', index)

    const torrent = underlyingTorrent
    if (torrent.bitfield.get(index)) {
      debug('already have in bitfield', index)
      return torrent.store.get(index, opts, cb)
    }

    if (waiting[index]) {
      // we've already selected that piece, so just add to the list of waiting gets
      debug('appending to waiting', index)
      return waiting[index].push({opts, cb})
    }

    // need to select the piece given by index
    waiting[index] = [{opts, cb}]
    debug('selecting', index)
    torrent.select(index, index, 1, function () {
      waiting[index].forEach(function (entry) {
        torrent.store.get(index, entry.opts, entry.cb)
      })

      debug('deselecting', index)
      torrent.deselect(index, index, 1)
      delete waiting[index]
    })
  }

  PassthroughChunkStore.prototype.close = PassthroughChunkStore.prototype.destroy = function (cb) {
    const self = this
    if (self.destroyed) return

    self.destroyed = true
    debug('close/destroy')
    underlyingTorrent.destroy(cb)
  }
  
  return PassthroughChunkStore
}
