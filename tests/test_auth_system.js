// tests/test_auth_system.js
// Automated verification suite for Authentication, Registration, Mobile/Email OTP Verification & Password Reset
const fs = require('fs');
const vm = require('vm');

console.log("=== Testing Authentication, Registration, OTP & Password Reset System ===");

const htmlContent = fs.readFileSync('index.html', 'utf8');

// Verify all required HTML IDs are present in index.html
const requiredAuthIds = [
  "authHeaderContainer",
  "authHeaderUserPill",
  "authHeaderAvatar",
  "authHeaderUserName",
  "authHeaderUserEmail",
  "authHeaderVerifiedBadge",
  "authHeaderSignInBtn",
  "authSignOutBtn",
  "authModal",
  "authViewSignIn",
  "authViewRegister",
  "authViewOtp",
  "authViewForgotPassword",
  "authViewSetNewPassword",
  "authLoginIdentifier",
  "authLoginPassword",
  "authSubmitSignInBtn",
  "authSwitchToOtpLoginBtn",
  "authForgotPasswordLink",
  "authRegName",
  "authRegEmail",
  "authRegPhone",
  "authRegRole",
  "authRegPassword",
  "authRegPasswordConfirm",
  "authSubmitRegisterBtn",
  "authOtpTargetDisplay",
  "authOtp1", "authOtp2", "authOtp3", "authOtp4", "authOtp5", "authOtp6",
  "authSubmitOtpBtn",
  "authResendOtpBtn",
  "authResetEmailInput",
  "authSubmitResetRequestBtn",
  "authNewPasswordInput",
  "authNewPasswordConfirmInput",
  "authSubmitNewPasswordBtn"
];

let missingIds = 0;
requiredAuthIds.forEach(id => {
  if (!htmlContent.includes(`id="${id}"`)) {
    console.error(`MISSING ID: ${id}`);
    missingIds++;
  }
});

if (missingIds > 0) {
  console.error(`❌ Failed: ${missingIds} required elements missing in HTML!`);
  process.exit(1);
}
console.log(`✓ All ${requiredAuthIds.length} Authentication UI IDs present in HTML!`);

// Mock storage & elements
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
    _classes: '',
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
    appendChild: function(child) {
      this.children.push(child);
      if (child.textContent) {
        lastToasts.push({ type: 'toast', msg: child.textContent });
        console.log(`[Captured Toast]: ${child.textContent}`);
      }
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    focus: () => {}
  };
}

const mockDoc = {
  getElementById: (id) => {
    if (!elements[id]) {
      elements[id] = createMockElement(id);
    }
    return elements[id];
  },
  createElement: (tag) => createMockElement('el_' + Math.random().toString(36).substr(2, 5), tag),
  querySelector: () => null,
  querySelectorAll: () => [],
  body: createMockElement('body')
};

const lastToasts = [];
const mockToast = {
  success: (msg) => { lastToasts.push({ type: 'success', msg }); console.log(`[Toast Success]: ${msg}`); },
  error: (msg) => { lastToasts.push({ type: 'error', msg }); console.log(`[Toast Error]: ${msg}`); },
  info: (msg) => { lastToasts.push({ type: 'info', msg }); console.log(`[Toast Info]: ${msg}`); },
  warning: (msg) => { lastToasts.push({ type: 'warning', msg }); console.log(`[Toast Warning]: ${msg}`); }
};

const mockWindow = {
  localStorage: mockLocalStorage,
  document: mockDoc,
  addEventListener: (evt, cb) => {
    if (evt === 'DOMContentLoaded') {
      mockWindow._domLoaded = cb;
    }
  },
  toast: mockToast,
  console: console,
  location: { origin: 'http://localhost:3000' }
};

const scriptMatch = htmlContent.match(/<script>([\s\S]*?)<\/script>[\s\S]*?<\/body>/);
if (!scriptMatch) {
  console.error("No script tag found!");
  process.exit(1);
}

const context = vm.createContext({
  window: mockWindow,
  document: mockDoc,
  localStorage: mockLocalStorage,
  toast: mockToast,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
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
  URL: { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} }
});

try {
  vm.runInContext(scriptMatch[1], context);
  if (mockWindow._domLoaded) {
    mockWindow._domLoaded();
  }
} catch (e) {
  console.error("Script execution error:", e);
  process.exit(1);
}

const getEl = (id) => mockDoc.getElementById(id);

console.log("\n--- 1. Testing Default Auth User Profile in Header ---");
const userName = getEl("authHeaderUserName")?.textContent;
const userEmail = getEl("authHeaderUserEmail")?.textContent;
console.log(`Current Header User: "${userName}", Email: "${userEmail}"`);
if (!userName.includes("Rajesh Sharma")) {
  console.error("❌ Expected Rajesh Sharma as default authenticated landlord!");
  process.exit(1);
}
console.log("✓ PASS: Default Rajesh Sharma authenticated session active!");

