const { generateClient } = require('aws-amplify/data');
const { Amplify } = require('aws-amplify');

// Load Amplify configuration
const outputs = require('./amplify_outputs.json');

Amplify.configure({
  API: {
    GraphQL: {
      endpoint: outputs.data.url,
      region: outputs.data.aws_region,
      defaultAuthMode: 'identityPool'
    }
  },
  Auth: {
    Cognito: {
      identityPoolId: outputs.auth.identity_pool_id,
      userPoolId: outputs.auth.user_pool_id,
      userPoolClientId: outputs.auth.user_pool_client_id
    }
  }
});

const client = generateClient();

async function testAIResponsePersistence() {
  console.log('=== TESTING AI RESPONSE PERSISTENCE ===');
  
  try {
    // Create a test chat session
    const testSessionId = `test-session-${Date.now()}`;
    console.log('Test session ID:', testSessionId);
    
    // Send a test message
    console.log('Sending test message: "list wells"');
    
    const userMessage = {
      role: 'human',
      content: { text: 'list wells' },
      chatSessionId: testSessionId
    };
    
    // Create user message
    const { data: userMessageData, errors: userErrors } = await client.models.ChatMessage.create(userMessage);
    
    if (userErrors) {
      console.error('Error creating user message:', userErrors);
      return;
    }
    
    console.log('User message created:', userMessageData.id);
    
    // Invoke the agent
    console.log('Invoking lightweight agent...');
    const agentResponse = await client.mutations.invokeLightweightAgent({
      chatSessionId: testSessionId,
      message: 'list wells',
      foundationModelId: 'anthropic.claude-3-haiku-20240307-v1:0'
    });
    
    console.log('Agent response:', agentResponse);
    
    // Wait a moment for the AI response to be saved
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if AI response was saved
    console.log('Checking for AI response in database...');
    const { data: messages } = await client.models.ChatMessage.list({
      filter: {
        chatSessionId: { eq: testSessionId }
      }
    });
    
    console.log(`Found ${messages.length} messages in session`);
    
    const aiMessages = messages.filter(msg => msg.role === 'ai');
    console.log(`Found ${aiMessages.length} AI messages`);
    
    if (aiMessages.length > 0) {
      const aiMessage = aiMessages[0];
      console.log('✅ AI response found!');
      console.log('- Message ID:', aiMessage.id);
      console.log('- Response complete:', aiMessage.responseComplete);
      console.log('- Content preview:', aiMessage.content?.text?.substring(0, 100) + '...');
      console.log('- Created at:', aiMessage.createdAt);
    } else {
      console.log('❌ No AI response found in database');
    }
    
    // Clean up test messages
    console.log('Cleaning up test messages...');
    for (const message of messages) {
      await client.models.ChatMessage.delete({ id: message.id });
    }
    
    console.log('Test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAIResponsePersistence();
