
require('babel-core/register')({ presets: ['es2015', 'react']}); // ES6 JS below!

// https://ponyfoo.com/articles/universal-react-babel

import React from 'react';
import Util from './Util';


export default class Nav extends React.Component {
  constructor(htm) {
    super();
    this.mts = ['web', 'texts', 'movies', 'audio', 'software', 'image'];
    this.htm = htm;
  }

  render() {
    return (
      <div id="wrap">
        <div id="navwrap1">
          <div id="navwrap2">
            <div className="navbar navbar-inverse navbar-static-top" role="navigation">
              <div id="nav-tophat-helper" className="hidden-xs"></div>
              <ul className="nav navbar-nav">

                {this.mts.map(function(mt, n){
                   return (
                     <li key={'mikey'+n} className="dropdown dropdown-ia pull-left">
                       <a title={mt} className={'navia-link '+mt}
                          href={'/details/'+mt}
                          data-top-kind={mt} data-toggle="tooltip" target="_top" data-placement="bottom">
                         <span className={'iconochive-'+mt} aria-hidden="true"></span>
                         <span className="sr-only">{mt}</span>
                       </a>
                     </li>);
                 })}

                <li className="navbar-brand-li">
                  <a className="navbar-brand" href="/" target="_top">
                    <span className="iconochive-logo"  aria-hidden="true"></span>
                    <span className="sr-only">logo</span>
                  </a>
                </li>

                <li id="nav-search" className="dropdown dropdown-ia pull-right">
                  <a href="/search.php"
                     onClick="$(this).parents('#nav-search').find('form').submit(); return false">
                    <span className="iconochive-search" aria-hidden="true"></span>
                    <span className="sr-only">search</span>
                  </a>
                  <div>
                    <form role="search" action="/search.php" target="_top">
                      <label htmlFor="search-bar-2" className="sr-only">Search the Archive</label>
                      <input id="search-bar-2" placeholder="Search" type="text" name="query" value=""/>
                      <input type="submit" value="Search"/>
                    </form>
                  </div>
                </li>

                <li className="dropdown dropdown-ia pull-right">
                  <a id="glyphme" href="https://archive.org/donate" _target="top"
                     data-toggle="tooltip" data-placement="bottom" title="Donate">
                    <img src="/images/gift.png"/>
                  </a>
                </li>

                <li className="dropdown dropdown-ia pull-right">
                  <a href="https://archive.org/create" _target="top" data-toggle="tooltip" data-placement="bottom" title="Upload">
                    <span className="iconochive-upload"  aria-hidden="true"></span>
                    <span className="sr-only">upload</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="container container-ia">
          <div dangerouslySetInnerHTML={{__html: this.htm}}></div>
        </div>
      </div>
    );
  }
}
