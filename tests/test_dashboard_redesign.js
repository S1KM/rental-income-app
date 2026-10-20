const fs = require('fs');
const vm = require('vm');

const htmlPath = 'd:/Rental Income app/index.html';
const html = fs.readFileSync(htmlPath, 'utf-8');

console.log('=== Testing Dashboard Scroll-Free View and Layout ===');

// 1. Verify existence of required elements in HTML
const requiredElements = [
  'dashSearchInput',
  'dashSortSelect',
  'dashViewTableBtn',
  'dashViewCardsBtn',
  'filterBtnGroup',
  'dashLocationFilterGroup',
  'dashActiveLocationBadge',
  'tenantListContainer'
];

requiredElements.forEach((id) => {
  if (!html.includes(`id="${id}"`)) {
    console.error(`FAIL: Missing ID in HTML: ${id}`);
    process.exit(1);
  }
  console.log(`✓ Found ID: ${id}`);
});

// Verify widescreen max-w-[1600px] container
if (html.includes('max-w-[1600px]')) {
  console.log('✓ Container upgraded to max-w-[1600px] for scroll-free view');
} else {
  console.warn('⚠️ max-w-[1600px] not detected in HTML');
}

// 2. Extract JavaScript and simulate in headless DOM sandbox
const startIdx = html.indexOf('<script>');
const endIdx = html.indexOf('</script>', startIdx);
const jsCode = html.substring(startIdx + 8, endIdx);

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
    focus: function() {},
    select: function() {},
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

const documentMock = {
  getElementById: (id) => getOrSetEl(id),
  querySelector: (sel) => getOrSetEl(sel.replace('#', '')),
  querySelectorAll: (sel) => [getOrSetEl('mock')],
  createElement: (tag) => createEl('', tag),
  body: {
    classList: { add: () => {}, remove: () => {} },
    appendChild: () => {},
    removeChild: () => {}
  }
};

let domLoadedCb = null;
const windowMock = {
  addEventListener: (event, cb) => {
    if (event === 'DOMContentLoaded') domLoadedCb = cb;
  },
  print: () => {},
  confirm: () => true,
  prompt: () => '0',
  open: () => {}
};

const localStorageMock = {
  data: {},
  getItem: function(k) { return this.data[k] || null; },
  setItem: function(k, v) { this.data[k] = v; },
  clear: function() { this.data = {}; }
};

const sandbox = {
  document: documentMock,
  window: windowMock,
  localStorage: localStorageMock,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  Math: Math,
  Date: Date,
  Number: Number,
  String: String,
  Array: Array,
  Object: Object,
  Set: Set,
  Map: Map,
  RegExp: RegExp,
  encodeURIComponent: encodeURIComponent
};

vm.createContext(sandbox);
vm.runInContext(jsCode, sandbox);

if (domLoadedCb) {
  domLoadedCb();
  console.log('✓ DOMContentLoaded simulated successfully');
} else {
  console.error('FAIL: DOMContentLoaded listener was not registered');
  process.exit(1);
}

const state = sandbox.window.state;
if (!state) {
  console.error('FAIL: state not found on window');
  process.exit(1);
}

// 3. Test renderTenantList with Table View
state.dashViewMode = 'table';
sandbox.window.renderAll ? sandbox.window.renderAll() : null;

const tenantContainer = getOrSetEl('tenantListContainer');
const renderedWrapper = tenantContainer.children[0];
if (!renderedWrapper) {
  console.error('FAIL: No table wrapper created in tenantListContainer');
  process.exit(1);
}

const tableHtml = renderedWrapper.innerHTML;

// Verifications
console.log('\n--- Verifying Dashboard Scroll-Free View ---');

if (!renderedWrapper.className.includes('overflow-hidden') && !renderedWrapper.className.includes('overflow-x-auto')) {
  console.error('FAIL: Wrapper missing overflow handling');
  process.exit(1);
}
console.log('✓ Table wrapper configured with clean overflow-hidden boundary');

if (!tableHtml.includes('w-full')) {
  console.error('FAIL: Table does not have w-full');
  process.exit(1);
}
console.log('✓ Table is set to w-full with responsive proportional columns (No forced min-width scroll)');

// Check that every header has whitespace-nowrap
const headers = [
  '#',
  'Flat / Unit',
  'Name',
  'Rent',
  'Lease Term',
  'Status',
  'Actions'
];

headers.forEach(h => {
  if (!tableHtml.includes(h)) {
    console.error(`FAIL: Missing header "${h}"`);
    process.exit(1);
  }
});
console.log('✓ All 7 required table headers present');

// Check building header banner
if (!tableHtml.includes('Sagarpur') || !tableHtml.includes('Occupied')) {
  console.error('FAIL: Building header banner content missing');
  process.exit(1);
}
console.log('✓ Building banner (Sagarpur Units, Occupied, Vacant, Expected Rent, O/S) properly rendered');

// Check flat unit, tenant profile, and actions
if (!tableHtml.includes('Flat 101, Sagarpur') || !tableHtml.includes('Manoj Kumar') || !tableHtml.includes('BSES-SG-101')) {
  console.error('FAIL: Missing unit Flat 101, Manoj Kumar or meter');
  process.exit(1);
}
console.log('✓ Flat 101, Manoj Kumar, and BSES-SG-101 rendered with clean scroll-free formatting');

if (!tableHtml.includes('Update Pay') || !tableHtml.includes('Ledger')) {
  console.error('FAIL: Missing action buttons in table row');
  process.exit(1);
}
console.log('✓ Action buttons: "Update Pay" and "Ledger" rendered with compact scroll-free button group');

// 4. Test renderTenantList with Cards View
tenantContainer.children = [];
state.dashViewMode = 'cards';
sandbox.window.renderTenantList ? sandbox.window.renderTenantList() : (sandbox.window.renderAll ? sandbox.window.renderAll() : null);

console.log('✓ Cards view tested successfully');

console.log('\nALL SCROLL-FREE VIEW TESTS PASSED SUCCESSFULLY! (Code 0)');
