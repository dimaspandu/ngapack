/**
 * Splits JavaScript code into segments that distinguish between string literals
 * (single-quoted, double-quoted, and backtick/template literals) and non-string code.
 *
 * This is useful for applying transformations only to code that is outside of string literals,
 * preserving string contents exactly.
 *
 * @param {string} code - The JavaScript source code to split.
 * @returns {Array<{ value: string, string: boolean }>} - Array of code segments.
 *          Each segment includes the code string and a flag indicating whether it's a string literal.
 */
export default function splitByStringLiterals(code) {
  const result = [];
  let lastIndex = 0;

  // Regular expression to match string literals including escape sequences.
  // Captures: opening quote, contents, closing quote.
  const stringRegex = /(['"`])(?:\\.|(?!\1)[\s\S])*?\1/g;

  let match;
  while ((match = stringRegex.exec(code))) {
    const fullMatch = match[0];

    // Push any non-string code before the matched string
    if (match.index > lastIndex) {
      result.push({
        value: code.slice(lastIndex, match.index),
        string: false
      });
    }

    // Push the string literal segment (including its quotes)
    result.push({
      value: fullMatch,
      string: true
    });

    lastIndex = match.index + fullMatch.length;
  }

  // Push any remaining non-string code after the last match
  if (lastIndex < code.length) {
    result.push({
      value: code.slice(lastIndex),
      string: false
    });
  }

  // Filter out any empty segments
  return result.filter(part => part.value.length > 0);
}
