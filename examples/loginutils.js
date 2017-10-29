/*
    A set of common scripts for use in Dweb code to add key management and login functionality
    See example_keys.html for some usage

    Requires Dweb to point to top level (e.g. by loading src="dweb_transport_ipfs_bundled.js"

    keychains_ul should be something like:
    <ul id="keychains_ul"><li class='template vertical_li' onclick='keychain_click(this);'><span name='name'>PLACEHOLDER</span></li></ul>

    Needs a login and registration HTML

 */

// Array of images can use
const icon_images = {acl: "noun_1093404_cc.png", kp: "noun_1146472_cc.png", "tok": "noun_708669_cc.png", "locked": "noun_1093404_cc.png", "unlocked": "noun_1093404_cc_unlocked.png" }; /* If change here - see also Keys on KeyChain code below*/

function logout_click() {
    /* Logout button clicked  - logged out*/
    Dweb.KeyChain.logout();         // Empty keychains
    deletechildren("keychains_ul");    // Delete any visible children
    hide('logout');                 // Nothing remains to logout so hide button
}

function _login(dict) {
    /* common routine to login someone by name and passphrase, and display in KeyChains list - note
    :param dict: {name: passprase: }
    :resolves to: undefined
     */
    // concatenate them so that a common passphrase isn't sufficient to guess an id.
    let passphrase = dict.name + "/" + dict.passphrase;
    return Dweb.KeyChain.p_new({ name: dict.name}, {passphrase: passphrase}, verbose)
        .then((kc) => {
            addtemplatedchild("keychains_ul", kc );    // returns el, but unused
            show('logout');                         // And show the logout button
        })
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
    hide('loginform');                           // Hide after submission   //TODO-KEYS change form or this wont hide it
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
        if (kc._publicurl === el_keychain_header.source._publicurl)  // Check its still this KeyChain being displayed in keylist
            sig.p_fetchdata(verbose)                            // Get the data from a sig, its not done automatically as in other cases could be large
                .then((obj) => _showkeyorlock("keychain_ul", obj))             // Show on the list
    });
    kc.p_list_then_elements()                            // Retrieve the keys for the keylist
        .then(() => kc._keys.map((key)=> _showkeyorlock("keychain_ul", key)));  // And add to the HTML
}
function keyorlock_click(el) {
    // Clicked on a key or a lock, determine which and forward
    let obj = el.source;
    if (obj instanceof Dweb.AccessControlList)
        lock_click(el);
    else if (obj instanceof Dweb.KeyPair)
        key_click(el);
    else if ((obj instanceof Dweb.SmartDict) && obj.token)  // Its a token - like a key
        token_click(el);
     else
        throw new Dweb.errors.ToBeImplementedError(`keyorlock_click doesnt support ${obj.constructor.name}`)
}

function locklink_click(el) {
    // Clicked on a key, display a prompt to copy it for sharing
    if (verbose) console.log("locklink_click ---");
    el = (typeof(el) === "string") ? document.getElementById(el) : el;
    window.prompt("Copy to clipboard for locking (Ctrl-C + OK)", el.source._url);
}
function key_click(el) {
    // Clicked on a key, display a prompt to copy it for sharing
    if (verbose) console.log("key_click ---");
    window.prompt("Copy to clipboard for sharing (Ctrl-C + OK)", el.source._publicurl);
}
function token_click(el) {
    if (verbose) console.log("token_click ---");
    window.prompt("Copy to clipboard for sharing (Ctrl-C + OK)", el.source.viewer);
}

function keynew_click() {
    if (verbose) console.log("keynew_click ---");
    hide('keynew_form');
    let dict = form2dict("keynew_form"); //name
    let keychain = document.getElementById('keychain_header').source;
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
            if (acl._publicurl === el_lockheader.source._publicurl)  // Check its still this ACL being displayed in keylist
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
    return acl.p_add_acle(dict.url, {name: dict["name"]}, verbose)
        .then((tok) => _showkeyorlock("lock_ul", tok)) // Push to visual list, as listmonitor will be a duplicate
}

function p_connect(options) {
    /*
        This is a standardish starting process, feel free to copy and reuse !
        options = { defaulttransport: "IPFS"; }
     */
    let transportclass = Dweb["Transport" + (searchparams.get("transport") || options.defaulttransport || "IPFS").toUpperCase()]; // e.g. Dweb["TransportHTTP"]
    return transportclass.p_setup({}, verbose) //TODO may take some options
        .then((t) => t.p_status())
        .then((msg) => setstatus(msg))
        .catch((err) => { console.log("ERROR in p_connect:",err); throw(err); });
}


