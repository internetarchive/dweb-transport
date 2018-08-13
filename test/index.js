#!/usr/bin/env node

const test = require('tape')
const rimraf = require('rimraf')
const wrtc = require('electron-webrtc')()

// delete previous seed cache
rimraf.sync('/tmp/archive-torrents') // should match path in seeder-config.json
// delete previous download cache
rimraf.sync('/tmp/webtorrent/22cf567cbca91d3cc0a338aff766f4ba90da21e9')
rimraf.sync('/tmp/webtorrent/7cf8e59b32fddc94d888896d1e43be990a809352')

// get special seeder config for test
global.SEEDER_CONFIG = require('./seeder-config')
// start seeder and tracker
require('../seeder')
require('../tracker')

const WebTorrent = require('webtorrent')
const parseTorrent = require('parse-torrent')
const fs = require('fs')
const path = require('path')

test('download torrent through seeder', t => {
  t.plan(1)
  const torrentFile = parseTorrent(fs.readFileSync(path.join(__dirname, 'commute.torrent')))
  // remove all other trackers and web seeds
  torrentFile.announce = ['http://localhost:6969/announce']
  torrentFile.urlList = []

  const wt = new WebTorrent({
    dht: false
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

test('download a second torrent which should evict the first from the cache', t => {
  t.plan(2)
  const torrentFile = parseTorrent(fs.readFileSync(path.join(__dirname, 'daffy.torrent')))
  // remove all other trackers and web seeds
  torrentFile.announce = ['http://localhost:6969/announce']
  torrentFile.urlList = []

  const wt = new WebTorrent({
    dht: false
  })
  const torrent = wt.add(torrentFile)
  torrent.on('done', () => {
    wt.destroy()
    t.pass('finished download')
    setTimeout(() => {
      try {
        // try to access previous torrent directory
        fs.accessSync('/tmp/archive-torrents/22cf567cbca91d3cc0a338aff766f4ba90da21e9')
        t.fail('previous torrent still there')
      } catch (e) {
        t.pass('properly evicted')
      }
    }, 10000) // delay 10 seconds to ensure eviction
  })
  torrent.on('error', err => {
    wt.destroy()
    t.fail('failed')
    console.error(err)
  })
})

test('download torrent through seeder via WebRTC', t => {
  t.plan(1)
  rimraf.sync('/tmp/webtorrent/22cf567cbca91d3cc0a338aff766f4ba90da21e9')
  const torrentFile = parseTorrent(fs.readFileSync(path.join(__dirname, 'commute.torrent')))
  // remove all other trackers and web seeds
  torrentFile.announce = ['ws://localhost:6969']
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



