# dweb-transport

Welcome to the Internet Archive's Decentralized Web (Dweb) libraries. 

This is a catch-all repository for the Dweb project. 

It has some legacy material, examples and partially started projects.

* gun: Our modified gun client that hijacks queries for .../arc/archive.org/metadata
* Webtorrent super peer/tracker combo
    * seeder: Super peer for webtorrent, that knows how to look up btih on IA
    * tracker: Super tracker for webtorrent, always adds the seeder super peer to results.
    * seeder-config.json ties the seeder & tracker together
* OBSOLETE register.js - for registering names in the dweb-objects/Domain system
* URL-forwards - documentation on where in the Dweb project urls are forwarded 
* test: Test code for the seeder/tracker combo

The bulk of the code is now in their own repos... 

See [Dweb document index](https://github.com/internetarchive/dweb-transports/blob/master/DOCUMENTINDEX.md) for a list of the repos that make up the Internet Archive's Dweb project, and an index of other documents. 
