# Test Directory

This folder contains a series of runtime validation tests for the JS Bundler Runtime Engine.  
Each test suite is self-contained and includes its own `run.test.js` file that can be executed independently.

## Test Structure

```
test/
├── 01-basic/
├── 02-advanced/
├── 03-hybrid/
└── 04-boilerplate/
```

Each folder represents a different scenario or level of complexity.  
To run a test, simply execute:

```bash
node run.test.js
```

inside the desired test directory.

## Test Descriptions

### 01-basic
**Goal:** Verify that the JS bundler runtime initializes correctly and executes a simple script.

**Expected Output:**
```
[SUCCESS] [MAIN] Bundling process completed successfully.
[GREETINGS]: Hello, World!
```

### 02-advanced
**Goal:** Validate bundling and execution with separated files and dynamic imports (ESM or CommonJS interop).

**Expected Output:**
```
[SUCCESS] [MAIN] Bundling process completed successfully.
[SUCCESS] [COPY] env.mock.js successfully copied to dist/
[PASS => side effects in message.js] HOW MANY TIMES CALLED?
[PASS => const greetings = require("./message.js").greetings;]: Hello World!
[SUCCESS] [RUN] Bundling and execution completed successfully.
[PASS => updateUser in rpc.js][Hurray!]: User data is successfully updated! { ... }
```

### 03-hybrid
**Goal:** Demonstrate hybrid capability — the same project can:
- Run natively in the browser using `<script type="module">`
- Or fallback to the bundled version if the browser does not support native ESM.

**Expected Output:**
```
[SUCCESS] [MAIN] Bundling process completed successfully.
[SUCCESS] [MAIN] All separated modules processed successfully.
[SUCCESS] [MAIN] Bundling process completed successfully.
[SUCCESS] [COPY]: index.html successfully copied to dist/
[INFO] [SERVER]: Running at http://localhost:7733
```

### 04-boilerplate
**Goal:** Provide a basic boilerplate structure using vanilla JavaScript,  
supporting both native ESM and bundled fallback execution environments.

**Expected Output:**
```
[DEBUG] [TEST]: Starting test build and server...
[DEBUG] [BUILD]: Running build process...
[DEBUG] [BUILD]: Build completed successfully.
[DEBUG] [START]: Launching server...
[DEBUG] Start server running at http://localhost:4511
```

## Notes

- All tests use their own `run.test.js` file, which some of them internally call:
  - `run.build.js` → handles bundling, copying, and preprocessing.
  - `run.start.js` → serves built assets on a local HTTP server.
- Logs follow a consistent pattern (`[DEBUG]`, `[SUCCESS]`, `[ERROR]`, `[INFO]`, `[PASS]`)  
  for easy debugging and structured automation.

## Quick Run Example

To execute the hybrid test (03):

```bash
cd test/03-hybrid
node run.test.js
```

Then open your browser at:

http://localhost:7733

© Runtime Engine Test Suite · maintained for internal development and QA verification.
