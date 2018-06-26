const Tracker = require('bittorrent-tracker')

const opts = {
  //infoHash: new Buffer('01234567890123456789'), // Should be denied
  infoHash: new Buffer.from('22cf567cbca91d3cc0a338aff766f4ba90da21e9','hex'),   // Should work (its archive item "commute")
  peerId: new Buffer('01234567890123456789'),
  announce: ['http://localhost:6969/announce'],
  port: 9999
}

const client = new Tracker(opts)

client.start()

client.on('update', (data) => {
  function printAddr(offset) {
    console.log(data.peers[offset] + '.' + data.peers[offset + 1] + '.' +
      data.peers[offset + 2] + '.' + data.peers[offset + 3] + ':' +
      data.peers.readUInt16BE(offset + 4))
  }

  for (var offset = 0; offset <= data.peers.length - 6; offset += 6) {
    printAddr(offset);
  }

  client.scrape();

  client.on('scrape', function (data) {
    console.log('got a scrape response from tracker: ');
    console.log(data);
  });
})
