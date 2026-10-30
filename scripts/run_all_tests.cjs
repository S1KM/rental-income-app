const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const testsDir = path.resolve(__dirname, '../tests');
const tests = fs.readdirSync(testsDir).filter(f => (f.endsWith('.js') || f.endsWith('.cjs')) && !f.startsWith('temp_'));

console.log('======================================================================');
console.log(`🚀 RUNNING ALL ${tests.length} PRODUCTION PRE-FLIGHT TEST SUITES`);
console.log('======================================================================\n');

let passed = 0;
let failed = 0;
const failures = [];
const startTime = Date.now();

tests.forEach((file, index) => {
  const t0 = Date.now();
  try {
    execSync(`node "${path.join(testsDir, file)}"`, { stdio: 'pipe' });
    const elapsed = Date.now() - t0;
    console.log(`[${String(index + 1).padStart(2, '0')}/${tests.length}] PASS (${elapsed}ms): ${file}`);
    passed++;
  } catch (err) {
    const elapsed = Date.now() - t0;
    console.error(`[${String(index + 1).padStart(2, '0')}/${tests.length}] FAIL (${elapsed}ms): ${file}`);
    failures.push({ file, err: err.stderr ? err.stderr.toString() : err.message });
    failed++;
  }
});

const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

console.log('\n======================================================================');
console.log(`📊 FINAL TEST RESULTS: ${passed} PASSED | ${failed} FAILED | ${tests.length} TOTAL in ${totalTime}s`);
console.log('======================================================================');

if (failures.length > 0) {
  console.log('\n❌ FAILED SUITES DETAIL:');
  failures.forEach(f => {
    console.log(`\n--- ${f.file} ---`);
    console.log(f.err);
  });
  process.exit(1);
} else {
  console.log('🎉 100% OF TESTS PASSED WITHOUT ANY ERRORS! READY FOR PRODUCTION DEPLOYMENT.');
  process.exit(0);
}
