
require('babel-core/register')({ presets: ['es2015', 'react']}); // ES6 JS below!

//import http from 'http';
//import async from 'async';
//import React from 'react';
import React from './ReactFake';
//Not needed on client - kept so script can run in both cases
//import ReactDOMServer from 'react-dom/server';
//Next line is for client, not needed on server but doesnt hurt
//import ReactDOM from 'react-dom';

import Nav from './Nav';
import Util from './Util';
import Search from './Search';

export default class Details {
  constructor(id, {}={}) {
      this.id = id;
  }
  async fetch() { // Note almost identical to code on Search.fetch()
      //TODO-DETAILS-FETCH add trap of error here
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
                  case "audio": // Intentionally drop thru to movies
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
        Util.AJS_on_dom_loaded(); // Runs code pushed archive_setup - needed for image
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
                                <img id="file-dropper-img" className="img-responsive" style={{'maxWidth':"350px", margin:'0 10px 5px 0'}} src={'https://archive.org/services/img/'+this.id}/>
                            </div>
                            <h1>{item.metadata.title}</h1>
                            <h4>{creator}</h4>
                            <div id="descript" style={{maxHeight:"43px", cursor:'pointer'}}>
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

class Image extends Details {
    //TODO-DETAILS this is the new approach to embedding a mediatype - to gradually replace inline way in this file.
    //TODO-REFACTOR merge this into the template_image.js file
    constructor(itemid, item) {
        super(itemid);
        this.item = item;
    }

    browserAfter() {
        archive_setup.push(function () {    //TODO-DETAILS check this isn't being left on archive_setup for next image etc
            AJS.theatresize();
            AJS.carouselsize('#ia-carousel', true);
        });
        super.browserAfter()
    }
    jsxInNav(onbrowser) {
        let item = this.item;
        let itemid = item.metadata.identifier; // Shortcut as used a lot
        let mainfile = item.files.find((fi) => ['JPEG'].includes(fi.format)); //TODO-DETAILS-IMAGE probably add other formats
        let detailsurl = `https://archive.org/details/${itemid}`; //TODO-DETAILS-DWEB will move to this decentralized page, but check usages (like tweet) below
        let embedurl = `https://archive.org/embed/${itemid}`;
        return (
            <div id="theatre-ia-wrap" className="container container-ia width-max  resized" style={{height: "600px"}}>
                <link itemProp="url" href={detailsurl}/>

                <link itemProp="thumbnailUrl" href="https://archive.org/services/img/{itemid}"/>{/*TODO is there a better thumbnail*/}

                { item.files.filter((fi)=> fi.source !== "metadata").map((fi) => (
                    <link itemProp="associatedMedia" href={`https://archive.org/download/${itemid}/${fi.name}`} key={`${itemid}/${fi.name}`}/>
                )) }

                <h1 className="sr-only">{item.metadata.title}</h1>
                <h2 className="sr-only">Item Preview</h2>

                <div id="theatre-ia" className="container">
                    <div className="row">
                        <div className="xs-col-12">

                            <div id="theatre-controls">
                            </div> {/*#theatre-controls*/}

                { mainfile ? (
                            <div className="details-carousel-wrapper">
                                <section id="ia-carousel" className="carousel slide" data-ride="carousel" data-interval="false"
                                         aria-label="Item image slideshow" style={{maxHeight: "600px"}}>
                                    <ol className="carousel-indicators" style={{display:"none"}}>
                                        <li data-target="#ia-carousel" data-slide-to="0" className=" active" role="button" tabIndex="0"
                                            aria-label="Go to image 1"></li>
                                    </ol>

                                    <div className="carousel-inner">
                                        <div className="item active">
                                            <a className="carousel-image-wrapper"
                                               href={`http://archive.org/download/${itemid}/${mainfile.name}`}
                                               title="Open full sized image">
                                                <img className="rot0 carousel-image" alt="item image #1"
                                                     src={`http://archive.org/download/${itemid}/${mainfile.name}`}/> {/*Note archive.org details page erroneously doesnt close this tag*/}
                                            </a>
                                            <div className="carousel-caption">
                                                {mainfile.name}
                                            </div>
                                        </div>
                                    </div>

                                </section>

                            </div>
                ) : (
                            <div className="row" style={{color:"white"}}>
                                <div className="col-md-10 col-md-offset-1 no-preview">
                                    <p className="theatre-title">There Is No Preview Available For This Item</p>
                                    <p>
                                        This item does not appear to have any files that can be experienced on Archive.org
                                        <br/><span className="hidden-xs hidden-sm">Please download files in this item to interact with them on your computer.</span><br/>
                                        <a className="show-all" href={`https://archive.org/download/${itemid}`} target="_blank">Show all files</a>{/*TODO-DETAILS-FILE should handle download of collection*/}
                                    </p>
                                </div>
                            </div>
                ) }
                            {/* Script tags moved into the JS*/}
                            <div id="cher-modal" className="modal fade" role="dialog" aria-hidden="true">
                                <div className="modal-dialog modal-lg">
                                    <div className="modal-content" style={{padding: "10px"}}>

                                        <div className="modal-header">
                                            <button type="button" className="close" data-dismiss="modal" aria-hidden="true"><span
                                                    className="iconochive-remove-circle" aria-hidden="true"></span><span
                                                    className="sr-only">remove-circle</span></button>
                                            <h3 className="modal-title">Share or Embed This Item</h3>
                                        </div>{/*.modal-header*/}
                                        <div id="cher-body">
                                            <div style={{textAlign: "center", margin: "50px auto"}}>
                                                <div className="topinblock">
                                                    <div id="sharer">
                                                        <a href={`https://twitter.com/intent/tweet?url=${detailsurl};via=internetarchive&amp;text=${item.metadata.title}+%3A+${item.metadata.creator}+%3A+Free+Download+%26+Streaming+%3A+Internet+Archive`}
                                                           target="_blank">
                                                            <div className="sharee iconochive-twitter" data-toggle="tooltip"
                                                                 data-placement="bottom" title=""
                                                                 data-original-title="Share to Twitter"></div>
                                                        </a>
                                                        <a href={`https://www.facebook.com/sharer/sharer.php?u=${detailsurl}`}
                                                           target="_blank">
                                                            <div className="sharee iconochive-facebook" data-toggle="tooltip"
                                                                 data-placement="bottom" title=""
                                                                 data-original-title="Share to Facebook"></div>
                                                        </a>
                                                        <a href={`https://plus.google.com/share?url=${detailsurl}`}
                                                           target="_blank">
                                                            <div className="sharee iconochive-googleplus" data-toggle="tooltip"
                                                                 data-placement="bottom" title=""
                                                                 data-original-title="Share to Google+"></div>
                                                        </a>
                                                        <a href={`http://www.reddit.com/submit?url=${detailsurl};title=${item.metadata.title}+%3A+${item.metadata.creator}+%3A+Free+Download+%26amp%3B+Streaming+%3A+Internet+Archive`}
                                                           target="_blank">
                                                            <div className="sharee iconochive-reddit" data-toggle="tooltip"
                                                                 data-placement="bottom" title=""
                                                                 data-original-title="Share to Reddit"></div>
                                                        </a>
                                                        {/*This next one looks wrong, the URL is missing TODO-DETAILS-IMAGE try a different example */}
                                                        <a href={`https://www.tumblr.com/share/video?embed=%3Ciframe+width%3D%22640%22+height%3D%22480%22+frameborder%3D%220%22+allowfullscreen+src%3D%22https%3A%2F%2Farchive.org%2Fembed%2F%22+webkitallowfullscreen%3D%22true%22+mozallowfullscreen%3D%22true%22%26gt%3B%26lt%3B%2Fiframe%3E&;name=${item.metadata.title}+%3A+${item.metadata.creator}+%3A+Free+Download+%26amp%3B+Streaming+%3A+Internet+Archive`}
                                                           target="_blank">
                                                            <div className="sharee iconochive-tumblr" data-toggle="tooltip"
                                                                 data-placement="bottom" title=""
                                                                 data-original-title="Share to Tumblr"></div>
                                                        </a>
                                                        <a href={`http://www.pinterest.com/pin/create/button/?url=${detailsurl}&;description=${item.metadata.title}+%3A+${item.metadata.creator}+%3A+Free+Download+%26amp%3B+Streaming+%3A+Internet+Archive`}
                                                           target="_blank">
                                                            <div className="sharee iconochive-pinterest" data-toggle="tooltip"
                                                                 data-placement="bottom" title=""
                                                                 data-original-title="Share to Pinterest"></div>
                                                        </a>
                                                        <a href={`mailto:?body=${detailsurl}&;subject=${item.metadata.title} : ${item.metadata.creator} : Free Download &amp; Streaming : Internet Archive`}>
                                                            <div className="sharee iconochive-email" data-toggle="tooltip"
                                                                 data-placement="bottom" title=""
                                                                 data-original-title="Share via email"></div>
                                                        </a>
                                                    </div>
                                                    <br clear="all" className="clearfix"/>
                                                </div>
                                            </div>
                                            <div>
                                                <form className="form" role="form">
                                                    <div className="form-group">
                                                        <label>EMBED</label>
                                                        <textarea id="embedcodehere" className="form-control textarea-invert-readonly"
                                                                  rows="3" readOnly="readonly"><iframe src={embedurl} width="560" height="384" frameborder="0" webkitallowfullscreen="true" mozallowfullscreen="true" allowfullscreen></iframe></textarea>
                                                    </div>
                                                </form>
                                            </div>
                                            <div>
                                                <form className="form" role="form">
                                                    <div className="form-group">
                                                        <label>EMBED (for wordpress.com hosted blogs)</label>
                                                        <textarea id="embedcodehereWP" className="form-control textarea-invert-readonly"
                                                                  rows="3" readOnly="readonly">{`[archiveorg ${itemid} width=560 height=384 frameborder=0 webkitallowfullscreen=true mozallowfullscreen=true]`}</textarea>
                                                    </div>
                                                </form>
                                            </div>
                                            <div>
                                                Want more?
                                                <a href={`https://archive.org/help/audio.php?identifier=${itemid}`}>Advanced
                                                    embedding details, examples, and help</a>!
                                            </div>
                                        </div>{/*--/#cher-body*/}
                                    </div>{/*--/.modal-content*/}
                                </div>{/*--/.modal-dialog*/}
                            </div>{/*--/#cher-modal*/}

                        </div>{/*--/.xs-col-12*/}
                    </div>{/*--/.row*/}

                </div>{/*--#theatre-ia*/}
                <div id="flag-overlay" className="center-area ">
                </div>
            </div>
            )
    };

}
