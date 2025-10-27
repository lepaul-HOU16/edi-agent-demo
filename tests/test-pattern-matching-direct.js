#!/usr/bin/env node

/**
 * Direct Pattern Matching Test
 * Tests the pattern matching logic without invoking Lambda
 */

// Import the ProjectListHandler
const { ProjectListHandler } = require('../amplify/functions/shared/projectListHandler.ts');

console.log('═══════════════════════════════════════════════════════════');
console.log('  Direct Pattern Matching Test');
console.log('═══════════════════════════════════════════════════════════\n');

// Test queries
const testCases = [
  {
    query: 'Analyze terrain at coordinates 35.067482, -101.395466 in Texas',
    expectedProjectList: false,
    description: 'Terrain analysis query'
  },
  {
    query: 'analyze terrain at 40.7128, -74.0060',
    expectedProjectList: false,
    description: 'Terrain analysis query (lowercase)'
  },
  {
    query: 'list my renewable projects',
    expectedProjectList: true,
    description: 'Project list query'
  },
  {
    query: 'show my projects',
    expectedProjectList: true,
    description: 'Project list query (show)'
  },
  {
    query: 'what projects do I have',
    expectedProjectList: true,
    description: 'Project list query (what)'
  },
  {
    query: 'optimize layout for my project',
    expectedProjectList: false,
    description: 'Layout optimization query'
  },
  {
    query: 'run wake simulation',
    expectedProjectList: false,
    description: 'Simulation query'
  },
  {
    query: 'generate comprehensive report',
    expectedProjectList: false,
    description: 'Report generation query'
  }
];

let passed = 0;
let failed = 0;

console.log('Testing isProjectListQuery() method:\n');

for (const testCase of testCases) {
  const result = ProjectListHandler.isProjectListQuery(testCase.query);
  const success = result === testCase.expectedProjectList;
  
  if (success) {
    console.log(`✅ PASS: ${testCase.description}`);
    console.log(`   Query: "${testCase.query}"`);
    console.log(`   Result: ${result} (expected: ${testCase.expectedProjectList})\n`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${testCase.description}`);
    console.log(`   Query: "${testCase.query}"`);
    console.log(`   Result: ${result} (expected: ${testCase.expectedProjectList})\n`);
    failed++;
  }
}

// Test project details queries
console.log('\nTesting isProjectDetailsQuery() method:\n');

const detailsTestCases = [
  {
    query: 'show project claude-texas-wind-farm-10',
    expectedMatch: true,
    expectedName: 'claude-texas-wind-farm-10',
    description: 'Project details query'
  },
  {
    query: 'show claude-texas-wind-farm-10',
    expectedMatch: false,
    description: 'Query without "project" keyword'
  },
  {
    query: 'details for project my-wind-farm',
    expectedMatch: true,
    expectedName: 'my-wind-farm',
    description: 'Project details query (details for)'
  }
];

for (const testCase of detailsTestCases) {
  const result = ProjectListHandler.isProjectDetailsQuery(testCase.query);
  const success = result.isMatch === testCase.expectedMatch &&
                  (!testCase.expectedName || result.projectName === testCase.expectedName);
  
  if (success) {
    console.log(`✅ PASS: ${testCase.description}`);
    console.log(`   Query: "${testCase.query}"`);
    console.log(`   Result: isMatch=${result.isMatch}, projectName=${result.projectName}\n`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${testCase.description}`);
    console.log(`   Query: "${testCase.query}"`);
    console.log(`   Result: isMatch=${result.isMatch}, projectName=${result.projectName}`);
    console.log(`   Expected: isMatch=${testCase.expectedMatch}, projectName=${testCase.expectedName}\n`);
    failed++;
  }
}

// Summary
console.log('═══════════════════════════════════════════════════════════');
console.log('  TEST SUMMARY');
console.log('═══════════════════════════════════════════════════════════\n');
console.log(`   Total Tests: ${passed + failed}`);
console.log(`   Passed: ${passed}`);
console.log(`   Failed: ${failed}\n`);

if (failed === 0) {
  console.log('✅ ALL TESTS PASSED - Pattern matching is working correctly!');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED - Pattern matching needs attention');
  process.exit(1);
}
