// tests/test_police_verification.js
// Comprehensive verification test suite for Statewise Tenant Police Verification Studio
// Covers:
// 1. Verification of all DOM element IDs and markup components
// 2. State templates configuration (Delhi, Maharashtra, UP, Haryana, Karnataka, WB, TN, National)
// 3. Smart state detection from property address
// 4. Tab switching logic for "police"
// 5. Auto-population from Property Master and Tenant Master
// 6. Tenant Master card action button [👮 Police Form]
// 7. Live Document Preview generation with Official Police Header, Photo box, Particulars, Referees, and Counterfoil

const fs = require('fs');
const assert = require('assert');

console.log("=== Testing Statewise Tenant Police Verification Studio ===");

const htmlContent = fs.readFileSync('index.html', 'utf8');

// 1. Verify required DOM element IDs exist in index.html
const requiredIds = [
  "tabBtnPolice",
  "tabViewPolice",
  "policePrintBtn",
  "policePreviewPrintBtn",
  "policeDownloadHtmlBtn",
  "policeCopyTextBtn",
  "policeResetBtn",
  "policeStateSelect",
  "policePropertySelect",
  "policeTenantSelect",
  "policeStationName",
  "policeDistrict",
  "policeTokenNo",
  "policeOwnerName",
  "policeOwnerFather",
  "policeOwnerPhone",
  "policeOwnerEmail",
  "policeOwnerAddress",
  "policeRentedAddress",
  "policePhotoBoxPreview",
  "policePhotoInput",
  "policePhotoClearBtn",
  "policeTenantName",
  "policeTenantFather",
  "policeTenantDob",
  "policeTenantGender",
  "policeTenantPhone",
  "policeTenantAltPhone",
  "policeTenantEmail",
  "policeTenantOccupation",
  "policeTenantWorkAddress",
  "policeTenantPan",
  "policeTenantAadhaar",
  "policeTenantOtherId",
  "policeTenantPermAddress",
  "policeTenantPrevAddress",
  "policeTenantRent",
  "policeTenantDeposit",
  "policeTenantStartDate",
  "policeOccupantsCount",
  "policeOccupantsDetails",
  "policeDomesticHelp",
  "policeRef1Name",
  "policeRef1Phone",
  "policeRef1Address",
  "policeRef2Name",
  "policeRef2Phone",
  "policeRef2Address",
  "policePlace",
  "policeDate",
  "policeStateBadge",
  "policePrintableArea"
];

let missing = 0;
requiredIds.forEach((id) => {
  if (!htmlContent.includes(`id="${id}"`)) {
    console.error(`❌ Missing DOM element ID: "${id}"`);
    missing++;
  } else {
    // console.log(`✓ Found ID: ${id}`);
  }
});

assert.strictEqual(missing, 0, `All ${requiredIds.length} required DOM IDs must be present in index.html`);
console.log(`✓ All ${requiredIds.length} required DOM elements verified in index.html!`);

// 2. Verify @media print rules
assert.ok(htmlContent.includes("body.print-police #policePrintableArea"), "Must include print-police print CSS");
console.log("✓ Verified @media print styles for official police document!");

// 3. Verify Action button in Tenant Master card markup
assert.ok(htmlContent.includes('data-action="tm-police"'), "Tenant Master must have data-action='tm-police' button");
assert.ok(htmlContent.includes('action === "tm-police"'), "Tenant Master click handler must process 'tm-police'");
console.log("✓ Verified 1-click [👮 Police Form] action on Tenant Master cards!");

// 4. Verify Official State Police Portals in UI
const expectedPortals = [
  "https://delhipolice.gov.in",
  "https://pcs.mumbaipolice.gov.in",
  "https://uppolice.gov.in",
  "https://haryanapolice.gov.in",
  "https://ksp.karnataka.gov.in",
  "https://wbpolice.gov.in",
  "https://eservices.tnpolice.gov.in",
  "https://digitalpolice.gov.in"
];

expectedPortals.forEach(portal => {
  assert.ok(htmlContent.includes(portal), `Must contain official police portal link: ${portal}`);
});
console.log(`✓ All ${expectedPortals.length} official state police portal links verified!`);

// 5. Test State Templates & Helper Logic in VM
const needle = '<script>\n    (function () {';
const startIdx = htmlContent.indexOf(needle);
const endIdx = htmlContent.lastIndexOf('</script>');
const jsCode = htmlContent.substring(startIdx + 8, endIdx);

// Build minimal DOM sandbox
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
    querySelector: function(sel) { return createEl(); },
    querySelectorAll: function(sel) { return []; },
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
    classList: {
      add: () => {},
      remove: () => {},
      contains: () => false
    },
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
  open: () => {},
  Blob: function(parts, opts) { return { parts, opts }; },
  URL: { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} }
};

const localStorageMock = {
  store: {},
  getItem: function(k) { return this.store[k] || null; },
  setItem: function(k, v) { this.store[k] = String(v); }
};

