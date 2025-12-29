import fs from "fs";
import fsp from "fs/promises";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import convertESMToCJSWithMeta from "./analyzer/lib/convertESMToCJSWithMeta/main.js";
import ensureJsExtension from "./helper/ensureJsExtension.js";
import escapeForDoubleQuote from "./helper/escapeForDoubleQuote.js";
import logger from "./helper/logger.js";
import mapToDistPath from "./helper/mapToDistPath.js";
import minifyCSS from "./analyzer/lib/minifier/css/main.js";
import minifyHTML from "./analyzer/lib/minifier/html/main.js";
import minifyJS from "./analyzer/lib/minifier/main.js";
import uglifyJS from "./helper/uglifyJS.js";

// Resolve __filename and __dirname in ESM scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * RUNTIME_CODE(host)
 * -------------------
 * Returns the runtime code as a string literal.
 */
const RUNTIME_CODE = (host, modules, entry) => {
  const runtimeTemplatePath = path.join(__dirname, "runtime/template.js");

  logger.info("[RUNTIME] Loading runtime template:", runtimeTemplatePath);

  let template = fs.readFileSync(runtimeTemplatePath, "utf-8");

  // Determine host string
  const injectedHost = host !== undefined
    ? JSON.stringify(host)
    : "getHostFromCurrentUrl()"; // use runtime function fallback

  // Inject values into template
  template = template
    .replace(/__INJECT_MODULES__/g, modules)
    .replace(/__INJECT_ENTRY__/g, entry)
    .replace(/__INJECT_HOST__/g, injectedHost);

  return minifyJS(template);
};

/**
 * normalizeId(p)
 * ----------------
 * Converts a file path into an absolute normalized path using forward slashes.
 */
function normalizeId(p) {
  return path.resolve(p).replace(/\\/g, "/");
}

/**
 * processAndCopyFile(src, dest)
 * ------------------------------
 * Copies non-JS files (images, fonts, etc.) to destination.
 */
async function processAndCopyFile(src, dest) {
  logger.info(`[COPY] Copying asset from ${src} to ${dest}`);
  await fsp.mkdir(path.dirname(dest), { recursive: true });
  await fsp.copyFile(src, dest);
  logger.success(`[COPY] Asset successfully copied to ${dest}`);
}

/**
 * createNode(filename)
 * ---------------------
 * Reads a file and transforms it into a node object for the dependency graph.
 */
