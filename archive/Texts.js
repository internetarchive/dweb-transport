require('babel-core/register')({ presets: ['es2015', 'react']}); // ES6 JS below!
import React from './ReactFake';

import Details from './Details'

export default class Texts extends Details {
    constructor(itemid, item) {
        super(itemid);
        this.item = item;
    }
    jsxInNav(onbrowser) {
        //TODO-DETAILS redo this to use a template, note div outside iframe is just to keep JSX happy
        //TODO-DETAILS find if description used, doesnt appear in template unless its the last one in flag-overlay
        return (
            <div>
            <iframe width="100%" height="480" src={`https://archive.org/stream/${this.id}?ui=embed#mode/2up`}></iframe><br/>
        <div dangerouslySetInnerHTML={{__html: item.metadata.description}}></div> {/*TODO-DETAILS probably a security issue inherited from Tracys code as banner could contain user-generated html*/}
        </div>
       );
        let item = this.item;
        let metadata = item.metadata;
        let detailsURL = `https://archive.org/details/${this.id}`;
        let imageURL = `https://archive.org/services/img/${this.id}`;
        //TODO-DETAILS-DWEB use alternative uRLS
        //TODO-STREAM pass as stream
        let streamURL = `https://archive.org/stream/stream/${this.id}/{XXX1992.Zandvoorts.Nieuwsblad}` //TODO-TEXTS How to find this file
        let iframeURL = streamURL+"?ui=embed";
        let shortEmbedURL = `https://archive.org/stream/${this.id}?ui=embed`    //TODO note this is different from iframeURL and not clear if that is intentional
        let sharingText = "Zandvoortse kranten - Zandvoorts Nieuwsblad 1992 : Cor Draijer for Genootschap Oud Zandvoort"; //TODO-TEXTS How to find this string
        let sharingTextUrlEncoded = "Zandvoortse+kranten+-+Zandvoorts+Nieuwsblad+1992+%3A+Cor+Draijer+for+Genootschap+Oud+Zandvoort"; //TODO-TEXTS How to generate urlencoded
        let helpURL = `https://archive.org/help/audio.php?identifier=${this.id}`;
        //TODO check if its Twitter share title= as on text page, or data-original-title as on image page
        //TODO maybe merge sharing section with Image.js which is identical (first div under cher-body
        return (
            <div id="theatre-ia-wrap" class="container container-ia width-max ">
                <link itemprop="url" href={detailsURL}>

                <link itemprop="image" href={imageURL}>


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
                            </div><!--/#theatre-controls-->


                            <div id="texty" style="font-size:0px" class="">
                                <iframe src="{iframeURL}"
                                        width="100%" height="480" frameborder="0" webkitallowfullscreen="true"
                                        mozallowfullscreen="true" allowfullscreen></iframe>
                            </div>

                            <div id="cher-modal" class="modal fade" role="dialog" aria-hidden="true">
                                <div class="modal-dialog modal-lg">
                                    <div class="modal-content" style="padding:10px;">
                                        <div class="modal-header">
                                            <button type="button" class="close" data-dismiss="modal" aria-hidden="true"><span
                                                    class="iconochive-remove-circle" aria-hidden="true"></span><span
                                                    class="sr-only">remove-circle</span></button>
                                            <h3 class="modal-title">Share or Embed This Item</h3>
                                        </div><!--/.modal-header-->

                                        <div id="cher-body">
                                            <div style={{textAlign: "center", margin: "50px auto"}}>
                                                <div className="topinblock">
                                                    <div id="sharer">
                                                        <a href={`https://twitter.com/intent/tweet?url=${detailsURL}&amp;via=internetarchive&amp;text=${sharingTextUrlEncoded}+%3A+${item.metadata.creator}+%3A+Free+Download+%26+Streaming+%3A+Internet+Archive`}
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
                                                        <a href={`http://www.reddit.com/submit?url=${detailsURL}&amp;title=${sharingTextUrlEncoded}+%3A+${item.metadata.creator}+%3A+Free+Download+%26amp%3B+Streaming+%3A+Internet+Archive`}
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
                                                        <a href={`http://www.pinterest.com/pin/create/button/?url=${detailsURL}&amp;description=${sharingTextUrlEncoded}+%3A+${item.metadata.creator}+%3A+Free+Download+%26amp%3B+Streaming+%3A+Internet+Archive`}
                                                           target="_blank">
                                                            <div className="sharee iconochive-pinterest" data-toggle="tooltip"
                                                                 data-placement="bottom" title=""
                                                                 data-original-title="Share to Pinterest"></div>
                                                        </a>
                                                        <a href={`mailto:?body=${detailsURL}&amp;subject=${sharingText} : ${item.metadata.creator} : Free Download &amp; Streaming : Internet Archive`}>
                                                            <div className="sharee iconochive-email" data-toggle="tooltip"
                                                                 data-placement="bottom" title=""
                                                                 data-original-title="Share via email"></div>
                                                        </a>
                                                    </div>
                                                    <br clear="all" className="clearfix"/>
                                                </div>
                                            </div>
                                            <div>
                                                <form class="form" role="form">
                                                    <div class="form-group">
                                                        <label>EMBED</label>
                                                        <textarea id="embedcodehere" class="form-control textarea-invert-readonly"
                                                                  rows="3" readonly="readonly"><iframe
                                                                src={shortEmbedURL}
                                                                width="480" height="430" frameborder="0"
                                                                webkitallowfullscreen="true" mozallowfullscreen="true"
                                                                allowfullscreen></iframe></textarea>
                                                    </div>
                                                </form>
                                            </div>
                                            <div>
                                                <form class="form" role="form">
                                                    <div class="form-group">
                                                        <label>EMBED (for wordpress.com hosted blogs)</label>
                                                        <textarea id="embedcodehereWP" class="form-control textarea-invert-readonly"
                                                                  rows="3" readonly="readonly">[{this.id} width=560 height=384 frameborder=0 webkitallowfullscreen=true mozallowfullscreen=true]</textarea>
                                                    </div>
                                                </form>
                                            </div>
                                            <div>
                                                Want more?
                                                <a href={helpURL}>Advanced embedding details, examples, and help</a>!
                                            </div>
                                        </div><!--/#cher-body-->
                                    </div><!--/.modal-content-->
                                </div><!--/.modal-dialog-->
                            </div><!--/#cher-modal-->


                            <center style="color:white;margin-bottom:10px">
                            </center>
                        </div><!--/.xs-col-12-->
                    </div><!--/.row-->

                </div><!--//#theatre-ia-->
                <div id="flag-overlay" class="center-area ">
                </div>
            </div><!--//.container-ia-->
            );

    }
}
