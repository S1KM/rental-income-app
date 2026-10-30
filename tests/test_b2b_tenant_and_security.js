const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

console.log("=== B2B TENANT REGISTRATION & AUTH SECURITY TEST SUITE ===");

const htmlPath = path.join(__dirname, "..", "index.html");
const htmlContent = fs.readFileSync(htmlPath, "utf8");

// 1. Verify B2B Business UI Elements in Tenant Master & Link Tenant Modal
assert(htmlContent.includes('id="tmIsB2bCheckbox"'), "Tenant Master form must include #tmIsB2bCheckbox");
assert(htmlContent.includes('id="tmB2bDetailsSection"'), "Tenant Master form must include collapsible #tmB2bDetailsSection");
assert(htmlContent.includes('id="tmBusinessNameInput"'), "Tenant Master form must include #tmBusinessNameInput");
assert(htmlContent.includes('id="tmGstinInput"'), "Tenant Master form must include #tmGstinInput");
assert(htmlContent.includes('id="tmB2bPanInput"'), "Tenant Master form must include #tmB2bPanInput");
assert(htmlContent.includes('id="tmBillingAddressInput"'), "Tenant Master form must include #tmBillingAddressInput");
assert(htmlContent.includes('id="tmCopyPermToBillingBtn"'), "Tenant Master form must include #tmCopyPermToBillingBtn");

assert(htmlContent.includes('id="modalTenantIsB2b"'), "Link Tenant modal must include #modalTenantIsB2b");
assert(htmlContent.includes('id="modalTenantB2bSection"'), "Link Tenant modal must include #modalTenantB2bSection");
assert(htmlContent.includes('id="modalTenantGstin"'), "Link Tenant modal must include #modalTenantGstin");
assert(htmlContent.includes('id="modalTenantB2bPan"'), "Link Tenant modal must include #modalTenantB2bPan");
assert(htmlContent.includes('id="modalTenantBillingAddress"'), "Link Tenant modal must include #modalTenantBillingAddress");

// 2. Verify Security UI Elements in #authModal
assert(htmlContent.includes('id="authSecurityStatusBanner"'), "Auth modal must include #authSecurityStatusBanner");
assert(htmlContent.includes('id="authSecurityRateBadge"'), "Auth modal must include #authSecurityRateBadge");
assert(htmlContent.includes('id="toggleRegPasswordBtn"'), "Register form must include #toggleRegPasswordBtn");
assert(htmlContent.includes('id="authRegPasswordStrengthBar"'), "Register form must include #authRegPasswordStrengthBar");
console.log("PASS 1: All B2B Business & Security DOM elements verified in index.html.");

// 3. Extract and execute script in VM sandbox to test runtime behavior
const scriptMatches = [...htmlContent.matchAll(/<script>([\s\S]*?)<\/script>/gi)];
const mainScript = scriptMatches[scriptMatches.length - 1][1];

const elements = {};
function getEl(id) {
  if (!elements[id]) {
    const classes = new Set();
    if (id === "tmB2bDetailsSection" || id === "modalTenantB2bSection" || id === "authModal") {
      classes.add("hidden");
    }
    elements[id] = {
      id,
      value: "",
      checked: false,
      textContent: "",
      innerHTML: "",
      className: "",
      style: {},
      dataset: {},
      options: [],
      selectedIndex: 0,
      listeners: {},
      classList: {
        add: (...c) => c.forEach((x) => classes.add(x)),
        remove: (...c) => c.forEach((x) => classes.delete(x)),
        contains: (c) => classes.has(c),
        toggle: (c) => {
          if (classes.has(c)) {
            classes.delete(c);
            return false;
          }
          classes.add(c);
          return true;
        }
      },
      addEventListener(evt, fn) {
        this.listeners[evt] = this.listeners[evt] || [];
        this.listeners[evt].push(fn);
      },
      dispatchEvent(evtObj) {
        const list = this.listeners[evtObj.type] || [];
        list.forEach((fn) => fn(evtObj));
      },
      querySelector: () => null,
      querySelectorAll: () => [],
      appendChild: () => { },
      scrollIntoView: () => { },
      focus: () => { },
      reset() {
        // reset mock
      }
    };
  }
  return elements[id];
}

