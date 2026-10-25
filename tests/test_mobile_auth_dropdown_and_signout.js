// tests/test_mobile_auth_dropdown_and_signout.js
// Automated verification suite for mobile user menu dropdown, profile modal isolation, and demo sign-out

const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

console.log("=== Testing Mobile User Menu Dropdown & Demo Sign Out Fix ===");

const html = fs.readFileSync('index.html', 'utf8');

// -------------------------------------------------------------
// Step 1: Verify Required DOM Elements in HTML
// -------------------------------------------------------------
console.log("\n--- Step 1: Checking Required DOM Elements in HTML ---");
const requiredElementIds = [
  "authHeaderUserPill",
  "authProfileMenuBtn",
  "authHeaderUserName",
  "authProfileChevronIcon",
  "authProfileDropdown",
  "authDropdownNameDisplay",
  "authOpenAccountBtn",
  "authSignOutBtn",
  "landlordProfileModal",
  "landlordProfileHeaderSignOutBtn",
  "landlordProfileFooterSignOutBtn",
  "authModal",
  "authHeaderSignInBtn"
];

requiredElementIds.forEach(id => {
  assert.ok(html.includes(`id="${id}"`), `Missing required element id="${id}" in HTML`);
  console.log(`  ✓ #${id} exists in HTML`);
});

// Verify authHeaderUserName is visible on mobile (not hidden sm:inline)
assert.ok(!html.includes('id="authHeaderUserName" class="text-xs font-bold text-slate-800 dark:text-slate-100 max-w-[100px] truncate hidden sm:inline"'),
  "authHeaderUserName should not be hidden on mobile!");
console.log("  ✓ #authHeaderUserName is enabled for display across mobile viewports");

// Verify rogue listener on authHeaderUserPill is completely removed
assert.ok(!html.includes('document.getElementById("authHeaderUserPill")?.addEventListener("click"'),
  "Rogue authHeaderUserPill click listener should be removed to prevent auto-opening landlord profile modal!");
console.log("  ✓ Rogue click listener on #authHeaderUserPill verified removed");

// -------------------------------------------------------------
// Step 2: Test Sandbox Execution of Menu Toggle & Demo Sign-Out
// -------------------------------------------------------------
console.log("\n--- Step 2: Testing Menu Toggle & Sign-Out Logic in Sandbox ---");

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
  focus() {}
  closest(selector) {
    if (selector.startsWith("#")) {
      const targetId = selector.slice(1);
      if (this.id === targetId) return this;
    }
    return null;
  }
}

const domElements = {};
requiredElementIds.forEach(id => {
  domElements[id] = new MockElement(id);
});
domElements.authProfileDropdown.classList.add("hidden");
domElements.landlordProfileModal.classList.add("hidden");
domElements.authModal.classList.add("hidden");

const mockDocument = {
  getElementById: (id) => domElements[id] || new MockElement(id),
  addEventListener: (event, fn) => {
    if (!mockDocument.listeners) mockDocument.listeners = {};
    if (!mockDocument.listeners[event]) mockDocument.listeners[event] = [];
    mockDocument.listeners[event].push(fn);
  },
  dispatchEvent: (event) => {
    if (mockDocument.listeners && mockDocument.listeners[event.type]) {
      mockDocument.listeners[event.type].forEach(fn => fn(event));
    }
  }
};

const mockLocalStorage = {
  data: {},
  getItem: function(k) { return this.data[k] !== undefined ? this.data[k] : null; },
  setItem: function(k, v) { this.data[k] = String(v); },
  removeItem: function(k) { delete this.data[k]; }
};

let profileModalOpenedCount = 0;
const sandbox = {
  document: mockDocument,
  localStorage: mockLocalStorage,
  currentAuthUser: {
    id: "usr_master_rajesh",
    name: "Rajesh Sharma",
    email: "abcltd9925@gmail.com",
    role: "Landlord"
  },
  STORAGE_KEY_AUTH_USER: "rpm_auth_user_session_v2",
  STORAGE_KEY_AUTH_LOGGED_OUT: "rpm_auth_logged_out_v2",
  supabaseClient: null,
  toast: { info: () => {}, success: () => {}, error: () => {} },
  showFeedback: () => {},
  openLandlordProfileModal: (banner) => {
    profileModalOpenedCount++;
    domElements.landlordProfileModal.classList.remove("hidden");
  },
  closeLandlordProfileModal: () => {
    domElements.landlordProfileModal.classList.add("hidden");
  },
  updateAuthHeaderUI: () => {
    if (sandbox.currentAuthUser) {
      domElements.authHeaderUserPill.classList.remove("hidden");
      domElements.authHeaderSignInBtn.classList.add("hidden");
    } else {
      domElements.authHeaderUserPill.classList.add("hidden");
      domElements.authHeaderSignInBtn.classList.remove("hidden");
      domElements.authModal.classList.remove("hidden");
    }
  },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  console: console
};

vm.createContext(sandbox);

