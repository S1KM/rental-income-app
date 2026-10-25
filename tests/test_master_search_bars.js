// tests/test_master_search_bars.js
// Automated verification suite for Search Bars in Property Master & Tenant Master

const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

console.log("=== Testing Search Bars in Property Master & Tenant Master ===");

const html = fs.readFileSync('index.html', 'utf8');

// -------------------------------------------------------------
// Step 1: Verify DOM Elements Exist in HTML
// -------------------------------------------------------------
console.log("\n--- Step 1: Checking Required DOM Elements in HTML ---");
const requiredElementIds = [
  "pmSearchInput",
  "pmSearchClearBtn",
  "pmDirectoryCountBadge",
  "propertyMasterListContainer",
  "tmSearchInput",
  "tmSearchClearBtn",
  "tmDirectoryCountBadge",
  "tenantMasterListContainer"
];

requiredElementIds.forEach(id => {
  assert.ok(html.includes(`id="${id}"`), `Missing DOM element id="${id}" in HTML`);
  console.log(`  ✓ #${id} exists in HTML`);
});

// -------------------------------------------------------------
// Step 2: Test Search Filtering Logic in Isolated Sandbox
// -------------------------------------------------------------
console.log("\n--- Step 2: Testing Search Filtering Logic in Sandbox ---");

// Mock standard browser environment
class MockClassList extends Set {
  add(cls) { super.add(cls); return this; }
  remove(cls) { super.delete(cls); return this; }
  contains(cls) { return super.has(cls); }
  toggle(cls, force) {
    if (force === undefined) {
      if (this.has(cls)) { this.delete(cls); return false; }
      else { this.add(cls); return true; }
    }
    if (force) this.add(cls);
    else this.delete(cls);
    return force;
  }
}

class MockElement {
  constructor(id, tagName = "div") {
    this.id = id;
    this.tagName = tagName.toUpperCase();
    this.classList = new MockClassList();
    this.children = [];
    this.innerHTML = "";
    this.textContent = "";
    this.value = "";
    this.dataset = {};
    this.listeners = {};
  }
  addEventListener(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }
  dispatchEvent(event) {
    if (this.listeners[event.type]) {
      this.listeners[event.type].forEach(fn => fn(event));
    }
  }
  appendChild(child) {
    this.children.push(child);
  }
  querySelectorAll() {
    return [];
  }
}

const domElements = {
  propertyMasterListContainer: new MockElement("propertyMasterListContainer"),
  pmDirectoryCountBadge: new MockElement("pmDirectoryCountBadge"),
  pmLocationFilterGroup: new MockElement("pmLocationFilterGroup"),
  pmSearchInput: new MockElement("pmSearchInput", "input"),
  pmSearchClearBtn: new MockElement("pmSearchClearBtn", "button"),
  tenantMasterListContainer: new MockElement("tenantMasterListContainer"),
  tmDirectoryCountBadge: new MockElement("tmDirectoryCountBadge"),
  tmFilterBtnGroup: new MockElement("tmFilterBtnGroup"),
  tmAllCount: new MockElement("tmAllCount"),
  tmActiveCount: new MockElement("tmActiveCount"),
  tmVacatedCount: new MockElement("tmVacatedCount"),
  tmSearchInput: new MockElement("tmSearchInput", "input"),
  tmSearchClearBtn: new MockElement("tmSearchClearBtn", "button")
};

const mockDocument = {
  getElementById: (id) => domElements[id] || new MockElement(id),
  createElement: (tag) => new MockElement(null, tag),
  querySelector: () => null,
  querySelectorAll: () => []
};

