// -----------------------------------------------------------------------------
// Import Required Core and Local Modules
// -----------------------------------------------------------------------------

// Node.js core module for file system operations (reading/writing files)
import fs from "fs";

// Node.js core module for working with file and directory paths
import path, { dirname } from "path";

// Utility function that converts `import.meta.url` (ESM module URL) 
// into a valid file system path. 
// This is necessary because ESM modules do not have __filename or __dirname by default.
import { fileURLToPath } from "url";

// Import the main bundler function from the project root.
// This is the tool responsible for processing the entry file, resolving dependencies,
// and generating the bundled output into the specified directory.
import bundler from "../../index.js";


// -----------------------------------------------------------------------------
// Resolve Current Module Paths (ESM-Compatible Replacement for __dirname)
// -----------------------------------------------------------------------------

// Convert the current module's URL (import.meta.url) into a standard file path
const __filename = fileURLToPath(import.meta.url);

// Extract the directory name from that path
const __dirname = dirname(__filename);


// -----------------------------------------------------------------------------
// Utility: Path Resolver Helper
// -----------------------------------------------------------------------------

// A small helper function to make all relative paths absolute,
// ensuring consistency across environments.
// Example: resolver("src/index.js") -> "/abs/path/to/src/index.js"
const resolver = filePath => path.resolve(__dirname, filePath);


// -----------------------------------------------------------------------------
// Load and Parse Configuration
// -----------------------------------------------------------------------------

// Build an absolute path to the configuration file located in the same directory
const configPath = path.join(__dirname, "config.json");

// Read the configuration file synchronously and parse its JSON content
// The config typically contains keys like:
// - entryFile: main entry module for the bundler
// - outputDirectory: target directory for bundled output
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));


// -----------------------------------------------------------------------------
// Execute the Bundler
// -----------------------------------------------------------------------------

// Invoke the bundler with fully resolved absolute paths.
// The bundler will:
// 1. Read the entry module and all its dependencies.
// 2. Bundle them into a single optimized output file.
// 3. Write the result to the specified output directory.
bundler({
  entryFile: resolver(config.entryFile),
  outputDirectory: resolver(config.outputDirectory),
});
