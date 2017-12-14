require('babel-core/register')({presets: ['es2015', 'react']}); // ES6 JS below!
import React from './ReactFake';
//Not needed on client - kept so script can run in both cases
//import ReactDOMServer from 'react-dom/server';
//Next line is for client, not needed on server but doesnt hurt
//import ReactDOM from 'react-dom';

import Util from './Util';
import ArchiveBase from './ArchiveBase'

export default class Details extends ArchiveBase {
    constructor(id, {} = {}) {
        super(id);
    }

    async fetch() {
        /* Fetch JSON by talking to Metadata API
            this.id Archive Item identifier
            throws: TypeError or Error if fails
            resolves to: this
         */
        console.log('get metadata for ' + this.id);
        this.item = await Util.fetch_json(`https://archive.org/metadata/${this.id}`);
        return this; // For chaining, but note will need to do an "await fetch"
    }
    sharing(onbrowser) {
        //Common text across Image and Text and possibly other subclasses
        let item = this.item;
        let itemid = item.metadata.identifier; // Shortcut as used a lot
        let metadata = item.metadata; // Shortcut as used a lot
        let detailsURL = `https://archive.org/details/${itemid}`; //TODO-DETAILS-DWEB will move to this decentralized page, but check usages (like tweet) below
        let sharingText =   `${metadata.title} : ${metadata.creator}`; //String used
        let sharingTextUriEncoded = encodeURIComponent(sharingText);

        return (
            <div style={{textAlign: "center", margin: "50px auto"}}>
                <div className="topinblock">
                    <div id="sharer">
                        <a href={`https://twitter.com/intent/tweet?url=${detailsURL}&amp;via=internetarchive&amp;text=${sharingTextUriEncoded}+%3A+${metadata.creator}+%3A+Free+Download+%26+Streaming+%3A+Internet+Archive`}
                           target="_blank">
                            <div className="sharee iconochive-twitter" data-toggle="tooltip"
                                 data-placement="bottom" title=""
                                 data-original-title="Share to Twitter"></div>
                        </a>
                        <a href={`https://www.facebook.com/sharer/sharer.php?u=${detailsURL}`}
                           target="_blank">
                            <div className="sharee iconochive-facebook" data-toggle="tooltip"
                                 data-placement="bottom" title=""
                                 data-original-title="Share to Facebook"></div>
                        </a>
                        <a href={`https://plus.google.com/share?url=${detailsURL}`}
                           target="_blank">
                            <div className="sharee iconochive-googleplus" data-toggle="tooltip"
                                 data-placement="bottom" title=""
                                 data-original-title="Share to Google+"></div>
                        </a>
                        <a href={`http://www.reddit.com/submit?url=${detailsURL}&amp;title=${sharingTextUriEncoded}+%3A+${metadata.creator}+%3A+Free+Download+%26amp%3B+Streaming+%3A+Internet+Archive`}
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
                        <a href={`http://www.pinterest.com/pin/create/button/?url=${detailsURL}&amp;description=${sharingTextUriEncoded}+%3A+${metadata.creator}+%3A+Free+Download+%26amp%3B+Streaming+%3A+Internet+Archive`}
                           target="_blank">
                            <div className="sharee iconochive-pinterest" data-toggle="tooltip"
                                 data-placement="bottom" title=""
                                 data-original-title="Share to Pinterest"></div>
                        </a>
                        <a href={`mailto:?body=${detailsURL}&amp;subject=${sharingText} : ${metadata.creator} : Free Download &amp; Streaming : Internet Archive`}>
                            <div className="sharee iconochive-email" data-toggle="tooltip"
                                 data-placement="bottom" title=""
                                 data-original-title="Share via email"></div>
                        </a>
                    </div>
                    <br clear="all" className="clearfix"/>
                </div>
            </div>

        );
    }

}

