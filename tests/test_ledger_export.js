const fs = require('fs');
const assert = require('assert');

console.log('🧪 Starting Ledger Export (Excel & PDF) Test Suite...\n');

const htmlContent = fs.readFileSync('d:\\Rental Income app\\index.html', 'utf8');

// 1. Verify DOM Elements in HTML
console.log('--- Test 1: Checking Required DOM Elements in HTML ---');
const requiredIds = [
  'modalPropLedgerTopExcelBtn',
  'modalPropLedgerTopPrintBtn',
  'modalPropLedgerExcelBtn',
  'modalPropLedgerPrintBtn',
  'tpExportLedgerExcelBtn',
  'tpExportLedgerPdfBtn',
  'modalTrExportExcelBtn',
  'modalTrExportPdfBtn',
  'printableReportSection'
];

requiredIds.forEach(id => {
  const exists = htmlContent.includes(`id="${id}"`);
  assert.strictEqual(exists, true, `Expected element #${id} to exist in index.html`);
  console.log(`  ✓ #${id} exists in HTML`);
});

// 2. Verify Print CSS Rules
console.log('\n--- Test 2: Checking Print CSS Rules for Unclipped Multi-Page Print ---');
assert(htmlContent.includes('body.print-report #printableReportSection'), 'Print styles must target #printableReportSection');
assert(htmlContent.includes('position: static !important'), 'Print styles must use position: static for multi-page flow');
assert(htmlContent.includes('body.print-report #printableReportSection.hidden'), 'Print styles must override .hidden for printableReportSection');
console.log('  ✓ Print media rules correctly configured for multi-page bank-grade statements');

// 3. Execution & Functional Verification of JS Export Functions
console.log('\n--- Test 3: Functional Verification of Export Functions ---');

const needle = '<script>\n    (function () {';
const startIdx = htmlContent.indexOf(needle);
if (startIdx === -1) {
  console.error('Could not locate inline script start');
  process.exit(1);
}
const endIdx = htmlContent.indexOf('</script>', startIdx);
const jsCode = htmlContent.substring(startIdx + 8, endIdx);

// Minimal DOM & Browser Mock
const elementStore = new Map();
function getOrCreateEl(id = '', tag = 'div') {
  if (elementStore.has(id)) return elementStore.get(id);
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
    removeChild: function(child) {
      const idx = this.children.indexOf(child);
      if (idx > -1) this.children.splice(idx, 1);
    },
    setAttribute: function(k, v) { this[k] = v; },
    getAttribute: function(k) { return this[k] || null; },
    listeners: {},
    addEventListener: function(event, cb) {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(cb);
    },
    trigger: function(event, evtObj = {}) {
      if (this.onclick && event === 'click') {
        this.onclick({ target: this, currentTarget: this, ...evtObj });
      }
      if (this.listeners[event]) {
        this.listeners[event].forEach(cb => cb({ target: this, currentTarget: this, ...evtObj }));
      }
    },
    click: function() {
      this.trigger('click');
    },
    dataset: {},
    innerHTML: '',
    textContent: '',
    value: '',
    style: {}
  };
  if (id) elementStore.set(id, el);
  return el;
}

let lastBlobContent = null;
let lastBlobType = null;
let lastDownloadedFile = null;
let printInvoked = false;

class MockBlob {
  constructor(parts, options) {
    lastBlobContent = parts.join('');
    lastBlobType = options ? options.type : '';
  }
}

