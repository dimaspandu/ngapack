// import runTest from "./tester.js";
import greetings from "./greetings.js";
import Unnecessary from "./internal/unnecessary.js";

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
    var rpc = await import("./dynamic/rpc.js");
    runTest("RPC Module getMessage Output", rpc.getMessage(), "Hello, World!");

    // 3. Dynamic JSON module test
    var colors = await import("./dynamic/colors.json");
    runTest("Colors Module Dynamic JSON", colors.default, {
      "primary": "#2563eb",
      "secondary": "#6b7280",
      "accent": "#10b981"
    });

    // 4. Dynamic CSS module test with namespace
    var styles = await import("./dynamic/styles.css", {
      namespace: "DynamicCSS"
    });
    runTest("Styles Module Dynamic CSS", styles.default, `
        :root {
          --accent: #2563eb;
        }

        body {
          font-family: sans-serif;
          background: #f6f7fb;
          padding: 20px;
        }

        h1 {
          color: var(--accent);
        }

        p.styled {
          color: #10b981;
          font-weight: bold;
        }
    `);

    // // 5. Remote microfrontend test
    // var somewhere = await import("https://www.microfrontends.com/resources/somewhere.js", {
    //   namespace: "MicroFrontend"
    // });
    // runTest(
    //   "Somewhere Dynamic Module (Microfrontend)",
    //   somewhere.default,
    //   "Hello! I'm from somewhere!",
    //   true
    // );

  } catch (err) {
    // Capture any dynamic import failure
    console.error("Error loading dynamic module:", err);
  }
}

runAllTests();