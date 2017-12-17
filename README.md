# domglue

A simple, unobtrusive view layer that utilizes the DOM instead of using
a custom template language.

It can render a part of the live DOM or use template strings containing HTML or XML.
Elements with variable content are marked with a `data-key` attribute. Each `data-key`
attribute has as its value a key in the data which is used to render the template or update
the DOM.

The `data-key`'s can form a hierarchy. For example, take the following DOM snippet:

```html
<div data-key="item">
    <h2 data-key="title">???</h2>
    <div data-key="body">...</div>
</div>
```

This snippet can be populated with the following data:

```javascript
{
    item: {
        title: "Foo",
        body: "Lorem ipsum dolor sit amet."
    }
}
```

The result will be:

```html
<div data-key="item">
    <h2 data-key="title">Foo</h2>
    <div data-key="body">Lorem ipsum dolor sit amet.</div>
</div>
```

Of course you can also manipulate attributes. This is done by prepending a key in the data
with an `@` character. So if we have this DOM fragment:

```html
<input data-key="input" name="?" type="text" placeholder="?" value="?" />
```

We can fill the attributes with data such as this:

```javascript
{
    input: {
        "@name": "myInput",
        "@placeholder": "Insert text",
        "@value": "Default value"
    }
}
```

Of course it also works with both attributes and sub-keys:

```html
<div data-key="item">
    <div data-key="title"></div>
</div>
```

```javascript
{
    item: {
        "@class": "some-class",
        "title": "The title!"
    }
}
```

This results in:

```html
<div data-key="item" class="some-class">
    <div data-key="title">The title!</div>
</div>
```

And if you want to update both an element's attributes and its content, the `*` special
key can be used:

```javascript
{
    item: {
        title: {
            "*": "Heading",
            "@title": "It's got a title, too!"
        }
    }
}
```

To remove an attribute, simply update it with an empty string:

```javascript
{
    title: {
        "@title": ""
    }
}
```

If you don't want to *replace* the value of an attribute, you can use the `+` operator
to append to the value instead:

```javascript
{
    title: {
        "+@title": " And now the title is even longer!"
    }
}
```

This works with the content of an element, too:

```javascript
{
    title: {
        "+*": ", obviously"
    }
}
```

In the same fashion, you can prepend content or attribute values by using the
`^` operator instead of the `+` operator.

## Manipulating classLists

Because just appending or prepending class strings to an existing class attribute can lead
to unexpected results, domglue has the following operators to manipulate classes:

 * `+.`: adds all the classes that are in the data value but not in the current attribute value
 * `-.`: removes all the classes in the data value from the current attribute value

For example, removing the classes `foo` and `bar` from an element and adding `biz` could
look like this in your data:

```javascript
{
    title: {
        "-.@class": "foo bar",
        "+.@class": "biz"
    }
}
```

## Working with lists

Since domglue just fills in data in the DOM and doesn't support any loops or logic on its own,
how do you handle lists? Well, it's pretty straightforward actually -- you use a little bit of
JS and domglue templates for that:

```html
<body>
    <h1 data-key="title"></h1>
    <ul data-key="names">
        
    </ul>
</body>
```

```javascript
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
```

Resulting DOM:

```html
<body>
    <h1 data-key="title">Names</h1>
    <ul data-key="names">
        <li data-key="name">Fizz</li>
        <li data-key="name">Buzz</li>
    </ul>
</body>
```

Why is this preferable to having logic in your HTML? Because the logic is written in JS
and is fully testable.


## Installation

    npm install --save domglue

## API

```javascript
var glue = require("domglue");
```

### [function] live

```javascript
var view = glue.live(element)
```

Creates a domglue view for an element. Returns an object with the following methods.

#### [method] update

```javascript
view.update(data, raw)
```

Updates the view with `data`. If `raw` is `true`, HTML can be inserted using the values.

Please note: `raw` is only used when `true` and not just a truthy value. This is because
this way the method is compatible with array methods like `.forEach`.

#### [method] render

```javascript
view.render(data, raw)
```

Updates the view with `data` and removes all elements with keys that are not contained
within `data`. If `raw` is `true`, HTML can be inserted using the values.

Please note: `raw` is only used when `true` and not just a truthy value. This is because
this way the method is compatible with array methods like `.forEach`.


#### [method] get

```javascript
view.get(key, attribute)
```

Returns the value for a key. If more than one element bears the key, only the first value is
returned. If parameter `attribute` is present, the value of the attribute with that name
is returned instead of the element's content.

#### [method] getAll

```javascript
view.getAll(key, attribute)
```

Same as the `get` method, but returns an array containing the values of **all** elements/attributes
with the given key.

#### [method] destroy

```javascript
view.destroy()
```

Destroys the view and cleans up references to the DOM element.

### [function] template

```javascript
var template = glue.template(content)
```

Creates a domglue template.

#### [method] render

```javascript
template.render(data, raw?)
```

Renders the template using `data` and returns the result as a string.
Removes elements that with keys that don't exist in `data`. If `raw`
is `true`, HTML content can be used as values.

Please note: `raw` is only used when `true` and not just a truthy value. This is because
this way the method is compatible with array methods like `.forEach`.


#### [method] fill

```javascript
template.fill(data, raw?)
```

Same as `.render`, but doesn't remove elements.

Please note: `raw` is only used when `true` and not just a truthy value. This is because
this way the method is compatible with array methods like `.forEach`.


## Configure the API

Not satisfied with how the DOM is accessed or what operators are available?
Want to use domglue with Node.js?
Then you can tweak domglue like this:

```javascript
var fs = require("fs");
var path = require("path");
var Dom = require("jsdom").JSDOM;
var configure = require("domglue/configure");

var dom = new Dom(fs.readFileSync(path.join(__dirname, "data.xml")));
var document = dom.window.document;

// FYI: This is to show what's possible, not something that necessarily makes sense.
var glue = configure({
    keyAttribute: "data-id", // rename data-key
    keyToSelector: keyToTagName, // change how keys and selectors relate
    operators: {
        "~#": toggleClasses
    },
    markers: {
        attribute: ":", // instead of @
        elementContent: "_" // instead of *
    }
}, document);

function toggleClasses(oldValue, newValue) {
    
    var all = oldValue.split(" ");
    var next = newValue.split(" ");
    
    next.forEach(function (className) {
        if (all.indexOf(className) >= 0) {
            all.splice(all.indexOf(className), 1);
        }
        else {
            all.push(className);
        }
    });
    
    return all.join(" ");
}

function keyToTagName(key) {
    return key;
}
```

## Run the tests

To run the tests, you need to have [mocha](https://mochajs.org) installed globally.
Also, don't forget to install the dev dependencies.

Then you can run all the tests with:

    npm run test
