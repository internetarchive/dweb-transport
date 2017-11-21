/*
    A set of common scripts for use in Dweb code to add key management and login functionality
    See example_versions.html for some usage and example_keys.html for instructions.

    Requires Dweb to point to top level (e.g. by loading src="dweb_transport_ipfs_bundled.js"

    keychains_ul should be something like:
    <ul id="keychains_ul"><li class='template vertical_li' onclick='keychain_click(this);'><span name='name'>PLACEHOLDER</span></li></ul>

    Needs a login and registration HTML

    Naming conventions:


 */
//TODO-MULTI-needs-scanning

// Array of images can use
const icon_images = {   //!SEE-OTHER-KC-CLASSES
    acl: "noun_1093404_cc.png",
    kp: "noun_1146472_cc.png",
    "tok": "noun_708669_cc.png",
    "vl": "log.gif",    // TODO replace by better icon
    "locked": "noun_1093404_cc.png",
    "unlocked": "noun_1093404_cc_unlocked.png",
}; /* If change here - see also Keys on KeyChain code below*/

function logout_click() {
    /* Logout button clicked  - logged out*/
    Dweb.KeyChain.logout();         // Empty keychains
    deletechildren("keychains_ul");    // Delete any visible children
    hide('logout');                 // Nothing remains to logout so hide button
}

async function _login(dict) {
    /* common routine to login someone by name and passphrase, and display in KeyChains list - note
    :param dict: {name: passprase: }
    :resolves to: undefined
     */
    // concatenate them so that a common passphrase isn't sufficient to guess an id.
    try {
        let passphrase = dict.name + "/" + dict.passphrase;
        let kc = await Dweb.KeyChain.p_new({name: dict.name}, {passphrase: passphrase}, verbose);
        addtemplatedchild("keychains_ul", kc);      // returns el, but unused
        show('logout');                             // And show the logout button
    } catch(err) {
        console.log("Unable to _login",err);
        alert(err);
        return;
    }
}

function registrationsubmit() {
    /* User has filled in and submitted the registration button */
    if (verbose) console.log("p_registrationsubmit ---");
    hide('registrationform');                                // Hide after submission
    _login(form2dict("registrationform"));         // { name, passphrase }
}

function loginformsubmit() {
    /* Login button clicked - User has logged in */
    // At the moment this is identical behavior to p_registrationsubmit, but that could change
    //TODO-REL4 - check if user already exists, require "registration if not
    if (verbose) console.log("loginformsubmit ---");
    hide('loginform');                           // Hide after submission
    return _login(form2dict("loginform"));    // { name, passphrase }
}

function _showkeyorlock(el, obj) {
    // Utility function to add new or existing element to Key List
    icon_image = icon_images[obj.table === "sd" && obj.token ? "tok" : obj.table ]
    addtemplatedchild(el, obj, {objsym: icon_image})
}
function keychain_click(el) {
    /* Click on a KeyChain i.e. on a login - display list of Keys and Locks for that login */
    let kc = el.source;                                         // Find KeyChain clicked on
    show('keychain');                                               // Show the div 'keys' for showing keylist
    let el_keychain_header = replacetexts("keychain_header", kc);  // Set name fields etc in keylistdiv, sets source - dont set in keychain as will get list wrong
    deletechildren("keychain_ul");                               // Delete any locks or eys currently displayed
    kc.addEventListener("insert", (event) => {                  // Setup a listener that will trigger when anything added to the list and update HTML
        if (verbose) console.log("keychain.eventlistener",event);
        let sig = event.detail;
        if (kc._publicurl === el_keychain_header.source._publicurl)  // Check its still this KeyChain being displayed in keylist //TODO-MULTI
            sig.p_fetchdata(verbose)                            // Get the data from a sig, its not done automatically as in other cases could be large
                .then((obj) => _showkeyorlock("keychain_ul", obj))             // Show on the list
    });
    kc.p_list_then_elements()                            // Retrieve the keys for the keylist
        .then(() => kc._keys.map((key)=> _showkeyorlock("keychain_ul", key)));  // And add to the HTML
}
function kcitem_click(el) { //!SEE-OTHER-KC-CLASSES
    // Clicked on a key or a lock, determine which and forward
    let obj = el.source;
    if (obj instanceof Dweb.AccessControlList)
        lock_click(el);
    else if (obj instanceof Dweb.KeyPair)
        key_click(el);
    else if (obj instanceof Dweb.VersionList)
        versionlist_click(el);
    else if ((obj instanceof Dweb.SmartDict) && obj.token)  // Its a token - like a key
        token_click(el);
     else
        throw new Dweb.errors.ToBeImplementedError(`kcitem_click doesnt support ${obj.constructor.name}`)
}

