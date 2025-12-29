// import runTest from "./tester.js";
import Unnecessary from "./internal/unnecessary.js";
import greetings from "./greetings.js";

/**
 * Test runner for verifying correct operation of module loading features:
 * - Synchronous modules
 * - Dynamic remote modules
 * - Namespaced modules
 * - JSON and CSS remote imports
 */
async function runAllTests() {
  // 1. Static synchronous module test
  runTest("Greeting Module Default Export", greetings, "Hello, World!");

  try {
    // 2. Dynamic RPC module test
    const rpc = await import("./dynamic/rpc.js");
    runTest("RPC Module getMessage Output", rpc.getMessage(), "Hello, World! You alright, Mate?");

    // 3. Dynamic JSON module test
    const colors = await import("./dynamic/colors.json");
    runTest("Colors Module Dynamic JSON", colors.default, {
      "primary": "#2563eb",
      "secondary": "#6b7280",
      "accent": "#10b981"
    });

    // 4. Dynamic CSS module test with namespace
    const styles = await import("./dynamic/styles.css", {
      namespace: "DynamicCSS"
    });
    runTest("Styles Module Dynamic CSS", styles.default.rules.length, 4);

    // // 5. 
    // const { twina } = await import("./dynamic/twina.js");
    // runTest(
    //   "Twin A",
    //   twina,
    //   "I'm used by A!"
    // );

    // // 6. 
    // const { twinb } = await import("./dynamic/twinb.js");
    // runTest(
    //   "Twin B",
    //   twinb,
    //   "I'm used by B!"
    // );

    // 7. Remote microfrontend test
    const somewhere = await import("https://www.microfrontends.com/resources/somewhere.js", {
      namespace: "MicroFrontend"
    });
    runTest(
      "Somewhere Dynamic Module (Microfrontend)",
      somewhere.default,
      "Hello! I'm from somewhere!",
      true
    );

  } catch (err) {
    // Capture any dynamic import failure
    console.error("Error loading dynamic module:", err);
  }
}

runAllTests();