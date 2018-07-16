if(typeof window === "undefined"){
    process.env.GUN_ENV = "false";
    var Gun = require('gun');
}

/*
Note:
THIS IS A FAILURE CASE - IT FAILS TO WORK IN gun RUNNING LOCALLY - ONLY WHEN RUNNING ON A SERVER
*/
if(typeof window === "undefined"){  // I believe this is the test of browser v node
  var Gun = require('gun');
}
//TODO-GUN put this into a seperate require
Gun.on('opt', function (root) {
  if (root.once) {
    return
  }

    root.on('out', function (msg) {
        var to = this.to;
        // PSEUDO CODE!!!!!!! MAY NOT WORK (probably won't);
        if(msg['@']){
            if(!msg.put){
                console.log("XXX@C29: HIJACK!", msg);
                setTimeout(function(){

                    var tmp = msg['@'];
                    tmp = root.dup.s[tmp];
                    console.log("XXX@34 result of root.dup.s[msg['a']]", tmp)
                    tmp = tmp && tmp.it;
                    // REFACTOR THIS CODE TO MAKE SURE IT DOESN'T CRASH ON
                    // NON EXISTENT DATA OR ORIGINAL MESSAGE COULD NOT
                    // BE FOUND OR OTHER EDGE CASES
                    var soul = tmp && tmp.get && tmp.get['#'];
                    var key = tmp && tmp.get && tmp.get['.'];
                    var state = {};
                    console.log('XXX@41: soul key', soul, key);

                    msg.put = {};
                    msg.put[soul] = {_:{'#': soul, '>': state}};
                    state[key] = Gun.state();
                    msg.put[soul][key] = 'hello Mitra!';
                    // NOTE: this doesn't necessarily save it back to
                    // this peers GUN data.

                    to.next(msg);
                }, 100);
                return;
            }
        }
        to.next(msg) // pass to next middleware
    });
    this.to.next(root);
});

g=new Gun()
g.get("foo").once(data => console.log('data'));


/*
{get: {'#': 'soul', '.': 'key'}, '#': 'sldkfjowejf'}
{'@': 'sldkfjowejf', '#': 'eoijfwijfeoj'}

{_:{'#':'soul', '>':{...}},
  a: 'hello',
  key: {'#': 'node'}
}

gun.get('soul').get('key').once(function(data, key){

})
*/


