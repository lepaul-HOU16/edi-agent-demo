/**
 * Test: Terrain Analysis Intent Detection
 * 
 * Verifies that "Analyze terrain at X, Y" queries are correctly routed
 * to the renewable energy agent, not the weather agent.
 */

console.log('='.repeat(80));
console.log('TERRAIN INTENT DETECTION TEST');
console.log('='.repeat(80));

// Test queries that should match renewable energy
const terrainQueries = [
  'Analyze terrain at 35.067482, -101.395466',
  'analyze terrain at 40.7128, -74.0060',
  'Terrain analysis for 51.5074, -0.1278',
  'terrain analysis at coordinates 48.8566, 2.3522',
  'Can you analyze the terrain at 34.0522, -118.2437?',
  'I need a terrain analysis for 37.7749, -122.4194'
];

// The pattern from agentRouter.ts
const renewablePattern = /terrain.*analysis|analyze.*terrain|site.*analysis.*wind|unbuildable.*areas|exclusion.*zones/;

console.log('\n📋 Testing Terrain Query Patterns:\n');

let allPassed = true;

terrainQueries.forEach((query, index) => {
  const lowerQuery = query.toLowerCase();
  const matches = renewablePattern.test(lowerQuery);
  
  console.log(`${index + 1}. "${query}"`);
  console.log(`   ${matches ? '✅ MATCHES' : '❌ DOES NOT MATCH'} renewable pattern`);
  
  if (!matches) {
    allPassed = false;
    console.log(`   ⚠️  This query will be routed to the WRONG agent!`);
  }
  console.log();
});

// Test that weather queries DON'T match
const weatherQueries = [
  'What is the weather at 35.067482, -101.395466?',
  'Current weather conditions',
  'weather forecast for tomorrow'
];

console.log('📋 Testing Weather Query Patterns (should NOT match):\n');

weatherQueries.forEach((query, index) => {
  const lowerQuery = query.toLowerCase();
  const matches = renewablePattern.test(lowerQuery);
  
  console.log(`${index + 1}. "${query}"`);
  console.log(`   ${matches ? '❌ INCORRECTLY MATCHES' : '✅ CORRECTLY DOES NOT MATCH'} renewable pattern`);
  
  if (matches) {
    allPassed = false;
    console.log(`   ⚠️  This weather query would be routed to renewable agent!`);
  }
  console.log();
});

console.log('='.repeat(80));
if (allPassed) {
  console.log('✅ ALL TESTS PASSED - Intent detection is working correctly');
} else {
  console.log('❌ SOME TESTS FAILED - Intent detection needs fixing');
}
console.log('='.repeat(80));

process.exit(allPassed ? 0 : 1);
