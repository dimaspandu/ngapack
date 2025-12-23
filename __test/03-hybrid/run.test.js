import path, { dirname } from "path";
import { fileURLToPath } from "url";
import bundler from "../../index.js";
import config from "./config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// -----------------------------------------------------------------------------
// Execute the Bundler
// -----------------------------------------------------------------------------
// The bundler is executed asynchronously because the bundling process may involve
// multiple file reads, transformations, and dependency resolutions.
// 
// Configuration Options:
// - `host`: Used primarily for environments running a local development server.
//   This ensures that dynamic `import()` calls resolve correctly to absolute URLs.
// - `entryFile`: The main file to start dependency resolution from (the root module).
// - `outputDirectory`: The directory where the final bundled output will be placed.
await bundler({
  host: config.host,
  entryFile: path.join(__dirname, config.entryFile),
  outputDirectory: path.join(__dirname, config.outputDirectory)
});

// -----------------------------------------------------------------------------
// Start the Local Test Server
// -----------------------------------------------------------------------------
// After bundling is complete, the script dynamically imports and executes the
// local server (`run.start.js`). This script serves the bundled output via HTTP,
// enabling browser-based testing of the generated code.
// 
// Using `await import()` ensures the bundler finishes completely before the server starts.
await import("./run.start.js");
