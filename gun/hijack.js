// THIS MODULE IS EXPERIMENTAL AND NOT SUPPORTED/MAINTAINED
// IN THE FUTURE WE MAY RELEASE AND MAINTAIN SOMETHING SIMILAR.

var Gun = require('gun/gun');

Gun.on('opt', function(root){
	this.to.next(root);
	var opt = root.opt;
	if(root.once){ return }
	root.on('create', function(at){
		root.on('out', function(msg){
			if(!opt.hijack){
				this.to.next(msg);
				return;
			}
			opt.hijack.call(this, msg);
		});
		this.to.next(at);
	});
});

Gun.chain.hijack = function(cb){
	var gun = this;
	if(gun !== gun.back(-1)){
		throw "Must hijack on root gun!";
		return gun;
	}
	gun._.opt.hijack = cb;
	return gun;
}