/**
 * Demo entry point.
 *
 * This file demonstrates how ngapack bundles:
 * - static ES module imports
 * - CSS modules
 * - non-JS assets (HTML, CSS)
 */

import { greet } from "./greeting.js";
import renderer from "./dom.js" with { type: "jsx", factory: "elementBuilder" };
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
}

app.appendChild(renderer(greet("NGAPACK")));