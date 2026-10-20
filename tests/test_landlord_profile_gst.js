// tests/test_landlord_profile_gst.js
// Automated verification test suite for Landlord Profile & GST Invoicing Dynamic Configuration

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log("=== Testing Landlord Profile & GST Invoicing Studio ===");

const htmlContent = fs.readFileSync('index.html', 'utf8');

// 1. Verify all required DOM element IDs exist in index.html
const requiredIds = [
  "landlordProfileModal",
  "closeLandlordProfileModalBtn",
  "landlordProfileWelcomeBanner",
  "landlordProfileFeedback",
  "landlordProfileForm",
  "landlordProfileName",
  "landlordProfilePan",
  "landlordProfileEmail",
  "landlordProfilePhone",
  "landlordProfileAddress",
  "landlordProfileAccountHolder",
  "landlordProfileBankName",
  "landlordProfileAccountNumber",
  "landlordProfileIfscCode",
  "landlordProfileUpiId",
  "landlordProfileGstToggle",
  "landlordProfileGstActiveBadge",
  "landlordProfileGstDisabledNote",
  "landlordProfileGstFields",
  "landlordProfileGstin",
  "landlordProfileTradeName",
  "landlordProfileState",
  "landlordProfileSacCode",
  "landlordProfileGstRate",
  "landlordProfileRcm",
  "landlordProfileSignatory",
  "landlordProfileTerms",
  "cancelLandlordProfileBtn",
  "saveLandlordProfileBtn"
];

requiredIds.forEach(id => {
  assert(htmlContent.includes(`id="${id}"`), `Missing required DOM ID: ${id}`);
});
console.log(`✓ All ${requiredIds.length} required Landlord Profile & GST DOM element IDs verified in index.html!`);

// 2. Setup mock environment for DOM and VM testing
const storage = {};
const mockLocalStorage = {
  getItem: (k) => (k in storage ? storage[k] : null),
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; }
};

const elements = {};
function createMockEl(id) {
  return {
    id,
    value: '',
    checked: false,
    className: '',
    textContent: '',
    innerHTML: '',
    style: {},
    dataset: {},
    children: [],
    appendChild: () => {},
    focus: () => {},
    classList: {
      _classes: new Set(),
      add: function(...cls) { cls.forEach(c => this._classes.add(c)); },
      remove: function(...cls) { cls.forEach(c => this._classes.delete(c)); },
      contains: function(c) { return this._classes.has(c); }
    },
    addEventListener: () => {},
    setAttribute: () => {},
    getAttribute: () => null,
    querySelector: () => null,
    querySelectorAll: () => []
  };
}

const mockDoc = {
  getElementById: (id) => {
    if (!elements[id]) elements[id] = createMockEl(id);
    return elements[id];
  },
  createElement: (tag) => createMockEl('el_' + tag),
  addEventListener: () => {}
};

const mockToast = {
  success: (msg) => console.log("Toast success:", msg),
  error: (msg) => console.log("Toast error:", msg),
  info: (msg) => console.log("Toast info:", msg),
  warning: (msg) => console.log("Toast warning:", msg)
};

let domLoadedCb = null;
const sandbox = {
  window: {},
  addEventListener: (evt, cb) => {
    if (evt === 'DOMContentLoaded') domLoadedCb = cb;
  },
  document: mockDoc,
  localStorage: mockLocalStorage,
  toast: mockToast,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval
};
sandbox.window = sandbox;

const scriptStart = htmlContent.indexOf('<script>');
const scriptEnd = htmlContent.indexOf('</script>', scriptStart);
const jsCode = htmlContent.slice(scriptStart + 8, scriptEnd);

vm.createContext(sandbox);
vm.runInContext(jsCode, sandbox);

if (domLoadedCb) {
  domLoadedCb();
}

// 3. Test openLandlordProfileModal(true) for after-login view
console.log("\n--- Testing openLandlordProfileModal(afterLogin = true) ---");
sandbox.openLandlordProfileModal(true);

const modalEl = mockDoc.getElementById("landlordProfileModal");
const bannerEl = mockDoc.getElementById("landlordProfileWelcomeBanner");
assert(!modalEl.classList.contains("hidden"), "landlordProfileModal should not have 'hidden' class when opened");
assert(!bannerEl.classList.contains("hidden"), "landlordProfileWelcomeBanner should not have 'hidden' class after login");
console.log("✓ Landlord profile modal opened with after-login welcome banner visible!");

// 4. Test Dynamic GST Invoicing Tick Box behavior
console.log("\n--- Testing Dynamic GST Invoicing Toggle ---");
const gstFields = mockDoc.getElementById("landlordProfileGstFields");
const disabledNote = mockDoc.getElementById("landlordProfileGstDisabledNote");

