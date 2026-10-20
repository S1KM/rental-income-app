const fs = require('fs');
const vm = require('vm');

const htmlContent = fs.readFileSync('d:\\Rental Income app\\index.html', 'utf8');

console.log('--- Verifying Partial Payments and Multi-Date Installment Ledger Requirements ---');

// 1. Verify Markup Elements
const requiredIds = [
  'recordPartialPaymentModal',
  'partialPayModalTitle',
  'partialPaySubtitle',
  'closePartialPayModalBtn',
  'partialPayCycleSelect',
  'partialPayRentDue',
  'partialPayAlreadyReceived',
  'partialPayRemainingDue',
  'partialPayDateInput',
  'partialPayAmountInput',
  'quickAmtFullDueBtn',
  'partialPayModeSelect',
  'partialPayRefInput',
  'cancelPartialPayBtn',
  'submitPartialPayBtn',
  'modalPropLedgerRecordPaymentBtn'
];

let missing = 0;
requiredIds.forEach(id => {
  if (!htmlContent.includes(`id="${id}"`)) {
    console.error(`❌ Missing ID: ${id}`);
    missing++;
  } else {
    console.log(`✓ Found ID: ${id}`);
  }
});

if (missing > 0) {
  console.error('Markup check failed.');
  process.exit(1);
}

// 2. Extract and run JS
const needle = '<script>\n    (function () {';
const startIdx = htmlContent.indexOf(needle);
const endIdx = htmlContent.indexOf('</script>', startIdx);
const jsCode = htmlContent.substring(startIdx + 8, endIdx);

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
    focus: function() {},
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
  open: () => {},
  Blob: function(parts, opts) { return { parts, opts }; },
  URL: { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} }
};

const localStorageMock = {
  store: {},
  getItem: function(k) { return this.store[k] || null; },
  setItem: function(k, v) { this.store[k] = String(v); },
  removeItem: function(k) { delete this.store[k]; },
  clear: function() { this.store = {}; }
};

const vmContext = {
  document: documentMock,
  window: windowMock,
  localStorage: localStorageMock,
  console: console,
  setTimeout: (cb) => { if (typeof cb === 'function') cb(); },
  clearTimeout: () => {},
  Math: Math,
  Date: Date,
  String: String,
  Number: Number,
  Array: Array,
  Object: Object,
  RegExp: RegExp,
  Set: Set,
  Map: Map,
  Blob: windowMock.Blob,
  URL: windowMock.URL
};

vm.createContext(vmContext);
vm.runInContext(jsCode, vmContext);

if (domLoadedCb) domLoadedCb();

console.log('\n--- Test 1: Verify Multi-Date Installment Generation ---');
const ledgerData = vmContext.window.state.properties[0] ? vmContext.window.openPropertyLedgerModal(vmContext.window.state.properties[0].id) : null;
const prop0 = vmContext.window.state.properties[0];
const ledger = vmContext.window.state ? vmContext.window.state.properties[0] : null;

// Re-fetch data directly via generatePropertyLedgerData
const pData = vmContext.window.state.properties[0];
const data = vmContext.window.state.properties.length > 0 ? (function() {
  // Call internal or inspect state
  return vmContext.window.state.properties[0];
})() : null;

console.log(`Inspecting Flat 101 ledger rows:`);
// Open modal
vmContext.window.openPropertyLedgerModal(prop0.id);
const tbody = getOrSetEl('modalPropLedgerTableBody');

console.log(`Rendered ${tbody.children.length} rows in property ledger modal.`);
let hasTwoDates = false;
let hasThreeDates = false;

tbody.children.forEach(child => {
  const html = child.innerHTML;
  if (html.includes('Part 1:') && html.includes('Part 2:') && html.includes('Part 3:')) {
    hasThreeDates = true;
    console.log(`✓ Found Row with 3 Dates / Parts: ${child.innerHTML.substring(0, 140)}...`);
  } else if (html.includes('Part 1:') && html.includes('Part 2:')) {
    hasTwoDates = true;
    console.log(`✓ Found Row with 2 Dates / Parts: ${child.innerHTML.substring(0, 140)}...`);
  }
});

if (!hasTwoDates) {
  console.error('❌ Failed to find 2-date installment row');
  process.exit(1);
}
if (!hasThreeDates) {
  console.error('❌ Failed to find 3-date installment row');
  process.exit(1);
}
console.log('✓ Multi-date installment display confirmed!');

console.log('\n--- Test 2: Test Recording a Partial Payment ---');
// Find an overdue property or Flat 101
vmContext.window.openPartialPaymentModal(prop0.id, 'Oct 2026');
const modal = getOrSetEl('recordPartialPaymentModal');
console.log(`Modal open: ${!modal.classList.contains('hidden')}`);

// Set payment of ₹4,000 on 12-Oct-2026
getOrSetEl('partialPayAmountInput').value = 4000;
getOrSetEl('partialPayDateInput').value = '2026-10-12';
getOrSetEl('partialPayModeSelect').value = 'UPI';
getOrSetEl('partialPayRefInput').value = 'UPI/TEST/12001';

console.log('Submitting partial payment...');
vmContext.window.submitPartialPayment();

console.log(`Modal closed: ${modal.classList.contains('hidden')}`);

// Check state.ledgerInstallments
const key = prop0.id + '_Oct 2026';
const insts = vmContext.window.state.ledgerInstallments[key];
console.log(`Stored installments for ${key}:`, insts);

if (!insts || insts.length === 0) {
  console.error('❌ Partial payment was not saved in state');
  process.exit(1);
}

const lastInst = insts[insts.length - 1];
console.log(`Last installment: Amount ${lastInst.amount}, Date ${lastInst.date}, Mode ${lastInst.mode}`);
if (lastInst.amount !== 4000 || lastInst.date !== '12-Oct-2026') {
  console.error('❌ Installment data mismatch');
  process.exit(1);
}

console.log('\n--- Test 3: Verify whitespace-nowrap adherence ---');
// Check that table rows and date badges in the rendered DOM have whitespace-nowrap
let wrapViolations = 0;
tbody.children.forEach(child => {
  if (!child.className.includes('whitespace-nowrap')) {
    wrapViolations++;
  }
});

console.log(`Row wrap violations: ${wrapViolations}`);
if (wrapViolations > 0) {
  console.error('❌ Some rows lack whitespace-nowrap');
  process.exit(1);
}

console.log('\n✅ ALL PARTIAL PAYMENT & MULTI-DATE LEDGER TESTS PASSED SUCCESSFULLY!');
process.exit(0);
