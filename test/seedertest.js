#!/usr/bin/env node

const test = require('tape')
const rimraf = require('rimraf')
const wrtc = require('wrtc')

// delete previous download cache
rimraf.sync('/tmp/webtorrent/22cf567cbca91d3cc0a338aff766f4ba90da21e9')
rimraf.sync('/tmp/webtorrent/7cf8e59b32fddc94d888896d1e43be990a809352')

const WebTorrent = require('webtorrent')
const parseTorrent = require('parse-torrent')
const fs = require('fs')
const path = require('path')

test('download torrent through seeder via WebRTC', t => {
    t.plan(1)
    rimraf.sync('/tmp/webtorrent/22cf567cbca91d3cc0a338aff766f4ba90da21e9')
    const torrentFile = parseTorrent(fs.readFileSync(path.join(__dirname, 'commute.torrent')))
    // remove all other trackers and web seeds
    torrentFile.announce = ['ws://dweb.me:6969']
    torrentFile.urlList = []

    const wt = new WebTorrent({
        dht: false,
        tracker: {
            wrtc
        }
    })
    const torrent = wt.add(torrentFile)
    torrent.on('done', () => {
        wt.destroy()
        t.pass('succeeded')
    })
    torrent.on('error', err => {
        wt.destroy()
        t.fail('failed')
        console.error(err)
    })
})

// kill servers
test.onFinish(() => {
    process.exit(0)
})
