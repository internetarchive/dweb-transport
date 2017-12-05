
require('babel-core/register')({ presets: ['es2015', 'react']}); // ES6 JS below!

import http from 'http';
import async from 'async';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import Nav from './Nav';
import Tile from './Tile';

export default class {
  constructor(res, htm, {query='*:*', sort='', limit=75, banner=''}={}) {
    const _this = this;
    this.query = query;
    this.banner = banner || `<h1>Search: ${query}</h1>`;
    console.log('search for '+query);
    // talk to SE
    http.get('http://archive.org/advancedsearch.php?output=json&q='+query+'&rows='+limit+'&sort[]='+sort, (json) => {
      var body='';
      json.on('data', function(chunk) {
        body += chunk;
      }).on('end', function(){
        body = JSON.parse(body);
        //console.log(body.response.docs);

        _this.items = body.response.docs;
        var wrap = ReactDOMServer.renderToStaticMarkup(_this.render());

        htm +=  ReactDOMServer.renderToStaticMarkup(new Nav(wrap).render());

        htm += `
<script type="text/javascript">
 $('body').addClass('bgEEE');//xxx
 archive_setup.push(function(){
   AJS.lists_v_tiles_setup('search');
   AJS.popState('search');

   $('div.ikind').css({visibility:'visible'});

   AJS.tiler('#ikind-search');

   $(window).on('resize  orientationchange', function(evt){
     clearTimeout(AJS.node_search_throttler);
     AJS.node_search_throttler = setTimeout(AJS.tiler, 250);
   });

   // register for scroll updates (for infinite search results)
   $(window).scroll(AJS.scrolled);
 });
</script>
`;

        res.end(htm);
        return;
      });
    });
  }


  render(){
    return (
      <div>
        <div dangerouslySetInnerHTML={{__html: this.banner}}></div>

        <div className="row">
          <div className="col-xs-12">
            <div id="ikind-search" className="ikind in">
              {this.items.map(function(item, n){
                 return new Tile().render(item);
               })}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
