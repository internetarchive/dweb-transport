'use strict';

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw_server_bundle.js')
        .then((registration) => {
            console.log('-> Registered the service worker successfully');
            let destn = document.location.href;
            destn = "http://localhost:8080/arc/archive.org/details/commute" //TODO-SW this is just for testing, will get form original href when nginx serves fixed page
            document.location.assign(destn);   // Danger could be recursive
        })
        .catch((err) => {
            console.log('-> Failed to register:', err)
        })
} else {
    console.log("Unable to register service worker as not in 'navigator'");
}
