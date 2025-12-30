# Component DSL Reference

This document provides a comprehensive reference for pug-tail's component DSL.

## Table of Contents

- [Component Definition](#component-definition)
- [Component Calls](#component-calls)
- [Named Slots](#named-slots)
- [Props and Attrs](#props-and-attrs)
- [Attribute Fallthrough](#attribute-fallthrough)
- [Scope Isolation](#scope-isolation)
- [Advanced Patterns](#advanced-patterns)
- [Integration with Pug Features](#integration-with-pug-features)

## Component Definition

### Basic Syntax

```pug
component ComponentName()
  // component body
```

**Rules**:
- Component names must start with an uppercase letter
- Components are defined using the `component` keyword
- Component body can contain any valid Pug markup
- Components are block-scoped (defined where declared)

### Example

```pug
component Card()
  .card
    .card-header
      h2 Default Title
    .card-body
      p Default content
```

## Component Calls

### Basic Syntax

```pug
ComponentName()
```

**Rules**:
- Component calls look like function calls with uppercase names
- Arguments are passed as Pug attributes
- Child content is provided via slots

### With Arguments

```pug
component Button()
  - const { label, type = "button" } = $props
  button(type=type)= label

Button(label="Click me", type="submit")
Button(label="Cancel")  // Uses default type="button"
```

### With Slots

```pug
component Card()
  .card
    slot(header)
    slot(body)

Card()
  slot(header)
    h1 Title
  slot(body)
    p Content
```

## Named Slots

### Defining Slots

```pug
component Layout()
  header
    slot(header)
      p Default header
  
  main
    slot(main)
      p Default main content
  
  footer
    slot(footer)
      p Default footer
```

**Features**:
- `slot(name)` defines a named slot
- Content inside slot tag is the default (used if no content provided)
- Slots can be nested

### Using Slots

```pug
Layout()
  slot(header)
    h1 My Site
  
  slot(main)
    article
      p Main content
  
  slot(footer)
    p Copyright 2026
```

**Rules**:
- Slot names must match between definition and usage
- Slots can be provided in any order
- Unmatched slots use default content
- Extra slots (not defined) are ignored

### Nested Components and Slots

```pug
component Page()
  Layout()
    slot(header)
      slot(pageHeader)  // Expose slot to parent
    slot(main)
      slot(pageMain)

Page()
  slot(pageHeader)
    h1 Welcome
  slot(pageMain)
    p Content
```

## Props and Attrs

### $props - Component Properties

Props are explicitly declared properties that the component expects.

```pug
component Button()
  - const { label, type = "button", disabled = false } = $props
  button(type=type disabled=disabled)= label

Button(label="Submit", type="submit")
```

**Features**:
- Use JavaScript destructuring syntax
- Support default values
- Support renaming: `{ class: className }`
- Type-safe (values are passed as-is)

### $attrs - Additional Attributes

Attrs are all other attributes not declared in `$props`.

```pug
component Card()
  - const { title } = $props
  - const { class: className = "card" } = $attrs
  
  .card(class=className)
    h2= title

Card(title="Hello", class="custom-card", data-id="123")
// title → $props
// class, data-id → $attrs
```

**Automatic Categorization**:

pug-tail automatically splits component arguments:
1. Analyzes `$props` destructuring
2. Puts declared properties in `$props`
3. Puts everything else in `$attrs`

### Legacy attributes

The traditional `attributes` object still works:

```pug
component Card()
  - const { title, ...attrs } = attributes
  .card&attributes(attrs)
    h2= title

Card(title="Hello", class="custom")
```

**Recommendation**: Use `$props`/`$attrs` for new code. It's more explicit and follows Vue/React conventions.

## Attribute Fallthrough

### Automatic Fallthrough

By default, `$attrs` are automatically applied to the root element:

```pug
component Card()
  .card
    h2 Title

Card(class="my-card", id="card-1", data-test="value")
```

**Output**:
```html
<div class="card my-card" id="card-1" data-test="value">
  <h2>Title</h2>
</div>
```

**Rules**:
- Applies only to single root element
- Classes are merged (not replaced)
- Other attributes override component's attributes

### Disabling Automatic Fallthrough

Use `&attributes()` explicitly to control where attrs are applied:

```pug
component Input()
  .wrapper
    label Label
    input.field&attributes(attributes)

Input(type="text", class="primary")
```

**Output**:
```html
<div class="wrapper">
  <label>Label</label>
  <input class="field primary" type="text"/>
</div>
```

The explicit `&attributes(attributes)` disables automatic fallthrough to `.wrapper`.

### Using $attrs Explicitly

```pug
component Card()
  - const { title } = $props
  
  .card&attributes($attrs)
    h2= title

Card(title="Test", class="my-card")
```

Using `&attributes($attrs)` also disables automatic fallthrough.

### Multiple Root Elements

Automatic fallthrough is disabled with multiple root elements:

```pug
component Split()
  .left
    slot(left)
  .right
    slot(right)

Split(class="container")
// class="container" is NOT applied (multiple roots)
```

**Workaround**:
```pug
component Split()
  - const { class: className } = $attrs
  .split(class=className)
    .left
      slot(left)
    .right
      slot(right)
```

## Scope Isolation

### Strict Mode (Default)

Components cannot access external variables:

```pug
- const message = 'Hello'

component Card()
  p= message  // ❌ Error: references external variable "message"

Card()
```

**Fix**: Pass via props:
```pug
- const message = 'Hello'

component Card()
  - const { text } = $props
  p= text

Card(text=message)  // ✅ OK
```

### Allowed Identifiers

These are always accessible:

**JavaScript globals**:
- `console`, `Math`, `Date`, `JSON`, `Object`, `Array`
- `String`, `Number`, `Boolean`, `RegExp`, `Error`
- `Promise`, `Set`, `Map`, `WeakSet`, `WeakMap`
- `parseInt`, `parseFloat`, `isNaN`, `isFinite`
- `encodeURI`, `decodeURI`, `encodeURIComponent`, `decodeURIComponent`

**Pug built-ins**:
- `attributes`, `block`

**pug-tail keywords**:
- `$props`, `$attrs`

### Configuration

Control validation mode in config file:

```javascript
// pugtail.config.js
export default {
  validation: {
    scopeIsolation: 'error',  // 'error' | 'warn' | 'off'
    allowedGlobals: ['myHelper', 'APP_VERSION']
  }
}
```

**Modes**:
- `'error'` (default): Compilation fails on external references
- `'warn'`: Logs warnings but compiles successfully
- `'off'`: Disables validation (legacy compatibility)

### Custom Allowed Globals

Add project-specific globals:

```javascript
// pugtail.config.js
export default {
  validation: {
    scopeIsolation: 'error',
    allowedGlobals: [
      'formatDate',    // Custom helper
      'APP_CONFIG',    // Global config
      '_',             // Lodash
    ]
  }
}
```

## Advanced Patterns

### Conditional Slots

```pug
component Card()
  .card
    if hasHeader
      .card-header
        slot(header)
    .card-body
      slot(body)

- const hasHeader = true
Card()
  slot(header)
    h1 Title
  slot(body)
    p Content
```

### Iterating with Slots

```pug
component List()
  ul
    each item in items
      li= item

- const items = ['A', 'B', 'C']
List()
```

### Dynamic Attributes

```pug
component Button()
  - const { variant = 'primary' } = $props
  - const classes = `btn btn-${variant}`
  button(class=classes)
    slot(default)
      | Click me

Button(variant="secondary")
  slot(default)
    | Custom label
```

### Computed Properties

```pug
component Price()
  - const { amount, currency = 'USD' } = $props
  - const formatted = new Intl.NumberFormat('en', { style: 'currency', currency }).format(amount)
  span.price= formatted

Price(amount=99.99, currency="EUR")
```

### Wrapper Components

```pug
component Container()
  - const { maxWidth = '1200px' } = $props
  - const { class: className } = $attrs
  .container(class=className style=`max-width: ${maxWidth}`)
    slot(default)

Container(maxWidth="800px", class="my-container")
  p Content
```

## Integration with Pug Features

### With Includes

```pug
// components/Button.pug
component Button()
  - const { label } = $props
  button= label

// pages/index.pug
include ../components/Button.pug

Button(label="Click")
```

### With Extends

```pug
// layouts/base.pug
component Layout()
  html
    head
      block head
    body
      slot(content)

// pages/home.pug
include ../layouts/base.pug

extends ../layouts/base.pug

block head
  title Home

Layout()
  slot(content)
    h1 Home Page
```

### With Mixins

```pug
mixin icon(name)
  i(class=`icon-${name}`)

component Button()
  - const { icon } = $props
  button
    +icon(icon)
    slot(default)

Button(icon="star")
  slot(default)
    | Favorite
```

### With Filters

```pug
component Code()
  pre
    code
      slot(default)

Code()
  slot(default)
    :markdown-it
      # Markdown content
      This is **bold**
```

## Best Practices

### 1. Keep Components Focused

Each component should have a single, clear responsibility:

```pug
// ✅ Good - Focused component
component Button()
  button
    slot(default)

// ❌ Avoid - Too much responsibility
component ButtonWithModalAndTooltip()
  // ...
```

### 2. Use Props for Data, Attrs for Styling

```pug
component Card()
  - const { title, description } = $props  // Data
  - const { class: className } = $attrs     // Styling
  
  .card(class=className)
    h2= title
    p= description
```

### 3. Provide Sensible Defaults

```pug
component Button()
  - const { type = "button", disabled = false } = $props
  button(type=type disabled=disabled)
    slot(default)
      | Button
```

### 4. Document Complex Components

```pug
//- Button component
//- @param {string} label - Button text
//- @param {string} type - Button type (button|submit|reset)
//- @param {boolean} disabled - Disabled state
//- @param {string} class - Additional CSS classes
component Button()
  // ...
```

### 5. Use Descriptive Slot Names

```pug
// ✅ Clear intent
component Card()
  slot(header)
  slot(body)
  slot(footer)

// ❌ Unclear
component Card()
  slot(a)
  slot(b)
  slot(c)
```

### 6. Avoid Deep Nesting

Limit component nesting depth for maintainability:

```pug
// ✅ Reasonable depth
Layout()
  slot(main)
    Card()
      slot(body)
        p Content

// ❌ Too deep (hard to follow)
A()
  B()
    C()
      D()
        E()
          F()
```

## Common Patterns

### Card with Optional Header/Footer

```pug
component Card()
  - const { title } = $props
  .card
    if title
      .card-header
        h2= title
    .card-body
      slot(body)
    .card-footer
      slot(footer)

// With all parts
Card(title="Title")
  slot(body)
    p Content
  slot(footer)
    button OK

// Body only
Card()
  slot(body)
    p Content
```

### Modal Dialog

```pug
component Modal()
  - const { isOpen = false } = $props
  if isOpen
    .modal-overlay
      .modal
        .modal-header
          slot(header)
          button.close ×
        .modal-body
          slot(body)
        .modal-footer
          slot(footer)

Modal(isOpen=true)
  slot(header)
    h2 Confirm
  slot(body)
    p Are you sure?
  slot(footer)
    button Cancel
    button OK
```

### Navigation Menu

```pug
component Nav()
  - const { items = [] } = $props
  nav
    ul
      each item in items
        li
          a(href=item.url)= item.label

Nav(items=[{label: 'Home', url: '/'}, {label: 'About', url: '/about'}])
```

## Troubleshooting

### Common Errors

**Error**: `Component "X" not found`
- **Cause**: Component not defined before use
- **Fix**: Define component before calling it

**Error**: `Component "X" references external variable "Y"`
- **Cause**: Scope isolation violation
- **Fix**: Pass variable via props or add to allowedGlobals

**Error**: `Unexpected token in $props destructuring`
- **Cause**: Invalid JavaScript syntax
- **Fix**: Check destructuring syntax

### Debugging

Enable debug mode to see transformation details:

```javascript
// pugtail.config.js
export default {
  debug: true
}
```

### Getting Help

- Check [Configuration Guide](./CONFIGURATION.md) for settings
- Review [Architecture](./ARCHITECTURE.md) for internals
- See [Contributing](./CONTRIBUTING.md) for development setup
- Open an issue on GitHub with a minimal reproduction

---

For more information, see the main [README](../README.md).
