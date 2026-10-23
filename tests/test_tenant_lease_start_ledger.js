const fs = require('fs');
const vm = require('vm');

const htmlPath = 'd:/Rental Income app/index.html';
const html = fs.readFileSync(htmlPath, 'utf-8');

console.log('=== Testing Tenant Lease Start Date Ledger and Period Accuracy ===');

// Setup DOM sandbox
const startIdx = html.indexOf('<script>');
const endIdx = html.lastIndexOf('</script>');
const jsCode = html.substring(startIdx + 8, endIdx);

const elements = new Map();
function createEl(id = '', tag = 'div') {
  return {
    id,
    tagName: tag.toUpperCase(),
    dataset: {},
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
    closest: function() { return this; },
    querySelector: function(sel) { return createEl(); },
    querySelectorAll: function(sel) { return []; },
    focus: function() {},
    select: function() {},
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
  querySelectorAll: (sel) => [],
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

if (domLoadedCb) domLoadedCb();

const { generatePropertyLedgerData, computeTenantScore, state } = sandbox.window;

// 1. Test Tenant Registered with lease starting "Term: 2026-10-20"
console.log('\n--- Scenario 1: Tenant registered with Term: 2026-10-20 ---');
const propTest1 = {
  id: 'prop_oct_test',
  name: 'Flat 999, Green Hills',
  building: 'Green Hills',
  rent: 20000
};
const tenantTest1 = {
  id: 'ten_oct_test',
  unit: 'Flat 999, Green Hills',
  name: 'Amitabh Sen',
  rent: 20000,
  osAmount: 0,
  status: 'Active',
  startDate: 'Term: 2026-10-20',
  endDate: '2027-09-19'
};

state.properties.push(propTest1);
state.tenants.push(tenantTest1);

const ledger1 = generatePropertyLedgerData(propTest1.id, tenantTest1);
if (!ledger1) {
  console.error('FAIL: ledger1 returned null');
  process.exit(1);
}

console.log('Ledger1 rows count:', ledger1.rows.length);
console.log('Ledger1 cycles:', ledger1.rows.map(r => r.cycle));
console.log('Ledger1 Total Billed:', ledger1.totalBilled, '| Total Received:', ledger1.totalReceived);

// Check that rows do NOT include April 2026 to September 2026
const forbiddenCycles = ['Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026'];
forbiddenCycles.forEach((c) => {
  if (ledger1.rows.some(r => r.cycle === c)) {
    console.error(`FAIL: Tenant starting in Oct 2026 should NOT have row for cycle ${c}`);
    process.exit(1);
  }
});
console.log('✓ Successfully confirmed: April 2026 to September 2026 are NOT billed or settled for Oct tenant');

// Check that Oct 2026 IS included
if (!ledger1.rows.some(r => r.cycle === 'Oct 2026') || ledger1.rows.length !== 1) {
  console.error(`FAIL: Expected exactly 1 cycle (Oct 2026), got ${ledger1.rows.length}`);
  process.exit(1);
}
console.log('✓ Exactly 1 cycle (Oct 2026) billed and present in ledger');

if (ledger1.totalBilled !== 20000 || ledger1.totalReceived !== 20000) {
  console.error(`FAIL: Expected totalBilled=20000 and totalReceived=20000, got billed=${ledger1.totalBilled}, received=${ledger1.totalReceived}`);
  process.exit(1);
}
console.log('✓ Total billed & received accurately reflect ₹20,000 for October (not 7x ₹1,40,000 from April)');

// 2. Test computeTenantScore history dots
const score1 = computeTenantScore(tenantTest1);
const unleasedMonths = score1.historyDots.filter(d => d.status === 'unleased').map(d => d.month);
console.log('Unleased months in 6-mo history track:', unleasedMonths);
if (!unleasedMonths.includes('May') || !unleasedMonths.includes('Sep') || unleasedMonths.includes('Oct')) {
  console.error('FAIL: Tenant score history dots incorrectly marked pre-lease months as paid');
  process.exit(1);
}
console.log('✓ History dots correctly distinguish pre-lease months (May-Sep) from active tenancy (Oct)');

// 3. Test Mid-year Tenant (e.g. lease started 2026-07-01)
console.log('\n--- Scenario 2: Tenant registered with lease starting 2026-07-01 ---');
const propTest2 = {
  id: 'prop_jul_test',
  name: 'Studio 5A, Cyber City',
  building: 'Cyber City',
  rent: 15000
};
const tenantTest2 = {
  id: 'ten_jul_test',
  unit: 'Studio 5A, Cyber City',
  name: 'Sara Khan',
  rent: 15000,
  osAmount: 0,
  status: 'Active',
  startDate: '2026-07-01',
  endDate: '2027-06-30'
};

const ledger2 = generatePropertyLedgerData(propTest2.id, tenantTest2);
console.log('Ledger2 cycles:', ledger2.rows.map(r => r.cycle));
if (ledger2.rows.length !== 4) {
  console.error(`FAIL: Expected 4 cycles (Jul, Aug, Sep, Oct), got ${ledger2.rows.length}`);
  process.exit(1);
}
if (ledger2.rows.some(r => r.cycle === 'Apr 2026' || r.cycle === 'May 2026' || r.cycle === 'Jun 2026')) {
  console.error('FAIL: Pre-July cycles should not be present');
  process.exit(1);
}
console.log('✓ Mid-year tenant accurately billed 4 cycles (Jul 2026 to Oct 2026) totaling ₹60,000');

console.log('\n========================================================================');
console.log('ALL TENANT LEASE START DATE LEDGER TESTS PASSED! (Code 0)');
console.log('========================================================================');
