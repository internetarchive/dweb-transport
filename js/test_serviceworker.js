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

/* TODO-SW move this to a Readme.md in new repo

#Communicating with Service Worker

4 ways to communicate with a Service Worker are exposed and tested

#### Fetch
Any fetch is intercepted by the Service Worker which responds with a standard HTTP Response

#### Call and response
* A call to TransportsProxy is passed as a message to the SW
* The SW calls the method with that name on Transports.
* The result of the method is sent back as a message or an error
* TransportsProxy returns to the caller

#### Unsolicited messages from the SW
* The SW can send a message to one client, or all of them
* An eventListener on TransportsProxy catches the message and interprets event.data = {command, ...}

#### Callbacks TODO-SW
* The call to TransportProxy includes a callback
* SW calls the function with its own callback which includes the Message port
* The SW callback relays to the Message Port
* TP will send each response message to the callback
* The effect should be the same for the caller as if calling the Transports method directly with a callback

 */