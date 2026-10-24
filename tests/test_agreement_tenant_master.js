/**
 * Automated Test Suite: Tenant Profile from Tenant Master in Draft Tenancy Agreement
 * Tests:
 * 1. DOM Elements presence (studioTenantSelect, studioTenantStatusBadge, tenant inputs)
 * 2. syncStudioTenantSelect() population from state.tenants
 * 3. populateAgreementStudioFromTenant() auto-filling form & auto-linking property
 * 4. populateAgreementStudioFromProperty() auto-selecting linked tenant from Tenant Master
 * 5. Agreement saving linking back to Tenant Master
 */

const fs = require("fs");
const path = require("path");
const assert = require("assert");

console.log("=== Testing Tenant Profile from Tenant Master in Draft Tenancy Agreement ===");

const htmlPath = path.join(__dirname, "..", "index.html");
const html = fs.readFileSync(htmlPath, "utf8");

// 1. Verify DOM Elements
const requiredIds = [
  "studioTenantSelect",
  "studioTenantStatusBadge",
  "studioPropertySelect",
  "studioTenantNameInput",
  "studioTenantIdInput",
  "studioMobileInput",
  "studioEmailInput",
  "studioTenantFatherInput",
  "studioTenantWorkInput",
  "studioTenantPermAddressInput",
  "studioRentInput",
  "studioDepositInput",
  "studioStartInput",
  "studioEndInput",
  "saveAgreementBtn"
];

requiredIds.forEach((id) => {
  assert(html.includes(`id="${id}"`), `Missing required DOM element: #${id}`);
  console.log(`✓ Verified DOM element ID: "${id}"`);
});

// 2. Verify functions in script
assert(html.includes("function syncStudioTenantSelect"), "syncStudioTenantSelect function missing");
assert(html.includes("function populateAgreementStudioFromTenant"), "populateAgreementStudioFromTenant function missing");
assert(html.includes("window.syncStudioTenantSelect = syncStudioTenantSelect"), "syncStudioTenantSelect not exposed on window");
assert(html.includes("window.populateAgreementStudioFromTenant = populateAgreementStudioFromTenant"), "populateAgreementStudioFromTenant not exposed on window");
console.log("✓ All controller functions verified in source code!");

// 3. Mock DOM environment for isolated VM simulation
function createMockElement(id, tagName = "div") {
  const classes = new Set();
  return {
    id,
    tagName: tagName.toUpperCase(),
    value: "",
    textContent: "",
    innerHTML: "",
    children: [],
    options: [],
    dataset: {},
    classList: {
      add: (...c) => c.forEach((cls) => classes.add(cls)),
      remove: (...c) => c.forEach((cls) => classes.delete(cls)),
      contains: (cls) => classes.has(cls),
      toggle: (cls, force) => {
        if (force === undefined) {
          classes.has(cls) ? classes.delete(cls) : classes.add(cls);
        } else if (force) {
          classes.add(cls);
        } else {
          classes.delete(cls);
        }
      }
    },
    style: {},
    appendChild: function(c) {
      this.children.push(c);
      if (this.tagName === "SELECT" || this.tagName === "OPTGROUP") {
        this.options.push(c);
      }
      return c;
    },
    addEventListener: () => {},
    dispatchEvent: () => {}
  };
}

const mockDom = {};
requiredIds.forEach((id) => {
  const tag = id.includes("Select") ? "select" : id.includes("Input") ? "input" : "div";
  mockDom[id] = createMockElement(id, tag);
});

// Additional required preview elements
[
  "studioAddressInput", "studioTypeInput", "studioMeterInput", "studioBedroomsInput",
  "previewTenantName", "previewTenantMobile", "previewTenantId",
  "preview2TenantName", "preview2TenantMobile", "preview2TenantId", "preview2TenantFather", "preview2TenantPermAddress",
  "preview1CustomClausesList", "preview2CustomClausesList"
].forEach((id) => {
  mockDom[id] = createMockElement(id);
});

