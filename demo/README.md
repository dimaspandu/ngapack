# NGAPACK Demo

A minimal, self-contained demo showing how ngapack bundles a simple web application.

## What it demonstrates

- Static ES module imports
- CSS modules (`.module.css`)
- Non-JS asset emission (`.css`, `.html`)
- Browser runtime injection
- JSX transpilation with a custom factory

## Project structure

```
demo/
├─ src/                 # Source application
│  ├─ entry.js          # Entry point (orchestrates)
│  ├─ greeting.js       # Plain ES module
│  ├─ factories/        # JSX factory implementations
│  │  └─ elementBuilder.js
│  ├─ components/       # JSX components (transpiled via assertion)
│  │  ├─ Card.js
│  │  └─ DynamicCard.js
│  ├─ style.module.css  # CSS module (consumed by JS)
│  ├─ global.css        # Plain CSS asset
│  └─ index.html        # HTML asset
├─ public/              # Bundled output (generated)
├─ bundle.js            # Bundler runner
└─ serve.js             # Static server runner
```

## Usage

### 1. Bundle

```bash
node demo/bundle.js
```

Output is written to `demo/public/entry.js`.

### 2. Serve

```bash
node demo/serve.js
```

Then open: http://localhost:2121

## How it works

`demo/bundle.js` calls the ngapack bundler directly:

```js
import bundler from "../src/index.js";

await bundler({
  entry: path.join(__dirname, "src", "entry.js"),
  outputDir: path.join(__dirname, "public"),
  outputFilename: "entry.js",
  uglified: true
});
```

### JSX transpilation

`entry.js` imports `Card.js` with a JSX assertion and a custom factory:

```js
import Card from "./components/Card.js" with { type: "jsx", factory: "elementBuilder" };
```

The bundler runs `compileJSX()` on `Card.js` before ESM→CJS conversion. The `factory` key overrides the default `"d"` and any `/** @jsx */` pragma in the target file.

The factory implementation lives in `factories/elementBuilder.js` and is imported normally by `Card.js`.

It also shows the two call shapes the transpiler emits:

- `elementBuilder(tag, props, ...children)` for regular elements
- `elementBuilder.fragment(...children)` for `<></>`, backed by `document.createDocumentFragment()`
- SVG tags (`svg`, `path`, `circle`, ...) are routed to `document.createElementNS("http://www.w3.org/2000/svg", tag)`, with camelCase props such as `strokeWidth` written as kebab-case attributes and `viewBox`-style attributes kept verbatim

### Dynamic JSX import

`entry.js` also demonstrates a dynamic import with JSX assertion:

```js
const mod = await import("./components/DynamicCard.js", {
  type: "jsx",
  factory: "elementBuilder"
});
```

The JSX options are passed as the second argument of `import()`; the `import(..., with { ... })` form is not supported by the tokenizer.

The component is loaded at runtime, not bundled statically. The bundler extracts the dependency and applies the same transpilation pipeline as static imports.

## Notes

- The demo uses native ESM in the browser. Make sure your browser supports it.
- `demo/public/` is generated and ignored by git.