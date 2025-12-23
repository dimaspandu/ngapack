import {
  normalize,
  cleanUpCode,
  oneLineJS
} from "../index.js";

// Track test results
const testResults = [];

function runTest(name, input, expected) {
  const result = cleanUpCode(input);
  const pass = normalize(result) === normalize(expected);

  // Record test outcome
  testResults.push({ name, pass });

  // Immediate output for debugging
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
  "Minify simple JavaScript code",
  oneLineJS(`
    const a = 10;
    const b = 20;
    console.log(a + b);
  `),
  `const a=10;const b=20;console.log(a+b);`
);

runTest(
  "Handle spaces around symbols and reduce newlines",
  oneLineJS(`
    function sum(a, b) {
      return a + b;
    }
  `),
  `function sum(a,b){return a+b;}`
);

runTest(
  "Preserve strings and template literals",
  oneLineJS(`
    const greeting = "Hello, world!";
    const message = \`Hello, \${name}!\`;
  `),
  `const greeting="Hello, world!";const message=\`Hello, \${name}!\`;`
);

runTest(
  "Minify template literal assigned to innerHTML",
  oneLineJS(`
    element.innerHTML = \`
      <div>
        <p>Hello, world!</p>
      </div>
    \`;
  `),
  `element.innerHTML=\`<div><p>Hello, world!</p></div>\`;`
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
  `const htmlContent=\`<div><p>Hello, world!</p></div>\`;`
);

runTest(
  "Handle regex literals and keep them intact",
  oneLineJS(`
    const regex = /\\d+/;
    const regex2 = /[a-zA-Z]+/;
  `),
  `const regex=/\\d+/;const regex2=/[a-zA-Z]+/;`
);

runTest(
  "Remove unnecessary spaces and trim correctly",
  oneLineJS(`
    const a = 10 ; 
    const b =  20 ; 
    if(a + b === 30) {
      console.log('Equal');
    }
  `),
  `const a=10;const b=20;if(a+b===30){console.log('Equal');}`
);

runTest(
  "Handle space inside nested objects and arrays",
  oneLineJS(`
    const obj = {
      foo: 'bar',
      arr: [1, 2, 3]
    };
  `),
  `const obj={foo:'bar',arr:[1,2,3]};`
);

runTest(
  "Handle function declarations with extra spaces",
  oneLineJS(`
    function example ( param ) {
      return param;
    }
  `),
  `function example(param){return param;}`
);

runTest(
  "Minify with fallback empty string using double quotes",
  `this._styleEl.styleSheet.cssText = cssText || "";`,
  `this._styleEl.styleSheet.cssText=cssText||"";`
);

// Export test result summary
export default {
  name: "cleanUpCode.test.js",
  results: testResults
};
