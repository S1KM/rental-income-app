const fs = require('fs');
const vm = require('vm');

const htmlPath = 'd:/Rental Income app/index.html';
const html = fs.readFileSync(htmlPath, 'utf-8');

console.log('=== Testing Running Balance Display Fix (Pending Dues Format) ===');

// 1. Verify existence of required elements in HTML
const requiredIds = [
  'tenantTrackRecordModal',
  'modalTrLedgerBody',
  'modalTrDuesStatus',
  'modalPropLedgerTableBody'
];

requiredIds.forEach((id) => {
  if (!html.includes(`id="${id}"`)) {
    console.error(`FAIL: Missing ID in HTML: ${id}`);
    process.exit(1);
  }
  console.log(`✓ Found ID: ${id}`);
});

// 2. Extract JavaScript and simulate in headless DOM sandbox
const startIdx = html.indexOf('<script>');
const endIdx = html.indexOf('</script>', startIdx);
const jsCode = html.substring(startIdx + 8, endIdx);

const elements = new Map();
function createEl(id = '', tag = 'div') {
  return {
    id,
    tagName: tag.toUpperCase(),
    value: '',
    textContent: '',
    innerHTML: '',
    className: '',
    disabled: false,
    selected: false,
    dataset: {},
    options: [],
    classList: {
      _classes: new Set(),
      add: function(...cls) { cls.forEach(c => this._classes.add(c)); },
      remove: function(...cls) { cls.forEach(c => this._classes.delete(c)); },
      contains: function(c) { return this._classes.has(c); },
      toggle: function(c) { if (this.contains(c)) this.remove(c); else this.add(c); }
    },
    children: [],
    appendChild: function(child) {
      this.children.push(child);
      if (this.tagName === 'SELECT') {
        this.options.push(child);
        if (child.selected || this.options.length === 1) {
          this.value = child.value;
        }
      }
      return child;
    },
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
    closest: function() { return this; },
    querySelector: function() { return createEl(); },
    querySelectorAll: function() { return []; },
    focus: function() {},
    select: function() {},
    style: {}
  };
}

function getOrSetEl(id, tag = 'div') {
  if (!elements.has(id)) {
    const t = id === 'partialPayCycleSelect' ? 'select' : (id.includes('Input') ? 'input' : (id.includes('Btn') ? 'button' : tag));
    elements.set(id, createEl(id, t));
  }
  return elements.get(id);
}

const mockDoc = {
  getElementById: (id) => getOrSetEl(id),
  querySelector: (sel) => getOrSetEl(sel.replace('#', '')),
  querySelectorAll: () => [getOrSetEl('mock')],
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

const mockLocalStorage = {
  data: {},
  getItem: function(k) { return this.data[k] || null; },
  setItem: function(k, v) { this.data[k] = String(v); },
  removeItem: function(k) { delete this.data[k]; },
  clear: function() { this.data = {}; }
};

const context = {
  window: windowMock,
  document: mockDoc,
  localStorage: mockLocalStorage,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  console: console,
  Date: Date,
  Math: Math,
  JSON: JSON,
  String: String,
  Number: Number,
  parseInt: parseInt,
  isNaN: isNaN,
  encodeURIComponent: encodeURIComponent,
  Array: Array,
  Object: Object
};

vm.createContext(context);

try {
  vm.runInContext(jsCode, context);
  if (domLoadedCb) domLoadedCb();
  console.log('✓ Script evaluated and DOMContentLoaded initialized in VM sandbox');
} catch (e) {
  console.error('FAIL: Script evaluation error:', e);
  process.exit(1);
}

const state = windowMock.state;
const prop = state.properties[0];
const tenant = state.tenants.find(t => (t.unit || '').includes('101'));

// Simulate user scenario: Oct 2026 has Part 1: ₹5,000 and Part 2: ₹5,000 (total ₹10,000 received on ₹12,000 due)
state.ledgerInstallments[prop.id + '_Oct 2026'] = [
  { date: '05-Oct-2026', amount: 5000, mode: 'UPI', ref: 'UPI/2610/55120' },
  { date: '19-Oct-2026', amount: 5000, mode: 'UPI', ref: 'UPI/2610/99999' }
];

console.log('\n--- 1. Testing Tenant Track Record Modal Table ---');
windowMock.openTenantTrackRecordModal(tenant.id);

const trBody = getOrSetEl('modalTrLedgerBody');
const octRowHtml = trBody.children[0].innerHTML;
console.log('Oct 2026 Row Raw HTML:\n', octRowHtml);

// Verify no '▲' symbol
if (octRowHtml.includes('▲')) {
  console.error('FAIL: Found confusing "▲" symbol in Oct 2026 row!');
  process.exit(1);
}
console.log('✓ PASS: No confusing "▲" up-arrow present');

// Verify '₹2,000 Due' is present
if (!octRowHtml.includes('₹2,000 Due')) {
  console.error('FAIL: Expected "₹2,000 Due" in Oct 2026 row!');
  process.exit(1);
}
console.log('✓ PASS: Oct 2026 row displays "₹2,000 Due" clearly');

// Verify settled row displays '₹0 Clear'
const sepRowHtml = trBody.children[1].innerHTML;
if (!sepRowHtml.includes('₹0 Clear')) {
  console.error('FAIL: Expected "₹0 Clear" in Sep 2026 settled row!');
  process.exit(1);
}
console.log('✓ PASS: Settled row (Sep 2026) displays "₹0 Clear"');

console.log('\n--- 2. Testing Property Ledger Modal Table ---');
windowMock.openPropertyLedgerModal(prop.id);
const propBody = getOrSetEl('modalPropLedgerTableBody');
const propRows = propBody.children;
const octPropRow = propRows.find(r => r.innerHTML.includes('Oct 2026'));
if (!octPropRow) {
  console.error('FAIL: Oct 2026 row not found in Property Ledger table!');
  process.exit(1);
}
console.log('Oct 2026 Property Ledger Row:', octPropRow.innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());

if (octPropRow.innerHTML.includes('▲')) {
  console.error('FAIL: Found "▲" in Property Ledger table!');
  process.exit(1);
}
if (!octPropRow.innerHTML.includes('₹2,000 Due')) {
  console.error('FAIL: Expected "₹2,000 Due" in Property Ledger table!');
  process.exit(1);
}
console.log('✓ PASS: Property Ledger modal table displays "₹2,000 Due"');

console.log('\n✅ ALL RUNNING BALANCE DUE DISPLAY TESTS PASSED SUCCESSFULLY! (Code 0)');
