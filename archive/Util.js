require('babel-core/register')({ presets: ['es2015', 'react']}); // ES6 JS below!

import React from 'react';


export default class {
  static number_format(nStr)//xxx this is just addCommas now
  {
    //http://www.mredkj.com/javascript/numberFormat.html
    nStr+='';

    var x=nStr.split('.');
    var x1=x[0];
    var x2=x.length>1?'.'+x[1]:'';
    var rgx=/(\d+)(\d{3})/;
    while (rgx.test(x1))
      x1=x1.replace(rgx,'$1'+','+'$2');
    return x1+x2;
  }

  static glyph({name='question', classes=''}={}){
    return (
      <span className={classes}><span className={'iconochive-'+name} aria-hidden="true"></span><span className="sr-only">{name}</span></span>
    );
  }

  // pass in a <mediatype> value
  static mediatype_icon(mediatype){
    const ICONS = {
      "audio"        :"audio",
      "collection"   :"collection",
      "etree"        :"etree",
      "image"        :"image",
      "data"         :"data",
      "movies"       :"movies",
      "movingimage"  :"movies",
      "other"        :"question",
      "software"     :"software",
      "sound"        :"audio",
      "stillimages"  :"image",
      "text"         :"texts",
      "texts"        :"texts",
      "tv"           :"tv",
      "unknown"      :"question",
      "video"        :"movies",
      "search"       :"search",
      "forum"        :"comments",
      "web"          :"web",
      "article"      :"article",
      "account"      :"person",
      "quote"        :"quote",
      "ad"           :"tv-commercial"
    };

    var icon = ICONS[mediatype];
    if (!icon)
      icon = 'question';

    return this.glyph({name:icon});
  }

  static natcompare(a,b){
    return natcompare(a,b);
  }
}


// minified FROM http://sourcefrog.net/projects/natsort/natcompare.js
function isWhitespaceChar(B){var A;A=B.charCodeAt(0);if(A<=32){return true;}else{return false;}}function isDigitChar(B){var A;A=B.charCodeAt(0);if(A>=48&&A<=57){return true;}else{return false;}}function compareRight(E,B){var G=0;var F=0;var D=0;var C;var A;for(;;F++,D++){C=E.charAt(F);A=B.charAt(D);if(!isDigitChar(C)&&!isDigitChar(A)){return G;}else{if(!isDigitChar(C)){return -1;}else{if(!isDigitChar(A)){return +1;}else{if(C<A){if(G==0){G=-1;}}else{if(C>A){if(G==0){G=+1;}}else{if(C==0&&A==0){return G;}}}}}}}}function natcompare(I,H){var C=0,A=0;var D=0,B=0;var F,E;var G;while(true){D=B=0;F=I.charAt(C);E=H.charAt(A);while(isWhitespaceChar(F)||F=="0"){if(F=="0"){D++;}else{D=0;}F=I.charAt(++C);}while(isWhitespaceChar(E)||E=="0"){if(E=="0"){B++;}else{B=0;}E=H.charAt(++A);}if(isDigitChar(F)&&isDigitChar(E)){if((G=compareRight(I.substring(C),H.substring(A)))!=0){return G;}}if(F==0&&E==0){return D-B;}if(F<E){return -1;}else{if(F>E){return +1;}}++C;++A;}};
