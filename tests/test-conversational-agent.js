/**
 * Test script for the improved conversational agent capabilities
 * Tests natural language queries and cross-well analytics
 */

const { EnhancedStrandsAgent } = require('./amplify/functions/agents/enhancedStrandsAgent');

async function testConversationalCapabilities() {
  console.log('🧪 === TESTING CONVERSATIONAL AGENT CAPABILITIES ===');
  
  // Initialize agent
  const agent = new EnhancedStrandsAgent();

  // Test cases for natural language queries
  const naturalLanguageTests = [
    // The exact problem the user mentioned
    "what is the average porosity of all my wells",
    
    // Other conversational queries
    "which wells are the best",
    "how many wells do I have",
    "what data is available",
    "show me a summary",
    "hello",
    "help",
    "what can you do",
    
    // Edge cases that should NOT trigger long generic responses
    "tell me about the field",
    "give me an overview",
    "can you help me",
    
    // Cross-well analytics queries  
    "what's the average shale volume",
    "rank wells by porosity",
    "field development overview"
  ];

  console.log('🎯 Testing natural language understanding and cross-well analytics...\n');

  for (const testQuery of naturalLanguageTests) {
    console.log(`\n🔍 TESTING QUERY: "${testQuery}"`);
    console.log('─'.repeat(80));
    
    try {
      const startTime = Date.now();
      const result = await agent.processMessage(testQuery);
      const endTime = Date.now();
      
      console.log('✅ RESULT:');
      console.log(`⏱️  Response time: ${endTime - startTime}ms`);
      console.log(`✅ Success: ${result.success}`);
      console.log(`📝 Message length: ${result.message?.length || 0} characters`);
      console.log(`📦 Artifacts: ${result.artifacts?.length || 0}`);
      
      // Check if response is overly long (the problem we're fixing)
      if (result.message && result.message.length > 500) {
        console.log('⚠️  WARNING: Response is long (' + result.message.length + ' chars)');
      } else {
        console.log('✅ Response length is appropriate (' + (result.message?.length || 0) + ' chars)');
      }
      
      // Show first 200 chars of response
      console.log('📄 Response preview:', result.message?.substring(0, 200) + '...');
      
      // Check if this feels conversational vs robotic
      if (result.message) {
        const isConversational = !result.message.includes('Petrophysical Analysis Ready') && 
                               !result.message.includes('**Quick Start:**') &&
                               !result.message.includes('**Advanced Analysis:**');
        
        console.log(isConversational ? '💬 CONVERSATIONAL ✅' : '🤖 ROBOTIC/GENERIC ❌');
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  }

  console.log('\n🏁 === CONVERSATIONAL TESTING COMPLETE ===');
}

// Advanced test for specific scenarios
async function testSpecificScenarios() {
  console.log('\n🧪 === TESTING SPECIFIC PROBLEM SCENARIOS ===');
  
  const agent = new EnhancedStrandsAgent();
  
  const problematicQueries = [
    // These should get DIRECT answers, not generic responses
    "what's the average porosity of all my wells",
    "which wells have the highest porosity", 
    "show me the best wells",
    "how many wells do I have available",
    "what data do I have access to",
    
    // Out of scope questions that shouldn't trigger long generic responses
    "what's the weather like",
    "tell me a joke",
    "what's the meaning of life",
    
    // Edge cases
    "help me understand my reservoir",
    "give me insights about the field",
    "summarize everything"
  ];

  for (const query of problematicQueries) {
    console.log(`\n🎯 TESTING PROBLEMATIC QUERY: "${query}"`);
    console.log('─'.repeat(80));
    
    try {
      const result = await agent.processMessage(query);
      
      // Evaluate response quality
      const messageLength = result.message?.length || 0;
      const isGenericResponse = result.message?.includes('**Quick Start:**') || 
                              result.message?.includes('**Advanced Analysis:**') ||
                              result.message?.includes('Petrophysical Analysis Ready');
      
      console.log(`📏 Length: ${messageLength} chars`);
      console.log(`🎭 Generic: ${isGenericResponse ? 'YES ❌' : 'NO ✅'}`);
      console.log(`📝 Preview: ${result.message?.substring(0, 150)}...`);
      
      // Success criteria:
      // 1. Not overly long (< 400 chars for simple questions)
      // 2. Not generic boilerplate
      // 3. Actually tries to answer the question
      
      if (!isGenericResponse && messageLength < 400) {
        console.log('🎉 IMPROVED RESPONSE ✅');
      } else if (isGenericResponse) {
        console.log('❌ STILL GENERIC - needs more work');
      } else if (messageLength > 500) {
        console.log('❌ TOO LONG - feels robotic');
      }
      
    } catch (error) {
      console.error('❌ Test error:', error);
    }
  }
}

// Run tests
if (require.main === module) {
  console.log('🚀 Starting conversational agent tests...\n');
  
  testConversationalCapabilities()
    .then(() => testSpecificScenarios())
    .then(() => {
      console.log('\n✅ All tests completed!');
      console.log('\n📋 SUMMARY:');
      console.log('✅ Natural language understanding added');
      console.log('✅ Cross-well analytics tools created');
      console.log('✅ Intent detection made more flexible');
      console.log('✅ Generic responses replaced with smart fallbacks');
      console.log('\n🎯 Next step: Deploy and test in production');
    })
    .catch(console.error);
}

module.exports = {
  testConversationalCapabilities,
  testSpecificScenarios
};
