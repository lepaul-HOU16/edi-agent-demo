/**
 * Comprehensive test for general chat capabilities
 * Tests the agent routing system with non-petrophysical queries
 * Validates that general knowledge questions are handled properly
 */

const AWS = require('aws-sdk');
require('dotenv').config({ path: '.env.local' });

// Configure AWS
AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const appsync = new AWS.AppSync();

// Test queries that should route to the general knowledge agent
const generalChatQueries = [
    // Conversational queries
    {
        query: "Hello, how are you today?",
        expectedAgent: "general_knowledge",
        category: "conversational"
    },
    {
        query: "What can you help me with?",
        expectedAgent: "general_knowledge", 
        category: "conversational"
    },
    {
        query: "Thank you for your help!",
        expectedAgent: "general_knowledge",
        category: "conversational"
    },
    
    // Weather queries
    {
        query: "What's the weather like in Houston?",
        expectedAgent: "general_knowledge",
        category: "weather"
    },
    {
        query: "Can you give me the forecast for Singapore?",
        expectedAgent: "general_knowledge",
        category: "weather"
    },
    {
        query: "What are the weather conditions offshore Malaysia?",
        expectedAgent: "general_knowledge",
        category: "weather"
    },
    
    // Regulatory/legal queries
    {
        query: "What are the requirements of the EU AI Act?",
        expectedAgent: "general_knowledge",
        category: "regulatory"
    },
    {
        query: "Tell me about GDPR compliance requirements",
        expectedAgent: "general_knowledge",
        category: "regulatory"
    },
    {
        query: "What are the latest SEC regulations?",
        expectedAgent: "general_knowledge",
        category: "regulatory"
    },
    
    // General knowledge queries
    {
        query: "Explain how machine learning works",
        expectedAgent: "general_knowledge",
        category: "academic"
    },
    {
        query: "What are the latest news in renewable energy?",
        expectedAgent: "general_knowledge",
        category: "news"
    },
    {
        query: "How do solar panels generate electricity?",
        expectedAgent: "general_knowledge",
        category: "academic"
    },
    
    // Industry but not petrophysics specific
    {
        query: "What are the latest trends in oil and gas markets?",
        expectedAgent: "general_knowledge",
        category: "petroleum_industry"
    },
    {
        query: "How does carbon capture technology work?",
        expectedAgent: "general_knowledge",
        category: "academic"
    },
    
    // These should still route to petrophysics for comparison
    {
        query: "Calculate porosity for Well-001",
        expectedAgent: "petrophysics",
        category: "petrophysics"
    },
    {
        query: "Show me wells in the Gulf of Mexico",
        expectedAgent: "catalog_search",
        category: "catalog"
    }
];

