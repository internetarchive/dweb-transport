'use strict';
//See https://github.com/GoogleChrome/samples/blob/gh-pages/service-worker/post-message/service-worker.js
//for comprehensible service worker messaging example

function p_sendMessage(message) {
    // This wraps the message posting/response in a promise, which will resolve if the response doesn't
    // contain an error, and reject with the error if it does. If you'd prefer, it's possible to call
    // controller.postMessage() and set up the onmessage handler independently of a promise, but this is
    // a convenient wrapper.
    return new Promise(function(resolve, reject) {
        var messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = function(event) {
            if (event.data.error) {
                console.log("Client received error")
                reject(event.data.error);
            } else {
                console.log("Client received response")
                resolve(event.data);
            }
        };

        // This sends the message data as well as transferring messageChannel.port2 to the service worker.
        // The service worker can then use the transferred port to reply via postMessage(), which
        // will in turn trigger the onmessage handler on messageChannel.port1.
        // See https://html.spec.whatwg.org/multipage/workers.html#dom-worker-postmessage
        navigator.serviceWorker.controller.postMessage(message,
            [messageChannel.port2]);
    });
}


if ('serviceWorker' in navigator) {
    // Set up a listener for messages posted from the service worker.
    // The service worker is set to post a message to all its clients once it's run its activation
    // handler and taken control of the page, so you should see this message event fire once.
    // You can force it to fire again by visiting this page in an Incognito window.
    navigator.serviceWorker.addEventListener('message', function(event) {
        console.log("Client received SW message",event);
    });

    navigator.serviceWorker.register('sw_server_bundle.js')
        .then((registration) => {
            console.log('-> Registered the service worker successfully');
            /*
            let destn = document.location.href;
            destn = "http://localhost:8080/arc/archive.org/details/commute" //TODO-SW this is just for testing, will get form original href when nginx serves fixed page
            document.location.assign(destn);   // Danger could be recursive
            */
            p_sendMessage("Hello World").then((data) => console.log("Got result",data))
        })
        .catch((err) => {
            console.log('-> Failed to register:', err)
        })
} else {
    console.log("Unable to register service worker as not in 'navigator'");
}