function createNode(filename, separated = false) {
  logger.info(`[NODE] Processing file: ${filename}`);

  const rawCode = fs.readFileSync(filename, "utf-8");
  const parts = filename.split(".");
  const extension = parts.length > 1 ? "." + parts.pop() : "";

  let extraction;

  // Prepare transformed code depending on file type
  const originalCode = (function() {
    if (extension === ".css") {
      return minifyCSS(rawCode);
    }
    if (extension === ".svg" || extension === ".xml" || extension === ".html") {
      return minifyHTML(rawCode);
    }
    // For JS: transpile ESM -> CJS, strip comments, inline into single line
    extraction = convertESMToCJSWithMeta(rawCode);
    return extraction.code;
  }());

  // Convert to production-ready code
  let productionCode = originalCode;
  if (extension === ".json") {
    productionCode = `exports.default=${originalCode};`;
  } else if (extension === ".css") {
    productionCode = `var sheet=new CSSStyleSheet();sheet.replaceSync("${escapeForDoubleQuote(originalCode)}");exports.default=sheet;`;
  } else if (extension === ".svg" || extension === ".xml" || extension === ".html") {
    productionCode = `exports.default="${escapeForDoubleQuote(originalCode)}";`;
  }

  const dependencies = {
    keys: {},
    values: []
  };

  if (extraction) {
    for (let i = 0; i < extraction.meta.length; i++) {
      let moduleKey = extraction.meta[i].module;
      if (!dependencies.keys[moduleKey]) {
        dependencies.values.push(extraction.meta[i]);
        dependencies.keys[moduleKey] = 1;
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
 * createGraph(entry, outputFilePath)
 * -----------------------------------
 * Builds a dependency graph starting from entry file.
 */
function createGraph(entry, outputFilePath, defaultNamespace) {
  logger.info("[GRAPH] Creating dependency graph from entry:", entry);

  const entryNode = createNode(entry);
  const queue = [entryNode];
  const outputDir = normalizeId(path.dirname(outputFilePath));

  const selfDir = path.dirname(entryNode.id);
  entryNode.key = entryNode.id.replace(`${selfDir}/`, `${defaultNamespace}::`);

  for (const node of queue) {
    node.mapping = {};
    const dirname = path.dirname(node.filename);

    for (const dependency of node.dependencies) {
      const relativePath = dependency.module;
      const absolutePath = normalizeId(path.join(dirname, relativePath));

      if (/^https?:\/\//.test(relativePath)) {
        const actualUrl = new URL(relativePath);

        // Clean and normalize namespace; use "&" as default if empty or missing
        const actualNamespace = dependency.assertions.namespace || defaultNamespace;

        // Compose module ID like "Namespace::path/to/file.js"
        const moduleId = `${actualNamespace}::${actualUrl.pathname.slice(1)}`;

        // Map the result to the dependency graph
        node.mapping[relativePath] = moduleId;
        
        logger.warn(`[GRAPH] External URL skipped: ${relativePath}`);
      } else {
        if (
          [".js", ".mjs", ".json", ".css", ".svg", ".xml", ".html"].includes(path.extname(absolutePath))
        ) {
          logger.info(`[GRAPH] Adding dependency module: ${absolutePath}`);
          const nextNode = createNode(absolutePath, dependency.type === "dynamic");
          nextNode.dependent = node.id;
          const dependencyDir = path.dirname(absolutePath);
          nextNode.key = absolutePath.replace(`${dependencyDir}/`, `${defaultNamespace}::`);
          queue.push(nextNode);
        } else {
          logger.info(`[GRAPH] Copying asset dependency: ${absolutePath}`);
          const relativeToEntry = path.relative(path.dirname(entry), absolutePath);
          const outPath = normalizeId(path.join(outputDir, relativeToEntry));

          processAndCopyFile(absolutePath, outPath).catch(logger.error);
        }

        const dependencyDir = path.dirname(absolutePath);
        node.mapping[relativePath] = absolutePath.replace(`${dependencyDir}/`, `${defaultNamespace}::`);
      }
    }
  }

  logger.success("[GRAPH] Dependency graph built successfully.");
  return queue;
}

const bundleFiles = {};

function createBundle(graph, host) {
  bundleFiles[graph[0].id] = {
    entry: true,
    path: graph[0].id,
    files: [graph[0]],
    modules: ``,
    codes: ``
  };

  for (let i = 1; i < graph.length; i++) {
    const id = graph[i].id;
    const dynamic = graph[i].separated;

    if (!bundleFiles[id] && dynamic) {
      bundleFiles[id] = {
        entry: false,
        path: id,
        files: [graph[i]],
        modules: ``,
        codes: ``
      };
    }
  }

  for (let i = 1; i < graph.length; i++) {
    const id = graph[i].id;

    if (!bundleFiles[id]) {
      const dependentId = graph[i].dependent;
      bundleFiles[dependentId].files.push(graph[i]);
    }
  }

  for (const id in bundleFiles) {
    const theBundle = bundleFiles[id];
    // console.log("theBundle", theBundle);

    for (let i in theBundle.files) {
      const mod = theBundle.files[i];

      theBundle.modules += `"${mod.key}": [
        function(require, exports, module, requireByHttp) {
          ${mod.code}
        },
        ${JSON.stringify(mod.mapping)}
      ],`;
    }

    const includeRuntime = theBundle.entry;
    const entryId = theBundle.files[0].key;

    if (includeRuntime) {
      logger.info("[BUNDLE] Including runtime in bundle.");
      theBundle.codes = minifyJS(`
        ${RUNTIME_CODE(host, `{${theBundle.modules.slice(0, -1)}}`, `"${entryId}"`)}
      `);
    } else {
      logger.info("[BUNDLE] Generating lightweight bundle (no runtime).");
      theBundle.codes = minifyJS(`
        (function(global, modules, entry) {
          global["*pointers"]("&registry")(modules);
          global["*pointers"]("&require")(entry);
        })(
          typeof window !== "undefined" ? window : this,
          {${theBundle.modules.slice(0, -1)}},
          "${entryId}"
        );
      `);
    }

    delete theBundle.files;
    delete theBundle.modules;
  }

  return bundleFiles;
}

/**
 * generateOutput(outputFilePath, bundleResult)
 * ---------------------------------------------
 * Writes the final bundled code into the output file.
 */
function generateOutput(outputFilePath, bundleResult) {
  logger.info(`[OUTPUT] Writing bundle to ${outputFilePath}`);
  const outputDir = path.dirname(outputFilePath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(outputFilePath, bundleResult, "utf8");
  logger.success(`[OUTPUT] Bundle successfully written to ${outputFilePath}`);
}

/**
 * main(options)
 * ---------------
 * Entry point of the bundler.
 * Coordinates the bundling process: building the dependency graph, minifying output,
 * handling separated modules, and writing the final bundle to disk.
 * 
 * This function can be called recursively (for separated modules),
 * where it will inherit the parent bundler state to ensure consistency.
 */
export default async function main({
  entryFile,
  host,
  namespace = "&",
  outputDirectory,
  outputFilename = "index.js"
}) {
  // Step 1: Log the start of the bundling process for the given entry file
  logger.info(`[MAIN] Starting bundler for entry: ${entryFile}`);

  // Step 3: Determine the full path of the output file
  // If no specific output file is provided, default to 'index.js' inside the output directory
  const outputFilePath = ensureJsExtension(path.join(outputDirectory, outputFilename));

  // Step 4: Build the dependency graph from the entry file
  // This includes analyzing modules, their dependencies, and preparing transformed code
  const graph = createGraph(entryFile, outputFilePath, namespace);

  // const bundle = createBundle(graph, host);

  // for (const i in bundle) {
  //   const mod = bundle[i];
  //   const code = mod.codes;

  //   logger.info("[MAIN] Minifying generated code...");
  //   const result = true ? code : await uglifyJS(code);

  //   // Step 10: Write the final bundled output to the specified output file
  //   if (mod.entry) {
  //     generateOutput(outputFilePath, result);
  //   } else {
  //     const _outputFilePath = ensureJsExtension(mapToDistPath(mod.path, outputDirectory)?.destination);
  //     generateOutput(_outputFilePath, result);
  //   }
  // }

  // // Final step: Log successful bundling completion
  // logger.success("[MAIN] Bundling process completed successfully.");
}
