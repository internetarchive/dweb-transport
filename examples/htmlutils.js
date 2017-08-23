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
    }
    el = (typeof(el) === "string") ? document.getElementById(el) : el;
    el.style.display = (el.style && el.style.display === "none" ? displayvis : "none");
}

function setstatus(msg) {
    // Display the message in a Status DIV (usually top right corner, but could be anywhere example wants it)
    document.getElementById("status").innerHTML=msg;
}

function deletechildren(el) {
    /*
    Remove all children from a node
    :param el:  An HTML element, or a string with id of an HTML element
    */
    el = (typeof(el) === "string") ? document.getElementById(el) : el;
    while (el.firstChild) { el.removeChild(el.firstChild); }
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

function replacetexts(el, dict) { //TODO-REL4 put into example_list and example_smartdict
    /*
    Replace the text of all inner nodes of el from the dict
    Note this intentionally doesnt allow html as the values of the dict since probably from a network call and could be faked as "bad" html

    :param el:  An HTML element, or a string with id of an HTML element
    :param dict: A dictionary, object, or array of them
     */
    // First combine with a raw dict so that "prop" doesnt get functions and handles dict like things
    el = (typeof(el) === "string") ? document.getElementById(el) : el;
    el.source = dict;
    if (Array.isArray(dict)) {
        oo = Object.assign({},...dict);
    } else {
        oo = Object.assign({}, dict)
    }
    for (let prop in oo) {
        let val = oo[prop];
        let dests = el.querySelectorAll("[name="+ prop + "]"); //TODO its possible map works on dests, but maybe its not an array
        for (let i of dests) {
            replacetext(i, val);
        }
    }
}