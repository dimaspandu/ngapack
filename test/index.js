/**
 * Test entry for ngapack
 *
 * This file acts as a minimal integration test:
 * - Runs the bundler with a concrete entry file
 * - Emits output into the public directory
 * - Optionally starts a static server for manual inspection
 */

import path, { dirname } from "path";
import { fileURLToPath } from "url";

// Import the bundler entry point
import bundler from "../bundler/index.js";

/**
 * Resolve __filename and __dirname for ESM.
 * Node.js does not provide these globals in ES modules.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Execute bundler with explicit test configuration.
 *
 * entry:
 *   Source entry file used to build the dependency graph.
 *
 * outputDir:
 *   Destination directory for all emitted bundles and assets.
 *
 * outputFilename:
 *   Explicit output name to avoid relying on the default.
 *
 * uglified:
 *   Enables minification to simulate production output.
 */
await bundler({
  entry: path.join(__dirname, "src", "entry.js"),
  outputDir: path.join(__dirname, "public"),
  outputFilename: "entry.js",
  uglified: true
});

/**
 * Start a local static server after bundling completes.
 * This is intentionally kept separate from the bundler itself.
 */
await import("./serve.js");
