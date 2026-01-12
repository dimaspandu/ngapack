# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

# [1.0.0] - 2026-01-12

## Added

- Initial release of **JS Analyzer**.
- Core modules:
  - `lib/tokenizer` for JS, CSS, HTML, JSON.
  - `lib/stringifyTokens` for JS, CSS, HTML, JSON.
  - `lib/minifier` for JS, CSS, HTML, JSON.
  - `lib/extractModules` for module detection.
  - `transpileImportTokensToCJS` and `transpileExportTokensToCJS`.
  - `convertESMToCJSWithMeta` for full JS pipeline orchestration.
- Deterministic, token-based processing model.
- Test harness with aggregated test runner.
- Minifier supports safe operator spacing, comments, whitespace, and newline removal.
- Example minification: `const percent = total === 0 ? 0 : ((passed/total) * 100).toFixed(2);` consistently minified.

## Changed

- N/A (initial release).

## Deprecated

- N/A

## Removed

- N/A

## Fixed

- N/A

## Security

- N/A
