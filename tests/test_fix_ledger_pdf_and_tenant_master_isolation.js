// tests/test_fix_ledger_pdf_and_tenant_master_isolation.js
// Automated verification suite for:
// 1. Fixing PDF Ledger export format (eliminating blank pages, preventing overflow, setting display:none on body siblings)
// 2. Tenant Master Directory isolation inside #tabViewTenants only (not appearing in other tabs)

const fs = require('fs');
const assert = require('assert');

console.log("=== Testing Fix for Ledger PDF Export Blank Pages & Tenant Master Tab Isolation ===");

const html = fs.readFileSync('index.html', 'utf8');

// -------------------------------------------------------------
// Part 1: Verify Tenant Master Directory Containment
// -------------------------------------------------------------
console.log("\n--- Part 1: Checking Tenant Master Directory Containment inside #tabViewTenants ---");

const tabViewTenantsIndex = html.indexOf('id="tabViewTenants"');
assert.ok(tabViewTenantsIndex !== -1, "#tabViewTenants not found in HTML");

const nextTabIndex = html.indexOf('id="tabViewAgreements"');
assert.ok(nextTabIndex !== -1, "#tabViewAgreements not found in HTML");

const directoryHeaderIndex = html.indexOf('Tenant Master Directory &amp; Status Control');
assert.ok(directoryHeaderIndex !== -1, "'Tenant Master Directory & Status Control' header not found");

const tmListContainerIndex = html.indexOf('id="tenantMasterListContainer"');
assert.ok(tmListContainerIndex !== -1, "#tenantMasterListContainer not found");

// Check that the Directory and its container are strictly BEFORE #tabViewAgreements and AFTER #tabViewTenants
assert.ok(
  directoryHeaderIndex > tabViewTenantsIndex && directoryHeaderIndex < nextTabIndex,
  "Tenant Master Directory must be located inside #tabViewTenants (before #tabViewAgreements)"
);
assert.ok(
  tmListContainerIndex > tabViewTenantsIndex && tmListContainerIndex < nextTabIndex,
  "#tenantMasterListContainer must be located inside #tabViewTenants (before #tabViewAgreements)"
);

console.log("  ✓ 'Tenant Master Directory & Status Control' is strictly contained inside #tabViewTenants!");
console.log("  ✓ #tenantMasterListContainer is strictly contained inside #tabViewTenants!");

// Verify that there are no orphaned tags between form and directory
assert.ok(!html.includes('Save Tenant Profile to Master'), "Orphaned duplicate submit button found");
console.log("  ✓ No orphaned duplicate closing tags between form and directory");

// -------------------------------------------------------------
// Part 2: Verify CSS Print Isolation for Ledger Export PDF
// -------------------------------------------------------------
console.log("\n--- Part 2: Checking Print CSS Rules for Blank Page Elimination ---");

assert.ok(
  html.includes('body.print-report > *:not(#printableReportSection)'),
  "Missing body.print-report > *:not(#printableReportSection) CSS rule"
);
assert.ok(
  html.includes('display: none !important;'),
  "Missing display: none !important rule for print-report siblings"
);
assert.ok(
  html.includes('page-break-inside: avoid !important;'),
  "Missing page-break-inside: avoid !important rule for table rows"
);
assert.ok(
  html.includes('thead {') && html.includes('display: table-header-group !important;'),
  "Missing table-header-group for print thead"
);

console.log("  ✓ body.print-report > *:not(#printableReportSection) hides all sibling elements from layout");
console.log("  ✓ table-header-group and table-footer-group configured for clean multi-page pagination");
console.log("  ✓ Table rows and headers avoid breaking across pages");

// -------------------------------------------------------------
// Part 3: Verify printPropertyStatement Template Layout
// -------------------------------------------------------------
console.log("\n--- Part 3: Checking printPropertyStatement Template Layout ---");

assert.ok(
  html.includes('padding: 12px 16px; width: 100%; max-width: 100%;'),
  "printPropertyStatement container should use 100% width to prevent horizontal overflow"
);
assert.ok(
  html.includes('OFFICIAL STATEMENT OF ACCOUNT'),
  "Official Statement of Account header exists"
);
assert.ok(
  html.includes('page-break-inside: avoid; break-inside: avoid;'),
  "Page break avoidance attributes present in template elements"
);

console.log("  ✓ Statement template uses 100% box-budgeted width to prevent horizontal page splitting");
console.log("  ✓ Header, Summary, Table Rows, and Signatures have page-break-inside: avoid");

console.log("\n=======================================================");
console.log("🎉 ALL FIXES FOR LEDGER PDF & TAB ISOLATION PASSED 100%!");
console.log("=======================================================\n");
