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
│  ├─ components/       # JSX components (transpiled)
│  │  └─ Card.js
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

`entry.js` imports `Card.jsx` with a JSX assertion and a custom factory:

```js
import Card from "./components/Card.jsx" with { type: "jsx", factory: "elementBuilder" };
```

The bundler runs `compileJSX()` on `Card.jsx` before ESM→CJS conversion. The `factory` key overrides the default `"d"` and any `/** @jsx */` pragma in the target file.

The factory implementation lives in `factories/elementBuilder.js` and is imported normally by `Card.jsx`.

## Notes

- The demo uses native ESM in the browser. Make sure your browser supports it.
- `demo/public/` is generated and ignored by git.