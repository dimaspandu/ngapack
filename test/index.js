// Import core Node.js modules
// `path` is used for manipulating filesystem paths
// `dirname` is used to extract the directory name of a file path
import path, { dirname } from "path";

// Import `fileURLToPath` to convert an ES module `import.meta.url` into a regular file path
// This is necessary because in ESM, `__filename` and `__dirname` are not available by default
import { fileURLToPath } from "url";

// Import the main bundler function from the root index.js file
// The bundler is expected to take configuration options and produce a bundle output
import bundler from "../index.js";

// Derive the absolute path of the current file using the ES module pattern
// `fileURLToPath(import.meta.url)` converts the module's URL into a file system path string
const __filename = fileURLToPath(import.meta.url);

// Extract the directory name from the current file path
// This replicates the CommonJS `__dirname` behavior
const __dirname = dirname(__filename);

// Execute the bundler asynchronously with explicit input and output paths
// - `entryFile`: The entry point for the bundler (source file to start dependency resolution)
// - `outputDirectory`: The final bundled file to be generated in the "dist" directory
await bundler({
  entryFile: path.join(__dirname, "entry.js"),
  outputDirectory: path.join(__dirname, "dist"),
  outputFilename: "bundle.js"
});

// Dynamically import a mock environment configuration script after bundling
// This script (`env.mock.js`) likely sets up environment variables or stubs for testing
await import("./env.mock.js");

// Dynamically import the freshly generated bundle to execute it within the same runtime
// This validates that the bundler output is functional and ready to run
await import("./dist/bundle.js");
