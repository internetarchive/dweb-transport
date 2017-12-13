require('babel-core/register')({ presets: ['es2015', 'react']}); // ES6 JS below!
import React from './ReactFake';

import Details from './Details'

export default class Image extends Details {
    //TODO-DETAILS this is the new approach to embedding a mediatype - to gradually replace inline way in this file.
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
        let mainfile = item.files.find((fi) => ['JPEG','PNG'].includes(fi.format)); //TODO-DETAILS-IMAGE probably add other formats
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
