// -----------------------------------------------------------------------------
// Import Core Node.js Modules
// -----------------------------------------------------------------------------
// These modules allow executing shell commands, working with ESM file paths,
// and handling asynchronous operations cleanly.
import { exec } from "child_process";      // For running external Node.js commands.
import { promisify } from "util";          // Converts callback-based functions into promises.
import { dirname } from "path";            // Extracts directory name from a file path.
import { fileURLToPath } from "url";       // Converts `import.meta.url` into a usable file path.

// -----------------------------------------------------------------------------
// Import Logger Utility
// -----------------------------------------------------------------------------
// Custom logger used for structured, colorized console output.
import { logger } from "../../utils/logger.js";

// -----------------------------------------------------------------------------
// Promisify `exec` for cleaner async/await usage
// -----------------------------------------------------------------------------
// This allows us to use `await run("command")` instead of nested callbacks.
const run = promisify(exec);

// -----------------------------------------------------------------------------
// Resolve Module Paths for ESM
// -----------------------------------------------------------------------------
// Since ES modules do not provide `__filename` and `__dirname` by default,
// we recreate them manually for consistency with CommonJS behavior.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// -----------------------------------------------------------------------------
// Main Function: runTest()
// -----------------------------------------------------------------------------
// Orchestrates an automated local test run that:
//   1. Builds the project (bundles, copies, and optimizes assets)
//   2. Starts a local HTTP server to serve the built files
//   3. Forwards all output to the terminal for live inspection
//   4. Gracefully shuts down on user interruption (Ctrl+C)
async function runTest() {
  logger.debug("[TEST]: Starting test build and server...");

  try {
    // -------------------------------------------------------------------------
    // Step 1: Run the build process
    // -------------------------------------------------------------------------
    // This step calls `run.build.js`, which handles:
    //   - File bundling and minification
    //   - Copying necessary assets and HTML templates into the dist directory
    logger.debug("[BUILD]: Running build process...");
    await run("node run.build.js", { cwd: __dirname });
    logger.debug("[BUILD]: Build completed successfully.");

    // -------------------------------------------------------------------------
    // Step 2: Start the HTTP server
    // -------------------------------------------------------------------------
    // Once the build is done, this launches the local server defined in
    // `run.start.js`. The server hosts the `dist` directory for testing.
    logger.debug("[START]: Launching server...");
    const startProcess = exec("node run.start.js", { cwd: __dirname });

    // -------------------------------------------------------------------------
    // Pipe stdout and stderr for live logging
    // -------------------------------------------------------------------------
    // This ensures that any logs from the server (or errors) appear
    // directly in the same console where this script runs.
    startProcess.stdout.pipe(process.stdout);
    startProcess.stderr.pipe(process.stderr);

    // -------------------------------------------------------------------------
    // Handle graceful shutdown (Ctrl+C)
    // -------------------------------------------------------------------------
    // When the user interrupts (SIGINT), the server process is terminated
    // cleanly to prevent zombie processes or port locking.
    process.on("SIGINT", () => {
      logger.debug("[TEST]: Stopping test server...");
      startProcess.kill("SIGINT");
      process.exit(0);
    });

  } catch (err) {
    // -------------------------------------------------------------------------
    // Error Handling
    // -------------------------------------------------------------------------
    // If either the build or the server fails to start,
    // the error is logged and the process exits with code 1.
    logger.error("[ERROR]: Test process failed.");
    logger.error(err.message);
    process.exit(1);
  }
}

// -----------------------------------------------------------------------------
// Execute the Test Runner
// -----------------------------------------------------------------------------
// This immediately starts the build + serve cycle when the script runs.
runTest();