const sandbox = {
  window: null,
  addEventListener: (evt, fn) => {
    if (evt === "DOMContentLoaded") sandbox._domReady = fn;
  },
  document: {
    getElementById: (id) => getEl(id),
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: (tag) => getEl("created_" + tag + "_" + Math.random()),
    addEventListener: (evt, fn) => {
      if (evt === "DOMContentLoaded") sandbox._domReady = fn;
    },
    body: getEl("body")
  },
  localStorage: {
    _store: {},
    getItem(k) { return this._store[k] || null; },
    setItem(k, v) { this._store[k] = String(v); },
    removeItem(k) { delete this._store[k]; }
  },
  navigator: { clipboard: { writeText: async () => { } } },
  location: { origin: "https://rental-income.app", pathname: "/", search: "" },
  URLSearchParams,
  Blob: function () { },
  URL: { createObjectURL: () => "blob:test", revokeObjectURL: () => { } },
  FileReader: function () { },
  confirm: () => true,
  prompt: () => "0",
  alert: () => { },
  setTimeout: (fn) => { fn(); return 1; },
  clearTimeout: () => { },
  setInterval: () => 1,
  clearInterval: () => { },
  console
};
sandbox.window = sandbox;

vm.createContext(sandbox);
vm.runInContext(mainScript, sandbox);
if (sandbox._domReady) sandbox._domReady();

// 4. Test GSTIN formatting, validation & B2B section toggling
assert.strictEqual(sandbox.formatGstinString("07aabcu9603r1zm"), "07AABCU9603R1ZM");
assert.strictEqual(sandbox.isValidGstin("07AABCU9603R1ZM"), true);
assert.strictEqual(sandbox.isValidGstin("SHORT"), false);

sandbox.toggleTmB2bSection(true);
assert.strictEqual(getEl("tmIsB2bCheckbox").checked, true);
assert.strictEqual(getEl("tmB2bDetailsSection").classList.contains("hidden"), false);

sandbox.toggleTmB2bSection(false);
assert.strictEqual(getEl("tmIsB2bCheckbox").checked, false);
assert.strictEqual(getEl("tmB2bDetailsSection").classList.contains("hidden"), true);
console.log("PASS 2: B2B toggle & GSTIN formatting/validation work accurately.");

// 5. Test GSTIN auto-extracting PAN (chars 3-12) on input
sandbox.toggleTmB2bSection(true);
const gstinEl = getEl("tmGstinInput");
gstinEl.value = "07aabcu9603r1zm";
gstinEl.dispatchEvent({ type: "input", target: gstinEl });

assert.strictEqual(gstinEl.value, "07AABCU9603R1ZM", "GSTIN should auto-uppercase");
assert.strictEqual(getEl("tmB2bPanInput").value, "AABCU9603R", "Business PAN should be auto-extracted from GSTIN chars 3-12");
assert.strictEqual(getEl("tmPanInput").value, "AABCU9603R", "Main KYC PAN should also sync with extracted Business PAN");
console.log("PASS 3: Live GSTIN input auto-extracts 10-char PAN and syncs with KYC PAN.");

// 6. Test B2B Tenant Registration via #addTenantMasterForm
getEl("tmNameInput").value = "Vikram Malhotra";
getEl("tmMobileInput").value = "9811223344";
getEl("tmEmailInput").value = "vikram@apextech.in";
getEl("tmUnitSelect").value = "Unassigned";
getEl("tmRentInput").value = "45000";
getEl("tmIsB2bCheckbox").checked = true;
getEl("tmBusinessNameInput").value = "Apex Tech Solutions Pvt Ltd";
getEl("tmGstinInput").value = "07AABCU9603R1ZM";
getEl("tmB2bPanInput").value = "AABCU9603R";
getEl("tmBillingAddressInput").value = "Plot 42, Okhla Industrial Estate Phase III, New Delhi - 110020";

