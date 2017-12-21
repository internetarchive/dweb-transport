require('babel-core/register')({presets: ['env', 'react']}); // ES6 JS below!

//import React from 'react';
import React from './ReactFake';    // Note React is used by the JSX compiler that handles the HTML below this fakes the React.createElement


export default class {
    static number_format(nStr)//xxx this is just addCommas now
    {
        //http://www.mredkj.com/javascript/numberFormat.html
        nStr += '';

        let x = nStr.split('.');
        let x1 = x[0];
        let x2 = x.length > 1 ? '.' + x[1] : '';
        let rgx = /(\d+)(\d{3})/;
        while (rgx.test(x1))
            x1 = x1.replace(rgx, '$1' + ',' + '$2');
        return x1 + x2;
    }

    static glyph({name = 'question', classes = ''} = {}) {
        return (
            <span className={classes}>
                <span className={'iconochive-'+name} aria-hidden="true"></span>
                <span className="sr-only">{name}</span>
            </span>
        );
    }

    // pass in a <mediatype> value
    static mediatype_icon(mediatype) {
        const ICONS = {
            "audio": "audio",
            "collection": "collection",
            "etree": "etree",
            "image": "image",
            "data": "data",
            "movies": "movies",
            "movingimage": "movies",
            "other": "question",
            "software": "software",
            "sound": "audio",
            "stillimages": "image",
            "text": "texts",
            "texts": "texts",
            "tv": "tv",
            "unknown": "question",
            "video": "movies",
            "search": "search",
            "forum": "comments",
            "web": "web",
            "article": "article",
            "account": "person",
            "quote": "quote",
            "ad": "tv-commercial"
        };

        let icon = ICONS[mediatype];
        if (!icon)
            icon = 'question';

        return this.glyph({name: icon});
    }

    static natcompare(a, b) {
        return natcompare(a, b);
    }

    static AJS_on_dom_loaded() {
        /*
        This function is copied from archive.min.js because
        a) its run there on DOMLoaded, which is before we've got anything on the page
        b) Its anonymous in archive.min.js so can't call it
         */
        // Use this global hack, by adding class 'accessible-link' to any mouse-only element div/img
        // Note AJS is defined in archive_min.js
        AJS.makeMouseElementAccessible('.accessible-link');


        AJS.setUpActionTracking(); // Must be before other form submit handlers are assigned
        AJS.setupPopupLink();
        AJS.nav_tophat_setup();
        AJS.nav_tophat_wb_setup();
        AJS.setUpCreativeCommonsLicenseLink();
        AJS.setUpSearchForms();

        /* global  archive_setup */
        if (typeof archive_setup !== 'undefined') {
            // when DOM loaded/stable, do some setup
            $(() => {
                for (const fn of archive_setup)
                    fn()
            })
        }

        AJS.footer();
    }

    static async fetch_json(url) {
        /*
        url:   to be fetched - construct CORS safe JSON enquiry.
        throws: TypeError if cant fetch
        throws: Error if fetch doesnt return JSON.
        resolves to: Decoded json response
         */
        let response = await fetch(new Request(url, // Throws TypeError on failed fetch
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
                return await response.json(); // response.json is a promise resolving to JSON already parsed
            } else {
                let t = response.text(); // promise resolving to text
                throw new Error(`Unable to fetch, return was not JSON - got: ${response.headers.get('Content-Type')} ${t}`);
            }
        }   // TODO-HTTP may need to handle binary as a buffer instead of text if build binary version of this.

    }
}

/* === Configuration info ==== */
Util.`` = {
    JPEG: "image/jpeg",
    PNG: "image/png"
}    //TODO expand to other formats @IA

// minified FROM http://sourcefrog.net/projects/natsort/natcompare.js
function isWhitespaceChar(B){var A;A=B.charCodeAt(0);if(A<=32){return true;}else{return false;}}function isDigitChar(B){var A;A=B.charCodeAt(0);if(A>=48&&A<=57){return true;}else{return false;}}function compareRight(E,B){var G=0;var F=0;var D=0;var C;var A;for(;;F++,D++){C=E.charAt(F);A=B.charAt(D);if(!isDigitChar(C)&&!isDigitChar(A)){return G;}else{if(!isDigitChar(C)){return -1;}else{if(!isDigitChar(A)){return +1;}else{if(C<A){if(G==0){G=-1;}}else{if(C>A){if(G==0){G=+1;}}else{if(C==0&&A==0){return G;}}}}}}}}function natcompare(I,H){var C=0,A=0;var D=0,B=0;var F,E;var G;while(true){D=B=0;F=I.charAt(C);E=H.charAt(A);while(isWhitespaceChar(F)||F=="0"){if(F=="0"){D++;}else{D=0;}F=I.charAt(++C);}while(isWhitespaceChar(E)||E=="0"){if(E=="0"){B++;}else{B=0;}E=H.charAt(++A);}if(isDigitChar(F)&&isDigitChar(E)){if((G=compareRight(I.substring(C),H.substring(A)))!=0){return G;}}if(F==0&&E==0){return D-B;}if(F<E){return -1;}else{if(F>E){return +1;}}++C;++A;}};
