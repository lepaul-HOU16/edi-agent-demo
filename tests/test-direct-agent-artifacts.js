/**
 * Direct Agent Artifact Test
 * Tests just the agent invocation to see if artifacts are returned
 */
import { generateClient } from "aws-amplify/data";
import { Amplify } from "aws-amplify";
import fs from 'fs';

// Load configuration
const amplifyOutputs = JSON.parse(fs.readFileSync('./amplify_outputs.json', 'utf8'));

// Configure Amplify
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

async function testDirectAgentArtifacts() {
  console.log('=== DIRECT AGENT ARTIFACT TEST ===');
  console.log('Testing if artifacts are returned in GraphQL response...\n');
  
  try {
    // Test with a simple shale analysis request
    const testMessage = 'perform comprehensive shale analysis on well Bakken_Horizontal_1';
    console.log(`🚀 Testing message: "${testMessage}"`);
    
    const startTime = Date.now();
    
    // Invoke the agent directly - use a fixed chat session ID for testing
    const invokeResponse = await client.mutations.invokeLightweightAgent({
      chatSessionId: 'test-session-' + Date.now(),
      message: testMessage,
      foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
      userId: 'test-user-' + Date.now()
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️ Request completed in ${duration}ms`);
    console.log('📋 Raw GraphQL Response:');
    console.log(JSON.stringify(invokeResponse, null, 2));
    
    // Analyze the response structure
    console.log('\n📊 Response Analysis:');
    
    if (invokeResponse.errors && invokeResponse.errors.length > 0) {
      console.log('❌ GraphQL Errors Found:');
      invokeResponse.errors.forEach((error, index) => {
        console.log(`   Error ${index + 1}: ${error.message}`);
        console.log(`   Path: ${error.path?.join('.') || 'N/A'}`);
        console.log(`   Extensions: ${JSON.stringify(error.extensions || {}, null, 4)}`);
      });
    }
    
    if (!invokeResponse.data) {
      console.log('❌ No data in GraphQL response');
      return;
    }
    
    const data = invokeResponse.data;
    console.log(`✅ Success: ${data.success}`);
    console.log(`📝 Message Length: ${data.message?.length || 0}`);
    console.log(`📦 Has Artifacts Field: ${data.hasOwnProperty('artifacts')}`);
    console.log(`📦 Artifacts Type: ${typeof data.artifacts}`);
    console.log(`📦 Artifacts Is Array: ${Array.isArray(data.artifacts)}`);
    console.log(`📦 Artifacts Count: ${data.artifacts?.length || 0}`);
    
    if (data.artifacts && data.artifacts.length > 0) {
      console.log('\n🎯 ARTIFACTS DETECTED!');
      data.artifacts.forEach((artifact, index) => {
        console.log(`   Artifact ${index + 1}:`);
        console.log(`     Type: ${artifact?.messageContentType || 'unknown'}`);
        console.log(`     Keys: ${Object.keys(artifact || {}).join(', ')}`);
        
        if (artifact?.messageContentType === 'comprehensive_shale_analysis') {
          console.log(`     Has Analysis Data: ${!!artifact.analysis}`);
          console.log(`     Has Visualization: ${!!artifact.visualization}`);
          console.log(`     Analysis Type: ${artifact.analysisType || 'N/A'}`);
        }
      });
      
      // Show first artifact structure
      console.log('\n📋 First Artifact Structure:');
      console.log(JSON.stringify(data.artifacts[0], null, 2));
      
    } else {
      console.log('\n❌ NO ARTIFACTS FOUND');
      console.log('   This means artifacts are being lost before reaching GraphQL response');
      console.log('   The issue is in the Lambda handler or agent processing');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error.errors) {
      console.error('GraphQL Errors:', JSON.stringify(error.errors, null, 2));
    }
  }
  
  console.log('\n=== TEST COMPLETE ===');
}

// Run the test
testDirectAgentArtifacts().catch(console.error);
