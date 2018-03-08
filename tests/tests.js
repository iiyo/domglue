/* global describe, it, beforeEach, __dirname */

var fs = require("fs");
var path = require("path");
var assert = require("assert");
var Dom = require("jsdom").JSDOM;

var configure = require("../configure");
var operators = require("../operators");

var LIVE_METHODS = ["render", "update", "get", "getAll", "find", "findAll", "destroy"];
var TEMPLATE = fs.readFileSync(path.join(__dirname, "/template.html"));
var XML_CONTENT = fs.readFileSync(path.join(__dirname, "/test.xml"));

function qs(element, selector) {
    return element.querySelector(selector);
}

describe("domglue", function () {
    
    describe(".live(element)", function () {
        
        var view, simple, testDoc, domglue;
        
        beforeEach(function () {
            testDoc = new Dom(TEMPLATE).window.document;
            domglue = configure({}, testDoc);
            view = domglue.live(testDoc.getElementById("container"));
            simple = domglue.live(testDoc.getElementById("simple"));
        });
        
        it("should create an object with methods as described in the docs", function () {
            
            assert(view, "result must be truthy");
            assert.equal(typeof view, "object", "result must be an object");
            
            LIVE_METHODS.forEach(function (name) {
                assert.equal(typeof view[name], "function", "must have a `" + name + "` method");
            });
        });
        
        describe(".render(data, raw)", function () {
            
            it("should fill in the `data` and remove elements with missing keys", function () {
                
                view.render({
                    title: "fruits",
                    data: {
                        oranges: {
                            small: "2",
                            big: "1"
                        }
                    }
                });
                
                simple.render({foo: "foo"});
                
                assert.equal(qs(testDoc, "[data-key='foo']").innerHTML, "foo");
                assert.equal(qs(testDoc, "[data-key='title']").innerHTML, "fruits");
                assert.equal(qs(testDoc, "[data-key='small']").innerHTML, "2");
                assert.equal(qs(testDoc, "[data-key='big']").innerHTML, "1");
                assert.equal(qs(testDoc, "[data-key='apples']"), null);
            });
            
            it("should remove attributes when the value is empty", function () {
                view.render({
                    data: {
                        apples: {
                            "@class": ""
                        }
                    }
                });
                assert.equal(qs(testDoc, "[data-key='apples']").hasAttribute("class"), false);
            });
            
            it("should fill in the content when the value is a string", function () {
                simple.render({
                    foo: "bars"
                });
                assert.equal(qs(testDoc, "[data-key='foo']").innerHTML, "bars");
            });
            
            it("should fill in the content of the parent when using `*`", function () {
                simple.render({
                    foo: {
                        "*": "bar"
                    }
                });
                assert.equal(qs(testDoc, "[data-key='foo']").innerHTML, "bar");
            });
            
            it("should delete children when the value is a string", function () {
                view.render({
                    data: "gone"
                });
                assert.equal(qs(testDoc, "[data-key='data']").innerHTML, "gone");
                assert.equal(qs(testDoc, "[data-key='apples']"), null);
            });
            
            it("should append to the content of the parent when using `+*`", function () {
                simple.render({
                    foo: {
                        "+*": "bar"
                    }
                });
                assert.equal(qs(testDoc, "[data-key='foo']").innerHTML, "bazbar");
            });
            
            it("should append to the HTML content of the parent when using `+*` raw", function () {
                simple.render({
                    foo: {
                        "+*": "<i>bar</i>"
                    }
                }, true);
                assert.equal(qs(testDoc, "[data-key='foo']").innerHTML, "baz<i>bar</i>");
            });
            
            it("should append to an attribute value when using `+@`", function () {
                view.render({
                    data: {
                        apples: {
                            "+@class": " c3"
                        }
                    }
                });
                assert.equal(qs(testDoc, "[data-key='apples']").getAttribute("class"), "c1 c2 c3");
            });
            
            it("should prepend the content of the parent when using `^*`", function () {
                simple.render({
                    foo: {
                        "^*": "bar"
                    }
                });
                assert.equal(qs(testDoc, "[data-key='foo']").innerHTML, "barbaz");
            });
            
            it("should prepend the HTML content of the parent when using `^*` raw", function () {
                simple.render({
                    foo: {
                        "^*": "<i>bar</i>"
                    }
                }, true);
                assert.equal(qs(testDoc, "[data-key='foo']").innerHTML, "<i>bar</i>baz");
            });
            
            it("should prepend an attribute value when using `^@`", function () {
                view.render({
                    data: {
                        apples: {
                            "^@class": "c0 "
                        }
                    }
                });
                assert.equal(qs(testDoc, "[data-key='apples']").getAttribute("class"), "c0 c1 c2");
            });
            
            it("should set an attribute value when using `@[name]`", function () {
                simple.render({
                    foo: {
                        "@title": "yes"
                    }
                });
                assert.equal(qs(testDoc, "[data-key='foo']").getAttribute("title"), "yes");
            });
            
            it("should add to an attribute value when using `+@[name]`", function () {
                simple.render({
                    foo: {
                        "+@title": " way"
                    }
                });
                assert.equal(qs(testDoc, "[data-key='foo']").getAttribute("title"), "no way");
            });
            
            it("should only insert HTML content when `raw` is true (not just truthy)", function () {
                
                simple.render({
                    foo: '<div class="test"></div>'
                });
                assert.equal(qs(testDoc, ".test"), null);
                
                simple.render({
                    foo: '<div class="test"></div>'
                }, "yeah");
                assert.equal(qs(testDoc, ".test"), null);
                
                simple.render({
                    foo: '<div class="test"></div>'
                }, true);
                assert(qs(testDoc, ".test"));
            });
            
            it("should insert content for ALL key matches, not only the first", function () {
                view.render({
                    data: {
                        oranges: {
                            small: "8",
                            big: "9"
                        }
                    }
                });
                assert.equal(qs(testDoc, ".oranges1 .small").innerHTML, "8");
                assert.equal(qs(testDoc, ".oranges2 .small").innerHTML, "8");
                assert.equal(qs(testDoc, ".oranges1 .big").innerHTML, "9");
                assert.equal(qs(testDoc, ".oranges2 .big").innerHTML, "9");
            });
            
        });
        
        describe(".update(data)", function () {
            
            it("should fill in the `data` and NOT remove elements with missing keys", function () {
                
                view.update({
                    title: "fruits",
                    data: {
                        oranges: {
                            small: "2",
                            big: "1"
                        }
                    }
                });
                
                simple.update({foo: "foo"});
                
                assert.equal(qs(testDoc, "[data-key='foo']").innerHTML, "foo");
                assert.equal(qs(testDoc, "[data-key='title']").innerHTML, "fruits");
                assert.equal(qs(testDoc, "[data-key='small']").innerHTML, "2");
                assert.equal(qs(testDoc, "[data-key='big']").innerHTML, "1");
                assert(qs(testDoc, "[data-key='apples']"));
            });
            
            it("should only insert HTML content when `raw` is true, not just truthy", function () {
                
                simple.update({
                    foo: '<div class="test"></div>'
                });
                assert.equal(qs(testDoc, ".test"), null);
                
                simple.update({
                    foo: '<div class="test"></div>'
                }, "yes");
                assert.equal(qs(testDoc, ".test"), null);
                
                simple.update({
                    foo: '<div class="test"></div>'
                }, true);
                assert(qs(testDoc, ".test"));
            });
            
        });
        
        describe(".get(key)", function () {
            
            it("should return the content of the first matching element", function () {
                assert.equal(view.get("apples"), "3");
                assert.equal(view.get("small"), "5");
            });
            
        });
        
        describe(".get(key, attribute)", function () {
            
            it("should return the value of the first matching element's attribute", function () {
                assert.equal(view.get("oranges", "class"), "oranges1");
                assert.equal(view.get("small", "class"), "small");
            });
            
        });
        
        describe(".getAll(key)", function () {
            
            it("should return the content of all matching elements in an array", function () {
                
                var values = view.getAll("bananas");
                
                assert(Array.isArray(values));
                assert.equal(values.length, 3);
                assert.equal(values[0], "yummy");
                assert.equal(values[1], "omnomnom");
                assert.equal(values[2], "sugoi");
            });
            
        });
        
        describe(".getAll(key, attribute)", function () {
            
            it("should return the attributes of all matching elements in an array", function () {
                
                var values = view.getAll("bananas", "title");
                
                assert(Array.isArray(values));
                assert.equal(values.length, 3);
                assert.equal(values[0], "b1");
                assert.equal(values[1], "b2");
                assert.equal(values[2], "b3");
            });
            
        });
        
        describe(".find(key)", function () {
            
            it("should return the first matching element", function () {
                assert.equal(view.find("bananas").innerHTML, "yummy");
                assert.equal(view.find("apples").innerHTML, "3");
            });
            
        });
        
        describe(".findAll(key)", function () {
            
            it("should return all matching elements", function () {
                
                var elements = view.findAll("bananas");
                
                assert(Array.isArray(elements));
                assert.equal(elements[0].innerHTML, "yummy");
                assert.equal(elements[0].innerHTML, "yummy");
                assert.equal(elements[0].innerHTML, "yummy");
            });
            
        });
        
        describe(".findAll()", function () {
            
            it("should return all elements with keys", function () {
                
                var elements = view.findAll();
                var comparison = testDoc.querySelectorAll("[data-key]");
                
                elements.forEach(function (element, index) {
                    assert.equal(element, comparison[index]);
                });
            });
            
        });
        
    });
    
    describe(".template(source)", function () {
        
        var testDoc, container, domglue, template, view, data;
        
        beforeEach(function () {
            
            testDoc = new Dom(TEMPLATE).window.document;
            domglue = configure({}, testDoc);
            container = testDoc.getElementById("container");
            template = domglue.template(container.innerHTML);
            view = domglue.live(container);
            
            data = data = {
                data: {
                    apples: "yuck?",
                    bananas: {
                        "*": "yay"
                    }
                }
            };
            
        });
        
        describe(".fill(data)", function () {
            
            it("should do the same as .update(), but return a filled template", function () {
                
                var viewResult;
                var templateResult = template.fill(data);
                
                view.update(data);
                
                viewResult = container.innerHTML;
                
                assert(templateResult);
                assert.equal(templateResult, viewResult);
            });
            
        });
        
        describe(".fillMany(data, raw, separator)", function () {
            
            it("should fill the template for each item in `data`, concat results", function () {
                
                var template = domglue.template('<i data-key="value"></i>');
                var templateResult = template.fillMany([{value: "a"}, {value: "b"}]);
                
                assert.equal(typeof templateResult, "string");
                assert.equal(templateResult, '<i data-key="value">a</i><i data-key="value">b</i>');
            });
            
            it("should fill in HTML when `raw` is true", function () {
                
                var template = domglue.template('<i data-key="value"></i>');
                
                var templateResult = template.fillMany([
                    {value: "<a>a</a>"},
                    {value: "<b>b</b>"}
                ], true);
                
                assert.equal(typeof templateResult, "string");
                
                assert.equal(
                    templateResult,
                    '<i data-key="value"><a>a</a></i><i data-key="value"><b>b</b></i>'
                );
            });
            
            it("should concat results with `separator` if given", function () {
                
                var template = domglue.template('<i data-key="value"></i>');
                
                var templateResult = template.fillMany(
                    [{value: "a"}, {value: "b"}],
                    false,
                    "<br />"
                );
                
                assert.equal(typeof templateResult, "string");
                
                assert.equal(
                    templateResult,
                    '<i data-key="value">a</i><br /><i data-key="value">b</i>'
                );
            });
            
        });
        
        describe(".render(data)", function () {
            
            it("should do the same as live.render(), but return a filled template", function () {
                
                var viewResult;
                var templateResult = template.render(data);
                
                view.render(data);
                
                viewResult = container.innerHTML;
                
                assert(templateResult);
                assert.equal(templateResult, viewResult);
            });
            
        });
        
        describe(".renderMany(data, raw, separator)", function () {
            
            it("should fill the template for each item in `data`, concat results", function () {
                
                var template = domglue.template('<i data-key="value"></i>');
                var templateResult = template.renderMany([{}, {value: "b"}]);
                
                assert.equal(typeof templateResult, "string");
                assert.equal(templateResult, '<i data-key="value">b</i>');
            });
            
            it("should fill in HTML when `raw` is true", function () {
                
                var template = domglue.template('<i data-key="value"></i>');
                
                var templateResult = template.renderMany([
                    {value: "<a>a</a>"},
                    {}
                ], true);
                
                assert.equal(typeof templateResult, "string");
                
                assert.equal(
                    templateResult,
                    '<i data-key="value"><a>a</a></i>'
                );
            });
            
            it("should concat results with `separator` if given", function () {
                
                var template = domglue.template('<i data-key="value"></i>');
                
                var templateResult = template.renderMany(
                    [{value: "a"}, {}, {value: "c"}],
                    false,
                    "<br />"
                );
                
                assert.equal(typeof templateResult, "string");
                
                assert.equal(
                    templateResult,
                    '<i data-key="value">a</i><br /><br /><i data-key="value">c</i>'
                );
            });
            
        });
        
    });
    
});

