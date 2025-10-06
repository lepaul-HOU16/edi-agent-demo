/**
 * Test the deployed weather functionality fix
 * Validates that "what is the weather near my wells" now provides weather info instead of well catalog
 */

const AWS = require('aws-sdk');
require('dotenv').config({ path: '.env.local' });

// Configure AWS for testing
AWS.config.update({
    region: 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

async function testDeployedWeatherFix() {
    console.log('🌤️ Testing Deployed Weather Fix');
    console.log('===============================');
    console.log('Validating that weather queries now work correctly in production\n');

    // Load the deployed amplify outputs
    let amplifyOutputs;
    try {
        amplifyOutputs = require('./amplify_outputs.json');
        console.log('✅ Loaded amplify_outputs.json');
        console.log('📡 GraphQL Endpoint:', amplifyOutputs.data?.url || 'Not found');
    } catch (error) {
        console.error('❌ Failed to load amplify_outputs.json:', error);
        return;
    }

    // Test GraphQL endpoint directly
    const axios = require('axios');
    
    const testQueries = [
        {
            name: "Weather Query - Main Issue",
            query: "what is the weather near my wells",
            expectedAgent: "general_knowledge",
            shouldContain: "weather",
            shouldNotContain: "Found 27 wells"
        },
        {
            name: "Weather Query - Alternative",
            query: "weather conditions near my wells", 
            expectedAgent: "general_knowledge",
            shouldContain: "weather",
            shouldNotContain: "wells for query"
        },
        {
            name: "Catalog Query - Should Still Work",
            query: "show wells in Gulf of Mexico",
            expectedAgent: "catalog_search", 
            shouldContain: "wells",
            shouldNotContain: "weather"
        },
        {
            name: "Petrophysics Query - Should Still Work",
            query: "calculate porosity for Well-001",
            expectedAgent: "petrophysics",
            shouldContain: "porosity",
            shouldNotContain: "weather"
        }
    ];

    const results = [];

    for (const testQuery of testQueries) {
        console.log(`\n🔍 Testing: ${testQuery.name}`);
        console.log(`   Query: "${testQuery.query}"`);
        console.log(`   Expected Agent: ${testQuery.expectedAgent}`);
        
        try {
            // GraphQL mutation to invoke the lightweight agent
            const graphqlQuery = {
                query: `
                    mutation InvokeLightweightAgent($chatSessionId: ID!, $message: String!, $foundationModelId: String, $userId: String) {
                        invokeLightweightAgent(
                            chatSessionId: $chatSessionId
                            message: $message
                            foundationModelId: $foundationModelId
                            userId: $userId
                        ) {
                            success
                            message
                            artifacts
                            thoughtSteps
                        }
                    }
                `,
                variables: {
                    chatSessionId: 'test-weather-fix-' + Date.now(),
                    message: testQuery.query,
                    foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
                    userId: 'test-user-weather-fix'
                }
            };

            const response = await axios.post(amplifyOutputs.data.url, graphqlQuery, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.AMPLIFY_API_KEY || 'demo-key',
                },
                timeout: 30000 // 30 second timeout
            });

            const data = response.data?.data?.invokeLightweightAgent;
            const errors = response.data?.errors;

            if (errors) {
                console.log(`   ❌ GraphQL Errors:`, errors);
                results.push({
                    name: testQuery.name,
                    success: false,
                    error: `GraphQL errors: ${JSON.stringify(errors)}`
                });
                continue;
            }

            if (!data) {
                console.log(`   ❌ No response data received`);
                results.push({
                    name: testQuery.name, 
                    success: false,
                    error: 'No response data received'
                });
                continue;
            }

            // Analyze the response
            const message = data.message || '';
            const success = data.success || false;
            const hasArtifacts = data.artifacts && data.artifacts.length > 0;
            const hasThoughtSteps = data.thoughtSteps && data.thoughtSteps.length > 0;

            console.log(`   📊 Response Analysis:`);
            console.log(`      Success: ${success}`);
            console.log(`      Message Length: ${message.length} chars`);
            console.log(`      Has Artifacts: ${hasArtifacts}`);
            console.log(`      Has Thought Steps: ${hasThoughtSteps}`);
            console.log(`      Message Preview: ${message.substring(0, 100)}...`);

            // Validate content
            const containsExpected = testQuery.shouldContain ? message.toLowerCase().includes(testQuery.shouldContain) : true;
            const doesNotContainUnwanted = testQuery.shouldNotContain ? !message.toLowerCase().includes(testQuery.shouldNotContain) : true;
            
            const testPassed = success && containsExpected && doesNotContainUnwanted && message.length > 50;

            if (testPassed) {
                console.log(`   ✅ TEST PASSED`);
                if (testQuery.name.includes("Weather Query - Main Issue")) {
                    console.log(`   🎉 WEATHER FUNCTIONALITY IS NOW WORKING!`);
                }
            } else {
                console.log(`   ❌ TEST FAILED`);
                if (!containsExpected) {
                    console.log(`      Missing expected content: "${testQuery.shouldContain}"`);
                }
                if (!doesNotContainUnwanted) {
                    console.log(`      Contains unwanted content: "${testQuery.shouldNotContain}"`);
                }
                if (message.length <= 50) {
                    console.log(`      Response too short: ${message.length} chars`);
                }
            }

            results.push({
                name: testQuery.name,
                query: testQuery.query,
                success: testPassed,
                agentSuccess: success,
                messageLength: message.length,
                hasArtifacts,
                hasThoughtSteps,
                containsExpected,
                doesNotContainUnwanted,
                messagePreview: message.substring(0, 200) + '...'
            });

        } catch (error) {
            console.log(`   ❌ Request Failed:`, error.message);
            results.push({
                name: testQuery.name,
                success: false,
                error: error.message
            });
        }

        // Wait between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Print comprehensive results
    console.log('\n' + '='.repeat(60));
    console.log('📊 DEPLOYED WEATHER FIX TEST RESULTS');
    console.log('=' .repeat(60));
    
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`Total Tests: ${results.length}`);
    console.log(`Passed: ${passed} (${Math.round(passed/results.length*100)}%)`);
    console.log(`Failed: ${failed} (${Math.round(failed/results.length*100)}%)`);

    // Focus on main weather issue
    const mainWeatherTest = results.find(r => r.name.includes("Main Issue"));
    if (mainWeatherTest) {
        console.log('\n🎯 MAIN WEATHER ISSUE STATUS:');
        console.log('Query: "what is the weather near my wells"');
        if (mainWeatherTest.success) {
            console.log('✅ FIXED! Weather query now provides weather information');
            console.log('🌤️ No longer shows well catalog search results');
        } else {
            console.log('❌ Still broken - needs further investigation');
            console.log('Error:', mainWeatherTest.error || 'Unknown error');
        }
    }

    // Show detailed results for failed tests
    const failedTests = results.filter(r => !r.success);
    if (failedTests.length > 0) {
        console.log('\n❌ Failed Tests Details:');
        failedTests.forEach(test => {
            console.log(`\n  ${test.name}:`);
            if (test.error) {
                console.log(`    Error: ${test.error}`);
            } else {
                console.log(`    Query: "${test.query}"`);
                console.log(`    Agent Success: ${test.agentSuccess}`);
                console.log(`    Message Length: ${test.messageLength} chars`);
                console.log(`    Has Expected Content: ${test.containsExpected}`);
                console.log(`    Missing Unwanted Content: ${test.doesNotContainUnwanted}`);
                console.log(`    Preview: ${test.messagePreview}`);
            }
        });
    }

    // Show successful tests
    const successfulTests = results.filter(r => r.success);
    if (successfulTests.length > 0) {
        console.log('\n✅ Successful Tests:');
        successfulTests.forEach(test => {
            console.log(`\n  ${test.name}:`);
            console.log(`    Query: "${test.query}"`);
            console.log(`    Preview: ${test.messagePreview}`);
        });
    }

    return results;
}

// Run if called directly
if (require.main === module) {
    testDeployedWeatherFix().catch(error => {
        console.error('💥 Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = { testDeployedWeatherFix };
