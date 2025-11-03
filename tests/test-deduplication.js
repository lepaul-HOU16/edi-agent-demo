#!/usr/bin/env node

/**
 * Test Deduplication Logic
 * 
 * This script tests the deduplication logic that was added to ChatBox.tsx
 * to ensure duplicate messages are properly removed.
 */

console.log('========================================');
console.log('DEDUPLICATION LOGIC TEST');
console.log('========================================\n');

// Simulate the deduplication logic from ChatBox.tsx
function deduplicateMessages(messages) {
  if (!messages || messages.length === 0) {
    return [];
  }
  
  // Use Map to deduplicate by ID
  return Array.from(
    new Map(messages.map(m => [m.id, m])).values()
  );
}

// Test Case 1: No duplicates
console.log('Test 1: No duplicates');
console.log('---------------------');
const messages1 = [
  { id: 'msg-1', content: 'Hello' },
  { id: 'msg-2', content: 'World' }
];
const result1 = deduplicateMessages(messages1);
console.log('Input:', messages1.length, 'messages');
console.log('Output:', result1.length, 'messages');
console.log('Expected: 2 messages');
console.log('Result:', result1.length === 2 ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test Case 2: One duplicate
console.log('Test 2: One duplicate');
console.log('---------------------');
const messages2 = [
  { id: 'msg-1', content: 'Hello' },
  { id: 'msg-1', content: 'Hello' },
  { id: 'msg-2', content: 'World' }
];
const result2 = deduplicateMessages(messages2);
console.log('Input:', messages2.length, 'messages');
console.log('Output:', result2.length, 'messages');
console.log('Expected: 2 messages (removed 1 duplicate)');
console.log('Result:', result2.length === 2 ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test Case 3: Multiple duplicates
console.log('Test 3: Multiple duplicates');
console.log('---------------------------');
const messages3 = [
  { id: 'msg-1', content: 'Hello' },
  { id: 'msg-1', content: 'Hello' },
  { id: 'msg-2', content: 'World' },
  { id: 'msg-2', content: 'World' },
  { id: 'msg-3', content: 'Test' }
];
const result3 = deduplicateMessages(messages3);
console.log('Input:', messages3.length, 'messages');
console.log('Output:', result3.length, 'messages');
console.log('Expected: 3 messages (removed 2 duplicates)');
console.log('Result:', result3.length === 3 ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test Case 4: All duplicates
console.log('Test 4: All duplicates');
console.log('----------------------');
const messages4 = [
  { id: 'msg-1', content: 'Hello' },
  { id: 'msg-1', content: 'Hello' },
  { id: 'msg-1', content: 'Hello' }
];
const result4 = deduplicateMessages(messages4);
console.log('Input:', messages4.length, 'messages');
console.log('Output:', result4.length, 'messages');
console.log('Expected: 1 message (removed 2 duplicates)');
console.log('Result:', result4.length === 1 ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test Case 5: Empty array
console.log('Test 5: Empty array');
console.log('-------------------');
const messages5 = [];
const result5 = deduplicateMessages(messages5);
console.log('Input:', messages5.length, 'messages');
console.log('Output:', result5.length, 'messages');
console.log('Expected: 0 messages');
console.log('Result:', result5.length === 0 ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test Case 6: Null/undefined
console.log('Test 6: Null/undefined');
console.log('----------------------');
const result6a = deduplicateMessages(null);
const result6b = deduplicateMessages(undefined);
console.log('Input: null');
console.log('Output:', result6a.length, 'messages');
console.log('Expected: 0 messages');
console.log('Result:', result6a.length === 0 ? '✅ PASS' : '❌ FAIL');
console.log('');

// Summary
console.log('========================================');
console.log('TEST SUMMARY');
console.log('========================================');
const allTests = [
  result1.length === 2,
  result2.length === 2,
  result3.length === 3,
  result4.length === 1,
  result5.length === 0,
  result6a.length === 0
];
const passedTests = allTests.filter(t => t).length;
const totalTests = allTests.length;

console.log(`Tests Passed: ${passedTests}/${totalTests}`);
console.log('');

if (passedTests === totalTests) {
  console.log('✅ All tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed!');
  process.exit(1);
}
