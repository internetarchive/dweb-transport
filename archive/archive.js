// React is not used, we just use ReactFake
//var React = require('react');
//var ReactDOM = require('react-dom');

const Nav = require('./Nav').default;
window.Nav = Nav; // So HTML can find it
var Dweb = require('../js/Dweb').default;
const TransportHTTP = require('../js/TransportHTTP');
const TransportIPFS = require('../js/TransportIPFS');
const TransportWEBTORRENT = require('../js/TransportWEBTORRENT');
const TransportYJS = require('../js/TransportYJS');
//Above works
//window.Nav = Nav;
