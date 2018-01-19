require('babel-core/register')({ presets: ['env', 'react']}); // ES6 JS below!
import React from './ReactFake';
import Search from "./Search";

export default class Collection extends Search {
    constructor(itemid, item) {
        super({
            query:  'collection:'+itemid,
            sort:   '-downloads',
            itemid: itemid,
            item:   item,
        });
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
                                <img id="file-dropper-img" className="img-responsive" style={{'maxWidth':"350px", margin:'0 10px 5px 0'}} src={imgurl}/>
                            </div>
                            <h1>{item.metadata.title}</h1>
                            <h4>{creator}</h4>
                            <div id="descript" style={{maxHeight:"43px", cursor:'pointer'}} dangerouslySetInnerHTML={{__html: item.metadata.description}}>
                            </div>
                        </div>
                        <div className="col-xs-1 col-sm-2 welcome-right">
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    browserBefore() {
        $('body').addClass('bgEEE');
        // Note the archive_setup.push stuff is subtly different from that for 'search'
        archive_setup.push(function(){ //TODO-DETAILS check not pushing on top of existing (it probably is)
            AJS.lists_v_tiles_setup('collection');
            $('div.ikind').css({visibility:'visible'});
            AJS.popState('');
            AJS.tiler();
            $(window).on('resize  orientationchange', function(evt){
                clearTimeout(AJS.tiles_wrap_throttler)
                AJS.tiles_wrap_throttler = setTimeout(AJS.tiler, 250)
            });
            // register for scroll updates (for infinite search results)
            $(window).scroll(AJS.scrolled);
        });

    }

}
