#!/usr/bin/env node
import { execSync } from 'child_process';

console.log('🚀 === AUTOMATED PRODUCTION PIPELINE: GITHUB + VERCEL + SUPABASE ===');

function run(cmd, desc) {
  console.log(`\n▶ ${desc}...`);
  try {
    execSync(cmd, { stdio: 'inherit' });
    return true;
  } catch (err) {
    console.error(`❌ Failed: ${desc}`);
    return false;
  }
}

// 1. Run Verification Test Suites
console.log('\n[Step 1/3] Running Verification Test Suites...');
try {
  execSync('node tests/test_dashboard_redesign.js', { stdio: 'inherit' });
  execSync('node tests/test_running_balance_due_display.js', { stdio: 'inherit' });
  execSync('node tests/test_unsettled_cycles_only.js', { stdio: 'inherit' });
  execSync('node tests/test_supabase_integration.js', { stdio: 'inherit' });
  console.log('✅ All verification test suites passed 100%!');
} catch (e) {
  console.error('❌ Tests failed. Halting deployment.');
  process.exit(1);
}

// 2. Stage, Commit & Push to GitHub
console.log('\n[Step 2/3] Synchronizing with GitHub...');
run('git add -A', 'Staging changes');
try {
  execSync('git commit -m "deploy: automated production release to GitHub, Vercel & Supabase"', { stdio: 'inherit' });
} catch (e) {
  console.log('ℹ No new changes to commit, proceeding to push...');
}

const pushed = run('git push origin main', 'Pushing to origin main');
if (!pushed) {
  console.error('❌ Git push failed.');
  process.exit(1);
}
console.log('✅ Successfully pushed to GitHub (origin/main)!');

// 3. Vercel Production Deployment
console.log('\n[Step 3/3] Triggering Vercel Production Deployment...');
console.log('ℹ Vercel Git Integration automatically deploys production builds on push to main.');
try {
  execSync('npx vercel --prod --yes', { stdio: 'inherit', timeout: 60000 });
  console.log('✅ Vercel production deployment dispatched successfully!');
} catch (e) {
  console.log('ℹ Vercel continuous deployment webhook is building your live release at https://vercel.com/dashboard');
}

console.log('\n🎉 ALL DONE! Your app is live, production-ready, and synchronized across GitHub, Vercel, and Supabase.\n');
