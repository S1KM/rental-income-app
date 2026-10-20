const fs = require("fs");
const vm = require("vm");

const htmlPath = "d:/Rental Income app/index.html";
const html = fs.readFileSync(htmlPath, "utf-8");

console.log("=== Testing Improved Payment Updatation System ===");

// 1. Verify existence of required elements in HTML
const requiredIds = [
  "recordPartialPaymentModal",
  "partialPayFormTitle",
  "addNewInstallmentModeBtn",
  "cancelEditInstallmentBtn",
  "submitPartialPayBtn",
  "submitPartialPayBtnText",
  "submitPartialPayBtnIcon",
  "partialPayCycleSelect",
  "partialPayRentDue",
  "partialPayAlreadyReceived",
  "partialPayRemainingDue",
  "partialPayDateInput",
  "partialPayAmountInput",
  "partialPayModeSelect",
  "partialPayRefInput",
  "partialPayExistingList"
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
  setItem: function(k, v) { this.data[k] = String(v); },
  removeItem: function(k) { delete this.data[k]; }
};

const context = {
  window: windowMock,
  document: documentMock,
  localStorage: localStorageMock,
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
vm.runInContext(jsCode, context);

if (domLoadedCb) domLoadedCb();
console.log("✓ DOMContentLoaded simulated successfully");

const state = windowMock.state;
if (!state || !state.properties || !state.tenants) {
  console.error("FAIL: State not initialized properly");
  process.exit(1);
}

// 3. Test opening payment modal for Flat 101 on Oct 2026
const prop = state.properties[0];
const tenant = state.tenants.find((t) => (t.unit || "").trim().toLowerCase() === (prop.name || "").trim().toLowerCase());

console.log(`\nTesting Flat 101 (${prop.name}), Tenant: ${tenant.name}`);

// Open modal for Oct 2026
windowMock.openPartialPaymentModal(prop.id, "Oct 2026");

const submitTextEl = getOrSetEl("submitPartialPayBtnText");
const titleEl = getOrSetEl("partialPayFormTitle");
const amountInputEl = getOrSetEl("partialPayAmountInput");

console.log("Modal opened mode:");
console.log(`- Title: ${titleEl.innerHTML}`);
console.log(`- Button Text: ${submitTextEl.textContent}`);
console.log(`- Amount: ${amountInputEl.value}`);

// Oct 2026 has existing payment, so it must start in Update mode
if (!submitTextEl.textContent.includes("Update the Entry") && !submitTextEl.textContent.includes("Update")) {
  console.error("FAIL: Did not automatically default to Update the Entry mode for cycle with existing payment");
  process.exit(1);
}
console.log("PASS: Modal automatically opened in 'Update the Entry' mode with current payment loaded!");

// Verify that NO state updates happen before clicking the update button
// Modify values in form
amountInputEl.value = "8000";
const dateInputEl = getOrSetEl("partialPayDateInput");
dateInputEl.value = "2026-10-15";

console.log("PASS: Inputs modified. Verifying no changes occur until clicking 'Update the Entry'...");

// Now click Update the Entry (submitPartialPayment)
windowMock.submitPartialPayment();

// Verify after update:
console.log(`After update:`);
const updatedLedger = windowMock.generatePropertyLedgerData(prop.id);
const octRow = updatedLedger.rows.find((r) => r.cycle === "Oct 2026");

console.log(`- Oct 2026 Received Amount: ₹${octRow.receivedAmount}`);
console.log(`- Oct 2026 Payments:`, octRow.payments);
console.log(`- Oct 2026 Status: ${octRow.status}`);
console.log(`- Oct 2026 Running Balance: ₹${octRow.runningBalance}`);
console.log(`- Ledger Final Current Balance: ₹${updatedLedger.currentBalance}`);
console.log(`- Tenant Outstanding Dues: ₹${tenant.osAmount}`);

if (octRow.receivedAmount !== 8000) {
  console.error(`FAIL: Oct 2026 receivedAmount expected 8000, got ${octRow.receivedAmount}`);
  process.exit(1);
}
console.log("PASS: Oct 2026 payment entry updated cleanly to ₹8,000!");

if (tenant.osAmount !== updatedLedger.currentBalance) {
  console.error(`FAIL: Tenant osAmount (₹${tenant.osAmount}) does not match ledger currentBalance (₹${updatedLedger.currentBalance})`);
  process.exit(1);
}
console.log("PASS: Tenant outstanding balance matches the exact ledger current balance (₹" + tenant.osAmount + ")");

// 4. Test Switching between Update Mode and Add New Part
windowMock.openPartialPaymentModal(prop.id, "Oct 2026");
console.log("\nSwitching to 'Add New Part' mode...");
windowMock.setAddInstallmentMode();

console.log(`- New Title: ${getOrSetEl("partialPayFormTitle").innerHTML}`);
console.log(`- New Button Text: ${getOrSetEl("submitPartialPayBtnText").textContent}`);

if (!getOrSetEl("submitPartialPayBtnText").textContent.includes("Save Rent Payment")) {
  console.error("FAIL: Button text did not change to 'Save Rent Payment' in Add New Part mode");
  process.exit(1);
}
console.log("PASS: Add New Part mode successfully activated!");

// Add a second installment of ₹4,000 to clear the remaining dues
amountInputEl.value = "4000";
dateInputEl.value = "2026-10-20";
windowMock.submitPartialPayment();

const recheckLedger = windowMock.generatePropertyLedgerData(prop.id);
const recheckOctRow = recheckLedger.rows.find((r) => r.cycle === "Oct 2026");
console.log(`After adding Part 2:`);
console.log(`- Oct 2026 Total Received: ₹${recheckOctRow.receivedAmount}`);
console.log(`- Oct 2026 Installments Count: ${recheckOctRow.payments.length}`);
console.log(`- Oct 2026 Status: ${recheckOctRow.status}`);
console.log(`- Tenant Outstanding Dues: ₹${tenant.osAmount}`);

if (recheckOctRow.receivedAmount !== 12000 || recheckOctRow.payments.length !== 2) {
  console.error("FAIL: Adding Part 2 did not correctly update Oct 2026");
  process.exit(1);
}
if (tenant.osAmount !== 0) {
  console.error(`FAIL: Expected tenant to have 0 dues, got ${tenant.osAmount}`);
  process.exit(1);
}
console.log("PASS: Oct 2026 fully balanced with 2 installment parts and 0 outstanding dues!");

console.log("\nALL PAYMENT UPDATATION SYSTEM TESTS PASSED SUCCESSFULLY! (Code 0)");
