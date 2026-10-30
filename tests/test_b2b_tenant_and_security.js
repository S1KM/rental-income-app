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
assert(htmlContent.includes('id="tmB2bIncrementPeriodSelect"'), "Tenant Master form must include #tmB2bIncrementPeriodSelect");
assert(htmlContent.includes('value="Every Year"'), "Increment period must include 'Every Year' option");
assert(htmlContent.includes('value="After 3 Years"'), "Increment period must include 'After 3 Years' option");
assert(htmlContent.includes('id="tmB2bIncrementPctInput"'), "Tenant Master form must include #tmB2bIncrementPctInput");
assert(htmlContent.includes('id="tmB2bLockInSelect"'), "Tenant Master form must include #tmB2bLockInSelect");
assert(htmlContent.includes('id="tmB2bLeasePeriodSelect"'), "Tenant Master form must include #tmB2bLeasePeriodSelect");
assert(htmlContent.includes('id="tmB2bIncrementClauseInput"'), "Tenant Master form must include #tmB2bIncrementClauseInput");

assert(htmlContent.includes('id="modalTenantIsB2b"'), "Link Tenant modal must include #modalTenantIsB2b");
assert(htmlContent.includes('id="modalTenantB2bSection"'), "Link Tenant modal must include #modalTenantB2bSection");
assert(htmlContent.includes('id="modalTenantGstin"'), "Link Tenant modal must include #modalTenantGstin");
assert(htmlContent.includes('id="modalTenantB2bPan"'), "Link Tenant modal must include #modalTenantB2bPan");
assert(htmlContent.includes('id="modalTenantBillingAddress"'), "Link Tenant modal must include #modalTenantBillingAddress");
assert(htmlContent.includes('id="modalTenantB2bIncrementPeriod"'), "Link Tenant modal must include #modalTenantB2bIncrementPeriod");
assert(htmlContent.includes('id="modalTenantB2bIncrementPct"'), "Link Tenant modal must include #modalTenantB2bIncrementPct");
assert(htmlContent.includes('id="modalTenantB2bLockIn"'), "Link Tenant modal must include #modalTenantB2bLockIn");
assert(htmlContent.includes('id="modalTenantB2bLeasePeriod"'), "Link Tenant modal must include #modalTenantB2bLeasePeriod");
assert(htmlContent.includes('id="modalTenantB2bIncrementClause"'), "Link Tenant modal must include #modalTenantB2bIncrementClause");

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

// 6. Test B2B Rental Increment Clause Builder & Lease End Date Calculator
const clause3Yr = sandbox.buildB2bIncrementClauseText({
  incrementPeriod: "After 3 Years",
  incrementPct: 15,
  lockInPeriod: "2 Years (24 Months)",
  leasePeriod: "5 Years (60 Months)",
  baseRent: 45000
});
assert(clause3Yr.includes("15%"), "Clause must include 15% increase");
assert(clause3Yr.includes("After 3 Years"), "Clause must reflect 'After 3 Years' period");
assert(clause3Yr.includes("Lock-in Period of 2 Years (24 Months)"), "Clause must include Lock-in Period");
assert(clause3Yr.includes("5 Years (60 Months)"), "Clause must include Lease Period");

const calcEnd = sandbox.calculateLeaseEndDateFromPeriod("2026-01-01", "3 Years (36 Months)");
assert.strictEqual(calcEnd, "2028-12-31", "3 Years (36 Months) from 2026-01-01 should end on 2028-12-31");

// 7. Test B2B Tenant Registration via #addTenantMasterForm (including Increment, Lock-in & Lease Period)
getEl("tmNameInput").value = "Vikram Malhotra";
getEl("tmMobileInput").value = "9811223344";
getEl("tmEmailInput").value = "vikram@apextech.in";
getEl("tmUnitSelect").value = "Unassigned";
getEl("tmRentInput").value = "45000";
getEl("tmStartDateInput").value = "2026-04-01";
getEl("tmIsB2bCheckbox").checked = true;
getEl("tmBusinessNameInput").value = "Apex Tech Solutions Pvt Ltd";
getEl("tmGstinInput").value = "07AABCU9603R1ZM";
getEl("tmB2bPanInput").value = "AABCU9603R";
getEl("tmBillingAddressInput").value = "Plot 42, Okhla Industrial Estate Phase III, New Delhi - 110020";
getEl("tmB2bIncrementPeriodSelect").value = "After 3 Years";
getEl("tmB2bIncrementPctInput").value = "15";
getEl("tmB2bLockInSelect").value = "2 Years (24 Months)";
getEl("tmB2bLeasePeriodSelect").value = "5 Years (60 Months)";
getEl("tmB2bIncrementClauseInput").value = "";

