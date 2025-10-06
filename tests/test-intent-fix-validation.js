/**
 * Test script to validate the intent detection fix
 * This will test the agent response for basic prompts without well names
 */

const AWS = require('aws-sdk');
require('dotenv').config({ path: '.env.local' });

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN
});

const lambda = new AWS.Lambda();

async function testAgentIntentFix() {
  console.log('🧪 === TESTING INTENT DETECTION FIX ===');
  console.log('🎯 Goal: Verify that first prompts without well names work correctly');
  console.log('📝 Testing various first-prompt scenarios...\n');

  // Test cases that should now work after intent detection fix
  const testCases = [
    {
      name: 'Simple porosity request without well name',
      message: 'calculate porosity',
      expectedIntent: 'calculate_porosity',
      expectSuccess: true,
      description: 'Should detect porosity intent and provide well suggestions'
    },
    {
      name: 'General analysis request',
      message: 'analyze well data',
      expectedIntent: 'formation_evaluation',
      expectSuccess: true,
      description: 'Should detect analysis intent and provide guidance'
    },
    {
      name: 'List wells request',
      message: 'list wells',
      expectedIntent: 'list_wells', 
      expectSuccess: true,
      description: 'Should work perfectly as before'
    },
    {
      name: 'Basic greeting/first prompt',
      message: 'hello',
      expectedIntent: 'list_wells', // fallback
      expectSuccess: true,
      description: 'Should fallback to list wells gracefully'
    },
    {
      name: 'Shale analysis request',
      message: 'calculate shale volume',
      expectedIntent: 'calculate_shale',
      expectSuccess: true,
      description: 'Should detect shale intent and provide well suggestions'
    }
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const testCase of testCases) {
    console.log(`\n🔬 Test: ${testCase.name}`);
    console.log(`📝 Message: "${testCase.message}"`);
    console.log(`🎯 Expected Intent: ${testCase.expectedIntent}`);
    console.log(`✅ Should Succeed: ${testCase.expectSuccess}`);
    console.log(`📋 Description: ${testCase.description}`);
    
    try {
      const payload = {
        arguments: {
          message: testCase.message,
          foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
          userId: 'test-user-intent-fix'
        },
        identity: {
          sub: 'test-user-intent-fix'
        }
      };

      console.log('🔧 Invoking enhanced Strands agent...');
      const result = await lambda.invoke({
        FunctionName: 'amplify-digitalassistant--lightweightAgentlambda3D-SvyqMpiwGrVq',
        Payload: JSON.stringify(payload),
        InvocationType: 'RequestResponse'
      }).promise();

      const response = JSON.parse(result.Payload);
      
      console.log('📤 Raw Lambda Response:');
      console.log('- Success:', response.success);
      console.log('- Message Length:', response.message?.length || 0);
      console.log('- Message Preview:', response.message?.substring(0, 150) + '...');
      console.log('- Has Artifacts:', Array.isArray(response.artifacts));
      console.log('- Artifact Count:', response.artifacts?.length || 0);

      // Analyze the response
      const actualSuccess = response.success === true;
      const actualMessage = response.message || '';
      
      console.log('\n🔍 DETAILED ANALYSIS:');
      console.log('- Actual Success:', actualSuccess);
      console.log('- Expected Success:', testCase.expectSuccess);
      console.log('- Contains "well not found":', actualMessage.toLowerCase().includes('well') && actualMessage.toLowerCase().includes('not found'));
      console.log('- Contains suggestions:', actualMessage.toLowerCase().includes('available wells') || actualMessage.toLowerCase().includes('list wells'));
      
      // Check if the response matches expectations
      const testPassed = (actualSuccess === testCase.expectSuccess) && 
                         !(actualMessage.toLowerCase().includes('well') && actualMessage.toLowerCase().includes('not found'));
      
      if (testPassed) {
        console.log('✅ TEST PASSED');
        passedTests++;
      } else {
        console.log('❌ TEST FAILED');
        console.log('🔍 Failure Analysis:');
        console.log('- Success mismatch:', actualSuccess !== testCase.expectSuccess);
        console.log('- Contains "well not found":', actualMessage.toLowerCase().includes('well') && actualMessage.toLowerCase().includes('not found'));
        failedTests++;
      }

    } catch (error) {
      console.error('❌ TEST ERROR:', error.message);
      console.error('🔍 Error Details:', error);
      failedTests++;
    }
  }

  console.log('\n🏁 === TEST SUMMARY ===');
  console.log(`✅ Passed: ${passedTests}/${testCases.length}`);
  console.log(`❌ Failed: ${failedTests}/${testCases.length}`);
  console.log(`📊 Success Rate: ${((passedTests / testCases.length) * 100).toFixed(1)}%`);
  
  if (failedTests === 0) {
    console.log('🎉 ALL TESTS PASSED! Intent detection fix is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. The issue may be deeper than intent detection.');
    console.log('💡 Possible causes:');
    console.log('- MCP tools returning "well not found" errors');
    console.log('- Handler logic still requiring well names');
    console.log('- Tool import or execution failures');
  }

  return {
    totalTests: testCases.length,
    passedTests,
    failedTests,
    successRate: (passedTests / testCases.length) * 100
  };
}

// Run the test
testAgentIntentFix()
  .then(results => {
    console.log('\n📋 Final Results:', results);
    process.exit(results.failedTests === 0 ? 0 : 1);
  })
  .catch(error => {
    console.error('🚨 Test execution failed:', error);
    process.exit(1);
  });
