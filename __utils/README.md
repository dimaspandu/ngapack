# Utils Test Suite

This directory contains the core utility modules and their corresponding automated tests.  
Each utility provides specialized functionality used throughout the runtime and bundler environment — including code cleanup, HTML/CSS/JS minification, and conversion between ESM and CJS formats.

---

## Directory Structure

```
utils/
├── cleanUpCode.js
├── cleanUpStyle.js
├── ensureJsExtension.js
├── escapeForDoubleQuote.js
├── index.js
├── logger.js
├── mergeRequireNetworkCalls.js
├── minifyHTML.js
├── minifyJS.js
├── normalize.js
├── oneLineJS.js
├── splitByStringLiterals.js
├── stripComments.js
├── stripHTMLComments.js
├── transpileESMToCJS.js
└── test/
    ├── cleanUpCode.test.js
    ├── cleanUpStyle.test.js
    ├── ensureJsExtension.test.js
    ├── escapeForDoubleQuote.test.js
    ├── mergeRequireNetworkCalls.test.js
    ├── minifyHTML.test.js
    ├── oneLineJS.test.js
    ├── splitByStringLiterals.test.js
    ├── stripComments.test.js
    ├── stripHTMLComments.test.js
    └── transpileESMToCJS.test.js
```

---

## How to Run

Run all utility tests by executing the following command:

```bash
node test
```

This will trigger the test runner (`index.js`), which automatically loads and executes each test file in the `test/` subfolder.

Each test validates that its corresponding utility behaves correctly across multiple scenarios, including edge cases.

---

## Expected Output

When all tests pass successfully, the console output should resemble the following:

```text
--- Test: Minify simple JavaScript code ---
PASS
--- Test: Handle spaces around symbols and reduce newlines ---
PASS
--- Test: Preserve strings and template literals ---
PASS
...
All tests loaded.

┌─────────┬────────────────────────────────────┬───────┬────────┬────────┬──────────┐
│ (index) │ name                               │ total │ passed │ failed │ pass %   │
├─────────┼────────────────────────────────────┼───────┼────────┼────────┼──────────┤
│ 0       │ 'cleanUpCode.test.js'              │ 10    │ 10     │ 0      │ '100.00' │
│ 1       │ 'cleanUpStyle.test.js'             │ 6     │ 6      │ 0      │ '100.00' │
│ 2       │ 'ensureJsExtension.test.js'        │ 9     │ 9      │ 0      │ '100.00' │
│ 3       │ 'escapeForDoubleQuote.test.js'     │ 7     │ 7      │ 0      │ '100.00' │
│ 4       │ 'mergeRequireNetworkCalls.test.js' │ 5     │ 5      │ 0      │ '100.00' │
│ 5       │ 'minifyHTML.test.js'               │ 6     │ 6      │ 0      │ '100.00' │
│ 6       │ 'oneLineJS.test.js'                │ 7     │ 7      │ 0      │ '100.00' │
│ 7       │ 'splitByStringLiterals.test.js'    │ 9     │ 9      │ 0      │ '100.00' │
│ 8       │ 'stripComments.test.js'            │ 11    │ 11     │ 0      │ '100.00' │
│ 9       │ 'stripHTMLComments.test.js'        │ 8     │ 8      │ 0      │ '100.00' │
│ 10      │ 'transpileESMToCJS.test.js'        │ 28    │ 28     │ 0      │ '100.00' │
└─────────┴────────────────────────────────────┴───────┴────────┴────────┴──────────┘
```

---

## Key Utility Descriptions

| File                            | Purpose                                                                                             |
| --------------------------------| --------------------------------------------------------------------------------------------------- |
| **cleanUpCode.js**              | Removes redundant spaces, newlines, and comments from JavaScript code.                              |
| **cleanUpStyle.js**             | Minifies CSS content while preserving valid syntax.                                                 |
| **ensureJsExtension.js**        | Ensures that file paths include the `.js` extension, even when query or fragment identifiers exist. |
| **escapeForDoubleQuote.js**     | Escapes strings for safe usage inside double quotes.                                                |
| **mergeRequireNetworkCalls.js** | Optimizes chained network `require()` calls into a single merged statement.                         |
| **minifyHTML.js**               | Removes unnecessary whitespace and comments from HTML files.                                        |
| **oneLineJS.js**                | Flattens multi-line JS code into a single line while keeping string literals intact.                |
| **splitByStringLiterals.js**    | Splits code while preserving string literal boundaries.                                             |
| **stripComments.js**            | Safely removes single-line and multi-line JavaScript comments.                                      |
| **stripHTMLComments.js**        | Removes HTML comments and optionally minifies embedded JS and CSS.                                  |
| **transpileESMToCJS.js**        | Converts ES Module syntax (`import/export`) into CommonJS syntax (`require/module.exports`).        |
| **logger.js**                   | Provides lightweight console logging with debug/error/info modes.                                   |

---

## Summary

All test files under `utils/test/` confirm that each transformation, cleanup, and parsing utility works reliably and consistently.  
The combined suite ensures the stability of the internal JS bundler, HTML optimizer, and runtime preprocessing system.

When all tests show `PASS`, the utilities are functioning correctly.
