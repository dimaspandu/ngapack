import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Resolve the current file location because ES modules do not expose
 * `__filename` and `__dirname` automatically.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load the production server configuration from `config.json`.
 */
const configPath = path.join(__dirname, "config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

const port = config.port;
const outputDirectory = path.join(__dirname, config.outputDir);

/**
 * Build the project before serving the bundled output.
 *
 * The dynamic import ensures the build step completes first.
 */
await import("./run.bundle.js");

/**
 * Map file extensions to response content types.
 */
const MIME_TYPE_BY_EXTENSION = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".json": "application/json",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml"
};

/**
 * Create a small static server for bundled build artifacts.
 *
 * @param {string} rootDirectory
 * @param {number} portNumber
 */
function createStaticServer(rootDirectory, portNumber) {
  const server = http.createServer((request, response) => {
    const requestUrl = request.url ?? "/";
    let requestPathname = decodeURIComponent(requestUrl.split("?")[0]);

    // Normalize directory requests to a trailing-slash URL so relative asset
    // references remain stable.
    if (!requestPathname.endsWith("/") && !path.extname(requestPathname)) {
      const directoryPath = path.join(rootDirectory, requestPathname);

      if (
        fs.existsSync(directoryPath) &&
        fs.statSync(directoryPath).isDirectory()
      ) {
        const indexPath = path.join(directoryPath, "index.html");

        if (fs.existsSync(indexPath)) {
          response.writeHead(302, { Location: `${requestPathname}/` });
          response.end();
          return;
        }
      }
    }

    let filePath = path.join(
      rootDirectory,
      requestPathname === "/" ? "/index.html" : requestPathname
    );

    // Resolve requests for nested directories to their local `index.html`.
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    fs.readFile(filePath, (readError, fileContents) => {
      if (!readError) {
        const fileExtension = path.extname(filePath);

        response.writeHead(200, {
          "Content-Type":
            MIME_TYPE_BY_EXTENSION[fileExtension] || "text/plain",
          "Access-Control-Allow-Origin": "*"
        });
        response.end(fileContents);
        return;
      }

      // Bundled output should contain every requestable asset, so unknown paths
      // can return a straightforward 404 response.
      response.writeHead(404);
      response.end("Not Found");
    });
  });

  server.listen(portNumber, () => {
    console.log(`Server running at http://localhost:${portNumber}`);
    console.log(`  Serving bundled output from: ${rootDirectory}`);
  });
}

/**
 * Start the server against the bundled output directory.
 */
createStaticServer(outputDirectory, port);
