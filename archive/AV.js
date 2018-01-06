require('babel-core/register')({ presets: ['env', 'react']}); // ES6 JS below!
import React from './ReactFake';
import Util from "./Util";

import Details from './Details';
import RenderMedia from 'render-media';
import throttle from 'throttleit'
import prettierBytes from 'prettier-bytes'

export default class AV extends Details {
    constructor(itemid, item) {
        super(itemid, item);
        this.itemtype="http://schema.org/VideoObject";
    }
    archive_setup_push() {
        let self = this;
        super.archive_setup_push(); // On commute.html the Play came after the parts common to AV, Image and Text
        // archive_setup.push(function() { //TODO-ARCHIVE_SETUP move Play from browserAfter to here
        //    Play('jw6', self.playlist, self.cfg);
        // });

        const name = this.playlist[0].name;
        const urls = [this.playlist[0].url];

        var file = {
            name: name,
            createReadStream: function (opts) {
                // Return a readable stream that provides the bytes between offsets "start"
                // and "end" inclusive. This works just like fs.createReadStream(opts) from
                // the node.js "fs" module.

                return Dweb.Transports.createReadStream(urls, opts)
            }
        }

        RenderMedia.append(file, '#videoContainer');

        // TODO: port this to JSX
        if (window.WEBTORRENT_TORRENT) {
            const torrent = window.WEBTORRENT_TORRENT
            const $webtorrentStats = document.querySelector('#webtorrentStats')

            const updateSpeed = () => {
                var progress = (100 * torrent.progress).toFixed(1)

                const html =
                    '<b>Peers:</b> ' + torrent.numPeers + ' ' +
                    '<b>Progress:</b> ' + progress + '% ' +
                    '<b>Download speed:</b> ' + prettierBytes(torrent.downloadSpeed) + '/s ' +
                    '<b>Upload speed:</b> ' + prettierBytes(torrent.uploadSpeed) + '/s'

                $webtorrentStats.innerHTML = html
            }

            torrent.on('download', throttle(updateSpeed, 250))
            torrent.on('upload', throttle(updateSpeed, 250))
            setInterval(updateSpeed, 1000)
            updateSpeed()
          }
    }

