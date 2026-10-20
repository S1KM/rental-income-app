// tests/test_theme_toggle.js
// Automated verification suite for Dark & Light Theme system
// Verifies:
// 1. DOM elements for theme toggle in header
// 2. Tailwind darkMode: 'class' configuration
// 3. Pre-loader script in head to prevent FOUC
// 4. CSS rules for luxury obsidian dark theme
// 5. JavaScript theme engine: initTheme, setTheme, toggleTheme, updateThemeUi
// 6. localStorage persistence of theme preference

const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

console.log("=== Testing Dark & Light Theme System ===");

const htmlContent = fs.readFileSync('index.html', 'utf8');

// 1. Verify required DOM element IDs exist in index.html
const requiredIds = [
  "themeToggleBtn",
  "themeToggleText",
  "themeIconContainer",
  "themeIconSun",
  "themeIconMoon",
  "preThemeScript"
];

requiredIds.forEach((id) => {
  assert.ok(htmlContent.includes(`id="${id}"`), `Missing required ID: "${id}"`);
});
console.log(`✓ All ${requiredIds.length} required theme DOM element IDs verified in index.html!`);

// 2. Verify Tailwind darkMode config
assert.ok(htmlContent.includes("darkMode: 'class'"), "Tailwind must have darkMode: 'class'");
console.log("✓ Tailwind darkMode 'class' configuration verified!");

// 3. Verify CSS styling for dark theme
assert.ok(htmlContent.includes("body.dark-theme"), "Must have body.dark-theme CSS rules");
assert.ok(htmlContent.includes("#070b14"), "Must have obsidian slate dark background #070b14");
console.log("✓ Luxury executive dark theme CSS rules verified!");

// 4. Build VM sandbox to test JS logic
const elements = new Map();
function createEl(id = '', tag = 'div') {
  return {
    id,
    tagName: tag.toUpperCase(),
    classList: {
      _classes: new Set(),
      add: function(...cls) { cls.forEach(c => this._classes.add(c)); },
      remove: function(...cls) { cls.forEach(c => this._classes.delete(c)); },
      contains: function(c) { return this._classes.has(c); },
      toggle: function(c) { if (this.contains(c)) this.remove(c); else this.add(c); }
    },
    children: [],
    appendChild: function(child) { this.children.push(child); return child; },
    setAttribute: function(k, v) { this[k] = v; },
    getAttribute: function(k) { return this[k] || null; },
    listeners: {},
    addEventListener: function(event, cb) {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(cb);
    },
    trigger: function(event, evtObj = {}) {
      if (this.listeners[event]) {
        this.listeners[event].forEach(cb => cb({ target: this, currentTarget: this, ...evtObj }));
      }
    },
    closest: function(sel) { return this; },
    querySelector: function(sel) { return createEl(); },
    querySelectorAll: function(sel) { return []; },
    matches: function(sel) { return false; },
    dataset: {},
    innerHTML: '',
    textContent: '',
    value: '',
    style: {}
  };
}

function getOrSetEl(id, tag = 'div') {
  if (!elements.has(id)) {
    elements.set(id, createEl(id, tag));
  }
  return elements.get(id);
}

const docElement = createEl('html', 'html');
const docBody = createEl('body', 'body');

const documentMock = {
  documentElement: docElement,
  body: docBody,
  getElementById: (id) => getOrSetEl(id),
  querySelector: (sel) => getOrSetEl(sel.replace('#', '')),
  querySelectorAll: (sel) => [],
  createElement: (tag) => createEl('', tag)
};

let domLoadedCb = null;
const windowMock = {
  addEventListener: (event, cb) => {
    if (event === 'DOMContentLoaded') domLoadedCb = cb;
  },
  print: () => {},
  open: () => {},
  matchMedia: (query) => ({
    matches: false,
    addEventListener: () => {}
  }),
  Blob: function(parts, opts) { return { parts, opts }; },
  URL: { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} }
};

const localStorageStore = {};
const localStorageMock = {
  store: localStorageStore,
  getItem: function(k) { return this.store[k] !== undefined ? this.store[k] : null; },
  setItem: function(k, v) { this.store[k] = String(v); },
  removeItem: function(k) { delete this.store[k]; }
};

const sandbox = {
  document: documentMock,
  window: windowMock,
  localStorage: localStorageMock,
  console: console,
  navigator: { clipboard: { writeText: () => Promise.resolve() } },
  FileReader: function() {
    return { readAsDataURL: function() {} };
  },
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  alert: () => {}
};

vm.createContext(sandbox);

// Extract main application script
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scriptCode = '';
while ((match = scriptRegex.exec(htmlContent)) !== null) {
  if (match[1].length > 5000) {
    scriptCode = match[1];
    break;
  }
}

assert.ok(scriptCode, "Main script code must be located");
vm.runInContext(scriptCode, sandbox);
if (domLoadedCb) domLoadedCb();

// 5. Test Theme Engine Functions
assert.ok(typeof windowMock.setTheme === 'function', "window.setTheme must be a function");
assert.ok(typeof windowMock.toggleTheme === 'function', "window.toggleTheme must be a function");
assert.ok(typeof windowMock.initTheme === 'function', "window.initTheme must be a function");

// Test Set Dark Theme
windowMock.setTheme("dark", false);
assert.ok(docElement.classList.contains("dark"), "html element must have 'dark' class");
assert.ok(docBody.classList.contains("dark-theme"), "body element must have 'dark-theme' class");
assert.strictEqual(localStorageMock.getItem("rent_suite_theme"), "dark", "localStorage must persist 'dark'");
const themeTextEl = getOrSetEl("themeToggleText");
assert.strictEqual(themeTextEl.textContent, "Light", "Toggle button text must display 'Light' when dark mode is active");
console.log("✓ setTheme('dark') successfully applies dark classes and updates UI!");

// Test Toggle from Dark to Light
windowMock.toggleTheme();
assert.ok(!docElement.classList.contains("dark"), "html element must NOT have 'dark' class in light mode");
assert.ok(!docBody.classList.contains("dark-theme"), "body element must NOT have 'dark-theme' class in light mode");
assert.strictEqual(localStorageMock.getItem("rent_suite_theme"), "light", "localStorage must persist 'light'");
assert.strictEqual(themeTextEl.textContent, "Dark", "Toggle button text must display 'Dark' when light mode is active");
console.log("✓ toggleTheme() switches from Dark to Light smoothly!");

// Test Toggle from Light back to Dark
windowMock.toggleTheme();
assert.ok(docElement.classList.contains("dark"), "html element must have 'dark' class again");
assert.ok(docBody.classList.contains("dark-theme"), "body element must have 'dark-theme' class again");
assert.strictEqual(localStorageMock.getItem("rent_suite_theme"), "dark", "localStorage must persist 'dark' again");
console.log("✓ toggleTheme() switches from Light to Dark smoothly!");

console.log("\n====================================================================");
console.log("🎉 ALL DARK & LIGHT THEME TESTS PASSED 100%!");
console.log("====================================================================\n");
