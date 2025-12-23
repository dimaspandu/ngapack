// -----------------------------------------------------------------------------
// Import Core Node.js Modules
// -----------------------------------------------------------------------------
// These built-in modules are required for basic server functionality,
// file operations, and resolving file system paths.
import http from "http";          // Provides the core HTTP server functionality.
import fs from "fs";              // Provides synchronous and asynchronous file I/O methods.
import path, { dirname } from "path"; // Utilities for working with file and directory paths.
import { fileURLToPath } from "url";  // Converts `import.meta.url` to a valid file system path.

// -----------------------------------------------------------------------------
// Import Logger Utility
// -----------------------------------------------------------------------------
// The logger is used for structured console output with severity levels (debug, error, etc.).
import { logger } from "../../utils/logger.js";

// -----------------------------------------------------------------------------
// Resolve Current Module Paths
// -----------------------------------------------------------------------------
// Since ES modules don't have __filename or __dirname by default, we recreate them manually.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// -----------------------------------------------------------------------------
// Load Configuration
// -----------------------------------------------------------------------------
// The configuration file (config.json) defines essential build parameters such as:
// - `port`: The HTTP server port
// - `outputDirectory`: The folder containing the build output (e.g., "dist")
// - and other optional fields used by other scripts in the toolchain.
const configPath = path.join(__dirname, "config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

// Extract configuration values for easy access.
const PORT = config.port;                                  // Development server port.
const distDir = path.join(__dirname, config.outputDirectory); // Absolute path to the output directory.

// -----------------------------------------------------------------------------
// MIME Type Mapping
// -----------------------------------------------------------------------------
// Defines how different file extensions are served with correct HTTP Content-Type headers.
const mimeTypes = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain"
};

// -----------------------------------------------------------------------------
// Fallback HTML File for SPA (Single Page Application)
// -----------------------------------------------------------------------------
// For SPAs, all unmatched routes are redirected to `index.html`,
// allowing client-side routing to take over.
const indexHtmlPath = path.join(distDir, "index.html");

// -----------------------------------------------------------------------------
// Helper: Adjust Script Path for Nested Routes
// -----------------------------------------------------------------------------
// When navigating into nested routes (e.g., `/about` or `/products/item/1`),
// relative paths like "./index.js" would break.
// This function rewrites `<script src="./index.js">` to maintain proper relative paths.
//
// Example:
//   Request: /about
//   Original: <script src="./index.js">
//   Adjusted: <script src="../index.js">
function adjustSpaScript(htmlContent, reqUrl) {
  const segments = reqUrl.split("/").filter(Boolean); // Count how deep the route is.
  let relativePrefix = "";
  if (segments.length > 0) {
    relativePrefix = "../".repeat(segments.length);
  }

  return htmlContent.replace(
    /<script[^>]*src=["']\.\/index\.js["'][^>]*><\/script>/i,
    `<script type="module" src="${relativePrefix}index.js"></script>`
  );
}

// -----------------------------------------------------------------------------
// Helper: Adjust CSS Link Path for Nested Routes
// -----------------------------------------------------------------------------
// Similar to `adjustSpaScript`, this ensures that any
// `<link href="./file.css">` paths remain valid in nested routes.
function adjustSpaLink(htmlContent, reqUrl) {
  const segments = reqUrl.split("/").filter(Boolean);
  let relativePrefix = "";
  if (segments.length > 0) {
    relativePrefix = "../".repeat(segments.length);
  }

  return htmlContent.replace(
    /<link([^>]*?)href=["']\.\/([^"']+)["']([^>]*)>/gi,
    `<link$1href="${relativePrefix}$2"$3>`
  );
}

// -----------------------------------------------------------------------------
// HTTP Server Definition
// -----------------------------------------------------------------------------
// This lightweight HTTP server serves the bundled static files in the "dist" folder.
// It also provides SPA (Single Page Application) fallback behavior for client-side routing.
const server = http.createServer((req, res) => {
  // Resolve requested file path (default to /index.html)
  let filePath = req.url === "/" ? "/index.html" : req.url;

  // ---------------------------------------------------------------------------
  // Serve `index.html` explicitly
  // ---------------------------------------------------------------------------
  // If the user accesses "/" or "/index.html", serve the main entry HTML file.
  if (filePath === "/index.html" || filePath === "/") {
    fs.readFile(indexHtmlPath, "utf8", (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Error reading index.html");
      } else {
        // Adjust resource paths dynamically for nested routes.
        let html = adjustSpaScript(data, filePath);
        html = adjustSpaLink(html, filePath);

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(html);
      }
    });
    return;
  }

  // ---------------------------------------------------------------------------
  // Serve Static Files
  // ---------------------------------------------------------------------------
  // Attempt to read the requested file from the build output directory (dist).
  const absPath = path.join(distDir, filePath);

  fs.readFile(absPath, (err, data) => {
    if (err) {
      // -----------------------------------------------------------------------
      // SPA Fallback: Serve index.html for unknown routes
      // -----------------------------------------------------------------------
      // If the requested file doesn’t exist, serve index.html
      // so the client-side router can handle the route.
      fs.readFile(indexHtmlPath, "utf8", (fbErr, fbData) => {
        if (fbErr) {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Not found");
        } else {
          let html = adjustSpaScript(fbData, filePath);
          html = adjustSpaLink(html, filePath);
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(html);
        }
      });
    } else {
      // -----------------------------------------------------------------------
      // Serve static content with correct MIME type
      // -----------------------------------------------------------------------
      const ext = path.extname(absPath).toLowerCase();
      const contentType = mimeTypes[ext] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    }
  });
});

// -----------------------------------------------------------------------------
// Start Server
// -----------------------------------------------------------------------------
// Launch the local development/test server on the configured port.
// Once running, it logs the access URL to the console.
server.listen(PORT, () => {
  logger.debug(`Start server running at http://localhost:${PORT}`);
});
