/**
 * Find the end index of a destructuring pattern.
 *
 * Given a starting index pointing to the opening `{`
 * of an object destructure, this scans forward through
 * nested `{ ... }` pairs and returns the index of the
 * matching closing brace `}`.
 *
 * Example patterns it can handle:
 *   { a, b }
 *   { a: { b, c }, d }
 *   { a, b: { c: { d } } }
 *
 * Returns:
 *   - The index of the matching `}`
 *   - `null` if no matching closing brace is found
 */
export default function getDestructureEndIndex(tokens, startIndex) {
  let endIndex = null;
  let depth = 0;

  // Iterate from the starting token forward
  for (let i = startIndex; i < tokens.length; i++) {
    const idx = i;
    const tok = tokens[idx];

    // Increase depth on each opening brace
    if (tok.type === "punctuator" && tok.value === "{") {
      depth++;
    }
    // Decrease depth on closing brace
    else if (tok.type === "punctuator" && tok.value === "}") {
      depth--;

      // If depth returns to zero, we found the matching '}'
      if (depth === 0) {
        endIndex = idx;
        break;
      }
    }
  }

  return endIndex;
}