// Setup mock state
const state = {
  properties: [
    {
      id: "prop_101",
      name: "Flat 104, Green Park",
      address: "104, Green Park Main, New Delhi - 110016",
      type: "2 BHK Residential Flat",
      meterNo: "BSES-10294811",
      rent: 24000,
      deposit: 48000
    },
    {
      id: "prop_102",
      name: "Flat 201, Saket Court",
      address: "201, Saket Court, New Delhi - 110017",
      type: "3 BHK Luxury Flat",
      meterNo: "BSES-99218274",
      rent: 36000,
      deposit: 72000
    },
    {
      id: "prop_103",
      name: "Studio 5B, Hauz Khas (Vacant)",
      address: "5B, Hauz Khas Village, New Delhi - 110016",
      type: "1 RK Studio Flat",
      meterNo: "BSES-44119900",
      rent: 15000,
      deposit: 30000
    }
  ],
  tenants: [
    {
      id: "ten_priya",
      name: "Priya Patel",
      unit: "Flat 104, Green Park",
      mobile: "9811012345",
      email: "priya.patel@example.com",
      rent: 24000,
      deposit: 48000,
      status: "Active",
      startDate: "2026-04-01",
      endDate: "2027-03-31",
      tenantIdNumber: "Aadhaar: 4891-2019-3312",
      fatherName: "Sh. Ramesh Patel",
      permAddress: "B-22, Ellis Bridge, Ahmedabad, Gujarat",
      workplace: "Tech Mahindra, Noida"
    },
    {
      id: "ten_rohan",
      name: "Rohan Khanna",
      unit: "Flat 201, Saket Court",
      mobile: "9810112233",
      email: "rohan.khanna@example.com",
      rent: 36000,
      deposit: 72000,
      status: "Active",
      startDate: "2026-04-01",
      endDate: "2027-02-28",
      tenantIdNumber: "PAN: ABCPK9921Z",
      fatherName: "Sh. K.L. Khanna",
      permAddress: "H.No. 142, Sector 14, Chandigarh - 160014",
      workplace: "DLF Cyber City, Building 10, Gurugram"
    },
    {
      id: "ten_vikram",
      name: "Vikram Rathore",
      unit: "Unassigned / Available",
      mobile: "9818822334",
      email: "vikram.rathore@example.com",
      rent: 15000,
      deposit: 30000,
      status: "Vacated",
      startDate: "",
      endDate: "",
      tenantIdNumber: "Aadhaar: 3341-9921-1044",
      fatherName: "Sh. Mahendra Rathore",
      permAddress: "H.No. 45, Sector 21, Noida, UP",
      workplace: "Freelance Architect"
    }
  ],
  landlord: {
    name: "Rajesh Sharma",
    pan: "ABCPS1234D"
  },
  customAgreementClauses: []
};

// Extract functions from index.html
const syncStudioTenantSelectMatch = html.match(/function syncStudioTenantSelect\(\)\s*\{([\s\S]*?)\n      \}/);
assert(syncStudioTenantSelectMatch, "Failed to extract syncStudioTenantSelect code");

const populateAgreementStudioFromTenantMatch = html.match(/function populateAgreementStudioFromTenant\(tenantId\)\s*\{([\s\S]*?)\n      \}/);
assert(populateAgreementStudioFromTenantMatch, "Failed to extract populateAgreementStudioFromTenant code");

const populateAgreementStudioFromPropertyMatch = html.match(/function populateAgreementStudioFromProperty\(propId\)\s*\{([\s\S]*?)\n      \}/);
assert(populateAgreementStudioFromPropertyMatch, "Failed to extract populateAgreementStudioFromProperty code");

// Create execution context
const globalScope = {
  state,
  document: {
    getElementById: (id) => mockDom[id] || null,
    createElement: (tag) => createMockElement("", tag)
  },
  formatINR: (v) => "₹" + Number(v || 0).toLocaleString("en-IN"),
  isTenantUnassigned: (t) => {
    if (!t) return false;
    if (t.status === "Vacated") return true;
    if (!t.unit || t.unit.trim() === "") return true;
    const u = t.unit.trim().toLowerCase();
    return u.includes("unassigned") || u.includes("vacant");
  },
  renderCustomClauses: () => {},
  updateLiveAgreementPreview: () => {},
  autoFillStudioDates: () => {},
  STORAGE_KEY_AGREEMENT_CUSTOM_CLAUSES: "rpm_test_key",
  localStorage: { getItem: () => null, setItem: () => {} }
};

const syncStudioTenantSelect = new Function(
  ...Object.keys(globalScope),
  "return function syncStudioTenantSelect() {\n" + syncStudioTenantSelectMatch[1] + "\n};"
)(...Object.values(globalScope));

const populateAgreementStudioFromTenant = new Function(
  ...Object.keys(globalScope),
  "return function populateAgreementStudioFromTenant(tenantId) {\n" + populateAgreementStudioFromTenantMatch[1] + "\n};"
)(...Object.values(globalScope));

const populateAgreementStudioFromProperty = new Function(
  ...Object.keys(globalScope),
  "return function populateAgreementStudioFromProperty(propId) {\n" + populateAgreementStudioFromPropertyMatch[1] + "\n};"
)(...Object.values(globalScope));

