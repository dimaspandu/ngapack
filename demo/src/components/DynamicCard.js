/**
 * DynamicCard.js — JSX component loaded via dynamic import.
 *
 * Demonstrates that JSX transpilation works with dynamic imports:
 *   const Card = await import("./DynamicCard.js" with { type: "jsx", factory: "elementBuilder" });
 */

import elementBuilder from "../factories/elementBuilder.js";

export default function DynamicCard({ title, body }) {
  return (
    <div className="card dynamic">
      <h2>{title}</h2>
      <p>{body}</p>
      <span className="badge">loaded dynamically</span>
    </div>
  );
}