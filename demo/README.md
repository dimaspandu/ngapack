# NGAPACK Demo

A minimal, self-contained demo showing how ngapack bundles a simple web application.

## What it demonstrates

- Static ES module imports
- CSS modules (`.module.css`)
- Non-JS asset emission (`.css`, `.html`)
- Browser runtime injection

## Project structure

```
demo/
├─ src/                 # Source application
│  ├─ entry.js          # Entry point (consumes modules)
│  ├─ greeting.js       # Plain ES module
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

The bundler:

1. **Analyzes** `entry.js` and extracts its dependency graph.
2. **Bundles** all reachable modules into a single output file.
3. **Emits** non-JS assets (`global.css`, `index.html`) into `demo/public/`.
4. **Injects** the ngapack runtime so the browser can resolve modules at runtime.

## Notes

- The demo uses native ESM in the browser. Make sure your browser supports it.
- `demo/public/` is generated and ignored by git.