class ScrollButton extends HTMLElement {
  static get observedAttributes() {
    return ["for", "direction", "disabled", "aria-label"];
  }

  static register(tagName = "scroll-button") {
    if ("customElements" in window && !customElements.get(tagName)) {
      customElements.define(tagName, ScrollButton);
    }
  }

  constructor() {
    super();
    // Make the element itself act like a button
    this._onClick = this._onClick.bind(this);
    this._onScrollOrResize = this._onScrollOrResize.bind(this);

    this.setAttribute("role", "button");
    if (!this.hasAttribute("tabindex")) this.tabIndex = 0;

    this.addEventListener("keydown", (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        this._onClick();
      }
    });
    this.addEventListener("click", this._onClick);

    this._scrollTarget = null;
    this._ro = null;

    this._mo = new MutationObserver(() => this._renderA11y());
    this._mo.observe(this, { childList: true, characterData: true, subtree: true });
  }

  connectedCallback() {
    this._attachToTarget();
    this._renderA11y();
    this._updateDisabled(); // initial state
  }

  disconnectedCallback() {
    this._detachFromTarget();
    this.removeEventListener("click", this._onClick);
    this._mo?.disconnect();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;

    // Re-attach if target or direction changed
    if (name === "for") this._attachToTarget();
    if (name === "direction") this._updateDisabled();

    // Keep aria label fresh
    if (name === "aria-label") this._renderA11y();

    // IMPORTANT: Do NOT call _updateDisabled() in response to "disabled"
    // or you’ll recurse. The code that sets/removes it will already do so.
  }

  // --- internal helpers ---

  _attachToTarget() {
    const id = this.getAttribute("for");
    const el = id ? document.getElementById(id) : null;
    if (el === this._scrollTarget) return;

    this._detachFromTarget();
    this._scrollTarget = el;
    if (!el) return;

    el.addEventListener("scroll", this._onScrollOrResize, { passive: true });
    window.addEventListener("resize", this._onScrollOrResize, { passive: true });
    if ("ResizeObserver" in window) {
      this._ro = new ResizeObserver(this._onScrollOrResize);
      this._ro.observe(el);
    }
    this._updateDisabled();
  }

  _detachFromTarget() {
    if (!this._scrollTarget) return;
    this._scrollTarget.removeEventListener("scroll", this._onScrollOrResize);
    window.removeEventListener("resize", this._onScrollOrResize);
    this._ro?.disconnect();
    this._ro = null;
    this._scrollTarget = null;
  }

  _direction() {
    const dirAttr = (this.getAttribute("direction") || "right").toLowerCase();
    const t = this._scrollTarget;
    if (!t) return { axis: "x", sign: 1, label: "Next" };

    const cs = getComputedStyle(t);
    const isVerticalBlock = cs.writingMode.startsWith("vertical");
    const rtl = cs.direction === "rtl";

    const map = {
      left:  { axis: "x", sign: -1, label: "Scroll left" },
      right: { axis: "x", sign:  1, label: "Scroll right" },
      up:    { axis: "y", sign: -1, label: "Scroll up" },
      down:  { axis: "y", sign:  1, label: "Scroll down" },
      "inline-start": isVerticalBlock ? { axis: "y", sign: -1, label: "Previous" }
                                      : { axis: "x", sign: rtl ? 1 : -1, label: "Previous" },
      "inline-end":   isVerticalBlock ? { axis: "y", sign:  1, label: "Next" }
                                      : { axis: "x", sign: rtl ? -1 : 1, label: "Next" },
      "block-start":  isVerticalBlock ? { axis: "x", sign: -1, label: "Previous" }
                                      : { axis: "y", sign: -1, label: "Previous" },
      "block-end":    isVerticalBlock ? { axis: "x", sign:  1, label: "Next" }
                                      : { axis: "y", sign:  1, label: "Next" },
    };

    return map[dirAttr] || map.right;
  }

  _scrollAmount() {
    const t = this._scrollTarget;
    if (!t) return 0;
    const { axis } = this._direction();
    const page = axis === "x" ? t.clientWidth : t.clientHeight;
    return Math.max(1, Math.round(page * 0.85));
  }

  _canScroll(sign = this._direction().sign) {
    const t = this._scrollTarget;
    if (!t) return false;
    const { axis } = this._direction();

    if (axis === "x") {
      return sign < 0 ? t.scrollLeft > 0
                      : t.scrollLeft + t.clientWidth < t.scrollWidth;
    } else {
      return sign < 0 ? t.scrollTop > 0
                      : t.scrollTop + t.clientHeight < t.scrollHeight;
    }
  }

  _onClick() {
    if (this.hasAttribute("disabled")) return;
    const t = this._scrollTarget;
    if (!t) return;

    const { axis, sign } = this._direction();
    const delta = this._scrollAmount() * sign;
    t.scrollBy({
      left: axis === "x" ? delta : 0,
      top:  axis === "y" ? delta : 0,
      behavior: "smooth",
    });
  }

  _onScrollOrResize() {
    this._updateDisabled();
  }

  _updateDisabled() {
    const shouldDisable = !this._canScroll();
    // Only change the attribute if the state changed to avoid churn/loops
    if (this.hasAttribute("disabled") !== shouldDisable) {
      this.toggleAttribute("disabled", shouldDisable);
      this.setAttribute("aria-disabled", String(shouldDisable));
    }
  }

  _renderA11y() {
    if (!this.hasAttribute("aria-label")) {
      const text = (this.textContent || "").trim();
      const fallback = this._direction().label;
      this.setAttribute("aria-label", text || fallback);
    }
  }
}

ScrollButton.register();