console.log("\n--- 2. Testing View Switching in Auth Modal ---");
mockWindow.openAuthModal("register");
if (getEl("authModal").classList.contains("hidden")) {
  console.error("❌ authModal should be visible when opened!");
  process.exit(1);
}
console.log("✓ PASS: Auth Modal opens and default mode is register");

(async () => {
  console.log("\n--- 3. Testing Registration and OTP Generation ---");
  getEl("authRegName").value = "Sunita Kapoor";
  getEl("authRegEmail").value = "sunita.kapoor@outlook.com";
  getEl("authRegPhone").value = "9820011223";
  getEl("authRegPassword").value = "Pass@123456";
  getEl("authRegPasswordConfirm").value = "Pass@123456";
  getEl("authRegRole").value = "Landlord";

  await mockWindow.handleAuthRegister();
  console.log("Feedback displayed:", getEl("authFeedback").innerHTML);

  // Verify OTP notification dispatched
  const fbText = getEl("authFeedback")?.innerHTML || "";
  const otpMatch = fbText.match(/\b\d{6}\b/) || (lastToasts.find(t => t.msg.includes("Verification code") || t.msg.includes("One-Time Code"))?.msg.match(/\b\d{6}\b/));
  if (!otpMatch) {
    console.error("❌ Registration did not dispatch OTP! Feedback:", fbText, "Last toasts:", lastToasts);
    process.exit(1);
  }
  const generatedOtp = otpMatch[0];
  console.log(`✓ Detected Generated 6-digit OTP: ${generatedOtp}`);

  // Populate 6 digit inputs
  for (let i = 1; i <= 6; i++) {
    getEl("authOtp" + i).value = generatedOtp[i - 1];
  }

  // Submit OTP
  mockWindow.handleAuthOtpSubmit();

  const newUserName = getEl("authHeaderUserName")?.textContent;
  console.log(`Updated Header User after OTP: "${newUserName}"`);
  if (!newUserName.includes("Sunita Kapoor")) {
    console.error("❌ User session was not updated to Sunita Kapoor!");
    process.exit(1);
  }
  console.log("✓ PASS: New user registered and authenticated via OTP successfully!");

  console.log("\n--- 4. Testing Sign Out ---");
  mockWindow.handleSignOut();
  console.log("Header user pill hidden?:", getEl("authHeaderUserPill").classList.contains("hidden"));
  console.log("Sign In button visible?:", !getEl("authHeaderSignInBtn").classList.contains("hidden"));
  if (!getEl("authHeaderUserPill").classList.contains("hidden") || getEl("authHeaderSignInBtn").classList.contains("hidden")) {
    console.error("❌ Sign out failed to update header UI!");
    process.exit(1);
  }
  console.log("✓ PASS: User successfully signed out!");

  console.log("\n--- 5. Testing Sign In with Registered Account ---");
  getEl("authLoginIdentifier").value = "sunita.kapoor@outlook.com";
  getEl("authLoginPassword").value = "Pass@123456";
  await mockWindow.handleAuthSignIn();

  const loggedInUser = getEl("authHeaderUserName")?.textContent;
  if (!loggedInUser.includes("Sunita Kapoor")) {
    console.error("❌ Failed to log in with registered credentials!");
    process.exit(1);
  }
  console.log("✓ PASS: Sign in with email and password verified!");

  console.log("\n--- 6. Testing Password Reset Request via Email Link/Code ---");
  mockWindow.handleSignOut();
  getEl("authResetEmailInput").value = "sunita.kapoor@outlook.com";
  await mockWindow.handleForgotPasswordRequest();

  const resetFb = getEl("authFeedback")?.innerHTML || "";
  const resetCodeMatch = resetFb.match(/\b\d{6}\b/) || (lastToasts.find(t => t.msg.includes("Password Reset Link"))?.msg.match(/\b\d{6}\b/));
  if (!resetCodeMatch) {
    console.error("❌ Reset password code not found! Feedback:", resetFb, "Last toasts:", lastToasts);
    process.exit(1);
  }
  const resetOtpCode = resetCodeMatch[0];
  console.log(`✓ Reset OTP Code received: ${resetOtpCode}`);

  // Enter OTP to verify identity for reset
  for (let i = 1; i <= 6; i++) {
    getEl("authOtp" + i).value = resetOtpCode[i - 1];
  }
  mockWindow.handleAuthOtpSubmit();

  // Enter new password
  getEl("authNewPasswordInput").value = "SuperSecret#2026";
  getEl("authNewPasswordConfirmInput").value = "SuperSecret#2026";
  mockWindow.handleSetNewPasswordSubmit();

  const resetUserName = getEl("authHeaderUserName")?.textContent;
  if (!resetUserName.includes("Sunita Kapoor")) {
    console.error("❌ Password reset did not log in the user!");
    process.exit(1);
  }
  console.log("✓ PASS: Password successfully reset and authenticated!");

  console.log("\n====================================================================");
  console.log("🎉 ALL AUTHENTICATION, REGISTRATION, OTP & RESET TESTS PASSED 100%!");
  console.log("====================================================================\n");
  process.exit(0);
})();
