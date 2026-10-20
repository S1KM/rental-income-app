// tests/test_tenant_invite_chat.js
// Automated verification suite for Tenant Invite (WhatsApp/SMS/Email), Tenant View Portal & Live 2-Way Chat Studio

const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

console.log("=== Testing Tenant Registration Invite (WhatsApp/SMS/Email) & Tenant View Chat Portal ===");

const htmlContent = fs.readFileSync('index.html', 'utf8');

// 1. Verify required DOM element IDs exist in index.html
const requiredIds = [
  // Invite Modal
  "tenantInviteModal",
  "inviteTenantName",
  "inviteTenantUnitBadge",
  "inviteTenantMobile",
  "inviteTenantEmail",
  "inviteTenantRent",
  "inviteTenantDeposit",
  "invitePortalUrlInput",
  "inviteWhatsAppBtn",
  "inviteSmsBtn",
  "inviteEmailBtn",
  "inviteCopyLinkBtn",
  "invitePreviewPortalBtn",
  // Landlord Chat Drawer
  "landlordChatModal",
  "landlordChatTenantName",
  "landlordChatTenantMeta",
  "landlordChatMessageList",
  "landlordChatInput",
  "landlordChatForm",
  "landlordChatShareInviteBtn",
  // Tenant View Only Portal
  "tenantPortalSection",
  "tenantExitViewBtn",
  "tenantPwaInstallBtn",
  "tpTenantName",
  "tpUnitName",
  "tpContactInfo",
  "tpRentAmount",
  "tpDepositAmount",
  "tpBalanceDueBadge",
  "tpLandlordName",
  "tpLandlordPhone",
  "tpLandlordEmail",
  "tpViewReceiptBtn",
  "tpViewAgreementBtn",
  "tpChatMessageList",
  "tenantPortalChatForm",
  "tenantPortalChatInput"
];

requiredIds.forEach((id) => {
  assert.ok(htmlContent.includes(`id="${id}"`), `Missing required ID in index.html: "${id}"`);
});
console.log(`✓ All ${requiredIds.length} required Invite, Chat & Tenant Portal DOM element IDs verified in index.html!`);

// 2. Verify Tenant Master Action Buttons
assert.ok(htmlContent.includes('data-action="tm-chat"'), 'Tenant Master must have [💬 Chat] action button');
assert.ok(htmlContent.includes('data-action="tm-invite"'), 'Tenant Master must have [📲 Share App] action button');
console.log("✓ Tenant Master cards contain interactive [💬 Chat] and [📲 Share App] buttons!");

// 3. Verify Registration hook triggers openTenantInviteModal
assert.ok(
  htmlContent.includes("openTenantInviteModal(newTenant.id)") || htmlContent.includes("openTenantInviteModal(newTenant)"),
  "Tenant registration must automatically trigger openTenantInviteModal"
);
console.log("✓ Tenant registration form automatically hooks openTenantInviteModal upon new tenant submission!");

// 4. Verify Engine Functions existence
const requiredFunctions = [
  "generateTenantPortalUrl",
  "openTenantInviteModal",
  "closeTenantInviteModal",
  "getTenantChatHistory",
  "sendChatMessage",
  "renderLandlordChatMessages",
  "renderTenantPortalChatMessages",
  "openLandlordChatModal",
  "closeLandlordChatModal",
  "enterTenantPortalView",
  "exitTenantPortalView",
  "initTenantInviteAndChatEngine"
];

requiredFunctions.forEach((fn) => {
  assert.ok(htmlContent.includes(`function ${fn}`), `Missing engine function: "${fn}"`);
});
console.log(`✓ All ${requiredFunctions.length} invite, chat & tenant view engine functions verified in source code!`);

// 5. Test Chat logic & State persistence in a sandboxed VM
console.log("Testing Chat logic, message persistence and URL generator in isolated VM sandbox...");

// Create a mock DOM environment
const mockStorage = {};
const mockElements = new Map();

