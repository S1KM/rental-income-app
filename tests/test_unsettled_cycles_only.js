const fs = require('fs');
const vm = require('vm');

const htmlPath = 'd:/Rental Income app/index.html';
const html = fs.readFileSync(htmlPath, 'utf-8');

console.log('=== Testing Unsettled Rent Only in Target Billing Cycle ===');

// 1. Verify existence of required elements in HTML
const requiredIds = [
  'recordPartialPaymentModal',
  'partialPayCycleSelect',
  'partialPayRentDue',
  'partialPayAlreadyReceived',
  'partialPayRemainingDue',
  'partialPayDateInput',
  'partialPayAmountInput',
  'submitPartialPayBtn'
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
const generatePropertyLedgerData = windowMock.generatePropertyLedgerData;
const openPartialPaymentModal = windowMock.openPartialPaymentModal;

if (!state || !state.properties || !state.tenants) {
  console.error('FAIL: State not initialized');
  process.exit(1);
}

// Test Case 1: Tenant with Partial Rent Outstanding (Amit Sharma, Flat 103, osAmount = 6000)
const prop103 = state.properties.find(p => p.name.includes('103'));
const tenant103 = state.tenants.find(t => (t.unit || '').includes('103'));
console.log(`\n--- Test Case 1: ${tenant103.name} (${prop103.name}, O/S: ₹${tenant103.osAmount}) ---`);
const ledger103 = generatePropertyLedgerData(prop103.id);
console.log('Ledger cycles:');
ledger103.rows.forEach(r => console.log(`  ${r.cycle}: ${r.status} (Due: ₹${r.dueAmount}, Recv: ₹${r.receivedAmount})`));

const cycleSelect = getOrSetEl('partialPayCycleSelect');
cycleSelect.options = [];
cycleSelect.children = [];

openPartialPaymentModal(prop103.id);

console.log('\nOptions in Target Billing Cycle for Flat 103:');
cycleSelect.options.forEach(opt => console.log(`  -> value: "${opt.value}", text: "${opt.textContent}"`));

// Verify settled cycles (Apr to Sep) are NOT present
['Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026'].forEach(c => {
  const hasSettled = cycleSelect.options.some(opt => opt.value === c);
  if (hasSettled) {
    console.error(`FAIL: Settled cycle "${c}" was found in Target Billing Cycle!`);
    process.exit(1);
  }
});
console.log('✓ PASS: All settled cycles (Apr - Sep) are hidden from dropdown');

// Verify unsettled cycle Oct 2026 is present
const hasOct = cycleSelect.options.some(opt => opt.value === 'Oct 2026');
if (!hasOct) {
  console.error('FAIL: Unsettled cycle "Oct 2026" not found in Target Billing Cycle!');
  process.exit(1);
}
console.log('✓ PASS: Unsettled cycle "Oct 2026" (Partial) is present with pending dues!');

// Test Case 2: Tenant with Overdue Rent (Sunita Sharma, Flat 107, osAmount = 12000)
const prop107 = state.properties.find(p => p.name.includes('107'));
const tenant107 = state.tenants.find(t => (t.unit || '').includes('107'));
console.log(`\n--- Test Case 2: ${tenant107.name} (${prop107.name}, O/S: ₹${tenant107.osAmount}) ---`);
cycleSelect.options = [];
cycleSelect.children = [];

openPartialPaymentModal(prop107.id);
console.log('Options in Target Billing Cycle for Flat 107:');
cycleSelect.options.forEach(opt => console.log(`  -> value: "${opt.value}", text: "${opt.textContent}"`));

if (cycleSelect.options.length !== 1 || cycleSelect.options[0].value !== 'Oct 2026') {
  console.error('FAIL: Target Billing Cycle should contain ONLY Oct 2026!');
  process.exit(1);
}
console.log('✓ PASS: Target Billing Cycle strictly contains only the unsettled cycle Oct 2026 (Overdue)!');

// Test Case 3: Completely settled tenant (Manoj Kumar, Flat 101, osAmount = 0)
const prop101 = state.properties.find(p => p.name.includes('101'));
console.log(`\n--- Test Case 3: Settled Tenant Manoj Kumar (${prop101.name}, O/S: 0) ---`);
cycleSelect.options = [];
cycleSelect.children = [];

openPartialPaymentModal(prop101.id);
console.log('Options in Target Billing Cycle for Flat 101:');
cycleSelect.options.forEach(opt => console.log(`  -> value: "${opt.value}", text: "${opt.textContent}"`));

if (cycleSelect.options.length !== 1 || !cycleSelect.options[0].textContent.includes('settled')) {
  console.error('FAIL: Settled tenant did not show "All billing cycles settled" indicator!');
  process.exit(1);
}
console.log('✓ PASS: Settled tenant displays "All billing cycles settled ✓ (No unsettled rent)"!');

// Test Case 4: Explicit targetCycle override (e.g. user clicks on specific cycle date in ledger)
console.log('\n--- Test Case 4: Explicit Target Cycle Click in Ledger (Jul 2026) ---');
cycleSelect.options = [];
cycleSelect.children = [];

openPartialPaymentModal(prop101.id, 'Jul 2026');
console.log('Options in Target Billing Cycle for explicitly targeted Jul 2026:');
cycleSelect.options.forEach(opt => console.log(`  -> value: "${opt.value}", text: "${opt.textContent}"`));

const hasTargetCycle = cycleSelect.options.some(opt => opt.value === 'Jul 2026');
if (!hasTargetCycle) {
  console.error('FAIL: Explicitly clicked cycle "Jul 2026" should be present when targeted!');
  process.exit(1);
}
console.log('✓ PASS: Explicitly targeted cycle "Jul 2026" correctly available and selected for inspection/editing!');

console.log('\n✅ ALL UNSETTLED RENT TARGET BILLING CYCLE TESTS PASSED WITH 100% SUCCESS! (Code 0)');
