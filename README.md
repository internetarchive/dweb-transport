# dweb-transport

# Installing a compilable version
This will be made simpler ! 

If you haven't already, then install npm from https://nodejs.org/en/download

And on a Mac you'll need Xcode from the App store.

Then install the dependencies, it might need a global version of browserify so run like this
> npm install --dev

Note that this gets a forked version of libsodium-wrappers, as the current release doesn't have urlsafebase54

I find the first run generates a lot of warnings and a second, virtually clean run helps be sure it worked.

Now compile the javascript library for the browser
> npm run bundle_transport_ipfs

# Testing in node
Run the Node specific test
> node js/test.js

It should start a IPFS instance, and generate some messages ending in 

"delaying 10 secs" and "Completed test"

Usually it will need a Ctrl-C to exit

# Testing in browser
* In your browser, open the file:  examples/example_block.html
* Type some text into the editor and hit Save
* A hash should appear below.
* If it doesn't then open the browser console (e.g. Firefox/tools/Web Developer/Web Console)
* Click "FetchIt" and the data should be returned.

* In your browser, open the file:  examples/example_smartdict.html
* Type some text into the name, and a HTML color nmae into the color (e.g. "red") and hit Save
* A hash should appear below.
* If it doesn't then open the browser console (e.g. Firefox/tools/Web Developer/Web Console)
* Click "FetchIt" and the data should be returned and its structure show up in the Object Browser.




Please not there is an issue on later Firefox versions that is currently leaking Threads and slowing the machine down
drastically. This is being explored! 

See also:

* https://docs.google.com/document/d/1_MttdWglsIOIajqtiSW5AWuf6YObZP8AA2LF9OV4xOM/edit# for the API
* https://docs.google.com/document/d/1-lI352gV_ma5ObAO02XwwyQHhqbC8GnAaysuxgR2dQo/edit for toplevel on Dweb project


