import {
  normalize,
  stripHTMLComments
} from "../index.js";

/**
 * Test runner
 * -----------
 */
const testResults = [];

function runTest(name, input, expected) {
  const result = stripHTMLComments(input);
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
  "Strip single HTML comment",
  `
    <div>
      <!-- This is a comment -->
      <p>Hello</p>
    </div>
  `,
  `
    <div>
      <p>Hello</p>
    </div>
  `
);

runTest(
  "Strip multiple HTML comments",
  `
    <!-- Top comment -->
    <main>
      <h1>Title</h1>
      <!-- Inner comment -->
      <section>Content</section>
      <!-- Another one -->
    </main>
    <!-- Footer comment -->
  `,
  `
    <main>
      <h1>Title</h1>
      <section>Content</section>
    </main>
  `
);

runTest(
  "Strip JS comments inside <script> and minify",
  `
    <script>
      // This is a comment
      const a = 1;
      /* block
         comment */
      const b = 2;
      console.log(a + b); // log it
    </script>
  `,
  `<script>const a=1;const b=2;console.log(a+b);</script>`
);

runTest(
  "Strip CSS comments inside <style> and minify",
  `
    <style>
      /* Primary color */
      .main {
        color: red;
      }

      /* Secondary */
      .alt {
        color: blue;
      }
    </style>
  `,
  `<style>.main{color:red}.alt{color:blue}</style>`
);

runTest(
  "Mixed HTML with script and style tags",
  `
    <!-- HTML comment -->
    <html>
      <head>
        <style>
          /* Reset */
          body { margin: 0; }
        </style>
      </head>
      <body>
        <script>
          // Init
          let x = 5;
          let y = 10;
          console.log(x + y); // sum
        </script>
        <h1>App</h1>
      </body>
    </html>
    <!-- End comment -->
  `,
  `
    <html>
      <head>
        <style>body{margin:0}</style>
      </head>
      <body>
        <script>let x=5;let y=10;console.log(x+y);</script>
        <h1>App</h1>
      </body>
    </html>
  `
);

runTest(
  "Preserve attributes on script/style tags",
  `
    <script type="module">
      // Test module
      export const a = 1;
    </script>
  `,
  `<script type="module">export const a=1;</script>`
);

runTest(
  "No comments at all",
  `
    <div><p>No comments here</p></div>
  `,
  `
    <div><p>No comments here</p></div>
  `
);

runTest(
  "Empty input",
  ``,
  ``
);

// Export test results for central report aggregation
export default {
  name: "stripHTMLComments.test.js",
  results: testResults
};
