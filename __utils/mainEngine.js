function tokenizeESM(code) {
  const tokens = [];
  const re = /\/\/.*|\/\*[\s\S]*?\*\/|\s+|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|[A-Za-z_$][\w$]*|[{}(),.;:=]/g;
  let m;
  while ((m = re.exec(code)) !== null) {
    const value = m[0];
    if (/^\s+$/.test(value) || /^\/\//.test(value) || /^\/\*/.test(value)) continue;
    let type = "identifier";
    if (/^(import|export|from|as|with|default|function|class|await|const|let|var)$/.test(value))
      type = "keyword";
    else if (/^['"`]/.test(value)) type = "string";
    else if (/^[{}(),.;:=]$/.test(value)) type = "punct";
    tokens.push({ type, value, index: m.index });
  }
  return tokens;
}

function parseESM(tokens) {
  const ast = { imports: [], exports: [] };
  let i = 0;

  const peek = () => tokens[i];
  const next = () => tokens[i++];

  while (i < tokens.length) {
    const t = peek();
    if (!t) break;

    // ---- IMPORT ----
    if (t.value === "import") {
      next(); // consume 'import'
      const node = { type: "ImportDeclaration", dynamic: false, specifiers: [], attributes: {}, source: null };
      const start = i;

      if (peek()?.value === "(") {
        // dynamic import()
        node.dynamic = true;
        next(); // (
        node.type = "ImportExpression";
        const src = next();
        if (src.type === "string" || /^`/.test(src.value)) node.source = src.value;
        if (peek()?.value === ",") {
          next(); // ,
          const obj = [];
          while (peek() && peek().value !== ")") obj.push(next().value);
          node.attributes.raw = obj.join(" ");
        }
        if (peek()?.value === ")") next();
      } else {
        // static import
        const parts = [];
        while (peek() && peek().value !== ";") {
          parts.push(next().value);
          if (peek()?.value === ";") break;
        }
        const text = parts.join(" ");

        // Parse source
        const fromMatch = text.match(/from\s+(['"`])([^'"`]+)\1/);
        node.source = fromMatch ? `"${fromMatch[2]}"` : null;

        // Parse attributes (with { type: ... })
        const withMatch = text.match(/with\s*\{([^}]*)\}/);
        if (withMatch) node.attributes.raw = `{${withMatch[1]}}`;

        // Parse specifiers
        const named = text.match(/\{([^}]*)\}/);
        if (named) {
          named[1]
            .split(",")
            .map(s => s.trim())
            .filter(Boolean)
            .forEach(part => {
              const [orig, alias] = part.split(/\s+as\s+/).map(s => s.trim());
              node.specifiers.push({ type: "ImportSpecifier", imported: orig, local: alias || orig });
            });
        }
        const defaultOnly = text.match(/^import\s+([A-Za-z_$][\w$]*)/);
        if (defaultOnly && !/\{/.test(text))
          node.specifiers.push({ type: "ImportDefaultSpecifier", local: defaultOnly[1] });
      }

      ast.imports.push(node);
      continue;
    }

    // ---- EXPORT ----
    if (t.value === "export") {
      next();
      const node = { type: "ExportDeclaration", specifiers: [], source: null, default: false };

      if (peek()?.value === "default") {
        next();
        node.default = true;
        node.expression = [];
        while (peek() && peek().value !== ";") node.expression.push(next().value);
      } else if (peek()?.value === "{") {
        // export { ... } [from "mod"]
        const parts = [];
        while (peek() && peek().value !== ";") parts.push(next().value);
        const text = parts.join(" ");
        const named = text.match(/\{([^}]*)\}/);
        if (named) {
          named[1]
            .split(",")
            .map(s => s.trim())
            .filter(Boolean)
            .forEach(part => {
              const [orig, alias] = part.split(/\s+as\s+/).map(s => s.trim());
              node.specifiers.push({ type: "ExportSpecifier", local: orig, exported: alias || orig });
            });
        }
        const fromMatch = text.match(/from\s+(['"`])([^'"`]+)\1/);
        if (fromMatch) node.source = `"${fromMatch[2]}"`;
      } else {
        // export function / const ...
        const expr = [];
        while (peek() && peek().value !== ";") expr.push(next().value);
        node.expression = expr.join(" ");
      }

      ast.exports.push(node);
      continue;
    }

    next(); // skip unknown
  }

  return ast;
}

function analyzeToAST(source) {
  const tokens = tokenizeESM(source);
  // JUST FOR DEBUGGING
  console.log("=========tokens=========\n", tokens);
  // const ast = parseESM(tokens);
  // // JUST FOR DEBUGGING
  // console.log("=========ast=========\n", JSON.stringify(ast, null, 2));
  const ast = [];
  for (const i in tokens) {
    let expression = "";
    const token = tokens[i];

    if (token.type === "keyword" && token.value === "import") {
      expression += "require";
      tokens.unshift;
    }

    if (token.type === "punct" && token.value === ";") {
      break;
    }
  }
  // // JUST FOR DEBUGGING
  // console.log("=========ast=========\n", JSON.stringify(ast, null, 2));
  return ast;
}

function oneLine(code) {
  return code
    // Preserve string literals by escaping newlines inside them
    .replace(/(["'`])((?:\\\1|.)*?)\1/g, (m) => {
      return m.replace(/\n/g, "\\n");
    })
    // Remove line breaks when chained calls (dot before newline)
    .replace(/\.\s*[\r\n]+\s*/g, ".")
    // Remove generic newlines and indentations
    .replace(/[\r\n]+/g, " ")
    // Collapse multiple spaces
    .replace(/\s{2,}/g, " ")
    // Remove unwanted spaces before dot-methods
    .replace(/\s+\.(?=\w+\()/g, ".")
    .trim();
}

function tokenizer(code) {
  const strings = code.split("\n");

  for (const i in strings) {
    // strings[i] = strings[i].replaceAll(",", "");
    strings[i] = strings[i].replaceAll(";", "");

    // import ** from ""
    if (strings[i].includes("import") && strings[i].includes("from")) {
      let theString = "";
      const tokens = strings[i].split(" ");

      theString += "var ";
      for (let j = 1; j < tokens.length - 2; j++) {
        const token = tokens[j];
        theString += token;
      }
      theString += "=";
      theString += " ";
      theString += "require";
      theString += "(";
      theString += tokens[tokens.length - 1];
      theString += ")";
      theString += ";";

      strings[i] = theString;
    }

    if (strings[i].includes("export")) {
      strings[i] = strings[i].replace("export", "exports");
    }
  }

  // const tokens = strings.split(" ");
  return strings;
}

// JUST FOR DEBUGGING
// console.log(tokenizer(`
// import foo, { a1, a2 } from "./bar.js";
// import { x, y } from "./baz.js";

// export function baz() {}
// export default function qux() {}
// export const val = 123;
// `));

[
(function(name){
  const input = (`
import foo, { a1, a2 } from "./bar.js";
import { x, y } from "./baz.js";

export function baz() {}
export default function qux() {}
export const val = 123;
`);
  console.log(name);
  console.log(tokenizer(input));
})("Default + Named Imports/Exports"),

(function(name){
  const input = (`
export { lock } from "./lock.js";
`);
  console.log(name);
  console.log(tokenizer(input));
})("Re-export Simple"),

(function(name){
  const input = (`
export { original as alias } from "./mod.js";
`);
  console.log(name);
  console.log(tokenizer(input));
})("Re-export With Alias"),

(function(name){
  const input = (`
import { orig1 as a1, orig2 as a2 } from "./other.js";
console.log(a1, a2);
`);
  console.log(name);
  console.log(tokenizer(input));
})("Import Named With Alias"),

(function(name){
  const input = (`
export { a, b as beta, c } from "./module.js";
`);
  console.log(name);
  console.log(tokenizer(input));
})("Re-export Multiple"),

(function(name){
  const input = (`
function foo() {}
const baz = () => {};
const bar = { value: 1 };

export { foo, baz, bar };
`);
  console.log(name);
  console.log(tokenizer(input));
})("Named Exports List-Style"),

(function(name){
  const input = (`
function foo() {}
const baz = () => {};
const bar = { value: 1 };

export { foo as f, baz as b, bar as obj };
`);
  console.log(name);
  console.log(tokenizer(input));
})("Named Exports List-Style With Alias"),

(function(name){
  const input = (`
function foo() {}
const baz = () => {};
const bar = { value: 1 };

export default function main() {}
export { foo, baz, bar };
`);
  console.log(name);
  console.log(tokenizer(input));
})("Default + Named Exports List-Style"),

(function(name){
  const input = (`
import "./global.js";
import "./styles.css";
`);
  console.log(name);
  console.log(tokenizer(input));
})("Side-effect only imports"),

(function(name){
  const input = ("import `./global.js`; import `./styles.css`;");
  console.log(name);
  console.log(tokenizer(input));
})("Side-effect only imports using backticks"),

(function(name){
  const input = ("const something = \"3\"; import `./${something}/global.js`; import `./${something}/styles.css`;");
  console.log(name);
  console.log(tokenizer(input));
})("Side-effect only imports using backticks with template expressions"),

(function(name){
  const input = (`
const baseURL = window.supportESM
  ? "http://localhost:8000"
  : "http://localhost:8001";

const counter = import(\`\${baseURL}/components/counter.js\`);
`);
  console.log(name);
  console.log(tokenizer(input));
})("???"),

(function(name){
  const input = (`
  import rpc from "./rpc.js";
  `);
  console.log(name);
  console.log(tokenizer(input));
})("Import Default Only"),

(function(name){
  const input = (`
  import { http } from "./rpc.js";
  `);
  console.log(name);
  console.log(tokenizer(input));
})("Import Named Only"),

(function(name){
  const input = (`
  import { http as rpc } from "./rpc.js";
  `);
  console.log(name);
  console.log(tokenizer(input));
})("Import Named With Alias (Simple)"),

(function(name){
  const input = (`
  function getSecretMessage() {};
  export default getSecretMessage;
  `);
  console.log(name);
  console.log(tokenizer(input));
})("Export Default Function"),

(function(name){
  const input = (`
  async function load() {
    const mod = await import("./remote.js");
    return mod;
  }
  `);
  console.log(name);
  console.log(tokenizer(input));
})("Dynamic Import"),

(function(name){
  const input = (`
  import("./remote.js")
  `);
  console.log(name);
  console.log(tokenizer(input));
})("Dynamic Import (Simple)"),

(function(name){
  const input = (`
  import("./remote.js").then()
  `);
  console.log(name);
  console.log(tokenizer(input));
})("Dynamic Import with .then()"),

(function(name){
  const input = (`
  import("./remote.js", {
    namespace: "ANamespace"
  })
  `);
  console.log(name);
  console.log(tokenizer(input));
})("Dynamic Import with namespace"),

(function(name){
  const input = (`
  import("http://localhost:4001/resources/rpc.js", {
    namespace: "ANamespace"
  }).then()
  `);
  console.log(name);
  console.log(tokenizer(input));
})("Dynamic Import with ANamespace: contd"),

(function(name){
  const input = (`
  import("./remote.js").https()
  `);
  console.log(name);
  console.log(tokenizer(input));
})("Dynamic Import with .https()"),

(function(name){
  const input = (`
  export default greetings = {
    message: "Hello World!"
  };

  export default greetings;

  export default {
    message: "Hello World!"
  };

  export default [1, 2, 3];
  `);
  console.log(name);
  console.log(tokenizer(input));
})("Export Default Anything"),

(function(name){
  const input = (`
  export default function() {
    return "anon fn";
  }

  export default class {
    sayHi() { return "hi"; }
  }
  `);
  console.log(name);
  console.log(tokenizer(input));
})("Export Default Anything: Cont'd"),

(function(name){
  const input = (`
  import colors from "./colors.json" with { type: "json" };
  `);
  console.log(name);
  console.log(tokenizer(input));
})("Import JSON with import attributes"),

(function(name){
  const input = (`
  import sheet from "./styles.css" with { type: "css" };
  `);
  console.log(name);
  console.log(tokenizer(input));
})("Import CSS with import attributes"),

(function(name){
  const input = (`
  import("./dynamic/colors.json", {
    with: { type: "json" }
  });
  `);
  console.log(name);
  console.log(tokenizer(input));
})("Dynamic Import JSON with import attributes"),

(function(name){
  const input = (`
  import("./dynamic/styles.css", {
    with: { type: "css" }
  });
  `);
  console.log(name);
  console.log(tokenizer(input));
})("Dynamic Import CSS with import attributes"),

(function(name){
  const input = (`
  const localGlobalsSheet = await import("https://www.mock.com/styles/globals.css", {
    with: { type: "css" },
    namespace: "MainFrontend"
  });
  `);
  console.log(name);
  console.log(tokenizer(input));
})("Dynamic Import CSS with import attributes and a namespace")
];


