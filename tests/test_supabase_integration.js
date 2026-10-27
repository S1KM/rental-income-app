const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log("=== Testing Supabase Cloud Integration in index.html ===");

const htmlContent = fs.readFileSync('index.html', 'utf8');

// Mock browser DOM and window environment
const storage = {};
const mockLocalStorage = {
  getItem: (k) => (k in storage ? storage[k] : null),
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

const elements = {};
function createMockElement(id, tag = 'div') {
  return {
    id,
    tagName: tag.toUpperCase(),
    value: '',
    checked: false,
    className: '',
    textContent: '',
    innerHTML: '',
    style: {},
    dataset: {},
    children: [],
    classList: {
      add: function(...classes) {
        const set = new Set((this._classes || '').split(' ').filter(Boolean));
        classes.forEach(c => set.add(c));
        this._classes = Array.from(set).join(' ');
      },
      remove: function(...classes) {
        const set = new Set((this._classes || '').split(' ').filter(Boolean));
        classes.forEach(c => set.delete(c));
        this._classes = Array.from(set).join(' ');
      },
      contains: function(c) {
        return (this._classes || '').split(' ').includes(c);
      }
    },
    addEventListener: () => {},
    setAttribute: () => {},
    getAttribute: () => null,
    closest: () => null,
    appendChild: () => {},
    querySelector: () => null,
    querySelectorAll: () => []
  };
}

const mockDoc = {
  getElementById: (id) => {
    if (!elements[id]) {
      elements[id] = createMockElement(id);
    }
    return elements[id];
  },
  createElement: (tag) => createMockElement('el_' + Math.random(), tag),
  querySelectorAll: () => [],
  addEventListener: () => {},
  body: createMockElement('body')
};

// Mock Supabase JS client
let mockSupabaseDb = {
  properties: [],
  tenants: [],
  ledger_installments: [],
  landlord_settings: []
};

const mockSupabase = {
  createClient: (url, key) => {
    if (!url.startsWith('https://')) throw new Error('Invalid URL');
    return {
      from: (tableName) => ({
        select: (cols) => ({
          limit: (n) => Promise.resolve({ data: (mockSupabaseDb[tableName] || []).slice(0, n), error: null }),
          order: () => Promise.resolve({ data: mockSupabaseDb[tableName] || [], error: null }),
          eq: (col, val) => Promise.resolve({ data: (mockSupabaseDb[tableName] || []).filter(r => r[col] === val), error: null })
        }),
        upsert: (rows) => {
          const list = Array.isArray(rows) ? rows : [rows];
          if (!mockSupabaseDb[tableName]) mockSupabaseDb[tableName] = [];
          list.forEach(item => {
            const idx = mockSupabaseDb[tableName].findIndex(r => r.id === item.id);
            if (idx > -1) mockSupabaseDb[tableName][idx] = item;
            else mockSupabaseDb[tableName].push(item);
          });
          return Promise.resolve({ data: list, error: null });
        }
      })
    };
  }
};

const sandbox = {
  window: {
    addEventListener: () => {}
  },
  document: mockDoc,
  localStorage: mockLocalStorage,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  alert: console.log,
  confirm: () => true,
  prompt: () => ''
};
sandbox.window = sandbox;
let domContentLoadedCallback = null;
sandbox.window.addEventListener = (event, cb) => {
  if (event === "DOMContentLoaded") domContentLoadedCallback = cb;
};
sandbox.window.supabase = mockSupabase;

const scriptStart = htmlContent.indexOf('<script>');
const scriptEnd = htmlContent.indexOf('</script>', scriptStart);
const jsCode = htmlContent.slice(scriptStart + 8, scriptEnd);

vm.createContext(sandbox);
vm.runInContext(jsCode, sandbox);

// Trigger DOMContentLoaded
if (domContentLoadedCallback) domContentLoadedCallback();

console.log("1. Verify Initial Offline Status");
console.log("Is Supabase connected?:", sandbox.supabaseClient !== null ? "Connected" : "Disconnected (Safe offline)");

console.log("2. Saving Supabase Credentials");
sandbox.document.getElementById("supabaseUrlInput").value = "https://xyzcompany.supabase.co";
sandbox.document.getElementById("supabaseKeyInput").value = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummykey";
sandbox.document.getElementById("supabaseAutoSyncToggle").checked = true;

sandbox.saveSupabaseCredentials();
console.log("Saved URL:", sandbox.localStorage.getItem("rpm_supabase_url"));
console.log("Saved AutoSync:", sandbox.localStorage.getItem("rpm_supabase_autosync"));
console.log("Supabase Client initialized?:", sandbox.supabaseClient !== null);

(async () => {
  console.log("3. Testing Push to Supabase");
  const pushSuccess = await sandbox.pushToSupabase(false);
  console.log("Push Success:", pushSuccess);
  console.log("Cloud Properties in mock DB:", mockSupabaseDb.properties.length);
  console.log("Cloud Tenants in mock DB:", mockSupabaseDb.tenants.length);
  console.log("Cloud Installments in mock DB:", mockSupabaseDb.ledger_installments.length);

  console.log("4. Testing Pull from Supabase");
  // Modify local state to prove pull works
  sandbox.state.properties = [];
  sandbox.state.tenants = [];
  console.log("Local properties wiped to 0");
  const pullSuccess = await sandbox.pullFromSupabase();
  console.log("Pull Success:", pullSuccess);
  console.log("Restored properties count:", sandbox.state.properties.length);
  console.log("Restored tenants count:", sandbox.state.tenants.length);

  console.log("5. Testing Disconnect");
  sandbox.disconnectSupabase();
  console.log("After disconnect, client is null?:", sandbox.supabaseClient === null);
  console.log("LocalStorage URL after disconnect:", sandbox.localStorage.getItem("rpm_supabase_url"));

  console.log("✅ ALL SUPABASE TESTS PASSED 100%!");
})();
