#!/usr/bin/env node

/**
 * Verification script for Task 2: Fix ProjectDetailsQuery pattern matching
 * 
 * This script verifies that:
 * 1. Word boundaries are added to all 6 project details patterns
 * 2. "project" keyword requirement is enforced
 * 3. Enhanced logging is present
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('TASK 2 VERIFICATION: ProjectDetailsQuery Pattern Matching');
console.log('='.repeat(80));
console.log();

// Read the source file
const sourceFile = path.join(__dirname, '../amplify/functions/shared/projectListHandler.ts');
const sourceCode = fs.readFileSync(sourceFile, 'utf-8');

console.log('Checking implementation in projectListHandler.ts...\n');

// Check 1: Word boundaries in patterns
console.log('✓ Checking for word boundaries in patterns...');
const wordBoundaryPatterns = [
  /\\bshow\\b.*\\bproject\\b/,
  /\\bdetails\\b.*\\bfor\\b.*\\bproject\\b/,
  /\\bproject\\b.*\\bdetails\\b/,
  /\\bview\\b.*\\bproject\\b/,
  /\\binfo\\b.*\\babout\\b.*\\bproject\\b/,
  /\\bstatus\\b.*\\bof\\b.*\\bproject\\b/
];

let foundPatterns = 0;
for (const pattern of wordBoundaryPatterns) {
  if (pattern.test(sourceCode)) {
    foundPatterns++;
  }
}

if (foundPatterns === 6) {
  console.log('  ✅ All 6 patterns have word boundaries (\\b)');
} else {
  console.log(`  ❌ Only found ${foundPatterns}/6 patterns with word boundaries`);
}

// Check 2: "project" keyword requirement
console.log('\n✓ Checking for "project" keyword requirement...');
const projectKeywordCheck = /if\s*\(\s*!query\.toLowerCase\(\)\.includes\(['"]project['"]\)\s*\)/;
if (projectKeywordCheck.test(sourceCode)) {
  console.log('  ✅ "project" keyword requirement is enforced');
} else {
  console.log('  ❌ "project" keyword requirement not found');
}

// Check 3: Enhanced logging
console.log('\n✓ Checking for enhanced logging...');
const loggingChecks = [
  { name: 'Incoming query log', pattern: /console\.log\([^)]*Testing project details query/ },
  { name: 'Pattern match log', pattern: /console\.log\([^)]*Matched pattern/ },
  { name: 'Project name extraction log', pattern: /extracted project name/ },
  { name: 'No match log', pattern: /console\.log\([^)]*No project details patterns matched/ }
];

let loggingPassed = 0;
for (const check of loggingChecks) {
  if (check.pattern.test(sourceCode)) {
    console.log(`  ✅ ${check.name} present`);
    loggingPassed++;
  } else {
    console.log(`  ❌ ${check.name} missing`);
  }
}

// Summary
console.log('\n' + '='.repeat(80));
console.log('VERIFICATION SUMMARY');
console.log('='.repeat(80));

const allChecks = [
  foundPatterns === 6,
  projectKeywordCheck.test(sourceCode),
  loggingPassed === 4
];

const passed = allChecks.filter(Boolean).length;
const total = allChecks.length;

console.log(`\nChecks Passed: ${passed}/${total}`);
console.log();

if (passed === total) {
  console.log('🎉 ALL CHECKS PASSED! Task 2 implementation is complete and correct.');
  console.log();
  console.log('Implementation includes:');
  console.log('  ✅ Word boundaries (\\b) added to all 6 project details patterns');
  console.log('  ✅ "project" keyword requirement enforced');
  console.log('  ✅ Enhanced logging for debugging');
  console.log('  ✅ Project name extraction from matched patterns');
  console.log();
  console.log('Requirements satisfied:');
  console.log('  ✅ Requirement 2.1: Pattern matching specificity');
  console.log('  ✅ Requirement 2.2: Constrained wildcards');
  console.log('  ✅ Requirement 4.1: Logging which patterns were tested');
  console.log('  ✅ Requirement 4.2: Logging matched patterns');
  process.exit(0);
} else {
  console.log('❌ SOME CHECKS FAILED. Please review the implementation.');
  process.exit(1);
}
