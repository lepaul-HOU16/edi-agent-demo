/**
 * Quick verification script for horizon detection patterns
 * Tests that the new patterns correctly match horizon-related queries
 */

// Test queries that should match EDIcraft patterns
const testQueries = [
  // Horizon finding patterns
  "find a horizon",
  "horizon find",
  "get horizon name",
  "horizon name",
  "list horizons",
  "show horizon",
  
  // Coordinate conversion patterns
  "convert coordinates",
  "coordinates convert",
  "convert to minecraft",
  "minecraft convert",
  "coordinates for minecraft",
  "minecraft coordinates",
  
  // Combined horizon + coordinate patterns
  "horizon coordinates",
  "coordinates horizon",
  "horizon minecraft",
  "minecraft horizon",
  "horizon convert",
  "convert horizon",
  
  // Natural language patterns
  "tell me the horizon",
  "horizon tell me",
  "what horizon",
  "which horizon",
  "where is the horizon",
  "horizon where",
  
  // Coordinate output patterns
  "coordinates you use",
  "coordinates to use",
  "print coordinates",
  "output coordinates",
  
  // Complex user query (the actual issue)
  "find a horizon, tell me its name, convert it to minecraft coordinates and print out the coordinates you'd use to show it in minecraft"
];

// EDIcraft patterns from agentRouter.ts
const edicraftPatterns = [
  // Core Minecraft patterns
  /minecraft/i,
  
  // Wellbore trajectory patterns
  /wellbore.*trajectory|trajectory.*wellbore/i,
  /build.*wellbore|wellbore.*build/i,
  /osdu.*wellbore/i,
  /3d.*wellbore|wellbore.*path/i,
  
  // Horizon surface patterns
  /horizon.*surface|surface.*horizon/i,
  /build.*horizon|render.*surface/i,
  /osdu.*horizon/i,
  /geological.*surface/i,
  
  // NEW: Horizon finding and naming patterns
  /find.*horizon|horizon.*find/i,
  /get.*horizon|horizon.*name/i,
  /list.*horizon|show.*horizon/i,
  
  // NEW: Coordinate conversion patterns (more flexible)
  /convert.*coordinates|coordinates.*convert/i,
  /convert.*to.*minecraft|minecraft.*convert/i,
  /coordinates.*for.*minecraft|minecraft.*coordinates/i,
  
  // NEW: Combined horizon + coordinate patterns (HIGHEST PRIORITY)
  /horizon.*coordinates|coordinates.*horizon/i,
  /horizon.*minecraft|minecraft.*horizon/i,
  /horizon.*convert|convert.*horizon/i,
  
  // NEW: Natural language patterns
  /tell.*me.*horizon|horizon.*tell.*me/i,
  /what.*horizon|which.*horizon/i,
  /where.*horizon|horizon.*where/i,
  
  // NEW: Coordinate output patterns
  /coordinates.*you.*use|coordinates.*to.*use/i,
  /print.*coordinates|output.*coordinates/i,
  
  // Coordinate and position patterns
  /player.*position/i,
  /coordinate.*tracking/i,
  /transform.*coordinates/i,
  /utm.*minecraft/i,
  
  // Visualization patterns
  /minecraft.*visualization/i,
  /visualize.*minecraft/i,
  /subsurface.*visualization/i,
  /show.*in.*minecraft|display.*in.*minecraft|render.*in.*minecraft/i,
  
  // Combined patterns - well log + minecraft (priority over petrophysics)
  /well.*log.*minecraft|log.*minecraft/i,
  /well.*log.*and.*minecraft|minecraft.*and.*well.*log/i
];

console.log('🧪 Testing Horizon Detection Patterns\n');
console.log('=' .repeat(80));

let passCount = 0;
let failCount = 0;

testQueries.forEach((query, index) => {
  const lowerQuery = query.toLowerCase();
  const matchedPatterns = edicraftPatterns.filter(pattern => pattern.test(lowerQuery));
  
  if (matchedPatterns.length > 0) {
    console.log(`✅ Test ${index + 1}: PASS`);
    console.log(`   Query: "${query}"`);
    console.log(`   Matched ${matchedPatterns.length} pattern(s):`);
    matchedPatterns.forEach(p => {
      console.log(`     - ${p.source}`);
    });
    passCount++;
  } else {
    console.log(`❌ Test ${index + 1}: FAIL`);
    console.log(`   Query: "${query}"`);
    console.log(`   No patterns matched!`);
    failCount++;
  }
  console.log('');
});

console.log('=' .repeat(80));
console.log(`\n📊 Results: ${passCount} passed, ${failCount} failed out of ${testQueries.length} tests`);

if (failCount === 0) {
  console.log('✅ All horizon detection patterns working correctly!');
  process.exit(0);
} else {
  console.log('❌ Some patterns failed to match. Review the patterns.');
  process.exit(1);
}
