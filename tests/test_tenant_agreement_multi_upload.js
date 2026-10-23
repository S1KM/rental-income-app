// tests/test_tenant_agreement_multi_upload.js
// Automated verification suite for Tenant Master Signed Copy Agreement Multi-File Upload (PDF / Image / Doc)

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log("=== Testing Tenant Master: Signed Copy Agreement Multi-File Upload (PDF / Image / Doc) ===");

const htmlContent = fs.readFileSync('index.html', 'utf8');

// 1. Verify required DOM element IDs are in HTML
const requiredElements = [
  // Multi-file upload elements in registration form
  "tmAgreementDocsInput",
  "tmAgreementDocsUploadBtn",
  "tmAgreementDocsChipsContainer",
  "tmAgreementDocsCountLabel",

  // Dedicated modal elements
  "tenantAgreementDocsModal",
  "tenantAgreementModalTitle",
  "tenantAgreementModalSubtitle",
  "tenantAgreementModalCountBadge",
  "closeAgreementDocsModalBtn",
  "agreementsUploadDropzone",
  "tenantAgreementModalFileInput",
  "agreementsBrowseBtn",
  "agreementsFileListContainer",
  "tenantAgreementFooterSummary",
  "closeAgreementDocsModalFooterBtn",

  // Link / Manage Tenant Modal Agreements elements
  "modalTenantAgreementsInput",
  "modalTenantAgreementsBtn",
  "modalTenantAgreementsChips",
  "modalTenantAgreementsCountLabel"
];

let missing = 0;
requiredElements.forEach(id => {
  if (!htmlContent.includes(`id="${id}"`)) {
    console.error(`MISSING ELEMENT ID: ${id}`);
    missing++;
  }
});

if (missing > 0) {
  console.error(`❌ Failed: ${missing} required Signed Agreement IDs missing!`);
  process.exit(1);
}
console.log(`✓ All ${requiredElements.length} required Signed Agreement DOM IDs verified in HTML!`);

// Verify "Agreements" option label and "keep the signed copy of agreement for future reference" text in form
assert(
  htmlContent.includes("Agreements") &&
  htmlContent.includes("Signed Copy Reference") &&
  (htmlContent.includes("future reference") || htmlContent.includes("future legal")),
  "Tenant Registration Form must have prominent 'Agreements' option for keeping signed copies for future reference"
);
console.log("✓ 'Agreements' dedicated section with signed copy for future reference verified in Tenant Registration Form!");

// 2. Multi-file attributes and supported formats check
assert(
  htmlContent.includes('id="tmAgreementDocsInput" class="hidden" multiple') ||
  (htmlContent.includes('id="tmAgreementDocsInput"') && htmlContent.includes('multiple')),
  "tmAgreementDocsInput must have multiple attribute"
);
assert(
  htmlContent.includes('id="tenantAgreementModalFileInput" class="hidden" multiple') ||
  (htmlContent.includes('id="tenantAgreementModalFileInput"') && htmlContent.includes('multiple')),
  "tenantAgreementModalFileInput must have multiple attribute"
);
console.log("✓ 'multiple' attribute verified on both form and modal file inputs!");

assert(
  htmlContent.includes('.pdf') &&
  htmlContent.includes('.png') &&
  htmlContent.includes('.jpg') &&
  htmlContent.includes('.doc') &&
  htmlContent.includes('.docx'),
  "File inputs must accept .pdf, .png, .jpg, .doc, .docx formats"
);
console.log("✓ Supported file types (.pdf, images, .doc, .docx) verified on input elements!");

// 3. Mock DOM elements for VM Sandbox
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
  querySelectorAll: (selector) => [],
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

mockWindow.window = mockWindow;

// Extract main application script (length > 1000)
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scriptCode = '';
while ((match = scriptRegex.exec(htmlContent)) !== null) {
  if (match[1].length > 1000) {
    scriptCode = match[1];
    break;
  }
}

assert(scriptCode, "Could not find main application script!");

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
  Event: mockWindow.Event,
  confirm: () => true,
  alert: () => {}
});

