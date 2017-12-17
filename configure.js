//
// # domglue
//
// A simple, unobtrusive view layer that utilizes the DOM instead of using
// a custom template language.
//

var clone = require("clone");

var DEFAULTS = require("./defaults");

function isObject(thing) {
    return thing !== null && typeof thing === "object";
}

function eachInObject(obj, fn) {
    for (var key in obj) {
        fn(obj[key], key, obj);
    }
}

function each(collection, fn) {
    return Array.prototype.forEach.call(collection, fn);
}

function contains(collection, item) {
    return collection.indexOf(item) >= 0;
}

function containsChar(text, char) {
    return text.split(char).length > 1;
}

function toArray(thing) {
    return Array.prototype.slice.call(thing);
}

//
// The `configure` function allows you to configure the domglue API to fit your needs.
//
// Arguments:
//
// * `options`: An object specifying the configurable options of the API. Missing options are
//   filled in with the values found in `domglue/defaults`.
//  * `.keyAttribute`: The attribute that identifies elements of interest (default: `data-key`).
//  * `.keyToSelector`: A function for matching keys to selectors.
//    Defaults to using `.keyAttribute`.
//  * `.operators`: The operator functions to use for manipulating attribute and element values.
//  * `.markers`: The markers in selectors for attributes (default: `@`) and element content
//    (default: `*`).
//
function create(options, doc) {
    
    doc = doc || document;
    options = clone(options || DEFAULTS);
    options.keyAttribute = options.keyAttribute || DEFAULTS.keyAttribute;
    options.operators = options.operators || DEFAULTS.operators;
    options.markers = options.markers || DEFAULTS.markers;
    options.markers.attribute = options.markers.attribute || DEFAULTS.markers.attribute;
    options.keyToSelector = options.keyToSelector || keyToSelector;
    
    options.markers.elementContent =
        options.markers.elementContent || DEFAULTS.markers.elementContent;
    
    function isAttributeSelector(selector) {
        return containsChar(selector, options.markers.attribute);
    }
    
    function isElementContentSelector(selector) {
        return containsChar(selector, options.markers.elementContent);
    }
    
    //
    // A function that inserts variable values into `element`'s ancestors if they have a `data-key`
    // attribute that references an existing item in the data.
    //
    // The function returns an array of all manipulated elements.
    //
    function insertVars(element, data, raw, touched) {
        
        touched = touched || [];
        
        eachInObject(data, function (item, selector) {
            if (isAttributeSelector(selector)) {
                processAttribute(item, selector);
            }
            else if (isElementContentSelector(selector)) {
                processElementContent(item, selector);
            }
            else {
                processElement(item, selector);
            }
        });
        
        function processElementContent(value, selector) {
            
            var parts = selector.split(options.markers.elementContent);
            var operator = parts[0];
            var property = raw === true ? "innerHTML" : "textContent";
            
            if (operator in options.operators) {
                element[property] = options.operators[operator](element.textContent, value);
            }
            else {
                element[property] = value;
            }
        }
        
        function processAttribute(value, selector) {
            
            var parts = selector.split(options.markers.attribute);
            var operator = parts[0];
            var attribute = parts[1];
            
            if (!contains(touched, element)) {
                touched.push(element);
            }
            
            if (value) {
                if (operator) {
                    if (operator in options.operators) {
                        element.setAttribute(
                            attribute, 
                            options.operators[operator](element.getAttribute(attribute), value)
                        );
                    }
                }
                else {
                    element.setAttribute(attribute, value);
                }
            }
            else if (element.hasAttribute(attribute)) {
                element.removeAttribute(attribute);
            }
        }
        
        function processElement(item, key) {
            
            var targets = findAllByKey(element, key);
            var property = raw === true ? "innerHTML" : "textContent";
            
            each(targets, function (target) {
                
                touched.push(target);
                
                if (isObject(item)) {
                    insertVars(target, item, raw, touched);
                }
                else {
                    target[property] = item;
                }
            });
        }
        
        return touched;
    }
    
    //
    // We find out which elements must be removed by collecting all elements which have
    // been manipulated ("touched") in the other functions.
    //
    function removeMissingKeys(element, touched) {
        
        var all = findAll(element);
        
        Array.prototype.filter.call(all, function (item) {
            return !contains(touched, item);
        }).forEach(function (item) {
            item.parentNode.removeChild(item);
        });
    }
    
    function live(element) {
        
        function update(data, raw) {
            insertVars(element, data, raw);
        }
        
        function render(data, raw) {
            removeMissingKeys(element, insertVars(element, data, raw));
        }
        
        function get(key, attribute) {
            
            var target = findOneByKey(element, key);
            
            if (!target) {
                return undefined;
            }
            
            return (attribute ? target.getAttribute(attribute) : target.textContent);
        }
        
        function getAll(key, attribute) {
            
            var elements = findAllByKey(element, key);
            
            return Array.prototype.map.call(elements, function (item) {
                return (attribute ? item.getAttribute(attribute) : item.textContent);
            });
        }
        
        function findOnePublic(key) {
            return findOneByKey(element, key);
        }
        
        function findAllPublic(key) {
            return key ? findAllByKey(element, key) : findAll(element);
        }
        
        function destroy() {
            element = null;
        }
        
        return {
            render: render,
            update: update,
            get: get,
            getAll: getAll,
            find: findOnePublic,
            findAll: findAllPublic,
            destroy: destroy
        };
    }
    
    function templateToElement(template, document) {
        
        var container = document.createElement("div");
        
        container.innerHTML = template;
        
        return container;
    }
    
    function elementToTemplate(element) {
        return element.innerHTML;
    }
    
    function template(templateContent) {
        
        var blueprint = "" + templateContent;
        
        function render(data, raw) {
            return insert("render", data, raw);
        }
        
        function fill(data, raw) {
            return insert("update", data, raw);
        }
        
        function insert(type, data, raw) {
            
            var content;
            var element = templateToElement(blueprint, doc);
            var view = live(element);
            
            view[type](data, raw);
            
            content = elementToTemplate(element);
            
            view.destroy();
            
            return content;
        }
        
        return {
            fill: fill,
            render: render
        };
    }
    
    function findAll(element) {
        return toArray(element.querySelectorAll("[" + options.keyAttribute + "]"));
    }
    
    function findOneByKey(element, key) {
        return element.querySelector(options.keyToSelector(key));
    }
    
    function findAllByKey(element, key) {
        return toArray(element.querySelectorAll(options.keyToSelector(key)));
    }
    
    function keyToSelector(key) {
        return "[" + options.keyAttribute + "='" + key + "']";
    }
    
    return {
        live: live,
        template: template
    };
}

module.exports = create;
