/*
    This file is a set of utility functions used in the manipulation of HTML pages
    There is nothing specific to Dweb at all here, feel free to copy and modify.
 */

function form2dict(frm) {
    /* Convert a form into a dictionary
       its mindblowing that Javascript even at EC6 doesnt have this !
   */
    let res = {};
    /* Find the element if we are given a string */
    /* Note this is not the usual getElementById since forms have their own array */
    let el_form = (typeof frm === "string") ? document.forms.namedItem(frm) : frm;
    for (let el of el_form.elements) {
        if (el.type !== "submit") {
            res[el.name] = el.value;
        }
    }
    return res;
}

function togglevis(el, displayvis) {
    /*
        Toggle the visibility of an item
        el element, its id, or an array of elements
        displayvis is one of "inline" "block" "inlineblock"
     */
    if (Array.isArray(el)) {
        el.map((e) => togglevis(e, displayvis))
    } else {
        el = (typeof(el) === "string") ? document.getElementById(el) : el;
        el.style.display = (el.style && el.style.display === "none" ? displayvis : "none");
    }
}

function setstatus(msg) {
    // Display the message in a Status DIV (usually top right corner, but could be anywhere example wants it)
    document.getElementById("status").innerHTML=msg;
}

function deletechildren(el, keeptemplate) {
    /*
    Remove all children from a node
    :param el:  An HTML element, or a string with id of an HTML element
    */
    if (typeof keeptemplate === "undefined") keeptemplate=true;
    el = (typeof(el) === "string") ? document.getElementById(el) : el;
    // Carefull - this deletes from the end, because template if it exists will be firstChild
    while (el.lastChild && !(keeptemplate && el.lastChild.classList && el.lastChild.classList.contains("template"))) {
        // Note that deletechildren is also used on Span's to remove the children before replacing with text.
        el.removeChild(el.lastChild);
    }
    return el; // For chaining
}

function replacetext(el, text) {
    /* Replace the text of el with text, removing all other children
    :param el:  An HTML element, or a string with id of an HTML element
    */
    el = (typeof(el) === "string") ? document.getElementById(el) : el;
    deletechildren(el);
    return el.appendChild(document.createTextNode(text))
}

function replacetexts(el, ...dict) {
    /*
    Replace the text of all inner nodes of el from the dict
    Note this intentionally doesnt allow html as the values of the dict since probably from a network call and could be faked as "bad" html

    :param el:  An HTML element, or a string with id of an HTML element
    :param dict: A dictionary, object, or array of them
     */
    // First combine with a raw dict so that "prop" doesnt get functions and handles dict like things
    el = (typeof(el) === "string") ? document.getElementById(el) : el;
    el.source = dict[0];    // Usually used with one object, if append fields its usually just calculated for display
    _replacetexts("", el, Object.assign({}, ...dict))
    return el;
}
function _replacetexts(prefix, el, oo) {
    /*
    Inner function for replacetexts to allow crawling depth of oo
     */
    for (let prop in oo) {
        let p = prefix + prop
        let val = oo[prop];
        if (typeof val === "object" && !Array.isArray(val)) {
            _replacetexts(`${prop}_`, el, val)
        }
        else if (typeof val === "object" && Array.isArray(val)) {
            dests = el.querySelectorAll(`[name=${p}]`);
            Array.prototype.slice.call(dests)
                .map((i) => {
                    deletechildren(i);
                    val.map((f) => addtemplatedchild(i, f))
                })
        } else {
            let dests = el.querySelectorAll(`[name=${p}]`);
            if (el.getAttribute("name") === p) replacetext(el, val); //Do the parent as well
            Array.prototype.slice.call(dests).map((i) => replacetext(i, val));
            dests = el.querySelectorAll(`[href=${p}]`);
            if (el.getAttribute("href") === p) el.href = val;
            Array.prototype.slice.call(dests).map((i) => i.href = val)
        }
    }
}