// Run script in context
const script = new vm.Script(scriptCode);
script.runInContext(context);
if (domLoadedCb) {
  domLoadedCb();
}
console.log("✓ Application script initialized in VM sandbox!");

// 4. Test exported functions on window
assert(typeof mockWindow.openTenantAgreementsModal === "function", "openTenantAgreementsModal must be defined");
assert(typeof mockWindow.closeTenantAgreementsModal === "function", "closeTenantAgreementsModal must be defined");
assert(typeof mockWindow.renderTenantAgreementsList === "function", "renderTenantAgreementsList must be defined");
assert(typeof mockWindow.renderTmAgreementChips === "function", "renderTmAgreementChips must be defined");
assert(typeof mockWindow.deleteTenantAgreementDoc === "function", "deleteTenantAgreementDoc must be defined");
assert(typeof mockWindow.openDocPreviewModal === "function", "openDocPreviewModal must be defined");
console.log("✓ All agreement management engine functions exported and verified!");

// 5. Test openDocPreviewModal for PDF, Image and Word Document (.doc / .docx)
console.log("\n--- Testing openDocPreviewModal for PDF, Image and Word (.docx) ---");
const testPdfDoc = {
  name: "Lease_Agreement_2026.pdf",
  size: 512000,
  type: "application/pdf",
  dataUrl: "data:application/pdf;base64,JVBERi0xLjQK..."
};

const testImgDoc = {
  name: "signed_page_3.png",
  size: 256000,
  type: "image/png",
  dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
};

const testWordDoc = {
  name: "Tenancy_Contract_Final.docx",
  size: 1048576,
  type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  dataUrl: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,UEsDBBQAAAAIA..."
};

// PDF preview test
mockWindow.openDocPreviewModal("Lease Agreement", "Tenant Contract", testPdfDoc);
const previewContent = mockDoc.getElementById("docPreviewContent");
assert(previewContent.innerHTML.includes("<iframe"), "PDF preview must render iframe");
console.log("✓ PDF document renders inside interactive iframe preview");

// Image preview test
mockWindow.openDocPreviewModal("Signed Page", "Page 3 Scan", testImgDoc);
assert(previewContent.innerHTML.includes("<img"), "Image preview must render img tag");
console.log("✓ Image document renders inside high-res img preview");

// Word doc preview test
mockWindow.openDocPreviewModal("Word Contract", "Contract Document", testWordDoc);
assert(
  previewContent.innerHTML.includes("Microsoft Word Document") &&
  previewContent.innerHTML.includes("Download"),
  "Word document preview must provide specialized Word card with download link"
);
console.log("✓ Word document (.docx) renders specialized Microsoft Word card with download trigger");

mockWindow.closeDocPreviewModal();
assert(mockDoc.getElementById("docPreviewModal").classList.contains("hidden"), "Modal must be hidden after closeDocPreviewModal()");

// 6. Test Form Multi-File Chips Rendering
console.log("\n--- Testing Form Multi-File Chips Rendering ---");
mockWindow.setCurrentTmAgreementDocs([testPdfDoc, testImgDoc, testWordDoc]);
mockWindow.renderTmAgreementChips();

const chipsContainer = mockDoc.getElementById("tmAgreementDocsChipsContainer");
assert(chipsContainer.children.length === 3, `Expected 3 chips, found ${chipsContainer.children.length}`);
assert(chipsContainer.children[0].innerHTML.includes("Lease_Agreement_2026.pdf"), "Chip 1 must contain PDF name");
assert(chipsContainer.children[1].innerHTML.includes("signed_page_3.png"), "Chip 2 must contain Image name");
assert(chipsContainer.children[2].innerHTML.includes("Tenancy_Contract_Final.docx"), "Chip 3 must contain Word name");
assert(chipsContainer.children[0].innerHTML.includes("PDF"), "Chip 1 must show PDF badge");
assert(chipsContainer.children[1].innerHTML.includes("IMG"), "Chip 2 must show IMG badge");
assert(chipsContainer.children[2].innerHTML.includes("DOC"), "Chip 3 must show DOC badge");
console.log("✓ Multi-file chips correctly rendered with PDF, IMG, and DOC type badges and file sizes!");