const sandbox = {
  document: documentMock,
  window: windowMock,
  localStorage: localStorageMock,
  console: console,
  navigator: { clipboard: { writeText: () => Promise.resolve() } },
  FileReader: function() {
    return {
      readAsDataURL: function() {
        if (this.onload) this.onload({ target: { result: "data:image/jpeg;base64,mockphoto" } });
      }
    };
  },
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  alert: () => {}
};

const vm = require('vm');
vm.createContext(sandbox);

// Execute script
vm.runInContext(jsCode, sandbox);
if (domLoadedCb) domLoadedCb();

// 6. Test state templates in JS context
const stateTemplates = windowMock.POLICE_STATE_TEMPLATES;
assert.ok(stateTemplates, "POLICE_STATE_TEMPLATES must be defined");
const expectedStates = ["delhi", "maharashtra", "up", "haryana", "karnataka", "wb", "tn", "national"];
expectedStates.forEach((st) => {
  assert.ok(stateTemplates[st], `Template for state "${st}" must exist`);
  assert.ok(stateTemplates[st].policeTitle, `State "${st}" must have policeTitle`);
  assert.ok(stateTemplates[st].formTitle, `State "${st}" must have formTitle`);
  assert.ok(stateTemplates[st].statutoryOrder, `State "${st}" must have statutoryOrder`);
  assert.ok(stateTemplates[st].portalUrl, `State "${st}" must have portalUrl`);
});
console.log(`✓ Verified all ${expectedStates.length} State Police Templates and Legal Statutory Directives!`);

// 7. Test Smart State Detection
const detectFn = windowMock.detectStateFromAddress;
assert.strictEqual(detectFn("B-402, Royal Palms, Malad West, Mumbai, Maharashtra - 400064"), "maharashtra");
assert.strictEqual(detectFn("Flat 101, Golf Links, New Delhi - 110003"), "delhi");
assert.strictEqual(detectFn("Sector 62, Noida, Gautam Buddha Nagar, Uttar Pradesh - 201301"), "up");
assert.strictEqual(detectFn("Cyber City, DLF Phase 2, Gurugram, Haryana - 122002"), "haryana");
assert.strictEqual(detectFn("Indiranagar, Bengaluru, Karnataka - 560038"), "karnataka");
assert.strictEqual(detectFn("Salt Lake Sector V, Kolkata, West Bengal - 700091"), "wb");
assert.strictEqual(detectFn("Anna Nagar, Chennai, Tamil Nadu - 600040"), "tn");
console.log("✓ Smart Address State Detection accurately resolves state jurisdictions!");

// 8. Test Tab Switching
windowMock.switchTab("police");
const policeView = sandbox.document.getElementById("tabViewPolice");
assert.ok(!policeView.classList.contains("hidden"), "#tabViewPolice must NOT have hidden class when active");
console.log("✓ switchTab('police') successfully reveals the Police Verification Studio!");

// 9. Test Auto-Population from Property & Tenant
if (windowMock.state && windowMock.state.properties.length > 0) {
  const testProp = windowMock.state.properties[0];
  windowMock.populatePoliceFormFromProperty(testProp.id);
  const rentedAddr = sandbox.document.getElementById("policeRentedAddress").value;
  assert.ok(rentedAddr.includes(testProp.name), "Rented address must contain property name");
  console.log(`✓ populatePoliceFormFromProperty auto-filled unit address: "${testProp.name}"`);
}

if (windowMock.state && windowMock.state.tenants.length > 0) {
  const testTenant = windowMock.state.tenants[0];
  windowMock.populatePoliceFormFromTenant(testTenant.id);
  const tenantNameVal = sandbox.document.getElementById("policeTenantName").value;
  assert.strictEqual(tenantNameVal, testTenant.name, "Tenant name must match test tenant name");
  console.log(`✓ populatePoliceFormFromTenant auto-filled tenant name: "${testTenant.name}"`);
}

// 10. Test Document Preview Generation
windowMock.updateLivePoliceFormPreview();
const previewContent = sandbox.document.getElementById("policePrintableArea").innerHTML;
assert.ok(previewContent.includes("POLICE"), "Preview must include Police Header");
assert.ok(previewContent.includes("Part I — Particulars of Landlord"), "Preview must include Landlord Part I");
assert.ok(previewContent.includes("Part II — Particulars of Tenant"), "Preview must include Tenant Part II");
assert.ok(previewContent.includes("Part III — Particulars of Family Members"), "Preview must include Family Part III");
assert.ok(previewContent.includes("Part IV — References of Two Local Respectable Citizens"), "Preview must include Local References Part IV");
assert.ok(previewContent.includes("Statutory Declaration by Landlord"), "Preview must include Statutory Declaration");
assert.ok(previewContent.includes("POLICE STATION ACKNOWLEDGMENT RECEIPT"), "Preview must include Official Counterfoil Receipt Slip");
console.log("✓ Live Legal Preview renders authentic official police performa with statutory notices and counterfoil!");

console.log("\n====================================================================");
console.log("🎉 ALL POLICE VERIFICATION STUDIO TESTS PASSED 100%!");
console.log("====================================================================\n");
