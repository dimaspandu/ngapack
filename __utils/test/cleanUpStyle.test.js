import {
  normalize,
  cleanUpStyle
} from "../index.js";

// Track test results
const testResults = [];

function runTest(name, input, expected) {
  const result = cleanUpStyle(input);
  const pass = normalize(result) === normalize(expected);

  // Record test outcome
  testResults.push({ name, pass });

  // Immediate console output (optional during dev)
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
  "Removes whitespace and compresses basic CSS",
  `
    .box {
      padding: 10px;
      margin:  20px ;
    }
  `,
  `.box{padding:10px;margin:20px}`
);

runTest(
  "Preserves string values and normalizes quotes",
  `
    .btn {
      content: 'Click here';
      font-family: "Open Sans";
    }
  `,
  `.btn{content:"Click here";font-family:"Open Sans"}`
);

runTest(
  "Handles nested rules with media query spacing fix",
  `
    @media screen and(max-width: 600px) {
      .container {
        padding: 1rem;
      }
    }
  `,
  `@media screen and (max-width:600px){.container{padding:1rem}}`
);

runTest(
  "Removes semicolon before closing brace",
  `
    .item {
      color: red;;
    }
  `,
  `.item{color:red}`
);

runTest(
  "Spaces around symbols are cleaned",
  `
    .a , .b > .c {
      display : block ;
    }
  `,
  `.a,.b>.c{display:block}`
);

runTest(
  "Removes whitespace between CSS blocks",
  `
  .main {
    color: red;
  }

  .alt {
    color: blue;
  }
  `,
  `.main{color:red}.alt{color:blue}`
);

// Export test result summary
export default {
  name: "cleanUpStyle.test.js",
  results: testResults
};
