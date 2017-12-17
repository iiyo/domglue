/* global __dirname */
/* eslint-disable no-console */

var fs = require("fs");
var path = require("path");
var Dom = require("jsdom").JSDOM;
var configure = require("../../configure");
var html = "" + fs.readFileSync(path.join(__dirname, "/document.html"));
var dom = new Dom(html);
var document = dom.window.document;
var domglue = configure({}, document);

var view = domglue.live(document.body);
var template = domglue.template('<li data-key="name"></li>');

var items = [
    {
        name: "Fizz"
    },
    {
        name: "Buzz"
    }
];

view.update({
    title: "Names",
    names: items.map(template.fill).join("") // no `bind`: `this` is never used in domglue
}, true);

console.log(dom.serialize());