const tmForm = getEl("addTenantMasterForm");
tmForm.dispatchEvent({ type: "submit", preventDefault: () => { } });

const b2bTenant = sandbox.state.tenants.find((t) => t.name === "Vikram Malhotra");
assert(b2bTenant, "B2B Tenant should be saved in state.tenants");
assert.strictEqual(b2bTenant.isB2B, true);
assert.strictEqual(b2bTenant.businessName, "Apex Tech Solutions Pvt Ltd");
assert.strictEqual(b2bTenant.gstin, "07AABCU9603R1ZM");
assert.strictEqual(b2bTenant.pan, "AABCU9603R");
assert.strictEqual(b2bTenant.billingAddress, "Plot 42, Okhla Industrial Estate Phase III, New Delhi - 110020");
console.log("PASS 4: B2B Tenant registration persists isB2B, businessName, gstin, pan, and billingAddress.");

// 7. Test loadTenantIntoForm & GST Invoice integration for B2B Tenant
sandbox.loadTenantIntoForm(b2bTenant.id);
assert.strictEqual(getEl("tmIsB2bCheckbox").checked, true);
assert.strictEqual(getEl("tmBusinessNameInput").value, "Apex Tech Solutions Pvt Ltd");
assert.strictEqual(getEl("tmGstinInput").value, "07AABCU9603R1ZM");
assert.strictEqual(getEl("tmBillingAddressInput").value, "Plot 42, Okhla Industrial Estate Phase III, New Delhi - 110020");

const inv = sandbox.generateGstInvoiceForTenant(b2bTenant.id, "Oct 2026");
assert(inv, "GST Invoice should be generated for B2B tenant");
assert.strictEqual(inv.isB2B, true);
assert.strictEqual(inv.tenantGstin, "07AABCU9603R1ZM");
assert.strictEqual(inv.tenantPan, "AABCU9603R");
assert.strictEqual(inv.billingAddress, "Plot 42, Okhla Industrial Estate Phase III, New Delhi - 110020");

sandbox.openGstInvoiceModal(inv.id);
assert(getEl("invRecipientName").textContent.includes("Apex Tech Solutions Pvt Ltd"));
assert(getEl("invRecipientAddress").textContent.includes("Plot 42, Okhla Industrial Estate Phase III"));
assert(getEl("invRecipientGstin").textContent.includes("07AABCU9603R1ZM"));
console.log("PASS 5: GST Tax Invoice populates B2B Business Name, GSTIN, PAN, and Billing Address.");

// 8. Test Auth Security Functions (Salted Hashing, Verification & Password Strength)
const hashed = sandbox.hashPasswordSync("MySecurePass#2026", "user@example.com");
assert(hashed.startsWith("sh2$user@example.com$"), "Hash must include version prefix and salt");
assert.strictEqual(sandbox.verifyPasswordSync("MySecurePass#2026", hashed, "user@example.com"), true);
assert.strictEqual(sandbox.verifyPasswordSync("WrongPassword", hashed, "user@example.com"), false);
assert.strictEqual(sandbox.verifyPasswordSync("password123", "password123", "abcltd9925@gmail.com"), true, "Legacy plaintext password must remain backward compatible");

const strengthWeak = sandbox.evaluatePasswordStrength("123");
const strengthStrong = sandbox.evaluatePasswordStrength("RentMaster@2026#Secure");
assert(strengthStrong.score >= 80, "Complex password should score >= 80");
assert(strengthWeak.score < 25, "Short password should score < 25");
console.log("PASS 6: Auth Security salted password hashing, verification & strength meter work accurately.");

console.log("\n🎉 ALL B2B TENANT & SECURITY TESTS PASSED!");
