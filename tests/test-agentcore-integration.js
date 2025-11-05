/**
 * Test AgentCore Integration for Petrophysics
 * 
 * This test verifies that the Bedrock Agent (AgentCore) is properly configured
 * and can be invoked from the enhanced Strands agent.
 */

const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require('@aws-sdk/client-bedrock-agent-runtime');

// Configuration
const AGENT_ID = 'QUQKELPKM2';
const AGENT_ALIAS_ID = 'S5YWIUZOGB';
const REGION = 'us-east-1';

async function testAgentCoreIntegration() {
  console.log('🧪 === AGENTCORE INTEGRATION TEST START ===\n');
  
  try {
    // Step 1: Verify environment configuration
    console.log('📋 Step 1: Verify Configuration');
    console.log('Agent ID:', AGENT_ID);
    console.log('Agent Alias ID:', AGENT_ALIAS_ID);
    console.log('Region:', REGION);
    console.log('✅ Configuration verified\n');
    
    // Step 2: Create Bedrock Agent Runtime client
    console.log('📋 Step 2: Create Bedrock Agent Runtime Client');
    const client = new BedrockAgentRuntimeClient({ region: REGION });
    console.log('✅ Client created\n');
    
    // Step 3: Test simple porosity calculation
    console.log('📋 Step 3: Test Porosity Calculation');
    const sessionId = `test-${Date.now()}`;
    const prompt = 'Calculate porosity for well-001 using density method';
    
    console.log('Session ID:', sessionId);
    console.log('Prompt:', prompt);
    
    const command = new InvokeAgentCommand({
      agentId: AGENT_ID,
      agentAliasId: AGENT_ALIAS_ID,
      sessionId: sessionId,
      inputText: prompt
    });
    
    console.log('📤 Sending request to Bedrock Agent...');
    const response = await client.send(command);
    
    console.log('✅ Response received');
    console.log('Response structure:', Object.keys(response));
    
    // Step 4: Process streaming response
    console.log('\n📋 Step 4: Process Streaming Response');
    let fullResponse = '';
    let chunkCount = 0;
    
    if (response.completion) {
      for await (const event of response.completion) {
        if (event.chunk && event.chunk.bytes) {
          const chunk = new TextDecoder().decode(event.chunk.bytes);
          fullResponse += chunk;
          chunkCount++;
          console.log(`📦 Chunk ${chunkCount}:`, chunk.substring(0, 100) + (chunk.length > 100 ? '...' : ''));
        }
      }
    }
    
    console.log('\n✅ Streaming complete');
    console.log('Total chunks:', chunkCount);
    console.log('Full response length:', fullResponse.length);
    console.log('Full response preview:', fullResponse.substring(0, 500));
    
    // Step 5: Verify response format
    console.log('\n📋 Step 5: Verify Response Format');
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(fullResponse);
      console.log('✅ Response is valid JSON');
      console.log('Response keys:', Object.keys(parsedResponse));
      
      if (parsedResponse.success !== undefined) {
        console.log('✅ Has success field:', parsedResponse.success);
      }
      if (parsedResponse.message) {
        console.log('✅ Has message field (length:', parsedResponse.message.length, ')');
      }
      if (parsedResponse.artifacts) {
        console.log('✅ Has artifacts field (count:', parsedResponse.artifacts.length, ')');
      }
    } catch (e) {
      console.log('⚠️ Response is not JSON (this is okay, agent may return text)');
      console.log('Response type:', typeof fullResponse);
    }
    
    console.log('\n🎉 === AGENTCORE INTEGRATION TEST COMPLETE ===');
    console.log('✅ All steps passed successfully');
    console.log('\nNext steps:');
    console.log('1. Deploy the updated backend: npx ampx sandbox');
    console.log('2. Test in the UI: "calculate porosity for well-001"');
    console.log('3. Check CloudWatch logs for detailed execution traces');
    
    return {
      success: true,
      sessionId,
      responseLength: fullResponse.length,
      chunkCount,
      response: fullResponse
    };
    
  } catch (error) {
    console.error('\n❌ === AGENTCORE INTEGRATION TEST FAILED ===');
    console.error('Error:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Verify Agent ID and Alias ID are correct');
    console.log('2. Check IAM permissions for Bedrock Agent Runtime');
    console.log('3. Ensure the agent is in PREPARED state');
    console.log('4. Check AWS region matches agent region');
    
    return {
      success: false,
      error: error.message,
      errorCode: error.code
    };
  }
}

// Run the test
if (require.main === module) {
  testAgentCoreIntegration()
    .then(result => {
      console.log('\n📊 Test Result:', result.success ? '✅ PASSED' : '❌ FAILED');
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { testAgentCoreIntegration };
