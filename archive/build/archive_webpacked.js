/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 6);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

/* eslint max-len: 0 */
// TODO: eventually deprecate this console.trace("use the `babel-register` package instead of `babel-core/register`");
module.exports = __webpack_require__(7);


/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/*
Based on https://stackoverflow.com/questions/30430982/can-i-use-jsx-without-react-to-inline-html-in-script
I wanted this because React was doing nasty things at run-time (like catching events) and stopping Search box working
 */

function deletechildren(el, keeptemplate) {
    //TODO-DETAILS-REACT copied from htmlutils, maybe include that instead
    /*
    Remove all children from a node
    :param el:  An HTML element, or a string with id of an HTML element
    */
    if (typeof keeptemplate === "undefined") keeptemplate = true;
    el = typeof el === "string" ? document.getElementById(el) : el;
    // Carefull - this deletes from the end, because template if it exists will be firstChild
    while (el.lastChild && !(keeptemplate && el.lastChild.classList && el.lastChild.classList.contains("template"))) {
        // Note that deletechildren is also used on Span's to remove the children before replacing with text.
        el.removeChild(el.lastChild);
    }
    return el; // For chaining
}

class React {
    static createElement(tag, attrs, children) {
        // Note arguments is set to tag, attrs, child1, child2 etc
        var element = document.createElement(tag);
        for (let name in attrs) {
            let attrname = name.toLowerCase() === "classname" ? "class" : name;
            if (name === "dangerouslySetInnerHTML") {
                element.innerHTML = attrs[name]["__html"];
            } else if (name && attrs.hasOwnProperty(name)) {
                let value = attrs[name];
                if (value === true) {
                    element.setAttribute(attrname, name);
                } else if (typeof value === "object" && !Array.isArray(value)) {
                    // e.g. style: {{fontSize: "124px"}}
                    for (let k in value) {
                        element[attrname][k] = value[k];
                    }
                } else if (value !== false && value != null) {
                    element.setAttribute(attrname, value.toString());
                }
            }
        }
        for (let i = 2; i < arguments.length; i++) {
            let child = arguments[i];
            if (!child) {} else if (Array.isArray(child)) {
                child.map(c => element.appendChild(c.nodeType == null ? document.createTextNode(c.toString()) : c));
            } else {
                element.appendChild(child.nodeType == null ? document.createTextNode(child.toString()) : child);
            }
        }
        return element;
    }
    static domrender(els, node) {
        deletechildren(node, false);
        node.appendChild(els);
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = React;
;

/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ReactFake__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Util__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__ArchiveBase__ = __webpack_require__(5);

__webpack_require__(0)({ presets: ['es2015', 'react'] }); // ES6 JS below!

//Not needed on client - kept so script can run in both cases
//import ReactDOMServer from 'react-dom/server';
//Next line is for client, not needed on server but doesnt hurt
//import ReactDOM from 'react-dom';




class Details extends __WEBPACK_IMPORTED_MODULE_2__ArchiveBase__["a" /* default */] {
    constructor(id, {} = {}) {
        super(id);
    }
    async fetch() {
        // Note almost identical to code on Search.fetch()
        //TODO-DETAILS-FETCH add trap of error here
        console.log('get metadata for ' + this.id);
        // talk to Metadata API
        const _this = this;
        let response = await fetch(new Request( // Note almost identical code on Details.js and Search.js
        'https://archive.org/metadata/' + this.id, {
            method: 'GET',
            headers: new Headers(),
            mode: 'cors',
            cache: 'default',
            redirect: 'follow' // Chrome defaults to manual
        }));
        if (response.ok) {
            if (response.headers.get('Content-Type') === "application/json") {
                this.item = await response.json(); // response.json is a promise resolving to JSON already parsed
            } else {
                t = response.text(); // promise resolving to text
                console.log("Expecting JSON but got", t); //TODO-DETAILS-REFACTOR throw error here
            }
        } // TODO-HTTP may need to handle binary as a buffer instead of text
        return this; // For chaining, but note will need to do an "await fetch"
    }

}
/* harmony export (immutable) */ __webpack_exports__["default"] = Details;


/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ReactFake__ = __webpack_require__(1);
__webpack_require__(0)({ presets: ['es2015', 'react'] }); // ES6 JS below!

//import React from 'react';


/* harmony default export */ __webpack_exports__["a"] = (class {
  static number_format(nStr) //xxx this is just addCommas now
  {
    //http://www.mredkj.com/javascript/numberFormat.html
    nStr += '';

    var x = nStr.split('.');
    var x1 = x[0];
    var x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) x1 = x1.replace(rgx, '$1' + ',' + '$2');
    return x1 + x2;
  }

  static glyph({ name = 'question', classes = '' } = {}) {
    return __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
      'span',
      { className: classes },
      __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', { className: 'iconochive-' + name, 'aria-hidden': 'true' }),
      __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
        'span',
        { className: 'sr-only' },
        name
      )
    );
  }

  // pass in a <mediatype> value
  static mediatype_icon(mediatype) {
    const ICONS = {
      "audio": "audio",
      "collection": "collection",
      "etree": "etree",
      "image": "image",
      "data": "data",
      "movies": "movies",
      "movingimage": "movies",
      "other": "question",
      "software": "software",
      "sound": "audio",
      "stillimages": "image",
      "text": "texts",
      "texts": "texts",
      "tv": "tv",
      "unknown": "question",
      "video": "movies",
      "search": "search",
      "forum": "comments",
      "web": "web",
      "article": "article",
      "account": "person",
      "quote": "quote",
      "ad": "tv-commercial"
    };

    var icon = ICONS[mediatype];
    if (!icon) icon = 'question';

    return this.glyph({ name: icon });
  }

  static natcompare(a, b) {
    return natcompare(a, b);
  }

