require('babel-core/register')({ presets: ['env', 'react']}); // ES6 JS below!
import React from './ReactFake';
import Details from './Details'

export default class DetailsError extends Details {
    constructor(itemid, item, message) {
        super(itemid);
        this.item = item;
        this.message = message;
    }
    jsxInNav(onbrowser) {
        return this.message;
    }
    render(res, htm) {
        const onbrowser = res.constructor.name != "ServerResponse"; // For a browser we render to an element, for server feed to a response stream
        if (!onbrowser) {
            res.statusCode = 500;
        }
        super.render(res,htm)
    }
}
