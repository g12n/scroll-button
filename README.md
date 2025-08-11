# `<scroll-button>`

A Web Component that mimics the proposed [`::scroll-button`](https://developer.mozilla.org/en-US/docs/Web/CSS/::scroll-button) CSS pseudo-element. It provides a native-feeling scroll control UI to bridge the gap until browser support is more widespread.

[**Demo**](https://g12n.github.io/scroll-button/test-cases/demo.html) 

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

This Project is still under development. 
You are free to clone it for test purposes and committing ideas.
But for the moment it's not fit for the big stage.


## Credit

With thanks to the following people:

- [Zach Leatherman](https://zachleat.com) for inspiring this [Web Component repo template](https://github.com/daviddarnes/component-template)

