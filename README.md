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

Creates a DOMGlue view for an element. Returns an object with the following methods.

#### [method] update

```javascript
view.update(data)
```

Updates the view with `data`.

#### [method] render

```javascript
view.render(data)
```

Updates the view with `data` and removes all elements with keys that are not contained
within `data`.

#### [method] get

```javascript
view.get(selector)
```

Returns the value for a key. If more than one element bears the key, only the first value is
returned. The parameter `selector` can be either just a key or a combination of a key and
an attribute:

    some_key/some_attribute

#### [method] getAll

```javascript
view.getAll(selector)
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

Creates a DOMGlue template.

#### [method] render

```javascript
template.render(data)
```

Renders the template using `data` and returns the result as a string.
Removes elements that with keys that don't exist in `data`.
