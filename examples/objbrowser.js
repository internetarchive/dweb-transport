/* Script to enable debugging objects */
function objbrowser(self, url, path, ul, verbose) {
    if (verbose) { console.log("objbrowser url=",url,"path=",path,"ul=",ul,"verbose=",verbose) }
    let urlpath = path ? [url, path].join("/") : url;
    // ul is either the id of the element, or the element itself.
    if (typeof ul === 'string') {
        ul = document.getElementById(ul);
        console.assert(ul,"Couldnt find ul:",ul)
    }
    //while (ul.firstChild) { ul.removeChild(ul.firstChild); }
    let li = document.createElement("li");
    li.source = self;
    li.className = "propobj";
    ul.appendChild(li);
    //li.innerHTML = "<B>SmartDict:</B>" + urlpath;
    let t1 = document.createTextNode(self.constructor.name+": "+urlpath);
    let sp1 = document.createElement('span');
    sp1.className = "classname"; // Confusing!, sets the className of the span to "classname" as it holds a className
    sp1.appendChild(t1);
    li.appendChild(sp1);

    //Loop over dict fields
    let ul2 = document.createElement("ul");
    ul2.className="props";
    li.appendChild(ul2);
    //noinspection JSUnfilteredForInLoop
    for (let prop in self) {
        //noinspection JSUnfilteredForInLoop
        if (self[prop]) {
            //noinspection JSUnfilteredForInLoop
            let text = self[prop].toString();
            if (text !== "" && prop !== "_url") {    // Skip empty values; _url (as shown above);
                let li2 = document.createElement("li");
                li2.className='prop';
                ul2.appendChild(li2);
                //li2.innerHTML = "Field1"+prop;
                //noinspection JSUnfilteredForInLoop
                let fieldname = document.createTextNode(prop);
                let spanname = document.createElement('span');
                spanname.appendChild(fieldname);
                spanname.className='propname';
                //TODO - handle Links by nested list
                li2.appendChild(spanname);
                //noinspection JSUnfilteredForInLoop
                if ( ["links", "_list", "_signatures", "_current", "data", "keypair"].includes(prop) ) { //<span>...</span><ul proplinks>**</ul>
                    let spanval;
                    spanval = document.createElement('span');
                    spanval.appendChild(document.createTextNode("..."));
                    li2.appendChild(spanval);
                    let ul3 = document.createElement("ul");
                    ul3.className = "proplinks";
                    ul3.style.display = 'none';
                    spanname.setAttribute('onclick',"objbrowsertogglevisnext(this);");
                    //spanname.setAttribute('onclick',"console.log(self.nextSibling)");

                    li2.appendChild(ul3);
                    //TODO make this a loop
                    //noinspection JSUnfilteredForInLoop
                    if (Array.isArray(self[prop])) {
                        //noinspection JSUnfilteredForInLoop
                        for (let l1 in self[prop]) {
                            //noinspection JSUnfilteredForInLoop,JSUnfilteredForInLoop,JSUnfilteredForInLoop,JSUnfilteredForInLoop
                            objbrowser(self[prop][l1], url, (path ? path + "/":"")+self[prop][l1].name, ul3, verbose);
                        }
                    } else {
                        //noinspection JSUnfilteredForInLoop
                        if (self[prop]._url) { //TODO-MULTI
                            //noinspection JSUnfilteredForInLoop,JSUnfilteredForInLoop
                            objbrowser(self[prop], self[prop]._url, null, ul3, verbose)
                        } else {
                            //noinspection JSUnfilteredForInLoop
                            objbrowser(self[prop], url, path, ul3, verbose);
                        }
                    }
                } else {    // Any other field
                    let spanval;
                    if (["url","_publicurl","signedby"].includes(prop)) { //TODO-MULTI
                        //noinspection ES6ConvertVarToLetConst
                        spanval = document.createElement('span');
                        //noinspection JSUnfilteredForInLoop
                        spanval.source = self[prop];
                        li2.setAttribute('onclick', 'p_objbrowserfetch(this.childNodes[1]);');
                        //TODO next line wont actually work on IPFS, need way to retrieve from link here
                        //spanval.setAttribute('href', '/file/b/' + self[prop] + "?contenttype=" + self["Content-type"]);
                    } else {
                        // Group of fields where display then add behavior or something
                        //noinspection ES6ConvertVarToLetConst
                        spanval = document.createElement('span');
                    }
                    //noinspection JSUnfilteredForInLoop
                    let val = (typeof self[prop] === "object") ? JSON.stringify(self[prop],null,'\t ') : self[prop];
                    spanval.appendChild(document.createTextNode(val));
                    //console.log(val);
                    spanval.className='propval';
                    li2.appendChild(spanval);
                }
                //self.__setattr__(prop, dict[prop]);
            }
        }
    }

}
function objbrowsertogglevisnext(elem) {   // Hide the next sibling object and show the one after, or vica-versa,
    let el1 = elem.nextSibling;
    let el2 = el1.nextSibling;
    if (el1.style.display === "none") {
        el1.style.display = "";
        el2.style.display = "none";
    } else {
        el1.style.display = "none";
        el2.style.display = "";
    }
}
function p_objbrowserfetch(el) {
    // This attached as an onclick method of something so that when clicked it will replace itself with a expanded objbrowser version
    let verbose = false;
    let source = el.source;
    let parent = el.parentNode;
    parent.removeChild(el); //Remove elem from parent
    if (typeof source === "string") {
        return Dweb.SmartDict.p_fetch(source, verbose) //TODO-MULTI use urls plural
            .then((obj) => objbrowser(obj, obj._url, null, parent, false));
    } else {
        return objbrowser(source, source._url, null, parent, false); //TODO its possible this needs to be a promise
    }
}
