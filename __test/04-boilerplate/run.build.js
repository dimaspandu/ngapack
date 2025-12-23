// -----------------------------------------------------------------------------
// Import Utility Modules and Core Dependencies
// -----------------------------------------------------------------------------

// Utility functions from the local utils module
// These handle code/style cleanup, minification, and logging.
import {
  cleanUpCode,       // Removes unnecessary whitespace and formatting from JS
  cleanUpStyle,      // Normalizes CSS formatting and removes redundant rules
  logger,            // Custom logger for debug, info, and error messages
  minifyHTML,        // Compresses HTML files
  minifyJS,          // Compresses JavaScript code
  stripComments,     // Removes JS/CSS comments
  stripHTMLComments  // Removes HTML comments
} from "../../utils/index.js";

// Node.js built-in modules for executing shell commands and managing async
import { exec } from "child_process";
import { promisify } from "util";

// Core filesystem modules
import fs from "fs";
import fsp from "fs/promises"; // Promise-based API for filesystem operations

// Core path utilities for building consistent cross-platform file paths
import path, { dirname } from "path";
import { fileURLToPath } from "url";


// -----------------------------------------------------------------------------
// Environment Setup
// -----------------------------------------------------------------------------

// Convert ESM `import.meta.url` into a regular filesystem path.
// These two lines recreate `__filename` and `__dirname` for ES module context.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Promisified shell command executor
// Allows us to use `await run("node run.bundle.js")` instead of callback style.
const run = promisify(exec);


// -----------------------------------------------------------------------------
// Main Build Orchestrator
// -----------------------------------------------------------------------------
/**
 * This function defines the full build pipeline, consisting of:
 * 1. Running the JavaScript bundler.
 * 2. Copying directories defined in `config.json`.
 * 3. Copying and optionally minifying individual files.
 * 4. (Optional) Generating article/static pages if implemented later.
 */
async function build() {
  // Read build configuration from config.json
  const configPath = path.join(__dirname, "config.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

  // Ensure the output directory (dist/) exists
  const distDir = path.join(__dirname, config.outputDirectory);
  await fsp.mkdir(distDir, { recursive: true });

  // ---------------------------------------------------------------------------
  // Step 1: Run the Bundling Process
  // ---------------------------------------------------------------------------
  logger.debug("Running bundle.js...");
  await run("node run.bundle.js", { cwd: __dirname });
  logger.debug("Bundle completed.");

  // ---------------------------------------------------------------------------
  // Step 2: Copy Directories (from config.copyDirs)
  // ---------------------------------------------------------------------------
  // `copyDirs` can be defined as:
  // - an array of strings (copied directly)
  // - an array of { "src": "dest" } mappings
  // - an object of key-value pairs { "src": "dest" }
  if (Array.isArray(config.copyDirs)) {
    // Handle array syntax
    for (const dirItem of config.copyDirs) {
      let srcDir, destDirName;

      if (typeof dirItem === "string") {
        // Example: "src/assets"
        srcDir = path.join(__dirname, dirItem);
        destDirName = dirItem; // keep same folder name
      } else if (typeof dirItem === "object") {
        // Example: { "src/html": "html" }
        const [key, value] = Object.entries(dirItem)[0];
        srcDir = path.join(__dirname, key);
        destDirName = value;
      } else {
        continue;
      }

      const destDir = path.join(distDir, destDirName);
      if (fs.existsSync(srcDir)) {
        logger.debug("Copying directory:", srcDir, "->", destDirName);
        await copyDir(srcDir, destDir);
      }
    }
  } else if (typeof config.copyDirs === "object") {
    // Handle object syntax directly
    for (const [key, value] of Object.entries(config.copyDirs)) {
      const srcDir = path.join(__dirname, key);
      const destDirName = value;
      const destDir = path.join(distDir, destDirName);
      if (fs.existsSync(srcDir)) {
        logger.debug("Copying directory:", srcDir, "->", destDirName);
        await copyDir(srcDir, destDir);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Step 3: Copy Files (from config.copyFiles)
  // ---------------------------------------------------------------------------
  // Works with array or object format similar to copyDirs
  if (Array.isArray(config.copyFiles)) {
    for (const fileItem of config.copyFiles) {
      let srcFile, destFileName;

      if (typeof fileItem === "string") {
        // Example: "src/index.html"
        srcFile = path.join(__dirname, fileItem);
        destFileName = path.basename(fileItem);
      } else if (typeof fileItem === "object") {
        // Example: { "src/index.html": "index.html" }
        const [key, value] = Object.entries(fileItem)[0];
        srcFile = path.join(__dirname, key);
        destFileName = value;
      } else {
        continue;
      }

      const destFile = path.join(distDir, destFileName);
      if (fs.existsSync(srcFile)) {
        logger.debug("Copying file:", srcFile, "->", destFileName);
        await processAndCopyFile(srcFile, destFile);
      }
    }
  } else if (typeof config.copyFiles === "object") {
    for (const [key, value] of Object.entries(config.copyFiles)) {
      const srcFile = path.join(__dirname, key);
      const destFileName = value;
      const destFile = path.join(distDir, destFileName);
      if (fs.existsSync(srcFile)) {
        logger.debug("Copying file:", srcFile, "->", destFileName);
        await processAndCopyFile(srcFile, destFile);
      }
    }
  }

  logger.debug("Build finished successfully.");
}


// -----------------------------------------------------------------------------
// File Preprocessing Before Copying
// -----------------------------------------------------------------------------
/**
 * Cleans, strips, and optionally minifies files before copying to dist/.
 * - JS: Removes comments, cleans formatting, and minifies unless already minified.
 * - HTML: Removes comments and minifies markup.
 * - CSS: Strips comments and normalizes formatting.
 */
async function processAndCopyFile(src, dest) {
  const ext = path.extname(src).toLowerCase();
  await fsp.mkdir(path.dirname(dest), { recursive: true });

  if (ext === ".js" || ext === ".html" || ext === ".css") {
    const alreadyMinified = src.includes(".min.js");
    let content = await fsp.readFile(src, "utf-8");

    if (ext === ".js" && !alreadyMinified) {
      content = stripComments(content);
      content = cleanUpCode(content);
      content = await minifyJS(content);
    } else if (ext === ".html") {
      content = minifyHTML(stripHTMLComments(content));
    } else if (ext === ".css") {
      content = stripComments(content);
      content = cleanUpStyle(content);
    }

    await fsp.writeFile(dest, content, "utf-8");
  } else {
    // For non-text files (e.g. images, fonts), copy directly
    await fsp.copyFile(src, dest);
  }
}


// -----------------------------------------------------------------------------
// Recursive Directory Copy Helper
// -----------------------------------------------------------------------------
/**
 * Recursively copies an entire directory tree (folders and files)
 * from `src` to `dest`, applying minification logic where appropriate.
 */
async function copyDir(src, dest) {
  await fsp.mkdir(dest, { recursive: true });
  const entries = await fsp.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath); // recurse
    } else {
      await processAndCopyFile(srcPath, destPath); // copy file with processing
    }
  }
}


// -----------------------------------------------------------------------------
// Execute Build Pipeline
// -----------------------------------------------------------------------------
build().catch((err) => {
  logger.error("Build failed:", err);
  process.exit(1);
});
