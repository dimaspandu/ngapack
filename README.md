# NGAPACK

## Overview

NGAPACK is a **lightweight experimental JavaScript bundler** that focuses on **semantic correctness**, **deterministic output**, and **runtime-oriented module loading**.

Instead of aggressive build-time transformations, NGAPACK is designed to:

* preserve native ESM semantics as much as possible
* validate how code actually behaves in the browser
* make bundler internals easy to inspect and reason about

This makes NGAPACK suitable for:

* learning how modern ESM bundlers work internally
* experimenting with dynamic imports and non-JS assets
* prototyping microfrontend and runtime-loading concepts

---

## Project Structure

Based on the current codebase, NGAPACK is organized as follows:

```
ngapack/
├─ bundler/                # Core bundler implementation
│  ├─ analyzer/            # Module analysis logic
│  ├─ helper/              # Shared bundler utilities
│  ├─ runtime/             # Browser runtime helpers
│  ├─ analyzer.js
│  ├─ helper.js
│  └─ index.js             # Bundler entry point
│
├─ test/                   # Integration & spec-style tests
│  ├─ public/              # Static assets served by dev server
│  ├─ src/                 # Test application source
│  │  ├─ assets/           # Images / non-JS assets
│  │  ├─ dynamic/          # Dynamic import experiments
│  │  │  ├─ colors.module.json
│  │  │  ├─ styles.module.css
│  │  │  ├─ twina.js
│  │  │  ├─ twinb.js
│  │  │  └─ twins.js
│  │  ├─ internal/         # Internal shared test modules
│  │  ├─ appendStyleSheet.js
│  │  ├─ entry.js          # Canonical test entry
│  │  ├─ entry.module.css
│  │  ├─ global.css
│  │  ├─ greetings.js
│  │  ├─ index.html
│  │  ├─ index.js
│  │  ├─ rpc.js
│  │  ├─ hail.js
│  │  ├─ sheetToCanonicalObject.js
│  │  └─ tester.js
│  ├─ index.js             # Test runner
│  └─ serve.js             # Minimal dev HTTP server
│
├─ .gitignore
├─ CHANGELOG.md
├─ LICENSE
└─ README.md
```

---

## Core Components

> **Upstream references**
>
> * Analyzer concepts are adapted from:
>   [https://github.com/dimaspandu/js-analyzer](https://github.com/dimaspandu/js-analyzer)
> * Runtime loader & registry ideas are adapted from:
>   [https://github.com/dimaspandu/djs](https://github.com/dimaspandu/djs)
>
> These repositories act as conceptual references. NGAPACK intentionally simplifies and refactors the ideas to fit its experimental goals.

---

### `bundler/analyzer.js`

Responsible for **static analysis only**.

Capabilities:

* Parses ES modules
* Extracts dependency metadata
* Distinguishes static vs dynamic imports
* Detects non-JS assets (CSS, JSON, HTML, images)

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
* Coordinates output generation
* Delegates runtime helpers and asset handling

Design notes:

* Dependency graph construction is synchronous by design
* Filesystem access is restricted to the emission phase

---

### `bundler/runtime/`

Browser-only runtime utilities injected into bundle output.

Includes:

* Module registry
* Dynamic loader helpers
* CSS module application logic
* JSON module handling

Rules:

* Must not rely on Node.js APIs
* Must work in plain browser environments
* Should degrade gracefully when features are unavailable

---

## Test System (`test/`)

The `test` directory functions as an **integration and behavioral specification suite**, not unit tests.

### Key ideas

* Tests describe **expected semantics**, not implementation details
* Bundled output is executed in a real browser-like environment
* Success is determined by runtime behavior, not snapshots

---

### `test/src/entry.js`

Acts as the canonical integration entry point.

Validates:

1. Static ES module imports
2. Dynamic JavaScript imports
3. Dynamic JSON modules
4. Dynamic CSS modules (including namespace isolation)
5. Multiple dynamic chunks sharing internal dependencies
6. Runtime-loaded modules over HTTP (microfrontend-style)

Non-JS imports (HTML, CSS, images) are intentionally imported **for side effects**, to validate correct asset emission and runtime behavior.

---

### Canonical CSS Normalization

`sheetToCanonicalObject.js` defines the **semantic CSS contract** used by the test suite.

Purpose:

* Remove CSSOM expansion noise
* Normalize shorthand properties
* Enforce deterministic property ordering

This file is **not a general-purpose CSS utility**.

Any modification to its normalization rules is considered a **breaking semantic change** and requires corresponding test updates.

---

### `serve.js`

A minimal static HTTP server used for development and manual testing.

Features:

* Serves files from `test/public`
* Adds permissive CORS headers
* Avoids external dependencies

This server exists purely for demonstration and debugging purposes.

---

## Design Principles

* Prefer semantic correctness over aggressive optimization
* Avoid hidden magic or implicit behavior
* Keep runtime behavior explicit and inspectable
* Clearly separate analysis, bundling, and runtime concerns

NGAPACK is intentionally small so contributors can understand the entire system end-to-end.

---

## Contribution Notes

* Keep analyzer logic pure and side-effect free
* Do not introduce Node.js APIs into runtime code
* Treat canonical logic as a specification, not a helper
* Favor clarity over cleverness
