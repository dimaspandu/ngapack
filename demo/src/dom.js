import elementBuilder from "./elementBuilder.js";

export default function renderer(content) {
  return (
    <div className="card">
      <h2>{content}</h2>
      <p>This uses a custom factory: <code>elementBuilder</code></p>
    </div>
  );
}