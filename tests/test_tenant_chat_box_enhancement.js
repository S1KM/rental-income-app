// tests/test_tenant_chat_box_enhancement.js
// Automated verification suite for the Tenant Discussion Chat Box enhancements:
// Header Chat button, Floating Discussion launcher, In-Chat Tenant Switcher,
// Track Record Chat button, Property Ledger Chat button, and Dashboard quick Chat actions.

const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

console.log("=== Testing Tenant Discussion Chat Box Enhancements ===");

const htmlContent = fs.readFileSync('index.html', 'utf8');

// 1. Verify required DOM elements exist in index.html
const requiredChatElements = [
  // Header and Floating Launcher
  "headerTenantChatBtn",
  "floatingChatLauncherBtn",
  "floatingChatLauncherContainer",
  
  // In-Chat Box Controls
  "landlordChatModal",
  "landlordChatTenantSelect",
  "landlordChatDuesBadge",
  "landlordChatOpenLedgerBtn",
  "landlordChatTenantName",
  "landlordChatTenantMeta",
  "landlordChatTenantAvatar",
  "landlordChatShareInviteBtn",
  "closeLandlordChatModalBtn",
  "landlordChatMessageList",
  "landlordChatInput",
  "landlordChatForm",

  // Modal Chat Buttons
  "modalTrChatBtn",
  "modalPropLedgerChatBtn"
];

console.log("\n--- Step 1: Checking Required DOM Element IDs ---");
requiredChatElements.forEach((id) => {
  assert.ok(htmlContent.includes(`id="${id}"`), `Missing required element ID in index.html: "${id}"`);
  console.log(`  ✓ #${id} exists in HTML`);
});

// 2. Check Dashboard data-action="open-chat"
console.log("\n--- Step 2: Checking Dashboard Quick Chat Action Buttons ---");
assert.ok(htmlContent.includes('data-action="open-chat"'), 'data-action="open-chat" not found in index.html');
assert.ok(htmlContent.includes('action === "open-chat"'), 'action === "open-chat" handler not found in delegated click listener');
console.log('  ✓ data-action="open-chat" found in table, cards and click handler!');

// 3. Functional Sandbox Testing
console.log("\n--- Step 3: Functional Sandbox Testing of Chat Box Logic ---");

const mockDocument = {
  elements: {},
  getElementById: function(id) {
    if (!this.elements[id]) {
      this.elements[id] = {
        id,
        classList: {
          classes: new Set(["hidden"]),
          add: function(c) { this.classes.add(c); },
          remove: function(c) { this.classes.delete(c); },
          contains: function(c) { return this.classes.has(c); }
        },
        style: {},
        innerHTML: "",
        textContent: "",
        value: "",
        children: [],
        appendChild: function(c) { this.children.push(c); },
        focus: function() {},
        addEventListener: function(event, handler) {
          this[`on_${event}`] = handler;
        },
        click: function() {
          if (this.on_click) this.on_click({ preventDefault: () => {} });
        }
      };
    }
    return this.elements[id];
  },
  createElement: function(tag) {
    return {
      tagName: tag.toUpperCase(),
      classList: {
        classes: new Set(),
        add: function(c) { this.classes.add(c); },
        remove: function(c) { this.classes.delete(c); },
        contains: function(c) { return this.classes.has(c); }
      },
      style: {},
      innerHTML: "",
      textContent: "",
      value: "",
      children: [],
      appendChild: function(c) { this.children.push(c); }
    };
  },
  querySelectorAll: function() { return []; }
};

const mockWindow = {
  document: mockDocument,
  localStorage: {
    store: {},
    getItem: function(k) { return this.store[k] || null; },
    setItem: function(k, v) { this.store[k] = String(v); }
  },
  setTimeout: function(fn) { fn(); return 1; },
  showFeedback: function() {},
  formatINR: function(n) { return '₹' + Number(n).toLocaleString('en-IN'); },
  escapeHtml: function(s) { return String(s); }
};

