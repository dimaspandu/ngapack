/**
 * Demo entry point.
 *
 * This file demonstrates how ngapack bundles:
 * - static ES module imports
 * - CSS modules
 * - non-JS assets (HTML, CSS)
 * - JSX transpilation with a custom factory
 * - dynamic import with JSX assertion
 */

import { greet } from "./greeting.js";
import Card from "./components/Card.js" with { type: "jsx", factory: "elementBuilder" };
import styles from "./style.module.css" with { type: "css" };
import "./index.html";
import "./global.css";

// Apply the CSS module to the document.
if (typeof document !== "undefined") {
  document.adoptedStyleSheet = styles.default instanceof CSSStyleSheet
    ? styles.default
    : null;
}

const app = document.getElementById("app");
if (app) {
  app.innerHTML = `<h1>${greet("NGAPACK")}</h1>`;
  app.appendChild(
    Card({
      title: "NGAPACK",
      body: "Bundled with a custom JSX factory."
    })
  );

  /**
   * Demonstrate dynamic import with JSX assertion.
   * The component is loaded at runtime, not bundled statically.
   */
  const loadBtn = document.createElement("button");
  loadBtn.textContent = "Load dynamic JSX component";
  loadBtn.addEventListener("click", async () => {
    const mod = await import("./components/DynamicCard.js", {
      type: "jsx",
      factory: "elementBuilder"
    });
    app.appendChild(
      mod.default({
        title: "Dynamic",
        body: "Loaded via import() with { type: \"jsx\" }"
      })
    );
  });
  app.appendChild(loadBtn);
}