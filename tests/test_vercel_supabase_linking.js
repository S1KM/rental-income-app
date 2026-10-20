// tests/test_vercel_supabase_linking.js
// Automated verification test for permanent Vercel + Supabase connection

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log("=== Testing Permanent Vercel + Supabase Integration ===");

// 1. Verify Vercel Serverless Function api/supabase-config.js exists and exports handler
const apiModulePath = '../api/supabase-config.js';
const apiContent = fs.readFileSync('api/supabase-config.js', 'utf8');
assert(apiContent.includes('SUPABASE_URL'), 'API handler must check SUPABASE_URL');
assert(apiContent.includes('SUPABASE_ANON_KEY'), 'API handler must check SUPABASE_ANON_KEY');
console.log("✓ Serverless API handler api/supabase-config.js verified.");

// 2. Verify vercel.json routes
const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const hasApiRewrite = vercelConfig.rewrites.some(r => r.source === '/api/(.*)' && r.destination === '/api/$1');
assert(hasApiRewrite, 'vercel.json must have rewrite for /api/(.*)');
console.log("✓ Vercel routing configuration verified.");

// 3. Verify index.html UI has NO visible Supabase Cloud Sync button in header
const htmlContent = fs.readFileSync('index.html', 'utf8');
assert(!htmlContent.includes('id="supabaseSyncModalBtn"'), 'Visible button supabaseSyncModalBtn must be removed from header');
console.log("✓ Manual Supabase Cloud Sync button removed from header.");

// 4. Test fetchVercelSupabaseConfig in simulated browser sandbox
const storage = {};
const mockLocalStorage = {
  getItem: (k) => (k in storage ? storage[k] : null),
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; }
};

let clientInitializedWith = null;
const mockSupabase = {
  createClient: (url, key) => {
    clientInitializedWith = { url, key };
    return {
      from: () => ({
        select: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
          limit: () => Promise.resolve({ data: [], error: null }),
          eq: () => Promise.resolve({ data: [], error: null })
        }),
        upsert: () => Promise.resolve({ data: [], error: null })
      })
    };
  }
};

const elements = {};
function createMockEl(id) {
  return {
    id,
    value: '',
    checked: false,
    className: '',
    textContent: '',
    innerHTML: '',
    style: {},
    dataset: {},
    children: [],
    appendChild: () => {},
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    addEventListener: () => {},
    setAttribute: () => {},
    getAttribute: () => null,
    querySelector: () => null,
    querySelectorAll: () => []
  };
}

const sandbox = {
  window: {},
  addEventListener: () => {},
  document: {
    getElementById: (id) => {
      if (!elements[id]) elements[id] = createMockEl(id);
      return elements[id];
    },
    createElement: (tag) => createMockEl('el_' + tag),
    addEventListener: () => {}
  },
  localStorage: mockLocalStorage,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  fetch: (url) => {
    if (url === '/api/supabase-config') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          url: 'https://test-prod-project.supabase.co',
          anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.vercelmockkey',
          connected: true,
          linkedWith: 'Vercel + Supabase Direct Integration'
        })
      });
    }
    return Promise.reject(new Error('Unknown url ' + url));
  }
};
sandbox.window = sandbox;
sandbox.window.supabase = mockSupabase;

const scriptStart = htmlContent.indexOf('<script>');
const scriptEnd = htmlContent.indexOf('</script>', scriptStart);
const jsCode = htmlContent.slice(scriptStart + 8, scriptEnd);

vm.createContext(sandbox);
vm.runInContext(jsCode, sandbox);

(async () => {
  // Test auto-fetch from Vercel config
  console.log("Running fetchVercelSupabaseConfig()...");
  const result = await sandbox.fetchVercelSupabaseConfig();
  assert(result === true, "fetchVercelSupabaseConfig must return true on success");
  assert.strictEqual(sandbox.localStorage.getItem("rpm_supabase_url"), "https://test-prod-project.supabase.co");
  assert.strictEqual(sandbox.localStorage.getItem("rpm_supabase_autosync"), "true");
  assert(clientInitializedWith !== null, "Supabase client should be automatically created");
  assert.strictEqual(clientInitializedWith.url, "https://test-prod-project.supabase.co");

  console.log("✓ Auto-fetch from Vercel API seamlessly initialized Supabase client and enabled auto-sync!");
  console.log("✅ ALL PERMANENT VERCEL + SUPABASE TESTS PASSED 100%!");
})();
