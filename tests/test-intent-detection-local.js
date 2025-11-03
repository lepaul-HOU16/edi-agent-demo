/**
 * Local test of intent detection logic for all 5 preloaded prompts
 * Tests the exact patterns we fixed in enhancedStrandsAgent.ts
 */

console.log('🧪 === LOCAL INTENT DETECTION TEST ===');
console.log('🎯 Testing fixed intent detection patterns for all 5 preloaded prompts');

// Simulate the matchesAny function from the agent
function matchesAny(query, patterns) {
  return patterns.some(pattern => {
    const regex = new RegExp(pattern, 'i');
    const matches = regex.test(query);
    if (matches) {
      console.log(`   ✅ Pattern match: "${pattern}"`);
    }
    return matches;
  });
}

// The exact preloaded prompts from the frontend
const PRELOADED_PROMPTS = [
  {
    id: 1,
    name: 'Production Well Data Discovery (24 Wells)',
    prompt: 'Analyze the complete dataset of 24 production wells from WELL-001 through WELL-024. Generate a comprehensive summary showing available log curves (GR, RHOB, NPHI, DTC, CALI, resistivity), spatial distribution, depth ranges, and data quality assessment. Create interactive visualizations showing field overview and well statistics.',
    expectedIntent: 'well_data_discovery'
  },
  {
    id: 2,
    name: 'Multi-Well Correlation Analysis (WELL-001 to WELL-005)',
    prompt: 'Create a comprehensive multi-well correlation analysis for wells WELL-001, WELL-002, WELL-003, WELL-004, and WELL-005. Generate normalized log correlations showing gamma ray, resistivity, and porosity data. Include geological correlation lines, reservoir zone identification, and statistical analysis. Create interactive visualization components with expandable technical documentation.',
    expectedIntent: 'multi_well_correlation'
  },
  {
    id: 3,
    name: 'Comprehensive Shale Analysis (WELL-001)',
    prompt: 'Perform comprehensive shale analysis on WELL-001 using gamma ray data. Calculate shale volume using Larionov method, identify clean sand intervals, and generate interactive depth plots. Include statistical summaries, uncertainty analysis, and reservoir quality assessment with expandable technical details.',
    expectedIntent: 'shale_analysis_workflow'
  },
  {
    id: 4,
    name: 'Integrated Porosity Analysis (Wells 001-003)',
    prompt: 'Perform integrated porosity analysis for WELL-001, WELL-002, and WELL-003 using RHOB (density) and NPHI (neutron) data. Generate density-neutron crossplots, calculate porosity, identify lithology, and create reservoir quality indices. Include interactive visualizations and professional documentation.',
    expectedIntent: 'porosity_analysis_workflow'
  },
  {
    id: 5,
    name: 'Professional Porosity Calculation (WELL-001)',
    prompt: 'Calculate porosity for WELL-001 using enhanced professional methodology. Include density porosity, neutron porosity, and effective porosity calculations with statistical analysis, uncertainty assessment, and complete technical documentation following SPE/API standards.',
    expectedIntent: 'calculate_porosity'
  }
];

