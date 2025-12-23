// -----------------------------------------------------------------------------
// Configuration for Bundler and Test Server
// -----------------------------------------------------------------------------
// This configuration object provides all the essential parameters required
// by both `run.test.js` and `run.start.js` scripts. It defines the input files,
// output directories, server port, and host settings used during local
// development and testing.

// -----------------------------------------------------------------------------
// Define the port number used by the local HTTP server.
// This port must be available before starting the development or test server.
// If the port is already in use, the server startup will fail.
// -----------------------------------------------------------------------------
const PORT = 7733;

// -----------------------------------------------------------------------------
// Exported configuration object
// -----------------------------------------------------------------------------
// This object centralizes key parameters for reusability between multiple scripts.
// It ensures consistency between the bundler process and the local server
// environment.
// 
// Properties:
// - `entryFile`: The main JavaScript file that serves as the application's
//   entry point. The bundler starts dependency resolution from this file.
// 
// - `entryHTML`: The primary HTML file that bootstraps the client-side
//   application. It may reference the entry JavaScript file directly via
//   `<script type="module" src="..."></script>`.
// 
// - `host`: The full base URL used for serving dynamic or static assets
//   during local development. This is essential for resolving dynamic
//   `import()` statements in the browser that depend on an absolute URL.
// 
// - `outputDirectory`: The directory where the bundled files and copied
//   assets will be generated. This directory typically mirrors the
//   production build output structure.
// 
// - `port`: The same value as `PORT`, explicitly included for convenience
//   and direct reference by server initialization code.
// -----------------------------------------------------------------------------
export const config = {
  entryFile: "index.js",
  entryHTML: "index.html",
  host: `http://localhost:${PORT}`,
  outputDirectory: "dist",
  port: PORT
};

// -----------------------------------------------------------------------------
// Default export
// -----------------------------------------------------------------------------
// This allows the configuration to be imported using either named or
// default import syntax, depending on the script's preference.
//
// Example:
//   import { config } from "./config.js";
//   or
//   import config from "./config.js";
// -----------------------------------------------------------------------------
export default config;
