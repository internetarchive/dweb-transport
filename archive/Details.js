
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
    async fetch() {
        /* Fetch JSON by talking to Metadata API
            this.id Archive Item identifier
            throws: TypeError or Error if fails
            resolves to: this
         */
        console.log('get metadata for '+this.id);
        this.item = await Util.fetch_json(`https://archive.org/metadata/${this.id}`);
        return this; // For chaining, but note will need to do an "await fetch"
    }
}

