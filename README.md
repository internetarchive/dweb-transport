# dweb-transport

Welcome to the Internet Archive's Decentralized Web (Dweb) libraries. 

This is a catch-all repository for the Dweb project. 

It has some legacy material, examples and partially started projects.

* gun: Our modified gun client that hijacks queries for .../arc/archive.org/metadata
* Webtorrent super peer/tracker combo
    * seeder: Super peer for webtorrent, that knows how to look up btih on IA
    * tracker: Super tracker for webtorrent, always adds the seeder super peer to results.
    * seeder-config.json ties the seeder & tracker together
* register.js - for registering names in the dweb-objects/Domain system
* URL-forwards - documentation on where in the Dweb project urls are forwarded 
* test: Test code for the seeder/tracker combo

The bulk of the code is now in their own repos... 

### Repos:
* *dweb-transports:* Common API to underlying transports (http, webtorrent, ipfs, yjs)
* *dweb-objects:* Object model for Dweb inc Lists, Authentication, Key/Value, Naming
* *dweb-serviceworker:* Run Transports in ServiceWorker (experimental)
* *dweb-archive:* Decentralized Archive webpage and bootstrapping
* *dweb-mirror:* Project to mirror collections to local directories, and then serve in IPFS and WebTorrent.
* *dweb-transport:* Original Repo, still includes examples but being split into smaller repos

