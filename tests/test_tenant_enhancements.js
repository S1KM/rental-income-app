// tests/test_tenant_enhancements.js
// Automated verification suite for Tenant View Ledger, Auto Rent Reminder Notifications, and Landlord View Agreement Editing

const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

console.log("=== Testing Tenant View Ledger, Rent Reminder Auto-Notifications & Landlord Agreement Editing ===");

const htmlContent = fs.readFileSync('index.html', 'utf8');

// 1. Verify all new and existing required DOM elements exist
const requiredDomIds = [
  // Tenant Portal Ledger
  "tpLedgerCard",
  "tpLedgerTotalBilled",
  "tpLedgerTotalPaid",
  "tpLedgerBalanceDue",
  "tpLedgerTableContainer",
  "tpLedgerTableBody",
  "tpLedgerFilterAll",
  "tpLedgerFilterPending",
  "tpOpenFullLedgerBtn",
  // Tenant Portal Auto Rent Reminder & Top Nav
  "tpRentReminderBannerContainer",
  "tpAgreementLandlordEditTopBtn",
  "tpTenantAgreementLink",
  "tpViewAgreementBtn",
  // Agreement Studio Landlord Section & Inputs
  "studioLandlordSection",
  "studioLandlordNameInput",
  "studioLandlordFatherInput",
  "studioLandlordPanInput",
  "studioLandlordPhoneInput",
  "studioLandlordEmailInput",
  "studioLandlordAddressInput",
  "studioLandlordUpiInput",
  "studioOpenFullLandlordProfileBtn"
];

requiredDomIds.forEach((id) => {
  assert.ok(htmlContent.includes(`id="${id}"`), `Missing required element ID in index.html: "${id}"`);
});
console.log(`✓ All ${requiredDomIds.length} required Tenant View Ledger, Reminder & Landlord Studio DOM IDs verified!`);

// 2. Verify new engine functions exist
const requiredFunctions = [
  "renderTenantPortalLedger",
  "renderTenantPortalRentReminder",
  "navigateToLandlordAgreementView",
  "playPaymentReminderChime"
];

requiredFunctions.forEach((fn) => {
  assert.ok(htmlContent.includes(`function ${fn}`), `Missing engine function: "${fn}"`);
});
console.log(`✓ All ${requiredFunctions.length} new engine functions verified in source code!`);

// 3. Test functional behavior in VM Sandbox
console.log("Testing in isolated VM sandbox...");

const mockStorage = {};
const mockElements = new Map();

function createMockEl(id = '', tag = 'div') {
  let innerHtmlVal = '';
  const el = {
    id,
    tagName: tag.toUpperCase(),
    value: '',
    textContent: '',
    href: '',
    src: '',
    classList: {
      _classes: new Set(),
      add: function(...cls) { cls.forEach(c => this._classes.add(c)); },
      remove: function(...cls) { cls.forEach(c => this._classes.delete(c)); },
      contains: function(c) { return this._classes.has(c); },
      toggle: function(c) { if (this.contains(c)) this.remove(c); else this.add(c); }
    },
    style: {},
    children: [],
    appendChild: function(c) { this.children.push(c); return c; },
    setAttribute: function(k, v) { this[k] = v; },
    getAttribute: function(k) { return this[k] || null; },
    addEventListener: function(evt, handler) { this._handler = handler; },
    scrollIntoView: function() {},
    focus: function() {}
  };
  Object.defineProperty(el, 'innerHTML', {
    get() { return innerHtmlVal; },
    set(v) {
      innerHtmlVal = String(v);
      if (v === '' || !v.includes('<tr')) el.children = [];
    }
  });
  return el;
}

const sandbox = {
  console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  scrollTo: () => {},
  navigator: {
    clipboard: {
      writeText: async (t) => { sandbox._clipboard = t; }
    }
  },
  location: {
    origin: 'https://rental-income.app',
    pathname: '/',
    search: '',
    href: 'https://rental-income.app/'
  },
  localStorage: {
    getItem: (k) => mockStorage[k] || null,
    setItem: (k, v) => { mockStorage[k] = String(v); },
    removeItem: (k) => { delete mockStorage[k]; },
    clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
  },
  document: {
    getElementById: (id) => {
      if (!mockElements.has(id)) {
        mockElements.set(id, createMockEl(id));
      }
      return mockElements.get(id);
    },
    querySelectorAll: () => [],
    querySelector: () => createMockEl('header', 'header'),
    createElement: (tag) => createMockEl('', tag),
    body: createMockEl('body', 'body')
  },
  window: {}
};

