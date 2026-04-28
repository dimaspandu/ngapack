import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bundler from "../bundler/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const resolveFromBoilerplateRoot = (relativePath) =>
  path.resolve(__dirname, relativePath);

const configPath = path.join(__dirname, "config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

// Build the configured application entry into the configured output directory.
await bundler({
  entry: resolveFromBoilerplateRoot(config.entry),
  outputDir: resolveFromBoilerplateRoot(config.outputDir),
  uglified: config.uglified
});
