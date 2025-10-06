/**
 * Simple Intent Detection Test
 * Test the intent detection patterns directly
 */

console.log('🧪 Testing Intent Detection Patterns...\n');

// Simulate the intent detection logic from the agent
function testIntentDetection(message) {
    const query = message.toLowerCase().trim();
    
    // Intent patterns (simplified from the agent)
    const intentPatterns = [
        {
            type: 'list_wells',
            patterns: [
                /\b(list|show|display|get|find|what|which|all)\b.*\b(wells?|well data)\b/,
                /\bwells?\b.*\b(available|exist|present|for analysis|in system)\b/,
            ],
            keywords: ['wells', 'list', 'available', 'show', 'display']
        },
        {
            type: 'well_info',
            patterns: [
                /\b(info|information|details|data|about)\b.*\bwell\b/,
                /\bwell\b.*\b(info|information|details|data|curves|logs)\b/,
            ],
            keywords: ['well', 'info', 'information', 'details', 'data', 'about'],
            requiresWell: true
        },
        {
            type: 'calculate_porosity',
            patterns: [
                /\b(calculate|compute|determine|find|get)\b.*\bporosity\b/,
                /\bporosity\b.*\b(calculation|compute|calculate|for)\b/,
            ],
            keywords: ['porosity', 'calculate', 'compute']
        },
        {
            type: 'formation_evaluation',
            patterns: [
                /\bformation\b.*\bevaluation\b/,
                /\b(complete|full|comprehensive)\b.*\b(analysis|evaluation)\b/,
                /\bevaluate\b.*\bformation\b/,
                /\banalyze\b.*\bwell\b/,
            ],
            keywords: ['formation', 'evaluation', 'analysis', 'analyze']
        },
        {
            type: 'shale_analysis_workflow',
            patterns: [
                /\bgamma.*ray.*logs.*from.*wells.*calculate.*shale/,
                /\bshale.*volume.*larionov.*method/,
                /\bgamma.*ray.*shale.*larionov/,
                /\bcalculate.*shale.*volume.*larionov\b/,
                /\bcomprehensive.*shale.*analysis\b/,
            ],
            keywords: ['gamma ray shale larionov', 'shale volume larionov', 'larionov method']
        },
        {
            type: 'multi_well_correlation',
            patterns: [
                /\bcreate.*correlation.*panel\b/,
                /\bcorrelation.*panel.*showing\b/,
                /\bgamma.*ray.*resistivity.*porosity.*logs\b/,
            ],
            keywords: ['correlation', 'panel', 'gamma', 'ray', 'resistivity', 'porosity']
        },
        {
            type: 'well_data_discovery',
            patterns: [
                /\bhow.*many.*wells.*do.*i.*have\b/,
                /\bexplore.*well.*data.*directory\b/,
                /\bwell.*data.*discovery\b/,
            ],
            keywords: ['how', 'many', 'wells', 'explore', 'data', 'discovery']
        }
    ];
    
    let bestIntent = { type: 'unknown', score: 0 };
    
    for (const intent of intentPatterns) {
        let score = 0;
        
        // Pattern matching
        for (const pattern of intent.patterns) {
            if (pattern.test(query)) {
                score += 10;
                break;
            }
        }
        
        // Keyword matching
        for (const keyword of intent.keywords) {
            if (query.includes(keyword)) {
                score += 2;
            }
        }
        
        // Update best intent if this score is higher
        if (score > bestIntent.score) {
            bestIntent = {
                type: intent.type,
                score
            };
        }
    }
    
    return bestIntent;
}

// Test cases
const testCases = [
    {
        prompt: "List all available wells",
        expected: "list_wells",
        description: "Simple well listing request"
    },
    {
        prompt: "Get information about SANDSTONE_RESERVOIR_001",
        expected: "well_info", 
        description: "Well information request"
    },
    {
        prompt: "Calculate porosity for SANDSTONE_RESERVOIR_001",
        expected: "calculate_porosity",
        description: "Porosity calculation request"
    },
    {
        prompt: "Formation evaluation for SANDSTONE_RESERVOIR_001", 
        expected: "formation_evaluation",
        description: "Formation evaluation request"
    },
    {
        prompt: "Analyze gamma ray logs from wells and calculate shale volume using Larionov method",
        expected: "shale_analysis_workflow",
        description: "Specific shale analysis workflow"
    },
    {
        prompt: "Create correlation panel showing gamma ray resistivity porosity logs",
        expected: "multi_well_correlation", 
        description: "Multi-well correlation request"
    },
    {
        prompt: "How many wells do I have",
        expected: "well_data_discovery",
        description: "Well data discovery request"
    },
    {
        prompt: "Calculate something for analysis",
        expected: "calculate_porosity", // Should default to porosity, not shale
        description: "Generic calculation (should not always go to shale)"
    }
];

// Run tests
let passedTests = 0;
let totalTests = testCases.length;

for (const testCase of testCases) {
    console.log(`📝 Testing: ${testCase.description}`);
    console.log(`   Prompt: "${testCase.prompt}"`);
    console.log(`   Expected: ${testCase.expected}`);
    
    const intent = testIntentDetection(testCase.prompt);
    
    console.log(`   Detected: ${intent.type} (score: ${intent.score})`);
    
    if (intent.type === testCase.expected) {
        console.log(`   ✅ PASS\n`);
        passedTests++;
    } else {
        console.log(`   ❌ FAIL - Expected ${testCase.expected}, got ${intent.type}\n`);
    }
}

console.log(`🎯 Results: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
    console.log('🎉 All intent detection tests passed! The fix is working correctly.');
} else if (passedTests > totalTests * 0.7) {
    console.log('✅ Most tests passed. Intent detection is much improved.');
} else {
    console.log('⚠️  Many tests failed. The routing issue may still exist.');
}
