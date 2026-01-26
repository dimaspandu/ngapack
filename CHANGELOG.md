# Changelog

All notable changes to this project will be documented in this file.

---

## [1.1.0] - 2026-01-26

### Added
- Introduce explicit `.module.*` convention for asset modules (CSS, SVG, HTML, XML, JSON)
- Add helper utilities to clearly distinguish module assets from plain static assets
- Add integration specification covering:
  - Static and dynamic JS modules
  - Dynamic JSON and CSS modules
  - CSSStyleSheet runtime fallback behavior
  - Remote HTTP microfrontend modules

### Changed
- Non-module assets (`.css`, `.svg`, `.html`, `.xml`, `.json` without `.module.`)
  are no longer bundled as JavaScript modules and are emitted as static assets instead
- Asset handling logic is now centralized and consistent across:
  - dependency graph construction
  - runtime module mapping
  - output emission
- Non-module CSS assets are minified using SAFE CSS minification before emission

### Improved
- Make module graph construction deterministic by ensuring only bundled modules
  are registered in runtime mappings
- Clarify and document asset vs module behavior throughout the bundler pipeline
- Improve code readability with explicit decision points and defensive comments

### Internal
- Refactor asset handling paths to eliminate implicit behavior
- Add helper abstractions for asset detection and module qualification
- Improve maintainability and future-proofing of the bundler core

---

## [1.0.5] - 2026-01-25

### Improved
- Improve internal CSS minification behavior via analyzer updates:
  - Normalize excessive whitespace in SAFE CSS minification mode.
  - Ensure deterministic and clean CSS output without altering grammar.
- Improve CSS token re-stringification reliability in DEEP mode by enforcing
  required spacing between adjacent values (e.g. `1px #fff`).

### Internal
- Update analyzer CSS minifier to fix token adjacency edge cases.
- Add regression coverage for CSS whitespace normalization and value boundaries.
- Align analyzer output consistency with ngapack’s deterministic bundling goals.

---

## [1.0.4] - 2026-01-20

### Fixed
- Ensure output directories are created before writing or copying non-JS assets
- Prevent ENOENT errors when emitting HTML or static assets into nested output paths

### Improved
- Make asset emission behavior consistent with JS bundle output handling
- Improve robustness of bundler when `outputDir` does not yet exist

### Internal
- Add defensive directory creation (`recursive: true`) for asset write paths
- Align asset pipeline expectations with Node.js filesystem semantics

---

## [1.0.3] - 2026-01-13

### Fixed
- Prevent bundler crash when no dynamic imports are present
- Fix incorrect bundle attachment logic where static modules could reference non-existent parent bundles
- Safely handle missing parent modules (e.g. external HTTP imports or non-bundled assets) during bundle assignment

### Refactored
- Rewrite `createBundle()` to use explicit `bundleId` propagation instead of implicit parent lookup
- Decouple module dependency relationships from bundle ownership
- Make bundling logic robust against incomplete or non-topological dependency graphs

### Internal
- Improve defensive handling of edge cases in dependency graph to avoid runtime `undefined` access
- Clarify conceptual separation between module graph construction and bundle generation

---

## [1.0.2] - 2026-01-12

### Added
- Document upstream references for analyzer and runtime in README
- Explicit attribution to `js-analyzer` and `djs` as conceptual foundations

### Improved
- Clarify separation of concerns between analyzer, bundler, and runtime
- Improve contributor-facing documentation and project positioning

### Docs
- Enhance README with upstream reference notes for better transparency

---

## [1.0.1] - 2026-01-08

### Fixed
- Correct asset output paths to avoid leaking `src/` into `public`
- Ensure HTML assets are minified before being emitted

### Refactored
- Extract CSS canonicalization logic into `sheetToCanonicalObject`
- Improve code readability and contributor-oriented comments
- Minor internal cleanup without changing runtime behavior

### Docs
- Update README with clearer architecture and design rules
