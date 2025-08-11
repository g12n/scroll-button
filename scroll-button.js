// scroll-button.js
// Light-DOM <scroll-button> fallback that mirrors native ::scroll-button behavior,
// including snap-aware paging that won't skip snappable items.

class ScrollButton extends HTMLElement {
  static get observedAttributes() {
    // Note: we observe "disabled" so user-authored changes are noticed, but we
    // DO NOT react to it inside attributeChangedCallback to avoid loops.
    return ["for", "direction", "disabled", "aria-label"];
  }

  static register(tagName = "scroll-button") {
    if ("customElements" in window && !customElements.get(tagName)) {
      customElements.define(tagName, ScrollButton);
    }
  }

  constructor() {
    super();

    // Bindings
    this._onClick = this._onClick.bind(this);
    this._onScrollOrResize = this._onScrollOrResize.bind(this);

    // Make the element itself act as a button
    this.setAttribute("role", "button");
    if (!this.hasAttribute("tabindex")) this.tabIndex = 0;

    // Keyboard activation
    this.addEventListener("keydown", (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        this._onClick();
      }
    });
    // Pointer activation
    this.addEventListener("click", this._onClick);

    // Track target + observers
    this._scrollTarget = null;
    this._ro = null;

    // Keep aria-label in sync with content/direction if author doesn't set one
    this._mo = new MutationObserver(() => this._renderA11y());
    this._mo.observe(this, { childList: true, characterData: true, subtree: true });
  }

  connectedCallback() {
    // If the native ::scroll-button() is supported you could choose to hide the fallback:
    // if (window.CSS?.supports?.('selector(::scroll-button(right))')) { this.hidden = true; return; }

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

    // Re-attach if target changes
    if (name === "for") this._attachToTarget();

    // Direction change can affect disabled state + labels
    if (name === "direction") {
      this._renderA11y();
      this._updateDisabled();
    }

    // Keep aria label if author explicitly sets it
    if (name === "aria-label") this._renderA11y();

    // IMPORTANT: Do NOT call _updateDisabled() in response to "disabled"
    // to avoid attribute-change recursion loops.
  }

  // ---------- Event/Observer wiring ----------

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

  _onScrollOrResize() {
    this._updateDisabled();
  }

  // ---------- Direction & Paging ----------

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

      "inline-start": isVerticalBlock
        ? { axis: "y", sign: -1, label: "Previous" }
        : { axis: "x", sign: rtl ? 1 : -1, label: "Previous" },

      "inline-end": isVerticalBlock
        ? { axis: "y", sign:  1, label: "Next" }
        : { axis: "x", sign: rtl ? -1 : 1, label: "Next" },

      "block-start": isVerticalBlock
        ? { axis: "x", sign: -1, label: "Previous" }
        : { axis: "y", sign: -1, label: "Previous" },

      "block-end": isVerticalBlock
        ? { axis: "x", sign:  1, label: "Next" }
        : { axis: "y", sign:  1, label: "Next" },
    };

    return map[dirAttr] || map.right;
  }

  _pageSize() {
    const t = this._scrollTarget;
    if (!t) return 0;
    const { axis } = this._direction();
    return axis === "x" ? t.clientWidth : t.clientHeight;
  }

  _scrollAmountFallback() {
    // When not snapping, we do a "page-ish" move (≈85% of the scrollport)
    const page = this._pageSize();
    return Math.max(1, Math.round(page * 0.85));
  }

  // ---------- Click behavior (snap-aware) ----------

  _onClick() {
    if (this.hasAttribute("disabled")) return;
    const t = this._scrollTarget;
    if (!t) return;

    const { axis, sign } = this._direction();
    const page = this._pageSize();

    if (this._hasScrollSnap(t, axis)) {
      const target = this._nextSnapWithinPage(t, axis, sign, page);
      this._scrollTo(t, axis, target);
    } else {
      const delta = this._scrollAmountFallback() * sign;
      this._scrollBy(t, axis, delta);
    }
  }

  _hasScrollSnap(t, axis) {
    const cs = getComputedStyle(t);
    const snapType = (cs.scrollSnapType || "").trim(); // e.g., "x mandatory", "both proximity"
    if (!snapType) return false;
    const [snapAxis] = snapType.split(/\s+/); // axis or "both"
    return snapAxis === "both" || snapAxis === axis;
  }

  _scrollBy(t, axis, delta) {
    t.scrollBy({
      left: axis === "x" ? delta : 0,
      top:  axis === "y" ? delta : 0,
      behavior: "smooth",
    });
  }

  _scrollTo(t, axis, pos) {
    t.scrollTo({
      left: axis === "x" ? pos : t.scrollLeft,
      top:  axis === "y" ? pos : t.scrollTop,
      behavior: "smooth",
    });
  }

  _nextSnapWithinPage(t, axis, sign, page) {
    const now = axis === "x" ? t.scrollLeft : t.scrollTop;

    // Collect candidate snap positions from children with scroll-snap-align != none
    const kids = Array.from(t.children);
    const candidates = [];

    const cs = getComputedStyle(t);
    const padStart = this._scrollPaddingStart(cs, axis);
    const padEnd   = this._scrollPaddingEnd(cs, axis);

    for (const el of kids) {
      const kcs = getComputedStyle(el);
      const alignVal = (kcs.scrollSnapAlign || "none").trim();
      if (alignVal === "none" || alignVal === "") continue;

      const align = this._inlineAlign(kcs); // "start" | "center" | "end"
      const pos = this._snapPositionForChild(t, el, axis, align, padStart, padEnd);
      candidates.push(pos);
    }

    // Keep only positions ahead/behind of current, sorted in natural order
    const ahead = candidates
      .filter(p => sign > 0 ? p > now + 1 : p < now - 1)
      .sort((a, b) => a - b);

    if (ahead.length === 0) return now; // nowhere to go

    // 1) Prefer the furthest target within one page
    const limit = sign > 0 ? now + page : now - page;
    const within = sign > 0
      ? ahead.filter(p => p <= limit)
      : ahead.filter(p => p >= limit);

    if (within.length) {
      return sign > 0 ? within[within.length - 1] : within[0];
    }

    // 2) Otherwise: no snap point within one page — pick the nearest beyond a page
    return sign > 0 ? ahead[0] : ahead[ahead.length - 1];
  }

  _inlineAlign(kcs) {
    // scroll-snap-align can be "start", "center", "end", "none"
    // or two values: "<block> <inline>". Prefer the inline component if present.
    const val = (kcs.scrollSnapAlign || "start").trim();
    const parts = val.split(/\s+/);
    return parts.length === 2 ? parts[1] : parts[0];
  }

  _scrollPaddingStart(cs, axis) {
    if (axis === "x") {
      return this._parseLen(cs.scrollPaddingInlineStart || cs.scrollPaddingLeft || "0");
    } else {
      return this._parseLen(cs.scrollPaddingBlockStart || cs.scrollPaddingTop || "0");
    }
  }

  _scrollPaddingEnd(cs, axis) {
    if (axis === "x") {
      return this._parseLen(cs.scrollPaddingInlineEnd || cs.scrollPaddingRight || "0");
    } else {
      return this._parseLen(cs.scrollPaddingBlockEnd || cs.scrollPaddingBottom || "0");
    }
  }

  _parseLen(v) {
    // getComputedStyle returns pixel lengths; parseFloat is fine.
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  }

  _snapPositionForChild(t, el, axis, align, padStart, padEnd) {
    // Compute the target scrollLeft/Top value that would align this child according to its inline alignment,
    // respecting container size and scroll-padding.
    if (axis === "x") {
      const start  = el.offsetLeft - padStart;
      const end    = el.offsetLeft + el.offsetWidth - (t.clientWidth - padEnd);
      const center = el.offsetLeft + el.offsetWidth / 2 - t.clientWidth / 2;
      return align === "end" ? end : align === "center" ? center : start;
    } else {
      const start  = el.offsetTop - padStart;
      const end    = el.offsetTop + el.offsetHeight - (t.clientHeight - padEnd);
      const center = el.offsetTop + el.offsetHeight / 2 - t.clientHeight / 2;
      return align === "end" ? end : align === "center" ? center : start;
    }
  }

  // ---------- Disabled state & A11y ----------

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

  _updateDisabled() {
    const shouldDisable = !this._canScroll();
    // Only toggle if changed to avoid attribute-changed loops
    if (this.hasAttribute("disabled") !== shouldDisable) {
      this.toggleAttribute("disabled", shouldDisable);
      this.setAttribute("aria-disabled", String(shouldDisable));
    }
  }

  _renderA11y() {
    // If author provided an aria-label, keep it. Else derive from text or direction.
    if (!this.hasAttribute("aria-label")) {
      const text = (this.textContent || "").trim();
      const fallback = this._direction().label;
      this.setAttribute("aria-label", text || fallback);
    }
  }
}

// Register globally
ScrollButton.register();