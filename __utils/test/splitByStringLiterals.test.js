import {
  splitByStringLiterals,
  normalize
} from "../index.js";

/**
 * Test runner
 * -----------
 */
const testResults = [];

function runTest(name, input, expected) {
  const result = splitByStringLiterals(input);
  const simplified = result.map(part => ({
    value: normalize(part.value),
    string: part.string
  }));

  const expectedNormalized = expected.map(part => ({
    value: normalize(part.value),
    string: part.string
  }));

  const pass = JSON.stringify(simplified) === JSON.stringify(expectedNormalized);

  // Track result
  testResults.push({ name, pass });

  // Debug output
  console.log(`\n--- Test: ${name} ---`);
  console.log(pass ? "PASS" : "FAIL");
  if (!pass) {
    console.log("\n--- Output ---\n", JSON.stringify(simplified, null, 2));
    console.log("\n--- Expected ---\n", JSON.stringify(expectedNormalized, null, 2));
  }
}

// -------------------------
// Tests
// -------------------------

runTest(
  "Single-quoted string",
  `const a = 'hello';`,
  [
    { value: `const a = `, string: false },
    { value: `'hello'`, string: true },
    { value: `;`, string: false }
  ]
);

runTest(
  "Double-quoted string",
  `const b = "world";`,
  [
    { value: `const b = `, string: false },
    { value: `"world"`, string: true },
    { value: `;`, string: false }
  ]
);

runTest(
  "Backtick (template literal)",
  "const tpl = `Hello ${name}`;",
  [
    { value: `const tpl = `, string: false },
    { value: "`Hello ${name}`", string: true },
    { value: `;`, string: false }
  ]
);

runTest(
  "Mixed string types",
  `const a = 'x', b = "y", c = \`z\`;`,
  [
    { value: `const a = `, string: false },
    { value: `'x'`, string: true },
    { value: `, b = `, string: false },
    { value: `"y"`, string: true },
    { value: `, c = `, string: false },
    { value: "`z`", string: true },
    { value: `;`, string: false }
  ]
);

runTest(
  "Escaped quotes inside strings",
  `const s = "He said: \\"hi\\"";`,
  [
    { value: `const s = `, string: false },
    { value: `"He said: \\"hi\\""` , string: true },
    { value: `;`, string: false }
  ]
);

runTest(
  "String with escaped backslash and quote",
  `const path = 'C:\\\\path\\'to';`,
  [
    { value: `const path = `, string: false },
    { value: `'C:\\\\path\\'to'`, string: true },
    { value: `;`, string: false }
  ]
);

runTest(
  "Code with no strings",
  `function add(a, b) { return a + b; }`,
  [
    { value: `function add(a, b) { return a + b; }`, string: false }
  ]
);

runTest(
  "Empty input",
  ``,
  []
);

runTest(
  "Adjacent strings",
  `'a' + "b" + \`c\``,
  [
    { value: `'a'`, string: true },
    { value: ` + `, string: false },
    { value: `"b"`, string: true },
    { value: ` + `, string: false },
    { value: "`c`", string: true }
  ]
);

// -------------------------
// Export test results for aggregation
// -------------------------
export default {
  name: "splitByStringLiterals.test.js",
  results: testResults
};