function createMockEl(id = '', tag = 'div') {
  return {
    id,
    tagName: tag.toUpperCase(),
    value: '',
    textContent: '',
    innerHTML: '',
    href: '',
    src: '',
    classList: {
      _classes: new Set(),
      add: function(...cls) { cls.forEach(c => this._classes.add(c)); },
      remove: function(...cls) { cls.forEach(c => this._classes.delete(c)); },
      contains: function(c) { return this._classes.has(c); },
      toggle: function(c) { if (this.contains(c)) this.remove(c); else this.add(c); }
    },
    style: {},
    children: [],
    appendChild: function(c) { this.children.push(c); return c; },
    setAttribute: function(k, v) { this[k] = v; },
    getAttribute: function(k) { return this[k] || null; },
    addEventListener: function(evt, handler) { this._handler = handler; },
    scrollIntoView: function() {},
    focus: function() {}
  };
}

const sandbox = {
  console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  scrollTo: () => {},
  navigator: {
    clipboard: {
      writeText: async (t) => { sandbox._clipboard = t; }
    }
  },
  location: {
    origin: 'https://rental-income.app',
    pathname: '/',
    search: '',
    href: 'https://rental-income.app/'
  },
  localStorage: {
    getItem: (k) => mockStorage[k] || null,
    setItem: (k, v) => { mockStorage[k] = String(v); },
    removeItem: (k) => { delete mockStorage[k]; },
    clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
  },
  document: {
    getElementById: (id) => {
      if (!mockElements.has(id)) {
        mockElements.set(id, createMockEl(id));
      }
      return mockElements.get(id);
    },
    querySelectorAll: () => [],
    querySelector: () => createMockEl('header', 'header'),
    createElement: (tag) => createMockEl('', tag),
    body: createMockEl('body', 'body')
  },
  window: {}
};

sandbox.window = sandbox;

// Extract script 5 (main script) from index.html
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let mainScript = '';
while ((match = scriptRegex.exec(htmlContent)) !== null) {
  if (match[1].length > 10000) {
    mainScript = match[1];
    break;
  }
}

assert.ok(mainScript.length > 0, "Failed to extract main script from index.html");

const ctx = vm.createContext(sandbox);

// Provide minimal seed state required by script execution
vm.runInContext(`
  // Minimal seed before loading app
  var STORAGE_KEY_CHATS = "rental_app_chats_v1";
  function escapeHtml(s) { return String(s || ""); }
  function formatINR(n) { return "₹" + Number(n || 0).toLocaleString("en-IN"); }
  function showFeedback() {}
  function switchTab(t) {}
  var state = {
    landlord: { name: 'Rajesh Sharma', phone: '+91 98110 02233', email: 'abcltd9925@gmail.com' },
    units: [{ id: 'u1', name: 'Flat 101', rent: 15000, tenant: 'Rahul Sharma' }],
    tenants: [{ id: 't1', name: 'Rahul Sharma', unitId: 'u1', unit: 'Flat 101', mobile: '9876543210', phone: '9876543210', rent: 15000, deposit: 30000, email: 'rahul@example.com' }],
    properties: [{ id: 'p1', name: 'Flat 101' }],
    chats: {}
  };
  function saveState() {
    localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(state.chats));
  }
`, ctx);

// Extract the invite & chat engine
const startIdx = mainScript.indexOf("function generateTenantPortalUrl");
const endIdx = mainScript.indexOf("// --- INITIAL BOOTSTRAP ---", startIdx);
const engineCode = mainScript.substring(startIdx, endIdx);

// Run the engine functions
vm.runInContext(engineCode, ctx);

// Test generateTenantPortalUrl
const generatedUrl = vm.runInContext("generateTenantPortalUrl('t1')", ctx);
assert.ok(generatedUrl.includes("view=tenant"), "Generated URL must include 'view=tenant'");
assert.ok(generatedUrl.includes("tenantId=t1"), "Generated URL must include 'tenantId=t1'");
console.log("✓ Portal URL generator produces verified link:", generatedUrl);

// Test sendChatMessage and state.chats persistence
vm.runInContext(`
  var msg1 = sendChatMessage('t1', 'landlord', 'Welcome to Flat 101! Please find your rent terms here.');
  var msg2 = sendChatMessage('t1', 'tenant', 'Thank you! Rent has been transferred via UPI.');
`, ctx);

