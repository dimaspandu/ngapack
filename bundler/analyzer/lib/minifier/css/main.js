import cssTokenizer from "../../tokenizer/css/main.js";
import stringifyCSSTokens from "../../stringifyTokens/css/main.js";
import { CSS_MINIFY_LEVEL } from "./constants.js";

/**
 * minifyCSS(code, options)
 * ------------------------------------------------------------
 * High-level CSS normalization utility with configurable depth.
 *
 * Levels:
 * - CSS_MINIFY_LEVEL.DEEP (default):
 *   Removes comments, newlines, and all whitespace, then
 *   re-stringifies tokens into compact CSS.
 *
 * - CSS_MINIFY_LEVEL.SAFE:
 *   Removes comments and newlines only. Preserves all whitespace.
 *
 * - CSS_MINIFY_LEVEL.SMART:
 *   Removes comments and newlines, and collapses consecutive
 *   whitespace tokens into a single space.
 *
 * @param {string} code - Raw CSS source code
 * @param {Object} [options]
 * @param {"safe"|"smart"|"deep"} [options.level]
 * @returns {string} Minified CSS output
 */
export default function minifyCSS(code, options = {}) {
  if (typeof code !== "string" || !code) return "";

  const level = options.level ?? CSS_MINIFY_LEVEL.DEEP;
  const tokens = cssTokenizer(code);

  // -------------------------------------------------------------------
  // SAFE: remove comments and newlines only; preserve all whitespace
  // -------------------------------------------------------------------
  if (level === CSS_MINIFY_LEVEL.SAFE) {
    return tokens
      .filter((t) => t.type !== "comment" && t.type !== "newline")
      .map((t) => t.value)
      .join("");
  }

  // -------------------------------------------------------------------
  // SMART: collapse consecutive whitespace into a single space
  // -------------------------------------------------------------------
  if (level === CSS_MINIFY_LEVEL.SMART) {
    const result = [];
    const tokenLength = tokens.length;

    for (let i = 0; i < tokenLength; i++) {
      const token = tokens[i];

      // skip comments and multi-space whitespace
      if (token.type === "comment" || (token.type === "whitespace" && token.value.length > 1)) {
        continue;
      }

      // convert newline to space, but skip leading/trailing newlines
      if (token.type === "newline") {
        if (i === 0) continue;
        if (i >= tokenLength - 2) continue; // last newline(s)
        result.push(" ");
        continue;
      }

      result.push(token.value);
    }

    return result.join("");
  }

  // -------------------------------------------------------------------
  // DEEP: aggressive minification; remove comments, newlines, whitespace
  // -------------------------------------------------------------------
  const cleaned = tokens.filter(
    (t) => t.type !== "comment" && t.type !== "newline" && t.type !== "whitespace"
  );

  return stringifyCSSTokens(cleaned);
}
