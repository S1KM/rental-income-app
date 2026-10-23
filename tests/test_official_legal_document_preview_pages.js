const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const htmlPath = 'd:/Rental Income app/index.html';
const html = fs.readFileSync(htmlPath, 'utf-8');

console.log('=== Testing Official Legal Document Preview Multi-Page System (Pages 1, 2, 3, 4) ===');

// 1. Verify existence of required elements in HTML
const requiredElements = [
  'policePageSelectorGroup',
  'policePreviewCopyBtn',
  'policePreviewDownloadBtn',
  'policePreviewPrintBtn',
  'policePrintableArea'
];

requiredElements.forEach((id) => {
  assert.ok(html.includes(`id="${id}"`), `Missing required element ID in HTML: ${id}`);
  console.log(`✓ Found required DOM element ID: ${id}`);
});

// Verify Page Buttons in HTML
['all', '1', '2', '3', '4'].forEach((p) => {
  assert.ok(html.includes(`data-police-page="${p}"`), `Missing page button for page ${p}`);
  console.log(`✓ Found page button data-police-page="${p}"`);
});

// 2. Setup headless DOM simulation sandbox
const startIdx = html.indexOf('<script>');
const endIdx = html.lastIndexOf('</script>');
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
    closest: function() { return this; },
    querySelector: function(sel) { return createEl(); },
    querySelectorAll: function(sel) {
      if (sel.includes('.police-page-tab-btn')) {
        return ['all', '1', '2', '3', '4'].map(p => {
          const btn = createEl('', 'button');
          btn.setAttribute('data-police-page', p);
          btn.classList.add('police-page-tab-btn');
          return btn;
        });
      }
      return [];
    },
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
  querySelectorAll: (sel) => {
    if (sel.includes('.police-page-tab-btn')) {
      return ['all', '1', '2', '3', '4'].map(p => {
        const btn = createEl('', 'button');
        btn.setAttribute('data-police-page', p);
        btn.classList.add('police-page-tab-btn');
        return btn;
      });
    }
    return [getOrSetEl('mock')];
  },
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
  setItem: function(k, v) { this.data[k] = v; },
  clear: function() { this.data = {}; }
};

const sandbox = {
  document: documentMock,
  window: windowMock,
  localStorage: localStorageMock,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  Math: Math,
  Date: Date,
  Number: Number,
  String: String,
  Array: Array,
  Object: Object,
  Set: Set,
  Map: Map,
  RegExp: RegExp,
  encodeURIComponent: encodeURIComponent
};

vm.createContext(sandbox);
vm.runInContext(jsCode, sandbox);

if (domLoadedCb) domLoadedCb();

// 3. Test updateLivePoliceFormPreview execution and verify 4 distinct pages
sandbox.window.updateLivePoliceFormPreview();
const printableArea = getOrSetEl('policePrintableArea');
const content = printableArea.innerHTML;

// Verify Page 1
assert.ok(content.includes('id="policePage1"'), 'Preview must contain #policePage1');
assert.ok(content.includes('Part I — Particulars of Landlord'), 'Page 1 must contain Part I');
assert.ok(content.includes('Part II — Particulars of Tenant / Licensee'), 'Page 1 must contain Part II Tenant Particulars');
assert.ok(content.includes('Page 1 of 4'), 'Page 1 must display Page 1 of 4 footer');
console.log('✓ Page 1 (Landlord & Tenant Particulars) verified successfully');

// Verify Page 2
assert.ok(content.includes('id="policePage2"'), 'Preview must contain #policePage2');
assert.ok(content.includes('PAGE 2 OF 4'), 'Page 2 must have PAGE 2 OF 4 header');
assert.ok(content.includes('Part II (Continued) — Identity Verification Documents'), 'Page 2 must contain Identity Documents');
assert.ok(content.includes('Part III — Particulars of Family Members'), 'Page 2 must contain Family Members');
assert.ok(content.includes('Part IV — References of Two Local Respectable Citizens'), 'Page 2 must contain Local References');
assert.ok(content.includes('Page 2 of 4'), 'Page 2 must display Page 2 of 4 footer');
console.log('✓ Page 2 (Identity Proofs, Tenancy Terms, Occupants & References) verified successfully');

