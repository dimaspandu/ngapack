import cleanUpCodeTests from "./cleanUpCode.test.js";
import cleanUpStyleTests from "./cleanUpStyle.test.js";
import ensureJsExtensionTests from "./ensureJsExtension.test.js";
import escapeForDoubleQuoteTests from "./escapeForDoubleQuote.test.js";
import mergeRequireNetworkCallsTests from "./mergeRequireNetworkCalls.test.js";
import minifyHTMLTests from "./minifyHTML.test.js";
import oneLineJSTests from "./oneLineJS.test.js";
import splitByStringLiterals from "./splitByStringLiterals.test.js";
import stripCommentsTests from "./stripComments.test.js";
import stripHTMLCommentsTests from "./stripHTMLComments.test.js";
import transpileESMToCJSTests from "./transpileESMToCJS.test.js";

const allTestModules = [
  cleanUpCodeTests,
  cleanUpStyleTests,
  ensureJsExtensionTests,
  escapeForDoubleQuoteTests,
  mergeRequireNetworkCallsTests,
  minifyHTMLTests,
  oneLineJSTests,
  splitByStringLiterals,
  stripCommentsTests,
  stripHTMLCommentsTests,
  transpileESMToCJSTests,
];

console.log("\nAll tests loaded.\n");

const summary = allTestModules.map(({ name, results }) => {
  const total = results.length;
  const passed = results.filter(r => r.pass).length;
  const failed = total - passed;
  const percent = total === 0 ? 0 : ((passed / total) * 100).toFixed(2);
  return { name, total, passed, failed, "pass %": percent };
});

console.table(summary, ["name", "total", "passed", "failed", "pass %"]);
