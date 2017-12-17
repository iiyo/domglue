
var operators = {
    "+": append,
    "^": prepend,
    "+.": addClasses,
    "-.": removeClasses
};

function append(currentValue, newValue) {
    return "" + currentValue + newValue;
}

function prepend(currentValue, newValue) {
    return "" + newValue + currentValue;
}

function addClasses(current, classes) {
    
    current = current.split(" ").filter(truthy);
    classes = classes.split(" ").filter(truthy);
    
    return current.concat(classes.filter(negate(contains.bind(null, current)))).join(" ");
    
}

function removeClasses(current, classes) {
    
    var doesntContain = negate(contains.bind(null, classes.split(" ").filter(truthy)));
    
    return current.split(" ").filter(truthy).filter(doesntContain).join(" ");
}

function contains(container, thing) {
    return container.indexOf(thing) >= 0;
}

function truthy(thing) {
    return !!thing;
}

function negate(fn) {
    return function () {
        return !fn.apply(null, arguments);
    };
}

module.exports = operators;