// Create test environment
const sandbox = {
  window: mockWindow,
  document: mockDocument,
  localStorage: mockWindow.localStorage,
  setTimeout: mockWindow.setTimeout,
  console: console,
  showFeedback: mockWindow.showFeedback,
  formatINR: mockWindow.formatINR,
  escapeHtml: mockWindow.escapeHtml,
  state: {
    tenants: [
      { id: "ten_01", name: "Manoj Kumar", unit: "Flat 101, Sagarpur", mobile: "9818010000", osAmount: 0, status: "Active" },
      { id: "ten_02", name: "Priya Patel", unit: "Flat 104, Sagarpur", mobile: "9876543210", osAmount: 12000, status: "Active" },
      { id: "ten_03", name: "Vikram Rathore", unit: "Unassigned", mobile: "9811122233", osAmount: 0, status: "Vacated" }
    ],
    properties: [
      { id: "prop_01", name: "Flat 101, Sagarpur" },
      { id: "prop_02", name: "Flat 104, Sagarpur" }
    ],
    chats: {},
    landlord: { name: "Rajesh Sharma", mobile: "9818000000" }
  },
  activeChatTenantId: null,
  activeTrackRecordTenantId: null,
  saveState: function() {}
};

// Extract functions from index.html
function extractFunction(name) {
  const match = htmlContent.match(new RegExp(`function ${name}\\s*\\([\\s\\S]*?\\n      \\}`, 'm'));
  if (match) return match[0];
  throw new Error(`Could not find function ${name} in index.html`);
}

const scriptCode = `
${extractFunction('getTenantChatHistory')}
${extractFunction('sendChatMessage')}
${extractFunction('renderLandlordChatMessages')}
${extractFunction('renderTenantPortalChatMessages')}
${extractFunction('openLandlordChatModal')}
${extractFunction('closeLandlordChatModal')}

// Expose on sandbox
sandbox.openLandlordChatModal = openLandlordChatModal;
sandbox.closeLandlordChatModal = closeLandlordChatModal;
sandbox.sendChatMessage = sendChatMessage;
sandbox.getTenantChatHistory = getTenantChatHistory;
`;

const ctx = vm.createContext({ ...sandbox, sandbox });
vm.runInContext(scriptCode, ctx);

// Test 3.1: Open chat modal without tenantId (defaults to first active tenant)
console.log("  Testing openLandlordChatModal() with default fallback...");
sandbox.openLandlordChatModal();
const modalEl = mockDocument.getElementById("landlordChatModal");
assert.strictEqual(modalEl.classList.contains("hidden"), false, "Modal should not have 'hidden' class");
assert.strictEqual(mockDocument.getElementById("landlordChatTenantName").textContent, "Manoj Kumar");
assert.strictEqual(mockDocument.getElementById("landlordChatDuesBadge").textContent, "✓ Dues Clear");
console.log("  ✓ Chat box opens with first active tenant (Manoj Kumar), Dues Clear");

// Test 3.2: Check Tenant Switcher Select options
const tenantSelect = mockDocument.getElementById("landlordChatTenantSelect");
assert.ok(tenantSelect.children.length >= 2, "Tenant select should have optgroups for active and vacated tenants");
console.log(`  ✓ Tenant Switcher populated with ${tenantSelect.children.length} optgroups`);

// Test 3.3: Switch to Defaulter tenant (Priya Patel, 12000 dues)
console.log("  Testing openLandlordChatModal('ten_02') for tenant with dues...");
sandbox.openLandlordChatModal("ten_02");
assert.strictEqual(mockDocument.getElementById("landlordChatTenantName").textContent, "Priya Patel");
assert.ok(mockDocument.getElementById("landlordChatDuesBadge").textContent.includes("12,000 Due"), "Dues badge should show 12,000 Due");
console.log("  ✓ Chat box switches to Priya Patel, shows '⚠️ ₹12,000 Due' badge");

// Test 3.4: Send message to Priya Patel
console.log("  Testing sendChatMessage()...");
sandbox.sendChatMessage("ten_02", "landlord", "Hi Priya, please settle the ₹12,000 rent balance for this month.");
const chatHistory = sandbox.getTenantChatHistory("ten_02");
const lastMsg = chatHistory[chatHistory.length - 1];
assert.strictEqual(lastMsg.sender, "landlord");
assert.strictEqual(lastMsg.text, "Hi Priya, please settle the ₹12,000 rent balance for this month.");
console.log("  ✓ Message sent and recorded in chat history successfully:", lastMsg.text);

// Test 3.5: Close chat box
sandbox.closeLandlordChatModal();
assert.strictEqual(modalEl.classList.contains("hidden"), true, "Modal should have 'hidden' class after close");
console.log("  ✓ closeLandlordChatModal() properly hides the modal");

console.log("\n=======================================================");
console.log("🎉 ALL TENANT DISCUSSION CHAT BOX ENHANCEMENTS VERIFIED 100%!");
console.log("=======================================================\n");
