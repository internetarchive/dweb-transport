const TransportsProxy = require('./TransportsProxy');
const utils = require('./utils.js');
//TODO-SW still need bootloader equivalent

function log(text) {
    console.log(text);
    document.getElementById("statuslist").appendChild( utils.createElement("li",{},text));
}
// Next few lines need explaining!  If passed an extra parameter url= then it will use that as the URL instead of ...bootloader.html
// This is only useful for testing normally server returns bootloader.html for anything under dweb.archive.org
var searchparams = new URL(window.location.href).searchParams;  // Original parameters, which includes url if faking
var verbose = searchparams.get("verbose");
if (searchparams.get("addr")) {
    url = `${window.location.origin}/${searchparams.get("addr")}`;
} else {
    url = window.location.href;
}
log("Loading Service Worker and connecting to transports...");
//TODO-SW this loops if not provided an addr, in that case should have a form to fill in
TransportsProxy.p_registerServiceWorker()
//.then(() =>  TransportsProxy.p_rawfetch(["http://gateway.dweb.me/info"], {verbose} ))
.then((data) => console.log("Result of test to gateway.dweb.me= ", data))
.catch((err) => log(`Test to gateway.dweb.me failed: ${err}`))
log(`Redirecting through service worker to:${url}`);
window.open(url,"_self");
