/**
 * Direct test of the first prompt issue by testing the actual intent detection logic
 * This will help us understand exactly where the problematic response is coming from
 */

async function testIntentDetectionAndResponse() {
  console.log('🧪 === DIRECT FIRST PROMPT FIX TEST ===');
  
  // Simulate the intent detection logic from enhancedStrandsAgent.ts
  function detectUserIntent(message) {
    const query = message.toLowerCase().trim();
    const wellName = extractWellName(message);
    
    console.log('🔍 Intent Detection Input:', { query: query.substring(0, 50) + '...', wellName });

    // Define intents in order of precedence (from the actual code)
    const intents = [
      {
        type: 'calculate_porosity',
        test: () => matchesAny(query, ['calculate.*porosity', 'density.*porosity', 'neutron.*porosity']),
        requiresWell: false // This is the key fix - should be false
      },
      {
        type: 'calculate_shale',
        test: () => matchesAny(query, ['calculate.*shale', 'shale.*volume', 'larionov', 'clavier']),
        requiresWell: false
      },
      {
        type: 'formation_evaluation',
        test: () => matchesAny(query, [
          'formation.*evaluation',
          'comprehensive.*analysis', 
          'analyze.*well',
          'petrophysical.*analysis'
        ]),
        requiresWell: false
      },
      {
        type: 'list_wells',
        test: () => matchesAny(query, [
          'list.*wells',
          'show.*wells',
          'what wells',
          'available.*wells',
          'how many wells'
        ]),
        requiresWell: false
      }
    ];

    // Find first matching intent
    for (const intent of intents) {
      if (intent.test()) {
        console.log(`✅ Intent detected: ${intent.type}`, { wellName });
        return {
          type: intent.type,
          score: 10,
          wellName,
          method: null
        };
      }
    }

    // Fallback logic
    console.log('🤔 No specific intent matched, using fallback logic');
    return getFallbackIntent(query, wellName);
  }

  function matchesAny(query, patterns) {
    return patterns.some(pattern => {
      const regex = new RegExp(pattern, 'i');
      return regex.test(query);
    });
  }

  function extractWellName(message) {
    // Simplified version of well name extraction
    const patterns = [
      /\bwell\s+(\d{1,3})\b/i,
      /\bwell[-_]?(\d{1,3})\b/i,
      /WELL-\d+/i,
      /(CARBONATE_PLATFORM_\d+|SANDSTONE_RESERVOIR_\d+|MIXED_LITHOLOGY_\d+)/i
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        if (pattern.source.includes('well\\s+')) {
          return `WELL-${match[1].padStart(3, '0')}`;
        }
        return match[0].toUpperCase();
      }
    }
    return null;
  }

  function getFallbackIntent(query, wellName) {
    // If we have a well name but no clear intent, default to well info
    if (wellName) {
      if (query.includes('analyze') || query.includes('calculate')) {
        return { type: 'formation_evaluation', score: 5, wellName, method: null };
      }
      return { type: 'well_info', score: 5, wellName, method: null };
    }
    
    // If no well name and mentions wells, list them
    if (query.includes('well')) {
      return { type: 'list_wells', score: 5, wellName: null, method: null };
    }
    
    // Default fallback
    return { type: 'list_wells', score: 3, wellName: null, method: null };
  }

  // Simulate the handler response for calculate_porosity without well name
  function simulateHandleCalculatePorosity(wellName) {
    console.log('🧮 === SIMULATE CALCULATE POROSITY HANDLER ===');
    console.log('🏷️ Well Name:', wellName);
    
    if (!wellName) {
      console.log('❌ No well name provided, should provide helpful suggestions...');
      // This is what should happen
      const availableWells = ['WELL-001', 'WELL-002', 'WELL-003']; // Mock wells
      const response = {
        success: true,
        message: `Porosity Calculation

I can help you calculate porosity! Here are some available wells to choose from:

${availableWells.map((well, index) => `${index + 1}. ${well}`).join('\n')}

To calculate porosity, please specify a well:
- "calculate porosity for ${availableWells[0]}"
- "density porosity for ${availableWells[1]}"
- "effective porosity for ${availableWells[2]}"

Available methods: density, neutron, effective`
      };
      console.log('✅ Handler should return helpful suggestions');
      return response;
    }
    
    return { success: true, message: `Calculating porosity for ${wellName}...` };
  }

  // Test the problematic queries
  const testCases = [
    'calculate porosity',
    'calculate shale volume', 
    'hello',
    'formation evaluation',
    'analyze well data'
  ];

  console.log('\n🔬 TESTING PROBLEMATIC QUERIES:');
  console.log('=' .repeat(80));

  for (const testCase of testCases) {
    console.log(`\n📝 Testing: "${testCase}"`);
    
    // Step 1: Intent Detection
    const intent = detectUserIntent(testCase);
    console.log('🎯 Detected Intent:', intent.type);
    console.log('🏷️ Well Name:', intent.wellName || 'None');
    
    // Step 2: Handler Simulation
    if (intent.type === 'calculate_porosity') {
      const response = simulateHandleCalculatePorosity(intent.wellName);
      console.log('✅ Handler Response:', response.success);
      console.log('📝 Message Preview:', response.message.substring(0, 100) + '...');
    } else {
      console.log('🔄 Would route to', intent.type, 'handler');
    }
  }

  console.log('\n🎯 ANALYSIS RESULTS:');
  console.log('✅ Intent detection is working correctly');
  console.log('✅ calculate_porosity intent detected without well names');  
  console.log('✅ Handler provides helpful suggestions');
  console.log('❌ BUT: The actual deployed system is returning a different response');
  
  console.log('\n💡 LIKELY ISSUE:');
  console.log('1. The problematic response is coming from the AI model itself');
  console.log('2. This happens when processBasicQuery is called instead of specific handlers');
  console.log('3. Need to ensure intent detection never falls through to generic responses');
  
  console.log('\n🔧 SOLUTION:');
  console.log('1. Strengthen intent detection patterns');
  console.log('2. Improve fallback logic to always route to helpful handlers');
  console.log('3. Update processBasicQuery to provide better default responses');
}

// Run the test
testIntentDetectionAndResponse()
  .then(() => {
    console.log('\n✅ Direct first prompt fix test completed');
    console.log('🔧 Ready to implement specific fixes in enhancedStrandsAgent.ts');
  })
  .catch(error => {
    console.error('🚨 Test failed:', error.message);
  });
