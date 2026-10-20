const fs = require('fs');
const vm = require('vm');

console.log('--- Verifying Aadhaar Hidden and Payment Update Capabilities ---');

const htmlContent = fs.readFileSync('d:\\Rental Income app\\index.html', 'utf8');

// 1. Verify required IDs
const requiredIds = [
  'recordPartialPaymentModal',
  'partialPayFormTitle',
  'cancelEditInstallmentBtn',
  'submitPartialPayBtn',
  'submitPartialPayBtnText',
  'partialPayExistingList'
];

requiredIds.forEach(id => {
  if (!htmlContent.includes(`id="${id}"`)) {
    console.error(`❌ Missing required ID: ${id}`);
    process.exit(1);
  } else {
    console.log(`✓ Found ID: ${id}`);
  }
});

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

const sandbox = {
  window: windowMock,
  document: documentMock,
  localStorage: localStorageMock,
  console: console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  Date: Date,
  Math: Math,
  parseInt: parseInt,
  parseFloat: parseFloat,
  isNaN: isNaN,
  Array: Array,
  Object: Object,
  String: String,
  Number: Number,
  JSON: JSON,
  Set: Set,
  Map: Map,
  Event: function(type) { return { type }; }
};

vm.createContext(sandbox);
vm.runInContext(jsCode, sandbox);

if (domLoadedCb) {
  domLoadedCb();
  console.log('✓ DOMContentLoaded simulated successfully');
}

const state = sandbox.window.state;
if (!state) {
  console.error('❌ State not found on window!');
  process.exit(1);
}

// 3. Test Dashboard Table View for Aadhaar
const containerEl = documentMock.getElementById('tenantListContainer');
const tableHtml = containerEl.children.map(c => c.innerHTML).join(' ');

if (tableHtml.includes('🪪') || tableHtml.includes('2037') || tableHtml.includes('Aadhaar:')) {
  console.error('❌ Table view contains Aadhaar / 🪪 badge!');
  process.exit(1);
} else {
  console.log('✓ Table view: Aadhaar / 🪪 details completely hidden');
}

// 4. Test Dashboard Card View for Aadhaar
// Card view template in htmlContent:
const cardViewTemplate = htmlContent.slice(htmlContent.indexOf('CARDS VIEW: Grouped by Location'), htmlContent.indexOf('function renderPropertyMasterDirectory'));
if (cardViewTemplate.includes('🪪') || cardViewTemplate.includes('2037') || cardViewTemplate.includes('tenantIdNumber')) {
  console.error('❌ Card view template contains Aadhaar / 🪪 badge!');
  process.exit(1);
} else {
  console.log('✓ Card view: Aadhaar / 🪪 details completely hidden');
}

// 5. Test "Update Pay" button presence in HTML
if (!tableHtml.includes('Update Pay') || !tableHtml.includes('dash-record-payment')) {
  console.error('❌ Table view missing Update Pay button or dash-record-payment trigger!');
  process.exit(1);
}
console.log('✓ Table view contains Update Pay button and dash-record-payment trigger');

// 6. Test Opening Payment Modal for Flat 101
const flat101 = state.properties.find(p => p.name.includes('Flat 101'));
sandbox.window.openPartialPaymentModal(flat101.id, 'Oct 2026');
const modalEl = documentMock.getElementById('recordPartialPaymentModal');
console.log(`✓ Payment modal open: ${!modalEl.classList.contains('hidden')}`);

// 7. Test editInstallment
sandbox.window.editInstallment(flat101.id, 'Oct 2026', 0);
if (state.editingInstallmentIndex !== 0) {
  console.error(`❌ editingInstallmentIndex is not 0 (got ${state.editingInstallmentIndex})`);
  process.exit(1);
}

const submitBtnTextEl = documentMock.getElementById('submitPartialPayBtnText');
if (submitBtnTextEl.textContent !== 'Update Payment Received' && submitBtnTextEl.textContent !== 'Update the Entry') {
  console.error('❌ Submit button text did not change to "Update the Entry" / "Update Payment Received"');
  process.exit(1);
}

// 8. Test Submitting the Payment Update
const amtInput = documentMock.getElementById('partialPayAmountInput');
const dateInput = documentMock.getElementById('partialPayDateInput');
const refInput = documentMock.getElementById('partialPayRefInput');

amtInput.value = '10000'; // Update from 12000 to 10000
dateInput.value = '2026-10-06';
refInput.value = 'UPI/UPDATED/999';

sandbox.window.submitPartialPayment();

const instKey = flat101.id + '_Oct 2026';
const updatedInstallments = state.ledgerInstallments[instKey];
console.log('Updated installments:', updatedInstallments);

if (!updatedInstallments || updatedInstallments.length === 0) {
  console.error('❌ Installments missing after update!');
  process.exit(1);
}

const updatedEntry = updatedInstallments[0];
if (updatedEntry.amount !== 10000) {
  console.error(`❌ Amount not updated to 10000 (got ${updatedEntry.amount})`);
  process.exit(1);
}
if (!updatedEntry.date.includes('06-Oct-2026')) {
  console.error(`❌ Date not formatted to 06-Oct-2026 (got ${updatedEntry.date})`);
  process.exit(1);
}

console.log(`✓ Payment successfully updated in-place: ₹${updatedEntry.amount} on ${updatedEntry.date} (${updatedEntry.ref})`);

// 9. Test Cancel Edit Mode
sandbox.window.openPartialPaymentModal(flat101.id, 'Oct 2026');
sandbox.window.editInstallment(flat101.id, 'Oct 2026', 0);
sandbox.window.cancelEditInstallment();

if (state.editingInstallmentIndex !== null) {
  console.error('❌ editingInstallmentIndex not reset after cancelEditInstallment!');
  process.exit(1);
}
console.log(`✓ Submit button text after cancel edit: "${submitBtnTextEl.textContent}"`);
if (submitBtnTextEl.textContent !== 'Save Rent Payment') {
  console.error('❌ Submit button text did not reset to "Save Rent Payment"');
  process.exit(1);
}

console.log('\n✅ ALL VERIFICATION TESTS PASSED SUCCESSFULLY WITH 100% SUCCESS!');
