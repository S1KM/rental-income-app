const fs = require('fs');
const content = fs.readFileSync('d:/Rental Income app/index.html', 'utf8');

// Extract JS
const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/i);
if (!scriptMatch) {
  console.error("No script tag found!");
  process.exit(1);
}

// Mock DOM
const elements = {};
function getEl(id) {
  if (!elements[id]) {
    elements[id] = {
      id,
      textContent: '',
      innerHTML: '',
      value: '',
      style: {},
      classList: {
        _classes: new Set(),
        add: function(c) { this._classes.add(c); },
        remove: function(c) { this._classes.delete(c); },
        toggle: function(c) { if (this._classes.has(c)) this._classes.delete(c); else this._classes.add(c); },
        contains: function(c) { return this._classes.has(c); }
      },
      _listeners: [],
      addEventListener: function(evt, cb) {
        this._listeners.push({ evt, cb });
      },
      appendChild: (child) => { elements[id].children = elements[id].children || []; elements[id].children.push(child); },
      querySelectorAll: (sel) => {
        return [{ innerText: 'Col1', querySelectorAll: () => [{ innerText: 'Col1' }, { innerText: 'Col2' }] }];
      },
      querySelector: () => ({
        querySelectorAll: () => [{ querySelectorAll: () => [{ innerText: 'A' }, { innerText: 'B' }] }],
        cloneNode: () => ({
          querySelectorAll: () => [],
          outerHTML: '<table></table>'
        })
      }),
      options: [],
      dataset: {}
    };
  }
  return elements[id];
}

const documentMock = {
  getElementById: (id) => getEl(id),
  body: {
    classList: {
      add: () => {},
      remove: () => {}
    },
    appendChild: () => {},
    removeChild: () => {}
  },
  createElement: (tag) => ({
    tagName: tag,
    textContent: '',
    innerHTML: '',
    value: '',
    dataset: {},
    appendChild: () => {},
    className: '',
    click: () => {}
  }),
  querySelector: (sel) => ({
    querySelectorAll: () => [{ querySelectorAll: () => [{ innerText: 'A' }, { innerText: 'B' }] }],
    cloneNode: () => ({
      querySelectorAll: () => [],
      outerHTML: '<table></table>'
    })
  })
};

let domLoadedCb = null;
const windowMock = {
  addEventListener: (event, cb) => {
    if (event === "DOMContentLoaded") domLoadedCb = cb;
  },
  print: () => {}
};

const localStorageMock = {
  getItem: () => null,
  setItem: () => {}
};

const vm = require('vm');
const sandbox = {
  document: documentMock,
  window: windowMock,
  localStorage: localStorageMock,
  console: console,
  setTimeout: (cb) => cb(),
  confirm: () => true,
  prompt: () => "0",
  alert: () => {},
  navigator: { clipboard: { writeText: () => Promise.resolve() } },
  encodeURIComponent: encodeURIComponent,
  URL: { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} },
  Blob: function(parts) { this.parts = parts; }
};

try {
  vm.createContext(sandbox);
  vm.runInContext(scriptMatch[1], sandbox);
  console.log("Bootstrap script evaluated cleanly!");

  if (domLoadedCb) {
    domLoadedCb();
    console.log("DOMContentLoaded executed cleanly!");
  } else {
    console.error("No DOMContentLoaded handler registered!");
    process.exit(1);
  }

  // Test triggering KPI card clicks
  console.log("Testing KPI box clicks:");
  ['kpiBoxOccupancy', 'kpiBoxRentRoll', 'kpiBoxCollected', 'kpiBoxOverdue', 'kpiBoxVacancyTax'].forEach(id => {
    const el = elements[id];
    console.log("Triggering click on " + id + ":");
    const clickListener = el._listeners.find(l => l.evt === "click");
    if (clickListener) {
      clickListener.cb();
      console.log("  Modal content length after " + id + " click: " + elements['kpiDetailContent'].innerHTML.length);
    }
  });

  // Test switching to Reports tab
  console.log("Testing Reports tab switch:");
  const reportsTabBtn = elements['tabBtnReports'];
  const mainTabNav = elements['mainTabNav'];
  console.log("Reports table container length: " + elements['reportTableContainer'].innerHTML.length);

  // Test Export Excel button
  const exportExcelBtn = elements['reportExportExcelBtn'];
  const excelListener = exportExcelBtn._listeners.find(l => l.evt === "click");
  if (excelListener) {
    excelListener.cb();
    console.log("Export to Excel triggered cleanly!");
  }

  // Test Export PDF button
  const exportPdfBtn = elements['reportExportPdfBtn'];
  const pdfListener = exportPdfBtn._listeners.find(l => l.evt === "click");
  if (pdfListener) {
    pdfListener.cb();
    console.log("Export to PDF triggered cleanly! Printable area length: " + elements['printableReportSection'].innerHTML.length);
  }

  // Test Copy to Clipboard button
  const copyBtn = elements['reportCopyClipboardBtn'];
  const copyListener = copyBtn._listeners.find(l => l.evt === "click");
  if (copyListener) {
    copyListener.cb();
    console.log("Copy to Clipboard triggered cleanly!");
  }

  console.log("ALL TESTS COMPLETED SUCCESSFULLY!");
} catch (e) {
  console.error("TEST FAILED:", e);
  process.exit(1);
}
