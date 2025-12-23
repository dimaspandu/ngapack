// -----------------------------------------------------------------------------
// Import Core Node.js Modules
// -----------------------------------------------------------------------------
import path, { dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import fsp from "fs/promises";

// -----------------------------------------------------------------------------
// Import Bundler and Logger
// -----------------------------------------------------------------------------
import bundler from "../../index.js";
import logger from "../../utils/logger.js";

// -----------------------------------------------------------------------------
// Resolve Current Module Paths
// -----------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = path.join(__dirname, "dist");

// -----------------------------------------------------------------------------
// Copy env.mock.js to dist directory
// -----------------------------------------------------------------------------
async function copyEnvMock() {
  const source = path.join(__dirname, "env.mock.js");
  const target = path.join(distDir, "env.mock.js");

  try {
    await fsp.mkdir(distDir, { recursive: true });
    await fsp.copyFile(source, target);
    logger.success("[COPY] env.mock.js successfully copied to dist/");
  } catch (err) {
    logger.error(`[ERROR] Failed to copy env.mock.js to dist: ${err.message}`);
    throw err;
  }
}

// -----------------------------------------------------------------------------
// Main Execution Flow
// -----------------------------------------------------------------------------
try {
  // ---------------------------------------------------------------------------
  // Step 1: Execute the bundlers
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // MicroFrontend Bundle
  // ---------------------------------------------------------------------------
  // Represents the remote microfrontend that will later be dynamically loaded
  // by an orchestrator (the main host application).
  //
  // Notes:
  //
  // 1. Namespace:
  //    - Although optional, it is strongly recommended to define a unique
  //      `namespace` (for example, "MicroFrontend").
  //    - This ensures that if multiple microfrontends contain files with
  //      identical names (such as `index.js` or `main.js`), they remain isolated
  //      and do not conflict within the global module registry.
  //
  // 2. Host:
  //    - The `host` parameter is essential when the microfrontend performs
  //      dynamic imports at runtime (for example, `import("/resources/feature.js")`).
  //    - Without specifying a fixed host, `location.origin` defaults to the
  //      orchestrator’s origin. For example:
  //          Orchestrator → http://localhost:9999
  //          Microfrontend → http://localhost:8888
  //
  //      If the microfrontend uses `location.origin`, it could incorrectly
  //      resolve imports as:
  //          http://localhost:9999/owner/microfrontend.js
  //
  //      instead of the correct path:
  //          http://localhost:8888/owner/microfrontend.js
  //
  //    - Providing a `host` (e.g. "https://www.microfrontends.com") ensures
  //      that the bundler correctly embeds and resolves the proper origin
  //      for all relative imports.
  //
  await bundler({
    entryFile: path.join(__dirname, "portal.js"),
    host: "https://www.microfrontends.com", // Ensures correct origin for dynamic imports
    outputFile: path.join(distDir, "microfrontend.js"),
    outputDirectory: distDir,
    namespace: "MicroFrontend" // Ensures unique module namespace isolation
  });

  // ---------------------------------------------------------------------------
  // MainFrontend Bundle
  // ---------------------------------------------------------------------------
  // Represents the main host application or orchestrator.
  // Because it runs under the same origin as the host, both `host` and `namespace`
  // parameters are optional in this context.
  await bundler({
    entryFile: path.join(__dirname, "entry.js"),
    outputFile: path.join(distDir, "main.js"),
    outputDirectory: distDir,
    namespace: "MainFrontend"
  });

  // ---------------------------------------------------------------------------
  // Step 2: Copy env.mock.js to dist
  // ---------------------------------------------------------------------------
  await copyEnvMock();

  // ---------------------------------------------------------------------------
  // Step 3: Import env.mock.js (converted to file:// URL)
  // ---------------------------------------------------------------------------
  const envMockUrl = pathToFileURL(path.join(distDir, "env.mock.js")).href;
  await import(envMockUrl);

  // ---------------------------------------------------------------------------
  // Step 4: Import and execute the generated bundle (converted to file:// URL)
  // ---------------------------------------------------------------------------
  const bundleUrl = pathToFileURL(path.join(distDir, "main.js")).href;
  await import(bundleUrl);

  logger.success("[RUN] Bundling and execution completed successfully.");
} catch (error) {
  logger.error(`[FATAL] Process failed: ${error.message}`);
  process.exit(1);
}
