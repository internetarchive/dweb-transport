//import ReactDOM from "react-dom";
//import React from 'react';
//ARCHIVE-BROWSER ReactDOMServer Not needed for browser, left in to allow use in both browser & Node/Server
import React from './ReactFake';

require('babel-core/register')({ presets: ['env', 'react']}); // ES6 JS below!
//import ReactDOMServer from 'react-dom/server';

import Util from './Util';
import ArchiveBase from './ArchiveBase';
import Tile from './Tile';


/* Section to ensure node and browser able to use Headers, Request and Fetch */
/*
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
*/

export default class Search extends ArchiveBase {
    /*
    Superclass for Searches - including Collections & Home

    Fields:
    Inherited from ArchiveBase: item
    items   List of items found
     */
  constructor({query='*:*', sort='', limit=75, banner='', id=undefined}={}) {
      super(id);
      this.query = query;
      this.limit= limit;
      this.sort = sort;
      console.log('search for:', 'http://archive.org/advancedsearch.php?output=json&q=' + query + '&rows=' + limit + '&sort[]=' + sort)
  }
    async fetch() {
        /* Do an advanced search.
            Goes through gateway.dweb.me so that we can work around a CORS issue (general approach & security questions confirmed with Sam!)

            this.itemid Archive Item identifier
            throws: TypeError or Error if fails
            resolves to: this
         */
        let j = await Util.fetch_json(
            //`https://archive.org/advancedsearch?output=json&q=${this.query}&rows=${this.limit}&sort[]=${this.sort}`, // Archive (CORS fail)
            `https://gateway.dweb.me/metadata/advancedsearch?output=json&q=${this.query}&rows=${this.limit}&sort[]=${this.sort}`,
            //`http://localhost:4244/metadata/advancedsearch?output=json&q=${this.query}&rows=${this.limit}&sort[]=${this.sort}`, //Testing
        );
        this.items = j.response.docs;
        return this; // For chaining, but note will need to do an "await fetch"
    }

        navwrapped() {
        /* Wrap the content up:  wrap( nav=wrap1 | maincontent | detailsabot )
        TODO-DETAILS need stuff before nav-wrap1 and after detailsabout and need to check this against Search and Collection examples
        returns:      JSX elements tree suitable for passing to ReactDOM.render or ReactDOMServer.renderToStaticMarkup
         */
        //TODO-DETAILS is putting the description (in 'htm' in as raw html which would be a nasty security hole since that comes from user !
        return (
            <div id="wrap">
                { new Nav().navwrapJSX() }
                <div className="container container-ia">
                    {this.jsxInNav()} {/*This is the main-content*/}
                </div>
            {/*--wrap--*/}</div>
        );
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
  banner() {
      return (
          <h1>Search: {this.query}</h1>
      );
  }

  jsxInNav(){
      /* The main part of the details or search page containing the content
      returns:      JSX elements tree suitable for passing to new Nav(wrap)
       */
      return (
          <div>
              {this.banner()}

            <div className="row">
              <div className="col-xs-12">
                <div id="ikind-search" className="ikind in">
                  {this.items.map(function(item, n){ // Note rendering tiles is quick, its the fetch of the img (async) which is slow.
                     return new Tile().render(item);
                   })}
                </div>
              </div>
            </div>
          </div>
        );
  }
}
