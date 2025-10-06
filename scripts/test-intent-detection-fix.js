/**
 * Test Intent Detection Fix
 * Verify that different prompts now route to appropriate handlers
 */

console.log('🧪 Testing Intent Detection Fix...\n');

// Import the agent class
import { EnhancedStrandsAgent } from './amplify/functions/agents/enhancedStrandsAgent.ts';

async function testIntentDetection() {
    const agent = new EnhancedStrandsAgent();
    
    // Test cases with expected intent types
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
        }
    ];
    
    let passedTests = 0;
    let totalTests = testCases.length;
    
    for (const testCase of testCases) {
        console.log(`📝 Testing: ${testCase.description}`);
        console.log(`   Prompt: "${testCase.prompt}"`);
        console.log(`   Expected: ${testCase.expected}`);
        
        try {
            // Access the private detectUserIntent method
            const intent = agent.detectUserIntent(testCase.prompt);
            
            console.log(`   Detected: ${intent.type} (score: ${intent.score})`);
            
            if (intent.type === testCase.expected) {
                console.log(`   ✅ PASS\n`);
                passedTests++;
            } else {
                console.log(`   ❌ FAIL - Expected ${testCase.expected}, got ${intent.type}\n`);
            }
            
        } catch (error) {
            console.log(`   💥 ERROR: ${error.message}\n`);
        }
    }
    
    console.log(`\n🎯 Results: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All intent detection tests passed! The fix is working correctly.');
    } else {
        console.log('⚠️  Some intent detection tests failed. The routing issue may still exist.');
    }
}

// Run the test
testIntentDetection().catch(console.error);
