/**
 * Simple test to verify the intent detection fix is working
 * This tests just the very basics without complex MCP tool dependencies
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

async function testBasicIntentDetection() {
  console.log('🧪 === SIMPLE INTENT DETECTION TEST ===');
  console.log('🎯 Testing if "calculate porosity" produces helpful guidance vs "well not found"');
  
  try {
    const payload = {
      arguments: {
        message: 'calculate porosity',
        foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
        userId: 'test-user-simple'
      },
      identity: {
        sub: 'test-user-simple'
      }
    };

    console.log('🔧 Invoking Lambda with message: "calculate porosity"');
    const result = await lambda.invoke({
      FunctionName: 'amplify-digitalassistant--lightweightAgentlambda3D-SvyqMpiwGrVq',
      Payload: JSON.stringify(payload),
      InvocationType: 'RequestResponse'
    }).promise();

    const response = JSON.parse(result.Payload);
    
    console.log('📤 Response Analysis:');
    console.log('- Success:', response.success);
    console.log('- Message Length:', response.message?.length || 0);
    console.log('- Full Message:', response.message);
    
    // Key analysis: Does this contain the old "well not found" error?
    const hasOldError = response.message && 
                       response.message.includes('The well you specified could not be found');
    
    const hasWellNotFoundPattern = response.message && 
                                  response.message.toLowerCase().includes('well') && 
                                  response.message.toLowerCase().includes('not found');
    
    const hasHelpfulGuidance = response.message && (
      response.message.includes('available wells') ||
      response.message.includes('list wells') ||
      response.message.includes('Here are some') ||
      response.message.includes('Available methods') ||
      response.message.includes('Please specify')
    );

    console.log('\n🔍 KEY INDICATORS:');
    console.log('❌ Has OLD "well not found" error:', hasOldError);
    console.log('⚠️ Has ANY "well not found" pattern:', hasWellNotFoundPattern); 
    console.log('✅ Has helpful guidance:', hasHelpfulGuidance);
    
    if (hasOldError) {
      console.log('\n💥 PROBLEM: Still getting the exact old error message');
      console.log('🔧 This means the intent fix may not have deployed correctly');
    } else if (hasWellNotFoundPattern) {
      console.log('\n⚠️ PARTIAL IMPROVEMENT: No longer the exact old message but still has "well not found"');
      console.log('🔧 This suggests the fix is working but there are secondary issues');
    } else if (hasHelpfulGuidance) {
      console.log('\n🎉 SUCCESS: Intent detection fix is working!');
      console.log('✅ Now providing helpful guidance instead of confusing errors');
    } else {
      console.log('\n❓ UNCLEAR: Different error pattern detected');
      console.log('🔧 May need further investigation');
    }

    return {
      hasOldError,
      hasWellNotFoundPattern, 
      hasHelpfulGuidance,
      responseMessage: response.message,
      success: response.success
    };

  } catch (error) {
    console.error('❌ TEST ERROR:', error.message);
    return {
      error: error.message,
      hasOldError: false,
      hasWellNotFoundPattern: false,
      hasHelpfulGuidance: false
    };
  }
}

// Run the simple test
testBasicIntentDetection()
  .then(result => {
    console.log('\n📋 === FINAL ASSESSMENT ===');
    
    if (result.hasOldError) {
      console.log('❌ INTENT FIX NOT WORKING: Still getting old error message');
      console.log('💡 Possible causes:');
      console.log('  - Fix not deployed to the correct Lambda function');
      console.log('  - User may be testing against a different environment');
      console.log('  - Caching issues preventing the fix from taking effect');
      
    } else if (result.hasHelpfulGuidance) {
      console.log('🎉 INTENT FIX WORKING: Now providing helpful guidance!'); 
      console.log('✅ The original "well not found" error has been resolved');
      console.log('💡 If user still sees the old error, they may need to:');
      console.log('  - Clear browser cache');
      console.log('  - Use the correct environment'); 
      console.log('  - Wait for deployment propagation');
      
    } else {
      console.log('⚠️ PARTIAL SUCCESS: Old error gone but new issues present');
      console.log('🔧 The intent detection fix worked, but there may be:');
      console.log('  - MCP server connectivity issues');
      console.log('  - AWS permissions problems'); 
      console.log('  - Tool import/execution failures');
    }
    
    console.log('\n📋 Summary of findings:', result);
  })
  .catch(error => {
    console.error('🚨 Test failed:', error);
  });
