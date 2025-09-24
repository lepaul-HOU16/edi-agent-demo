#!/usr/bin/env node

/**
 * Test script to verify agent return value fix
 * Tests the comprehensive shale analysis workflow specifically
 */

const axios = require('axios');

async function testAgentReturnFix() {
  console.log('🧪 Testing Agent Return Value Fix');
  console.log('=====================================');

  try {
    const graphqlEndpoint = 'https://doqkjfftczdazcaeyrt6kdcrvu.appsync-api.us-east-1.amazonaws.com/graphql';
    
    // Test payload for comprehensive shale analysis
    const testQuery = {
      query: `
        mutation InvokeLightweightAgent($input: InvokeLightweightAgentInput!) {
          invokeLightweightAgent(input: $input) {
            success
            message
            artifacts
          }
        }
      `,
      variables: {
        input: {
          message: "Analyze the gamma ray logs from the wells and calculate shale volume using the Larionov method. Create interactive plots showing shale volume vs depth for the wells and identify the cleanest sand intervals. Focus on creating clear, engaging visualizations.",
          foundationModelId: "us.anthropic.claude-3-5-sonnet-20241022-v2:0"
        }
      }
    };

    console.log('📤 Invoking agent via GraphQL with shale analysis request...');
    console.log('Message:', testQuery.variables.input.message.substring(0, 100) + '...');
    
    const response = await axios.post(graphqlEndpoint, testQuery, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 1 minute timeout for complex analysis
    });

    console.log('📥 Raw GraphQL Response:');
    console.log('Status:', response.status);
    console.log('Data structure:', typeof response.data);
    
    if (response.data && response.data.data && response.data.data.invokeLightweightAgent) {
      const agentResponse = response.data.data.invokeLightweightAgent;
      
      console.log('\n📋 Agent Response Structure:');
      console.log('- success:', agentResponse.success);
      console.log('- message type:', typeof agentResponse.message);
      console.log('- message length:', agentResponse.message?.length || 0);
      console.log('- artifacts type:', typeof agentResponse.artifacts);
      console.log('- artifacts length:', Array.isArray(agentResponse.artifacts) ? agentResponse.artifacts.length : 'Not array');
      
      // Check for proper response structure
      if (agentResponse.success !== undefined && agentResponse.message && agentResponse.artifacts !== undefined) {
        console.log('\n✅ RESPONSE FORMAT VALIDATION PASSED');
        console.log('- success field present:', typeof agentResponse.success === 'boolean');
        console.log('- message field present:', typeof agentResponse.message === 'string');
        console.log('- artifacts field present:', Array.isArray(agentResponse.artifacts));
        
        // Preview message content
        if (agentResponse.message && agentResponse.message.length > 0) {
          console.log('\n📝 Message Preview:');
          console.log(agentResponse.message.substring(0, 200) + '...');
          
          // Check if message contains shale analysis results
          const hasShaleAnalysis = agentResponse.message.toLowerCase().includes('shale') || 
                                 agentResponse.message.toLowerCase().includes('gamma ray') ||
                                 agentResponse.message.toLowerCase().includes('larionov');
          console.log('Contains shale analysis content:', hasShaleAnalysis);
        }
        
        // Check artifacts
        if (agentResponse.artifacts && agentResponse.artifacts.length > 0) {
          console.log('\n🎯 Artifacts Found:');
          agentResponse.artifacts.forEach((artifact, index) => {
            console.log(`Artifact ${index + 1}:`, typeof artifact);
            if (typeof artifact === 'string') {
              try {
                const parsedArtifact = JSON.parse(artifact);
                if (parsedArtifact.messageContentType) {
                  console.log(`  - Content Type: ${parsedArtifact.messageContentType}`);
                }
                if (parsedArtifact.analysisType) {
                  console.log(`  - Analysis Type: ${parsedArtifact.analysisType}`);
                }
                if (parsedArtifact.executiveSummary) {
                  console.log(`  - Has Executive Summary: Yes`);
                }
              } catch (e) {
                console.log(`  - Raw artifact (not JSON): ${artifact.substring(0, 100)}...`);
              }
            } else if (artifact && typeof artifact === 'object') {
              if (artifact.messageContentType) {
                console.log(`  - Content Type: ${artifact.messageContentType}`);
              }
              if (artifact.analysisType) {
                console.log(`  - Analysis Type: ${artifact.analysisType}`);
              }
              if (artifact.executiveSummary) {
                console.log(`  - Has Executive Summary: Yes`);
              }
            }
          });
        }
        
      } else {
        console.log('\n❌ RESPONSE FORMAT VALIDATION FAILED');
        console.log('Missing required fields:');
        if (agentResponse.success === undefined) console.log('- success field missing');
        if (!agentResponse.message) console.log('- message field missing or empty');
        if (agentResponse.artifacts === undefined) console.log('- artifacts field missing');
      }
      
      // Check for error conditions
      if (agentResponse.success === false) {
        console.log('\n⚠️  Agent reported failure:', agentResponse.message);
      }
      
    } else {
      console.log('❌ No agent response data received');
      if (response.data.errors) {
        console.log('GraphQL Errors:', JSON.stringify(response.data.errors, null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the test
testAgentReturnFix()
  .then(() => {
    console.log('\n🏁 Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test failed with error:', error);
    process.exit(1);
  });