function addtemplatedchild(el, ...dict) {
    /*
    Alternative to addhtml - TODO merge them somehow
    Standardised tool to add fields to html,  add that as the last child (or children) of el
    The slightly convulated way of doing this is because of the limited set of functions available
    Note this has to be done with care, as "dict" may be user supplied and contain HTML or other malicious content

    el: An HTML element, or a string with the id of one.
    html: html to add under outerelement
    dict: Dictionary with parameters to replace in html, it looks for nodes with name="xxx" and replaces text inside it with dict[xxx]
    */
    el = (typeof(el) === "string") ? document.getElementById(el) : el;
    let el_li = el.getElementsByClassName("template")[0].cloneNode(true);   // Copy first child with class=Template
    el_li.classList.remove("template");                                 // Remove the "template" class so it displays
    replacetexts(el_li, ...dict);                          // Safe since only replace text - sets el_li.source to dict
    el.appendChild(el_li);
    return el_li;
}
function addhtml(el, htmleach, dict) { //TODO merge into addtemplatechild - note its still used for complex cases
    /*
    TODO OBSOLETED BY addtemplatechild
    Standardised tool to add fields to html,  add that as the last child (or children) of el
    The slightly convulated way of doing this is because of the limited set of functions available
    Note this has to be done with care, as "dict" may be user supplied and contain HTML or other malicious content

    el: An HTML element, or a string with the id of one.
    html: html to add under outerelement
    dict: Dictionary with parameters to replace in html, it looks for nodes with name="xxx" and replaces text inside it with dict[xxx]
    */
    el = (typeof(el) === "string") ? document.getElementById(el) : el;
    let el_li = document.createElement('div');   // usually a 'li' but could be a 'div'
    if (htmleach) {
        el_li.innerHTML = htmleach;                           //Note safe since html from above, not from net
    }
    replacetexts(el_li, dict);                          // Safe since only replace text
    let kids = Array.from(el_li.children);                  // Array.from required because children is not an array.
    kids[0].source = el_li.source;                      // source will be at wrong level.
    for (let c in kids) {
        console.log(kids[c]);
        el.appendChild(kids[c])
    }
    return kids;
}



function show(el, displayvalue) {
    displayvalue = displayvalue || "";
    if (Array.isArray(el)) el.map((e) => show(e, displayvalue));
    el = (typeof(el) === "string") ? document.getElementById(el) : el;
    el.style.display = displayvalue;
}

function hide(el) {
    if (Array.isArray(el)) el.map((e) => hide(e));
    el = (typeof(el) === "string") ? document.getElementById(el) : el;
    el.style.display = "none";
}

function p_httpget(url, headers) {
    //https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
    /* Simple Get of a URL, resolves to either json or text depending on mimetype */
    h = new Headers( headers ? headers : {} )
    return fetch(new Request(url, {
            method: 'GET',
            headers: h,
            mode: 'cors',
            cache: 'default',
            redirect: 'follow',  // Chrome defaults to manual
        })) // A promise, throws (on Chrome, untested on Ffox or Node) TypeError: Failed to fetch)
        .then((response) => {
            if (response.ok) {
                if (response.headers.get('Content-Type') === "application/json") {  // It should always be JSON
                    return response.json(); // promise resolving to JSON
                } else {
                    return response.text(); // promise resolving to text
                }
            }
            throw new Error(`Transport Error ${response.status}: ${response.statusText}`); // Should be TransportError but out of scope
        })
        .catch((err) => {
            console.log("Probably misleading error from fetch:", url, err);
            throw new Error(`Transport error thrown by ${url}`)
        });  // Error here is particularly unhelpful - if rejected during the COrs process it throws a TypeError
}

function display_blob(bb, options) {//TODO-STREAMS figure out how to pass streams to this and how to pass from IPFS
    // See https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL
    // and https://stackoverflow.com/questions/3665115/create-a-file-in-memory-for-user-to-download-not-through-server
    if (!(bb instanceof Blob)) {
        bb = new Blob([bb], {type: options.type})
    }
    console.log("display_object",typeof bb);
    let a = window.document.createElement('a');
    //bb = new Blob([datapdf], {type: 'application/pdf'});    //TODO-STREAMS make this work on streams
    let objectURL = URL.createObjectURL(bb);    //TODO-STREAMS make this work on streams
    a.href = objectURL;
    a.target= (options && options.target) || "_blank";                      // Open in new window by default
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    //URL.revokeObjectURL(objectURL)    //TODO figure out when can do this - maybe last one, or maybe dont care?
}

