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
// - `entry`: The entry point for the bundler (source file to start dependency resolution)
// - `outputDir`: The final bundled file to be generated in the "dist" directory
await bundler({
  entry: path.join(__dirname, "entry.js"),
  outputDir: path.join(__dirname, "public")
});

await import("./serve.js");
