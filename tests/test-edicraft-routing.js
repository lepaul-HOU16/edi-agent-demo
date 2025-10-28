/**
 * Test EDIcraft Agent Routing
 * Verifies that Minecraft and OSDU-related queries route to EDIcraft agent
 */

// Mock the agent classes
class MockGeneralKnowledgeAgent {
  async processQuery() {
    return { success: true, message: 'General response' };
  }
}

class MockEnhancedStrandsAgent {
  async processMessage() {
    return { success: true, message: 'Petrophysics response' };
  }
}

class MockRenewableProxyAgent {
  async processQuery() {
    return { success: true, message: 'Renewable response' };
  }
}

class MockMaintenanceStrandsAgent {
  async processMessage() {
    return { success: true, message: 'Maintenance response' };
  }
}

class MockEDIcraftAgent {
  async processMessage() {
    return { success: true, message: 'EDIcraft response' };
  }
}

// Test queries that should route to EDIcraft
const edicraftQueries = [
  'Show me wellbore trajectory in Minecraft',
  'Build a wellbore in minecraft',
  'Display horizon surface in Minecraft',
  'Show OSDU wellbore data',
  'Transform coordinates to UTM for Minecraft',
  'Track player position in Minecraft',
  'Create 3D wellbore visualization',
  'Show geological surface in Minecraft',
  'Visualize subsurface data in Minecraft',
  'Show well log data in Minecraft',
  'Display well log and minecraft visualization',
  'Build OSDU horizon in Minecraft'
];

// Test queries that should NOT route to EDIcraft
const nonEdicraftQueries = [
  'Calculate porosity for Well-001',
  'Show me wind farm layout',
  'What is the weather near my wells',
  'Show equipment status',
  'Analyze terrain for wind farm'
];

console.log('🧪 Testing EDIcraft Agent Routing\n');

// Simple pattern matching test (without full AgentRouter)
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

function testPatternMatching(query, shouldMatch) {
  const lowerQuery = query.toLowerCase();
  const matchedPatterns = edicraftPatterns.filter(pattern => pattern.test(lowerQuery));
  const matches = matchedPatterns.length > 0;
  
  const status = matches === shouldMatch ? '✅' : '❌';
  console.log(`${status} "${query}"`);
  
  if (matches && shouldMatch) {
    console.log(`   Matched patterns: ${matchedPatterns.map(p => p.source).slice(0, 2).join(', ')}`);
  } else if (!matches && !shouldMatch) {
    console.log(`   Correctly did not match EDIcraft patterns`);
  } else if (matches && !shouldMatch) {
    console.log(`   ERROR: Should NOT match but matched: ${matchedPatterns.map(p => p.source).join(', ')}`);
  } else {
    console.log(`   ERROR: Should match but did not match any patterns`);
  }
  
  return matches === shouldMatch;
}

console.log('Testing queries that SHOULD route to EDIcraft:\n');
let passedEdicraft = 0;
edicraftQueries.forEach(query => {
  if (testPatternMatching(query, true)) passedEdicraft++;
});

console.log('\n\nTesting queries that should NOT route to EDIcraft:\n');
let passedNonEdicraft = 0;
nonEdicraftQueries.forEach(query => {
  if (testPatternMatching(query, false)) passedNonEdicraft++;
});

console.log('\n\n📊 Test Results:');
console.log(`EDIcraft queries: ${passedEdicraft}/${edicraftQueries.length} passed`);
console.log(`Non-EDIcraft queries: ${passedNonEdicraft}/${nonEdicraftQueries.length} passed`);
console.log(`Total: ${passedEdicraft + passedNonEdicraft}/${edicraftQueries.length + nonEdicraftQueries.length} passed`);

const allPassed = passedEdicraft === edicraftQueries.length && passedNonEdicraft === nonEdicraftQueries.length;
if (allPassed) {
  console.log('\n✅ All tests passed!');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed');
  process.exit(1);
}
