import {
  normalize,
  escapeForDoubleQuote
} from "../index.js";

// Track test results
const testResults = [];

function runTest(name, input, expected) {
  const result = escapeForDoubleQuote(input);
  const pass = normalize(result) === normalize(expected);

  // Record test outcome
  testResults.push({ name, pass });

  // Console output for debugging
  console.log(`\n--- Test: ${name} ---`);
  console.log(pass ? "PASS" : "FAIL");
  if (!pass) {
    console.log("\n--- Output ---\n", JSON.stringify(result));
    console.log("\n--- Expected ---\n", JSON.stringify(expected));
  }
}

// -------------------------
// Tests
// -------------------------

runTest(
  "Escape double quotes only",
  `He said "Hello"`,
  `He said \\\"Hello\\\"`
);

runTest(
  "Escape backslashes only",
  `C:\\Program Files\\App`,
  `C:\\\\Program Files\\\\App`
);

runTest(
  "Escape newlines (\\n)",
  `Line 1\nLine 2`,
  `Line 1\\nLine 2`
);

runTest(
  "Escape carriage return + newline (\\r\\n)",
  `Line 1\r\nLine 2`,
  `Line 1\\nLine 2`
);

runTest(
  "Escape everything (quotes, backslashes, and newlines)",
  `He said: "Go to C:\\Program Files\\App"\nThen press Enter.`,
  `He said: \\\"Go to C:\\\\Program Files\\\\App\\\"\\nThen press Enter.`
);

runTest(
  "No escaping needed",
  `Just a simple sentence.`,
  `Just a simple sentence.`
);

runTest(
  "Empty string",
  ``,
  ``
);

// Export test result summary
export default {
  name: "escapeForDoubleQuote.test.js",
  results: testResults
};