const chatHistory = vm.runInContext("getTenantChatHistory('t1')", ctx);
assert.strictEqual(chatHistory.length, 2, "Chat history should contain exactly 2 messages");
assert.strictEqual(chatHistory[0].sender, 'landlord', "First message should be from landlord");
assert.strictEqual(chatHistory[1].sender, 'tenant', "Second message should be from tenant");
assert.ok(chatHistory[0].timestamp > 0, "Message should have a valid numeric timestamp");
assert.ok(chatHistory[0].timeStr.length > 0, "Message should have a formatted time string");
console.log("✓ 2-Way Chat Studio message sending and retrieval verified!");

// Test localStorage persistence of chats
const persistedChatsJson = mockStorage["rental_app_chats_v1"];
assert.ok(persistedChatsJson, "Chats must be persisted to localStorage under 'rental_app_chats_v1'");
const parsedPersisted = JSON.parse(persistedChatsJson);
assert.strictEqual(parsedPersisted['t1'].length, 2, "Persisted chat history in localStorage must have 2 messages");
console.log("✓ Live chat persistence in localStorage verified!");

// Test openTenantInviteModal populating invite details
vm.runInContext("openTenantInviteModal('t1')", ctx);
const inviteTenantName = sandbox.document.getElementById("inviteTenantName").textContent;
const inviteTenantUnit = sandbox.document.getElementById("inviteTenantUnitBadge").textContent;
const inviteTenantPhone = sandbox.document.getElementById("inviteTenantMobile").textContent;
assert.strictEqual(inviteTenantName, "Rahul Sharma", "Invite modal tenant name must match");
assert.strictEqual(inviteTenantUnit, "Flat 101", "Invite modal unit must match");
assert.ok(inviteTenantPhone.includes("9876543210"), "Invite modal phone must match");
console.log("✓ Tenant Invite Modal population with unit and contact details verified!");

// Test WhatsApp & SMS invite link construction
const waBtn = sandbox.document.getElementById("inviteWhatsAppBtn");
const smsBtn = sandbox.document.getElementById("inviteSmsBtn");
const emailBtn = sandbox.document.getElementById("inviteEmailBtn");

sandbox.window.open = (url) => { sandbox._openedUrl = url; };
waBtn.onclick();
assert.ok(sandbox._openedUrl && sandbox._openedUrl.startsWith("https://wa.me/"), "WhatsApp trigger must launch https://wa.me/ URL");
assert.ok(sandbox._openedUrl.includes("Rahul%20Sharma") || sandbox._openedUrl.includes("Flat%20101"), "WhatsApp message must contain tenant name or unit");
assert.ok(sandbox._openedUrl.includes("view%3Dtenant") || sandbox._openedUrl.includes("view=tenant"), "WhatsApp message must contain tenant portal view parameter");

smsBtn.onclick();
assert.ok(sandbox.location.href.startsWith("sms:"), "SMS trigger must set sms: URL");
assert.ok(sandbox.location.href.includes("9876543210"), "SMS URI must contain recipient phone number");

emailBtn.onclick();
assert.ok(sandbox.location.href.startsWith("mailto:"), "Email trigger must set mailto: URL");
assert.ok(sandbox.location.href.includes("rahul%40example.com") || sandbox.location.href.includes("rahul@example.com"), "Email URI must contain recipient email");

console.log("✓ WhatsApp, SMS, and Email multi-channel invite link generation verified!");

// Test enterTenantPortalView and exitTenantPortalView
vm.runInContext("enterTenantPortalView('t1')", ctx);
const portalSection = sandbox.document.getElementById("tenantPortalSection");
assert.strictEqual(portalSection.classList.contains("hidden"), false, "Tenant Portal Section should not be hidden in tenant view mode");
const tpTenantName = sandbox.document.getElementById("tpTenantName").textContent;
assert.strictEqual(tpTenantName, "Rahul Sharma", "Tenant Portal displays correct tenant name");

vm.runInContext("exitTenantPortalView()", ctx);
assert.strictEqual(portalSection.classList.contains("hidden"), true, "Tenant Portal Section should be hidden when exiting back to admin");
console.log("✓ Tenant View Only mode enter/exit isolation verified!");

console.log("\n=======================================================");
console.log("🎉 ALL TENANT INVITE & CHAT PORTAL TESTS PASSED 100%!");
console.log("=======================================================\n");
