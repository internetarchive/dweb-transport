
require('babel-core/register')({ presets: ['es2015', 'react']}); // ES6 JS below!

import http from 'http';
import async from 'async';
import React from 'react';
//Not needed on client - kept so script can run in both cases
import ReactDOMServer from 'react-dom/server';
//Next line is for client, not needed on server but doesnt hurt
import ReactDOM from 'react-dom';

import Nav from './Nav';
import Util from './Util';


export default class {
  constructor(res, htm, id, {}={}){
    console.log('get metadata for '+id);
    // talk to Metadata API

    //var http = require('http'); //ARCHIVE-BROWSER These duplicate the imports above
    //var async = require('async'); //ARCHIVE-BROWSER These duplicate the imports above

    // If res is an HTMLElement we can reasonably assume we are on the browser, but HTMLElement not defined in node, so check if its a ServerResponse
    const onbrowser =  res.constructor.name != "ServerResponse"; // For a browser we render to an element, for server feed to a response stream

    //TODO-DETAILS would be good to switch to "fetch"
    http.get('http://archive.org/metadata/'+id, (json) => {
      var body='';
      json.on('data', function(chunk) {
        body += chunk;
      }).on('end', function(){
        var item = JSON.parse(body);
        //console.log(item.metadata);

        if (!item.metadata){

          els = new Nav('item cannot be found or does not have metadata').render(onbrowser);
          if (onbrowser) {
              ReactDOM.render(els, res); // Client - put in node supplied
          } else {
              res.statusCode = 500;
              htm += ReactDOMServer.renderToStaticMarkup(els);
              res.end(htm);
          }
          return;
        }

        if (item.metadata.mediatype=='collection'){
          var Search = require('./Search').default;

          const creator = (item.metadata.creator  &&  (item.metadata.creator != item.metadata.title) ? item.metadata.creator : '');
          //ARCHIVE-BROWSER note the elements below were converted to HTML 3 times in original version
          const banner = (
            <div className="welcome container container-ia width-max" style={{'backgroundColor':'white'}}>
              <div className="container">
                <div className="row">
                  <div className="col-xs-11 col-sm-10 welcome-left">
                    <div id="file-dropper-wrap">
                      <div id="file-dropper"></div>
                      <img id="file-dropper-img" className="img-responsive" style={{'maxWidth':350, margin:'0 10px 5px 0'}} src={'//archive.org/services/img/'+id}/>
                    </div>
                    <h1>{item.metadata.title}</h1>
                    <h4>{creator}</h4>
                    <div id="descript" style={{'maxHeight':43, cursor:'pointer'}}>
                      {item.metadata.description}
                    </div>
                  </div>
                  <div className="col-xs-1 col-sm-2 welcome-right">
                    xxx
                  </div>
                </div>
              </div>
            </div>
          );
          //ARCHIVE-BROWSER note htm is empty at this point on browser
          let s = new Search(res, htm, {query:'collection:'+id, sort:'-downloads', banner:banner});
          if (onbrowser) {
              Nav.AJS_on_dom_loaded();
              return undefined;
          } else {
              return s;
          }
        }

        var wrap =`<h1>${item.metadata.title}</h1>`;

        var avs=[];
        var cfg={};
        avs = item.files.filter(fi => (fi.format=='h.264' || fi.format=='512Kb MPEG4'));
        if (!avs.length)
          avs = item.files.filter(fi => fi.format=='VBR MP3');
        cfg.aspectratio = 4/3;

        if (avs.length){
          var playlist=[];

          // reduce array down to array of just filenames
          //avs = avs.map(val => val.name);

          avs.sort((a,b) => Util.natcompare(a.name, b.name));

          for (var fi of avs)
            playlist.push({title:(fi.title ? fi.title : fi.name), sources:[{file:'//archive.org/download/'+id+'/'+fi.name}]});
          playlist[0].image = '//archive.org/services/img/'+id;

          if (!onbrowser) {
              playlist = JSON.stringify(playlist);
              cfg = JSON.stringify(cfg);
          }

          wrap += `<div id="jw6"></div>`;
          //ARCHIVE-BROWSER made urls absolute
            if (!onbrowser) { // onbrowser its statically included in the html and Play will be run later
                htm += `
          <script src="//archive.org/jw/6.8/jwplayer.js" type="text/javascript"></script>
          <script src="//archive.org/includes/play.js" type="text/javascript"></script>
          <script>
            $(function(){ Play('jw6', ${playlist}, ${cfg}); });
          </script>
          <style>
            #jw6, #jw6__list { backgroundColor:black; }
          </style>`;
            }
        }
        else if (item.metadata.mediatype=='texts'){
          wrap += `<iframe width="100%" height="480" src="http://archive.org/stream/${id}?ui=embed#mode/2up"></iframe><br/>`;
        }
        //TODO-DETAILS Note both node version and this version handle relative links embedded in the description to other resources badly, but shouldnt html in the description be considered dangerous anyway ?
        wrap += `${item.metadata.description}`; //TODO-DETAILS note this is set dangerously as innerHTML in Nav and since description comes from user could be really bad, should be turned into text node

        let els = new Nav(wrap).render(onbrowser); // temp store for debugging
        if(onbrowser) {
            ReactDOM.render(els, res); // Client - put in node supplies
            Play('jw6', playlist, cfg);
        } else { // Presume its the HTMLResponse, could explicitly check class if new what it was?
          htm += ReactDOMServer.renderToStaticMarkup(els);
          //htm += ReactDOMServer.renderToStaticMarkup(React.createFactory(Nav)(wrap));
          res.end(htm);
        }
        return; // Note cant return the content here, as its in an event - might be better replacing http.get with fetch and using async promises.
      });
    });
  }
}





    /*
    exports.handler = function(req, res) {
      async.parallel([
        function(callback) {
          var url = 'http://archive.org/metadata/'+id;
          request(url, function(err, response, body) {
            if(err) { console.log(err); callback(true); return; }
            obj = JSON.parse(body);
            callback(false, obj);
          });
        }],
        // get results
        function(err, results) {
          if(err) { console.log(err); res.send(500,"Server Error"); return; }
          res.send({api1:results[0], api2:results[1]});
        });
    };
*/
