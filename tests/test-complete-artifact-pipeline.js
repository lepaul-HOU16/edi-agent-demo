/**
 * Complete Artifact Pipeline Test
 * Tests the entire flow: Tool -> Agent -> Handler -> GraphQL -> Frontend
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

// Test different types of requests to see which ones lose artifacts
const testCases = [
  {
    name: 'Comprehensive Shale Analysis',
    message: 'perform comprehensive shale analysis on well Bakken_Horizontal_1'
  },
  {
    name: 'Simple Tool Request',
    message: 'create professional response about well completion'
  },
  {
    name: 'Plot Data Tool',
    message: 'plot gamma ray data for well Bakken_Horizontal_1'
  },
  {
    name: 'Petrophysics Analysis',
    message: 'analyze porosity data for well Bakken_Horizontal_1'
  }
];

async function testArtifactPipeline() {
  console.log('=== COMPLETE ARTIFACT PIPELINE TEST ===');
  console.log('Testing artifact flow through entire system...\n');
  
  for (const testCase of testCases) {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`📝 Message: ${testCase.message}`);
    
    try {
      // Create a temporary chat session
      const chatSessionResponse = await client.models.ChatSession.create({
        name: `Test Session - ${testCase.name}`,
        workSteps: []
      });
      
      if (chatSessionResponse.errors) {
        console.error('❌ Failed to create chat session:', chatSessionResponse.errors);
        continue;
      }
      
      const chatSessionId = chatSessionResponse.data.id;
      console.log(`📋 Created chat session: ${chatSessionId}`);
      
      // Invoke the agent directly via GraphQL
      console.log('🚀 Invoking lightweightAgent...');
      const startTime = Date.now();
      
      const invokeResponse = await client.mutations.invokeLightweightAgent({
        chatSessionId: chatSessionId,
        message: testCase.message,
        foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
        userId: 'test-user-' + Date.now()
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`⏱️ Request completed in ${duration}ms`);
      
      // Analyze the response
      if (invokeResponse.errors && invokeResponse.errors.length > 0) {
        console.error('❌ GraphQL Errors:', invokeResponse.errors);
        continue;
      }
      
      if (!invokeResponse.data) {
        console.error('❌ No data in response');
        continue;
      }
      
      console.log('📊 Response Analysis:');
      console.log(`   Success: ${invokeResponse.data.success}`);
      console.log(`   Message Length: ${invokeResponse.data.message?.length || 0}`);
      console.log(`   Artifacts Count: ${invokeResponse.data.artifacts?.length || 0}`);
      console.log(`   Artifacts Array: ${Array.isArray(invokeResponse.data.artifacts)}`);
      
      if (invokeResponse.data.artifacts && invokeResponse.data.artifacts.length > 0) {
        console.log('✅ ARTIFACTS FOUND!');
        console.log(`   First artifact type: ${invokeResponse.data.artifacts[0]?.messageContentType || 'unknown'}`);
        console.log(`   First artifact keys: ${Object.keys(invokeResponse.data.artifacts[0] || {}).join(', ')}`);
        
        // Log the full first artifact (truncated)
        const firstArtifact = invokeResponse.data.artifacts[0];
        const artifactStr = JSON.stringify(firstArtifact, null, 2);
        console.log(`   First artifact (first 500 chars): ${artifactStr.substring(0, 500)}...`);
      } else {
        console.log('❌ NO ARTIFACTS IN RESPONSE');
        console.log('   This indicates artifacts are being lost somewhere in the pipeline');
      }
      
      // Clean up - delete the test chat session
      try {
        await client.models.ChatSession.delete({ id: chatSessionId });
        console.log('🗑️ Cleaned up test session');
      } catch (cleanupError) {
        console.warn('⚠️ Failed to clean up test session:', cleanupError);
      }
      
    } catch (error) {
      console.error(`❌ Test failed for ${testCase.name}:`, error);
      if (error.errors) {
        console.error('GraphQL Errors:', error.errors);
      }
    }
    
    console.log('─'.repeat(80));
  }
  
  console.log('\n=== PIPELINE TEST COMPLETE ===');
  console.log('If all tests show "NO ARTIFACTS", the issue is in the agent/handler.');
  console.log('If some tests show artifacts, the issue is tool-specific.');
  console.log('Check CloudWatch logs for detailed Lambda execution traces.');
}

// Run the test
testArtifactPipeline().catch(console.error);
