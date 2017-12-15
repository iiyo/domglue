/* global describe, it, beforeEach, __dirname */

var fs = require("fs");
var path = require("path");
var assert = require("assert");
var Dom = require("jsdom").JSDOM;

var configure = require("../configure");

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
            
            it("should only insert HTML content when `raw` is true", function () {
                simple.render({
                    foo: '<div class="test"></div>'
                });
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
            
            it("should only insert HTML content when `raw` is true", function () {
                simple.update({
                    foo: '<div class="test"></div>'
                });
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
