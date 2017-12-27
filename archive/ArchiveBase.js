require('babel-core/register')({ presets: ['env', 'react']}); // ES6 JS below!
import React from './ReactFake';
//Not needed on client - kept so script can run in both cases
//import ReactDOMServer from 'react-dom/server';
//Next line is for client, not needed on server but doesnt hurt
//import ReactDOM from 'react-dom';
//TODO-DETAILS add a config file, load at compile and make overridable - server etc go there
import Util from './Util';
import ArchiveItem from './ArchiveItem';

export default class ArchiveBase extends ArchiveItem {  //TODO-REFACTOR - extends ArchiveItem and rename to ArchivePageBase - move data to AI
    /*
    Base class for Archive application - base of Details = which includes single element items and Search which includes both searches and collections (which are actually items).
    ArchiveBase
    - Details
    - - AV
    - - Image
    - - Text
    - - Software (not implemented)
    - Search
    - - Home
    - - Collection
    Nav - knows about all the classes (includes factory() but doesnt subclass them
    Util - just some utility functions
    Tile - elements on a Search - each is a ArchiveItem
    ReactFake - spoofs methods of React as otherwise hard to do onclick etc if use real React (note archive.min still uses react a little)

    Fields:
    item    Metadata for item, undefined for a search.
    items   Metadata for items found if the item is a Collection,
    query   query part of search to run (Search|Collection|Home only)
     */
    constructor(itemid,  {item = undefined}={}) {
        super({itemid: itemid, item: item});
    }
    jsxInNav() {
    }
    theatreIaWrap() {
    }

    browserBefore() {
        //Anything that is needed to be executed in the browser before the main HTML tree is replaced.
        // Nothing to do by default
    }
    browserAfter() {
        Util.AJS_on_dom_loaded(); // Runs code pushed archive_setup - needed for image if "super" this, put it after superclasses
    }
    nodeHtmlBefore() {
        /* Return html to insert before Nav wrapped part for use in node*/
        return "";
    }
    nodeHtmlAfter() {
        /* Return html to insert after Nav wrapped part for use in node*/
        return "";
    }
    render(res, htm) {  //TODO-DETAILS remove htm and from calling routines
        var els = this.navwrapped();
        this.browserBefore();
        React.domrender(els, res);
        this.browserAfter();
    }
}

