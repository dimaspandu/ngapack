import {
  normalize,
  minifyHTML
} from "../index.js";

/**
 * Test runner
 * ----------- 
 */
const testResults = [];

function runTest(name, input, expected) {
  const result = minifyHTML(input);
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
  "Remove whitespace between tags",
  `
    <div>
      <p>Hello</p>
    </div>
  `,
  `<div><p>Hello</p></div>`
);

runTest(
  "Collapse multiple spaces inside text",
  `
    <div>
      <p>  Hello    world!  </p>
    </div>
  `,
  `<div><p> Hello world! </p></div>`
);

runTest(
  "Remove tabs and newlines",
  `\t<div>\n\t<span>\n\t\tItem</span>\n</div>\r\n`,
  `<div><span>Item</span></div>`
);

runTest(
  "Handle inline HTML without modifications",
  `<p>Hello, <strong>world</strong>!</p>`,
  `<p>Hello, <strong>world</strong>!</p>`
);

runTest(
  "Trim leading and trailing spaces",
  `  \n   <div>Content</div>   \t\n`,
  `<div>Content</div>`
);

runTest(
  "Empty HTML input",
  ``,
  ``
);

// Export test results for central report aggregation
export default {
  name: "minifyHTML.test.js",
  results: testResults
};