sandbox.window = sandbox;

// Extract script from index.html
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let mainScript = '';
while ((match = scriptRegex.exec(htmlContent)) !== null) {
  if (match[1].length > 10000) {
    mainScript = match[1];
    break;
  }
}

const ctx = vm.createContext(sandbox);

// Pre-seed minimal globals
vm.runInContext(`
  var STORAGE_KEY_CHATS = "rental_app_chats_v1";
  var STORAGE_KEY_LANDLORD = "rental_app_landlord_profile_v1";
  function escapeHtml(s) { return String(s || ""); }
  function formatINR(n) { return "₹" + Number(n || 0).toLocaleString("en-IN"); }
  var _switchedTab = null;
  function switchTab(t) { _switchedTab = t; }
  var _lastToast = null;
  function showToast(msg, type) { _lastToast = { msg, type }; }
  var _openedReceiptTenantId = null;
  function openRentReceipt(tId) { _openedReceiptTenantId = tId; }
  var _openedPropId = null;
  function populateAgreementStudioFromProperty(propId) { _openedPropId = propId; }
  function generatePropertyLedgerData(propId, tenant) {
    return {
      prop: { id: propId || 'p1', name: 'Flat 101' },
      tenant: tenant || { name: 'Rahul Sharma', rent: 15000, osAmount: 15000 },
      isVacant: false,
      totalBilled: 105000,
      totalReceived: 90000,
      currentBalance: (tenant && tenant.osAmount) || 15000,
      rows: [
        { cycle: 'Apr 2026', dueDate: '05-Apr-2026', dueAmount: 15000, receivedDate: '03-Apr-2026', receivedAmount: 15000, paymentMode: 'UPI (UPI/2604/77102)', status: 'Paid', runningBalance: 0 },
        { cycle: 'May 2026', dueDate: '05-May-2026', dueAmount: 15000, receivedDate: '04-May-2026', receivedAmount: 15000, paymentMode: 'UPI (UPI/2605/88219)', status: 'Paid', runningBalance: 0 },
        { cycle: 'Oct 2026', dueDate: '05-Oct-2026', dueAmount: 15000, receivedDate: 'Unpaid / Pending', receivedAmount: 0, paymentMode: 'Payment Awaited', status: 'Overdue', runningBalance: 15000 }
      ]
    };
  }
  var state = {
    landlord: {
      name: 'Rajesh Sharma',
      pan: 'ABCPS1234D',
      phone: '+91 98110 02233',
      email: 'abcltd9925@gmail.com',
      fatherName: 'Late Sh. O.P. Sharma',
      address: 'A-42, Hauz Khas Enclave, New Delhi - 110016',
      upi: 'rajesh.sharma@upi'
    },
    units: [{ id: 'u1', name: 'Flat 101', rent: 15000, tenant: 'Rahul Sharma' }],
    tenants: [
      { id: 't1', name: 'Rahul Sharma', unitId: 'u1', unit: 'Flat 101', mobile: '9876543210', phone: '9876543210', rent: 15000, deposit: 30000, osAmount: 15000, email: 'rahul@example.com' },
      { id: 't2', name: 'Amit Verma', unitId: 'u2', unit: 'Flat 102', mobile: '9811223344', phone: '9811223344', rent: 18000, deposit: 36000, osAmount: 0, email: 'amit@example.com' }
    ],
    properties: [
      { id: 'p1', name: 'Flat 101', rent: 15000, deposit: 30000 },
      { id: 'p2', name: 'Flat 102', rent: 18000, deposit: 36000 }
    ],
    chats: {}
  };
`, ctx);

