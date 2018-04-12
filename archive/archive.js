// React is not used, we just use ReactFake
//var React = require('react');
//var ReactDOM = require('react-dom');
//TODO-SW make sure dont require stuff dont need with service workers esp in Dweb
const Nav = require('./Nav').default;
window.Nav = Nav; // So HTML can find it
var Dweb = require('../js/Dweb').default;
//Above works
//window.Nav = Nav;
