
var operators = require("./operators");

var DEFAULTS = {
    operators: operators,
    keyAttribute: "data-key",
    markers: {
        attribute: "@",
        elementContent: "*"
    }
};

module.exports = DEFAULTS;
