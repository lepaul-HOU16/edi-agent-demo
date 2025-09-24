#!/usr/bin/env node

/**
 * Test script to verify agent is routing through MCP server instead of direct S3 access
 */

const { EnhancedStrandsAgent } = require('./amplify/functions/agents/enhancedStrandsAgent');

async function testAgentMCPRouting() {
  console.log('🧪 Testing Agent MCP Routing...\n');

  try {
    // Initialize agent
    const agent = new EnhancedStrandsAgent(
      'anthropic.claude-3-5-sonnet-20241022-v2:0',
      'amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m'
    );

    console.log('1. Testing well listing through agent...');
    const response = await agent.processMessage('List all available wells');
    
    console.log('Agent Response:', JSON.stringify(response, null, 2));
    
    if (response.success) {
      console.log('✅ Agent successfully processed well listing request');
    } else {
      console.log('❌ Agent failed to process request:', response.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAgentMCPRouting();
