/**
 * Test script to validate the agent error fixes
 * Tests the gamma ray shale analysis workflow that was failing
 */

const { Amplify } = require('aws-amplify');
const { generateClient } = require('aws-amplify/data');

// Load Amplify configuration
let outputs;
try {
  outputs = require('./amplify_outputs.json');
  console.log('✅ Loaded amplify_outputs.json successfully');
} catch (error) {
  console.error('❌ Failed to load amplify_outputs.json:', error.message);
  process.exit(1);
}

// Configure Amplify
Amplify.configure(outputs);
const client = generateClient();

console.log('🧪 === AGENT ERROR FIX VALIDATION ===');
console.log('🎯 Target: Gamma ray shale analysis workflow');
console.log('🔧 Testing enhanced error handling and tool loading fixes');
console.log('');

async function testAgentFix() {
  const testCases = [
    {
      name: 'List Wells - Basic Functionality',
      message: 'list wells',
      expected: 'Should return available wells from S3'
    },
    {
      name: 'Gamma Ray Shale Analysis - Original Failing Request',
      message: 'Analyze the gamma ray logs from the wells and calculate shale volume using the Larionov method. Create interactive plots showing shale volume vs depth for the wells and identify the cleanest sand intervals. Focus on creating clear, engaging visualizations.',
      expected: 'Should process without null data/errors'
    },
    {
      name: 'Simple Well Info Request',
      message: 'well info WELL-001',
      expected: 'Should return well information or helpful error'
    },
    {
      name: 'Calculate Porosity - Tool Testing',
      message: 'calculate porosity for WELL-001',
      expected: 'Should execute tool or provide helpful guidance'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🔍 Testing: ${testCase.name}`);
    console.log(`📝 Message: ${testCase.message}`);
    console.log(`🎯 Expected: ${testCase.expected}`);
    console.log('─'.repeat(80));

    try {
      const startTime = Date.now();
      
      // Create a test chat session
      const chatSessionResult = await client.models.ChatSession.create({
        name: `Test Session - ${testCase.name}`
      });
      
      if (!chatSessionResult.data) {
        console.error('❌ Failed to create chat session');
        continue;
      }
      
      const chatSessionId = chatSessionResult.data.id;
      console.log(`📋 Created chat session: ${chatSessionId}`);

      // Create user message
      const messageResult = await client.models.ChatMessage.create({
        role: 'human',
        content: { text: testCase.message },
        chatSessionId: chatSessionId
      });

      if (!messageResult.data) {
        console.error('❌ Failed to create user message');
        continue;
      }

      console.log(`💬 Created user message: ${messageResult.data.id}`);

      // Invoke the agent
      console.log('🤖 Invoking lightweight agent...');
      const agentResult = await client.mutations.invokeLightweightAgent({
        chatSessionId: chatSessionId,
        message: testCase.message,
        foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
        userId: 'test-user'
      });

      const duration = Date.now() - startTime;
      console.log(`⏱️ Duration: ${duration}ms`);

      // Analyze results
      if (agentResult.errors && agentResult.errors.length > 0) {
        console.log('❌ AGENT INVOCATION ERRORS:');
        agentResult.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error.message}`);
          if (error.extensions) {
            console.log(`      Extensions:`, error.extensions);
          }
        });
      }

      if (agentResult.data === null) {
        console.log('❌ AGENT RETURNED NULL DATA');
        console.log('   This indicates a Lambda function failure');
      } else if (agentResult.data) {
        console.log('✅ AGENT RESPONSE RECEIVED:');
        console.log(`   Success: ${agentResult.data.success}`);
        console.log(`   Message Length: ${agentResult.data.message?.length || 0} characters`);
        console.log(`   Artifacts: ${agentResult.data.artifacts?.length || 0}`);
        
        if (agentResult.data.message) {
          const preview = agentResult.data.message.substring(0, 200);
          console.log(`   Message Preview: ${preview}${agentResult.data.message.length > 200 ? '...' : ''}`);
        }

        // Check for specific issues in the response
        if (!agentResult.data.success && agentResult.data.message) {
          console.log('⚠️ AGENT REPORTED FAILURE:');
          console.log(`   Error: ${agentResult.data.message}`);
        }
      }

      // Check for AI response messages created
      console.log('📨 Checking for AI response messages...');
      const messagesResult = await client.models.ChatMessage.list({
        filter: { chatSessionId: { eq: chatSessionId } }
      });

      const aiMessages = messagesResult.data?.filter(msg => msg.role === 'ai') || [];
      console.log(`   AI Messages Created: ${aiMessages.length}`);
      
      aiMessages.forEach((msg, index) => {
        console.log(`   AI Message ${index + 1}: ${msg.content?.text?.substring(0, 100)}...`);
      });

      // Overall test result
      const testPassed = agentResult.data !== null && (!agentResult.errors || agentResult.errors.length === 0);
      console.log(`\n${testPassed ? '✅' : '❌'} Test Result: ${testPassed ? 'PASSED' : 'FAILED'}`);
      
      if (testPassed) {
        console.log('   Agent successfully processed the request without null data or GraphQL errors');
      } else {
        console.log('   Agent still experiencing issues - check logs above for details');
      }

    } catch (error) {
      console.error(`💥 Test failed with exception: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
      console.log('❌ Test Result: EXCEPTION');
    }

    console.log('\n' + '='.repeat(80));
  }
}

async function main() {
  try {
    await testAgentFix();
    
    console.log('\n🏁 === AGENT ERROR FIX VALIDATION COMPLETE ===');
    console.log('');
    console.log('📊 Summary:');
    console.log('   - Enhanced error logging added to amplifyUtils.ts');
    console.log('   - Fixed dynamic import issues in EnhancedStrandsAgent');
    console.log('   - Improved tool loading mechanism with better error handling');
    console.log('   - Added detailed debugging for MCP tool execution');
    console.log('');
    console.log('🔍 Next Steps:');
    console.log('   1. Check CloudWatch logs for Lambda function details if issues persist');
    console.log('   2. Verify S3 bucket access and environment variables');
    console.log('   3. Test gamma ray analysis in production environment');
    console.log('');
    
  } catch (error) {
    console.error('💥 Main execution failed:', error);
    process.exit(1);
  }
}

main();
