import http from "http";
import fs from "fs";
import fsp from "fs/promises";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { logger } from "../../__utils/logger.js";
import { config } from "./config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = config.port;
const distDir = path.join(__dirname, config.outputDirectory);
const indexHtmlSource = path.join(__dirname, config.entryHTML);
const indexHtmlTarget = path.join(distDir, config.entryHTML);

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
// Copy index.html only once before server starts
// -----------------------------------------------------------------------------
async function copyIndexHtmlOnce() {
  try {
    await fsp.mkdir(distDir, { recursive: true });
    await fsp.copyFile(indexHtmlSource, indexHtmlTarget);
    logger.success("[COPY]: index.html successfully copied to dist/");
  } catch (err) {
    logger.error(`[ERROR]: Failed to copy index.html to dist — ${err.message}`);
  }
}

// -----------------------------------------------------------------------------
// Adjust <script> path for nested routes
// -----------------------------------------------------------------------------
function adjustSpaScript(htmlContent, reqUrl) {
  const segments = reqUrl.split("/").filter(Boolean);
  const relativePrefix = "../".repeat(segments.length);
  return htmlContent.replace(
    /<script[^>]*src=["']\.\/index\.js["'][^>]*><\/script>/i,
    `<script type="module" src="${relativePrefix}index.js"></script>`
  );
}

// -----------------------------------------------------------------------------
// Adjust <link href="./..."> paths for nested routes
// -----------------------------------------------------------------------------
function adjustSpaLink(htmlContent, reqUrl) {
  const segments = reqUrl.split("/").filter(Boolean);
  const relativePrefix = "../".repeat(segments.length);
  return htmlContent.replace(
    /<link([^>]*?)href=["']\.\/([^"']+)["']([^>]*)>/gi,
    `<link$1href="${relativePrefix}$2"$3>`
  );
}

// -----------------------------------------------------------------------------
// Simple static + SPA fallback HTTP server
// -----------------------------------------------------------------------------
const server = http.createServer((req, res) => {
  const filePath = req.url === "/" ? "/index.html" : req.url;
  const absPath = path.join(distDir, filePath);

  fs.readFile(absPath, (err, data) => {
    if (err) {
      // SPA fallback to main index.html
      fs.readFile(indexHtmlTarget, "utf8", (fbErr, fbData) => {
        if (fbErr) {
          logger.warn(`[WARN]: 404 Not Found — ${req.url}`);
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Not found");
        } else {
          let html = adjustSpaScript(fbData, filePath);
          html = adjustSpaLink(html, filePath);
          logger.debug(`[DEBUG]: Serving SPA fallback for ${req.url}`);
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(html);
        }
      });
    } else {
      const ext = path.extname(absPath).toLowerCase();
      const contentType = mimeTypes[ext] || "application/octet-stream";
      logger.debug(`[DEBUG]: Serving static file ${filePath}`);
      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    }
  });
});

// -----------------------------------------------------------------------------
// Start the server
// -----------------------------------------------------------------------------
await copyIndexHtmlOnce(); // Copy before starting

server.listen(PORT, () => {
  logger.info(`[SERVER]: Running at http://localhost:${PORT}`);
});
