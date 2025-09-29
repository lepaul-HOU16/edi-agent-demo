/**
 * Test to validate the agent routing fix for "what is the weather near my wells"
 */

function testWeatherRoutingFix() {
    console.log('🌤️ Testing Weather Routing Fix');
    console.log('==============================');

    // Mock the updated agent router logic
    const mockAgentRouter = {
        determineAgentType(message) {
            const lowerMessage = message.toLowerCase();
            
            // Priority 1: Weather queries (HIGHEST PRIORITY - must come first)
            const weatherPatterns = [
              /weather.*near.*wells?/,  // "weather near my wells"
              /weather.*near.*my.*wells?/,  // "weather near my wells" 
              /weather.*in|temperature.*in|forecast.*for|climate.*in/,
              /what.*weather|how.*weather|current.*weather/,
              /weather.*conditions/,
              /temperature.*near|forecast.*near|climate.*near/
            ];

            // Priority 2: Other general knowledge patterns
            const generalPatterns = [      
              // Regulatory/legal queries  
              /eu ai.*regulation|gdpr|legal.*requirement|compliance/,
              /regulation.*regarding|law.*about|government.*standard/,
              
              // General conversational patterns
              /^(what|how|why|when|where)\s+(is|are|was|were|do|does|did|can|could|should|would)/,
              /explain.*to.*me|tell.*me.*about|help.*me.*understand/,
              /what.*does.*mean|define|definition.*of/,
              
              // General knowledge questions
              /latest.*news|current.*events|recent.*development/,
              /market.*trend|industry.*news|economic/,
              
              // Conversational starters
              /^(hi|hello|hey|good morning|good afternoon)/,
              /^(can you|could you|please|help)/
            ];

            // Priority 3: Catalog/geographic patterns
            const catalogPatterns = [
              // Geographic searches
              /wells?.*in.*region|wells?.*in.*area|wells?.*offshore/,
              /show.*wells?.*in|find.*wells?.*near|wells?.*around/,
              /map.*of.*wells?|geographic.*distribution|spatial.*analysis/,
              /south china sea|gulf.*of.*mexico|north sea/,
              
              // Well discovery without specific analysis
              /show.*all.*wells?|list.*all.*wells?|wells?.*available/,
              /field.*overview.*map|well.*location|geographic.*search/
            ];

            // Priority 4: Petrophysics patterns
            const petrophysicsPatterns = [
              // Specific calculations
              /calculate.*(porosity|shale|saturation|permeability)/,
              /formation.*evaluation|petrophysical.*analysis/,
              /(density|neutron|gamma.*ray).*analysis/,
              
              // Well-specific analysis
              /well-\d+|analyze.*well.*\d+|formation.*evaluation.*for/,
              /log.*curve|well.*log|las.*file/,
              
              // Technical petroleum engineering
              /larionov|archie|kozeny.*carman|timur/,
              /crossplot|correlation.*panel|multi.*well.*correlation/,
              /reservoir.*quality|completion.*target|net.*pay/
            ];

            // Test patterns in priority order - WEATHER FIRST!
            if (weatherPatterns.some(pattern => pattern.test(lowerMessage))) {
              return 'general';
            }

            if (generalPatterns.some(pattern => pattern.test(lowerMessage))) {
              return 'general';
            }

            if (catalogPatterns.some(pattern => pattern.test(lowerMessage))) {
              return 'catalog';
            }

            if (petrophysicsPatterns.some(pattern => pattern.test(lowerMessage))) {
              return 'petrophysics';
            }

            // Default routing based on content
            if (this.containsPetrophysicsTerms(lowerMessage)) {
              return 'petrophysics';
            }

            if (this.containsGeographicTerms(lowerMessage)) {
              return 'catalog';
            }

            // Default to general for conversational queries
            return 'general';
        },

        containsPetrophysicsTerms(message) {
            // Don't consider weather queries as petrophysics even if they mention wells
            if (message.includes('weather')) {
              return false;
            }
            
            const petroTerms = [
              'porosity', 'permeability', 'saturation', 'shale', 'formation',
              'log', 'curve', 'well', 'reservoir', 'gamma ray', 'density',
              'neutron', 'resistivity', 'calculation', 'analysis', 'evaluation'
            ];

            return petroTerms.some(term => message.includes(term));
        },

        containsGeographicTerms(message) {
            // Don't consider weather queries as geographic even if they mention location terms
            if (message.includes('weather')) {
              return false;
            }
            
            const geoTerms = [
              'map', 'location', 'coordinate', 'region', 'area', 'offshore',
              'field', 'basin', 'geographic', 'spatial', 'distribution'
            ];

            return geoTerms.some(term => message.includes(term));
        }
    };

    // Test cases - focus on the problematic query and similar variations
    const testCases = [
        // The main problematic query
        { query: "what is the weather near my wells", expected: "general", category: "weather" },
        
        // Similar weather queries that should work
        { query: "weather near my wells", expected: "general", category: "weather" },
        { query: "what's the weather near wells", expected: "general", category: "weather" },
        { query: "temperature near my wells", expected: "general", category: "weather" },
        { query: "weather conditions near my wells", expected: "general", category: "weather" },
        { query: "forecast near my wells", expected: "general", category: "weather" },
        
        // Other weather queries that should still work
        { query: "weather in Houston", expected: "general", category: "weather" },
        { query: "what's the weather in Singapore", expected: "general", category: "weather" },
        
        // Non-weather queries that should still route correctly
        { query: "show wells in Gulf of Mexico", expected: "catalog", category: "catalog" },
        { query: "find wells near offshore Malaysia", expected: "catalog", category: "catalog" },
        { query: "calculate porosity for Well-001", expected: "petrophysics", category: "petrophysics" },
        
        // Edge cases
        { query: "wells in my region", expected: "catalog", category: "catalog" },
        { query: "analyze wells in my field", expected: "petrophysics", category: "petrophysics" }
    ];

    console.log('\n🔍 Testing routing for each query...\n');

    let passed = 0;
    let failed = 0;

    testCases.forEach((testCase, index) => {
        const actual = mockAgentRouter.determineAgentType(testCase.query);
        const success = actual === testCase.expected;
        
        if (success) {
            passed++;
            console.log(`✅ "${testCase.query}"`);
            console.log(`   → ${actual} agent (${testCase.category}) ✓`);
        } else {
            failed++;
            console.log(`❌ "${testCase.query}"`);
            console.log(`   → Expected: ${testCase.expected}, Got: ${actual} (${testCase.category}) ✗`);
        }
        console.log('');
    });

    // Results summary
    console.log('='.repeat(60));
    console.log('📊 WEATHER ROUTING FIX TEST RESULTS');
    console.log('=' .repeat(60));
    console.log(`Total Tests: ${testCases.length}`);
    console.log(`Passed: ${passed} (${Math.round(passed/testCases.length*100)}%)`);
    console.log(`Failed: ${failed} (${Math.round(failed/testCases.length*100)}%)`);

    // Focus on the main issue
    const mainQuery = testCases[0];
    const mainResult = mockAgentRouter.determineAgentType(mainQuery.query);
    
    console.log('\n🎯 MAIN ISSUE STATUS:');
    console.log(`Query: "${mainQuery.query}"`);
    console.log(`Expected: ${mainQuery.expected} agent`);
    console.log(`Actual: ${mainResult} agent`);
    
    if (mainResult === mainQuery.expected) {
        console.log('✅ FIXED! Weather query now routes correctly to general knowledge agent');
        console.log('🌤️ Users will now get weather information instead of well catalog results');
    } else {
        console.log('❌ STILL BROKEN! Weather query is not routing correctly');
    }

    return { passed, failed, total: testCases.length };
}

// Run the test
if (require.main === module) {
    testWeatherRoutingFix();
}

module.exports = { testWeatherRoutingFix };
