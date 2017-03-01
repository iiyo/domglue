//
// # DOMGlue
//
// DOMGlue is a simple, unobtrusive view layer that utilizes the DOM instead of using
// a custom template language.
//
var KEY_ATTRIBUTE = "data-key";

function isObject (thing) {
    return thing !== null && typeof thing === "object";
}

function eachInObject (obj, fn) {
    for (var key in obj) {
        fn(obj[key], key, obj);
    }
}

function each (collection, fn) {
    return Array.prototype.forEach.call(collection, fn);
}

function contains (collection, item) {
    return collection.indexOf(item) >= 0;
}

//
// A function that inserts variable values into `element`'s ancestors if they have a `data-key`
// attribute that references an existing item in the data.
//
// The function returns an array of all manipulated elements.
//
function insertVars (element, data, touched) {
    
    touched = touched || [];
    
    eachInObject(data, function (item, selector) {
        
        var parts = selector.split("@");
        var key = parts[0];
        var attribute = parts[1];
        
        if (attribute) {
            processAttribute(attribute, item);
        }
        else {
            processElement(key, item);
        }
    });
    
    function processAttribute (attribute, value) {
        
        if (!contains(touched, element)) {
            touched.push(element);
        }
        
        if (value) {
            element.setAttribute(attribute, value);
        }
        else if (element.hasAttribute(attribute)) {
            element.removeAttribute(attribute);
        }
    }
    
    function processElement (key, item) {
        
        var targets = element.querySelectorAll("[" + KEY_ATTRIBUTE + "='" + key + "']");
        
        each(targets, function (target) {
            
            touched.push(target);
            
            if (isObject(item)) {
                insertVars(target, item, touched);
            }
            else {
                target.textContent = item;
            }
        });
    }
    
    return touched;
}

//
// We find out which elements must be removed by collecting all elements which have
// been manipulated ("touched") in the other functions.
//
function removeMissingKeys (element, touched) {
    
    var all = element.querySelectorAll("[" + KEY_ATTRIBUTE + "]");
    
    Array.prototype.filter.call(all, function (item) {
        return !contains(touched, item);
    }).forEach(function (item) {
        item.parentNode.removeChild(item);
    });
}

function live (element) {
    
    function update (data) {
        insertVars(element, data);
    }
    
    function render (data) {
        removeMissingKeys(element, insertVars(element, data));
    }
    
    function setOne (key, value) {
        
        var elements;
        
        elements = element.querySelectorAll("[" + KEY_ATTRIBUTE + "='" + key + "']");
        
        each(elements, function (item) {
            insertVars(item, value);
        });
    }
    
    function set (keyOrKeys, value, raw) {
        
        if (keyOrKeys && typeof keyOrKeys === "object") {
            eachInObject(keyOrKeys, function (value, key) {
                setOne(key, value, raw);
            });
        }
        else {
            setOne(keyOrKeys, value, raw);
        }
    }
    
    function setRaw (keyOrKeys, value) {
        set(keyOrKeys, value, true);
    }
    
    function get (selector) {
        
        var parts = selector.split("/");
        var key = parts[0];
        var attribute = parts[1];
        var element = element.querySelector("[" + KEY_ATTRIBUTE + "='" + key + "']");
        
        if (!element) {
            return undefined;
        }
        
        return (attribute ? element.getAttribute(attribute) : element.textContent);
    }
    
    function getAll (selector) {
        
        var parts = selector.split("/");
        var key = parts[0];
        var attribute = parts[1];
        var elements = element.querySelectorAll("[" + KEY_ATTRIBUTE + "='" + key + "']");
        
        return Array.prototype.map.call(elements, function (item) {
            return (attribute ? item.getAttribute(attribute) : item.textContent);
        });
    }
    
    function destroy () {
        element = null;
    }
    
    return {
        render: render,
        update: update,
        set: set,
        setRaw: setRaw,
        get: get,
        getAll: getAll,
        destroy: destroy
    };
}

function templateToElement (template) {
    
    var container = document.createElement("div");
    
    container.innerHTML = template;
    
    return container;
}

function elementToTemplate (element) {
    return element.innerHTML;
}

function template (templateContent) {
    
    var blueprint = "" + templateContent;
    
    function render (data) {
        
        var content;
        var element = templateToElement(blueprint);
        var view = live(element);
        
        view.render(data);
        
        content = elementToTemplate(element);
        
        view.destroy();
        
        return content;
    }
    
    return {
        render: render
    };
}

module.exports = {
    live: live,
    template: template
};
