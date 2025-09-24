#!/usr/bin/env node

/**
 * Test script to verify deployed agent is working correctly
 */

const { generateClient } = require('aws-amplify/api');
const { Amplify } = require('aws-amplify');
const amplifyConfig = require('./amplify_outputs.json');

// Configure Amplify
Amplify.configure(amplifyConfig);

async function testDeployedAgent() {
  console.log('🧪 Testing Deployed Agent...\n');

  try {
    const client = generateClient();
    
    console.log('1. Testing agent with well listing request...');
    
    // Create a simple GraphQL mutation to test the agent
    const mutation = `
      mutation InvokeLightweightAgent($message: String!, $foundationModelId: String!, $userId: String!) {
        invokeLightweightAgent(message: $message, foundationModelId: $foundationModelId, userId: $userId) {
          success
          message
          artifacts
        }
      }
    `;

    const variables = {
      message: "List all available wells",
      foundationModelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
      userId: "test-user-123"
    };

    console.log('Sending request to deployed agent...');
    const response = await client.graphql({
      query: mutation,
      variables: variables
    });

    console.log('Agent Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.invokeLightweightAgent.success) {
      console.log('✅ Agent successfully processed request');
      console.log('📝 Response message:', response.data.invokeLightweightAgent.message);
    } else {
      console.log('❌ Agent failed:', response.data.invokeLightweightAgent.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDeployedAgent();