//!SEE-OTHER-KC-CLASSES

// Clicked on a key, display a prompt to copy it for sharing
function locklink_click(el) {
    window.prompt("Copy to clipboard for locking (Ctrl-C + OK)", resolve(el).source._url);
}
function key_click(el) {
    window.prompt("Copy to clipboard for sharing (Ctrl-C + OK)", resolve(el).source._publicurl); //TODO-MULTI
}
function token_click(el) {
    window.prompt("Copy to clipboard for sharing (Ctrl-C + OK)", resolve(el).source.viewer);
}
function versionlist_click(el) {
    target=resolve("vl_target")
    if (target) {
        p_vl_target_display(target, resolve(el).source);    // Application dependent
    } else {
        window.prompt("Copy to clipboard for sharing (Ctrl-C + OK)", resolve(el).source._url);  // In some cases should load form
    }
}

function keynew_click() {
    if (verbose) console.log("keynew_click ---");
    hide('keynew_form');
    let dict = form2dict("keynew_form"); //name
    let keychain = document.getElementById('keychain_header').source;   // Keychain of parent of this dialog
    let key = new Dweb.KeyPair({name: dict.name, key: {keygen: true}, _acl: keychain}, verbose );
    _showkeyorlock("keychain_ul", key);   // Put in UI, as listmonitor response will be deduplicated.
    keychain.p_push(key, verbose);
}

function locknew_click() {
    if (verbose) console.log("locknew_click ---");
    hide('locknew_form');
    let dict = form2dict("locknew_form"); //name
    let keychain = document.getElementById('keychain_header').source;  // The KeyChain being added to.
    return Dweb.AccessControlList.p_new({name: dict.name, _acl: keychain}, true, {keygen: true}, verbose, null, keychain )    //(data, master, key, verbose, options, kc)
        .then((acl) => _showkeyorlock("keychain_ul", acl)); // Put in UI, as listmonitor return rejected as duplicate
}

function lock_click(el) {
    if (verbose) console.log("lock_click ---");
    let acl = el.source;                                    // The ACL clicked on
    show('lock_div');                                     // Show the HTML with a list of tokens in ACL
    let el_lockheader = replacetexts("lock_header", acl);     // Set name fields etc in keylistdiv, sets source
    deletechildren("lock_ul");                               // Remove any existing HTML children
    return acl.p_tokens()                                       // Retrieve the keys for the keylist
        .then((toks) => toks.map((tok) => _showkeyorlock("lock_ul", tok)))   // And add to the HTML
        .then(() => acl.addEventListener("insert", (event) => {                  // Setup a listener that will trigger when anything added to the list and update HTML
            if (verbose) console.log("lock.eventlistener",event);
            let sig = event.detail;
            if (acl._publicurl === el_lockheader.source._publicurl)  // Check its still this ACL being displayed in keylist //TODO-MULTI
                sig.p_fetchdata(verbose)                    // Get the data from a sig, its not done automatically as in other cases could be large
                    .then((tok) => _showkeyorlock("lock_ul", tok))           // Show on the list
        }));
}

function tokennew_click() { //Called by "Add" button on new token dialog
    //TODO this allows duplicates, shouldnt add if viewer matches
    if (verbose) console.log("tokennew_click ---");
    hide('tokennew_form');
    let dict = form2dict("tokennew_form"); //url
    acl = document.getElementById('lock_header').source;
    return acl.p_add_acle([dict.urls], {name: dict["name"]}, verbose)
        .then((tok) => _showkeyorlock("lock_ul", tok)) // Push to visual list, as listmonitor will be a duplicate
}

function p_connect(options) {
    /*
        This is a standardish starting process, feel free to copy and reuse !
        options = { defaulttransport: "IPFS"; }
     */
    options = options || {};
    let setupoptions = {};
    let transp = (searchparams.get("transport") || options.defaulttransport || "IPFS").toUpperCase();
    console.log("XXX transp=",transp)
    if (transp === "LOCAL") {
        transp = "HTTP";
        setupoptions = {http: {urlbase: "http://localhost:4244"}}
    }
    console.log("XXX setupoptions=",setupoptions)
    let transportclass = Dweb["Transport" + transp]; // e.g. Dweb["TransportHTTP"]
    return transportclass.p_setup(setupoptions, verbose) //TODO may take some options
        .then((t) => t.p_status())
        .then((msg) => setstatus(msg))
        .catch((err) => { console.log("ERROR in p_connect:",err); throw(err); });
}


