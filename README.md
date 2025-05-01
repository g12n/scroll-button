# `<scroll-button>`

A Web Component that mimics the proposed [`::scroll-button`](https://developer.mozilla.org/en-US/docs/Web/CSS/::scroll-button) CSS pseudo-element. It provides a native-feeling scroll control UI to bridge the gap until browser support is more widespread.

[**Demo**](https://github.com/g12n/scroll-button#readme) | [**Further reading**](https://gehrmann-design.de)


## Examples

General usage example:

```html
<script type="module" src="scroll-button.js"></script>

<ul class="cards" id="cards">
  <li>1</li>
  <li>2</li>
  <li>3</li>
</ul>

<scroll-button for="cards"></scroll-button>
```

## Features

This Web Component allows you to:

- Control horizontal or vertical scrolling behavior
- Add scroll buttons to overflowed containers
- Provide a fallback UI for browsers that do not yet support `::scroll-button`

## Installation

You have a few options (choose one of these):

1. Install via [npm](https://www.npmjs.com/package/@g12n/scroll-button):

```bash
npm install @g12n/scroll-button
```

2. [Download the source manually from GitHub](https://github.com/g12n/scroll-button/releases) into your project.

3. Use the script directly via a 3rd party CDN (not recommended for production use)

### Usage

Make sure you include the `<script>` in your project (choose one of these):

```html
<!-- Host yourself -->
<script type="module" src="scroll-button.js"></script>
```

```html
<!-- 3rd party CDN, not recommended for production use -->
<script
  type="module"
  src="https://www.unpkg.com/@g12n/scroll-button@0.0.1/scroll-button.js"
></script>
```

```html
<!-- 3rd party CDN, not recommended for production use -->
<script
  type="module"
  src="https://esm.sh/@g12n/scroll-button@0.0.1"
></script>
```

## Credit

With thanks to the following people:

- [Zach Leatherman](https://zachleat.com) for inspiring this [Web Component repo template](https://github.com/daviddarnes/component-template)

