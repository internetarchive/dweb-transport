//import ReactDOM from "react-dom";

require('babel-core/register')({ presets: ['env', 'react']}); // ES6 JS below!

// https://ponyfoo.com/articles/universal-react-babel

import React from './ReactFake';
import Util from './Util';
import Search from './Search';
import Details from './Details'
import Home from './Home'
import Collection from './Collection'
import Texts from './Texts'
import Image from './Image'
import AV from './AV'
import DetailsError from './DetailsError'


export default class Nav { //extends React.Component
  constructor() {
    //super();
    this.mts = ['web', 'texts', 'movies', 'audio', 'software', 'image'];
  }

  navwrapJSX() {
      /* The navigation stuff.   Order is navwrapJSX : maincontent : itemDetailsAbout */
      return (
        <div id="navwrap1">
          <div id="navwrap2">
            <div className="navbar navbar-inverse navbar-static-top" role="navigation">
              <div id="nav-tophat-helper" className="hidden-xs"></div>
              <ul className="nav navbar-nav">

                {this.mts.map((mt, n) => (
                     <li key={'mikey'+n} className="dropdown dropdown-ia pull-left">
                       <a title={mt} className={'navia-link '+mt}
                          onClick={`Nav.nav_details("${mt}")`}
                          data-top-kind={mt} data-toggle="tooltip" target="_top" data-placement="bottom">
                         <span className={'iconochive-'+mt} aria-hidden="true"></span>
                         <span className="sr-only">{mt}</span>
                       </a>
                     </li>
                ) ) }
                <li className="navbar-brand-li">
                  <a className="navbar-brand" onClick="Nav.nav_home();" target="_top">
                    <span className="iconochive-logo"  aria-hidden="true"></span>
                    <span className="sr-only">logo</span>
                  </a>
                </li>

                <li id="nav-search" className="dropdown dropdown-ia pull-right">
                  <a onClick="$(this).parents('#nav-search').find('form').submit(); return false;">
                    <span className="iconochive-search" aria-hidden="true"></span>
                    <span className="sr-only">search</span>
                  </a>
                  <div>
                    <form role="search" onSubmit="Nav.nav_search(this.elements[0].value); return 0;" target="_top">
                      <label htmlFor="search-bar-2" className="sr-only">Search the Archive</label>
                      <input id="search-bar-2" placeholder="Search" type="text" name="query" value=""/>
                      <input type="submit" value="Search"/>
                    </form>
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
          </div> {/*--nav-wrap2--*/}
        {/*--nav-wrap1--*/} </div>
      );
  }

  static clear(destn) {
      // Clear the screen to give confidence that action under way
      // Leaves Nav, clears rest
      React.domrender(new DetailsError(undefined, undefined, <span>"Loading"</span>).navwrapped(false), destn)
  }
  static async nav_home() {
    console.log("Navigating to Home");
    return await Nav.nav_details(undefined);
  }

  static async nav_details(id) {
    console.log("Navigating to Details",id);
    let destn = document.getElementById('main'); // Blank window (except Nav) as loading
    Nav.clear(destn);
    await Nav.factory(id, destn, ""); // Not sure what returning ....
    return false; // Dont follow anchor link - unfortunately React ignores this
  }

  static async nav_search(q) {
        console.log("Navigating to Search");
      let destn = document.getElementById('main'); // Blank window (except Nav) as loading
      Nav.clear(destn);
        let s = await new Search( q ? {query:encodeURIComponent(q)} : undefined).fetch();
        s.render(destn, "");

  }

    static async factory(itemid, res, htm) {
        if (!itemid) {
            (await new Home(itemid, undefined).fetch()).render(res, htm);
        } else {
            let obj = await new Details(itemid).fetch();
            item = obj.item;
            if (!item.metadata) {
                new DetailsError(itemid, item, `item ${itemid} cannot be found or does not have metadata`).render(res, htm);
            } else {
                if (verbose) console.log("Found mediatype", item.metadata.mediatype);
                switch (item.metadata.mediatype) {
                    case "collection":
                        return (await new Collection(itemid, item).fetch()).render(res, htm);
                        break;
                    case "texts":
                        new Texts(itemid, item).render(res, htm);
                        break;
                    case "image":
                        new Image(itemid, item).render(res, htm);
                        break;
                    case "audio": // Intentionally drop thru to movies
                    case "movies":
                        new AV(itemid, item).render(res, htm);
                        break;
                    default:
                        new DetailsError(itemid, item, `Unsupported mediatype: ${item.metadata.mediatype}`).render(res, htm);
                    //    return new Nav(")
                }
            }
        }
    }

}