// Test Unticking GST
sandbox.toggleLandlordGstFields(false);
assert(gstFields.classList.contains("hidden"), "GST fields must be hidden when GST toggle is unticked");
assert(!disabledNote.classList.contains("hidden"), "Disabled note must be visible when GST toggle is unticked");
console.log("✓ When GST toggle is UNTICKED: additional GST fields hidden, informative non-GST note shown!");

// Test Ticking GST
sandbox.toggleLandlordGstFields(true);
assert(!gstFields.classList.contains("hidden"), "GST fields must be revealed when GST toggle is ticked");
assert(disabledNote.classList.contains("hidden"), "Disabled note must be hidden when GST toggle is ticked");
console.log("✓ When GST toggle is TICKED: additional GST fields revealed!");

// 5. Test Profile Validation and Saving
console.log("\n--- Testing Landlord Profile Validation & Save ---");
mockDoc.getElementById("landlordProfileName").value = "Virender Sehwag";
mockDoc.getElementById("landlordProfilePan").value = "ABCPS5678Z";
mockDoc.getElementById("landlordProfileEmail").value = "virender.estates@gmail.com";
mockDoc.getElementById("landlordProfilePhone").value = "+91 99999 88888";
mockDoc.getElementById("landlordProfileAddress").value = "Flat 12, Golf Course Road, Gurugram, Haryana";
mockDoc.getElementById("landlordProfileBankName").value = "ICICI Bank";
mockDoc.getElementById("landlordProfileAccountNumber").value = "001105001234";
mockDoc.getElementById("landlordProfileIfscCode").value = "ICIC0000011";
mockDoc.getElementById("landlordProfileUpiId").value = "virender@icici";

// Ticked GST Invoicing
mockDoc.getElementById("landlordProfileGstToggle").checked = true;
mockDoc.getElementById("landlordProfileGstin").value = "06AAAAA0000A1Z5";
mockDoc.getElementById("landlordProfileTradeName").value = "Sehwag Real Estate & Rentals";
mockDoc.getElementById("landlordProfileState").value = "06 - Haryana";
mockDoc.getElementById("landlordProfileSacCode").value = "997212";
mockDoc.getElementById("landlordProfileGstRate").value = "18";
mockDoc.getElementById("landlordProfileRcm").value = "No";
mockDoc.getElementById("landlordProfileSignatory").value = "Virender Sehwag (Authorized Signatory)";
mockDoc.getElementById("landlordProfileTerms").value = "Rent due on 1st of every month.";

sandbox.saveLandlordProfile();

assert.strictEqual(sandbox.state.landlord.name, "Virender Sehwag");
assert.strictEqual(sandbox.state.landlord.pan, "ABCPS5678Z");
assert.strictEqual(sandbox.state.landlord.email, "virender.estates@gmail.com");
assert.strictEqual(sandbox.state.landlord.gstin, "06AAAAA0000A1Z5");
assert.strictEqual(sandbox.state.landlord.tradeName, "Sehwag Real Estate & Rentals");
assert.strictEqual(sandbox.state.landlord.gstEnabled, true);

// Verify persistence in localStorage
const savedProfileRaw = sandbox.localStorage.getItem("rpm_landlord_profile_v1");
assert(savedProfileRaw !== null, "Profile must be saved in localStorage under rpm_landlord_profile_v1");
const savedObj = JSON.parse(savedProfileRaw);
assert.strictEqual(savedObj.name, "Virender Sehwag");
assert.strictEqual(savedObj.gstin, "06AAAAA0000A1Z5");
console.log("✓ Profile & GST settings successfully committed to state and localStorage!");

// 6. Test GST Invoice generation using updated Landlord Profile
console.log("\n--- Testing GST Invoice Generation with Updated Landlord Profile ---");
sandbox.state.tenants = [{ id: "t1", name: "Rahul Dravid", unit: "Unit 301", rent: 30000 }];
const invoice = sandbox.generateGstInvoiceForTenant("t1", "Nov 2026");
assert(invoice !== null, "Invoice should be generated");
assert(invoice.invoiceNo.startsWith("GST/"), "Invoice should start with GST/ when GST is enabled");
assert.strictEqual(invoice.sacCode, "997212");
assert.strictEqual(invoice.taxableRent, 30000);
assert.strictEqual(invoice.cgstAmount, 2700); // 9% of 30,000
assert.strictEqual(invoice.sgstAmount, 2700); // 9% of 30,000
assert.strictEqual(invoice.totalAmount, 35400); // 30,000 + 5,400
console.log("✓ GST Tax Invoice properly generated using landlord GST settings (₹30,000 + ₹5,400 GST = ₹35,400)!");

console.log("\n=======================================================");
console.log("🎉 ALL LANDLORD PROFILE & GST INVOICING TESTS PASSED 100%!");
console.log("=======================================================\n");
