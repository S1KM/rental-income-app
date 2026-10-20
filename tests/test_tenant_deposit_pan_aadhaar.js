// tests/test_tenant_deposit_pan_aadhaar.js
// Automated verification suite for Tenant Master:
// 1. Security Deposit Months & Auto-calculation of Deposit Amount
// 2. Separate PAN & Aadhaar input boxes & formatting
// 3. Document attachment options for PAN & Aadhaar (PDF / Image)
// 4. Document Viewer Modal previewing attached records
// 5. Registration and Directory listing with deposit terms, separate PAN/Aadhaar badges & [📎 View Doc]

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log("=== Testing Tenant Master: Deposit Auto-Calc, Separate PAN & Aadhaar, and Document Attachments ===");

const htmlContent = fs.readFileSync('index.html', 'utf8');

// 1. Verify required DOM element IDs are in HTML
const requiredElements = [
  "addTenantMasterForm",
  "tmNameInput",
  "tmMobileInput",
  "tmEmailInput",
  "tmUnitSelect",
  "tmRentInput",
  "tmDepositMonthsInput",
  "tmDepositAmountInput",
  "tmDepositAutoBadge",
  "tmOsInput",
  "tmPanInput",
  "tmPanStatusBadge",
  "tmPanDocInput",
  "tmPanDocEmptyState",
  "tmPanDocUploadBtn",
  "tmPanDocChip",
  "tmPanDocName",
  "tmPanDocSize",
  "tmPanDocPreviewBtn",
  "tmPanDocRemoveBtn",
  "tmAadhaarInput",
  "tmAadhaarStatusBadge",
  "tmAadhaarDocInput",
  "tmAadhaarDocEmptyState",
  "tmAadhaarDocUploadBtn",
  "tmAadhaarDocChip",
  "tmAadhaarDocName",
  "tmAadhaarDocSize",
  "tmAadhaarDocPreviewBtn",
  "tmAadhaarDocRemoveBtn",
  "tenantMasterListContainer",
  "docPreviewModal",
  "docPreviewTitle",
  "docPreviewSubtitle",
  "docPreviewContent",
  "docPreviewDownloadBtn",
  "closeDocPreviewModalBtn",
  "closeDocPreviewModalFooterBtn",
  "modalTenantDepositMonths",
  "modalTenantDepositAmount",
  "modalTenantPan",
  "modalTenantPanDocInput",
  "modalTenantPanDocEmpty",
  "modalTenantPanDocBtn",
  "modalTenantPanDocChip",
  "modalTenantPanDocName",
  "modalTenantAadhaar",
  "modalTenantAadhaarDocInput",
  "modalTenantAadhaarDocEmpty",
  "modalTenantAadhaarDocBtn",
  "modalTenantAadhaarDocChip",
  "modalTenantAadhaarDocName"
];

let missing = 0;
requiredElements.forEach(id => {
  if (!htmlContent.includes(`id="${id}"`)) {
    console.error(`MISSING ELEMENT ID: ${id}`);
    missing++;
  }
});

if (missing > 0) {
  console.error(`❌ Failed: ${missing} required Tenant Master IDs missing!`);
  process.exit(1);
}
console.log(`✓ All ${requiredElements.length} Tenant Master & Document Attachment IDs verified in HTML!`);

// Mock DOM elements
const elements = {};
function createMockElement(id, tag = 'div') {
  const el = {
    id,
    tagName: tag.toUpperCase(),
    value: '',
    checked: false,
    className: '',
    textContent: '',
    _innerHTML: '',
    set innerHTML(val) {
      this._innerHTML = val;
      if (val === '') {
        this.children = [];
      }
    },
    get innerHTML() {
      return this._innerHTML || '';
    },
    style: {},
    dataset: {},
    children: [],
    listeners: {},
    _classes: '',
    classList: {
      add: function(...classes) {
        const set = new Set((el._classes || '').split(' ').filter(Boolean));
        classes.forEach(c => set.add(c));
        el._classes = Array.from(set).join(' ');
      },
      remove: function(...classes) {
        const set = new Set((el._classes || '').split(' ').filter(Boolean));
        classes.forEach(c => set.delete(c));
        el._classes = Array.from(set).join(' ');
      },
      contains: function(c) {
        return (el._classes || '').split(' ').includes(c);
      }
    },
    addEventListener: function(evt, handler) {
      if (!this.listeners[evt]) this.listeners[evt] = [];
      this.listeners[evt].push(handler);
    },
    dispatchEvent: function(event) {
      const handlers = this.listeners[event.type] || [];
      handlers.forEach(h => h(event));
    },
    setAttribute: function(attr, val) {
      this[attr] = val;
    },
    getAttribute: function(attr) {
      return this[attr] || null;
    },
    closest: function(sel) {
      if (sel === '[data-action]' && this['data-action']) return this;
      if (sel === '[data-tm-filter]' && this['data-tm-filter']) return this;
      return null;
    },
    appendChild: function(c) {
      this.children.push(c);
    },
    querySelector: function(sel) {
      return createMockElement('sub_' + Math.random());
    },
    querySelectorAll: function(sel) {
      return [];
    },
    reset: function() {
      this.value = '';
    },
    click: function() {
      this.dispatchEvent({ type: 'click', target: this, preventDefault: () => {} });
    }
  };
  return el;
}

