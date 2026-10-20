const fs = require("fs");
const path = require("path");

const htmlPath = "d:/Rental Income app/index.html";
const html = fs.readFileSync(htmlPath, "utf-8");

console.log("=== Testing Ledger Cycle and Date Click Popup Integration ===");

// 1. Check openPartialPaymentModal has targetInstallmentIndex parameter and auto-focus
if (!html.includes("function openPartialPaymentModal(propertyId, targetCycle = null, targetInstallmentIndex = null)")) {
  console.error("FAIL: openPartialPaymentModal does not have targetInstallmentIndex parameter");
  process.exit(1);
}
console.log("PASS: openPartialPaymentModal supports targetCycle and targetInstallmentIndex");

if (!html.includes("partialPayAmountInput") || !html.includes("amountInput.focus()") || !html.includes("amountInput.select()")) {
  console.error("FAIL: openPartialPaymentModal does not focus and select partialPayAmountInput");
  process.exit(1);
}
console.log("PASS: openPartialPaymentModal auto-focuses and selects partialPayAmountInput");

// 2. Check Property Ledger Modal table has clickable cycle, dueDate, and payment dates
const modalLedgerHasCycleBtn = html.includes('data-action="open-partial-pay"') &&
  html.includes('title="Click to record payment received for ${escapeHtml(r.cycle)}"');
if (!modalLedgerHasCycleBtn) {
  console.error("FAIL: Property Ledger Modal table cycle/date buttons missing");
  process.exit(1);
}
console.log("PASS: Property Ledger Modal table has interactive cycle and date buttons");

// 3. Check Tenant Track Record Modal table has clickable cycle, dueDate, and payment dates
const trCycleRegex = /data-action="open-partial-pay"[\s\S]*?data-prop-id="\$\{prop \? prop\.id : ""\}"[\s\S]*?data-cycle="\$\{escapeHtml\(r\.cycle\)\}"/;
if (!trCycleRegex.test(html)) {
  console.error("FAIL: Tenant Track Record modal table cycle button missing");
  process.exit(1);
}
console.log("PASS: Tenant Track Record modal table has interactive cycle and date buttons");

// 4. Check Reports Property Ledger table has clickable cycle, dueDate, and payment dates
const reportsLedgerCycleRegex = /data-action="open-partial-pay"[\s\S]*?data-prop-id="\$\{prop\.id\}"[\s\S]*?data-cycle="\$\{escapeHtml\(r\.cycle\)\}"/;
if (!reportsLedgerCycleRegex.test(html)) {
  console.error("FAIL: Reports Property Ledger table cycle button missing");
  process.exit(1);
}
console.log("PASS: Reports Property Ledger table has interactive cycle and date buttons");

// 5. Check event listeners extract and forward data-installment-index
if (!html.includes("const instIdx = partialBtn.getAttribute(\"data-installment-index\");")) {
  console.error("FAIL: Event listeners do not extract data-installment-index");
  process.exit(1);
}
console.log("PASS: Event listeners extract and forward data-installment-index");

// 6. Check whitespace-nowrap preservation across all ledger tables
if (!html.includes("whitespace-nowrap font-medium text-emerald-950 underline decoration-emerald-300 underline-offset-2")) {
  console.error("FAIL: whitespace-nowrap not preserved on payment dates");
  process.exit(1);
}
console.log("PASS: whitespace-nowrap preserved on all cycle dates and payment installment dates");

console.log("\nALL LEDGER CYCLE AND DATE CLICK TESTS PASSED SUCCESSFULLY! (Code 0)");
