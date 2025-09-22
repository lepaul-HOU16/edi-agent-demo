import { generateClient } from "aws-amplify/data";
import { Amplify } from "aws-amplify";
import outputs from './amplify_outputs.json' assert { type: 'json' };

// Configure Amplify
Amplify.configure(outputs);
const client = generateClient();

async function testArtifactFlow() {
  console.log('=== COMPREHENSIVE ARTIFACT DEBUGGING TEST ===');
  console.log('API Endpoint:', outputs.data.url);
  console.log('This test will trigger comprehensive artifact debugging');
  
  const testChatSessionId = `artifact-debug-comprehensive-${Date.now()}`;
  console.log('🔍 Test Chat Session ID:', testChatSessionId);
  
  try {
    // Create chat session first
    console.log('📝 Creating chat session...');
    const { data: chatSession } = await client.models.ChatSession.create({
      name: 'Artifact Debug Test Session'
    });
    console.log('✅ Chat session created:', chatSession?.id);
    
    // Test message that should generate artifacts
    const testMessage = "perform comprehensive shale analysis on well Bakken_Horizontal_1";
    console.log('🚀 Testing message:', testMessage);
    
    // Invoke agent with debugging enabled
    console.log('🔍 Invoking lightweight agent with enhanced debugging...');
    const response = await client.mutations.invokeLightweightAgent({
      chatSessionId: testChatSessionId,
      message: testMessage,
      foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
      userId: 'test-user-artifacts'
    });
    
    console.log('📊 RESPONSE ANALYSIS:');
    console.log('Success:', response.data?.success);
    console.log('Has Errors:', !!response.errors);
    console.log('Message Length:', response.data?.message?.length || 0);
    console.log('Artifacts Received:', response.data?.artifacts);
    console.log('Artifacts Type:', typeof response.data?.artifacts);
    console.log('Artifacts Is Array:', Array.isArray(response.data?.artifacts));
    console.log('Artifacts Count:', response.data?.artifacts?.length || 0);
    
    if (response.data?.artifacts && response.data.artifacts.length > 0) {
      console.log('🎉 ARTIFACTS FOUND IN RESPONSE!');
      console.log('First Artifact:', response.data.artifacts[0]);
      console.log('First Artifact Keys:', Object.keys(response.data.artifacts[0] || {}));
    } else {
      console.log('💥 NO ARTIFACTS IN RESPONSE!');
    }
    
    if (response.errors) {
      console.error('🔥 Response Errors:', response.errors);
    }
    
    // Wait a moment for logs to process
    console.log('⏳ Waiting for logs to process...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n=== NEXT STEPS ===');
    console.log('1. Check CloudWatch logs for the lightweightAgent function');
    console.log('2. Look for these debug markers:');
    console.log('   - 🎯 HANDLER: Artifacts being returned');
    console.log('   - 🔍 FRONTEND: Agent artifacts received');
    console.log('   - 🎉 or 💥 markers showing where artifacts are preserved/lost');
    console.log('3. Search for the chat session ID:', testChatSessionId);
    
    return {
      success: true,
      chatSessionId: testChatSessionId,
      artifactsReceived: response.data?.artifacts?.length || 0,
      hasErrors: !!response.errors
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error.message,
      chatSessionId: testChatSessionId
    };
  }
}

// Run the test
testArtifactFlow().then(result => {
  console.log('\n=== TEST SUMMARY ===');
  console.log('Result:', result);
  console.log('Chat Session ID for Log Search:', result.chatSessionId);
  
  if (result.success && result.artifactsReceived > 0) {
    console.log('✅ SUCCESS: Artifacts were received! The issue may be in visualization rendering.');
  } else if (result.success && result.artifactsReceived === 0) {
    console.log('⚠️ ISSUE CONFIRMED: No artifacts received. Check CloudWatch logs for debugging info.');
  } else {
    console.log('❌ ERROR: Test failed. Check error details above.');
  }
}).catch(console.error);
