import fs from "fs";
import fsp from "fs/promises";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import convertESMToCJSWithMeta from "./analyzer/lib/convertESMToCJSWithMeta/main.js";
import ensureJsExtension from "./helper/ensureJsExtension.js";
import escapeForDoubleQuote from "./helper/escapeForDoubleQuote.js";
import logger from "./helper/logger.js";
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
    filename: id,
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
  const seen = { [entryNode.id]: entryNode };
  const outputDir = normalizeId(path.dirname(outputFilePath));

  for (const node of queue) {
    node.mapping = {};
    const dirname = path.dirname(node.filename);

    for (const dependency of node.dependencies) {
      const relativePath = dependency.module;
      const absolutePath = normalizeId(path.join(dirname, relativePath));

      if (dependency.type === "dynamic") {
        if (/^https?:\/\//.test(relativePath)) {
          //
        } else {
          if (!seen[absolutePath]) {
            if (
              [".js", ".mjs", ".json", ".css", ".svg", ".xml", ".html"].includes(path.extname(absolutePath))
            ) {
              logger.info(`[GRAPH] Adding dependency module: ${absolutePath}`);
              const nextNode = createNode(absolutePath, true);
              seen[absolutePath] = nextNode;
              queue.push(nextNode);
            } else {
              logger.info(`[GRAPH] Copying asset dependency: ${absolutePath}`);
              const relativeToEntry = path.relative(path.dirname(entry), absolutePath);
              const outPath = normalizeId(path.join(outputDir, relativeToEntry));

              processAndCopyFile(absolutePath, outPath).catch(logger.error);
            }
          }
        }
      } else {
        if (!seen[absolutePath]) {
          if (
            [".js", ".mjs", ".json", ".css", ".svg", ".xml", ".html"].includes(path.extname(absolutePath))
          ) {
            logger.info(`[GRAPH] Adding dependency module: ${absolutePath}`);
            const nextNode = createNode(absolutePath);
            seen[absolutePath] = nextNode;
            queue.push(nextNode);
          } else {
            logger.info(`[GRAPH] Copying asset dependency: ${absolutePath}`);
            const relativeToEntry = path.relative(path.dirname(entry), absolutePath);
            const outPath = normalizeId(path.join(outputDir, relativeToEntry));

            processAndCopyFile(absolutePath, outPath).catch(logger.error);
          }
        }
      }

      if (seen[absolutePath]) {
        node.mapping[relativePath] = absolutePath.replace(`${dirname}/`, `${defaultNamespace}::`);
      }
    }
      // if (/^https?:\/\//.test(relativePath)) {
      //   // Determine separator based on marker (<HTTP> or <HTTPS>)
      //   const separator = relativePath.includes("<HTTPS>")
      //     ? "/<HTTPS>"
      //     : relativePath.includes("<HTTP>")
      //     ? "/<HTTP>"
      //     : null;

      //   if (separator) {
      //     // Split into actual path and namespace section
      //     const [actualPath, namespacePart] = relativePath.split(separator);

      //     const actualUrl = new URL(actualPath);

      //     // Clean and normalize namespace; use "&" as default if empty or missing
      //     const actualNamespace =
      //       namespacePart?.replace(/^\/+/, "").trim() || defaultNamespace;

      //     // Compose module ID like "Namespace::path/to/file.js"
      //     const moduleId = `${actualNamespace}::${actualUrl.pathname.slice(1)}`;

      //     // Map the result to the dependency graph
      //     node.mapping[relativePath] = moduleId + separator;

      //     logger.warn(`[GRAPH] External URL skipped: ${relativePath}`);
      //   }
      // } else {
      //   const absolutePath = normalizeId(path.join(dirname, relativePath));
      //   const separated = absolutePath.includes("<HTTP>") || absolutePath.includes("<HTTPS>");

      //   let separator = null;
      //   if (absolutePath.includes("<HTTP>")) {
      //     separator = "/<HTTP>";
      //   } else if (absolutePath.includes("<HTTPS>")) {
      //     separator = "/<HTTPS>";
      //   }

      //   const actualPath = separated ? absolutePath.split(separator)[0] : absolutePath;

      //   if (!seen[actualPath]) {
      //     if (
      //       [".js", ".mjs", ".json", ".css", ".svg", ".xml", ".html"].includes(path.extname(actualPath))
      //     ) {
      //       logger.info(`[GRAPH] Adding dependency module: ${actualPath}`);
      //       const nextNode = createNode(actualPath);
      //       seen[actualPath] = nextNode;
      //       queue.push(nextNode);
      //     } else {
      //       logger.info(`[GRAPH] Copying asset dependency: ${actualPath}`);
      //       const relativeToEntry = path.relative(path.dirname(entry), actualPath);
      //       const outPath = normalizeId(path.join(outputDir, relativeToEntry));

      //       processAndCopyFile(actualPath, outPath).catch(logger.error);
      //     }
      //   }

      //   if (seen[actualPath]) {
      //     node.mapping[relativePath] = separated ? absolutePath : seen[actualPath].id;
      //   }

      //   if (separated) {
      //     logger.warn(`[GRAPH] Marked separated module: ${actualPath}`);
      //     seen[actualPath].separated = true;
      //   }
      // }
  }

  logger.success("[GRAPH] Dependency graph built successfully.");
  return queue;
}

/**
 * bundle(graph, entryFilePath, host, includeRuntime)
 * ---------------------------------------------------
 * Generates the final bundle string.
 */
