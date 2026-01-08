import fs from "fs";
import fsp from "fs/promises";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

import {
  convertESMToCJSWithMeta,
  minifyCSS,
  minifyHTML,
  minifyJS
} from "./analyzer.js";

import {
  ensureJsExtension,
  escapeForDoubleQuote,
  logger,
  mapToDistPath,
  uglifyJS
} from "./helper.js";

/**
 * Resolve __filename and __dirname in ESM environment.
 * Node.js ESM does not provide them by default.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * RUNTIME_CODE(host, modules, entry)
 * ----------------------------------
 * Generates the runtime bootstrap code as a string.
 * This code will be injected into the main (entry) bundle only.
 */
const RUNTIME_CODE = (host, modules, entry) => {
  const runtimeTemplatePath = path.join(__dirname, "runtime/template.js");

  logger.info("[RUNTIME] Loading runtime template:", runtimeTemplatePath);

  let template = fs.readFileSync(runtimeTemplatePath, "utf-8");

  // Determine runtime host resolution strategy
  // If host is undefined, fallback to runtime URL detection
  const injectedHost =
    host !== undefined
      ? JSON.stringify(host)
      : "getHostFromCurrentUrl()";

  // Inject runtime placeholders
  template = template
    .replace(/__INJECT_MODULES__/g, modules)
    .replace(/__INJECT_ENTRY__/g, entry)
    .replace(/__INJECT_HOST__/g, injectedHost);

  return minifyJS(template);
};

/**
 * normalizeId(p)
 * ----------------
 * Normalizes file paths into absolute, forward-slash-based identifiers.
 * This ensures consistent module IDs across platforms.
 */
function normalizeId(p) {
  return path.resolve(p).replace(/\\/g, "/");
}

/**
 * processAndCopyFile(src, dest)
 * ------------------------------
 * Copies non-JS assets (images, fonts, etc.) into the output directory.
 */
async function processAndCopyFile(src, dest) {
  logger.info(`[COPY] Copying asset from ${src} to ${dest}`);

  await fsp.mkdir(path.dirname(dest), { recursive: true });
  await fsp.copyFile(src, dest);

  logger.success(`[COPY] Asset successfully copied to ${dest}`);
}

/**
 * createNode(filename, separated)
 * --------------------------------
 * Reads and transforms a source file into a dependency graph node.
 * Each node represents a single module.
 */
function createNode(filename, separated = false) {
  logger.info(`[NODE] Processing file: ${filename}`);

  const rawCode = fs.readFileSync(filename, "utf-8");
  const ext = path.extname(filename);

  let extraction;

  /**
   * Step 1: Transform source code depending on file type.
   */
  const transformedCode = (() => {
    if (ext === ".css") {
      return minifyCSS(rawCode);
    }

    if (ext === ".svg" || ext === ".xml" || ext === ".html") {
      return minifyHTML(rawCode);
    }

    // JavaScript files:
    // Convert ESM to CJS and extract dependency metadata
    extraction = convertESMToCJSWithMeta(rawCode);
    return extraction.code;
  })();

  /**
   * Step 2: Wrap transformed code into CommonJS-compatible output.
   */
  let productionCode = transformedCode;

  if (ext === ".json") {
    productionCode = `exports.default=${transformedCode};`;
  } else if (ext === ".css") {
    productionCode =
      `var raw="${escapeForDoubleQuote(transformedCode)}";` +
      `exports.raw=raw;` +
      `if(typeof CSSStyleSheet==="undefined"){exports.default=raw;}` +
      `else{var sheet=new CSSStyleSheet();sheet.replaceSync(raw);exports.default=sheet;}`;
  } else if (ext === ".svg" || ext === ".xml" || ext === ".html") {
    productionCode = `exports.default="${escapeForDoubleQuote(transformedCode)}";`;
  }

  /**
   * Step 3: Deduplicate dependency metadata.
   */
  const dependencies = {
    keys: {},
    values: []
  };

  if (extraction) {
    for (const meta of extraction.meta) {
      if (!dependencies.keys[meta.module]) {
        dependencies.keys[meta.module] = 1;
        dependencies.values.push(meta);
      }
    }
  }

  const id = normalizeId(filename);

  logger.success(`[NODE] Successfully created node for: ${filename}`);

  return {
    id,
    key: null,
    filename: id,
    dependent: [],
    dependencies: dependencies.values,
    code: productionCode,
    separated
  };
}

/**
 * createGraph(entry, outputFilePath, defaultNamespace)
 * ----------------------------------------------------
 * Builds the full dependency graph starting from the entry file.
 */
