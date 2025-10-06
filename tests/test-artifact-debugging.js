/**
 * Test Enhanced Artifact Debugging
 * Tests the deployed handler with enhanced logging to identify artifact loss
 */
import { generateClient } from "aws-amplify/data";
import { Amplify } from "aws-amplify";
import fs from 'fs';

// Load configuration
const amplifyOutputs = JSON.parse(fs.readFileSync('./amplify_outputs.json', 'utf8'));

// Configure Amplify with the new endpoint
Amplify.configure({
  API: {
    GraphQL: {
      endpoint: amplifyOutputs.data.url,
      region: amplifyOutputs.data.aws_region,
      defaultAuthMode: 'identityPool'
    }
  }
}, {
  Auth: {
    credentialsProvider: {
      getCredentialsAndIdentityId: async () => ({
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          sessionToken: process.env.AWS_SESSION_TOKEN,
        },
      }),
      clearCredentialsAndIdentityId: () => {},
    },
  },
});

const client = generateClient();

async function testArtifactDebugging() {
  console.log('=== TESTING ENHANCED ARTIFACT DEBUGGING ===');
  console.log('API Endpoint:', amplifyOutputs.data.url);
  console.log('This will trigger enhanced logging in the deployed Lambda handler');
  console.log('Check CloudWatch logs for the lightweightAgent function to see detailed artifact flow\n');
  
  try {
    // Test with comprehensive shale analysis - known to generate artifacts
    const testMessage = 'perform comprehensive shale analysis on well Bakken_Horizontal_1';
    console.log(`🚀 Testing message: "${testMessage}"`);
    
    const startTime = Date.now();
    
    // Use a unique chat session ID for this test
    const testChatSessionId = `artifact-debug-${Date.now()}`;
    
    console.log(`📋 Test Chat Session ID: ${testChatSessionId}`);
    console.log('🔍 Invoking agent with enhanced debugging...');
    
    const invokeResponse = await client.mutations.invokeLightweightAgent({
      chatSessionId: testChatSessionId,
      message: testMessage,
      foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
      userId: 'test-user-artifacts-' + Date.now()
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️ Request completed in ${duration}ms`);
    
    // Analyze the response
    if (invokeResponse.errors && invokeResponse.errors.length > 0) {
      console.log('\n❌ GraphQL Errors:');
      invokeResponse.errors.forEach((error, index) => {
        console.log(`   Error ${index + 1}: ${error.message}`);
      });
      return;
    }
    
    if (!invokeResponse.data) {
      console.log('\n❌ No data in response');
      return;
    }
    
    const data = invokeResponse.data;
    console.log('\n📊 Frontend Response Analysis:');
    console.log(`   ✅ Success: ${data.success}`);
    console.log(`   📝 Message Length: ${data.message?.length || 0}`);
    console.log(`   📦 Has Artifacts: ${data.hasOwnProperty('artifacts')}`);
    console.log(`   📦 Artifacts Type: ${typeof data.artifacts}`);
    console.log(`   📦 Artifacts Array: ${Array.isArray(data.artifacts)}`);
    console.log(`   📦 Artifacts Count: ${data.artifacts?.length || 0}`);
    
    if (data.artifacts && data.artifacts.length > 0) {
      console.log('\n🎉 SUCCESS! Artifacts found in frontend response!');
      data.artifacts.forEach((artifact, index) => {
        console.log(`   📊 Artifact ${index + 1}:`);
        console.log(`     Type: ${artifact?.messageContentType || 'unknown'}`);
        console.log(`     Keys: ${Object.keys(artifact || {}).join(', ')}`);
      });
    } else {
      console.log('\n❌ NO ARTIFACTS in frontend response');
    }
    
    console.log('\n🔍 Enhanced Debugging Information:');
    console.log('   Check CloudWatch logs for the lightweightAgent Lambda function');
    console.log('   Look for logs starting with:');
    console.log('     - "🔍 HANDLER: Agent response received"');
    console.log('     - "🎯 HANDLER: Artifacts being returned"');
    console.log('     - "✅ HANDLER: Artifacts survive JSON serialization"');
    console.log('     - "🏁 HANDLER: Final response structure"');
    console.log('     - "🎉 HANDLER: Artifacts preserved in serialization"');
    console.log('   These logs will show exactly where artifacts are being lost');
    
    console.log(`\n📋 CloudWatch Log Group: /aws/lambda/amplify-digitalassistant-agentfixlp-sandbox-3d38283154-lightweightAgent`);
    console.log(`📋 Test Session ID for log filtering: ${testChatSessionId}`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error.errors) {
      console.error('GraphQL Errors:', error.errors);
    }
  }
  
  console.log('\n=== DEBUGGING TEST COMPLETE ===');
  console.log('Next steps:');
  console.log('1. Check CloudWatch logs for detailed artifact flow tracing');
  console.log('2. Look for where artifacts are lost (agent -> handler -> GraphQL)');
  console.log('3. Fix the identified issue based on log analysis');
}

// Run the test
testArtifactDebugging().catch(console.error);
