// Simple test for the lightweight agent architecture
const { LightweightAgent } = require('./amplify/functions/agents/lightweightAgent');

async function testLightweightAgent() {
  console.log('Testing lightweight agent architecture...');
  
  const context = {
    userId: 'test-user',
    chatSessionId: 'test-session',
    s3Bucket: 'test-bucket'
  };

  const agent = new LightweightAgent(context);
  
  const request = {
    userId: 'test-user',
    chatSessionId: 'test-session',
    message: 'Hello, can you help me with data analysis?'
  };

  try {
    const response = await agent.processMessage(request);
    console.log('✅ Agent response:', response);
    return true;
  } catch (error) {
    console.error('❌ Agent test failed:', error);
    return false;
  }
}

// Only run if called directly
if (require.main === module) {
  testLightweightAgent()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Test error:', error);
      process.exit(1);
    });
}

module.exports = { testLightweightAgent };
