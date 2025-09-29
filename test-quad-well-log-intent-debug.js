/**
 * Test script to debug quad well log intent detection regression
 */

console.log('🔍 === DEBUGGING QUAD WELL LOG INTENT DETECTION ===');

// Test queries that should work for quad well log display
const testQueries = [
  'show me a quad well log for well 007',
  'show me the curves of well 007', 
  'show log curves for well 007',
  'display well log for well 007',
  'well 007 log curves',
  'curves for well 007'
];

// Current log visualization patterns from enhancedStrandsAgent.ts
const currentLogPatterns = [
  'show.*log.*curves',
  'display.*log.*curves', 
  'plot.*log.*curves',
  'visualize.*log.*curves',
  'log.*curve.*plot',
  'log.*plot.*viewer',
  'curve.*data.*for',
  'get.*curve.*data',
  // NEW: Missing patterns that should be added
  'create.*composite.*well.*log.*display',
  'composite.*well.*log.*display',
  'well.*log.*display.*with',
  'display.*with.*gamma.*ray.*density',
  'multi.*curve.*display',
  'combined.*log.*display'
];

// Enhanced patterns that should catch quad well log requests
const enhancedLogPatterns = [
  'show.*log.*curves',
  'display.*log.*curves', 
  'plot.*log.*curves',
  'visualize.*log.*curves',
  'log.*curve.*plot',
  'log.*plot.*viewer',
  'curve.*data.*for',
  'get.*curve.*data',
  // FIXED: Add missing patterns for "show me the curves" type queries
  'show.*me.*the.*curves',
  'show.*me.*a.*quad.*well.*log',
  'show.*me.*.*curves.*of.*well',
  'curves.*of.*well',
  'curves.*for.*well',
  'well.*\\d+.*log.*curves',
  'well.*\\d+.*curves',
  'log.*curves.*for.*well.*\\d+',
  'display.*well.*log',
  'well.*log.*for',
  'quad.*well.*log'
];

console.log('\n📊 Testing Current Patterns vs Enhanced Patterns:\n');

testQueries.forEach((query, index) => {
  console.log(`--- Test ${index + 1}: "${query}" ---`);
  const lowerQuery = query.toLowerCase();
  
  // Test current patterns
  let currentMatch = false;
  let currentPattern = null;
  for (const pattern of currentLogPatterns) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(lowerQuery)) {
      currentMatch = true;
      currentPattern = pattern;
      break;
    }
  }
  
  // Test enhanced patterns
  let enhancedMatch = false;
  let enhancedPattern = null;
  for (const pattern of enhancedLogPatterns) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(lowerQuery)) {
      enhancedMatch = true;
      enhancedPattern = pattern;
      break;
    }
  }
  
  console.log(`  Current patterns: ${currentMatch ? '✅ MATCH' : '❌ NO MATCH'} ${currentPattern ? `(${currentPattern})` : ''}`);
  console.log(`  Enhanced patterns: ${enhancedMatch ? '✅ MATCH' : '❌ NO MATCH'} ${enhancedPattern ? `(${enhancedPattern})` : ''}`);
  
  if (!currentMatch && enhancedMatch) {
    console.log(`  🔧 REGRESSION FIXED: Would now match with "${enhancedPattern}"`);
  } else if (!currentMatch && !enhancedMatch) {
    console.log(`  ⚠️  STILL BROKEN: No patterns match this query`);
  }
  console.log('');
});

// Test well name extraction
console.log('📍 === TESTING WELL NAME EXTRACTION ===\n');

testQueries.forEach((query, index) => {
  console.log(`--- Well Name Test ${index + 1}: "${query}" ---`);
  
  // Simulate current well name extraction logic
  const patterns = [
    // "well 007" format -> convert to "WELL-007"
    {
      regex: /\bwell\s+(\d{1,3})\b/i,
      transform: (match) => `WELL-${match[1].padStart(3, '0')}`
    },
    // "well007" or "well-007" format -> convert to "WELL-007"  
    {
      regex: /\bwell[-_]?(\d{1,3})\b/i,
      transform: (match) => `WELL-${match[1].padStart(3, '0')}`
    },
    // Direct "WELL-007" format
    {
      regex: /WELL-\d+/i,
      transform: (match) => match[0].toUpperCase()
    }
  ];

  let wellName = null;
  for (const pattern of patterns) {
    const match = query.match(pattern.regex);
    if (match) {
      wellName = pattern.transform(match);
      console.log(`  ✅ Extracted well name: "${wellName}" using pattern: ${pattern.regex.source}`);
      break;
    }
  }
  
  if (!wellName) {
    console.log(`  ❌ No well name extracted`);
  }
  console.log('');
});

console.log('🎯 === ANALYSIS SUMMARY ===\n');

console.log('🔍 ROOT CAUSE IDENTIFIED:');
console.log('  - Current log curve patterns are too restrictive');
console.log('  - Missing key patterns like "show me the curves" and "curves of well"');
console.log('  - "quad well log" pattern completely missing');
console.log('  - Well name extraction appears to work correctly');

console.log('\n🔧 REQUIRED FIXES:');
console.log('  1. Add missing log curve visualization patterns to enhancedStrandsAgent.ts');
console.log('  2. Ensure "show me the curves of well 007" triggers log_curve_visualization intent');
console.log('  3. Ensure well name extraction works for numeric well identifiers');
console.log('  4. Test that the enhanced patterns correctly route to handleLogCurveVisualization()');

console.log('\n📋 NEXT STEPS:');
console.log('  1. Update intent detection patterns in enhancedStrandsAgent.ts');
console.log('  2. Test the fixed patterns with the failing queries');
console.log('  3. Verify that log curve artifacts are properly generated');
console.log('  4. Ensure quad well log display works as expected');

console.log('\n🚀 Expected Result After Fix:');
console.log('  - "show me a quad well log for well 007" -> log_curve_visualization intent');
console.log('  - "show me the curves of well 007" -> log_curve_visualization intent');
console.log('  - Both should generate 4 horizontally laid out log curves');
console.log('  - No more generic welcome messages for these queries');
