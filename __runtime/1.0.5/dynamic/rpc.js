(function(global, modules, entry) {
  global["*pointers"]("&registry")(modules);
  global["*pointers"]("&require")(entry);
})(
  typeof window !== "undefined" ? window : this,
  {
    "&::dynamic/rpc.js": [
      function(require, exports, module) {
        exports.getMessage = function() {
          return "Hello, World!";
        };
      },
      {}
    ]
  },
  "&::dynamic/rpc.js"
);