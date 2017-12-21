require('babel-core/register')({ presets: ['env', 'react']}); // ES6 JS below!
import React from './ReactFake';

import Details from './Details'
import ArchiveFile from './ArchiveFile'

export default class Image extends Details {
    //TODO-DETAILS this is the new approach to embedding a mediatype - to gradually replace inline way in this file.
    constructor(itemid, item) {
        /*
        Construct an Image object before rendering it to a HTML page
        item = metadata from a metadata fetch
         */
        super(itemid, item);
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
        //TODO-DETAILS replace find and other files references below with methods on ArchiveFile and mainfile with mainArchiveFile
        let mainfile = item.files.find((fi) => ['JPEG','PNG'].includes(fi.format)); //TODO-DETAILS-IMAGE probably add other formats
        let mainArchiveFile = this._list.find((fi) => ['JPEG','PNG'].includes(fi.metadata.format));
        let detailsURL = `https://archive.org/details/${itemid}`; //TODO-DETAILS-DWEB will move to this decentralized page, but check usages (like tweet) below
        let embedurl = `https://archive.org/embed/${itemid}`;
        //TODO-DETAILS check if flag-overlay should include description
        //TODO-DETAILS merge wordpress block into Details.js
        return (
            <div id="theatre-ia-wrap" className="container container-ia width-max  resized" style={{height: "600px"}}>
                <link itemProp="url" href={detailsURL}/>

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
                                                   {mainArchiveFile.loadImg(
                                                        <img className="rot0 carousel-image" alt="item image #1"/>
                                                    )} {/*Note archive.org details page erroneously doesnt close this tag*/}
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
                            {this.cherModal("audio", onbrowser)}
                        </div>{/*--/.xs-col-12*/}
                    </div>{/*--/.row*/}

                </div>{/*--#theatre-ia*/}
                <div id="flag-overlay" className="center-area ">
                </div>
            </div>
            )
    };

}
