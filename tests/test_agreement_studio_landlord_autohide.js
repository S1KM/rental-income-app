// tests/test_agreement_studio_landlord_autohide.js
// Automated verification suite to verify auto-hiding of Landlord Details in Agreement Studio.

const fs = require('fs');
const assert = require('assert');

console.log("=== Testing Auto-Hide Landlord Details in Agreement Studio ===");

const html = fs.readFileSync('index.html', 'utf8');

// 1. Check DOM elements exist
const requiredElements = [
  "studioLandlordSection",
  "studioLandlordSummaryPill",
  "studioToggleLandlordDetailsBtn",
  "studioToggleLandlordIcon",
  "studioToggleLandlordText",
  "studioOpenFullLandlordProfileBtn",
  "studioLandlordInputsContainer",
  "studioLandlordNameInput",
  "studioLandlordFatherInput",
  "studioLandlordPanInput",
  "studioLandlordPhoneInput",
  "studioLandlordEmailInput",
  "studioLandlordAddressInput",
  "studioLandlordUpiInput"
];

console.log("\n--- Step 1: Checking Required Element IDs ---");
requiredElements.forEach((id) => {
  assert.ok(html.includes(`id="${id}"`), `Missing required element ID in index.html: "${id}"`);
  console.log(`  ✓ #${id} exists in HTML`);
});

// 2. Check auto-hidden by default in HTML
console.log("\n--- Step 2: Checking Auto-Hidden by Default in HTML ---");
assert.ok(
  html.includes('id="studioLandlordInputsContainer" class="hidden'),
  "studioLandlordInputsContainer must have 'hidden' class by default in HTML"
);
console.log("  ✓ studioLandlordInputsContainer has 'hidden' class by default (auto-hidden)!");

// 3. Verify event listeners and helpers in JS
console.log("\n--- Step 3: Verifying Toggle & Helper Logic in JavaScript ---");
assert.ok(html.includes('function updateStudioLandlordSummaryBadge'), "updateStudioLandlordSummaryBadge helper function missing");
assert.ok(html.includes('studioToggleLandlordBtn.addEventListener("click"'), "studioToggleLandlordBtn click listener missing");
assert.ok(html.includes('landlordInputs.classList.contains("hidden")'), "navigateToLandlordAgreementView unhide logic missing");
console.log("  ✓ updateStudioLandlordSummaryBadge helper exists");
console.log("  ✓ studioToggleLandlordBtn interactive toggle listener exists");
console.log("  ✓ navigateToLandlordAgreementView unhide logic exists");

console.log("\n=======================================================");
console.log("🎉 ALL AUTO-HIDE LANDLORD DETAILS TESTS PASSED 100%!");
console.log("=======================================================\n");