function createGraph(entry, outputFilePath, defaultNamespace) {
  logger.info("[GRAPH] Creating dependency graph from entry:", entry);

  const entryNode = createNode(entry);
  const queue = [entryNode];

  const baseDir = path.dirname(path.resolve(entry)).replaceAll("\\", "/");
  const outputDir = normalizeId(path.dirname(outputFilePath));

  // Assign entry module key
  entryNode.key = entryNode.id.replace(
    `${baseDir}/`,
    `${defaultNamespace}::`
  );

  for (const node of queue) {
    node.mapping = {};
    const currentDir = path.dirname(node.filename);

    for (const dependency of node.dependencies) {
      const relativePath = dependency.module;

      /**
       * Case 1: HTTP / HTTPS imports
       */
      if (/^https?:\/\//.test(relativePath)) {
        const url = new URL(relativePath);
        const namespace =
          dependency.assertions.namespace || defaultNamespace;

        const moduleId = `${namespace}::${url.pathname.slice(1)}`;
        node.mapping[relativePath] = moduleId;

        logger.warn(`[GRAPH] External URL skipped: ${relativePath}`);
        continue;
      }

      /**
       * Case 2: Local file imports
       */
      const absolutePath = normalizeId(
        path.join(currentDir, relativePath)
      );

      const ext = path.extname(absolutePath);

      if (
        [".js", ".mjs", ".json", ".css", ".svg", ".xml", ".html"].includes(ext)
      ) {
        logger.info(`[GRAPH] Adding dependency module: ${absolutePath}`);

        const childNode = createNode(
          absolutePath,
          dependency.type === "dynamic"
        );

        childNode.dependent = node.id;
        childNode.key = absolutePath.replace(
          `${baseDir}/`,
          `${defaultNamespace}::`
        );

        queue.push(childNode);
      } else {
        /**
         * Non-JS assets are copied directly to output directory.
         */
        logger.info(`[GRAPH] Copying asset dependency: ${absolutePath}`);

        const relativeToEntry = path.relative(
          path.dirname(entry),
          absolutePath
        );

        const outPath = normalizeId(
          path.join(outputDir, relativeToEntry)
        );

        processAndCopyFile(absolutePath, outPath).catch(logger.error);
      }

      node.mapping[relativePath] = absolutePath.replace(
        `${baseDir}/`,
        `${defaultNamespace}::`
      );
    }
  }

  logger.success("[GRAPH] Dependency graph built successfully.");
  return queue;
}

/**
 * Bundle container indexed by entry module ID.
 */
const bundleFiles = {};

/**
 * createBundle(graph, host)
 * --------------------------
 * Groups graph nodes into bundles (entry bundle + dynamic bundles).
 */
function createBundle(graph, host) {
  /**
   * Step 1: Initialize entry bundle.
   */
  bundleFiles[graph[0].id] = {
    entry: true,
    path: graph[0].id,
    files: [graph[0]],
    modules: "",
    codes: ""
  };

  /**
   * Step 2: Create bundles for dynamically imported modules.
   */
  for (let i = 1; i < graph.length; i++) {
    const node = graph[i];

    if (!bundleFiles[node.id] && node.separated) {
      bundleFiles[node.id] = {
        entry: false,
        path: node.id,
        files: [node],
        modules: "",
        codes: ""
      };
    }
  }

  /**
   * Step 3: Attach non-dynamic modules to their parent bundles.
   */
  for (let i = 1; i < graph.length; i++) {
    const node = graph[i];

    if (!bundleFiles[node.id]) {
      bundleFiles[node.dependent].files.push(node);
    }
  }

  /**
   * Step 4: Generate bundle code.
   */
  for (const id in bundleFiles) {
    const bundle = bundleFiles[id];

    for (const mod of bundle.files) {
      bundle.modules += `"${mod.key}":[
        function(require, exports, module, requireByHttp){
          ${mod.code}
        },
        ${JSON.stringify(mod.mapping)}
      ],`;
    }

    const entryId = bundle.files[0].key;

    if (bundle.entry) {
      logger.info("[BUNDLE] Including runtime in bundle.");

      bundle.codes = minifyJS(
        RUNTIME_CODE(
          host,
          `{${bundle.modules.slice(0, -1)}}`,
          `"${entryId}"`
        )
      );
    } else {
      logger.info("[BUNDLE] Generating lightweight bundle (no runtime).");

      bundle.codes = minifyJS(`
        (function(global, modules, entry){
          global["*pointers"]("&registry")(modules);
          global["*pointers"]("&require")(entry);
        })(
          typeof window !== "undefined" ? window : this,
          {${bundle.modules.slice(0, -1)}},
          "${entryId}"
        );
      `);
    }

    delete bundle.files;
    delete bundle.modules;
  }

  return bundleFiles;
}

/**
 * generateOutput(outputFilePath, code)
 * ------------------------------------
 * Writes bundled output to disk.
 */
function generateOutput(outputFilePath, code) {
  logger.info(`[OUTPUT] Writing bundle to ${outputFilePath}`);

  const dir = path.dirname(outputFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputFilePath, code, "utf8");
  logger.success(`[OUTPUT] Bundle successfully written to ${outputFilePath}`);
}

/**
 * main(options)
 * ---------------
 * Bundler entry point.
 * Orchestrates dependency analysis, bundling, minification, and output.
 */
export default async function main({
  entry,
  host,
  namespace = "&",
  outputDir,
  outputFilename = "index.js",
  uglified = false
}) {
  logger.info(`[MAIN] Starting bundler for entry: ${entry}`);

  const outputFilePath = ensureJsExtension(
    path.join(outputDir, outputFilename)
  );

  const graph = createGraph(entry, outputFilePath, namespace);
  const bundles = createBundle(graph, host);

  for (const id in bundles) {
    const bundle = bundles[id];
    const code = bundle.codes;

    logger.info("[MAIN] Minifying generated code...");
    const result = !uglified ? code : await uglifyJS(code);

    if (bundle.entry) {
      generateOutput(outputFilePath, result);
    } else {
      const mapped = mapToDistPath(bundle.path, outputDir)?.destination;
      generateOutput(ensureJsExtension(mapped), result);
    }
  }

  logger.success("[MAIN] Bundling process completed successfully.");
}
