/**
 * Example of an external CSS resource module (Microfrontend-compatible).
 * Defines simple global CSS rules and exports them as a stylesheet or raw text.
 */
(function(global, modules, entry) {
  global["*pointers"]("&registry")(modules);
  global["*pointers"]("&require")(entry);
})(
  typeof window !== "undefined" ? window : this,
  {
    "Somewhere::resources/somewhere.css": [
      function(require, exports, module) {
        var raw = (`
          * {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            font-size: 16px;
            margin: 0;
            padding: 0;
          }
        `);

        if (typeof CSSStyleSheet === "undefined") {
          exports.default = raw;
        } else {
          var sheet = new CSSStyleSheet();
          sheet.replaceSync(raw);
          exports.default = sheet;
        }
      },
      {}
    ]
  },
  "Somewhere::resources/somewhere.css"
);
