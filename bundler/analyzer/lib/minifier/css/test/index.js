import minifyCSS from "../main.js";
import runTest from "../../../../utils/tester.js";

/**
 * BASIC DECLARATIONS
 */

runTest(
  "Minify CSS - simple declaration",
  minifyCSS(`color: red;`),
  "color:red;"
);

runTest(
  "Minify CSS - multiple declarations",
  minifyCSS(`width: 100px; height: 50px;`),
  "width:100px;height:50px;"
);

/**
 * WHITESPACE & NEWLINES
 */

runTest(
  "Minify CSS - remove whitespace",
  minifyCSS(`  color   :   red  ;  `),
  "color:red;"
);

runTest(
  "Minify CSS - remove newlines",
  minifyCSS(`
    color: red;
    background: blue;
  `),
  "color:red;background:blue;"
);

/**
 * COMMENTS
 */

runTest(
  "Minify CSS - remove comments",
  minifyCSS(`
    /* main color */
    color: red;
  `),
  "color:red;"
);

runTest(
  "Minify CSS - inline comment",
  minifyCSS(`color/*x*/:/*y*/red;`),
  "color:red;"
);

/**
 * SELECTORS
 */

runTest(
  "Minify CSS - simple selector",
  minifyCSS(`.box { color: red; }`),
  ".box{color:red;}"
);

runTest(
  "Minify CSS - complex selector",
  minifyCSS(`
    ul > li.active + li:hover {
      margin: 10px;
    }
  `),
  "ul>li.active+li:hover{margin:10px;}"
);

/**
 * FUNCTIONS & DIMENSIONS
 */

runTest(
  "Minify CSS - function value",
  minifyCSS(`transform: rotate(45deg);`),
  "transform:rotate(45deg);"
);

runTest(
  "Minify CSS - calc expression",
  minifyCSS(`width: calc(100% - 20px);`),
  "width:calc(100%-20px);"
);

/**
 * AT-RULES
 */

runTest(
  "Minify CSS - @media rule",
  minifyCSS(`
    @media screen and (max-width: 600px) {
      body {
        font-size: 14px;
      }
    }
  `),
  "@media screen and(max-width:600px){body{font-size:14px;}}"
);

/**
 * STRINGS & URLS
 */

runTest(
  "Minify CSS - string value",
  minifyCSS(`background: "img/bg.png";`),
  "background:\"img/bg.png\";"
);

runTest(
  "Minify CSS - url function",
  minifyCSS(`background: url("img/bg.png");`),
  "background:url(\"img/bg.png\");",
  true
);
