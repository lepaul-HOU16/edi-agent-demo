/**
 * Test script to verify the chat agent fix
 * This tests the userId parameter fix for the chat session agent
 */

const { getConfiguredAmplifyClient } = require('./utils/amplifyUtils');

// Set up environment variables
async function setupEnvironment() {
  const { setAmplifyEnvVars } = require('./utils/amplifyUtils');
  const result = await setAmplifyEnvVars();
  
  if (!result.success) {
    console.error('Failed to set up Amplify environment variables:', result.error?.message);
    process.exit(1);
  }
  
  return result;
}

async function testChatAgentFix() {
  console.log('=== TESTING CHAT AGENT FIX ===');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    // Set up environment first
    console.log('\n0. Setting up environment...');
    await setupEnvironment();
    console.log('✅ Environment configured');
    
    const amplifyClient = getConfiguredAmplifyClient();
    
    // Test 1: Create a test chat session
    console.log('\n1. Creating test chat session...');
    const chatSessionResult = await amplifyClient.models.ChatSession.create({
      name: 'Test Chat Fix - ' + Date.now()
    });
    
    if (!chatSessionResult.data?.id) {
      throw new Error('Failed to create chat session');
    }
    
    const chatSessionId = chatSessionResult.data.id;
    console.log('✅ Chat session created:', chatSessionId);
    
    // Test 2: Test agent invocation with userId
    console.log('\n2. Testing agent invocation with userId...');
    
    const testMessage = 'Hello, this is a test message to verify the agent is working.';
    const testUserId = 'test-user-' + Date.now();
    
    console.log('Test message:', testMessage);
    console.log('Test userId:', testUserId);
    
    const agentResponse = await amplifyClient.mutations.invokeLightweightAgent({
      chatSessionId: chatSessionId,
      message: testMessage,
      foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
      userId: testUserId
    });
    
    console.log('\n3. Agent response analysis:');
    console.log('- Response received:', !!agentResponse);
    console.log('- Has data:', !!agentResponse.data);
    console.log('- Has errors:', !!agentResponse.errors);
    
    if (agentResponse.data) {
      console.log('- Success:', agentResponse.data.success);
      console.log('- Message length:', agentResponse.data.message?.length || 0);
      console.log('- Has artifacts:', !!(agentResponse.data.artifacts?.length));
      
      if (agentResponse.data.success) {
        console.log('✅ Agent invocation successful!');
        console.log('Response preview:', agentResponse.data.message?.substring(0, 100) + '...');
      } else {
        console.log('❌ Agent invocation failed:', agentResponse.data.message);
      }
    }
    
    if (agentResponse.errors) {
      console.log('❌ Agent errors:', agentResponse.errors);
    }
    
    // Test 3: Test without userId (should still work due to fallback)
    console.log('\n4. Testing agent invocation without userId (fallback test)...');
    
    const agentResponseNoUserId = await amplifyClient.mutations.invokeLightweightAgent({
      chatSessionId: chatSessionId,
      message: 'Test message without explicit userId',
      foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0'
      // No userId parameter
    });
    
    console.log('- Fallback response success:', !!agentResponseNoUserId.data?.success);
    
    if (agentResponseNoUserId.data?.success) {
      console.log('✅ Fallback mechanism working!');
    } else {
      console.log('⚠️  Fallback may need attention:', agentResponseNoUserId.data?.message);
    }
    
    // Cleanup
    console.log('\n5. Cleaning up test chat session...');
    try {
      await amplifyClient.models.ChatSession.delete({ id: chatSessionId });
      console.log('✅ Cleanup completed');
    } catch (cleanupError) {
      console.log('⚠️  Cleanup warning:', cleanupError.message);
    }
    
    console.log('\n=== TEST SUMMARY ===');
    const mainTestSuccess = agentResponse.data?.success;
    const fallbackTestSuccess = agentResponseNoUserId.data?.success;
    
    if (mainTestSuccess && fallbackTestSuccess) {
      console.log('🎉 ALL TESTS PASSED! Chat agent fix is working correctly.');
      process.exit(0);
    } else if (mainTestSuccess) {
      console.log('✅ Main fix working, but fallback needs attention.');
      process.exit(0);
    } else {
      console.log('❌ Tests failed. Check the agent configuration.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the test
testChatAgentFix().catch(console.error);
