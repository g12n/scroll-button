# Next step

## Scroll invoker

Instead of a custom element, use [custom invoker] commands to control scrolling.

Follow and participate in the discussion [Add declarative scroll commands to HTMLButtonElement] to help get it into the standard.

```html
<div id=„my-container“>
  <button commandfor=„my-container“ command=„—page-left“>previous page</button>
  <ul>
    <li>1</li>
    <li>2</li>
    <li>3</li>
  </ul>
  <button commandfor=„my-container“ command=„—page-right“>next page</button>
</div>
```

## Show/hide buttons with scroll-state queries

Use styles to hide or show the buttons based on whether they are stuck and/or whether the container is scrollable.

Reference: [CSS container scroll-state queries]

```css
#my-container {
  container-type: scroll-state;
}

button {
  display: none;
}

@container scroll-state(scrollable: left) {
  button[command=„—page-left“] {
    display: block;
  }
}

@container scroll-state(scrollable: right) {
  button[command=„—page-right“] {
    display: block;
  }
}
```

### Open question

- Does CSS `display: none` remove the button from the accessibility tree?
- Can an accessible disabled state be provided with CSS alone?

[custom invoker]: https://developer.mozilla.org/en-US/docs/Web/API/Invoker_Commands_API#creating_custom_commands

[Add declarative scroll commands to HTMLButtonElement]: https://github.com/whatwg/html/issues/11847

[CSS container scroll-state queries]: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Conditional_rules/Container_scroll-state_queries