// Extract the invite & chat engine including the new enhancements
const startIdx = mainScript.indexOf("function generateTenantPortalUrl");
const endIdx = mainScript.indexOf("// --- INITIAL BOOTSTRAP ---", startIdx);
const engineCode = mainScript.substring(startIdx, endIdx);

vm.runInContext(engineCode, ctx);

// -------------------------------------------------------------
// Test A: Tenant View with Unpaid Rent -> Auto Reminder Notification
// -------------------------------------------------------------
console.log("Testing Rent Reminder Auto-Notification when rent is unpaid...");
vm.runInContext("enterTenantPortalView('t1')", ctx);

const bannerContainer = sandbox.document.getElementById("tpRentReminderBannerContainer");
assert.ok(bannerContainer.innerHTML.includes("tpRentReminderBanner"), "Reminder banner must be injected");
assert.ok(bannerContainer.innerHTML.includes("🔔"), "Reminder banner must have notification bell icon");
assert.ok(bannerContainer.innerHTML.includes("Urgent Payment Reminder") || bannerContainer.innerHTML.includes("Rent Payment Pending"), "Banner must state payment pending");
assert.ok(bannerContainer.innerHTML.includes("₹15,000"), "Banner must display the overdue rent amount");
assert.ok(bannerContainer.innerHTML.includes("tpQuickPayUpiBtn"), "Banner must have Quick Pay UPI button");
assert.ok(bannerContainer.innerHTML.includes("tpNotifyLandlordPaidBtn"), "Banner must have Notify Landlord button");

console.log("✓ Auto Rent Reminder Banner rendered with ₹15,000 overdue alert and 1-click UPI action!");

// Test UPI copy button
const upiBtn = sandbox.document.getElementById("tpQuickPayUpiBtn");
upiBtn.onclick();
// Clipboard write check
assert.strictEqual(sandbox._clipboard, "rajesh.sharma@upi", "UPI button must copy landlord UPI ID to clipboard");
console.log("✓ Quick UPI Pay button successfully copies Landlord UPI ID ('rajesh.sharma@upi')!");

// Test Notify Landlord button pre-filling chat input
const notifyBtn = sandbox.document.getElementById("tpNotifyLandlordPaidBtn");
notifyBtn.onclick();
const chatInput = sandbox.document.getElementById("tenantPortalChatInput");
assert.ok(chatInput.value.includes("Rajesh Sharma"), "Pre-filled chat message must mention landlord name");
assert.ok(chatInput.value.includes("₹15,000"), "Pre-filled chat message must mention amount");
assert.ok(chatInput.value.includes("Flat 101"), "Pre-filled chat message must mention tenant unit");
console.log("✓ 'Notify Landlord / I Paid' button pre-populates chat input with payment confirmation!");

// -------------------------------------------------------------
// Test B: Tenant View with Settled Rent -> Zero Dues Verified Banner
// -------------------------------------------------------------
console.log("Testing Zero-Dues Banner when rent is fully paid...");
vm.runInContext("enterTenantPortalView('t2')", ctx);

assert.ok(bannerContainer.innerHTML.includes("All Rent Dues Cleared"), "Zero-dues banner must indicate cleared dues");
assert.ok(bannerContainer.innerHTML.includes("Balance: ₹0"), "Zero-dues banner must show 0 balance");
assert.ok(bannerContainer.innerHTML.includes("tpBannerViewReceiptBtn"), "Zero-dues banner must have view receipt button");

const receiptBannerBtn = sandbox.document.getElementById("tpBannerViewReceiptBtn");
receiptBannerBtn.onclick();
assert.strictEqual(sandbox._openedReceiptTenantId, "t2", "View receipt button must open receipt for tenant");
console.log("✓ Zero-dues banner rendered with receipt download trigger!");

// -------------------------------------------------------------
// Test C: Tenant View Rent Ledger
// -------------------------------------------------------------
console.log("Testing Tenant View Statement of Accounts & Rent Ledger...");
vm.runInContext("enterTenantPortalView('t1')", ctx);