  static AJS_on_dom_loaded() {
    /*
    This function is copied from archive.min.js because
    a) its run there on DOMLoaded, which is before we've got anything on the page
    b) Its anonymous in archive.min.js so can't call it
     */
    // Use this global hack, by adding class 'accessible-link' to any mouse-only element div/img
    AJS.makeMouseElementAccessible('.accessible-link');

    AJS.setUpActionTracking(); // Must be before other form submit handlers are assigned
    AJS.setupPopupLink();
    AJS.nav_tophat_setup();
    AJS.nav_tophat_wb_setup();
    AJS.setUpCreativeCommonsLicenseLink();
    AJS.setUpSearchForms();

    /* global  archive_setup */
    if (typeof archive_setup !== 'undefined') {
      // when DOM loaded/stable, do some setup
      $(() => {
        for (const fn of archive_setup) fn();
      });
    }

    AJS.footer();
  }

});

// minified FROM http://sourcefrog.net/projects/natsort/natcompare.js
function isWhitespaceChar(B) {
  var A;A = B.charCodeAt(0);if (A <= 32) {
    return true;
  } else {
    return false;
  }
}function isDigitChar(B) {
  var A;A = B.charCodeAt(0);if (A >= 48 && A <= 57) {
    return true;
  } else {
    return false;
  }
}function compareRight(E, B) {
  var G = 0;var F = 0;var D = 0;var C;var A;for (;; F++, D++) {
    C = E.charAt(F);A = B.charAt(D);if (!isDigitChar(C) && !isDigitChar(A)) {
      return G;
    } else {
      if (!isDigitChar(C)) {
        return -1;
      } else {
        if (!isDigitChar(A)) {
          return +1;
        } else {
          if (C < A) {
            if (G == 0) {
              G = -1;
            }
          } else {
            if (C > A) {
              if (G == 0) {
                G = +1;
              }
            } else {
              if (C == 0 && A == 0) {
                return G;
              }
            }
          }
        }
      }
    }
  }
}function natcompare(I, H) {
  var C = 0,
      A = 0;var D = 0,
      B = 0;var F, E;var G;while (true) {
    D = B = 0;F = I.charAt(C);E = H.charAt(A);while (isWhitespaceChar(F) || F == "0") {
      if (F == "0") {
        D++;
      } else {
        D = 0;
      }F = I.charAt(++C);
    }while (isWhitespaceChar(E) || E == "0") {
      if (E == "0") {
        B++;
      } else {
        B = 0;
      }E = H.charAt(++A);
    }if (isDigitChar(F) && isDigitChar(E)) {
      if ((G = compareRight(I.substring(C), H.substring(A))) != 0) {
        return G;
      }
    }if (F == 0 && E == 0) {
      return D - B;
    }if (F < E) {
      return -1;
    } else {
      if (F > E) {
        return +1;
      }
    }++C;++A;
  }
};

/***/ }),
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ReactFake__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Util__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__ArchiveBase__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__Tile__ = __webpack_require__(8);
//import ReactDOM from "react-dom";
//import React from 'react';
//ARCHIVE-BROWSER ReactDOMServer Not needed for browser, left in to allow use in both browser & Node/Server


__webpack_require__(0)({ presets: ['es2015', 'react'] }); // ES6 JS below!
//import ReactDOMServer from 'react-dom/server';





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

