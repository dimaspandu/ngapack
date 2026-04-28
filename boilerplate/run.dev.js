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
 * Return the latest modification timestamp across source files that should
 * trigger a browser refresh during development.
 *
 * @param {string} directoryPath - Directory to scan recursively.
 * @returns {number}
 */
function getLatestModifiedTimeMs(directoryPath) {
  let latestModifiedTimeMs = 0;
  const directoryEntries = fs.readdirSync(directoryPath, {
    withFileTypes: true
  });

  for (const entry of directoryEntries) {
    const entryPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      latestModifiedTimeMs = Math.max(
        latestModifiedTimeMs,
        getLatestModifiedTimeMs(entryPath)
      );
      continue;
    }

    const fileExtension = path.extname(entry.name).toLowerCase();
    if (![".js", ".json", ".css", ".html"].includes(fileExtension)) {
      continue;
    }

    const fileStats = fs.statSync(entryPath);
    latestModifiedTimeMs = Math.max(
      latestModifiedTimeMs,
      fileStats.mtimeMs
    );
  }

  return latestModifiedTimeMs;
}

/**
 * Load the development server configuration from `config.json`.
 */
const configPath = path.join(__dirname, "config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

const port = config.port;
const sourceDirectory = path.join(__dirname, config.devDir);

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
 * Inject a tiny live-reload script into HTML responses.
 *
 * The browser checks a special version endpoint and reloads when it detects
 * that the source tree changed since the last check.
 *
 * @param {string} htmlDocument
 * @returns {string}
 */
function injectLiveReloadScript(htmlDocument) {
  const liveReloadScript = `\n<script>\n(function () {\n  let lastVersion = null;\n\n  async function reloadWhenSourceChanges() {\n    try {\n      const response = await fetch("/__dev/version", { cache: "no-store" });\n      const version = await response.text();\n\n      if (lastVersion && version !== lastVersion) {\n        location.reload();\n        return;\n      }\n\n      lastVersion = version;\n    } catch (error) {\n      console.warn("Live reload check failed.", error);\n    }\n  }\n\n  window.addEventListener("focus", reloadWhenSourceChanges);\n  reloadWhenSourceChanges();\n})();\n</script>\n`;

  if (htmlDocument.includes("</body>")) {
    return htmlDocument.replace("</body>", `${liveReloadScript}</body>`);
  }

  return htmlDocument + liveReloadScript;
}

/**
 * Create a small development server that serves source files directly and
 * falls back to `index.html` for client-side routes.
 *
 * @param {string} rootDirectory
 * @param {number} portNumber
 */
function createStaticServer(rootDirectory, portNumber) {
  const server = http.createServer((request, response) => {
    const requestUrl = request.url ?? "/";
    let requestPathname = decodeURIComponent(requestUrl.split("?")[0]);

    // Normalize directory requests to a trailing-slash URL so relative asset
    // references continue to resolve consistently.
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

    if (requestPathname === "/__dev/version") {
      const version = String(getLatestModifiedTimeMs(rootDirectory));

      response.writeHead(200, {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*"
      });
      response.end(version);
      return;
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
        const responseBody =
          fileExtension === ".html"
            ? injectLiveReloadScript(fileContents.toString())
            : fileContents;

        response.writeHead(200, {
          "Content-Type":
            MIME_TYPE_BY_EXTENSION[fileExtension] || "text/plain",
          "Access-Control-Allow-Origin": "*"
        });
        response.end(responseBody);
        return;
      }

      const requestedExtension = path.extname(requestPathname);

      // Requests without a file extension are treated as client-side routes.
      if (!requestedExtension) {
        const indexPath = path.join(rootDirectory, "index.html");

        fs.readFile(indexPath, (indexReadError, indexFileContents) => {
          if (indexReadError) {
            response.writeHead(500);
            response.end("Failed to load index.html");
            return;
          }

          response.writeHead(200, {
            "Content-Type": "text/html",
            "Access-Control-Allow-Origin": "*"
          });
          response.end(
            injectLiveReloadScript(indexFileContents.toString())
          );
        });
        return;
      }

      response.writeHead(404);
      response.end("Not Found");
    });
  });

  server.listen(portNumber, () => {
    console.log(`Dev server running at http://localhost:${portNumber}`);
    console.log(`  Serving source from: ${rootDirectory}`);
  });
}

/**
 * Start the development server against the source directory.
 */
createStaticServer(sourceDirectory, port);
