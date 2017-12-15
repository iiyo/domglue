
var operators = {
    "+": append
};

function append(currentValue, newValue) {
    return "" + currentValue + newValue;
}

module.exports = operators;