class Search extends __WEBPACK_IMPORTED_MODULE_2__ArchiveBase__["a" /* default */] {
    constructor({ query = '*:*', sort = '', limit = 75, banner = '', id = undefined } = {}) {
        super(id);
        this.query = query;
        this.limit = limit;
        this.sort = sort;
        console.log('search for:', 'http://archive.org/advancedsearch.php?output=json&q=' + query + '&rows=' + limit + '&sort[]=' + sort);
    }
    async fetch() {
        let response = await fetch(new Request( // Note almost identical code on Details.js and Search.js
        //'https://archive.org/advancedsearch.php?output=json&q='
        'https://gateway.dweb.me/metadata/advancedsearch?output=json&q=' // Go through gateway at dweb.me because of CORS issues (approved by Sam!)
        //'http://localhost:4244/metadata/advancedsearch?output=json&q='    // When testing
        + this.query + '&rows=' + this.limit + '&sort[]=' + this.sort, {
            method: 'GET',
            headers: new Headers(),
            mode: 'cors',
            cache: 'default',
            redirect: 'follow' // Chrome defaults to manual
        }));
        if (response.ok) {
            if (response.headers.get('Content-Type') === "application/json") {
                let j = await response.json(); // response.json is a promise resolving to JSON already parsed
                this.items = j.response.docs;
            } else {
                let t = response.text(); // promise resolving to text
                console.log("Expecting JSON but got", t);
            }
        } // TODO-HTTP may need to handle binary as a buffer instead of text
        return this; // For chaining, but note will need to do an "await fetch"
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
        `;
    }
    browserBefore() {
        $('body').addClass('bgEEE');
        archive_setup.push(function () {
            //TODO-DETAILS check not pushing on top of existing (it probably is)
            AJS.lists_v_tiles_setup('search');
            AJS.popState('search');

            $('div.ikind').css({ visibility: 'visible' });

            AJS.tiler('#ikind-search');

            $(window).on('resize  orientationchange', function (evt) {
                clearTimeout(AJS.node_search_throttler);
                AJS.node_search_throttler = setTimeout(AJS.tiler, 250);
            });
        });
    }
    banner() {
        return __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'h1',
            null,
            'Search: ',
            this.query
        );
    }

    jsxInNav(onbrowser) {
        /* The main part of the details or search page containing the content
        onbrowser:    true if rendering in browser, false if in node on server
        returns:      JSX elements tree suitable for passing to new Nav(wrap)
         */
        return __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'div',
            null,
            this.banner(),
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'div',
                { className: 'row' },
                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                    'div',
                    { className: 'col-xs-12' },
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'div',
                        { id: 'ikind-search', className: 'ikind in' },
                        this.items.map(function (item, n) {
                            // Note rendering tiles is quick, its the fetch of the img (async) which is slow.
                            return new __WEBPACK_IMPORTED_MODULE_3__Tile__["a" /* default */]().render(item, onbrowser);
                        })
                    )
                )
            )
        );
    }
}
/* harmony export (immutable) */ __webpack_exports__["default"] = Search;


/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ReactFake__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Util__ = __webpack_require__(3);
__webpack_require__(0)({ presets: ['es2015', 'react'] }); // ES6 JS below!

//Not needed on client - kept so script can run in both cases
//import ReactDOMServer from 'react-dom/server';
//Next line is for client, not needed on server but doesnt hurt
//import ReactDOM from 'react-dom';



class ArchiveBase {
    constructor(id, {} = {}) {
        this.id = id;
    }
    jsxInNav(onbrowser) {}

    navwrapped(onbrowser) {
        /* Wrap the content up in a Nav
        onbrowser:    true if rendering in browser, false if in node on server
        returns:      JSX elements tree suitable for passing to ReactDOM.render or ReactDOMServer.renderToStaticMarkup
         */
        return new Nav(this.jsxInNav(onbrowser)).render(onbrowser);
    }

    browserBefore() {
        // Nothing to do by default
    }
    browserAfter() {
        __WEBPACK_IMPORTED_MODULE_1__Util__["a" /* default */].AJS_on_dom_loaded(); // Runs code pushed archive_setup - needed for image
    }
    nodeHtmlBefore() {
        /* Return html to insert before Nav wrapped part for use in node*/
        return "";
    }
    nodeHtmlAfter() {
        /* Return html to insert after Nav wrapped part for use in node*/
        return "";
    }
    render(res, htm) {
        const onbrowser = res.constructor.name != "ServerResponse"; // For a browser we render to an element, for server feed to a response stream
        var els = this.navwrapped(onbrowser); //ARCHIVE-BROWSER remove unneccessary convert back to HTML and reconversion inside Nav.render

        //ARCHIVE-BROWSER - this is run at the end of archive_min.js in node, on browser it has to be run after doing a search
        if (onbrowser) {
            this.browserBefore();
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].domrender(els, res);
            this.browserAfter();
        } else {
            htm += this.nodeHtmlBefore();
            htm += ReactDOMServer.renderToStaticMarkup(els);
            htm += this.nodeHtmlAfter();
            res.end(htm);
        }
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = ArchiveBase;


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

//var React = require('react');
//var ReactDOM = require('react-dom');
var Details = __webpack_require__(2).default;
var Search = __webpack_require__(4).default;
var Nav = __webpack_require__(9).default;
window.Nav = Nav;

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

exports.default = function () {};

module.exports = exports["default"];

/***/ }),
/* 8 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ReactFake__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Util__ = __webpack_require__(3);
__webpack_require__(0)({ presets: ['es2015', 'react'] }); // ES6 JS below!

//import React from 'react';



class Tile {
  render(item, onbrowser) {
    //xxx shorten/safify certain title usages (compared to Lists.inc)
    const collections = Array.isArray(item.collection) ? item.collection : typeof item.collection == 'string' ? [item.collection] : [];
    const collection = collections[0];
    const nFavorites = collections.filter(e => e.startsWith('fav-')).length;
    const is_collection = item.mediatype == 'collection';
    const classes = 'item-ia' + (is_collection ? ' collection-ia' : '');
    //ARCHIVE-BROWSER on browser, want to load links locally (via APIs) rather than rebuilding HTML page
    // ARCHIVE-BROWSER added key= to keep react happy (I hope)
    return __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
      'div',
      { className: classes, 'data-id': item.identifier, key: item.identifier },
      onbrowser ? __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
        'a',
        { className: 'stealth', tabIndex: '-1', onClick: `Nav.nav_details("${collection}");` },
        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
          'div',
          { className: 'item-parent' },
          __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'div',
            { className: 'item-parent-img' },
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('img', { src: 'https://archive.org/services/img/' + collection })
          ),
          __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'div',
            { className: 'item-parent-ttl' },
            'xxx parent title'
          )
        )
      ) : __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
        'a',
        { className: 'stealth', tabIndex: '-1', href: '/details/' + collection },
        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
          'div',
          { className: 'item-parent' },
          __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'div',
            { className: 'item-parent-img' },
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('img', { src: 'https://archive.org/services/img/' + collection })
          ),
          __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'div',
            { className: 'item-parent-ttl' },
            'xxx parent title'
          )
        )
      ),
      __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
        'div',
        { className: 'hidden-tiles views C C1' },
        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
          'nobr',
          { className: 'hidden-xs' },
          __WEBPACK_IMPORTED_MODULE_1__Util__["a" /* default */].number_format(item.downloads)
        ),
        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
          'nobr',
          { className: 'hidden-sm hidden-md hidden-lg' },
          __WEBPACK_IMPORTED_MODULE_1__Util__["a" /* default */].number_format(item.downloads)
        )
      ),
      __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
        'div',
        { className: 'C234' },
        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
          'div',
          { className: 'item-ttl C C2' },
          onbrowser ? __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'a',
            { onClick: `Nav.nav_details("${item.identifier}");`, title: item.title },
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
              'div',
              { className: 'tile-img' },
              __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('img', { className: 'item-img', xxxstyle: 'height:180px', src: 'https://archive.org/services/img/' + item.identifier })
            ),
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
              'div',
              { className: 'ttl' },
              item.title
            )
          ) : __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'a',
            { href: '/details/' + item.identifier, title: item.title },
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
              'div',
              { className: 'tile-img' },
              __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('img', { className: 'item-img', xxxstyle: 'height:180px', src: '//archive.org/services/img/' + item.identifier })
            ),
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
              'div',
              { className: 'ttl' },
              item.title
            )
          )
        ),
        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
          'div',
          { className: 'hidden-tiles pubdate C C3' },
          __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'nobr',
            { className: 'hidden-xs' },
            'Dec 3, 2012'
          ),
          __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'nobr',
            { className: 'hidden-sm hidden-md hidden-lg' },
            '12/12'
          )
        ),
        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
          'div',
          { className: 'by C C4' },
          __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'span',
            { className: 'hidden-lists' },
            item.creator && 'by '
          ),
          __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'span',
            { title: Array.isArray(item.creator) ? item.creator.join(',') : item.creator },
            item.creator
          )
        )
      ),
      __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
        'div',
        { className: 'mt-icon C C5' },
        __WEBPACK_IMPORTED_MODULE_1__Util__["a" /* default */].mediatype_icon(item.mediatype)
      ),
      __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
        'h6',
        { className: 'stat ' },
        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', { className: 'iconochive-eye', 'aria-hidden': 'true' }),
        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
          'span',
          { className: 'sr-only' },
          'eye'
        ),
        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
          'nobr',
          null,
          __WEBPACK_IMPORTED_MODULE_1__Util__["a" /* default */].number_format(item.downloads)
        )
      ),
      __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
        'h6',
        { className: 'stat' },
        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', { className: 'iconochive-favorite', 'aria-hidden': 'true' }),
        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
          'span',
          { className: 'sr-only' },
          'favorite'
        ),
        nFavorites
      ),
      __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
        'h6',
        { className: 'stat' },
        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', { className: 'iconochive-comment', 'aria-hidden': 'true' }),
        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
          'span',
          { className: 'sr-only' },
          'comment'
        ),
        item.num_reviews || "0"
      )
    );
  }

  collection_stats(item) {
    return __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
      'div',
      { className: 'collection-stats' },
      __WEBPACK_IMPORTED_MODULE_1__Util__["a" /* default */].glyph({ name: 'collection', classes: 'topinblock hidden-lists' }),
      __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
        'div',
        { className: 'num-items topinblock' },
        '0',
        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
          'div',
          { className: 'micro-label' },
          'ITEMS'
        )
      ),
      __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
        'div',
        { className: 'num-items hidden-tiles' },
        __WEBPACK_IMPORTED_MODULE_1__Util__["a" /* default */].number_format(item.downloads),
        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
          'div',
          { className: 'micro-label' },
          'VIEWS'
        )
      )
    );
  }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = Tile;


/***/ }),
/* 9 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ReactFake__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Util__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__Search__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__ArchiveFactory__ = __webpack_require__(10);
//import ReactDOM from "react-dom";

__webpack_require__(0)({ presets: ['es2015', 'react'] }); // ES6 JS below!

// https://ponyfoo.com/articles/universal-react-babel






class Nav {
  //extends React.Component
  constructor(htm) {
    //super();
    this.mts = ['web', 'texts', 'movies', 'audio', 'software', 'image'];
    this.htm = htm; //ARCHIVE-BROWSER could be string or nodes (not sure what class that is, but whatever the JSX compiler gives
  }

  render(onbrowser) {
    if (typeof this.htm === "string") {
      this.htm = __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { dangerouslySetInnerHTML: { __html: this.htm } });
    }
    // TODO-DETAILS removed this from search button as generates error - come back and fix
    //TODO-DETAILS is putting the description (in 'htm' in as raw html which would be a nasty security hole since that comes from user !
    return __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
      'div',
      { id: 'wrap' },
      __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
        'div',
        { id: 'navwrap1' },
        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
          'div',
          { id: 'navwrap2' },
          __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'div',
            { className: 'navbar navbar-inverse navbar-static-top', role: 'navigation' },
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { id: 'nav-tophat-helper', className: 'hidden-xs' }),
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
              'ul',
              { className: 'nav navbar-nav' },
              this.mts.map(function (mt, n) {
                return __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                  'li',
                  { key: 'mikey' + n, className: 'dropdown dropdown-ia pull-left' },
                  onbrowser ? __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                    'a',
                    { title: mt, className: 'navia-link ' + mt,
                      onClick: `Nav.nav_details("${mt}")`,
                      'data-top-kind': mt, 'data-toggle': 'tooltip', target: '_top', 'data-placement': 'bottom' },
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', { className: 'iconochive-' + mt, 'aria-hidden': 'true' }),
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                      'span',
                      { className: 'sr-only' },
                      mt
                    )
                  ) : __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                    'a',
                    { title: mt, className: 'navia-link ' + mt,
                      href: '/details/' + mt,
                      'data-top-kind': mt, 'data-toggle': 'tooltip', target: '_top', 'data-placement': 'bottom' },
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', { className: 'iconochive-' + mt, 'aria-hidden': 'true' }),
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                      'span',
                      { className: 'sr-only' },
                      mt
                    )
                  )
                );
              }),
              __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'li',
                { className: 'navbar-brand-li' },
                onbrowser ? __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                  'a',
                  { className: 'navbar-brand', onClick: 'Nav.nav_home();', target: '_top' },
                  __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', { className: 'iconochive-logo', 'aria-hidden': 'true' }),
                  __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                    'span',
                    { className: 'sr-only' },
                    'logo'
                  )
                ) : __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                  'a',
                  { className: 'navbar-brand', href: '/', target: '_top' },
                  __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', { className: 'iconochive-logo', 'aria-hidden': 'true' }),
                  __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                    'span',
                    { className: 'sr-only' },
                    'logo'
                  )
                )
              ),
              __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'li',
                { id: 'nav-search', className: 'dropdown dropdown-ia pull-right' },
                onbrowser ? __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                  'a',
                  { onClick: '$(this).parents(\'#nav-search\').find(\'form\').submit(); return false;' },
                  __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', { className: 'iconochive-search', 'aria-hidden': 'true' }),
                  __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                    'span',
                    { className: 'sr-only' },
                    'search'
                  )
                ) : __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                  'a',
                  { href: '/search.php' },
                  __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', { className: 'iconochive-search', 'aria-hidden': 'true' }),
                  __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                    'span',
                    { className: 'sr-only' },
                    'search'
                  )
                ),
                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                  'div',
                  null,
                  onbrowser ? __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                    'form',
                    { role: 'search', onSubmit: 'Nav.nav_search(this.elements[0].value); return 0;', target: '_top' },
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                      'label',
                      { htmlFor: 'search-bar-2', className: 'sr-only' },
                      'Search the Archive'
                    ),
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('input', { id: 'search-bar-2', placeholder: 'Search', type: 'text', name: 'query', value: '' }),
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('input', { type: 'submit', value: 'Search' })
                  ) : __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                    'form',
                    { role: 'search', action: '/search.php', target: '_top' },
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                      'label',
                      { htmlFor: 'search-bar-2', className: 'sr-only' },
                      'Search the Archive'
                    ),
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('input', { id: 'search-bar-2', placeholder: 'Search', type: 'text', name: 'query', value: '' }),
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('input', { type: 'submit', value: 'Search' })
                  )
                )
              ),
              __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'li',
                { className: 'dropdown dropdown-ia pull-right' },
                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                  'a',
                  { id: 'glyphme', href: 'https://archive.org/donate', _target: 'top',
                    'data-toggle': 'tooltip', 'data-placement': 'bottom', title: 'Donate' },
                  __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('img', { src: 'https://archive.org/images/gift.png' })
                )
              ),
              __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'li',
                { className: 'dropdown dropdown-ia pull-right' },
                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                  'a',
                  { href: 'https://archive.org/create', _target: 'top', 'data-toggle': 'tooltip', 'data-placement': 'bottom', title: 'Upload' },
                  __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', { className: 'iconochive-upload', 'aria-hidden': 'true' }),
                  __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                    'span',
                    { className: 'sr-only' },
                    'upload'
                  )
                )
              )
            )
          )
        )
      ),
      __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
        'div',
        { className: 'container container-ia' },
        this.htm
      )
    );
  }

  static clear(destn) {
    // Clear the screen to give confidence that action under way
    // Leaves Nav, clears rest
    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].domrender(new Nav("Loading").render(true), destn);
  }
  static async nav_home() {
    console.log("Navigating to Home");
    return await Nav.nav_details(undefined);
  }

  static async nav_details(id) {
    console.log("Navigating to Details", id);
    let destn = document.getElementById('main'); // Blank window (except Nav) as loading
    Nav.clear(destn);
    //let d = await new Details(id).fetch(); // Gets back a obj fetched and ready to render
    await __WEBPACK_IMPORTED_MODULE_3__ArchiveFactory__["a" /* default */].factory(id, destn, ""); // Not sure what returning ....
    return false; // Dont follow anchor link - unfortunately React ignores this
  }

  static async nav_search(q) {
    console.log("Navigating to Search");
    let destn = document.getElementById('main'); // Blank window (except Nav) as loading
    Nav.clear(destn);
    let s = await new __WEBPACK_IMPORTED_MODULE_2__Search__["default"](q ? { query: q } : undefined).fetch();
    s.render(destn, "");
  }

}
/* harmony export (immutable) */ __webpack_exports__["default"] = Nav;


/***/ }),
/* 10 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Details__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Home__ = __webpack_require__(11);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__Collection__ = __webpack_require__(12);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__Texts__ = __webpack_require__(13);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__Image__ = __webpack_require__(14);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__AV__ = __webpack_require__(15);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__DetailsError__ = __webpack_require__(16);
__webpack_require__(0)({ presets: ['es2015', 'react'] }); // ES6 JS below!









class ArchiveFactory {
    static async factory(itemid, res, htm) {
        if (!itemid) {
            (await new __WEBPACK_IMPORTED_MODULE_1__Home__["a" /* default */](itemid, undefined).fetch()).render(res, htm);
        } else {
            let obj = await new __WEBPACK_IMPORTED_MODULE_0__Details__["default"](itemid).fetch();
            item = obj.item;
            if (!item.metadata) {
                new __WEBPACK_IMPORTED_MODULE_6__DetailsError__["a" /* default */](itemid, item, `item ${itemid} cannot be found or does not have metadata`).render(res, htm); //TODO-DETAILS test
            } else {
                if (verbose) console.log("Found mediatype", item.metadata.mediatype);
                switch (item.metadata.mediatype) {
                    case "collection":
                        //TODO-DETAILS-REFACTOR
                        return (await new __WEBPACK_IMPORTED_MODULE_2__Collection__["a" /* default */](itemid, item).fetch()).render(res, htm);
                        break;
                    case "texts":
                        new __WEBPACK_IMPORTED_MODULE_3__Texts__["a" /* default */](itemid, item).render(res, htm);
                        break;
                    case "image":
                        new __WEBPACK_IMPORTED_MODULE_4__Image__["a" /* default */](itemid, item).render(res, htm);
                        break;
                    case "audio": // Intentionally drop thru to movies
                    case "movies":
                        new __WEBPACK_IMPORTED_MODULE_5__AV__["a" /* default */](itemid, item).render(res, htm);
                        break;
                    default:
                        new __WEBPACK_IMPORTED_MODULE_6__DetailsError__["a" /* default */](itemid, item, `Unsupported mediatype: ${item.metadata.mediatype}`).render(res, htm); //TODO-DETAILS test
                    //    return new Nav(")
                }
            }
        }
    }

}
/* harmony export (immutable) */ __webpack_exports__["a"] = ArchiveFactory;


/***/ }),
/* 11 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ReactFake__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Search__ = __webpack_require__(4);
__webpack_require__(0)({ presets: ['es2015', 'react'] }); // ES6 JS below!



class Home extends __WEBPACK_IMPORTED_MODULE_1__Search__["default"] {
    constructor(itemid, item) {
        const NOT = ['what_cd', 'cd', 'vinyl', 'librarygenesis', 'bibalex', // per alexis
        'movies', 'audio', 'texts', 'software', 'image', 'data', 'web', // per alexis/tracey
        'additional_collections', 'animationandcartoons', 'artsandmusicvideos', 'audio_bookspoetry', 'audio_foreign', 'audio_music', 'audio_news', 'audio_podcast', 'audio_religion', 'audio_tech', 'computersandtechvideos', 'coverartarchive', 'culturalandacademicfilms', 'ephemera', 'gamevideos', 'inlibrary', 'moviesandfilms', 'newsandpublicaffairs', 'ourmedia', 'radioprograms', 'samples_only', 'spiritualityandreligion', 'stream_only', 'television', 'test_collection', 'usgovfilms', 'vlogs', 'youth_media'];

        const query = 'mediatype:collection AND NOT noindex:true AND NOT collection:web AND NOT identifier:fav-* AND NOT identifier:' + NOT.join(' AND NOT identifier:');
        super({
            query: query,
            sort: '-downloads'
        });
        this.item = item;
        this.itemid = itemid;
    }
    banner() {
        return __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'center',
            { style: { margin: "35px" } },
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', { style: { fontSize: "125px" }, className: 'iconochive-logo' })
        );
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = Home;


/***/ }),
/* 12 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ReactFake__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Search__ = __webpack_require__(4);
__webpack_require__(0)({ presets: ['es2015', 'react'] }); // ES6 JS below!



class Collection extends __WEBPACK_IMPORTED_MODULE_1__Search__["default"] {
    constructor(itemid, item) {
        super({
            query: 'collection:' + itemid,
            sort: '-downloads'
        });
        this.item = item;
        this.itemid = itemid;
    }

    banner() {
        item = this.item;
        //TODO-DETAILS probably move this to the Search class after move to use the approach taken in template_image.js
        const creator = item.metadata.creator && item.metadata.creator != item.metadata.title ? item.metadata.creator : '';
        //ARCHIVE-BROWSER note the elements below were converted to HTML 3 times in original version
        //TODO-DETAILS on prelinger, banner description is getting truncated.
        return __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'div',
            { className: 'welcome container container-ia width-max', style: { 'backgroundColor': 'white' } },
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'div',
                { className: 'container' },
                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                    'div',
                    { className: 'row' },
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'div',
                        { className: 'col-xs-11 col-sm-10 welcome-left' },
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'div',
                            { id: 'file-dropper-wrap' },
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { id: 'file-dropper' }),
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('img', { id: 'file-dropper-img', className: 'img-responsive', style: { 'maxWidth': "350px", margin: '0 10px 5px 0' }, src: 'https://archive.org/services/img/' + this.id })
                        ),
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'h1',
                            null,
                            item.metadata.title
                        ),
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'h4',
                            null,
                            creator
                        ),
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'div',
                            { id: 'descript', style: { maxHeight: "43px", cursor: 'pointer' } },
                            item.metadata.description
                        )
                    ),
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'div',
                        { className: 'col-xs-1 col-sm-2 welcome-right' },
                        'xxx'
                    )
                )
            )
        );
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = Collection;


/***/ }),
/* 13 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ReactFake__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Details__ = __webpack_require__(2);
__webpack_require__(0)({ presets: ['es2015', 'react'] }); // ES6 JS below!




class Texts extends __WEBPACK_IMPORTED_MODULE_1__Details__["default"] {
    constructor(itemid, item) {
        super(itemid);
        this.item = item;
    }
    jsxInNav(onbrowser) {
        //TODO-DETAILS redo this to use a template, note div outside iframe is just to keep JSX happy
        let item = this.item;
        return __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'div',
            null,
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('iframe', { width: '100%', height: '480', src: `https://archive.org/stream/${this.id}?ui=embed#mode/2up` }),
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('br', null),
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { dangerouslySetInnerHTML: { __html: item.metadata.description } }),
            ' '
        );
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = Texts;