// Setup test state with diverse sample properties and tenants
const testState = {
  properties: [
    { id: "prop_1", name: "Flat 101", building: "Sagarpur", address: "Plot 42, Sagarpur, New Delhi", meterNo: "CA-1001", upic: "UPIC-DEL-101", rent: 15000, deposit: 30000, type: "Residential Flat" },
    { id: "prop_2", name: "Flat 102", building: "Sagarpur", address: "Plot 42, Sagarpur, New Delhi", meterNo: "CA-1002", upic: "UPIC-DEL-102", rent: 16000, deposit: 32000, type: "Residential Flat" },
    { id: "prop_3", name: "Office 301", building: "Saket Court", address: "Commercial Complex, Saket", meterNo: "CA-3001", upic: "UPIC-SKT-301", rent: 45000, deposit: 90000, type: "Commercial Office" }
  ],
  tenants: [
    { id: "ten_1", name: "Manoj Kumar", unit: "Flat 101", mobile: "98100 11111", email: "manoj@test.com", pan: "ABCPS1001D", aadhaar: "2345 6789 0001", status: "Active", rent: 15000 },
    { id: "ten_2", name: "Priya Patel", unit: "Office 301", mobile: "98200 22222", email: "priya@test.com", pan: "BZXPP2002K", aadhaar: "4567 8901 0002", status: "Active", rent: 45000 },
    { id: "ten_3", name: "Vikram Rathore", unit: "Unassigned / Available", mobile: "98300 33333", email: "vikram@test.com", pan: "VKKPR3003R", aadhaar: "8901 2345 0003", status: "Vacated", rent: 18000 }
  ],
  pmLocationFilter: "all",
  pmSearchQuery: "",
  tmActiveFilter: "all",
  tmSearchQuery: "",
  collapsedBuildings: new Set()
};

