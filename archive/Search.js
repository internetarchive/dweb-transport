import ReactDOM from "react-dom";

require('babel-core/register')({ presets: ['es2015', 'react']}); // ES6 JS below!

import http from 'http';
import async from 'async';
import React from 'react';
//ARCHIVE-BROWSER ReactDOMServer Not needed for browser, left in to allow use in both browser & Node/Server
import ReactDOMServer from 'react-dom/server';

import Nav from './Nav';
import Tile from './Tile';
import XXXcollections from './temp_collections'; //TODO-DETAILS just temporary till cors working

export default class {
  constructor(res, htm, {query='*:*', sort='', limit=75, banner=''}={}) {
    const _this = this;
    const onbrowser =  res.constructor.name != "ServerResponse"; // For a browser we render to an element, for server feed to a response stream
    this.query = query;
    this.banner = banner || `<h1>Search: ${query}</h1>`;  // Can be HTML or elements (as returned from JSX compile
    console.log('search for:','http://archive.org/advancedsearch.php?output=json&q='+query+'&rows='+limit+'&sort[]='+sort)

          // talk to SE
      /*  TODO-DETAILS-CORS just temporary till cors working */
    http.get('https://archive.org/advancedsearch.php?output=json&q='+query+'&rows='+limit+'&sort[]='+sort, (json) => {
      var body='';
      json.on('data', function(chunk) {
        body += chunk;
      }).on('end', function(){
        body = JSON.parse(body);  //TODO-DETAILS uncomment this line
      /*
        let body = XXXcollections[query];
        if (!body) { console.log("No faked entry for query="+query);}
        */
      //End of TODO-DETAILS-CORS temporary cruft
        //console.log(body.response.docs);

        _this.items = body.response.docs;
        var wrap = _this.render();  //ARCHIVE-BROWSER remove unneccessary convert back to HTML and reconversion inside Nav.render

        let els = new Nav(wrap).render(onbrowser);
        //ARCHIVE-BROWSER - this is run at the end of archive_min.js in node, on browser it has to be run after doing a search 
          if (onbrowser) {
              console.log("XXX@Search54 body should be = ",$('body')); //TODO-DETAILS check gets body then remove
              //$('body').addClass('bgEEE');
              archive_setup.push(function(){
                  AJS.lists_v_tiles_setup('search');
                  AJS.popState('search');

                  $('div.ikind').css({visibility:'visible'});

                  AJS.tiler('#ikind-search');

                  $(window).on('resize  orientationchange', function(evt){
                      clearTimeout(AJS.node_search_throttler);
                      AJS.node_search_throttler = setTimeout(AJS.tiler, 250);
                  });

              });
            ReactDOM.render(els, res); // Client - put in node supplies
        } else {
            htm += ReactDOMServer.renderToStaticMarkup(els);
              //htm += ReactDOMServer.renderToStaticMarkup(React.createFactory(Nav)(wrap));
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
          }
        return;
        /* TODO-DETAILS-CORS uncomment this when cors fixed */
      });
    });
        /**/
  }


  render(){
      if (typeof this.banner === "string") {
          this.banner = ( <div dangerouslySetInnerHTML={{__html: this.banner}}></div> );
      }
      return (
      <div>
          {this.banner}

        <div className="row">
          <div className="col-xs-12">
            <div id="ikind-search" className="ikind in">
              {this.items.map(function(item, n){
                 let xxx = new Tile().render(item);
                  return xxx;
               })}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