const mockDoc = {
  getElementById: (id) => {
    if (!elements[id]) {
      elements[id] = createMockElement(id);
    }
    return elements[id];
  },
  querySelectorAll: (selector) => {
    if (selector === '.deposit-quick-btn') {
      return [1, 2, 3].map(m => {
        const b = createMockElement(`btn_${m}mo`, 'button');
        b.setAttribute('data-months', m);
        b.className = 'deposit-quick-btn';
        return b;
      });
    }
    return [];
  },
  createElement: (tag) => createMockElement(`dyn_${Date.now()}_${Math.random()}`, tag),
  body: createMockElement('body')
};

const storage = {};
const mockLocalStorage = {
  getItem: (k) => (k in storage ? storage[k] : null),
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

let domLoadedCb = null;
const mockWindow = {
  localStorage: mockLocalStorage,
  document: mockDoc,
  addEventListener: (evt, cb) => {
    if (evt === 'DOMContentLoaded') domLoadedCb = cb;
  },
  console: console,
  location: { origin: 'http://localhost:3000' },
  Event: function(type) { this.type = type; this.preventDefault = () => {}; }
};

// Extract scripts
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scriptCode = '';
while ((match = scriptRegex.exec(htmlContent)) !== null) {
  if (match[1].length > 1000) {
    scriptCode = match[1];
    break;
  }
}

if (!scriptCode) {
  console.error("Could not find main application script!");
  process.exit(1);
}

const context = vm.createContext({
  window: mockWindow,
  document: mockDoc,
  localStorage: mockLocalStorage,
  console: console,
  setTimeout: (cb) => { cb(); },
  clearTimeout: () => {},
  setInterval: () => {},
  clearInterval: () => {},
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
  URL: { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} },
  Event: mockWindow.Event
});

// Run script in context
const script = new vm.Script(scriptCode);
script.runInContext(context);
if (domLoadedCb) {
  domLoadedCb();
}
console.log("✓ Application script initialized in sandbox!");

// 2. Test auto-calculation helpers
console.log("\n--- Testing recalculateTmDeposit ---");
context.document.getElementById("tmRentInput").value = "25000";
context.document.getElementById("tmDepositMonthsInput").value = "2";
mockWindow.recalculateTmDeposit("months");

const amtCalculated = Number(context.document.getElementById("tmDepositAmountInput").value);
assert.strictEqual(amtCalculated, 50000, "Deposit should be 25,000 * 2 = 50,000");
console.log(`✓ Rent ₹25,000 * 2 Months = Deposit: ₹${amtCalculated}`);

// Recalculate with 3 months
context.document.getElementById("tmDepositMonthsInput").value = "3";
mockWindow.recalculateTmDeposit("months");
assert.strictEqual(Number(context.document.getElementById("tmDepositAmountInput").value), 75000, "Deposit should be 75,000");
console.log(`✓ Rent ₹25,000 * 3 Months = Deposit: ₹${context.document.getElementById("tmDepositAmountInput").value}`);

// Direct amount change recalculates months
context.document.getElementById("tmDepositAmountInput").value = "100000";
mockWindow.recalculateTmDeposit("amount");
assert.strictEqual(Number(context.document.getElementById("tmDepositMonthsInput").value), 4, "Months should be 4");
console.log(`✓ Amount ₹100,000 / ₹25,000 = Months: ${context.document.getElementById("tmDepositMonthsInput").value} Mo`);

// 3. Test PAN & Aadhaar formatting functions
console.log("\n--- Testing formatPanString & formatAadhaarString ---");
const formattedPan = mockWindow.formatPanString("abcps1234d-extra");
assert.strictEqual(formattedPan, "ABCPS1234D", "PAN must be uppercase, alphanumeric, 10 characters max");
console.log(`✓ formatPanString('abcps1234d-extra') -> '${formattedPan}'`);

const formattedAadhaar = mockWindow.formatAadhaarString("234567890123999");
assert.strictEqual(formattedAadhaar, "2345 6789 0123", "Aadhaar must be grouped in 4-digit chunks, 12 digits max");
console.log(`✓ formatAadhaarString('234567890123999') -> '${formattedAadhaar}'`);

// 4. Test Document preview modal
console.log("\n--- Testing openDocPreviewModal & closeDocPreviewModal ---");
const mockDocObj = {
  name: "pan_card_test.pdf",
  size: 204800,
  type: "application/pdf",
  dataUrl: "data:application/pdf;base64,JVBERi0xLjQK..."
};

