const fs = require('fs');

const htmlPath = 'd:\\Rental Income app\\index.html';
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Find function generatePropertyLedgerData
const funcStart = htmlContent.indexOf('function generatePropertyLedgerData');
if (funcStart === -1) {
  console.error('Function generatePropertyLedgerData not found');
  process.exit(1);
}

// Extract formatINR and escapeHtml
const formatINRExtract = `function formatINR(val) {
  const n = Number(val) || 0;
  return "₹" + n.toLocaleString("en-IN");
}`;
const escapeHtmlExtract = `function escapeHtml(str) { return str || ""; }`;

// Find end of function
let depth = 0;
let bodyStart = htmlContent.indexOf('{', funcStart);
let i = bodyStart;
for (; i < htmlContent.length; i++) {
  if (htmlContent[i] === '{') depth++;
  else if (htmlContent[i] === '}') {
    depth--;
    if (depth === 0) break;
  }
}
const funcCode = htmlContent.substring(funcStart, i + 1);

// Test harness
const vm = require('vm');
const testCode = `
${formatINRExtract}
${escapeHtmlExtract}

const state = {
  properties: [
    { id: 'p1', name: 'Flat 101, Sagarpur', building: 'Sagarpur', rent: 12000 },
    { id: 'p2', name: 'Flat 103, Sagarpur', building: 'Sagarpur', rent: 12000 },
    { id: 'p3', name: 'Flat 119, Sagarpur', building: 'Sagarpur', rent: 12000 }
  ],
  tenants: [
    { id: 't1', unit: 'Flat 101, Sagarpur', name: 'Manoj Kumar', rent: 12000, osAmount: 0, status: 'Active' },
    { id: 't2', unit: 'Flat 103, Sagarpur', name: 'Amit Sharma', rent: 12000, osAmount: 6000, status: 'Active' }
    // p3 is vacant
  ]
};

${funcCode}

// 1. Test Occupied Flat with 0 arrears (Flat 101)
const l1 = generatePropertyLedgerData('p1');
console.log('Flat 101 - Total Billed:', l1.totalBilled, 'Total Received:', l1.totalReceived, 'Current Balance:', l1.currentBalance);
console.log('Flat 101 - Rows count:', l1.rows.length);
if (l1.currentBalance !== 0 || l1.totalBilled !== 84000 || l1.totalReceived !== 84000) {
  throw new Error('Flat 101 ledger balance calculation failed');
}

// Check row details
const firstRow = l1.rows[0];
console.log('First cycle:', firstRow.cycle, '| Due Date:', firstRow.dueDate, '| Due:', firstRow.dueAmount, '| Received Date:', firstRow.receivedDate, '| Received:', firstRow.receivedAmount, '| Running Bal:', firstRow.runningBalance);
if (!firstRow.dueDate || !firstRow.receivedDate || firstRow.runningBalance !== 0) {
  throw new Error('First row missing required fields or incorrect running balance');
}

// 2. Test Occupied Flat with Partial Overdue Arrears of 6000 (Flat 103)
const l2 = generatePropertyLedgerData('p2');
console.log('Flat 103 - Total Billed:', l2.totalBilled, 'Total Received:', l2.totalReceived, 'Current Balance:', l2.currentBalance);
const lastRow = l2.rows[l2.rows.length - 1];
console.log('Last cycle (Oct 2026): Due:', lastRow.dueAmount, 'Received:', lastRow.receivedAmount, 'Running Bal:', lastRow.runningBalance, 'Status:', lastRow.status);
if (l2.currentBalance !== 6000 || lastRow.runningBalance !== 6000 || lastRow.status !== 'Partial') {
  throw new Error('Flat 103 partial arrears calculation failed');
}

// 3. Test Vacant Flat (Flat 119)
const l3 = generatePropertyLedgerData('p3');
console.log('Flat 119 - isVacant:', l3.isVacant, 'Current Balance:', l3.currentBalance);
if (!l3.isVacant || l3.currentBalance !== 0) {
  throw new Error('Flat 119 vacant property test failed');
}

console.log('\\nALL 3 PROPERTY LEDGER TEST CASES PASSED PERFECTLY!');
`;

try {
  vm.runInNewContext(testCode, { console });
} catch (e) {
  console.error('Test failed:', e);
  process.exit(1);
}
