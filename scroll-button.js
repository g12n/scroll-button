class ScrollButton extends HTMLElement {
  static register(tagName) {
    if ("customElements" in window) {
      customElements.define(tagName || "scroll-button", ScrollButton);
    }
  }

  connectedCallback() {
    this.addEventListener("click", () => {
      const containerId = this.getAttribute("for");
      const direction = this.getAttribute("direction") || "right";
      const container = document.getElementById(containerId);

      if (!container) return;

      const scrollAmount = container.clientWidth;

      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    });

    this.textContent = this.getAttribute("direction") === "left" ? "←" : "→";
    this.style.cursor = "pointer";
    this.style.fontSize = "2em";
    this.style.margin = "1em";
    this.style.userSelect = "none";
  }
}

ScrollButton.register();