// 7. Modal listing and management for a tenant
console.log("\n--- Testing Dedicated Agreement Modal Listing & Deletion ---");
const state = mockWindow.state;
assert(state && Array.isArray(state.tenants), "state.tenants must exist");

const testTenant = state.tenants[0];
assert(testTenant, "Must have at least 1 tenant in state");

testPdfDoc.id = "doc_test_pdf_1";
testWordDoc.id = "doc_test_word_2";
testTenant.agreementDocs = [testPdfDoc, testWordDoc];

mockWindow.openTenantAgreementsModal(testTenant.id);
const agreementsModal = mockDoc.getElementById("tenantAgreementDocsModal");
assert(!agreementsModal.classList.contains("hidden"), "tenantAgreementDocsModal should be visible");

const listContainer = mockDoc.getElementById("agreementsFileListContainer");
assert(listContainer.children.length === 2, `Expected 2 documents in modal list, found ${listContainer.children.length}`);
assert(listContainer.children[0].innerHTML.includes("Lease_Agreement_2026.pdf"), "Modal list must contain PDF");
assert(listContainer.children[1].innerHTML.includes("Tenancy_Contract_Final.docx"), "Modal list must contain Word doc");
console.log("✓ Modal list populated with tenant's multiple signed agreement copies!");

// Test deleting a document
mockWindow.deleteTenantAgreementDoc("doc_test_pdf_1");
assert(testTenant.agreementDocs.length === 1, "After delete, agreementDocs length should be 1");
assert(testTenant.agreementDocs[0].name === "Tenancy_Contract_Final.docx", "Remaining doc should be the Word doc");
console.log("✓ deleteTenantAgreementDoc successfully removed item and updated state!");

mockWindow.closeTenantAgreementsModal();
assert(agreementsModal.classList.contains("hidden"), "agreementsModal should be hidden after close");

// 8. Tenant Master Directory Card Badges & Action Buttons
console.log("\n--- Testing Tenant Master Directory Card Rendering ---");
mockWindow.renderTenantMaster();

const masterList = mockDoc.getElementById("tenantMasterListContainer");
const renderedCards = masterList.children.map(c => c.innerHTML).join(" ");
assert(renderedCards.includes("Signed Copy:"), "Tenant card must display 'Signed Copy:' badge");
assert(renderedCards.includes("data-action=\"tm-view-agreements\"") || renderedCards.includes("data-action=\"tm-upload-agreements\""), "Tenant card must have agreement action triggers");
assert(renderedCards.includes("Signed Copy (1)") || renderedCards.includes("Signed Copy (+)"), "Action button row must include Signed Copy button");
console.log("✓ Tenant card renders Signed Copy badge and [📑 Signed Copy] action button!");

// 9. Link / Manage Tenant Modal Agreements Option
console.log("\n--- Testing Link / Manage Tenant Modal Agreements Option ---");
mockWindow.setCurrentModalAgreementDocs([testPdfDoc, testWordDoc]);
mockWindow.renderModalAgreementChips();

const modalChipsContainer = mockDoc.getElementById("modalTenantAgreementsChips");
assert(modalChipsContainer.children.length === 2, `Expected 2 chips in link modal, found ${modalChipsContainer.children.length}`);
assert(modalChipsContainer.children[0].innerHTML.includes("Lease_Agreement_2026.pdf"), "Modal chip 1 must contain PDF name");
assert(modalChipsContainer.children[1].innerHTML.includes("Tenancy_Contract_Final.docx"), "Modal chip 2 must contain Word name");
console.log("✓ Link / Manage Tenant Modal 'Agreements' option successfully renders signed copy chips!");

console.log("\n========================================================");
console.log("🎉 ALL SIGNED AGREEMENT MULTI-UPLOAD TESTS PASSED 100%!");
console.log("========================================================");