const mockDocument = {
  getElementById: (id) => getOrCreateEl(id),
  querySelector: (sel) => getOrCreateEl(sel.replace(/^[#.]/, '')),
  querySelectorAll: () => [],
  createElement: (tag) => {
    const el = getOrCreateEl('', tag);
    el.click = function() {
      if (el.download) {
        lastDownloadedFile = el.download;
      }
    };
    return el;
  },
  body: getOrCreateEl('body', 'body'),
  addEventListener: () => {}
};

let lastPrintHtml = '';
let domLoadedCb = null;
const mockWindow = {
  addEventListener: (event, cb) => {
    if (event === 'DOMContentLoaded') domLoadedCb = cb;
  },
  document: mockDocument,
  print: () => {
    printInvoked = true;
    const p = mockDocument.getElementById('printableReportSection');
    if (p) lastPrintHtml = p.innerHTML;
  },
  open: () => {},
  URL: {
    createObjectURL: () => 'blob:mock-url',
    revokeObjectURL: () => {}
  },
  localStorage: {
    store: {},
    getItem: function(k) { return this.store[k] || null; },
    setItem: function(k, v) { this.store[k] = String(v); },
    removeItem: function(k) { delete this.store[k]; }
  }
};
mockWindow.Blob = MockBlob;

const sandbox = {
  window: mockWindow,
  document: mockDocument,
  Blob: MockBlob,
  URL: mockWindow.URL,
  localStorage: mockWindow.localStorage,
  setTimeout: (cb) => { if (typeof cb === 'function') cb(); },
  setInterval: () => 1,
  clearInterval: () => {},
  clearTimeout: () => {},
  console: console,
  Date: Date,
  Math: Math,
  Number: Number,
  String: String,
  Array: Array,
  Object: Object,
  RegExp: RegExp,
  Set: Set,
  Map: Map,
  encodeURIComponent: encodeURIComponent
};

const vm = require('vm');
const context = vm.createContext(sandbox);

try {
  vm.runInContext(jsCode, context);
} catch (e) {
  console.error('Error executing index.html script:', e);
  process.exit(1);
}

// Trigger DOMContentLoaded
if (domLoadedCb) {
  domLoadedCb();
} else {
  console.warn('DOMContentLoaded listener was not registered');
}

const exported = mockWindow;

// Verify functions are exposed
assert(typeof exported.exportPropertyLedgerExcel === 'function', 'exportPropertyLedgerExcel must be a function');
assert(typeof exported.printPropertyStatement === 'function', 'printPropertyStatement must be a function');
assert(typeof exported.exportTenantLedgerExcel === 'function', 'exportTenantLedgerExcel must be a function');
assert(typeof exported.exportTenantLedgerPDF === 'function', 'exportTenantLedgerPDF must be a function');
console.log('  ✓ exportPropertyLedgerExcel, printPropertyStatement, exportTenantLedgerExcel, exportTenantLedgerPDF functions exposed');

const testPropId = (mockWindow.state && mockWindow.state.properties && mockWindow.state.properties[0]) ? mockWindow.state.properties[0].id : 'prop_sg_101';
const testTenantId = (mockWindow.state && mockWindow.state.tenants && mockWindow.state.tenants[0]) ? mockWindow.state.tenants[0].id : 'ten_sg_101';

console.log(`  ✓ Using testPropId: ${testPropId}, testTenantId: ${testTenantId}`);

// Test 3.1: Export Property Ledger to Excel
console.log('\n--- Test 3.1: Testing exportPropertyLedgerExcel ---');
lastBlobContent = null;
lastDownloadedFile = null;

exported.exportPropertyLedgerExcel(testPropId);
assert(lastBlobContent !== null, 'CSV blob content should be generated');
assert(lastBlobContent.startsWith('\uFEFF'), 'CSV must include UTF-8 BOM for Excel compliance');
assert(lastBlobContent.includes('PROPERTY ACCOUNT RUNNING LEDGER'), 'CSV must have official header');
assert(lastBlobContent.includes('Lessor / Landlord:'), 'CSV must include Landlord info');
assert(lastBlobContent.includes('Cycle #'), 'CSV must include Cycle # column header');
assert(lastBlobContent.includes('TOTALS:'), 'CSV must include summary totals row');
assert(lastDownloadedFile.endsWith('.csv'), `Download filename must end in .csv, got: ${lastDownloadedFile}`);
console.log(`  ✓ Excel export generated successfully: ${lastDownloadedFile}`);

// Test 3.2: Print / PDF Property Statement
console.log('\n--- Test 3.2: Testing printPropertyStatement ---');
printInvoked = false;
const printable = mockDocument.getElementById('printableReportSection');

exported.printPropertyStatement(testPropId);
assert.strictEqual(printInvoked, true, 'window.print() should be invoked');
assert(lastPrintHtml.includes('OFFICIAL STATEMENT OF ACCOUNT'), 'Statement HTML must include official heading');
assert(lastPrintHtml.includes('PROPERTY ACCOUNT RUNNING LEDGER'), 'Statement HTML must include ledger header');
assert(lastPrintHtml.includes('Tenant (Lessee) Signature'), 'Statement HTML must include tenant signature box');
assert(lastPrintHtml.includes('Authorized Landlord Signatory'), 'Statement HTML must include landlord signature box');
console.log('  ✓ Printable statement generated and print dialog invoked');

// Test 3.3: Export Tenant Ledger to Excel
console.log('\n--- Test 3.3: Testing exportTenantLedgerExcel ---');
lastBlobContent = null;
lastDownloadedFile = null;

exported.exportTenantLedgerExcel(testTenantId);
assert(lastBlobContent !== null, 'Tenant CSV blob content should be generated');
assert(lastDownloadedFile.includes('Tenant_Ledger'), `Filename should contain Tenant_Ledger, got: ${lastDownloadedFile}`);
console.log(`  ✓ Tenant Excel export generated successfully: ${lastDownloadedFile}`);

// Test 3.4: Export Tenant Ledger to PDF
console.log('\n--- Test 3.4: Testing exportTenantLedgerPDF ---');
printInvoked = false;
exported.exportTenantLedgerPDF(testTenantId);
assert.strictEqual(printInvoked, true, 'window.print() should be invoked for tenant PDF statement');
console.log('  ✓ Tenant PDF export invoked successfully');

// Test 4: Wire check for UI Buttons
console.log('\n--- Test 4: UI Button Event Triggering ---');

// Open property ledger modal to set activeLedgerPropId
exported.openPropertyLedgerModal(testPropId);

// Test top property ledger Excel button
lastDownloadedFile = null;
const topExcelBtn = mockDocument.getElementById('modalPropLedgerTopExcelBtn');
topExcelBtn.click();
assert(lastDownloadedFile !== null, 'Clicking #modalPropLedgerTopExcelBtn should trigger export');
console.log('  ✓ #modalPropLedgerTopExcelBtn click triggers Excel download');

// Test top property ledger PDF button
printInvoked = false;
const topPrintBtn = mockDocument.getElementById('modalPropLedgerTopPrintBtn');
topPrintBtn.click();
assert(printInvoked === true, 'Clicking #modalPropLedgerTopPrintBtn should trigger print dialog');
console.log('  ✓ #modalPropLedgerTopPrintBtn click triggers PDF print');

// Open Tenant Track Record modal to set activeTrackRecordTenantId
exported.openTenantTrackRecordModal(testTenantId);

// Test Tenant Track Record Modal Export Buttons
lastDownloadedFile = null;
const trExcelBtn = mockDocument.getElementById('modalTrExportExcelBtn');
trExcelBtn.click();
assert(lastDownloadedFile !== null, 'Clicking #modalTrExportExcelBtn should trigger export');
console.log('  ✓ #modalTrExportExcelBtn click triggers Tenant Excel download');

printInvoked = false;
const trPdfBtn = mockDocument.getElementById('modalTrExportPdfBtn');
trPdfBtn.click();
assert(printInvoked === true, 'Clicking #modalTrExportPdfBtn should trigger print dialog');
console.log('  ✓ #modalTrExportPdfBtn click triggers Tenant PDF statement');

// Test Tenant Portal Export Buttons
const testTenant = (mockWindow.state && mockWindow.state.tenants && mockWindow.state.tenants[0]) || { id: testTenantId, name: 'Manoj Kumar', unit: 'Flat 101, Sagarpur' };
const testProp = (mockWindow.state && mockWindow.state.properties && mockWindow.state.properties[0]) || { id: testPropId, name: 'Flat 101, Sagarpur' };
mockWindow.renderTenantPortalLedger(testTenant, testProp);

lastDownloadedFile = null;
const tpExcelBtn = mockDocument.getElementById('tpExportLedgerExcelBtn');
tpExcelBtn.click();
assert(lastDownloadedFile !== null, 'Clicking #tpExportLedgerExcelBtn should trigger export');
console.log('  ✓ #tpExportLedgerExcelBtn click triggers Tenant Portal Excel download');

printInvoked = false;
const tpPdfBtn = mockDocument.getElementById('tpExportLedgerPdfBtn');
tpPdfBtn.click();
assert(printInvoked === true, 'Clicking #tpExportLedgerPdfBtn should trigger print dialog');
console.log('  ✓ #tpExportLedgerPdfBtn click triggers Tenant Portal PDF statement');

console.log('\n🎉 ALL LEDGER EXPORT TESTS PASSED SUCCESSFULLY! 🚀');
