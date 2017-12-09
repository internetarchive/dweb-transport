
require('babel-core/register')({ presets: ['es2015', 'react']}); // ES6 JS below!

import http from 'http';
import async from 'async';
import React from 'react';
//Not needed on client - kept so script can run in both cases
import ReactDOMServer from 'react-dom/server';
//Next line is for client, not needed on server but doesnt hurt
import ReactDOM from 'react-dom';

import Nav from './Nav';
import Util from './Util';
import Search from './Search';
import template_image from './template_image';


//TODO-DETAILS-REFACTOR
//- Details (minimal factory)
//   factory to create, does the item fetch then checks mediatype and creates one of the others.
// -- Movie
// -- Search
// --- Collection

export default class Details {
  constructor(id, {}={}) {
      this.id = id;
  }
  async fetch() { // Note almost identical to code on Search.fetch()
      console.log('get metadata for '+this.id);
      // talk to Metadata API
          const _this = this;
          let response = await fetch(new Request(  // Note almost identical code on Details.js and Search.js
              'https://archive.org/metadata/'+this.id,
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
                  this.item = await response.json(); // response.json is a promise resolving to JSON already parsed
              } else {
                  t = response.text(); // promise resolving to text
                  console.log("Expecting JSON but got",t); //TODO-DETAILS-REFACTOR throw error here
              }
          }   // TODO-HTTP may need to handle binary as a buffer instead of text
          return this; // For chaining, but note will need to do an "await fetch"
  }
  static async factory(itemid, res, htm) {
      if (!itemid) {
          (await new Home(itemid, undefined).fetch()).render(res, htm);
      } else {
          let obj = await new Details(itemid).fetch();
          item = obj.item;
          if (!item.metadata) {
              new DetailsError(itemid, item, `item ${itemid} cannot be found or does not have metadata`).render(res, htm); //TODO-DETAILS test
          } else {
              if (verbose) console.log("Found mediatype", item.metadata.mediatype);
              switch (item.metadata.mediatype) {
                  case "collection": //TODO-DETAILS-REFACTOR
                      return (await new Collection(itemid, item).fetch()).render(res, htm);
                      break;
                  case "texts":
                      new Texts(itemid, item).render(res, htm);
                      break;
                  case "image":
                      new Image(itemid, item).render(res, htm);
                      break;
                  case "movies":
                      new AV(itemid, item).render(res, htm);
                      break;
                  default:
                      new DetailsError(itemid, item, `Unsupported mediatype: ${item.metadata.mediatype}`).render(res, htm); //TODO-DETAILS test
                  //    return new Nav(")
              }
          }
      }
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
        // Nothing to do by default
    }
    browserAfter() {
        Nav.AJS_on_dom_loaded(); // Runs code pushed archive_setup - needed for image
    }
    nodeHtmlBefore() {
        return "";
    }
    nodeHtmlAfter() {
        return "";
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
}

class DetailsError extends Details {
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
        super.render(res,htm)
    }
}

class Image extends Details {
    //TODO-DETAILS this is the new approach to embedding a mediatype - to gradually replace inline way in this file.
    //TODO-REFACTOR merge this into the template_image.js file
    constructor(itemid, item) {
        super(itemid);
        this.item = item;
    }

    jsxInNav(onbrowser) {
        return template_image(item);    // Apply the item to a template, returns a JSX tree suitable for wrapping in Nav
    }
    browserAfter() {
        archive_setup.push(function () {    //TODO-DETAILS check this isn't being left on archive_setup for next image etc
            AJS.theatresize();
            AJS.carouselsize('#ia-carousel', true);
        });
        super.browserAfter()
    }
}
class Texts extends Details {
    constructor(itemid, item) {
        super(itemid);
        this.item = item;
    }
    jsxInNav(onbrowser) {
        //TODO-DETAILS redo this to use a template, note div outside iframe is just to keep JSX happy
        let item = this.item
        return (
            <div>
            <iframe width="100%" height="480" src={`https://archive.org/stream/${this.id}?ui=embed#mode/2up`}></iframe><br/>
            <div dangerouslySetInnerHTML={{__html: item.metadata.description}}></div> {/*TODO-DETAILS probably a security issue inherited from Tracys code as banner could contain user-generated html*/}
            </div>
        );
    }
}

