// ######### Parallel development to MutableBlock.py ########

const CommonList = require("./CommonList");
const StructuredBlock = require("./StructuredBlock");
const Dweb = require("./Dweb");

class MutableBlock extends CommonList {
    // { _key, _current: StructuredBlock, _list: [ StructuredBlock*]
    constructor(data, master, key, verbose, options) {
        //CL.constructor: data, master, key, verbose
        //if (verbose) console.log("new MutableBlock(", data, master, key, verbose, options, ")");
        super(data, master, key, verbose, options);
        this.table = "mb"
    }

    p_elem(el, verbose, successmethodeach) {
        // this._current should be setup, it might not be loaded, but p_elem can load it
        return this._current.p_elem(el, verbose, successmethodeach);    // Typically _current will be a SB
    }

    p_list_then_current(verbose) {
        // Superclasses CL.p_fetchlist as need to set _current on a MB
        // Almost always you'll want p_list_then_current as this will leave _current undefined
        let self = this;
        return super.p_fetchlist(verbose)   // Return is a promise
        .then(() => { // Called after CL.p_fetchlist has unpacked data into Signatures in _list
            if (self._list.length) {
                let sig = self._list[self._list.length - 1];  // Get most recent
                return sig.p_fetchdata(verbose); // will be StructuredBlock, Store in _current
            } else {
                return undefined;
            }
        })
        .then((objOrUndef) => self._current = objOrUndef)
        // Note any follow on .then is applied to the MB, not to the content, and the content might not have been loaded.
    }

    p_update(){ console.assert(false, "Need to define p_ function")}

    async_update(type, data, verbose, success, error) {   console.trace(); console.assert(false, "OBSOLETE"); //TODO-IPFS obsolete with p_fetch // Send new data for this item to dWeb
        this.transport().async_update(this, this._url, type, data, verbose, success, error);
    }

    _p_storepublic(verbose) {
        // Note that this returns immediately after setting url, so caller may not need to wait for success
        //(data, master, key, verbose, options)
        let mb = new MutableBlock({"name": this.name}, false, this.keypair, verbose);
        mb.p_store(verbose);    // Returns immediately but sets _url first
        this._publicurl = mb._url;
    }

    content() {
        console.assert(!this._needsfetch, "Content is asynchronous, must load first");
        return this._current.content();
    }

    file() {
        console.assert(false, "XXX Undefined function MutableBlock.file");
    }   // Retrieving data

    p_signandstore(verbose){    //TODO-AUTHENTICATION - add options to remove old signatures by same
        /*
         Sign and Store a version, or entry in MutableBlock master
         Exceptions: SignedBlockEmptyException if neither url nor structuredblock defined, ForbiddenException if !master

         :return: self to allow chaining of functions
         */
        if ((!this._current._acl) && this.contentacl) {
            this._current._acl = this.contentacl;    //Make sure SB encrypted when stored
            this._current.dirty();   // Make sure stored again if stored unencrypted. - _url will be used by signandstore
        }
        return this.p_push(this._current, verbose)
            .then((sig) => { this._current._signatures.push(sig); return sig} )// Promise resolving to sig, ERR SignedBlockEmptyException, ForbiddenException

    }

    p_path(patharr, verbose, successmethod) {
        if (verbose) console.log("mb.p_path", patharr, successmethod);
        //sb.p_path(patharr, verbose, successmethod) {
        let curr = this._current;
        return curr.p_path(patharr, verbose, successmethod);
    }

    static p_new(acl, contentacl, name, _allowunsafestore, content, signandstore, verbose) {
        /*
         Utility function to allow creation of MB in one step
         :param acl:             Set to an AccessControlList or KeyChain if storing encrypted (normal)
         :param contentacl:      Set to enryption for content
         :param name:            Name of block (optional)
         :param _allowunsafestore: Set to True if not setting acl, otherwise wont allow storage
         :param content:         Initial data for content
         :param verbose:
         :param signandstore:    Set to True if want to sign and store content, can do later
         :param options:
         :return:
         */
        // See test.py.test_mutableblock for canonical testing of python version of this
        if (verbose) console.log("MutableBlock.p_new: Creating MutableBlock", name);
        // (data, master, key, verbose)
        let mblockm = new MutableBlock({contentacl: contentacl}, true, {keygen: true}, verbose, {"name": name});  // (name=name  // Create a new block with a new key
        mblockm._acl = acl;              //Secure it
        mblockm._current = new Dweb.StructuredBlock({data: content},verbose);  //Preload with data in _current.data
        mblockm._allowunsafestore = _allowunsafestore;
        if (_allowunsafestore) {
            mblockm.keypair._allowunsafestore = true;
        }
        if (signandstore && content) {
            return mblockm.p_store(verbose)
                .then((msg) => mblockm.p_signandstore(verbose)) //Sign it - this publishes it
                    .then(() => mblockm)
        } else {
            return mblockm.p_store(verbose)
                .then(() => mblockm)
        }
    }


    static test(sb, verbose) {
        let mb;
        if (verbose) console.log("MutableBlock.test starting");
        return new Promise((resolve, reject) => {
            try {
                //(data, master, key, verbose, options
                let siglength;
                let mb1 = new Dweb.MutableBlock(null, true, {keygen: true},  verbose, null);
                Dweb.SmartDict.p_fetch(sb._url, verbose)
                .then((obj) => {
                    mb1._current = obj
                    mb1._allowunsafestore = true; // No ACL, so shouldnt normally store, but dont want this test to depend on ACL
                    siglength = mb1._list.length; // Will check for size below
                })
                .then(() => mb1.p_signandstore(verbose)) // Async, should set url immediately but wait to retrieve after stored.
                //.then(() => console.log("mb1.test after signandstore=",mb1))
                .then(() => console.assert(mb1._list.length === siglength+1))
                //MutableBlock(data, master, key, verbose, options) {
                .then(() => Dweb.SmartDict.p_fetch(mb1._publicurl, verbose))
                .then((newmb) => mb = newmb)
                .then(() => mb.p_list_then_current(verbose))
                .then(() => console.assert(mb._list.length === siglength+1, "Expect list",siglength+1,"got",mb._list.length))
                .then(() => console.assert(mb._current.data === sb.data, "Should have retrieved"))
                //.then(() => mb.p_path(["langs", "readme.md"], verbose, ["p_elem", "myList.1", verbose,])) //TODO-PATH need a path based test
                .then(() => { if (verbose) console.log("MutableBlock.test promises done"); })
                .then(() => resolve({mb: mb}))
                .catch((err) => {
                    console.log("Error in MutableBlock.test", err);   // Log since maybe "unhandled" if just throw
                    reject(err);
                })
            } catch (err) {
                console.log("Caught exception in MutableBlock.test", err);
                throw(err)
            }
        })
    }
}
exports = module.exports = MutableBlock;
