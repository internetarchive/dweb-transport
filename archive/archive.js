// React is not used, we just use ReactFake
//var React = require('react');
//var ReactDOM = require('react-dom');
var Nav = require('./Nav').default;
window.Nav = Nav; // So HTML can find it
//var Dweb = require('../js/Dweb').default;   //It doesnt look like this is used even in non-service workers
var DwebTransports = require('../js/TransportsProxy');
window.DwebTransports = DwebTransports; // So HTML can find it
//Above works
//window.Nav = Nav;
