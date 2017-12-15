
var operators = {
    "+": append,
    "^": prepend
};

function append(currentValue, newValue) {
    return "" + currentValue + newValue;
}

function prepend(currentValue, newValue) {
    return "" + newValue + currentValue;
}

module.exports = operators;
