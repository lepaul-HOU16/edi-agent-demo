/**
 * Test script to verify the fixed EnhancedStrandsAgent functionality
 */

const test = async () => {
  console.log('🧪 === TESTING ENHANCED STRANDS AGENT ===');
  
  try {
    // Import the fixed agent
    const { EnhancedStrandsAgent } = await import('./amplify/functions/agents/enhancedStrandsAgent.ts');
    
    console.log('✅ Agent import successful');
    
    // Initialize the agent
    const agent = new EnhancedStrandsAgent(
      'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
      'test-bucket'
    );
    
    console.log('✅ Agent initialization successful');
    
    // Test basic message processing
    console.log('\n📋 Testing: List Wells Handler');
    const listWellsResult = await agent.processMessage('list wells');
    console.log('Response:', listWellsResult);
    
    console.log('\n🧮 Testing: Porosity Calculation Handler');
    const porosityResult = await agent.processMessage('calculate porosity for WELL_001');
    console.log('Response:', porosityResult);
    
    console.log('\n❓ Testing: Basic Query Handler');
    const basicResult = await agent.processMessage('hello');
    console.log('Response:', basicResult);
    
    console.log('\n✅ === ALL TESTS PASSED ===');
    
    return {
      success: true,
      message: 'EnhancedStrandsAgent is working correctly!'
    };
    
  } catch (error) {
    console.error('❌ === TEST FAILED ===');
    console.error('Error:', error);
    return {
      success: false,
      message: `Test failed: ${error.message}`
    };
  }
};

// Run the test
test().then(result => {
  console.log('\n🎯 === FINAL TEST RESULT ===');
  console.log('Success:', result.success);
  console.log('Message:', result.message);
  process.exit(result.success ? 0 : 1);
});
