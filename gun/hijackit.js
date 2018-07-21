var Gun = require('gun/gun'); // not needed when inline!
module.exports = function(msg, soulwanted, root){
	let to = this.to;
  let keys = Object.keys(msg.put||{});
  let len = keys.length;
  if(msg['@']
  	&& ((len === 0)
  		|| (len === 1 
  			&& Gun.obj.empty(msg.put[keys[0]], '_')
  ))){
  	let tmp = root.dup.s[msg['@']];
    let original = tmp && tmp.it && tmp.it.get;
    console.log("GUN: Hikacking outgoing message original=", original, msg, 'soul wanted = ', soulwanted);
    if (original) {
      let soul = original['#'];
      let key = original['.'];
      setTimeout(function(){ // fake a call Internet Archive
        let data = (soul === soulwanted)? "hello world" : undefined;
      	if(undefined === data){
      		return to.next(msg);
      	}
      	msg.put = {
          [soul]: {
            _: {
                '#': soul,
                '>': {[key]: Gun.state()}
            },
            [key]: data
          }
        };
        console.log("GUN.hijack updated msg with data =", soul, key, data, msg);
        to.next(msg);
      },10);
    } else {
    	to.next(msg);
    }
  } else {
    to.next(msg);
  }
}