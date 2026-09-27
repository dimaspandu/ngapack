/**
 * Demo entry point.
 *
 * This file demonstrates how ngapack bundles:
 * - static ES module imports
 * - CSS modules
 * - non-JS assets (HTML, CSS)
 */

import { greet } from "./greeting.js";
import renderer from "./dom.js" with { type: "jsx" };
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

export function d(tag, props, ...children) {
  const node = document.createElement(tag);

  if (props) {
    const {
      style,
      className,
      class: classAttr,
      on,
      ...attrs
    } = props;

    const classValue = className ?? classAttr;

    if (classValue) {
      node.className = classValue;
    }

    if (style) {
      Object.assign(node.style, style);
    }

    if (on) {
      for (const [event, handler] of Object.entries(on)) {
        node.addEventListener(event, handler);
      }
    }

    for (const [name, value] of Object.entries(attrs)) {
      if (value == null || value === false) {
        continue;
      }

      if (name === "htmlFor") {
        node.htmlFor = value;
      } else if (name in node && !name.startsWith("aria-") && !name.startsWith("data-")) {
        node[name] = value;
      } else {
        node.setAttribute(name, value === true ? "" : value);
      }
    }
  }

  for (const child of children.flat(Infinity)) {
    if (child == null || typeof child === "boolean") {
      continue;
    }

    node.append(
      child instanceof Node
        ? child
        : document.createTextNode(String(child))
    );
  }

  return node;
}