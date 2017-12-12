require('babel-core/register')({ presets: ['es2015', 'react']}); // ES6 JS below!
import React from './ReactFake';
//Not needed on client - kept so script can run in both cases
//import ReactDOMServer from 'react-dom/server';
//Next line is for client, not needed on server but doesnt hurt
//import ReactDOM from 'react-dom';

import Util from './Util';

export default class ArchiveBase {
    constructor(id, {}={}) {
        this.id = id;
    }
    jsxInNav(onbrowser) {
    }

    navwrapped(onbrowser) {
        /* Wrap the content up in a Nav
        onbrowser:    true if rendering in browser, false if in node on server
        returns:      JSX elements tree suitable for passing to ReactDOM.render or ReactDOMServer.renderToStaticMarkup
         */
        return new Nav(this.jsxInNav(onbrowser)).render(onbrowser);
    }

    browserBefore() {
        //Anything that is needed in the browser before the Nav - TODO-DETAILS will have the stuff above the Nav banner
        // Nothing to do by default
    }
    browserAfter() {
        Util.AJS_on_dom_loaded(); // Runs code pushed archive_setup - needed for image
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
        var els = this.navwrapped(onbrowser);  //ARCHIVE-BROWSER remove unneccessary convert back to HTML and reconversion inside Nav.render

        //ARCHIVE-BROWSER - this is run at the end of archive_min.js in node, on browser it has to be run after doing a search
        if (onbrowser) {
            this.browserBefore();
            React.domrender(els, res);
            this.browserAfter();
        } else {
            htm += this.nodeHtmlBefore();
            htm += ReactDOMServer.renderToStaticMarkup(els);
            htm += this.nodeHtmlAfter();
            res.end(htm);
        }
    }
}

