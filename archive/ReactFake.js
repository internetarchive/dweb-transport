/*
Based on https://stackoverflow.com/questions/30430982/can-i-use-jsx-without-react-to-inline-html-in-script
I wanted this because React was doing nasty things at run-time (like catching events) and stopping Search box working

This expanded in use to make it easier to use HTML in as unchanged form from existing react in particular.
- URLs in image tags are re-rooted, i.e. <img src="/foo"> => <img src="https://bar.com/foo">
- look at onClick's especially if set window.location
 */

function deletechildren(el, keeptemplate) { //TODO-DETAILS-REACT copied from htmlutils, maybe include that instead
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

export default class React  {
    static config(options) {
        /*
            Configure ReachFake

            root: protocol and host to insert before URLs (currently in img tags only) e.g. "https://archive.org"
         */
        for (x of options) React._config[x] = options[x];
    }
    static createElement(tag, attrs, children) {        // Note arguments is set to tag, attrs, child1, child2 etc
        var element = document.createElement(tag);
        for (let name in attrs) {
            let attrname = (name.toLowerCase() === "classname" ? "class" : name);
            if (name === "dangerouslySetInnerHTML") {
                element.innerHTML = attrs[name]["__html"];
                delete attrs.dangerouslySetInnerHTML;
            }
            if (["img.src", "a.href"].includes(tag+"."+name) && attrs[name].startsWith('/')) {
                if (!React._config.root) console.error("Need to React.config({root: 'https://xxx.yyy'");
                attrs[name] = React._config.root + attrs[name];  // e.g. /foo => https://bar.com/foo
                console.log("XXX@43",attrs[name])
            }
            if (name && attrs.hasOwnProperty(name)) {
                let value = attrs[name];
                if (value === true) {
                    element.setAttribute(attrname, name);
                } else if (typeof value === "object" && !Array.isArray(value)) { // e.g. style: {{fontSize: "124px"}}
                    for (let k in value) {
                        element[attrname][k] = value[k];
                    }
                } else if (value !== false && value != null) {
                    element.setAttribute(attrname, value.toString());
                }
            }
        }
        for (let i = 2; i < arguments.length; i++) {
            let child = arguments[i];
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
    static domrender(els, node) {
        deletechildren(node, false);
        node.appendChild(els);
    }
};

//Default configuration
React.config = {
    root: "https://archive.org",
}