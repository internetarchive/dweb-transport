
require('babel-core/register')({ presets: ['es2015', 'react']}); // ES6 JS below!
import React from './ReactFake';
//Not needed on client - kept so script can run in both cases
//import ReactDOMServer from 'react-dom/server';
//Next line is for client, not needed on server but doesnt hurt
//import ReactDOM from 'react-dom';

import Util from './Util';
import ArchiveBase from './ArchiveBase'

export default class Details extends ArchiveBase {
  constructor(id, {}={}) {
      super(id);
  }
  async fetch() { // Note almost identical to code on Search.fetch()
      //TODO-DETAILS-FETCH add trap of error here
      console.log('get metadata for '+this.id);
      // talk to Metadata API
          const _this = this;
          let response = await fetch(new Request(  // Note almost identical code on Details.js and Search.js
              'https://archive.org/metadata/'+this.id,
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
                  this.item = await response.json(); // response.json is a promise resolving to JSON already parsed
              } else {
                  t = response.text(); // promise resolving to text
                  console.log("Expecting JSON but got",t); //TODO-DETAILS-REFACTOR throw error here
              }
          }   // TODO-HTTP may need to handle binary as a buffer instead of text
          return this; // For chaining, but note will need to do an "await fetch"
  }

}

