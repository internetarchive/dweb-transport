
require('babel-core/register')({ presets: ['es2015', 'react']}); // ES6 JS below!

import http from 'http';
import async from 'async';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import Nav from './Nav';
import Util from './Util';


export default class {
  constructor(res, htm, id, {}={}){
    console.log('get metadata for '+id);
    // talk to Metadata API

    var http = require('http');
    var async = require('async');


    http.get('http://archive.org/metadata/'+id, (json) => {
      var body='';
      json.on('data', function(chunk) {
        body += chunk;
      }).on('end', function(){
        var item = JSON.parse(body);
        //console.log(item.metadata);

        if (!item.metadata){
          htm +=  ReactDOMServer.renderToStaticMarkup(new Nav('item cannot be found or does not have metadata').render());  res.statusCode = 500;  //xxx
          res.end(htm);
          return;
        }

        if (item.metadata.mediatype=='collection'){
          var Search = require('./Search').default;

          const creator = (item.metadata.creator  &&  (item.metadata.creator != item.metadata.title) ? item.metadata.creator : '');

          const banner = ReactDOMServer.renderToStaticMarkup(
            <div className="welcome container container-ia width-max" style={{'background-color':'white'}}>
              <div className="container">
                <div className="row">
                  <div className="col-xs-11 col-sm-10 welcome-left">
                    <div id="file-dropper-wrap">
                      <div id="file-dropper"></div>
                      <img id="file-dropper-img" className="img-responsive" style={{'max-width':350, margin:'0 10px 5px 0'}} src={'//archive.org/services/img/'+id}/>
                    </div>
                    <h1>{item.metadata.title}</h1>
                    <h4>{creator}</h4>
                    <div id="descript" style={{'max-height':43, cursor:'pointer'}}>
                      {item.metadata.description}
                    </div>
                  </div>
                  <div class="col-xs-1 col-sm-2 welcome-right">
                    xxx
                  </div>
                </div>
              </div>
            </div>
          );

          return new Search(res, htm, {query:'collection:'+id, sort:'-downloads', banner:banner});
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

          playlist = JSON.stringify(playlist);
          cfg = JSON.stringify(cfg);

          wrap += `<div id="jw6"></div>`;
          htm += `
          <script src="/jw/6.8/jwplayer.js" type="text/javascript"></script>
          <script src="/includes/play.js" type="text/javascript"></script>
          <script>
            $(function(){ Play('jw6', ${playlist}, ${cfg}); });
          </script>
          <style>
            #jw6, #jw6__list { background-color:black; }
          </style>`;
        }
        else if (item.metadata.mediatype=='texts'){
          wrap += `<iframe width="100%" height="480" src="http://archive.org/stream/${id}?ui=embed#mode/2up"></iframe><br/>`;
        }

        wrap += `${item.metadata.description}`;


        htm += ReactDOMServer.renderToStaticMarkup(new Nav(wrap).render());
        //htm += ReactDOMServer.renderToStaticMarkup(React.createFactory(Nav)(wrap));

        res.end(htm);
        return;
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
