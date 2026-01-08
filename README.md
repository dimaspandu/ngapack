# NGAPACK

## Overview

NGAPACK is a lightweight experimental JavaScript bundler focused on **semantic correctness**, **deterministic output**, and **runtime-oriented module loading** rather than aggressive build-time transformations.

The project is intentionally minimal and explicit, making it suitable for:

* studying how modern ESM bundlers work internally
* experimenting with dynamic imports, non-JS assets, and microfrontends
* validating browser runtime behavior rather than optimizing for size

---

## High-level Architecture

```
ngapack/
├─ bundler/
│  ├─ analyzer/
│  ├─ helper/
│  ├─ runtime/
│  ├─ analyzer.js
│  ├─ helper.js
│  └─ index.js
│
├─ test/
│  ├─ src/
│  │  ├─ assets/
│  │  ├─ dynamic/
│  │  ├─ internal/
│  │  ├─ entry.js
│  │  ├─ greetings.js
│  │  ├─ index.html
│  │  ├─ sheetToCanonicalObject.js
│  │  └─ tester.js
│  ├─ public/
│  ├─ index.js
│  └─ serve.js
│
├─ .gitignore
└─ README.md
```

---

## Core Components

### `analyzer.js`

Responsible for **static analysis only**.

* Parses ES modules
* Extracts dependency metadata
* Detects static vs dynamic imports
* Identifies non-JS assets (HTML, CSS, JSON, images)

Design constraints:

* No side effects
* No filesystem writes
* No runtime assumptions

---

### `bundler/index.js`

The orchestration layer of NGAPACK.

Responsibilities:

* Builds the dependency graph
* Resolves module IDs and namespaces
* Emits bundled JavaScript output
* Copies or processes non-JS assets

Notes:

* Graph construction is synchronous by design
* Output emission is the only phase allowed to touch the filesystem

---

### `runtime/`

Browser-only runtime utilities.

Contains:

* Module registry
* Dynamic loader helpers
* CSS and JSON module handling logic

Design rules:

* Must not depend on Node.js APIs
* Must work in plain browser environments
* Should degrade gracefully when features are unsupported

---

## Test System (`test/`)

The `test` folder serves as an **integration and specification suite**, not unit tests.

### Key ideas

* Tests describe **expected semantic behavior**, not implementation details
* All tests are executed through a real browser-like runtime
* Bundler output is validated via runtime execution

### `test/src/entry.js`

Acts as the canonical integration entry point.

It validates:

1. Static ES module imports
2. Dynamic JavaScript imports
3. Dynamic JSON modules
4. Dynamic CSS modules (with namespace support)
5. Multiple dynamic bundles sharing internal dependencies
6. Remote microfrontend modules loaded over HTTP

Non-JS imports such as `index.html` or images are intentionally imported **for side effects only**, to verify correct asset emission.

---

### Canonical CSS Normalization

`sheetToCanonicalObject.js` defines the **semantic CSS contract** used by tests.

Purpose:

* Remove CSSOM-expanded noise
* Normalize shorthand properties
* Enforce deterministic property ordering

This file is **not a general-purpose utility**.

Any change to canonical normalization rules is considered a **breaking semantic change** and requires test updates.

---

### `serve.js`

A minimal static HTTP server used for manual testing.

* Serves files from `test/public`
* Adds permissive CORS headers
* Avoids external dependencies

This server exists only for development and demonstration purposes.

---

## Design Principles

* Prefer semantic correctness over aggressive optimization
* Avoid hidden magic or implicit behavior
* Keep runtime behavior explicit and inspectable
* Separate *analysis*, *bundling*, and *runtime* responsibilities clearly

NGAPACK is intentionally small so contributors can understand the full system end-to-end.

---

## Contribution Notes

* Keep analyzer logic pure and side-effect free
* Do not introduce Node.js APIs into the runtime
* Treat canonical logic as a specification, not a helper
* Favor clarity over cleverness
