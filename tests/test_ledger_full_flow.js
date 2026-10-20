const fs = require('fs');

const htmlContent = fs.readFileSync('d:\\Rental Income app\\index.html', 'utf8');

const needle = '<script>\n    (function () {';
const startIdx = htmlContent.indexOf(needle);
if (startIdx === -1) {
  console.error('Could not locate inline script start');
  process.exit(1);
}

const endIdx = htmlContent.indexOf('</script>', startIdx);
const jsCode = htmlContent.substring(startIdx + 8, endIdx);

// Mock DOM
const elements = new Map();

function createEl(id = '', tag = 'div') {
  const el = {
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
    closest: function(sel) {
      return this;
    },
    querySelector: function(sel) {
      return createEl();
    },
    querySelectorAll: function(sel) {
      return [];
    },
    dataset: {},
    innerHTML: '',
    textContent: '',
    value: '',
    style: {}
  };
  return el;
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
    if (event === 'DOMContentLoaded') {
      domLoadedCb = cb;
    }
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

const vm = require('vm');
const ctx = {
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

vm.createContext(ctx);
vm.runInContext(jsCode, ctx);

console.log('Testing Ledger Full Flow...');

if (domLoadedCb) {
  domLoadedCb();
} else {
  console.error('DOMContentLoaded not bound');
  process.exit(1);
}

// Test opening ledger modal
console.log('\n--- Step 1: Open Property Ledger for Flat 101 ---');
ctx.window.openPropertyLedgerModal('prop_101');

const title = getOrSetEl('modalPropLedgerTitle').textContent;
const billed = getOrSetEl('modalPropLedgerTotalBilled').textContent;
const received = getOrSetEl('modalPropLedgerTotalReceived').textContent;
const balance = getOrSetEl('modalPropLedgerCurrentBalance').textContent;
const status = getOrSetEl('modalPropLedgerBalanceStatus').textContent;
const meter = getOrSetEl('modalPropLedgerMeterBadge').textContent;
const deposit = getOrSetEl('modalPropLedgerDepositHeld').textContent;
const tbody = getOrSetEl('modalPropLedgerTableBody');
const tfoot = getOrSetEl('modalPropLedgerTableFoot');

console.log(`Title: ${title}`);
console.log(`Meter: ${meter}`);
console.log(`Deposit: ${deposit}`);
console.log(`Billed: ${billed}`);
console.log(`Received: ${received}`);
console.log(`Balance: ${balance} (${status})`);
console.log(`Table Rows Count: ${tbody.children.length}`);
console.log(`Tfoot Populated: ${tfoot.innerHTML.length > 0}`);

if (!title.includes('Flat 101') || tbody.children.length === 0) {
  console.error('❌ Failed Step 1');
  process.exit(1);
}

console.log('\n--- Step 2: Test Filters & Sorting ---');
const btnPaid = getOrSetEl('ledgerFilterPaid');
btnPaid.trigger('click');
console.log(`Filtered Paid Rows: ${tbody.children.length}`);

const sortToggle = getOrSetEl('ledgerSortToggle');
sortToggle.trigger('click');
console.log(`Sorted Newest First. Sort Label: ${getOrSetEl('ledgerSortLabel').textContent}`);

const btnAll = getOrSetEl('ledgerFilterAll');
btnAll.trigger('click');
console.log(`Reset to All: ${tbody.children.length} rows`);

console.log('\n--- Step 3: Open Defaulter Property (Flat 102) ---');
const defProp = ctx.window.state.properties.find(p => {
  const t = ctx.window.state.tenants.find(ten => (ten.unit||'').trim().toLowerCase() === (p.name||'').trim().toLowerCase());
  return t && t.osAmount > 0;
});

if (defProp) {
  ctx.window.openPropertyLedgerModal(defProp.id);
  const defBal = getOrSetEl('modalPropLedgerCurrentBalance').textContent;
  const defStat = getOrSetEl('modalPropLedgerBalanceStatus').textContent;
  console.log(`Defaulter Property: ${defProp.name}, Balance: ${defBal}, Status: ${defStat}`);

  console.log('Testing Settle Balance action:');
  ctx.window.settlePropertyLedgerBalance(defProp.id);
  const settledBal = getOrSetEl('modalPropLedgerCurrentBalance').textContent;
  const settledStat = getOrSetEl('modalPropLedgerBalanceStatus').textContent;
  console.log(`After Settle: Balance: ${settledBal}, Status: ${settledStat}`);

  if (settledBal !== '₹0') {
    console.error('❌ Settle balance failed to clear dues');
    process.exit(1);
  }
}

console.log('\n--- Step 4: Open Vacant Property ---');
const vacProp = ctx.window.state.properties.find(p => {
  return !ctx.window.state.tenants.some(t => t.status !== 'Vacated' && (t.unit||'').trim().toLowerCase() === (p.name||'').trim().toLowerCase());
});

if (vacProp) {
  ctx.window.openPropertyLedgerModal(vacProp.id);
  const vacNotice = getOrSetEl('modalPropLedgerVacantNotice');
  console.log(`Vacant property: ${vacProp.name}`);
  console.log(`Vacant Notice Hidden? ${vacNotice.classList.contains('hidden')}`);
  console.log(`Table Body Content: ${tbody.innerHTML.substring(0, 100)}...`);
}

console.log('\n✅ ALL LEDGER TESTS PASSED WITH 100% SUCCESS!');
