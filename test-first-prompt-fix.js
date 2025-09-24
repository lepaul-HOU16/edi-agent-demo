/**
 * Test script to verify the first prompt fix works correctly
 * This tests the specific issue where first prompts returned "well not found" errors
 */

const { EnhancedStrandsAgent } = require('./amplify/functions/agents/enhancedStrandsAgent.ts');

async function testFirstPromptFix() {
  console.log('🧪 === FIRST PROMPT FIX VALIDATION ===');
  console.log('🎯 Testing the fix for first prompt "well not found" errors');
  
  try {
    // Create agent instance (mock S3 for local testing)
    const agent = new EnhancedStrandsAgent(
      'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
      'test-bucket'
    );
    
    console.log('✅ Agent instance created successfully');
    
    // Test cases that previously failed with "well not found" errors
    const testCases = [
      {
        name: 'Simple porosity calculation without well name',
        prompt: 'calculate porosity',
        expectedBehavior: 'Should provide helpful well suggestions, not error'
      },
      {
        name: 'Basic shale calculation without well name',
        prompt: 'calculate shale volume',
        expectedBehavior: 'Should provide helpful guidance, not error'
      },
      {
        name: 'General greeting',
        prompt: 'hello',
        expectedBehavior: 'Should fallback to list wells gracefully'
      },
      {
        name: 'Formation evaluation without well name',
        prompt: 'formation evaluation',
        expectedBehavior: 'Should suggest specifying a well name'
      },
      {
        name: 'List wells command',
        prompt: 'list wells',
        expectedBehavior: 'Should work normally'
      }
    ];

    let passedTests = 0;
    let failedTests = 0;

    for (const testCase of testCases) {
      console.log(`\n🔬 Testing: ${testCase.name}`);
      console.log(`📝 Prompt: "${testCase.prompt}"`);
      console.log(`📋 Expected: ${testCase.expectedBehavior}`);
      
      try {
        const result = await agent.processMessage(testCase.prompt);
        
        console.log('📤 Response Details:');
        console.log('- Success:', result.success);
        console.log('- Message Preview:', result.message?.substring(0, 150) + '...');
        console.log('- Has Artifacts:', Array.isArray(result.artifacts));
        
        // Check for the old problematic patterns
        const hasWellNotFoundError = result.message && 
                                    result.message.toLowerCase().includes('well') && 
                                    result.message.toLowerCase().includes('not found');
        
        const hasHelpfulGuidance = result.message && (
          result.message.toLowerCase().includes('available wells') ||
          result.message.toLowerCase().includes('list wells') ||
          result.message.toLowerCase().includes('specify') ||
          result.message.toLowerCase().includes('help') ||
          result.message.toLowerCase().includes('choose from')
        );
        
        console.log('\n🔍 ANALYSIS:');
        console.log('- Contains "well not found":', hasWellNotFoundError);
        console.log('- Contains helpful guidance:', hasHelpfulGuidance);
        console.log('- Response is success:', result.success === true);
        
        // Test passes if:
        // 1. No "well not found" error message
        // 2. Response shows success = true (not false)
        // 3. For calculation requests, should have helpful guidance
        const calculationRequests = ['calculate porosity', 'calculate shale volume', 'formation evaluation'];
        const isCalculationRequest = calculationRequests.includes(testCase.prompt);
        
        const testPassed = !hasWellNotFoundError && 
                          result.success === true &&
                          (!isCalculationRequest || hasHelpfulGuidance);
        
        if (testPassed) {
          console.log('✅ TEST PASSED');
          passedTests++;
        } else {
          console.log('❌ TEST FAILED');
          console.log('🔍 Failure Reasons:');
          if (hasWellNotFoundError) console.log('  - Still has "well not found" error');
          if (result.success !== true) console.log('  - Success is not true:', result.success);
          if (isCalculationRequest && !hasHelpfulGuidance) console.log('  - Missing helpful guidance for calculation request');
          failedTests++;
        }
        
      } catch (error) {
        console.error('❌ TEST ERROR:', error.message);
        console.log('🔍 Error Details:', error.stack?.substring(0, 300));
        failedTests++;
      }
    }

    console.log('\n🏁 === FIRST PROMPT FIX TEST SUMMARY ===');
    console.log(`✅ Passed: ${passedTests}/${testCases.length}`);
    console.log(`❌ Failed: ${failedTests}/${testCases.length}`);
    console.log(`📊 Success Rate: ${((passedTests / testCases.length) * 100).toFixed(1)}%`);
    
    if (failedTests === 0) {
      console.log('\n🎉 SUCCESS! First prompt fix is working correctly.');
      console.log('💡 Users should now get helpful guidance instead of "well not found" errors.');
      console.log('🚀 Ready for deployment!');
      
      return true;
    } else {
      console.log('\n⚠️ Some tests still failing. Issues to investigate:');
      console.log('- Check if MCP tools are returning the right responses');
      console.log('- Verify intent detection is working correctly');
      console.log('- Ensure handler logic provides helpful guidance');
      
      return false;
    }

  } catch (setupError) {
    console.error('❌ SETUP ERROR:', setupError.message);
    console.error('🔍 This might be due to TypeScript import issues in Node.js');
    console.error('💡 The actual Lambda deployment should work correctly');
    return false;
  }
}

// Run the test
testFirstPromptFix()
  .then(success => {
    if (success) {
      console.log('\n✅ First prompt fix validation completed successfully');
      process.exit(0);
    } else {
      console.log('\n❌ First prompt fix validation failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('🚨 Test execution failed:', error.message);
    process.exit(1);
  });
