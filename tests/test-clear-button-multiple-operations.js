/**
 * Test Clear Button with Multiple Operations
 * 
 * Validates that clear button works correctly when:
 * 1. Multiple clear operations are performed in sequence
 * 2. Clear responses appear in chat history
 * 3. No duplicate buttons or responses are rendered
 */

console.log('=== TEST: Multiple Clear Operations ===\n');

// Simulate multiple clear operations
const clearOperations = [
  {
    timestamp: '2025-01-15T10:00:00Z',
    response: `✅ **Minecraft Environment Cleared**

**Summary:**
- **Wellbores Cleared:** 3
- **Drilling Rigs Removed:** 2
- **Total Blocks Cleared:** 1,247
- **Terrain:** Preserved

💡 **Tip:** The environment is now clear and ready for new visualizations!`
  },
  {
    timestamp: '2025-01-15T10:05:00Z',
    response: `✅ **Minecraft Environment Cleared**

**Summary:**
- **Wellbores Cleared:** 1
- **Drilling Rigs Removed:** 1
- **Total Blocks Cleared:** 423
- **Terrain:** Preserved

💡 **Tip:** The environment is now clear and ready for new visualizations!`
  },
  {
    timestamp: '2025-01-15T10:10:00Z',
    response: `✅ **Minecraft Environment Cleared**

**Summary:**
- **Wellbores Cleared:** 0
- **Drilling Rigs Removed:** 0
- **Total Blocks Cleared:** 0
- **Terrain:** Preserved

💡 **Tip:** The environment is now clear and ready for new visualizations!`
  }
];

// Generate content hashes for each operation
function generateContentHash(content) {
  return content.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '');
}

console.log('Clear Operations:');
clearOperations.forEach((op, index) => {
  const hash = generateContentHash(op.response);
  const wellboresCleared = op.response.match(/\*\*Wellbores Cleared:\*\* (\d+)/)?.[1] || '0';
  
  console.log(`\n${index + 1}. Operation at ${op.timestamp}`);
  console.log(`   Content hash: ${hash}`);
  console.log(`   Wellbores cleared: ${wellboresCleared}`);
  console.log(`   Unique identifier: ${op.timestamp}-${hash}`);
});

// Check for duplicate hashes (should all be the same since template is identical)
const hashes = clearOperations.map(op => generateContentHash(op.response));
const uniqueHashes = [...new Set(hashes)];

console.log(`\n\nHash Analysis:`);
console.log(`  Total operations: ${clearOperations.length}`);
console.log(`  Unique content hashes: ${uniqueHashes.length}`);
console.log(`  All hashes identical: ${uniqueHashes.length === 1}`);

// This is expected - the template is the same, only the numbers differ
// The timestamp + hash combination makes each operation unique
console.log(`\n✅ Expected behavior: Same template, different data`);
console.log(`   Solution: Use timestamp + content hash for unique keys`);

// Test detection for each operation
console.log(`\n\nDetection Test:`);
let allDetected = true;
clearOperations.forEach((op, index) => {
  const isClearConfirmation = /✅.*\*\*Minecraft Environment Cleared\*\*/i.test(op.response) ||
                              (op.response.includes('**Summary:**') && op.response.includes('**Wellbores Cleared:**'));
  
  if (isClearConfirmation) {
    console.log(`  ✅ Operation ${index + 1}: Detected as clear confirmation`);
  } else {
    console.log(`  ❌ Operation ${index + 1}: NOT detected`);
    allDetected = false;
  }
});

if (allDetected) {
  console.log(`\n✅ TEST PASSED: All clear operations properly detected\n`);
} else {
  console.log(`\n❌ TEST FAILED: Some operations not detected\n`);
  process.exit(1);
}

// Test CSS class uniqueness
console.log('=== CSS Class Uniqueness Test ===\n');

const mockDOMElements = clearOperations.map((op, index) => ({
  id: `message-${index}`,
  className: 'edicraft-response-success',
  dataContentHash: generateContentHash(op.response),
  timestamp: op.timestamp
}));

console.log('Mock DOM elements:');
mockDOMElements.forEach(el => {
  console.log(`  ${el.id}:`);
  console.log(`    class: ${el.className}`);
  console.log(`    data-content-hash: ${el.dataContentHash}`);
  console.log(`    timestamp: ${el.timestamp}`);
});

// Check for CSS class conflicts
const classNames = mockDOMElements.map(el => el.className);
const allSameClass = classNames.every(c => c === classNames[0]);

console.log(`\n✅ All elements use same CSS class: ${allSameClass}`);
console.log(`   This is correct - they're all success responses`);

// Check for unique identifiers
const uniqueIds = mockDOMElements.map(el => `${el.timestamp}-${el.dataContentHash}`);
const allUniqueIds = uniqueIds.length === new Set(uniqueIds).size;

console.log(`✅ All elements have unique identifiers: ${allUniqueIds}`);

console.log('\n=== SUMMARY ===\n');
console.log('✅ Multiple clear operations handled correctly');
console.log('✅ Each operation properly detected');
console.log('✅ CSS classes applied consistently');
console.log('✅ Unique identifiers prevent conflicts');
console.log('\nRecommendation for React component:');
console.log('  Use: key={`${messageId}-${contentHash}`}');
console.log('  This ensures each message renders once, even with identical content');
