require('babel-core/register')({ presets: ['es2015', 'react']}); // ES6 JS below!

import React from 'react';
import Util from './Util';


export default class {
  render(item, onbrowser){
    //xxx shorten/safify certain title usages (compared to Lists.inc)
    const collections = (Array.isArray(item.collection) ? item.collection : (typeof(item.collection)=='string' ? [item.collection] : []));
    const collection = collections[0];
    const nFavorites = collections.filter(e => e.startsWith('fav-')).length;
    const is_collection = (item.mediatype=='collection');
    const classes = 'item-ia' + (is_collection ? ' collection-ia' : '');
    //ARCHIVE-BROWSER on browser, want to load links locally (via APIs) rather than rebuilding HTML page
      // ARCHIVE-BROWSER added key= to keep react happy (I hope)
      return (
      <div className={classes} data-id={item.identifier}  key={item.identifier}>
        {onbrowser ? (
        <a className="stealth" tabIndex="-1" onClick={() => Nav.nav_details(collection)}>
          <div className="item-parent">
            <div className="item-parent-img"><img src={'https://archive.org/services/img/'+collection}/></div>
            <div className="item-parent-ttl">xxx parent title</div>
          </div>{/*.item-parent*/}
        </a>
        ) : (
        <a className="stealth" tabIndex="-1" href={'/details/'+collection}>
            <div className="item-parent">
            <div className="item-parent-img"><img src={'https://archive.org/services/img/'+collection}/></div>
        <div className="item-parent-ttl">xxx parent title</div>
        </div>{/*.item-parent*/}
        </a>
        ) }

        <div className="hidden-tiles views C C1">
          <nobr className="hidden-xs">{Util.number_format(item.downloads)}</nobr>
          <nobr className="hidden-sm hidden-md hidden-lg">{Util.number_format(item.downloads)}</nobr>
        </div>


        <div className="C234">
          <div className="item-ttl C C2">
          { onbrowser ? (
            <a onClick={() => Nav.nav_details(item.identifier)} title={item.title}>
              <div className="tile-img">
                <img className="item-img" xxxstyle="height:180px" src={'https://archive.org/services/img/'+item.identifier}/>
              </div>{/*.tile-img*/}
              <div className="ttl">
                {item.title}
              </div>
            </a>
          ) : (
            <a href={'/details/'+item.identifier} title={item.title}>
              <div className="tile-img">
                <img className="item-img" xxxstyle="height:180px" src={'//archive.org/services/img/'+item.identifier}/>
              </div>{/*.tile-img*/}
              <div className="ttl">
                {item.title}
              </div>
            </a>
            )}
          </div>

          <div className="hidden-tiles pubdate C C3">
            <nobr className="hidden-xs">Dec 3, 2012</nobr>
            <nobr className="hidden-sm hidden-md hidden-lg">12/12</nobr>
          </div>

          <div className="by C C4">
            <span className="hidden-lists">{item.creator && 'by '}</span>
            <span title={item.creator}>{item.creator}</span>
          </div>{/*.C4*/}
        </div>{/*.C234*/}


        <div className="mt-icon C C5">
          {Util.mediatype_icon(item.mediatype)}
        </div>
        <h6 className="stat ">
          <span className="iconochive-eye" aria-hidden="true"></span><span className="sr-only">eye</span>
          <nobr>{Util.number_format(item.downloads)}</nobr>
        </h6>
        <h6 className="stat">
          <span className="iconochive-favorite" aria-hidden="true"></span><span className="sr-only">favorite</span>
          {nFavorites}
        </h6>
        <h6 className="stat">
          <span className="iconochive-comment" aria-hidden="true"></span><span className="sr-only">comment</span>
          {item.num_reviews || "0"}
        </h6>
      </div>
    );
  }

  collection_stats(item){
    return (
      <div className="collection-stats">
        {Util.glyph({name:'collection', classes:'topinblock hidden-lists'})}
        <div className="num-items topinblock">
          0
          <div className="micro-label">ITEMS</div>
        </div>
        <div className="num-items hidden-tiles">
          {Util.number_format(item.downloads)}
          <div className="micro-label">VIEWS</div>
        </div>
      </div>
    );
  }
}
