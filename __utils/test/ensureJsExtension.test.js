import {
  normalize,
  ensureJsExtension
} from "../index.js";

// Track test results
const testResults = [];

function runTest(name, input, expected) {
  const result = ensureJsExtension(input);
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
  "Add .js extension to file without extension",
  "path/to/file",
  "path/to/file.js"
);

runTest(
  "Replace existing extension with .js",
  "path/to/file.txt",
  "path/to/file.js"
);

runTest(
  "Replace existing extension with .js (even if already .js)",
  "path/to/file.js",
  "path/to/file.js"
);

runTest(
  "Handle path with query parameters",
  "path/to/file.txt?version=1",
  "path/to/file.js"
);

runTest(
  "Handle path with fragment identifier",
  "path/to/file.txt#section1",
  "path/to/file.js"
);

runTest(
  "Handle file path with multiple subdirectories",
  "a/b/c/d/file.php",
  "a/b/c/d/file.js"
);

runTest(
  "Handle file with no extension and a fragment identifier",
  "a/b/c/d/file#section1",
  "a/b/c/d/file.js"
);

runTest(
  "Handle path with query parameters and no extension",
  "a/b/c/file?version=2",
  "a/b/c/file.js"
);

runTest(
  "Handle complex path with query and fragment",
  "a/b/c/file.txt?version=2#section3",
  "a/b/c/file.js"
);

// Export test result summary
export default {
  name: "ensureJsExtension.test.js",
  results: testResults
};