const totalBilled = sandbox.document.getElementById("tpLedgerTotalBilled").textContent;
const totalPaid = sandbox.document.getElementById("tpLedgerTotalPaid").textContent;
const balanceDue = sandbox.document.getElementById("tpLedgerBalanceDue").textContent;
const ledgerTbody = sandbox.document.getElementById("tpLedgerTableBody");

assert.strictEqual(totalBilled, "₹1,05,000", "Total Billed must be ₹1,05,000");
assert.strictEqual(totalPaid, "₹90,000", "Total Paid must be ₹90,000");
assert.ok(balanceDue.includes("₹15,000"), "Balance Due must show ₹15,000");
assert.ok(ledgerTbody.children.length >= 3, "Ledger table must have rows for rent cycles");
console.log(`✓ Tenant Ledger rendered with Total Billed: ${totalBilled}, Total Paid: ${totalPaid}, Balance Due: ${balanceDue}, and ${ledgerTbody.children.length} cycle rows!`);

// Test Ledger filter toggle
const filterPendingBtn = sandbox.document.getElementById("tpLedgerFilterPending");
const filterAllBtn = sandbox.document.getElementById("tpLedgerFilterAll");
assert.ok(typeof filterPendingBtn.onclick === "function", "Pending filter must have click handler");
assert.ok(typeof filterAllBtn.onclick === "function", "All cycles filter must have click handler");

filterPendingBtn.onclick();
assert.strictEqual(ledgerTbody.children.length, 1, "Unsettled filter must display only overdue/partial cycles");
console.log("✓ Tenant Ledger 'Unsettled Only' filter displays only pending cycles!");

filterAllBtn.onclick();
assert.strictEqual(ledgerTbody.children.length, 3, "All cycles filter must restore all cycle rows");
console.log("✓ Tenant Ledger 'All Cycles' filter restores complete cycle history!");

// -------------------------------------------------------------
// Test D: Click on Agreement -> Switches to Landlord View & Populates Agreement Studio
// -------------------------------------------------------------
console.log("Testing Click on Agreement -> Switches to Landlord View...");
const viewAgreementBtn = sandbox.document.getElementById("tpViewAgreementBtn");
const topAgreementBtn = sandbox.document.getElementById("tpAgreementLandlordEditTopBtn");
const tenantAgreementLink = sandbox.document.getElementById("tpTenantAgreementLink");

assert.ok(typeof viewAgreementBtn.onclick === "function", "tpViewAgreementBtn must have click handler");
assert.ok(typeof topAgreementBtn.onclick === "function", "tpAgreementLandlordEditTopBtn must have click handler");
assert.ok(typeof tenantAgreementLink.onclick === "function", "tpTenantAgreementLink must have click handler");

// Trigger agreement navigation
viewAgreementBtn.onclick();
assert.strictEqual(sandbox._switchedTab, "agreements", "Must switch tab to 'agreements' (Landlord View)");
assert.strictEqual(sandbox._openedPropId, "p1", "Must auto-populate agreement studio with tenant's property unit 'p1'");
console.log("✓ Clicking Agreement successfully switches to Landlord View Agreement Studio and selects tenant property unit!");

// -------------------------------------------------------------
// Test E: Landlord Details Visible & Fully Editable in Agreement Studio
// -------------------------------------------------------------
console.log("Testing Landlord Details viewing and live editing in Agreement Studio...");

// Verify landlord form fields in index.html
const lInputs = [
  "studioLandlordNameInput",
  "studioLandlordFatherInput",
  "studioLandlordPanInput",
  "studioLandlordPhoneInput",
  "studioLandlordEmailInput",
  "studioLandlordAddressInput",
  "studioLandlordUpiInput"
];

lInputs.forEach(inputId => {
  const match = htmlContent.match(new RegExp(`<input[^>]*id="${inputId}"|<textarea[^>]*id="${inputId}"`));
  assert.ok(match, `Landlord field ${inputId} must be present in Agreement Studio form`);
});
console.log("✓ All 7 Landlord editable fields present in Agreement Studio form!");

console.log("\n=======================================================");
console.log("🎉 ALL TENANT VIEW LEDGER, REMINDER & LANDLORD VIEW TESTS PASSED 100%!");
console.log("=======================================================\n");
