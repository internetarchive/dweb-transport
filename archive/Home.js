
// top/home page!
require('babel-core/register')({ presets: ['es2015', 'react']}); // ES6 JS below!

import http from 'http';
import async from 'async';
import React from 'react';
//ARCHIVE-BROWSER doesnt appear to be needed on server (or browser)
// import ReactDOMServer from 'react-dom/server';


import Nav from './Nav';
import Search from './Search';

export default class {
  constructor(res, htm){ //TODO-DETAILS-FETCH make async Search
    var NOT = ['what_cd','cd','vinyl','librarygenesis','bibalex',  // per alexis
               'movies','audio','texts','software','image','data','web', // per alexis/tracey
               'additional_collections','animationandcartoons','artsandmusicvideos','audio_bookspoetry',
               'audio_foreign','audio_music','audio_news','audio_podcast','audio_religion','audio_tech',
               'computersandtechvideos','coverartarchive','culturalandacademicfilms','ephemera',
               'gamevideos','inlibrary','moviesandfilms','newsandpublicaffairs','ourmedia',
               'radioprograms','samples_only','spiritualityandreligion','stream_only',
               'television','test_collection','usgovfilms','vlogs','youth_media'];

    var Search = require('./Search').default;
    return new Search(res, htm, {sort:'-downloads', banner:'<center style="margin:35px;"><span style="font-size:125px" class="iconochive-logo"></span></center>',
                                 query:'mediatype:collection AND NOT noindex:true AND NOT collection:web AND NOT identifier:fav-* AND NOT identifier:' +
                                       NOT.join(' AND NOT identifier:')}).fetch(res, htm); //TODO-DETAILS pass banner as JSX

  }
}
