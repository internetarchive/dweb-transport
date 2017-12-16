require('babel-core/register')({ presets: ['es2015', 'react']}); // ES6 JS below!
import React from './ReactFake';

import Details from './Details'

export default class Texts extends Details {
    constructor(itemid, item) {
        super(itemid);
        this.item = item;
    }
    jsxInNav(onbrowser) {
        //TODO-DETAILS Description does not appear in this Navwrap section, its in the stuff underneath that which is not yet on a page.
        let item = this.item;
        let metadata = item.metadata;
        let detailsURL = `https://archive.org/details/${this.id}`;
        let imageURL = `https://archive.org/services/img/${this.id}`;
        //TODO-DETAILS-DWEB use alternative URLS via IPFS
        //TODO-STREAM pass as stream
        let streamURL = `https://archive.org/stream/${this.id}`; //{1992.Zandvoorts.Nieuwsblad}`; //TODO-TEXTS Cant find 2nd part of URL
        //let streamURL = `https://archive.org/stream/${this.id}/1992.Zandvoorts.Nieuwsblad`;   // In archive.org but needs looking for this string in file names
        //let iframeURL = `${streamURL}?ui=embed#mode/2up`;   //This comes from Traceys code and works
        let iframeURL = `${streamURL}?ui=embed`;   //This works and matches archive.org
        let shortEmbedURL = `https://archive.org/stream/${this.id}?ui=embed`;    //Note on archive.org/details this is different from iframeURL and not clear if that is intentional
        let helpURL = `https://archive.org/help/audio.php?identifier=${this.id}`;
        //TODO check if its Twitter share title= as on text page, or data-original-title as on image page
        //TODO maybe merge sharing section with Image.js which is identical (first div under cher-body
        return (
            <div id="theatre-ia-wrap" class="container container-ia width-max ">
                <link itemprop="url" href={detailsURL}/>

                <link itemprop="image" href={imageURL}/>


                <h1 class="sr-only">{metadata.title}</h1>
                <h2 class="sr-only">Item Preview</h2>

                <div id="theatre-ia" class="container">
                    <div class="row">
                        <div class="xs-col-12">

                            <div id="theatre-controls">
                                <a href={streamURL}>
                                    <div title="fullscreen view" data-toggle="tooltip" data-container="body" data-placement="left"
                                         class="iconochive-fullscreen"></div>
                                </a>
                                <a href={streamURL}>
                                    <div title="search inside" data-toggle="tooltip" data-container="body" data-placement="left"
                                         class="iconochive-search"></div>
                                </a>
                            </div>{/*#theatre-controls*/}


                            <div id="texty" style="font-size:0px" class="">
                                <iframe src={iframeURL}
                                        width="100%" height="480" frameborder="0" webkitallowfullscreen="true"
                                        mozallowfullscreen="true" allowfullscreen></iframe>
                            </div>
                            {this.cherModal("audio", onbrowser)}
                            <center style="color:white;margin-bottom:10px">
                            </center>
                        </div>{/*/.xs-col-12*/}
                    </div>{/*/.row*/}

                </div>{/*//#theatre-ia*/}
                <div id="flag-overlay" class="center-area ">
            </div>
            </div>
            );

    }
}