// Verify Page 3
assert.ok(content.includes('id="policePage3"'), 'Preview must contain #policePage3');
assert.ok(content.includes('PAGE 3 OF 4'), 'Page 3 must have PAGE 3 OF 4 header');
assert.ok(content.includes('Part V — Statutory Declaration by Landlord'), 'Page 3 must contain Statutory Declaration');
assert.ok(content.includes('Signature of Tenant'), 'Page 3 must contain Tenant Signature');
assert.ok(content.includes('Signature of Landlord / Owner'), 'Page 3 must contain Landlord Signature');
assert.ok(content.includes('POLICE STATION ACKNOWLEDGMENT RECEIPT'), 'Page 3 must contain Counterfoil Receipt Slip');
assert.ok(content.includes('Page 3 of 4'), 'Page 3 must display Page 3 of 4 footer');
console.log('✓ Page 3 (Statutory Declaration, Signatures & Police Receipt Counterfoil) verified successfully');

// Verify Page 4
assert.ok(content.includes('id="policePage4"'), 'Preview must contain #policePage4');
assert.ok(content.includes('PAGE 4 OF 4'), 'Page 4 must have PAGE 4 OF 4 header');
assert.ok(content.includes('Part VI — Mandatory Document Attachments Checklist'), 'Page 4 must contain Checklist');
assert.ok(content.includes('Part VII — Local Police Beat Officer Field Inquiry Report'), 'Page 4 must contain Beat Inquiry Report');
assert.ok(content.includes('Page 4 of 4'), 'Page 4 must display Page 4 of 4 footer');
console.log('✓ Page 4 (Document Checklist & Beat Officer Field Inquiry Report) verified successfully');

// 4. Test Page Switching functionality
const { setPolicePageView } = sandbox.window;
assert.strictEqual(typeof setPolicePageView, 'function', 'setPolicePageView must be exported on window');

// Switch to Page 2
setPolicePageView('2');
const p1 = getOrSetEl('policePage1');
const p2 = getOrSetEl('policePage2');
const p3 = getOrSetEl('policePage3');
const p4 = getOrSetEl('policePage4');

assert.ok(p1.classList.contains('hidden'), 'Page 1 must be hidden when Page 2 is selected');
assert.ok(!p2.classList.contains('hidden'), 'Page 2 must be visible when Page 2 is selected');
assert.ok(p3.classList.contains('hidden'), 'Page 3 must be hidden when Page 2 is selected');
assert.ok(p4.classList.contains('hidden'), 'Page 4 must be hidden when Page 2 is selected');
console.log('✓ Page 2 view switching verified');

// Switch to Page 3
setPolicePageView('3');
assert.ok(p1.classList.contains('hidden'), 'Page 1 must be hidden when Page 3 is selected');
assert.ok(p2.classList.contains('hidden'), 'Page 2 must be hidden when Page 3 is selected');
assert.ok(!p3.classList.contains('hidden'), 'Page 3 must be visible when Page 3 is selected');
assert.ok(p4.classList.contains('hidden'), 'Page 4 must be hidden when Page 3 is selected');
console.log('✓ Page 3 view switching verified');

// Switch to Page 4
setPolicePageView('4');
assert.ok(p1.classList.contains('hidden'), 'Page 1 must be hidden when Page 4 is selected');
assert.ok(p2.classList.contains('hidden'), 'Page 2 must be hidden when Page 4 is selected');
assert.ok(p3.classList.contains('hidden'), 'Page 3 must be hidden when Page 4 is selected');
assert.ok(!p4.classList.contains('hidden'), 'Page 4 must be visible when Page 4 is selected');
console.log('✓ Page 4 view switching verified');

// Switch to All Pages
setPolicePageView('all');
assert.ok(!p1.classList.contains('hidden'), 'Page 1 must be visible when All Pages is selected');
assert.ok(!p2.classList.contains('hidden'), 'Page 2 must be visible when All Pages is selected');
assert.ok(!p3.classList.contains('hidden'), 'Page 3 must be visible when All Pages is selected');
assert.ok(!p4.classList.contains('hidden'), 'Page 4 must be visible when All Pages is selected');
console.log('✓ All Pages view switching verified');

// 5. Verify CSS Print styles
assert.ok(html.includes('body.print-police .police-page-sheet'), 'Print CSS must style .police-page-sheet');
assert.ok(html.includes('page-break-after: always !important'), 'Print CSS must enforce page-break-after: always');
assert.ok(html.includes('break-after: page !important'), 'Print CSS must enforce break-after: page');
assert.ok(html.includes('body.print-police #policePrintableArea {\n        position: static !important;'), 'Print CSS must use position: static for multi-page flow');
console.log('✓ Multi-page print styles (@media print) verified without fixed position pagination bugs');

console.log('\n====================================================================');
console.log('ALL OFFICIAL LEGAL DOCUMENT PREVIEW PAGE TESTS PASSED! (Code 0)');
console.log('====================================================================\n');
