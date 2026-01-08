import cssTokenizer from "../../tokenizer/css/main.js";
import stringifyCSSTokens from "../../stringifyTokens/css/main.js";

/**
 * minifyCSS(code)
 * ------------------------------------------------------------
 * High-level CSS normalization utility.
 *
 * This function performs a lightweight CSS minification by:
 * 1. Tokenizing the input CSS source.
 * 2. Removing non-semantic tokens (whitespace, newlines, comments).
 * 3. Re-stringifying the remaining tokens into a compact CSS string.
 *
 * Design notes:
 * - This is NOT a semantic CSS parser.
 * - No selector or rule reordering is performed.
 * - Safe for static analysis and deterministic output.
 *
 * @param {string} code - Raw CSS source code
 * @returns {string} Minified CSS output
 */
export default function minifyCSS(code) {
  if (typeof code !== "string" || code.length === 0) return "";

  const tokens = cssTokenizer(code);

  // Remove formatting-only tokens
  const cleanedTokens = tokens.filter(
    (t) =>
      t.type !== "newline" &&
      t.type !== "whitespace" &&
      t.type !== "comment"
  );

  return stringifyCSSTokens(cleanedTokens);
}
