##### (on secure host nginx - Andy)
* http://dweb.archive.org proxypass or redirect ? to https://dweb.archive.org
* https://dweb.archive.org proxypass to http://dweb.me
    
#### /etc/nginx/sites-enabled/dweb.me

* http://dweb.me/xyz redirect -> https://dweb.me/xyz
* https://dweb.me/xyz tryfiles -> /examples/bootloader.html
* https://dweb.me/examples tryfiles -> file

#### In bootloader.html
* dweb.xxxx.yyy:aaa/bbb?searchstring -> name= arc/xxxx.yyy/aaa/bbb
* /archive.org/aaa/bbb?searchstring -> name= arc/archive.org/aaa/bbb
* Name lookup -> [ urls ], path
* Redirect url?path=remainder&searchstring

#### /etc/nginx/sites-enabled/gateway.dweb.me
* http://gateway.dweb.me/ proxypass localhost:4244 (gateway python)
* https://gateway.dweb.me/ proxypass localhost:4244 (gateway python)
* https://gateway.dweb.me/ws proxypass localhost:4002 (websockets for IPFS)

#### In Naming
* /arc/archive.org/details -> https://dweb.me/examples/archive.html
* /arc/archive.org/search -> https://dweb.me/examples/archive.html
* /arc/archive.org/metadata/foo -> https://gateway.dweb.me/metadata/archiveid/foo

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
-> https://localhost:4244/metadata/archiveid/foo (python)
-> JSON metadata for foo

* https://dweb.me/examples/example_xx.html 
-> file /examples/example_xx.html