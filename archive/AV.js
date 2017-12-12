require('babel-core/register')({ presets: ['es2015', 'react']}); // ES6 JS below!
import React from './ReactFake';
import Util from "./Util";

import Details from './Details'

export default class AV extends Details {
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
