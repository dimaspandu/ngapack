import {
  normalize,
  stripComments
} from "../index.js";

/**
 * Test runner
 * -----------
 */
const testResults = [];

function runTest(name, input, expected) {
  const result = stripComments(input);
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
  "Remove single-line comment",
  `const a = 1; // this is a comment`,
  `const a = 1;`
);

runTest(
  "Remove multi-line comment",
  `const a = 1; /* this is a multi-line comment */ const b = 2;`,
  `const a = 1; const b = 2;`
);

runTest(
  "Preserve string containing // inside",
  `const str = "// not a comment";`,
  `const str = "// not a comment";`
);

runTest(
  "Preserve string containing /* */ inside",
  `const str = "/* still not a comment */";`,
  `const str = "/* still not a comment */";`
);

runTest(
  "Preserve template literals with // inside",
  "const tpl = `Hello // world`;",
  "const tpl = `Hello // world`;"
);

runTest(
  "Preserve regex with // inside",
  `const pattern = /\\/\\/comment/;`,
  `const pattern = /\\/\\/comment/;`
);

runTest(
  "Preserve regex with /* */ inside",
  `const pattern = /\\/*block*\\//;`,
  `const pattern = /\\/*block*\\//;`
);

runTest(
  "Remove comment after regex",
  `const regex = /abc/; // remove this comment`,
  `const regex = /abc/;`
);

runTest(
  "Preserve comments inside strings and remove real ones",
  `
    const str = "example // not comment";
    // real comment
    const b = 5; /* another comment */
  `,
  `
    const str = "example // not comment";
    const b = 5;
  `
);

runTest(
  "Multiline block comment with line break",
  `
    const a = 1;
    /* this
       is
       multiline */
    const b = 2;
  `,
  `
    const a = 1;
    const b = 2;
  `
);

runTest(
  "Empty input",
  ``,
  ``
);

// Export test results for central report aggregation
export default {
  name: "stripComments.test.js",
  results: testResults
};
