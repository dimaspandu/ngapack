/**
 * Simple static file server for local testing.
 *
 * This server exists only for development and manual verification.
 * It is intentionally decoupled from the bundler implementation.
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Resolve __filename and __dirname in ESM context.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Create a basic static HTTP server.
 *
 * rootDir:
 *   Directory to be served as the web root.
 *
 * port:
 *   Local port to listen on.
 */
function createStaticServer(rootDir, port) {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    const filePath = path.join(
      rootDir,
      urlPath === "/" ? "/index.html" : urlPath
    );

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("Not Found");
        return;
      }

      const ext = path.extname(filePath);
      const typeMap = {
        ".html": "text/html",
        ".js": "application/javascript",
        ".json": "application/json",
        ".css": "text/css"
      };

      res.writeHead(200, {
        "Content-Type": typeMap[ext] || "text/plain",
        "Access-Control-Allow-Origin": "*"
      });

      res.end(data);
    });
  });

  server.listen(port, () => {
    console.log(`✔ Server running at http://localhost:${port}`);
    console.log(`  Serving: ${rootDir}`);
  });
}

/**
 * Start the development server for bundled output.
 */
createStaticServer(path.join(__dirname, "public"), 2121);
