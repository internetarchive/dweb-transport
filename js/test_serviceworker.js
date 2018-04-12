const TransportsProxy = require('./TransportsProxy');

//TODO-SW still need bootloader equivalent

let verbose=true;
TransportsProxy.p_registerServiceWorker()
.then(() =>  TransportsProxy.p_rawfetch(["http://gateway.dweb.me/info"], {verbose} ))
.then((data) => console.log("XXX@50 Result of test = ", data))
.catch((err) => console.log("XXX@53 failure = ",err))
