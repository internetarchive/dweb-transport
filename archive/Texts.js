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
        let item = this.item
        return (
            <div>
            <iframe width="100%" height="480" src={`https://archive.org/stream/${this.id}?ui=embed#mode/2up`}></iframe><br/>
        <div dangerouslySetInnerHTML={{__html: item.metadata.description}}></div> {/*TODO-DETAILS probably a security issue inherited from Tracys code as banner could contain user-generated html*/}
        </div>
    );
    }
}
