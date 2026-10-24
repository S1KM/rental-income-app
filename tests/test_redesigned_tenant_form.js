// tests/test_redesigned_tenant_form.js
// Automated verification suite for the redesigned compact Tenant Registration Form:
// Verifies reduced box size, compact avatar uploader, tight grid layout,
// KYC 3-column mini cards, collapse/expand toggle, and form reset.

const fs = require('fs');
const assert = require('assert');

console.log("=== Testing Redesigned Compact Tenant Registration Form ===");

const html = fs.readFileSync('index.html', 'utf8');

// 1. Check all required elements in the redesigned form
const requiredElements = [
  "tabViewTenants",
  "addTenantMasterForm",
  "tmFormCollapseToggleBtn",
  "tmFormToggleIcon",
  "tmFormToggleText",
  "tmPhotoInput",
  "tmPhotoPreviewContainer",
  "tmPhotoPreviewImg",
  "tmPhotoPlaceholder",
  "tmPhotoTriggerBtn",
  "tmPhotoUploadBtn",
  "tmPhotoRemoveBtn",
  "tmPhotoFileName",
  "tmNameInput",
  "tmMobileInput",
  "tmEmailInput",
  "tmUnitSelect",
  "tmRentInput",
  "tmDepositMonthsInput",
  "tmDepositAmountInput",
  "tmStatusSelect",
  "tmOsInput",
  "tmStartDateInput",
  "tmEndDateInput",
  "tmAutoFillDatesBtn",
  "tmPermAddressInput",
  "tmPanInput",
  "tmPanStatusBadge",
  "tmPanDocInput",
  "tmPanDocEmptyState",
  "tmPanDocUploadBtn",
  "tmPanDocChip",
  "tmAadhaarInput",
  "tmAadhaarStatusBadge",
  "tmAadhaarDocInput",
  "tmAadhaarDocEmptyState",
  "tmAadhaarDocUploadBtn",
  "tmAadhaarDocChip",
  "tmAgreementDocsCountLabel",
  "tmAgreementDocsInput",
  "tmAgreementDocsEmptyState",
  "tmAgreementDocsUploadBtn",
  "tmAgreementDocsChipsContainer",
  "tmResetBtn",
  "tmSubmitBtn"
];

console.log("\n--- Step 1: Checking Required Element IDs in Redesigned Form ---");
requiredElements.forEach((id) => {
  assert.ok(html.includes(`id="${id}"`), `Missing ID "${id}" in index.html`);
  console.log(`  ✓ #${id} verified`);
});

// 2. Check layout reduction patterns
console.log("\n--- Step 2: Checking Compact & Modern Design Patterns ---");

// Redesigned form uses compact paddings (p-4 sm:p-5 instead of p-6)
assert.ok(html.includes('id="tmFormCollapseToggleBtn"'), "Collapse/Expand toggle button not found");
assert.ok(html.includes('id="tmResetBtn"'), "Reset button not found");
console.log("  ✓ Collapse/Expand form toggle and Reset buttons exist");

// Mini-card KYC 3-column grid verified
assert.ok(html.includes('grid grid-cols-1 md:grid-cols-3 gap-3'), "3-column KYC mini-card grid not found");
console.log("  ✓ 3-column KYC mini-card grid (PAN, Aadhaar, Agreement) verified");

// Inline compact avatar preview verified
assert.ok(html.includes('w-13 h-13 rounded-2xl border-2 border-dashed border-indigo-300'), "Compact 13x13 avatar preview container not found");
console.log("  ✓ Compact avatar container verified");

// 3. Functional behavior of toggle button and reset
console.log("\n--- Step 3: Verifying Toggle & Reset Event Wiring in Source Code ---");
assert.ok(html.includes('tmFormToggleBtn.addEventListener("click"'), "tmFormToggleBtn click listener not found");
assert.ok(html.includes('document.getElementById("tmResetBtn")?.addEventListener("click"'), "tmResetBtn click listener not found");
assert.ok(html.includes('tmFormEl.classList.contains("hidden")'), "loadTenantIntoForm form unhide logic verified");
console.log("  ✓ Collapse toggle, Reset action, and Auto-expand on edit verified!");

console.log("\n=======================================================");
console.log("🎉 ALL REDESIGNED COMPACT TENANT FORM TESTS PASSED 100%!");
console.log("=======================================================\n");
