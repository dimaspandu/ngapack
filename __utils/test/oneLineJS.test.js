import {
  normalize,
  oneLineJS
} from "../index.js";

/**
 * Test runner
 * -----------
 */
const testResults = [];

function runTest(name, input, expected) {
  const result = oneLineJS(input);
  const pass = normalize(result) === normalize(expected);

  // Store test outcome for reporting
  testResults.push({ name, pass });

  // Console output for manual debugging
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
  "Flatten simple multi-line JS code",
  `
    const a = 1;
    const b = 2;
    console.log(a + b);
  `,
  `const a = 1; const b = 2; console.log(a + b);`
);

runTest(
  "Remove newlines in method chaining",
  `
    const result = arr
      .map(x => x * 2)
      .filter(x => x > 5)
      .join(",");
  `,
  `const result = arr.map(x => x * 2).filter(x => x > 5).join(",");`
);

runTest(
  "Preserve string literals with newlines",
  `
    const text = "Hello
    world!";
    const info = \`Line 1
    Line 2\`;
  `,
  `const text = "Hello world!"; const info = \`Line 1 Line 2\`;`
);

runTest(
  "Collapse multiple spaces",
  `
    const    a    =    5;
  `,
  `const a = 5;`
);

runTest(
  "Remove unwanted space before dot method",
  `
    const result = value 
      .toString()
      .trim();
  `,
  `const result = value.toString().trim();`
);

runTest(
  "Handle empty input",
  ``,
  ``
);

runTest(
  "Handle multiple spaces inside template literals",
  oneLineJS(`
    const htmlContent = \`
      <div>
        <p>Hello, world!</p>
      </div>
    \`;
  `),
  `const htmlContent = \` <div> <p>Hello, world!</p> </div> \`;`
);

// Export test results for central report aggregation
export default {
  name: "oneLineJS.test.js",
  results: testResults
};