/***/ }),
/* 14 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ReactFake__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Details__ = __webpack_require__(2);
__webpack_require__(0)({ presets: ['es2015', 'react'] }); // ES6 JS below!




class Image extends __WEBPACK_IMPORTED_MODULE_1__Details__["default"] {
    //TODO-DETAILS this is the new approach to embedding a mediatype - to gradually replace inline way in this file.
    //TODO-REFACTOR merge this into the template_image.js file
    constructor(itemid, item) {
        super(itemid);
        this.item = item;
    }

    browserAfter() {
        archive_setup.push(function () {
            //TODO-DETAILS check this isn't being left on archive_setup for next image etc
            AJS.theatresize();
            AJS.carouselsize('#ia-carousel', true);
        });
        super.browserAfter();
    }
    jsxInNav(onbrowser) {
        let item = this.item;
        let itemid = item.metadata.identifier; // Shortcut as used a lot
        let mainfile = item.files.find(fi => ['JPEG'].includes(fi.format)); //TODO-DETAILS-IMAGE probably add other formats
        let detailsurl = `https://archive.org/details/${itemid}`; //TODO-DETAILS-DWEB will move to this decentralized page, but check usages (like tweet) below
        let embedurl = `https://archive.org/embed/${itemid}`;
        return __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'div',
            { id: 'theatre-ia-wrap', className: 'container container-ia width-max  resized', style: { height: "600px" } },
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('link', { itemProp: 'url', href: detailsurl }),
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('link', { itemProp: 'thumbnailUrl', href: 'https://archive.org/services/img/{itemid}' }),
            item.files.filter(fi => fi.source !== "metadata").map(fi => __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('link', { itemProp: 'associatedMedia', href: `https://archive.org/download/${itemid}/${fi.name}`, key: `${itemid}/${fi.name}` })),
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'h1',
                { className: 'sr-only' },
                item.metadata.title
            ),
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'h2',
                { className: 'sr-only' },
                'Item Preview'
            ),
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'div',
                { id: 'theatre-ia', className: 'container' },
                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                    'div',
                    { className: 'row' },
                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                        'div',
                        { className: 'xs-col-12' },
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { id: 'theatre-controls' }),
                        ' ',
                        mainfile ? __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'div',
                            { className: 'details-carousel-wrapper' },
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'section',
                                { id: 'ia-carousel', className: 'carousel slide', 'data-ride': 'carousel', 'data-interval': 'false',
                                    'aria-label': 'Item image slideshow', style: { maxHeight: "600px" } },
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                    'ol',
                                    { className: 'carousel-indicators', style: { display: "none" } },
                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('li', { 'data-target': '#ia-carousel', 'data-slide-to': '0', className: ' active', role: 'button', tabIndex: '0',
                                        'aria-label': 'Go to image 1' })
                                ),
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                    'div',
                                    { className: 'carousel-inner' },
                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                        'div',
                                        { className: 'item active' },
                                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                            'a',
                                            { className: 'carousel-image-wrapper',
                                                href: `http://archive.org/download/${itemid}/${mainfile.name}`,
                                                title: 'Open full sized image' },
                                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('img', { className: 'rot0 carousel-image', alt: 'item image #1',
                                                src: `http://archive.org/download/${itemid}/${mainfile.name}` }),
                                            ' '
                                        ),
                                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                            'div',
                                            { className: 'carousel-caption' },
                                            mainfile.name
                                        )
                                    )
                                )
                            )
                        ) : __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'div',
                            { className: 'row', style: { color: "white" } },
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'div',
                                { className: 'col-md-10 col-md-offset-1 no-preview' },
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                    'p',
                                    { className: 'theatre-title' },
                                    'There Is No Preview Available For This Item'
                                ),
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                    'p',
                                    null,
                                    'This item does not appear to have any files that can be experienced on Archive.org',
                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('br', null),
                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                        'span',
                                        { className: 'hidden-xs hidden-sm' },
                                        'Please download files in this item to interact with them on your computer.'
                                    ),
                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('br', null),
                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                        'a',
                                        { className: 'show-all', href: `https://archive.org/download/${itemid}`, target: '_blank' },
                                        'Show all files'
                                    )
                                )
                            )
                        ),
                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                            'div',
                            { id: 'cher-modal', className: 'modal fade', role: 'dialog', 'aria-hidden': 'true' },
                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                'div',
                                { className: 'modal-dialog modal-lg' },
                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                    'div',
                                    { className: 'modal-content', style: { padding: "10px" } },
                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                        'div',
                                        { className: 'modal-header' },
                                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                            'button',
                                            { type: 'button', className: 'close', 'data-dismiss': 'modal', 'aria-hidden': 'true' },
                                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('span', {
                                                className: 'iconochive-remove-circle', 'aria-hidden': 'true' }),
                                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                                'span',
                                                {
                                                    className: 'sr-only' },
                                                'remove-circle'
                                            )
                                        ),
                                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                            'h3',
                                            { className: 'modal-title' },
                                            'Share or Embed This Item'
                                        )
                                    ),
                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                        'div',
                                        { id: 'cher-body' },
                                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                            'div',
                                            { style: { textAlign: "center", margin: "50px auto" } },
                                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                                'div',
                                                { className: 'topinblock' },
                                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                                    'div',
                                                    { id: 'sharer' },
                                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                                        'a',
                                                        { href: `https://twitter.com/intent/tweet?url=${detailsurl};via=internetarchive&amp;text=${item.metadata.title}+%3A+${item.metadata.creator}+%3A+Free+Download+%26+Streaming+%3A+Internet+Archive`,
                                                            target: '_blank' },
                                                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { className: 'sharee iconochive-twitter', 'data-toggle': 'tooltip',
                                                            'data-placement': 'bottom', title: '',
                                                            'data-original-title': 'Share to Twitter' })
                                                    ),
                                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                                        'a',
                                                        { href: `https://www.facebook.com/sharer/sharer.php?u=${detailsurl}`,
                                                            target: '_blank' },
                                                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { className: 'sharee iconochive-facebook', 'data-toggle': 'tooltip',
                                                            'data-placement': 'bottom', title: '',
                                                            'data-original-title': 'Share to Facebook' })
                                                    ),
                                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                                        'a',
                                                        { href: `https://plus.google.com/share?url=${detailsurl}`,
                                                            target: '_blank' },
                                                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { className: 'sharee iconochive-googleplus', 'data-toggle': 'tooltip',
                                                            'data-placement': 'bottom', title: '',
                                                            'data-original-title': 'Share to Google+' })
                                                    ),
                                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                                        'a',
                                                        { href: `http://www.reddit.com/submit?url=${detailsurl};title=${item.metadata.title}+%3A+${item.metadata.creator}+%3A+Free+Download+%26amp%3B+Streaming+%3A+Internet+Archive`,
                                                            target: '_blank' },
                                                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { className: 'sharee iconochive-reddit', 'data-toggle': 'tooltip',
                                                            'data-placement': 'bottom', title: '',
                                                            'data-original-title': 'Share to Reddit' })
                                                    ),
                                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                                        'a',
                                                        { href: `https://www.tumblr.com/share/video?embed=%3Ciframe+width%3D%22640%22+height%3D%22480%22+frameborder%3D%220%22+allowfullscreen+src%3D%22https%3A%2F%2Farchive.org%2Fembed%2F%22+webkitallowfullscreen%3D%22true%22+mozallowfullscreen%3D%22true%22%26gt%3B%26lt%3B%2Fiframe%3E&;name=${item.metadata.title}+%3A+${item.metadata.creator}+%3A+Free+Download+%26amp%3B+Streaming+%3A+Internet+Archive`,
                                                            target: '_blank' },
                                                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { className: 'sharee iconochive-tumblr', 'data-toggle': 'tooltip',
                                                            'data-placement': 'bottom', title: '',
                                                            'data-original-title': 'Share to Tumblr' })
                                                    ),
                                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                                        'a',
                                                        { href: `http://www.pinterest.com/pin/create/button/?url=${detailsurl}&;description=${item.metadata.title}+%3A+${item.metadata.creator}+%3A+Free+Download+%26amp%3B+Streaming+%3A+Internet+Archive`,
                                                            target: '_blank' },
                                                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { className: 'sharee iconochive-pinterest', 'data-toggle': 'tooltip',
                                                            'data-placement': 'bottom', title: '',
                                                            'data-original-title': 'Share to Pinterest' })
                                                    ),
                                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                                        'a',
                                                        { href: `mailto:?body=${detailsurl}&;subject=${item.metadata.title} : ${item.metadata.creator} : Free Download &amp; Streaming : Internet Archive` },
                                                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { className: 'sharee iconochive-email', 'data-toggle': 'tooltip',
                                                            'data-placement': 'bottom', title: '',
                                                            'data-original-title': 'Share via email' })
                                                    )
                                                ),
                                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('br', { clear: 'all', className: 'clearfix' })
                                            )
                                        ),
                                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                            'div',
                                            null,
                                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                                'form',
                                                { className: 'form', role: 'form' },
                                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                                    'div',
                                                    { className: 'form-group' },
                                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                                        'label',
                                                        null,
                                                        'EMBED'
                                                    ),
                                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                                        'textarea',
                                                        { id: 'embedcodehere', className: 'form-control textarea-invert-readonly',
                                                            rows: '3', readOnly: 'readonly' },
                                                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('iframe', { src: embedurl, width: '560', height: '384', frameborder: '0', webkitallowfullscreen: 'true', mozallowfullscreen: 'true', allowfullscreen: true })
                                                    )
                                                )
                                            )
                                        ),
                                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                            'div',
                                            null,
                                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                                'form',
                                                { className: 'form', role: 'form' },
                                                __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                                    'div',
                                                    { className: 'form-group' },
                                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                                        'label',
                                                        null,
                                                        'EMBED (for wordpress.com hosted blogs)'
                                                    ),
                                                    __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                                        'textarea',
                                                        { id: 'embedcodehereWP', className: 'form-control textarea-invert-readonly',
                                                            rows: '3', readOnly: 'readonly' },
                                                        `[archiveorg ${itemid} width=560 height=384 frameborder=0 webkitallowfullscreen=true mozallowfullscreen=true]`
                                                    )
                                                )
                                            )
                                        ),
                                        __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                            'div',
                                            null,
                                            'Want more?',
                                            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                                                'a',
                                                { href: `https://archive.org/help/audio.php?identifier=${itemid}` },
                                                'Advanced embedding details, examples, and help'
                                            ),
                                            '!'
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            ),
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { id: 'flag-overlay', className: 'center-area ' })
        );
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = Image;


/***/ }),
/* 15 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ReactFake__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Util__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__Details__ = __webpack_require__(2);
__webpack_require__(0)({ presets: ['es2015', 'react'] }); // ES6 JS below!





class AV extends __WEBPACK_IMPORTED_MODULE_2__Details__["default"] {
    constructor(itemid, item) {
        super(itemid);
        this.item = item;
    }
    nodeHtmlBefore() {
        playlist = JSON.stringify(this.playlist);
        cfg = JSON.stringify(this.cfg);
        return `
          <script src="//archive.org/jw/6.8/jwplayer.js" type="text/javascript"></script>
          <script src="//archive.org/includes/play.js" type="text/javascript"></script>
          <script>
            $(function(){ Play('jw6', ${playlist}, ${cfg}); });
          </script>
          <style>
            #jw6, #jw6__list { backgroundColor:black; }
          </style>`;
    }
    browserAfter() {
        super.browserAfter();
        Play('jw6', this.playlist, this.cfg);
    }
    jsxInNav(onbrowser) {
        let item = this.item;
        this.playlist = [];
        let cfg = {};
        let avs = item.files.filter(fi => fi.format == 'h.264' || fi.format == '512Kb MPEG4');
        if (!avs.length) avs = item.files.filter(fi => fi.format == 'VBR MP3');
        cfg.aspectratio = 4 / 3;

        if (avs.length) {

            // reduce array down to array of just filenames
            //avs = avs.map(val => val.name);

            avs.sort((a, b) => __WEBPACK_IMPORTED_MODULE_1__Util__["a" /* default */].natcompare(a.name, b.name)); //Unsure why sorting names, presumably tracks are named alphabetically ?
            for (var fi of avs) //TODO-DETAILS make this a map (note its tougher than it looks!)
            this.playlist.push({ title: fi.title ? fi.title : fi.name, sources: [{ file: 'https://archive.org/download/' + this.id + '/' + fi.name }] });
            this.playlist[0].image = 'https://archive.org/services/img/' + this.id;
        }
        //TODO-DETAILS redo using a template - note outer div just to keep JSX happy
        return __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
            'div',
            null,
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement(
                'h1',
                null,
                item.metadata.title
            ),
            avs.length ? __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { id: 'jw6' }) : undefined,
            __WEBPACK_IMPORTED_MODULE_0__ReactFake__["a" /* default */].createElement('div', { dangerouslySetInnerHTML: { __html: item.metadata.description } }),
            ' '
        );
    }

}
/* harmony export (immutable) */ __webpack_exports__["a"] = AV;


/***/ }),
/* 16 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ReactFake__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Details__ = __webpack_require__(2);
__webpack_require__(0)({ presets: ['es2015', 'react'] }); // ES6 JS below!



class DetailsError extends __WEBPACK_IMPORTED_MODULE_1__Details__["default"] {
    constructor(itemid, item, message) {
        super(itemid);
        this.item = item;
        this.message = message;
    }
    jsxInNav(onbrowser) {
        return this.message;
    }
    render(res, htm) {
        const onbrowser = res.constructor.name != "ServerResponse"; // For a browser we render to an element, for server feed to a response stream
        if (!onbrowser) {
            res.statusCode = 500;
        }
        super.render(res, htm);
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = DetailsError;


/***/ })
/******/ ]);