const tmForm = getEl("addTenantMasterForm");
tmForm.dispatchEvent({ type: "submit", preventDefault: () => { } });

const b2bTenant = sandbox.state.tenants.find((t) => t.name === "Vikram Malhotra");
assert(b2bTenant, "B2B Tenant should be saved in state.tenants");
assert.strictEqual(b2bTenant.isB2B, true);
assert.strictEqual(b2bTenant.businessName, "Apex Tech Solutions Pvt Ltd");
assert.strictEqual(b2bTenant.gstin, "07AABCU9603R1ZM");
assert.strictEqual(b2bTenant.pan, "AABCU9603R");
assert.strictEqual(b2bTenant.billingAddress, "Plot 42, Okhla Industrial Estate Phase III, New Delhi - 110020");
assert.strictEqual(b2bTenant.incrementPeriod, "After 3 Years");
assert.strictEqual(b2bTenant.incrementPct, 15);
assert.strictEqual(b2bTenant.lockInPeriod, "2 Years (24 Months)");
assert.strictEqual(b2bTenant.leasePeriod, "5 Years (60 Months)");
assert(b2bTenant.b2bIncrementClause.includes("15%"), "Saved B2B tenant must store generated b2bIncrementClause");
assert(Array.isArray(b2bTenant.customClauses) && b2bTenant.customClauses[0].includes("RENTAL INCREMENT CLAUSE"), "B2B Increment Clause should auto-sync to tenant.customClauses");
console.log("PASS 4: B2B Tenant registration persists GSTIN, PAN, Billing Address, Increment Period, % of Increase, Lock-in, Lease Period & Increment Clause.");

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

// 9. Test Property Master: Super Area, Carpet Area, Common Area & Type of Building ("Mall", "High Street", "Residential", "Other")
assert(htmlContent.includes('id="pmBuildingTypeInput"'), "Property Master must include #pmBuildingTypeInput");
assert(htmlContent.includes('value="Mall"'), "Type of Building must include 'Mall'");
assert(htmlContent.includes('value="High Street"'), "Type of Building must include 'High Street'");
assert(htmlContent.includes('value="Residential"'), "Type of Building must include 'Residential'");
assert(htmlContent.includes('value="Other"'), "Type of Building must include 'Other'");
assert(htmlContent.includes('id="pmSuperAreaInput"'), "Property Master must include #pmSuperAreaInput");
assert(htmlContent.includes('id="pmCarpetAreaInput"'), "Property Master must include #pmCarpetAreaInput");
assert(htmlContent.includes('id="pmCommonAreaInput"'), "Property Master must include #pmCommonAreaInput");

getEl("pmBuildingInput").value = "Select Citywalk";
getEl("pmUnitInput").value = "Shop G-14";
getEl("pmTypeInput").value = "Commercial Shop / Office";
getEl("pmBuildingTypeInput").value = "Mall";
getEl("pmAddressInput").value = "A-3, Saket District Centre, New Delhi - 110017";
getEl("pmSuperAreaInput").value = "2000";
getEl("pmCarpetAreaInput").value = "1400";
sandbox.recalculatePropertyAreas("super_or_carpet");
assert.strictEqual(String(getEl("pmCommonAreaInput").value), "600", "Common Area should auto-calculate as Super Area (2000) - Carpet Area (1400) = 600 Sq.Ft");

const pmForm = getEl("addPropertyMasterForm");
pmForm.dispatchEvent({ type: "submit", preventDefault: () => { } });

const mallProp = sandbox.state.properties.find((p) => p.name.includes("Shop G-14"));
assert(mallProp, "Registered Mall property should exist in state.properties");
assert.strictEqual(mallProp.buildingType, "Mall");
assert.strictEqual(mallProp.superArea, 2000);
assert.strictEqual(mallProp.carpetArea, 1400);
assert.strictEqual(mallProp.commonArea, 600);
console.log("PASS 7: Property Master Super Area, Carpet Area, Common Area & Type of Building (Mall/High Street/Residential/Other) verified.");

