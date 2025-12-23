// ----------------------------------------------------------------------------
// MOCK WINDOW OBJECT
// ----------------------------------------------------------------------------
/**
 * Custom Window mock to simulate a browser-like environment.
 * Useful for testing modules that rely on `window` and `document`.
 */
function Window() {
  const $this = this;

  // --------------------------------------------------------------------------
  // MOCK LOCATION OBJECT
  // --------------------------------------------------------------------------
  /**
   * Simulates the window.location object in a browser.
   * Provides properties and methods that scripts often use.
   */
  this.location = {
    ancestorOrigins: {
      length: 0
    },
    hash: "",
    host: "mock.com",
    hostname: "mock.com",
    href: "https://mock.com/",
    origin: "https://mock.com",
    pathname: "/",
    port: "",
    protocol: "https:",
    
    /**
     * Simulates window.location.assign(url)
     * @param {string} url
     */
    assign: function(url) {
      console.log(`Assign called with: ${url}`);
    },

    /**
     * Simulates window.location.reload()
     */
    reload: function() {
      console.log("Reload called");
    },

    /**
     * Simulates window.location.replace(url)
     * @param {string} url
     */
    replace: function(url) {
      console.log(`Replace called with: ${url}`);
    },

    search: "",

    /**
     * Converts location object to string
     * @returns {string} href
     */
    toString: function() {
      return this.href;
    }
  };

  // --------------------------------------------------------------------------
  // MOCK DOCUMENT OBJECT
  // --------------------------------------------------------------------------
  /**
   * Simulates the window.document object in a browser.
   * Provides minimal API needed for dynamic script loading and DOM interaction.
   */
  this.document = {
    /**
     * Simulates document.createElement(tagName)
     * Only implements basic attributes and event hooks
     * @param {string} tagName
     * @returns {object} element
     */
    createElement: function(tagName) {
      const elem = {
        tagName,
        attributes: {},
        onload: null,
        onerror: null,
        setAttribute: function(name, value) {
          this.attributes[name] = value;
        }
      };
      return elem;
    },

    /**
     * Placeholder for getElementsByTagName, no-op
     */
    getElementsByTagName: function() { return []; },

    /**
     * Simulates <head> element in the DOM
     * Only implements appendChild to allow dynamic module imports
     */
    head: {
      appendChild: async function(node) {
        // Convert the script src to a relative path for dynamic import
        const moduleSrc = `./${node.attributes.src.split($this.location.href)[1]}`;

        // Dynamically import the module
        await import(moduleSrc);

        // Call the onload hook if defined
        if (typeof node.onload === "function") node.onload();
      }
    }
  };

  // Link document.location to window.location for consistency
  this.document.location = this.location;
}

// ----------------------------------------------------------------------------
// GLOBAL ASSIGNMENTS
// ----------------------------------------------------------------------------
const window = new Window();

// Expose window and document globally for testing environments
global.Window = Window;
global.window = window;
global.document = window.document;
