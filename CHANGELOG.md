# Changelog

All notable changes to this project will be documented in this file.

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