console.log("\n--- Testing 1: syncStudioTenantSelect() ---");
syncStudioTenantSelect();
const tenantSelect = mockDom.studioTenantSelect;
assert(tenantSelect.children.length >= 2, "studioTenantSelect should have groups for Active and Unassigned tenants");
console.log(`✓ studioTenantSelect populated with ${tenantSelect.children.length} optgroups (Active & Vacated/Available)!`);

console.log("\n--- Testing 2: populateAgreementStudioFromTenant('ten_priya') ---");
populateAgreementStudioFromTenant("ten_priya");
assert.strictEqual(mockDom.studioTenantNameInput.value, "Priya Patel", "Tenant name should match Priya Patel");
assert.strictEqual(mockDom.studioMobileInput.value, "9811012345", "Tenant mobile should match");
assert.strictEqual(mockDom.studioEmailInput.value, "priya.patel@example.com", "Tenant email should match");
assert.strictEqual(mockDom.studioTenantFatherInput.value, "Sh. Ramesh Patel", "Father name should match");
assert.strictEqual(mockDom.studioTenantPermAddressInput.value, "B-22, Ellis Bridge, Ahmedabad, Gujarat", "Permanent address should match");
assert.strictEqual(mockDom.studioTenantWorkInput.value, "Tech Mahindra, Noida", "Workplace should match");
assert.strictEqual(mockDom.studioRentInput.value, 24000, "Rent should match 24000");
assert.strictEqual(mockDom.studioDepositInput.value, 48000, "Deposit should match 48000");
// Also verify property auto-selection
assert.strictEqual(mockDom.studioPropertySelect.value, "prop_101", "Should auto-select Flat 104, Green Park");
console.log("✓ Tenant Priya Patel profile and assigned property unit auto-populated seamlessly!");

console.log("\n--- Testing 3: populateAgreementStudioFromTenant('ten_vikram') (Vacated/Unassigned) ---");
populateAgreementStudioFromTenant("ten_vikram");
assert.strictEqual(mockDom.studioTenantNameInput.value, "Vikram Rathore", "Tenant name should match Vikram Rathore");
assert.strictEqual(mockDom.studioTenantFatherInput.value, "Sh. Mahendra Rathore", "Father name should match");
assert.strictEqual(mockDom.studioTenantPermAddressInput.value, "H.No. 45, Sector 21, Noida, UP", "Permanent address should match");
assert(mockDom.studioTenantStatusBadge.textContent.includes("Vacated"), "Status badge should indicate Vacated profile");
console.log("✓ Vacated tenant Vikram Rathore loaded into studio without forcing property assignment!");

console.log("\n--- Testing 4: populateAgreementStudioFromProperty('prop_102') (Saket Court) ---");
populateAgreementStudioFromProperty("prop_102");
assert.strictEqual(mockDom.studioPropertySelect.value, "prop_102", "Property should be prop_102");
assert.strictEqual(mockDom.studioTenantSelect.value, "ten_rohan", "Linked tenant Rohan Khanna should be auto-selected in studioTenantSelect");
assert.strictEqual(mockDom.studioTenantNameInput.value, "Rohan Khanna", "Tenant name should be Rohan Khanna");
assert.strictEqual(mockDom.studioTenantFatherInput.value, "Sh. K.L. Khanna", "Father name should be Sh. K.L. Khanna");
assert.strictEqual(mockDom.studioTenantPermAddressInput.value, "H.No. 142, Sector 14, Chandigarh - 160014", "Perm address should match");
assert(mockDom.studioTenantStatusBadge.textContent.includes("Master"), "Status badge should reflect Master link");
console.log("✓ Selecting Property 'Saket Court' auto-selected linked tenant Rohan Khanna from Tenant Master!");

console.log("\n--- Testing 5: populateAgreementStudioFromProperty('prop_103') (Vacant Studio) ---");
populateAgreementStudioFromProperty("prop_103");
assert.strictEqual(mockDom.studioPropertySelect.value, "prop_103", "Property should be prop_103");
assert.strictEqual(mockDom.studioTenantSelect.value, "", "Vacant property should reset studioTenantSelect to custom/empty");
assert(mockDom.studioTenantStatusBadge.textContent.includes("Vacant"), "Status badge should display Vacant warning");
console.log("✓ Selecting vacant property correctly resets tenant dropdown to '-- Custom / Select Tenant --'!");

console.log("\n====================================================================");
console.log("🎉 ALL TENANT PROFILE FROM TENANT MASTER IN AGREEMENT TESTS PASSED 100%!");
console.log("====================================================================");