// 10. Test Automatic Rental Increment & Escalated GST Invoice Generation
// A) "After 3 Years" (+15% on Base ₹45,000 starting 2026-04-01 -> Apr 2029 = ₹51,750)
const invInitial = sandbox.generateGstInvoiceForTenant(b2bTenant.id, "Oct 2026");
assert.strictEqual(invInitial.taxableRent, 45000, "Before 3 years (Oct 2026), taxable rent should remain base ₹45,000");
assert.strictEqual(invInitial.isEscalated, false);

const invAfter3Yrs = sandbox.generateGstInvoiceForTenant(b2bTenant.id, "Apr 2029");
assert.strictEqual(invAfter3Yrs.baseRent, 45000);
assert.strictEqual(invAfter3Yrs.taxableRent, 51750, "After 3 years (Apr 2029), +15% increment must automatically increase rent from ₹45,000 to ₹51,750");
assert.strictEqual(invAfter3Yrs.isEscalated, true);
assert.strictEqual(invAfter3Yrs.completedIntervals, 1);
assert.strictEqual(invAfter3Yrs.escalationAmount, 6750);
assert.strictEqual(invAfter3Yrs.cgstAmount, 4657.5);
assert.strictEqual(invAfter3Yrs.sgstAmount, 4657.5);
assert.strictEqual(invAfter3Yrs.totalAmount, 61065, "Total GST invoice after 15% escalation must be ₹51,750 + 18% GST = ₹61,065");

sandbox.openGstInvoiceModal(invAfter3Yrs.id);
assert.strictEqual(getEl("invEscalationBanner").classList.contains("hidden"), false, "Escalation banner should be visible in GST Invoice Modal");
assert(getEl("invEscalationSummaryText").textContent.includes("51,750"), "Escalation banner should display escalated rent ₹51,750");

// B) "Every Year" (+10% on Base ₹50,000 starting 2025-10-01 -> Oct 2026 = ₹55,000, Oct 2027 = ₹60,500)
sandbox.state.tenants.unshift({
  id: "ten_annual_inc",
  name: "Rohan Mehta",
  businessName: "Mehta Retail Pvt Ltd",
  isB2B: true,
  gstin: "07AAACM1234F1Z5",
  pan: "AAACM1234F",
  billingAddress: "Shop G-14, Select Citywalk, Saket, New Delhi",
  unit: mallProp.name,
  baseRent: 50000,
  rent: 50000,
  incrementPeriod: "Every Year",
  incrementPct: 10,
  startDate: "2025-10-01",
  endDate: "2028-09-30",
  status: "Active"
});

sandbox.applyAutomaticRentalIncrements("Oct 2026");
const annualTenant = sandbox.state.tenants.find((t) => t.id === "ten_annual_inc");
assert.strictEqual(annualTenant.rent, 55000, "applyAutomaticRentalIncrements('Oct 2026') must auto-increase rent from ₹50,000 to ₹55,000 (+10% Every Year)");
assert.strictEqual(annualTenant.baseRent, 50000, "Original baseRent (₹50,000) must be preserved");

const invYr1 = sandbox.generateGstInvoiceForTenant("ten_annual_inc", "Oct 2026");
assert.strictEqual(invYr1.taxableRent, 55000, "Oct 2026 invoice must bill escalated ₹55,000");
assert.strictEqual(invYr1.totalAmount, 64900, "Oct 2026 total with 18% GST must be ₹64,900");

const invYr2 = sandbox.generateGstInvoiceForTenant("ten_annual_inc", "Oct 2027");
assert.strictEqual(invYr2.taxableRent, 60500, "Oct 2027 (Year 2) invoice must compound +10% to ₹60,500");
assert.strictEqual(invYr2.completedIntervals, 2);
console.log("PASS 8: Automatic Rental Increment ('Every Year' & 'After 3 Years') and escalated GST Tax Invoice generation verified.");

console.log("\n🎉 ALL B2B TENANT & SECURITY TESTS PASSED!");
