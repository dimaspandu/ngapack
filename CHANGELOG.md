# Changelog

All notable changes to this project will be documented in this file.

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
