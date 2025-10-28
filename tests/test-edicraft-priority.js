/**
 * Test EDIcraft Priority Handling
 * Verifies that "well log" + "minecraft" queries route to EDIcraft over petrophysics
 */

console.log('🧪 Testing EDIcraft Priority Handling\n');

// Pattern definitions
const edicraftPatterns = [
  /minecraft/i,
  /wellbore.*trajectory|trajectory.*wellbore/i,
  /horizon.*surface|surface.*horizon/i,
  /build.*wellbore|wellbore.*build/i,
  /osdu.*wellbore/i,
  /3d.*wellbore|wellbore.*path/i,
  /build.*horizon|render.*surface/i,
  /osdu.*horizon/i,
  /geological.*surface/i,
  /player.*position/i,
  /coordinate.*tracking/i,
  /transform.*coordinates/i,
  /utm.*minecraft/i,
  /minecraft.*visualization/i,
  /visualize.*minecraft/i,
  /subsurface.*visualization/i,
  /show.*in.*minecraft|display.*in.*minecraft|render.*in.*minecraft/i,
  /well.*log.*minecraft|log.*minecraft/i,
  /well.*log.*and.*minecraft|minecraft.*and.*well.*log/i
];

const petrophysicsPatterns = [
  /well-\d+|WELL-\d+|analyze.*well.*\d+|analyze.*WELL.*\d+/,
  /log.*curves?|well.*logs?|las.*files?/,
  /(gr|rhob|nphi|dtc|cali).*analysis/,
  /gamma.*ray|density|neutron|resistivity.*data/,
  /calculate.*(porosity|shale|saturation|permeability)/,
  /formation.*evaluation|petrophysical.*analysis/
];

// Test cases for priority handling
const priorityTestCases = [
  {
    query: 'Show well log data in Minecraft',
    expectedAgent: 'edicraft',
    reason: 'Contains both "well log" and "minecraft" - should route to EDIcraft'
  },
  {
    query: 'Display well log and minecraft visualization',
    expectedAgent: 'edicraft',
    reason: 'Contains both "well log" and "minecraft" - should route to EDIcraft'
  },
  {
    query: 'Visualize log curves in Minecraft',
    expectedAgent: 'edicraft',
    reason: 'Contains both "log" and "minecraft" - should route to EDIcraft'
  },
  {
    query: 'Show well log data for Well-001',
    expectedAgent: 'petrophysics',
    reason: 'Contains "well log" but no "minecraft" - should route to petrophysics'
  },
  {
    query: 'Analyze log curves for Well-002',
    expectedAgent: 'petrophysics',
    reason: 'Contains "log" but no "minecraft" - should route to petrophysics'
  },
  {
    query: 'Calculate porosity from well logs',
    expectedAgent: 'petrophysics',
    reason: 'Contains "well logs" but no "minecraft" - should route to petrophysics'
  }
];

function determineAgent(query) {
  const lowerQuery = query.toLowerCase();
  
  // EDIcraft has HIGHEST priority - check first
  if (edicraftPatterns.some(pattern => pattern.test(lowerQuery))) {
    return 'edicraft';
  }
  
  // Then check petrophysics
  if (petrophysicsPatterns.some(pattern => pattern.test(lowerQuery))) {
    return 'petrophysics';
  }
  
  return 'other';
}

let passed = 0;
let failed = 0;

console.log('Testing priority handling for "well log" + "minecraft" queries:\n');

priorityTestCases.forEach((testCase, index) => {
  const actualAgent = determineAgent(testCase.query);
  const isCorrect = actualAgent === testCase.expectedAgent;
  
  const status = isCorrect ? '✅' : '❌';
  console.log(`${status} Test ${index + 1}: "${testCase.query}"`);
  console.log(`   Expected: ${testCase.expectedAgent}`);
  console.log(`   Actual: ${actualAgent}`);
  console.log(`   Reason: ${testCase.reason}`);
  console.log('');
  
  if (isCorrect) {
    passed++;
  } else {
    failed++;
  }
});

console.log('📊 Test Results:');
console.log(`Passed: ${passed}/${priorityTestCases.length}`);
console.log(`Failed: ${failed}/${priorityTestCases.length}`);

if (failed === 0) {
  console.log('\n✅ All priority tests passed!');
  console.log('✅ EDIcraft correctly has priority over petrophysics for "well log" + "minecraft" queries');
  process.exit(0);
} else {
  console.log('\n❌ Some priority tests failed');
  process.exit(1);
}