async function testGeneralChatCapabilities() {
    console.log('🧪 TESTING: General Chat Capabilities');
    console.log('=====================================');
    
    const results = {
        total: 0,
        passed: 0,
        failed: 0,
        details: []
    };

    for (const testCase of generalChatQueries) {
        results.total++;
        console.log(`\n🔍 Testing: "${testCase.query}"`);
        console.log(`   Expected: ${testCase.expectedAgent} (${testCase.category})`);
        
        try {
            // Test the agent routing and response
            const response = await testAgentQuery(testCase.query);
            
            const testResult = {
                query: testCase.query,
                expectedAgent: testCase.expectedAgent,
                actualAgent: response.agentUsed,
                category: testCase.category,
                success: response.success,
                hasMessage: !!response.message,
                messageLength: response.message?.length || 0,
                hasThoughtSteps: !!response.thoughtSteps?.length,
                hasSourceAttribution: !!response.sourceAttribution?.length,
                passed: false,
                issues: []
            };

            // Validate agent routing
            if (response.agentUsed !== testCase.expectedAgent) {
                testResult.issues.push(`Wrong agent: expected ${testCase.expectedAgent}, got ${response.agentUsed}`);
            }

            // Validate response quality
            if (!response.success) {
                testResult.issues.push('Response marked as unsuccessful');
            }

            if (!response.message || response.message.length < 20) {
                testResult.issues.push('Response message too short or missing');
            }

            // For general knowledge queries, expect some thought steps
            if (testCase.expectedAgent === 'general_knowledge' && (!response.thoughtSteps || response.thoughtSteps.length === 0)) {
                testResult.issues.push('Missing thought steps for general knowledge query');
            }

            // Check for appropriate response content
            if (testCase.category === 'conversational') {
                const message = response.message.toLowerCase();
                if (testCase.query.includes('hello') && !message.includes('hello') && !message.includes('hi')) {
                    testResult.issues.push('Conversational response should acknowledge greeting');
                }
                if (testCase.query.includes('what can you') && !message.includes('help')) {
                    testResult.issues.push('Should explain capabilities when asked');
                }
            }

            // Mark as passed if no issues
            testResult.passed = testResult.issues.length === 0;
            if (testResult.passed) {
                results.passed++;
            } else {
                results.failed++;
            }

            results.details.push(testResult);

            // Log result
            if (testResult.passed) {
                console.log(`   ✅ PASSED - Agent: ${response.agentUsed}, Message: ${response.message.substring(0, 100)}...`);
            } else {
                console.log(`   ❌ FAILED - Issues: ${testResult.issues.join(', ')}`);
                console.log(`   📝 Response: ${response.message?.substring(0, 200)}...`);
            }

        } catch (error) {
            results.failed++;
            results.details.push({
                query: testCase.query,
                expectedAgent: testCase.expectedAgent,
                category: testCase.category,
                passed: false,
                issues: [`Error: ${error.message}`]
            });
            
            console.log(`   ❌ ERROR - ${error.message}`);
        }

        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Print comprehensive results
    console.log('\n' + '='.repeat(50));
    console.log('📊 GENERAL CHAT TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${results.total}`);
    console.log(`Passed: ${results.passed} (${Math.round(results.passed/results.total*100)}%)`);
    console.log(`Failed: ${results.failed} (${Math.round(results.failed/results.total*100)}%)`);

    // Group results by category
    const categoryResults = {};
    results.details.forEach(result => {
        if (!categoryResults[result.category]) {
            categoryResults[result.category] = { total: 0, passed: 0 };
        }
        categoryResults[result.category].total++;
        if (result.passed) {
            categoryResults[result.category].passed++;
        }
    });

    console.log('\n📈 Results by Category:');
    Object.entries(categoryResults).forEach(([category, stats]) => {
        const percentage = Math.round(stats.passed / stats.total * 100);
        console.log(`  ${category}: ${stats.passed}/${stats.total} (${percentage}%)`);
    });

    // Show failed tests
    const failedTests = results.details.filter(r => !r.passed);
    if (failedTests.length > 0) {
        console.log('\n❌ Failed Tests:');
        failedTests.forEach(test => {
            console.log(`\n  Query: "${test.query}"`);
            console.log(`  Expected: ${test.expectedAgent}, Got: ${test.actualAgent || 'N/A'}`);
            console.log(`  Issues: ${test.issues.join(', ')}`);
        });
    }

    // Show successful general knowledge responses
    const successfulGeneral = results.details.filter(r => r.passed && r.expectedAgent === 'general_knowledge');
    if (successfulGeneral.length > 0) {
        console.log('\n✅ Successful General Knowledge Responses:');
        successfulGeneral.slice(0, 3).forEach(test => {
            console.log(`\n  Query: "${test.query}"`);
            console.log(`  Category: ${test.category}`);
            console.log(`  Thought Steps: ${test.hasThoughtSteps ? 'Yes' : 'No'}`);
            console.log(`  Sources: ${test.hasSourceAttribution ? 'Yes' : 'No'}`);
        });
    }

    return results;
}

async function testAgentQuery(message) {
    console.log('🤖 Testing agent with message:', message);
    
    // Import the agent router directly for testing
    try {
        // Import the handler function
        const { handler } = require('./amplify/functions/agents/handler.ts');
        
        // Create mock event
        const mockEvent = {
            arguments: {
                message: message,
                foundationModelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
                userId: 'test-user-general-chat'
            },
            identity: {
                sub: 'test-user-general-chat'
            }
        };

        const mockContext = {};
        
        const response = await handler(mockEvent, mockContext);
        
        console.log('📋 Agent Response Summary:', {
            success: response.success,
            agentUsed: response.agentUsed,
            messageLength: response.message?.length || 0,
            artifactCount: response.artifacts?.length || 0,
            thoughtStepCount: response.thoughtSteps?.length || 0,
            sourceCount: response.sourceAttribution?.length || 0
        });

        return response;

    } catch (error) {
        console.error('❌ Error testing agent:', error);
        throw error;
    }
}

// Run the tests
async function main() {
    try {
        console.log('🚀 Starting General Chat Capabilities Test');
        console.log('This will test various non-petrophysical queries to validate general chat');
        console.log('Checking if the agent can handle conversational, weather, regulatory, and general knowledge questions\n');
        
        const results = await testGeneralChatCapabilities();
        
        if (results.passed === results.total) {
            console.log('\n🎉 ALL TESTS PASSED! General chat capabilities are working correctly.');
        } else if (results.passed > results.total * 0.8) {
            console.log('\n⚠️ Most tests passed, but there are some issues to address.');
        } else {
            console.log('\n🚨 MAJOR ISSUES detected with general chat capabilities.');
        }
        
        process.exit(0);
        
    } catch (error) {
        console.error('💥 Test suite failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { testGeneralChatCapabilities, testAgentQuery };