describe("domglue/configure", function () {
    
    var testDoc;
    
    beforeEach(function () {
        testDoc = new Dom(XML_CONTENT).window.document;
    });
    
    it("should work with tag name selectors, ! for attribute, $ for content", function () {
        
        var domglue = configure({
            keyToSelector: function (key) {
                return key;
            },
            markers: {
                attribute: "!",
                elementContent: "$"
            }
        }, testDoc);
        
        var view = domglue.live(qs(testDoc, "person"));
        
        view.render({
            names: {
                forename: "Jane",
                surename: {
                    "$": "Doe"
                }
            },
            gender: {
                "!type": "f"
            }
        });
        
        assert.equal(qs(testDoc, "forename").textContent, "Jane");
        assert.equal(qs(testDoc, "surename").textContent, "Doe");
        assert.equal(qs(testDoc, "gender").getAttribute("type"), "f");
        
    });
    
});

describe("domglue/operators", function () {
    
    describe("+.", function () {
        
        it("should add one class string to another, omitting duplicates", function () {
            assert.equal(operators["+."]("foo bar", "baz foo biz boo"), "foo bar baz biz boo");
        });
        
        it("shouldn't fail with empty strings for either argument", function () {
            assert.equal(operators["+."]("", "foo biz"), "foo biz");
            assert.equal(operators["+."]("foo biz", ""), "foo biz");
            assert.equal(operators["+."]("", ""), "");
        });
        
        it("should normalize spaces", function () {
            assert.equal(operators["+."](" foo   bar  baz  ", " foo  biz  "), "foo bar baz biz");
            assert.equal(operators["+."]("   ", "    "), "");
        });
        
    });
    
    describe("-.", function () {
        
        it("should remove classes that are present in both class strings", function () {
            assert.equal(operators["-."]("foo bar baz", "baz foo biz boo"), "bar");
            assert.equal(operators["-."]("foo bar baz", "bar biz boo"), "foo baz");
        });
        
        it("shouldn't fail with empty strings for either argument", function () {
            assert.equal(operators["-."]("", "foo biz"), "");
            assert.equal(operators["-."]("foo biz", ""), "foo biz");
            assert.equal(operators["-."]("", ""), "");
        });
        
        it("should normalize spaces", function () {
            assert.equal(operators["-."](" foo   bar  baz  ", " foo  biz  "), "bar baz");
            assert.equal(operators["-."]("   ", "    "), "");
        });
        
    });
    
});
