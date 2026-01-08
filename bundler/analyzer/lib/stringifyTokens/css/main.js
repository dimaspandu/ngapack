/**
 * stringifyCSSTokens(tokens)
 * ------------------------------------------------------------
 * Reconstructs a CSS source string from a flat token stream.
 *
 * This stringifier is intentionally minimal:
 * - It does not validate CSS grammar
 * - It does not normalize spacing or formatting
 * - It preserves all original token values verbatim
 *
 * The function is designed to be the final step in a
 * tokenizer → transformer → stringifier pipeline.
 *
 * Expected token shape:
 *   {
 *     type: string,
 *     value: string
 *   }
 *
 * @param {Array<Object>} tokens
 * @returns {string}
 */

// stringifyCSSTokens.js
// ------------------------------------------------------------
// Reassembles CSS tokens into a minified CSS string.
// Inserts spaces only when required to prevent invalid token merging.

export default function stringifyCSSTokens(tokens) {
  if (!Array.isArray(tokens) || tokens.length === 0) return "";

  let out = "";

  for (let i = 0; i < tokens.length; i++) {
    const prev = tokens[i - 1];
    const curr = tokens[i];

    if (!prev) {
      out += curr.value;
      continue;
    }

    let needSpace = false;

    // at_keyword + identifier
    // identifier + identifier
    if (isWord(prev) && isWord(curr)) {
      needSpace = true;
    }

    // identifier + at_keyword is not valid but safe-guard
    if (isWord(prev) && curr.type === "at_keyword") {
      needSpace = true;
    }

    out += needSpace ? " " + curr.value : curr.value;
  }

  return out;
}

function isWord(t) {
  return (
    t.type === "identifier" ||
    t.type === "at_keyword" ||
    t.type === "function"
  );
}