// Extract renderPropertyMasterDirectory and renderTenantMaster implementations
const escapeHtml = (str) => String(str || "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[m]);

// Function factory
const scriptSandbox = {
  document: mockDocument,
  state: testState,
  escapeHtml: escapeHtml,
  formatINR: (num) => "₹" + Number(num || 0).toLocaleString("en-IN"),
  console: console
};

vm.createContext(scriptSandbox);

// Extract render functions from index.html source
const renderPmCode = html.match(/function renderPropertyMasterDirectory\(\)\s*\{[\s\S]*?\n {6}\}/)[0];
const renderTmCode = html.match(/function renderTenantMaster\(\)\s*\{[\s\S]*?\n {6}\}/)[0];

vm.runInContext(renderPmCode, scriptSandbox);
vm.runInContext(renderTmCode, scriptSandbox);

// -------------------------------------------------------------
// Step 3: Test Property Master Search Filtering
// -------------------------------------------------------------
console.log("\n--- Step 3: Testing Property Master Search Filtering ---");

// 3.1 Initial Render without search
scriptSandbox.state.pmSearchQuery = "";
scriptSandbox.renderPropertyMasterDirectory();
assert.ok(domElements.pmDirectoryCountBadge.textContent.includes("2 Locations · 3 Flats Registered"));
console.log("  ✓ Initial Property Master view renders all locations and flats");

// 3.2 Search by Flat Name "Flat 101"
scriptSandbox.state.pmSearchQuery = "101";
scriptSandbox.renderPropertyMasterDirectory();
assert.ok(domElements.pmDirectoryCountBadge.textContent.includes("1 Locations · 1 Matching Flats"));
console.log("  ✓ Search by flat unit ('101') filters down to 1 matching flat");

// 3.3 Search by Building "Saket"
scriptSandbox.state.pmSearchQuery = "saket";
scriptSandbox.renderPropertyMasterDirectory();
assert.ok(domElements.pmDirectoryCountBadge.textContent.includes("1 Locations · 1 Matching Flats"));
console.log("  ✓ Search by building name ('saket') filters down to Saket Court");

// 3.4 Search by Utility CA "CA-1002"
scriptSandbox.state.pmSearchQuery = "CA-1002";
scriptSandbox.renderPropertyMasterDirectory();
assert.ok(domElements.pmDirectoryCountBadge.textContent.includes("1 Locations · 1 Matching Flats"));
console.log("  ✓ Search by Electricity CA ('CA-1002') filters down accurately");

// 3.5 Search by Occupant Tenant Name "Priya"
scriptSandbox.state.pmSearchQuery = "Priya";
scriptSandbox.renderPropertyMasterDirectory();
assert.ok(domElements.pmDirectoryCountBadge.textContent.includes("1 Locations · 1 Matching Flats"));
console.log("  ✓ Search by current occupant name ('Priya') finds linked unit (Office 301)");

// 3.6 Search with No Match
scriptSandbox.state.pmSearchQuery = "nonexistent";
scriptSandbox.renderPropertyMasterDirectory();
assert.ok(domElements.propertyMasterListContainer.innerHTML.includes("No properties found matching"));
assert.ok(domElements.propertyMasterListContainer.innerHTML.includes("pmClearSearchEmptyBtn"));
console.log("  ✓ Non-matching search displays empty state with 'Clear Search' action");

// 3.7 Reset Search
scriptSandbox.state.pmSearchQuery = "";
scriptSandbox.renderPropertyMasterDirectory();
assert.ok(domElements.pmDirectoryCountBadge.textContent.includes("3 Flats Registered"));
console.log("  ✓ Clearing search restores full Property Master inventory");

// -------------------------------------------------------------
// Step 4: Test Tenant Master Search Filtering
// -------------------------------------------------------------
console.log("\n--- Step 4: Testing Tenant Master Search Filtering ---");

// 4.1 Initial Render without search
scriptSandbox.state.tmSearchQuery = "";
scriptSandbox.renderTenantMaster();
assert.ok(domElements.tmDirectoryCountBadge.textContent.includes("3 Tenants Registered"));
console.log("  ✓ Initial Tenant Master view renders all 3 registered tenants");

// 4.2 Search by Tenant Name "Manoj"
scriptSandbox.state.tmSearchQuery = "manoj";
scriptSandbox.renderTenantMaster();
assert.ok(domElements.tmDirectoryCountBadge.textContent.includes("1 Matching Tenants"));
console.log("  ✓ Search by name ('manoj') filters down to 1 matching tenant");

// 4.3 Search by Unit "Office 301"
scriptSandbox.state.tmSearchQuery = "Office 301";
scriptSandbox.renderTenantMaster();
assert.ok(domElements.tmDirectoryCountBadge.textContent.includes("1 Matching Tenants"));
console.log("  ✓ Search by assigned unit ('Office 301') filters down to Priya Patel");

// 4.4 Search by PAN "ABCPS1001D"
scriptSandbox.state.tmSearchQuery = "ABCPS1001D";
scriptSandbox.renderTenantMaster();
assert.ok(domElements.tmDirectoryCountBadge.textContent.includes("1 Matching Tenants"));
console.log("  ✓ Search by PAN ('ABCPS1001D') filters correctly");

// 4.5 Search by Aadhaar with and without spaces "8901 2345" & "89012345"
scriptSandbox.state.tmSearchQuery = "89012345";
scriptSandbox.renderTenantMaster();
assert.ok(domElements.tmDirectoryCountBadge.textContent.includes("1 Matching Tenants"));
console.log("  ✓ Search by unformatted Aadhaar ('89012345') matches formatted UID '8901 2345 0003'");

// 4.6 Search by Phone Number "98300"
scriptSandbox.state.tmSearchQuery = "98300";
scriptSandbox.renderTenantMaster();
assert.ok(domElements.tmDirectoryCountBadge.textContent.includes("1 Matching Tenants"));
console.log("  ✓ Search by mobile number ('98300') matches Vikram Rathore");

// 4.7 Search with No Match
scriptSandbox.state.tmSearchQuery = "nobody";
scriptSandbox.renderTenantMaster();
assert.ok(domElements.tenantMasterListContainer.innerHTML.includes("No tenants found matching"));
assert.ok(domElements.tenantMasterListContainer.innerHTML.includes("tmClearSearchEmptyBtn"));
console.log("  ✓ Non-matching search displays empty state with 'Clear Search' action");

// 4.8 Reset Search
scriptSandbox.state.tmSearchQuery = "";
scriptSandbox.renderTenantMaster();
assert.ok(domElements.tmDirectoryCountBadge.textContent.includes("3 Tenants Registered"));
console.log("  ✓ Clearing search restores complete Tenant Master directory");

console.log("\n=======================================================");
console.log("🎉 ALL PROPERTY MASTER & TENANT MASTER SEARCH TESTS PASSED 100%!");
console.log("=======================================================\n");
