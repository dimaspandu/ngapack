import elementBuilder from "../factories/elementBuilder.js";

export default function Card({ title, body }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  );
}