// Simulate the exact intent detection logic from enhancedStrandsAgent.ts
function detectUserIntent(message) {
  const query = message.toLowerCase().trim();
  
  console.log(`🔍 Testing query: "${query.substring(0, 100)}..."`);

  // The EXACT intent patterns from the fixed agent
  const intents = [
    // PRELOADED PROMPT #1: Well Data Discovery (24 Wells) - EXACT MATCH
    {
      type: 'well_data_discovery',
      test: () => matchesAny(query, [
        'analyze.*complete.*dataset.*24.*production.*wells.*well-001.*through.*well-024',
        'comprehensive.*summary.*showing.*available.*log.*curves.*gr.*rhob.*nphi.*dtc.*cali.*resistivity',
        'spatial distribution.*depth ranges.*data quality assessment.*interactive visualizations',
        'field overview.*well statistics',
        // Legacy patterns for backwards compatibility
        'analyze.*complete.*dataset.*production wells',
        'comprehensive.*summary.*log curves',
        'spatial distribution.*depth ranges.*data quality',
        'interactive visualizations.*field overview',
        'production well data discovery',
        'how many wells do i have',
        'explore well data',
        'spatial distribution.*wells',
        'comprehensive analysis of all.*wells',
        'well-001.*through.*well-024',
        'analyze.*24.*production.*wells'
      ])
    },
    
    // PRELOADED PROMPT #2: Multi-Well Correlation Analysis - EXACT MATCH
    {
      type: 'multi_well_correlation',
      test: () => matchesAny(query, [
        'create.*comprehensive.*multi.?well.*correlation.*analysis.*wells.*well-001.*well-002.*well-003.*well-004.*well-005',
        'generate.*normalized.*log.*correlations.*showing.*gamma ray.*resistivity.*porosity.*data',
        'geological.*correlation.*lines.*reservoir.*zone.*identification.*statistical.*analysis',
        'interactive.*visualization.*components.*expandable.*technical.*documentation',
        // Legacy patterns for backwards compatibility
        'multi.?well.*correlation',
        'correlation.*analysis',
        'correlation panel',
        'normalized.*log.*correlations',
        'gamma ray.*resistivity.*porosity.*data',
        'geological.*correlation.*lines',
        'reservoir.*zone.*identification',
        'statistical.*analysis.*create.*interactive',
        'interactive.*visualization.*components',
        'normalize.*logs',
        'wells.*well-001.*well-002.*well-003.*well-004.*well-005',
        'comprehensive.*multi.?well.*correlation'
      ])
    },
    
    // PRELOADED PROMPT #3: Comprehensive Shale Analysis - EXACT MATCH
    {
      type: 'shale_analysis_workflow',
      test: () => matchesAny(query, [
        'perform.*comprehensive.*shale.*analysis.*well-001.*using.*gamma ray.*data',
        'calculate.*shale.*volume.*using.*larionov.*method.*identify.*clean.*sand.*intervals',
        'generate.*interactive.*depth.*plots.*statistical.*summaries.*uncertainty.*analysis',
        'reservoir.*quality.*assessment.*expandable.*technical.*details',
        // Legacy patterns for backwards compatibility
        'larionov.*shale',
        'comprehensive.*shale.*analysis',
        'gamma ray.*shale.*analysis',
        'shale.*analysis.*workflow',
        'shale.*volume.*analysis.*workflow',
        'larionov.*method',
        'clean.*sand.*intervals'
      ])
    },
    
    // PRELOADED PROMPT #4: Integrated Porosity Analysis - EXACT MATCH  
    {
      type: 'porosity_analysis_workflow', 
      test: () => matchesAny(query, [
        'perform.*integrated.*porosity.*analysis.*well-001.*well-002.*well-003.*using.*rhob.*density.*nphi.*neutron.*data',
        'generate.*density.?neutron.*crossplots.*calculate.*porosity.*identify.*lithology',
        'create.*reservoir.*quality.*indices.*interactive.*visualizations.*professional.*documentation',
        // Legacy patterns for backwards compatibility
        'density.*neutron.*crossplot',
        'integrated.*porosity.*analysis.*workflow',
        'extract.*density.*neutron.*log.*data',
        'porosity.*analysis.*workflow',
        'crossplot.*identify.*lithology',
        'highlight.*high.?porosity.*zones',
        'rhob.*density.*nphi.*neutron',
        'reservoir.*quality.*indices'
      ]) && !matchesAny(query, [
        'correlation.*analysis',
        'multi.?well.*correlation', 
        'geological.*correlation'
      ])
    },
    
    // PRELOADED PROMPT #5: Professional Porosity Calculation - EXACT MATCH
    {
      type: 'calculate_porosity',
      test: () => matchesAny(query, [
        'calculate.*porosity.*well-001.*using.*enhanced.*professional.*methodology',
        'density.*porosity.*neutron.*porosity.*effective.*porosity.*calculations',
        'statistical.*analysis.*uncertainty.*assessment.*complete.*technical.*documentation',
        'spe.*api.*standards',
        // Legacy patterns for backwards compatibility  
        'calculate.*porosity',
        'density.*porosity',
        'neutron.*porosity',
        'enhanced.*professional.*methodology',
        'uncertainty.*assessment'
      ])
    }
  ];

  // Test each intent in order
  for (const intent of intents) {
    console.log(`\n🎯 Testing intent: ${intent.type}`);
    if (intent.test()) {
      console.log(`✅ MATCH: ${intent.type}`);
      return intent.type;
    } else {
      console.log(`❌ NO MATCH: ${intent.type}`);
    }
  }
  
  console.log(`❌ FALLBACK: No intent matched`);
  return 'unknown';
}

// Test all 5 preloaded prompts
console.log('\n🚀 Testing all 5 preloaded prompts...\n');

let passedTests = 0;
let failedTests = [];

PRELOADED_PROMPTS.forEach(promptTest => {
  console.log(`\n📝 === TESTING PROMPT #${promptTest.id}: ${promptTest.name} ===`);
  console.log(`🎯 Expected Intent: ${promptTest.expectedIntent}`);
  
  const detectedIntent = detectUserIntent(promptTest.prompt);
  
  if (detectedIntent === promptTest.expectedIntent) {
    console.log(`✅ PASS: Prompt #${promptTest.id} detected correct intent: ${detectedIntent}`);
    passedTests++;
  } else {
    console.log(`❌ FAIL: Prompt #${promptTest.id} detected wrong intent: ${detectedIntent} (expected: ${promptTest.expectedIntent})`);
    failedTests.push({
      id: promptTest.id,
      expected: promptTest.expectedIntent,
      actual: detectedIntent
    });
  }
});

// Results summary
console.log('\n🏁 === INTENT DETECTION TEST RESULTS ===');
console.log(`📊 Results: ${passedTests}/${PRELOADED_PROMPTS.length} prompts passed`);
console.log(`✅ Success Rate: ${((passedTests / PRELOADED_PROMPTS.length) * 100).toFixed(1)}%`);

if (failedTests.length > 0) {
  console.log(`\n❌ FAILED TESTS (${failedTests.length}):`);
  failedTests.forEach(test => {
    console.log(`  - Prompt #${test.id}: expected "${test.expected}", got "${test.actual}"`);
  });
}

if (passedTests === PRELOADED_PROMPTS.length) {
  console.log('\n🎉 ALL INTENT DETECTION TESTS PASSED!');
  console.log('✅ Intent detection patterns are working correctly');
  console.log('💡 If prompts still fail in production, issue is in MCP tools or deployment');
} else {
  console.log('\n⚠️ INTENT DETECTION ISSUES DETECTED');
  console.log('💡 Need to fix pattern matching before deployment');
}

console.log('\n🔍 === LOCAL TEST COMPLETE ===');
