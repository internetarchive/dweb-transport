# Location forwarding etc

There are a number of places where URLs are forwarded, this is an attempt to gather them in one place

##### (on secure host nginx - Andy)
* http://dweb.archive.org proxypass or redirect ? to https://dweb.archive.org
* https://dweb.archive.org proxypass to http://dweb.me
    

#### In dweb-transport/bootloader.html
* dweb.xxxx.yyy:aaa/bbb?searchstring -> name= arc/xxxx.yyy/aaa/bbb
* /archive.org/aaa/bbb?searchstring -> name= arc/archive.org/aaa/bbb
* Name lookup -> [ urls ], path
* Redirect url?path=remainder&searchstring

#### /etc/nginx/sites-enabled/{dweb.me, gateway.dweb.me}   - TODO THIS IS OUT OF DATE see dweb-gateway/nginx/dweb.me
* http://dweb.me/xyz redirect -> https://dweb.me/xyz
* https://dweb.me/xyz tryfiles -> /examples/bootloader.html
* https://dweb.me/examples tryfiles -> file
* TODO want it to handle dweb.me/arc/
* http://{gateway.dweb.me,dweb.me}/ proxypass localhost:4244 (gateway python)
* https://{gateway.dweb.me,dweb.me}/ proxypass localhost:4244 (gateway python)
* https://{gateway.dweb.me,dweb.me}/ws proxypass localhost:4002 (websockets for IPFS)


#### In Naming setup in dweb-objects/domain.js
* /arc/archive.org/details -> https://dweb.me/examples/archive.html
* /arc/archive.org/search -> https://dweb.me/examples/archive.html
* /arc/archive.org/metadata/foo -> https://gateway.dweb.me/metadata/archiveid/foo
* TODO SHOULD BE /arc/archive.org/metadata/foo -> https://dweb.me/arc/archive.org/metadata/foo

#### In dweb-archive/ReactFake.js
* Only relative URLs handled currently

#### In Nav.js
*

#### In ServiceWorker (i.e. only when using the serviceworker launch
* /ping -> "Ping $location"
* https://dweb.aaaa.bbbb/foo -> https://dweb.aaaa.bbbb/foo
* /archive.org/foo -> /arc/archive.org/foo
* ON localhost:8080:  https://dweb.me/examples/foo -> localhost:8080/foo (just for testing)
* /arc/xxx.yy/foo -> lookup as name (inc passing search)
* /magnet/foo => Webtorrent
* magnet:foo => Webtorrent
* /ipfs => IPFS
* https://ipfs.io => IPFS

####Particular important cases
* https://dweb.archive.org/details 
-> https://dweb.me/details
-> boatloader (https://dweb.archive.org/details)
-> name: /arc/archive.org/details
-> https://dweb.me/examples/archive.html
-> file /examples/archive.html

* https://dweb.archive.org/metadata/xyz
-> http://dweb.me/metadata/xyz
-> bootloader (https:https://dweb.archive.org/metadata/xyz)
-> name: /arc/archive.org/metadata/xyz
-> https://gateway.dweb.me/metadata/archiveid/foo
(should be -> https://dweb.me/arc/archive.org/metadata/foo)
-> https://localhost:4244/metadata/archiveid/foo (python)
-> JSON metadata for foo

* https://dweb.me/examples/example_xx.html 
-> file /examples/example_xx.html