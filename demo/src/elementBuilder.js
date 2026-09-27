/**
 * elementBuilder.js — Custom JSX factory.
 *
 * Demonstrates that ngapack can use any factory name, not just "d".
 */

export default function elementBuilder(tag, props, ...children) {
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