// Extract handleSignOut and initLandlordProfileStudio from index.html
const handleSignOutCode = html.match(/function handleSignOut\(\)\s*\{[\s\S]*?\n      \}/)[0];
const initStudioCode = html.match(/function initLandlordProfileStudio\(\)\s*\{[\s\S]*?\n      \}/)[0];

vm.runInContext(handleSignOutCode, sandbox);
vm.runInContext(initStudioCode, sandbox);

// Initialize event listeners
sandbox.initLandlordProfileStudio();

// Test 2.1: Clicking on authProfileMenuBtn (Rajesh Sharma) in mobile view
console.log("\n--- Testing 2.1: Mobile user taps 'Rajesh Sharma' ---");
assert.strictEqual(domElements.authProfileDropdown.classList.contains("hidden"), true, "Dropdown should initially be hidden");

// Simulate mobile user click on Rajesh Sharma button
domElements.authProfileMenuBtn.dispatchEvent({
  type: "click",
  preventDefault: () => {},
  stopPropagation: () => {}
});

assert.strictEqual(domElements.authProfileDropdown.classList.contains("hidden"), false, "Dropdown must be visible after click on Rajesh Sharma!");
assert.strictEqual(profileModalOpenedCount, 0, "Clicking Rajesh Sharma must NOT open the Landlord Profile modal!");
console.log("  ✓ Tapping 'Rajesh Sharma' opens dropdown menu and does NOT auto-open profile window");

// Simulate second tap on Rajesh Sharma (toggles dropdown closed)
domElements.authProfileMenuBtn.dispatchEvent({
  type: "click",
  preventDefault: () => {},
  stopPropagation: () => {}
});
assert.strictEqual(domElements.authProfileDropdown.classList.contains("hidden"), true, "Dropdown must close when tapped again!");
console.log("  ✓ Tapping 'Rajesh Sharma' a second time toggles the dropdown closed");

// Test 2.2: Clicking "Profile & Landlord Studio" inside dropdown opens the profile modal
console.log("\n--- Testing 2.2: Clicking 'Profile & Landlord Studio' inside dropdown ---");
domElements.authOpenAccountBtn.dispatchEvent({
  type: "click",
  stopPropagation: () => {}
});
assert.strictEqual(profileModalOpenedCount, 1, "Clicking 'Profile & Landlord Studio' must open profile modal");
assert.strictEqual(domElements.authProfileDropdown.classList.contains("hidden"), true, "Dropdown must close when opening profile");
console.log("  ✓ 'Profile & Landlord Studio' option properly opens modal and closes dropdown");

// Test 2.3: Signing out from dropdown exits demo mode
console.log("\n--- Testing 2.3: Signing out from dropdown exits demo mode ---");
domElements.authSignOutBtn.dispatchEvent({
  type: "click",
  stopPropagation: () => {}
});

assert.strictEqual(sandbox.currentAuthUser, null, "currentAuthUser should be cleared (null) after sign out");
assert.strictEqual(mockLocalStorage.getItem("rpm_auth_logged_out_v2"), "true", "Logged out flag must be set to prevent auto-login");
assert.strictEqual(mockLocalStorage.getItem("rpm_auth_user_session_v2"), null, "Session cache must be removed");
assert.strictEqual(domElements.landlordProfileModal.classList.contains("hidden"), true, "Profile modal must be closed on sign out");
assert.strictEqual(domElements.authProfileDropdown.classList.contains("hidden"), true, "Dropdown must be closed on sign out");
assert.strictEqual(domElements.authHeaderUserPill.classList.contains("hidden"), true, "User pill must be hidden when signed out");
assert.strictEqual(domElements.authModal.classList.contains("hidden"), false, "Auth login modal must be presented to user");
console.log("  ✓ Sign out successfully exits demo mode and displays login modal!");

// Test 2.4: Signing out from inside Landlord Profile modal (Header / Footer sign out buttons)
console.log("\n--- Testing 2.4: Signing out from inside Landlord Profile Modal ---");
// Reset user into demo mode
sandbox.currentAuthUser = { id: "usr_master_rajesh", name: "Rajesh Sharma" };
domElements.landlordProfileModal.classList.remove("hidden");

domElements.landlordProfileHeaderSignOutBtn.dispatchEvent({
  type: "click",
  stopPropagation: () => {}
});

assert.strictEqual(sandbox.currentAuthUser, null, "Header sign out button must clear auth user");
assert.strictEqual(domElements.landlordProfileModal.classList.contains("hidden"), true, "Profile modal must be closed");
assert.strictEqual(mockLocalStorage.getItem("rpm_auth_logged_out_v2"), "true", "Demo mode must be marked exited");
console.log("  ✓ Landlord Profile Header 'Sign Out' button exits demo mode cleanly");

console.log("\n=======================================================");
console.log("🎉 ALL MOBILE AUTH DROPDOWN & DEMO SIGN-OUT TESTS PASSED 100%!");
console.log("=======================================================\n");
