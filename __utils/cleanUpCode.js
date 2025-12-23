import splitByStringLiterals from "./splitByStringLiterals.js";

/**
 * cleanUpCode(code)
 * -----------------
 * A lightweight JavaScript code minifier that:
 * - Preserves the contents of string literals and template literals
 * - Removes unnecessary whitespace outside strings
 * - Collapses embedded HTML inside innerHTML template literals
 * - Cleans up redundant spacing around common symbols
 *
 * @param {string} code - The raw JavaScript source code
 * @returns {string} - Minified JavaScript output
 */
export default function cleanUpCode(code) {
  let result = "";

  // Flags to track parsing context
  let inSingle = false;   // Inside single-quoted string
  let inDouble = false;   // Inside double-quoted string
  let inTemplate = false; // Inside backtick/template literal
  let inRegex = false;    // Inside regular expression
  let prev = "";          // Previous character

  let buffer = "";        // Buffer for template literal contents
  let isInnerHTML = false; // Flag: whether this template literal is assigned to innerHTML

  for (let i = 0; i < code.length; i++) {
    const c = code[i];

    // Toggle template literal mode (backtick quote)
    if (c === "`" && !inSingle && !inDouble && !inRegex && prev !== "\\") {
      if (inTemplate) {
        // Closing template literal — check if it contains HTML
        const containsHTML = /<\w+[\s>]/.test(buffer);

        if (isInnerHTML || containsHTML) {
          // Minify embedded HTML inside the template literal
          const minified = buffer
            .replaceAll(/>\s+</g, "><")
            .replaceAll(/\n/g, "")
            .replaceAll(/\r/g, "")
            .replaceAll(/\t/g, "")
            .replaceAll(/\s{2,}/g, " ")
            .trim();

          result += "`" + minified + "`";
        } else {
          // Just trim the whitespace
          result += "`" + buffer.trim() + "`";
        }

        buffer = "";
        isInnerHTML = false;
      } else {
        // Opening backtick: check if preceded by `.innerHTML =`
        const before = result.slice(-50);
        if (/innerHTML\s*=$/.test(before)) {
          isInnerHTML = true;
        }
      }

      inTemplate = !inTemplate;
      prev = c;
      continue;
    }

    // Toggle string and regex states
    if (c === "'" && !inDouble && !inTemplate && !inRegex && prev !== "\\") {
      inSingle = !inSingle;
    } else if (c === '"' && !inSingle && !inTemplate && !inRegex && prev !== "\\") {
      inDouble = !inDouble;
    } else if (c === "/" && !inSingle && !inDouble && !inTemplate && prev !== "\\") {
      // Try to detect start/end of regex using simple heuristics
      if (!inRegex && /[\(\{=:\[,]|\s/.test(prev)) {
        inRegex = true;
      } else if (inRegex) {
        inRegex = false;
      }
    }

    // Collect content inside template literal (no processing)
    if (inTemplate) {
      buffer += c;
      prev = c;
      continue;
    }

    // Preserve characters inside regular strings or regex
    if (inSingle || inDouble || inRegex) {
      result += c;
      prev = c;
      continue;
    }

    // Ignore whitespace characters outside of strings
    if (c === "\n" || c === "\r" || c === "\t") {
      prev = c;
      continue;
    }

    // Remove spaces before/after common JavaScript symbols
    if (c === " ") {
      const next = code[i + 1] || "";

      const isSymbol = /[\{\}\(\)\[\];,:=+\-*\/<>%&|^!~?]/;
      const isOpenBracket = /[\{\(\[]/;

      if (isSymbol.test(prev) || isSymbol.test(next) || isOpenBracket.test(prev)) {
        prev = c;
        continue;
      }
    }

    // Append current character
    result += c;
    prev = c;
  }

  // Collapse multiple spaces to one, and trim leading/trailing whitespace
  result = result.replaceAll(/ {2,}/g, " ").trim();

  // Cleanup remaining newline-based indents (if any)
  result = result
    .replaceAll("\n    ", "")
    .replaceAll("\n   ", "")
    .replaceAll("\n  ", "")
    .replaceAll("\n ", "")
    .replaceAll("\n", "");

  // Split result into segments to safely process non-string code
  const segments = splitByStringLiterals(result);
  let cleaned = "";

  for (const part of segments) {
    if (part.string) {
      // Preserve string literal content exactly
      cleaned += part.value;
    } else {
      // Minify outside of strings: remove spaces around common symbols
      cleaned += part.value
        .replaceAll(/\{\s+/g, "{")
        .replaceAll(/\s+\}/g, "}")
        .replaceAll(/\(\s+/g, "(")
        .replaceAll(/\s+\)/g, ")")
        .replaceAll(/\[\s+/g, "[")
        .replaceAll(/\s+\]/g, "]")
        .replaceAll(/\s*=\s*/g, "=")
        .replaceAll(/\s*;\s*/g, ";")
        .replaceAll(/\s*:\s*/g, ":")
        .replaceAll(/\s*\+\s*/g, "+")
        .replaceAll(/\s*\-\s*/g, "-")
        .replaceAll(/\s*\*\s*/g, "*")
        .replaceAll(/\s*\/\s*/g, "/")
        .replaceAll(/\s*\%\s*/g, "%")
        .replaceAll(/\s*\&\s*/g, "&")
        .replaceAll(/\s*\|\s*/g, "|")
        .replaceAll(/\s*!\s*/g, "!")
        .replaceAll(/\s*\?\s*/g, "?")
        .replaceAll(/\s*~\s*/g, "~")
        .replaceAll(/,\s+/g, ",")
        .replaceAll(/\s+\}/g, "}");
    }
  }

  return cleaned;
}