mockWindow.openDocPreviewModal("PAN Card Verification", "Vikram Malhotra", mockDocObj);
const modal = context.document.getElementById("docPreviewModal");
assert(!modal.classList.contains("hidden"), "Modal should be visible (not hidden)");
assert.strictEqual(context.document.getElementById("docPreviewTitle").textContent, "PAN Card Verification");
assert.strictEqual(context.document.getElementById("docPreviewDownloadBtn").download, "pan_card_test.pdf");
console.log("✓ Document preview modal opened with title, metadata, and download link");

mockWindow.closeDocPreviewModal();
assert(modal.classList.contains("hidden"), "Modal should be closed");
console.log("✓ Document preview modal closed successfully");

// 5. Test Registering Tenant with Deposit & Separate PAN & Aadhaar
console.log("\n--- Testing Tenant Master Registration Flow ---");
mockWindow.state.tenants = [];
mockWindow.state.properties = [
  { id: "prop_1", name: "Flat 101, Mayur Vihar", rent: 25000, deposit: 50000 }
];

context.document.getElementById("tmNameInput").value = "Rohit Verma";
context.document.getElementById("tmMobileInput").value = "9811223344";
context.document.getElementById("tmEmailInput").value = "rohit@verma.test";
context.document.getElementById("tmUnitSelect").value = "Flat 101, Mayur Vihar";
context.document.getElementById("tmRentInput").value = "28000";
context.document.getElementById("tmDepositMonthsInput").value = "2.5";
context.document.getElementById("tmDepositAmountInput").value = "70000";
context.document.getElementById("tmPanInput").value = "ABCDE9999F";
context.document.getElementById("tmAadhaarInput").value = "4455 6677 8899";
mockWindow.setCurrentTmPanDoc({
  name: "pan_rohit.pdf",
  size: 150000,
  type: "application/pdf",
  dataUrl: "data:application/pdf;base64,MOCK_PAN"
});
mockWindow.setCurrentTmAadhaarDoc({
  name: "aadhaar_rohit.jpg",
  size: 220000,
  type: "image/jpeg",
  dataUrl: "data:image/jpeg;base64,MOCK_AADHAAR"
});

const tmForm = context.document.getElementById("addTenantMasterForm");
tmForm.dispatchEvent(new context.Event("submit"));

assert.strictEqual(mockWindow.state.tenants.length, 1, "One tenant should be registered in state.tenants");
const registered = mockWindow.state.tenants[0];
assert.strictEqual(registered.name, "Rohit Verma");
assert.strictEqual(registered.rent, 28000);
assert.strictEqual(registered.depositMonths, 2.5);
assert.strictEqual(registered.deposit, 70000);
assert.strictEqual(registered.pan, "ABCDE9999F");
assert.strictEqual(registered.aadhaar, "4455 6677 8899");
assert(registered.panDoc && registered.panDoc.name === "pan_rohit.pdf", "PAN Doc must be preserved");
assert(registered.aadhaarDoc && registered.aadhaarDoc.name === "aadhaar_rohit.jpg", "Aadhaar Doc must be preserved");
console.log("✓ Tenant registered in state.tenants with full Deposit, PAN, Aadhaar & Docs");

// Check property sync
const matchedProp = mockWindow.state.properties.find(p => p.id === "prop_1");
assert.strictEqual(matchedProp.rent, 28000, "Property rent should sync with tenant rent");
assert.strictEqual(matchedProp.deposit, 70000, "Property deposit should sync with tenant deposit");
console.log(`✓ Property rent (₹${matchedProp.rent}) & deposit (₹${matchedProp.deposit}) synchronized!`);

// 6. Test Directory Rendering
console.log("\n--- Testing Directory Rendering of Deposit & Badges ---");
mockWindow.renderTenantMaster();
const listContainer = context.document.getElementById("tenantMasterListContainer");
const renderedCards = listContainer.children;
assert(renderedCards.length > 0, "Directory cards should be rendered");

const cardHtml = renderedCards[0].innerHTML;
assert(cardHtml.includes("Rohit Verma"), "Card must include tenant name");
assert(cardHtml.includes("Security Deposit:"), "Card must include Security Deposit label");
assert(cardHtml.includes("70,000"), "Card must display deposit amount");
assert(cardHtml.includes("2.5 Mo"), "Card must display deposit months");
assert(cardHtml.includes("PAN:") && cardHtml.includes("ABCDE9999F"), "Card must display separate PAN box");
assert(cardHtml.includes("Aadhaar:") && cardHtml.includes("4455 6677 8899"), "Card must display separate Aadhaar box");
assert(cardHtml.includes("tm-view-doc"), "Card must contain [📎 View Doc] button");
assert(cardHtml.includes("tm-edit-tenant"), "Card must contain [✏️ Edit] button");

console.log("✓ Directory card renders complete Security Deposit (₹70,000 / 2.5 Mo), separate PAN & Aadhaar badges with document viewer triggers!");

console.log("\n========================================================");
console.log("🎉 ALL TENANT MASTER TESTS PASSED WITH 100% SUCCESS!");
console.log("========================================================");
process.exit(0);
