// Register static assets so the bundler can copy them to the output directory.
import "./assets/images/favicon.svg";

// Load the global stylesheet once for the entire application shell.
import "./assets/styles/globals.css";

// Register HTML documents as bundle inputs instead of treating them as plain
// static files. This allows the boilerplate to emit complete HTML outputs.
import "./index.html";
import "./404.html";

// Start the browser-side application runtime after the required assets,
// styles, and HTML entries have been declared.
import "./index.js";
