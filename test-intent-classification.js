// Quick test to see how the query is being classified

const query = "Perform financial analysis and ROI calculation";
const lowerQuery = query.toLowerCase();

console.log('Testing query:', query);
console.log('');

// Test report_generation patterns
const reportPatterns = [
  /financial\s+analysis/i,
  /roi\s+calculation/i,
];

console.log('Report Generation Pattern Matches:');
reportPatterns.forEach((pattern, i) => {
  const matches = pattern.test(query);
  console.log(`  ${i + 1}. ${pattern} => ${matches ? '✅ MATCH' : '❌ NO MATCH'}`);
});

console.log('');

// Test terrain_analysis patterns
const terrainPatterns = [
  /terrain.*analysis/i,
  /analyz.*terrain/i,
];

console.log('Terrain Analysis Pattern Matches:');
terrainPatterns.forEach((pattern, i) => {
  const matches = pattern.test(query);
  console.log(`  ${i + 1}. ${pattern} => ${matches ? '✅ MATCH' : '❌ NO MATCH'}`);
});

console.log('');

// Test terrain exclusions
const terrainExclusions = [
  /financial/i,
  /roi/i,
];

console.log('Terrain Analysis Exclusion Matches:');
terrainExclusions.forEach((pattern, i) => {
  const matches = pattern.test(query);
  console.log(`  ${i + 1}. ${pattern} => ${matches ? '✅ EXCLUDED' : '❌ NOT EXCLUDED'}`);
});

console.log('');
console.log('Expected: report_generation should win because:');
console.log('  1. It matches /financial\\s+analysis/i');
console.log('  2. It matches /roi\\s+calculation/i');
console.log('  3. Terrain is excluded by /financial/i and /roi/i');