    theatreIaWrap() {
        let item = this.item;
        let itemid = this.itemid;
        let detailsurl = `https://archive.org/details/${itemid}`
        let title = item.title
        //let cfg  = {"aspectratio": 4/3 }; // Old version in Traceys code which was missign other parts of cfg below
        //TODO-ARCHIVE not that Tracey code has cfg.aspectration = 4/3 and none of the material below which appears in its archive.org/details page
        let cfg =    {"start":0,"embed":null,"so":false,"autoplay":false,"width":0,"height":0,"list_height":0,"audio":false,
            "responsive":true,"flash":false, "hide_list":true,
            "identifier": this.itemid, //TODO-DETAILS-ONLINE check another example and see if identifier should be itemid or title
            "collection": this.item.metadata.collection[0],
        };

        //TODO this code is from details/commute.html - bears little resemblance to that in Tracey's code
        /*
        [{"title":"commute","orig":"commute.avi","image":"/download/commute/commute.thumbs%2Fcommute_000005.jpg",
            "duration":"115.61",
            "sources":[
                {"file":"/download/commute/commute.mp4","type":"mp4","height":"480", "width":"640","label":"480p"},
                {"file":"/download/commute/commute.ogv","type":"ogg","height":"304","width":"400","label":"304p"}],
            "tracks":[{"file":"https://archive.org/stream/commute/commute.thumbs/commute_000005.jpg&vtt=vtt.vtt","kind":"thumbnails"}]}],
        */
        this.playlist=[];
        //TODO-DETAILS put these formats in a list in Utils.config
        let avs = item.files.filter(fi => (fi.format=='h.264' || fi.format=='512Kb MPEG4'));    //TODO-DETAILS-LIST Maybe use _list instead of .files
        if (!avs.length)
            avs = item.files.filter(fi => fi.format=='VBR MP3'); //TODO-DETAILS-LIST Maybe use _list instead of .files

        if (avs.length) {
            avs.sort((a, b) => Util.natcompare(a.name, b.name));   //Unsure why sorting names, presumably tracks are named alphabetically ?

            const name = avs[0].name
            const url = item.metadata.magnetlink + '/' + name

            this.playlist.push({ name, url })

            // reduce array down to array of just filenames
            //avs = avs.map(val => val.name);

            // TODO-DETAULS note these playlists dont match the code in details/commute.html
            // for (var fi of avs) //TODO-DETAILS make this a map (note its tougher than it looks!)
            //     this.playlist.push({
            //         title:(fi.title ? fi.title : fi.name),
            //         sources:[{file:'https://archive.org/download/'+itemid+'/'+fi.name}]});
            // this.playlist[0].image = 'https://archive.org/services/img/' + itemid;
        }
        //TODO-DETAILS make next few lines between theatre-ia-wrap and theatre-ia not commute specific
        return (
            <div id="theatre-ia-wrap" class="container container-ia width-max ">
                <link itemprop="url" href={detailsurl}/>
                {/*-- TODO make commute specific - look for somewhere else it builds itemprop
                <link itemprop="thumbnailUrl" href="https://archive.org/download/commute/commute.thumbs/commute_000005.jpg">
                <link itemprop="contentUrl" href="https://archive.org/download/commute/commute.mp4">
                <link itemprop="embedUrl" href="https://archive.org/embed/commute/commute.avi">
                 <meta itemprop="duration" content="PT0M115S">
                 --*/}
                <h1 class="sr-only">{title}</h1>
                <h2 class="sr-only">Movies Preview</h2>

                <div id="theatre-ia" class="container">
                    <div class="row">
                        <div class="xs-col-12">

                            <div id="theatre-controls">
                                <a href="#" id="gofullscreen" onclick="">
                                    <div data-toggle="tooltip" data-container="body" data-placement="left" class="iconochive-fullscreen"
                                         title="fullscreen view"></div>
                                </a>
                                <a href="#" onclick="return AJS.flash_click(0)">
                                    <div data-toggle="tooltip" data-container="body" data-placement="left" class="iconochive-flash"
                                         title="Click to have player try flash first, then HTML5 second"></div>
                                </a>
                                <a href="#" onclick="return AJS.mute_click()">
                                    <div data-toggle="tooltip" data-container="body" data-placement="left" class="iconochive-unmute"
                                         title="sound is on.  click to mute sound."></div>
                                </a>
                                <a href="#" onclick="return AJS.mute_click()">
                                    <div data-toggle="tooltip" data-container="body" data-placement="left" class="iconochive-mute"
                                         style="display:none" title="sound is off.  click for sound."></div>
                                </a>
                            </div>{/*--/#theatre-controls--*/}
                            <noscript>
                                <div class="alert alert-danger alert-dismissable" data-dismiss="alert">
                                    <button type="button" class="close" data-dismiss="alert" aria-hidden="true"><span
                                            class="iconochive-remove-circle" aria-hidden="true"></span><span class="sr-only">remove-circle</span>
                                    </button>
                                    Internet Archive&apos;s in-browser
                                    video player requires JavaScript to be enabled.
                                    It appears your browser does not have it turned on.
                                    Please see your browser settings for this feature.
                                </div>
                            </noscript>

                            <div id="videoContainer" style="text-align: center;"></div>
                            <div id="webtorrentStats" style="color: white; text-align: center;"></div>
                            {this.cherModal("video")}
                        </div> {/*--/.xs-col-12--*/}
                    </div>{/*--/.row--*/}
                </div>
                <div id="flag-overlay" class="center-area ">
                </div>
            {/*--//.container-ia--*/}</div>
        );
    }
}
