//import ReactDOM from "react-dom";

require('babel-core/register')({ presets: ['es2015', 'react']}); // ES6 JS below!

// https://ponyfoo.com/articles/universal-react-babel

import React from './ReactFake';
import Util from './Util';
import Search from './Search';
import Details from './Details';


export default class Nav { //extends React.Component
  constructor(htm) {
    //super();
    this.mts = ['web', 'texts', 'movies', 'audio', 'software', 'image'];
    this.htm = htm; //ARCHIVE-BROWSER could be string or nodes (not sure what class that is, but whatever the JSX compiler gives
  }

  render(onbrowser) {
      if (typeof this.htm === "string") {
          this.htm = ( <div dangerouslySetInnerHTML={{__html: this.htm}}></div> );
      }
      // TODO-DETAILS removed this from search button as generates error - come back and fix
      //TODO-DETAILS is putting the description (in 'htm' in as raw html which would be a nasty security hole since that comes from user !
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
                        { onbrowser ? (
                       <a title={mt} className={'navia-link '+mt}
                          onClick={`Nav.nav_details("${mt}")`}
                          data-top-kind={mt} data-toggle="tooltip" target="_top" data-placement="bottom">
                         <span className={'iconochive-'+mt} aria-hidden="true"></span>
                         <span className="sr-only">{mt}</span>
                       </a>
                ) : (
                        <a title={mt} className={'navia-link '+mt}
                            href={'/details/'+mt}
                            data-top-kind={mt} data-toggle="tooltip" target="_top" data-placement="bottom">
                                <span className={'iconochive-'+mt} aria-hidden="true"></span>
                                <span className="sr-only">{mt}</span>
                                </a>
                )}
                     </li>);
                 })}

                <li className="navbar-brand-li">
          { onbrowser ? (
                  <a className="navbar-brand" onClick="Nav.nav_home();" target="_top">
                    <span className="iconochive-logo"  aria-hidden="true"></span>
                    <span className="sr-only">logo</span>
                  </a>
            ) : (
                  <a className="navbar-brand" href="/" target="_top">
                    <span className="iconochive-logo"  aria-hidden="true"></span>
                    <span className="sr-only">logo</span>
                  </a>
            ) }
                </li>

                <li id="nav-search" className="dropdown dropdown-ia pull-right">
            { onbrowser ? (
                  <a onClick="$(this).parents('#nav-search').find('form').submit(); return false;">
                    <span className="iconochive-search" aria-hidden="true"></span>
                    <span className="sr-only">search</span>
                  </a>
            ) : (
                  <a href="/search.php">
                    <span className="iconochive-search" aria-hidden="true"></span>
                    <span className="sr-only">search</span>
                  </a>
            ) }
                  <div>
            { onbrowser ? (
                    <form role="search" onSubmit="Nav.nav_search(this.elements[0].value)" target="_top">
                      <label htmlFor="search-bar-2" className="sr-only">Search the Archive</label>
                      <input id="search-bar-2" placeholder="Search" type="text" name="query" value=""/>
                      <input type="submit" value="Search"/>
                    </form>
            ) : (
                    <form role="search" action="/search.php" target="_top">
                      <label htmlFor="search-bar-2" className="sr-only">Search the Archive</label>
                      <input id="search-bar-2" placeholder="Search" type="text" name="query" value=""/>
                      <input type="submit" value="Search"/>
                    </form>
            )}
                  </div>
                </li>

                <li className="dropdown dropdown-ia pull-right">
                  <a id="glyphme" href="https://archive.org/donate" _target="top"
                     data-toggle="tooltip" data-placement="bottom" title="Donate">
                    <img src="https://archive.org/images/gift.png"/>
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
          {this.htm}
        </div>
      </div>
    );
  }

  static clear(destn) {
      // Clear the screen to give confidence that action under way
      // Leaves Nav, clears rest
      React.domrender(new Nav("Loading").render(true), destn);
  }
  static async nav_home() {
    console.log("Navigating to Home");
    return await Nav.nav_details(undefined);
  }

  static async nav_details(id) {
    console.log("Navigating to Details",id);
    let destn = document.getElementById('main'); // Blank window (except Nav) as loading
    Nav.clear(destn);
    //let d = await new Details(id).fetch(); // Gets back a obj fetched and ready to render
    await Details.factory(id, destn, ""); // Not sure what returning ....
    return false; // Dont follow anchor link - unfortunately React ignores this
  }

  static async nav_search(q) {
        console.log("Navigating to Search");
      let destn = document.getElementById('main'); // Blank window (except Nav) as loading
      Nav.clear(destn);
        let s = await new Search( q ? {query:q} : undefined).fetch();
        s.render(destn, "");

  }

}
