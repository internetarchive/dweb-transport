/*
    This file is a set of utility functions used in the manipulation of HTML pages
    There is nothing specific to Dweb at all here, feel free to copy and modify.
    TODO-REPO find what from here, if anything, used in archive and remove rest
 */


function elementFrom(el) {
    /* Make sure we have an element, if passed a string then find the element with that id.
      el:       Element or string being the id of an element.
      returns:  element.
     */
    return (typeof(el) === "string") ? document.getElementById(el) : el;
}
async function p_resolveobj(url) {
    /*
    Asynchronously find an object
    url:    An object, or a url representing an object, or an array of urls.
    returns: Object
    throws: Error if can't resolve object
    */
    try {
        if (typeof url === 'string')
            url = [ url ];
        if (Array.isArray(url))
            url = await DwebObjects.SmartDict.p_fetch(url, verbose);
        return url;
    } catch(err) {
        console.log("p_resolveobj: Cannot resolve",url);
        throw err;
    }
}

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
        el = elementFrom(el);
        el.style.display = (el.style && el.style.display === "none" ? displayvis : "none");
    }
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

function show(el, displayvalue) {
    displayvalue = displayvalue || "";
    if (Array.isArray(el)) el.map((e) => show(e, displayvalue));
    elementFrom(el).style.display = displayvalue;
}

function hide(el) {
    if (Array.isArray(el)) el.map((e) => hide(e));
    elementFrom(el).style.display = "none";
}


//------- For dealing with MCE editor ----------

function seteditor(content) {
    tinyMCE.activeEditor.setContent(content);   // Set actual MCE editing text
    tinyMCE.activeEditor.setDirty(true);        // Allow saving this restored text
}

function starteditor(opts={}) {
    /*
    Start TinyMCE editor
    opts = {
        savecb(content) => void: Callback on saving
        ... other tiny initialization options to override defaults
        }
     */
    	savecb = opts.savecb;
    	delete opts.savecb;
    tinydefaults = {
        selector: '#mytextarea',
        menubar: "true",
        plugins: [ "save",
            'advlist autolink lists link image charmap print preview anchor',
            'searchreplace visualblocks code fullscreen',
            'insertdatetime media table contextmenu paste code' ],
        toolbar: 'save | undo redo | insert | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image',
        save_onsavecallback: () => savecb(tinyMCE.get('mytextarea').getContent())  // This function must be provided
    };
    tinymce.init(Object.assign(tinydefaults, opts));
}

function updateElement(el, attrs, children) {
    /*
    el:         Element to be updated
    attrs:      To set on el
    children:   To replace existing children (a series of arguments, which can be arrays)
     */
    el = elementFrom(el);
    deletechildren(el);
    const kids = Array.prototype.slice.call(arguments).slice(2);
    return buildoutElement(el, el.tagName, attrs, kids);
}

// This comes from archive/ReactFake.js
function createElement(tag, attrs, children) {        // Note arguments is set to tag, attrs, child1, child2 etc
    /* Replaces React's createElement - has a number of application specific special cases
        <img src=ArchiveFile(...)> replaced by <div><img x-=u>

     */

    /* First we handle cases where we dont actually build the tag requested */

    const kids = Array.prototype.slice.call(arguments).slice(2);

    /* Special cases go here - see examples in archive/ReactFake.js---- */
    return buildoutElement(document.createElement(tag), tag, attrs, kids);
}
function buildoutElement(element, tag, attrs, kids) {
    /* Build out a created element adding Attributes and Children
    tag:    Lower case string of element e.g. "img"
    attrs:  Object {attr: value}
    kids:   Array of children
    /* This is called back by loadImg after creating the tag. */
    for (let name in attrs) {
        const attrname = (name.toLowerCase() === "classname" ? "class" : name); // support Reacts "classname"
        if (name === "dangerouslySetInnerHTML") {
            element.innerHTML = attrs[name]["__html"];
            delete attrs.dangerouslySetInnerHTML;
        }
        /*
        // Turn relative URLS in IMG and A into absolute urls - ideally these are also caught by special cases
        if (["img.src", "a.href"].includes(tag + "." + name) && (typeof attrs[name] === "string") && attrs[name].startsWith('/')) {
            if (!React._config.root) console.error("Need to React.config({root: 'https://xyz.abc'");
            attrs[name] = React._config.root + attrs[name];  // e.g. /foo => https://bar.com/foo
        }
        */
        /* Special cases go here - see examples in archive/ReactFake.js---- */
        if (name && attrs.hasOwnProperty(name)) {
            let value = attrs[name];
            if (value === true) {
                element.setAttribute(attrname, name);
            } else if (typeof value === "object" && !Array.isArray(value) && attrname !== "source") {
                // Could also test value.__proto__ !== ({}).__proto__ to only allow plain (not subclassed) objects
                // e.g. style: {{fontSize: "124px"}} but not things like Domains or SmartDicts
                for (let k in value) {
                    element[attrname][k] = value[k];
                }
            } else if (typeof value === "object" && !Array.isArray(value) && attrname === "source") {
                element[attrname] = attrs[name]; // Cant use setAttribute to set a non-attribute to an object.
            } else if (value !== false && value != null) {
                element.setAttribute(attrname, value.toString());
            }
        }
    }
    // Add each of the subdomains
    for (let i = 0; i < kids.length; i++) {
        const child = kids[i];
        if (!child) {
        } else if (Array.isArray(child)) {
            child.map((c) => element.appendChild(c.nodeType == null ?
                document.createTextNode(c.toString()) : c))
        }
        else {
            element.appendChild(
                child.nodeType == null ?
                    document.createTextNode(child.toString()) : child);
        }
    }
    return element;
}
