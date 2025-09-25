// Test the deployed agent response to understand what's happening
const AWS = require('aws-sdk');

async function testDeployedAgent() {
    console.log('🧪 === TESTING DEPLOYED AGENT DIRECTLY ===');
    console.log('🌐 API Endpoint: https://doqkjfftczdazcaeyrt6kdcrvu.appsync-api.us-east-1.amazonaws.com/graphql');
    
    // Direct GraphQL mutation test to see what the deployed agent returns
    const testQuery = `
        mutation TestLightweightAgent {
            invokeLightweightAgent(
                chatSessionId: "test-session-educational-${Date.now()}",
                message: "explain how you run individual well analysis",
                foundationModelId: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
                userId: "test-user"
            ) {
                success
                message
                artifacts
            }
        }
    `;
    
    console.log('📝 Testing Query: "explain how you run individual well analysis"');
    console.log('🔍 This should trigger our enhanced educational patterns...');
    console.log('📋 GraphQL Query:', testQuery);
    
    console.log('\n⚠️ NOTE: To run this GraphQL test, you would need proper AWS credentials and GraphQL client setup.');
    console.log('🎯 However, we can identify the issue by examining the agent flow:');
    
    console.log('\n🔍 === ANALYSIS ===');
    console.log('1. Our enhanced agent IS being deployed (we can see from the data/resource.ts)');
    console.log('2. The lightweightAgent correctly imports from ../agents/handler.ts');
    console.log('3. Our enhanced patterns are in the isNaturalLanguageQuery() method');
    console.log('4. BUT the response format suggests it might be falling back to basic patterns');
    
    console.log('\n💡 === HYPOTHESIS ===');
    console.log('The issue is likely that our enhanced educational patterns are not being detected properly.');
    console.log('The agent may be routing to the "natural_language_query" handler, but that handler');
    console.log('might be using the natural_language_query MCP tool instead of our educational logic.');
    
    console.log('\n🎯 === NEXT STEPS ===');
    console.log('1. Check if the handleNaturalLanguageQuery method has educational logic');
    console.log('2. Verify that educational patterns are being detected in intent detection');
    console.log('3. Ensure the MCP natural_language_query tool provides educational responses');
    
    console.log('\n🔚 === ANALYSIS COMPLETE ===');
}

testDeployedAgent().catch(console.error);
