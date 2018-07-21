// order of code is important!
require('./hijack.js');
var Gun = require('gun');
var g = Gun({web: require('http').createServer().listen(8080)}); // change port!
var root = g._;
// if any browser makes a request between HERE
g.get('arc').get('archive.org').get('metadata').put({}).get(function(soulwanted){
	// and NOW... the hijacker won't be mounted yet.
	console.log("init hijack!");
	g.hijack(function(msg){
		// YOUR CODE GOES HERE!
		require('./hijackit').call(this, msg, soulwanted, root);
		// just paste your cb inline, no need to require it. (had to pass extra scope information since I isolated it, no need to isolate!)
	});

},true);