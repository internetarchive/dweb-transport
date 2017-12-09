import ReactDOM from "react-dom";
import React from 'react';
//ARCHIVE-BROWSER ReactDOMServer Not needed for browser, left in to allow use in both browser & Node/Server

require('babel-core/register')({ presets: ['es2015', 'react']}); // ES6 JS below!
import ReactDOMServer from 'react-dom/server';

import ArchiveBase from './Details'
import Nav from './Nav';
import Tile from './Tile';

/* Section to ensure node and browser able to use Headers, Request and Fetch */
var fetch,Headers,Request;
if (typeof(Window) === "undefined") {
    //var fetch = require('whatwg-fetch').fetch; //Not as good as node-fetch-npm, but might be the polyfill needed for browser.safari
    //XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;  // Note this doesnt work if set to a var or const, needed by whatwg-fetch
    console.log("Node loaded");
    fetch = nodefetch;
    Headers = fetch.Headers;      // A class
    Request = fetch.Request;      // A class
} else {
    // If on a browser, need to find fetch,Headers,Request in window
    console.log("Loading browser version of fetch,Headers,Request");
    fetch = window.fetch;
    Headers = window.Headers;
    Request = window.Request;
}

export default class Search {
  constructor({query='*:*', sort='', limit=75, banner=''}={}) {
      this.query = query;
      this.limit= limit;
      this.sort = sort;
      console.log('search for:', 'http://archive.org/advancedsearch.php?output=json&q=' + query + '&rows=' + limit + '&sort[]=' + sort)
  }
  async fetch() {
      let response = await fetch(new Request(   // Note almost identical code on Details.js and Search.js
          //'https://archive.org/advancedsearch.php?output=json&q='
          'https://gateway.dweb.me/metadata/advancedsearch?output=json&q='          // Go through gateway at dweb.me because of CORS issues (approved by Sam!)
          //'http://localhost:4244/metadata/advancedsearch?output=json&q='    // When testing
          + this.query + '&rows=' + this.limit + '&sort[]=' + this.sort,
          {
              method: 'GET',
              headers: new Headers(),
              mode: 'cors',
              cache: 'default',
              redirect: 'follow',  // Chrome defaults to manual
          }
      ));
      if (response.ok) {
          if (response.headers.get('Content-Type') === "application/json") {
              let j = await response.json(); // response.json is a promise resolving to JSON already parsed
              this.items = j.response.docs;
          } else {
              let t = response.text(); // promise resolving to text
              console.log("Expecting JSON but got",t);
          }
      }   // TODO-HTTP may need to handle binary as a buffer instead of text
      return this; // For chaining, but note will need to do an "await fetch"
  }
  nodeHtmlBefore() {
      /* Return htm to insert before Nav wrapped part for use in node*/
      return ""
  }
  nodeHtmlAfter() {
      /* Return htm to insert before Nav wrapped part for use in node*/
      return `
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
        `
  }
  browserBefore() {
      $('body').addClass('bgEEE');
      archive_setup.push(function(){ //TODO-DETAILS check not pushing on top of existing (it probably is)
          AJS.lists_v_tiles_setup('search');
          AJS.popState('search');

          $('div.ikind').css({visibility:'visible'});

          AJS.tiler('#ikind-search');

          $(window).on('resize  orientationchange', function(evt){
              clearTimeout(AJS.node_search_throttler);
              AJS.node_search_throttler = setTimeout(AJS.tiler, 250);
          });
      });
  }
  browserAfter() {
      Nav.AJS_on_dom_loaded(); // Runs code pushed archive_setup
  }
  render(res, htm) {
    const onbrowser = res.constructor.name != "ServerResponse"; // For a browser we render to an element, for server feed to a response stream
    var els = this.navwrapped(onbrowser);  //ARCHIVE-BROWSER remove unneccessary convert back to HTML and reconversion inside Nav.render

    //ARCHIVE-BROWSER - this is run at the end of archive_min.js in node, on browser it has to be run after doing a search
    if (onbrowser) {
        this.browserBefore();
        ReactDOM.render(els, res);
        this.browserAfter();
    } else {
        htm += this.nodeHtmlBefore();
        htm += ReactDOMServer.renderToStaticMarkup(els);
        htm += this.nodeHtmlAfter();
        res.end(htm);
    }
  }

  banner() {
      return (
          <h1>Search: {query}</h1>
      );
  }

  jsxInNav(onbrowser){
      /* The main part of the details or search page containing the content
      onbrowser:    true if rendering in browser, false if in node on server
      returns:      JSX elements tree suitable for passing to new Nav(wrap)
       */
      return (
          <div>
              {this.banner()}

            <div className="row">
              <div className="col-xs-12">
                <div id="ikind-search" className="ikind in">
                  {this.items.map(function(item, n){ // Note rendering tiles is quick, its the fetch of the img (async) which is slow.
                     return new Tile().render(item, onbrowser);
                   })}
                </div>
              </div>
            </div>
          </div>
        );
  }
  navwrapped(onbrowser) {
      /* Wrap the content up in a Nav
      onbrowser:    true if rendering in browser, false if in node on server
      returns:      JSX elements tree suitable for passing to ReactDOM.render or ReactDOMServer.renderToStaticMarkup
       */
      return new Nav(this.jsxInNav(onbrowser)).render(onbrowser);
  }
}
