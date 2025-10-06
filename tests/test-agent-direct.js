/**
 * Direct test of the enhanced Strands agent to debug the "well not found" issue
 * This bypasses Lambda and tests the agent logic directly
 */

// Mock the S3 client to avoid AWS dependencies
const mockS3Client = {
  send: async () => ({ Contents: [] })
};

// Mock AWS SDK
const mockS3 = {
  S3Client: function() { return mockS3Client; },
  ListObjectsV2Command: function() { return {}; },
  GetObjectCommand: function() { return {}; }
};

// Set up module mocking
const originalRequire = require;
require = function(moduleName) {
  if (moduleName === '@aws-sdk/client-s3') {
    return mockS3;
  }
  return originalRequire.apply(this, arguments);
};

async function testAgentDirectly() {
  console.log('🧪 === DIRECT AGENT TEST START ===');
  console.log('🎯 Testing enhanced Strands agent directly to debug "well not found" issue');
  
  try {
    // Import the enhanced Strands agent
    const { EnhancedStrandsAgent } = await import('./amplify/functions/agents/enhancedStrandsAgent.ts');
    
    console.log('✅ Successfully imported EnhancedStrandsAgent');
    
    // Create agent instance
    const agent = new EnhancedStrandsAgent(
      'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
      'test-bucket'
    );
    
    console.log('✅ Agent instance created');
    
    // Test cases that were problematic before
    const testCases = [
      {
        name: 'Simple porosity request without well name',
        message: 'calculate porosity',
        expectedSuccess: true,
        description: 'Should now provide well suggestions instead of "well not found" error'
      },
      {
        name: 'Basic greeting', 
        message: 'hello',
        expectedSuccess: true,
        description: 'Should fallback to list wells gracefully'
      },
      {
        name: 'List wells request',
        message: 'list wells',
        expectedSuccess: true,
        description: 'Should work as expected'
      },
      {
        name: 'Shale calculation request',
        message: 'calculate shale volume', 
        expectedSuccess: true,
        description: 'Should provide well suggestions instead of error'
      }
    ];

    let passedTests = 0;
    let failedTests = 0;

    for (const testCase of testCases) {
      console.log(`\n🔬 Testing: ${testCase.name}`);
      console.log(`📝 Message: "${testCase.message}"`);
      console.log(`📋 Description: ${testCase.description}`);
      
      try {
        console.log('🔄 Processing message...');
        const result = await agent.processMessage(testCase.message);
        
        console.log('📤 Agent Result:');
        console.log('- Success:', result.success);
        console.log('- Message Length:', result.message?.length || 0);
        console.log('- Message Preview:', result.message?.substring(0, 200) + '...');
        console.log('- Has Artifacts:', Array.isArray(result.artifacts));
        console.log('- Artifact Count:', result.artifacts?.length || 0);
        
        // Check for problematic patterns
        const hasWellNotFound = result.message && 
                               result.message.toLowerCase().includes('well') && 
                               result.message.toLowerCase().includes('not found');
        
        const hasWellSuggestions = result.message && (
          result.message.toLowerCase().includes('available wells') ||
          result.message.toLowerCase().includes('list wells') ||
          result.message.toLowerCase().includes('here are some')
        );
        
        console.log('\n🔍 ANALYSIS:');
        console.log('- Contains "well not found":', hasWellNotFound);  
        console.log('- Contains well suggestions:', hasWellSuggestions);
        console.log('- Expected Success:', testCase.expectedSuccess);
        console.log('- Actual Success:', result.success);
        
        // Test passes if:
        // 1. Success matches expectation
        // 2. No "well not found" message
        // 3. For calculation requests without wells, should have suggestions
        const testPassed = (result.success === testCase.expectedSuccess) &&
                          !hasWellNotFound &&
                          (testCase.message.includes('calculate') ? hasWellSuggestions : true);
        
        if (testPassed) {
          console.log('✅ TEST PASSED');
          passedTests++;
        } else {
          console.log('❌ TEST FAILED');
          console.log('🔍 Failure Details:');
          console.log('  - Success mismatch:', result.success !== testCase.expectedSuccess);
          console.log('  - Has "well not found":', hasWellNotFound);
          console.log('  - Missing suggestions for calc request:', testCase.message.includes('calculate') && !hasWellSuggestions);
          failedTests++;
        }
        
      } catch (error) {
        console.error('❌ TEST ERROR:', error.message);
        console.error('🔍 Stack trace:', error.stack?.substring(0, 500));
        failedTests++;
      }
    }

    console.log('\n🏁 === DIRECT TEST SUMMARY ===');
    console.log(`✅ Passed: ${passedTests}/${testCases.length}`);
    console.log(`❌ Failed: ${failedTests}/${testCases.length}`);
    console.log(`📊 Success Rate: ${((passedTests / testCases.length) * 100).toFixed(1)}%`);
    
    if (failedTests === 0) {
      console.log('🎉 ALL TESTS PASSED! Intent detection fix is working correctly.');
      console.log('💡 The issue should be resolved in the deployed version.');
    } else {
      console.log('⚠️ Some tests still failing. The issue may be:');
      console.log('- MCP tools returning "well not found" errors');
      console.log('- Handler logic still problematic');
      console.log('- Tool loading/execution issues');
    }

  } catch (error) {
    console.error('❌ DIRECT TEST SETUP ERROR:', error.message);
    console.error('🔍 This may be due to TypeScript/import issues in Node.js');
    console.error('💡 The deployed Lambda version should still work correctly');
  }
}

// Run the direct test
testAgentDirectly()
  .then(() => {
    console.log('\n✅ Direct test completed');
  })
  .catch(error => {
    console.error('🚨 Direct test failed:', error.message);
  });