function bundle(graph, entryFilePath, host, includeRuntime) {
  logger.info(`[BUNDLE] Building bundle for entry: ${entryFilePath}`);
  let modules = ``;

  graph.forEach((mod) => {
    modules += `"${mod.id}": [
      function(require, exports, module, requireByHttp) {
        ${mod.code}
      },
      ${JSON.stringify(mod.mapping)}
    ],`;
  });

  const entryId = entryFilePath ? normalizeId(entryFilePath) : null;

  if (includeRuntime) {
    logger.info("[BUNDLE] Including runtime in bundle.");
    return minifyJS(`
      ${RUNTIME_CODE(host, `{${modules.slice(0, -1)}}`, `"${entryId}"`)}
    `);
  } else {
    logger.info("[BUNDLE] Generating lightweight bundle (no runtime).");
    return minifyJS(`
      (function(global, modules, entry) {
        global["*pointers"]("&registry")(modules);
        global["*pointers"]("&require")(entry);
      })(
        typeof window !== "undefined" ? window : this,
        {${modules.slice(0, -1)}},
        "${entryId}"
      );
    `);
  }
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
 * Shared bundler state map.
 * Each top-level bundler invocation will maintain its own internal state
 * (e.g., fixedBaseDir and fixedNamespace), which can be inherited by
 * recursive calls for separated modules.
 */
const bundlerState = new WeakMap();

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
  host,
  entryFile,
  outputFile,
  outputDirectory,
  namespace = "&",
  includeRuntime = true,
  parentState = null
}) {
  // Step 1: Log the start of the bundling process for the given entry file
  logger.info(`[MAIN] Starting bundler for entry: ${entryFile}`);

  // Step 2: Initialize or reuse bundler state
  // Each top-level call to main() creates a new isolated state.
  // Recursive calls (for separated modules) inherit the existing state.
  let state = parentState;
  if (!state) {
    state = {
      fixedBaseDir: "",
      fixedNamespace: ""
    };
    bundlerState.set(main, state);
  }

  const resolvedOutputDirectory = outputDirectory ?? (outputFile ? path.dirname(outputFile) : process.cwd());

  // Step 3: Determine the full path of the output file
  // If no specific output file is provided, default to 'index.js' inside the output directory
  const outputFilePath = ensureJsExtension(outputFile ? outputFile : path.join(resolvedOutputDirectory, "index.js"));

  // Step 4: Build the dependency graph from the entry file
  // This includes analyzing modules, their dependencies, and preparing transformed code
  const graph = createGraph(entryFile, outputFilePath, namespace);
  console.log("graph", graph);

  // // Step 5: Set the base directory only once if not already set
  // // This path will later be used for namespace replacement in the bundled output
  // if (!state.fixedBaseDir) {
  //   state.fixedBaseDir = normalizeId(path.dirname(entryFile)) + "/";
  //   logger.success(`[MAIN] Base directory locked: ${state.fixedBaseDir}`);
  // }
  // const baseDir = state.fixedBaseDir;

  // // Step 6: Split the graph into two groups: separated modules and the main application graph
  // // Separated modules are those marked as needing isolated bundling (e.g., external sources)
  // const separatedGraphs = graph.filter(module => module.separated);
  // const mainGraph = separatedGraphs.length > 0 ? graph.filter(module => !module.separated) : graph;

  // // Step 7: Generate the code bundle from the main graph
  // // This will produce either a full bundle with runtime or a lightweight one based on config
  // let code = minifyJS(bundle(mainGraph, entryFile, host, includeRuntime));

  // // Step 8: Minify the generated bundle using a JS minifier for production optimization
  // logger.info("[MAIN] Minifying generated code...");
  // let result = await uglifyJS(code);

  // // Step 9: Replace base directory paths in the code with the provided namespace
  // // This helps make the output environment-agnostic and maintain unique module references
  // if (!state.fixedNamespace) {
  //   state.fixedNamespace = namespace === "&" ? "&::" : `${namespace}::`;
  //   logger.success(`[MAIN] Namespace locked: ${state.fixedNamespace}`);
  // }
  // const fixedNamespace = state.fixedNamespace;

  // result = result.replace(new RegExp(baseDir, "g"), fixedNamespace);

  // // Step 10: Write the final bundled output to the specified output file
  // generateOutput(outputFilePath, result);

  // // Step 11: If there are separated modules, process each of them independently
  // if (separatedGraphs.length > 0) {
  //   logger.warn(`[MAIN] Detected ${separatedGraphs.length} separated module(s). Processing individually...`);

  //   // Each separated module is bundled separately without the runtime
  //   const subBundles = separatedGraphs.map(async (mod) => {
  //     // Prepare paths for each separated module
  //     const separatedEntryFile = mod.filename.replaceAll("/", "\\");
  //     const separatedInputFilePath = mod.filename.split(state.fixedBaseDir).join("").replaceAll("/", "\\");
  //     const separatedOutputFilePath = path.join(resolvedOutputDirectory, separatedInputFilePath);

  //     logger.info(`[MAIN] Bundling separated module: ${separatedEntryFile}`);

  //     // Recursively invoke main() to bundle this module in isolation
  //     // Pass the current state so that baseDir and namespace remain consistent
  //     await main({
  //       host,
  //       entryFile: separatedEntryFile,
  //       outputFile: separatedOutputFilePath,
  //       outputDirectory: resolvedOutputDirectory,
  //       includeRuntime: false, // exclude runtime for submodules
  //       parentState: state
  //     });
  //   });

  //   // Step 12: Wait for all separated module bundles to complete before finishing
  //   await Promise.all(subBundles);
  //   logger.success("[MAIN] All separated modules processed successfully.");
  // }

  // // Final step: Log successful bundling completion
  // logger.success("[MAIN] Bundling process completed successfully.");
}
