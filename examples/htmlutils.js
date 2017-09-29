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
    el_form = (typeof frm === "string") ? document.forms.namedItem(frm) : frm;
    let el;
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
    while (el.firstChild) { // Note that deletechildren is also used on Span's to remove the children before replacing with text.
        if (!(keeptemplate && el.firstChild.classList && el.firstChild.classList.contains("template")))
            el.removeChild(el.firstChild);
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

function replacetexts(el, ...dict) { //TODO-REL4 put into example_list and example_smartdict
    /*
    Replace the text of all inner nodes of el from the dict
    Note this intentionally doesnt allow html as the values of the dict since probably from a network call and could be faked as "bad" html

    :param el:  An HTML element, or a string with id of an HTML element
    :param dict: A dictionary, object, or array of them
     */
    // First combine with a raw dict so that "prop" doesnt get functions and handles dict like things
    el = (typeof(el) === "string") ? document.getElementById(el) : el;
    el.source = dict[0];    // Usually used with one object, if append fields its usually just calculated for display
    oo = Object.assign({},...dict);
    for (let prop in oo) {
        let val = oo[prop];
        let dests = el.querySelectorAll("[name="+ prop + "]"); //TODO its possible map works on dests, but maybe its not an array
        for (let i of dests) {
            replacetext(i, val);
        }
    }
    return el;
}

function addtemplatedchild(el, dict) {
    /*
    ALTERNATIVE EXPERIMENT TO addhtml
    Standardised tool to add fields to html,  add that as the last child (or children) of el
    The slightly convulated way of doing this is because of the limited set of functions available
    Note this has to be done with care, as "dict" may be user supplied and contain HTML or other malicious content

    el: An HTML element, or a string with the id of one.
    html: html to add under outerelement
    dict: Dictionary with parameters to replace in html, it looks for nodes with name="xxx" and replaces text inside it with dict[xxx]
    */
    el = (typeof(el) === "string") ? document.getElementById(el) : el;
    el_li = el.getElementsByClassName("template")[0].cloneNode(true);   // Copy first child with class=Template
    el_li.classList.remove("template");                                 // Remove the "template" class so it displays
    replacetexts(el_li, dict);                          // Safe since only replace text - sets el_li.source to dict
    el.appendChild(el_li)
    return el_li;
}
function addhtml(el, htmleach, dict) { //TODO-REL4 if works in example_list replace code in example_keys that constructs html
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
    kids = Array.from(el_li.children);                  // Array.from required because children is not an array.
    kids[0].source = el_li.source;                      // source will be at wrong level.
    for (let c in kids) {
        console.log(kids[c]);
        el.appendChild(kids[c])
    };
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
