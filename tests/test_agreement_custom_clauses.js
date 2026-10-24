// tests/test_agreement_custom_clauses.js
// Automated verification suite for Custom Rental Clauses in Draft Tenancy Agreement

const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

console.log("=== Testing Custom Rental Clauses Feature in Draft Tenancy Agreement ===");

const htmlContent = fs.readFileSync('index.html', 'utf8');

// 1. Verify existence of required DOM element IDs in HTML
const requiredIds = [
  "customClausesSection",
  "customClausesCountBadge",
  "presetClausesContainer",
  "newClauseInput",
  "addCustomClauseBtn",
  "customClausesList",
  "preview1CustomClausesList",
  "preview2CustomClausesList"
];

requiredIds.forEach((id) => {
  assert.ok(htmlContent.includes(`id="${id}"`), `Missing required element ID in index.html: "${id}"`);
  console.log(`✓ Verified DOM element ID: "${id}"`);
});

// Verify preset buttons exist
assert.ok(htmlContent.includes('data-preset="pet"'), 'Missing preset button: pet');
assert.ok(htmlContent.includes('data-preset="lockin"'), 'Missing preset button: lockin');
assert.ok(htmlContent.includes('data-preset="paint"'), 'Missing preset button: paint');
assert.ok(htmlContent.includes('data-preset="late"'), 'Missing preset button: late');
console.log("✓ Verified all preset clause quick-buttons in HTML!");

// 2. Setup headless DOM simulation sandbox
const scriptMatch = htmlContent.match(/<script>([\s\S]*?)<\/script>[\s\S]*?<\/body>/);
assert.ok(scriptMatch, "Could not find script block in index.html");
const jsCode = scriptMatch[1];

const elements = {};
function createMockElement(id, tag = 'div') {
  const classes = new Set();
  return {
    id,
    tagName: tag.toUpperCase(),
    value: '',
    checked: false,
    className: '',
    textContent: '',
    innerHTML: '',
    style: {},
    dataset: {},
    children: [],
    appendChild: function(c) { this.children.push(c); return c; },
    classList: {
      add: (...cls) => cls.forEach(c => classes.add(c)),
      remove: (...cls) => cls.forEach(c => classes.delete(c)),
      contains: (c) => classes.has(c),
      toggle: (c) => { if (classes.has(c)) classes.delete(c); else classes.add(c); }
    },
    addEventListener: () => {},
    setAttribute: function(k, v) { this[k] = v; },
    getAttribute: function(k) { return this[k] || null; },
    closest: () => null,
    focus: () => {}
  };
}

const storage = {};
const mockLocalStorage = {
  getItem: (k) => (k in storage ? storage[k] : null),
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

const mockDoc = {
  getElementById: (id) => {
    if (!elements[id]) elements[id] = createMockElement(id);
    return elements[id];
  },
  createElement: (tag) => createMockElement('el_' + Math.random().toString(36).substr(2, 5), tag),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};

const mockWindow = {
  localStorage: mockLocalStorage,
  document: mockDoc,
  addEventListener: () => {},
  console: console,
  location: { origin: 'http://localhost:3000' }
};

const sandbox = {
  window: mockWindow,
  document: mockDoc,
  localStorage: mockLocalStorage,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  Intl: Intl,
  Date: Date,
  Math: Math,
  JSON: JSON,
  String: String,
  Number: Number,
  Array: Array,
  Object: Object,
  Boolean: Boolean,
  RegExp: RegExp,
  URL: { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} }
};

vm.createContext(sandbox);
vm.runInContext(jsCode, sandbox);

// 3. Verify functions exist on sandbox window
assert.strictEqual(typeof sandbox.window.addCustomClause, "function", "addCustomClause must be a function");
assert.strictEqual(typeof sandbox.window.removeCustomClause, "function", "removeCustomClause must be a function");
assert.strictEqual(typeof sandbox.window.editCustomClause, "function", "editCustomClause must be a function");
assert.strictEqual(typeof sandbox.window.renderCustomClauses, "function", "renderCustomClauses must be a function");
console.log("✓ All custom clause management functions verified on window!");

// 4. Test adding custom clauses
console.log("\n--- Testing Adding Custom Rental Clauses ---");
sandbox.window.addCustomClause("PET RESTRICTION: No pets allowed without written approval.");
sandbox.window.addCustomClause("LOCK-IN PERIOD: Mandatory 6 months lock-in period applies.");

const preview2List = mockDoc.getElementById("preview2CustomClausesList");
const preview1List = mockDoc.getElementById("preview1CustomClausesList");

assert.ok(!preview2List.classList.contains("hidden"), "Option 2 preview list should not be hidden when clauses exist");
assert.ok(!preview1List.classList.contains("hidden"), "Option 1 preview list should not be hidden when clauses exist");
assert.ok(preview2List.innerHTML.includes("PET RESTRICTION"), "Option 2 preview should include pet restriction clause");
assert.ok(preview2List.innerHTML.includes("LOCK-IN PERIOD"), "Option 2 preview should include lock-in clause");
assert.ok(preview1List.innerHTML.includes("PET RESTRICTION"), "Option 1 preview should include pet restriction clause");
console.log("✓ Custom clauses successfully rendered in both Option 2 and Option 1 preview lists!");

// 5. Test editing a custom clause
console.log("\n--- Testing Editing Custom Rental Clause ---");
sandbox.window.editCustomClause(0, "PET RESTRICTION (UPDATED): Pets permitted only on ground floor.");
assert.ok(preview2List.innerHTML.includes("PET RESTRICTION (UPDATED)"), "Option 2 preview should reflect updated text");
assert.ok(preview1List.innerHTML.includes("PET RESTRICTION (UPDATED)"), "Option 1 preview should reflect updated text");
console.log("✓ Custom clause live edits update deed preview instantly!");

// 6. Test removing a custom clause
console.log("\n--- Testing Removing Custom Rental Clause ---");
sandbox.window.removeCustomClause(0);
assert.ok(!preview2List.innerHTML.includes("PET RESTRICTION"), "Deleted clause should no longer be in preview");
assert.ok(preview2List.innerHTML.includes("LOCK-IN PERIOD"), "Remaining clause should stay in preview");
console.log("✓ Clause removal successfully updates list and previews!");

// Remove remaining clause
sandbox.window.removeCustomClause(0);
assert.ok(preview2List.classList.contains("hidden"), "Option 2 preview list should be hidden when 0 custom clauses");
assert.ok(preview1List.classList.contains("hidden"), "Option 1 preview list should be hidden when 0 custom clauses");
console.log("✓ When 0 custom clauses, preview lists are cleanly hidden!");

console.log("\n====================================================================");
console.log("🎉 ALL DRAFT TENANCY AGREEMENT CUSTOM CLAUSE TESTS PASSED 100%!");
console.log("====================================================================\n");