class AV extends Details {
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
        super.browserAfter()
        Play('jw6', this.playlist, this.cfg);
    }
    jsxInNav(onbrowser) {
      let item = this.item;
      this.playlist=[];
        let cfg={};
        let avs = item.files.filter(fi => (fi.format=='h.264' || fi.format=='512Kb MPEG4'));
        if (!avs.length)
            avs = item.files.filter(fi => fi.format=='VBR MP3');
        cfg.aspectratio = 4/3;

        if (avs.length) {

            // reduce array down to array of just filenames
            //avs = avs.map(val => val.name);

            avs.sort((a, b) => Util.natcompare(a.name, b.name));   //Unsure why sorting names, presumably tracks are named alphabetically ?
            for (var fi of avs) //TODO-DETAILS make this a map (note its tougher than it looks!)
                this.playlist.push({title:(fi.title ? fi.title : fi.name), sources:[{file:'https://archive.org/download/'+this.id+'/'+fi.name}]});
            this.playlist[0].image = 'https://archive.org/services/img/' + this.id;
        }
        //TODO-DETAILS redo using a template - note outer div just to keep JSX happy
        return (
            <div>
          <h1>{item.metadata.title}</h1>
            { (avs.length) ?  ( <div id="jw6"></div> ) : undefined }
            <div dangerouslySetInnerHTML={{__html: item.metadata.description}}></div> {/*TODO-DETAILS probably a security issue inherited from Tracys code as banner could contain user-generated html*/}
                </div>
        );
    }

}
class Collection extends Search {
    constructor(itemid, item) {
        super({
            query:  'collection:'+itemid,
            sort:   '-downloads',
        });
        this.item = item;
        this.itemid = itemid;
    }

    banner() {
        item = this.item;
        //TODO-DETAILS probably move this to the Search class after move to use the approach taken in template_image.js
        const creator = (item.metadata.creator  &&  (item.metadata.creator != item.metadata.title) ? item.metadata.creator : '');
        //ARCHIVE-BROWSER note the elements below were converted to HTML 3 times in original version
        //TODO-DETAILS on prelinger, banner description is getting truncated.
        return (
            <div className="welcome container container-ia width-max" style={{'backgroundColor':'white'}}>
                <div className="container">
                    <div className="row">
                        <div className="col-xs-11 col-sm-10 welcome-left">
                            <div id="file-dropper-wrap">
                                <div id="file-dropper"></div>
                                <img id="file-dropper-img" className="img-responsive" style={{'maxWidth':350, margin:'0 10px 5px 0'}} src={'https://archive.org/services/img/'+this.id}/>
                            </div>
                            <h1>{item.metadata.title}</h1>
                            <h4>{creator}</h4>
                            <div id="descript" style={{'maxHeight':43, cursor:'pointer'}}>
                                {item.metadata.description}
                            </div>
                        </div>
                        <div className="col-xs-1 col-sm-2 welcome-right">
                            xxx
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
class Home extends Search {
    constructor(itemid, item) {
        const NOT = ['what_cd','cd','vinyl','librarygenesis','bibalex',  // per alexis
            'movies','audio','texts','software','image','data','web', // per alexis/tracey
            'additional_collections','animationandcartoons','artsandmusicvideos','audio_bookspoetry',
            'audio_foreign','audio_music','audio_news','audio_podcast','audio_religion','audio_tech',
            'computersandtechvideos','coverartarchive','culturalandacademicfilms','ephemera',
            'gamevideos','inlibrary','moviesandfilms','newsandpublicaffairs','ourmedia',
            'radioprograms','samples_only','spiritualityandreligion','stream_only',
            'television','test_collection','usgovfilms','vlogs','youth_media'];

        const query = 'mediatype:collection AND NOT noindex:true AND NOT collection:web AND NOT identifier:fav-* AND NOT identifier:' +
            NOT.join(' AND NOT identifier:');
        super({
            query:  query,
            sort:   '-downloads',
        });
        this.item = item;
        this.itemid = itemid;
    }
    banner() {
        return (
            <center style={{margin: "35px"}}><span style={{fontSize: "125px"}} className="iconochive-logo"></span></center>
        );
    }
}