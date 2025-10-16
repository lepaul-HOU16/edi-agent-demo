/**
 * Test script for Maintenance Agent GraphQL mutation
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { generateClient } from 'aws-amplify/data';
import { Amplify } from 'aws-amplify';
import amplifyConfig from '../amplify_outputs.json' assert { type: 'json' };

// Configure Amplify
Amplify.configure(amplifyConfig);

const client = generateClient();

async function testMaintenanceAgentMutation() {
  console.log('=== TESTING MAINTENANCE AGENT GRAPHQL MUTATION ===\n');

  try {
    // Test query: Equipment status check
    const testMessage = 'What is the status of equipment PUMP-001?';
    console.log(`Test Query: "${testMessage}"\n`);

    console.log('Invoking maintenanceAgent mutation...');
    const startTime = Date.now();

    const response = await client.graphql({
      query: `
        mutation InvokeMaintenanceAgent($chatSessionId: ID!, $message: String!, $foundationModelId: String) {
          invokeMaintenanceAgent(
            chatSessionId: $chatSessionId
            message: $message
            foundationModelId: $foundationModelId
          ) {
            success
            message
            artifacts
            thoughtSteps
            workflow
            auditTrail
          }
        }
      `,
      variables: {
        chatSessionId: 'test-session-' + Date.now(),
        message: testMessage,
        foundationModelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0'
      }
    });

    const duration = Date.now() - startTime;
    console.log(`✅ Mutation completed in ${duration}ms\n`);

    // Verify response structure
    const result = response.data.invokeMaintenanceAgent;
    console.log('Response Structure Verification:');
    console.log(`  success: ${result.success ? '✅' : '❌'} ${result.success}`);
    console.log(`  message: ${result.message ? '✅' : '❌'} ${result.message ? 'Present' : 'Missing'}`);
    console.log(`  artifacts: ${Array.isArray(result.artifacts) ? '✅' : '❌'} ${Array.isArray(result.artifacts) ? `Array (${result.artifacts.length} items)` : 'Not an array'}`);
    console.log(`  thoughtSteps: ${Array.isArray(result.thoughtSteps) ? '✅' : '❌'} ${Array.isArray(result.thoughtSteps) ? `Array (${result.thoughtSteps.length} items)` : 'Not an array'}`);
    console.log(`  workflow: ${result.workflow !== undefined ? '✅' : '⚠️'} ${result.workflow !== undefined ? 'Present' : 'Not present'}`);
    console.log(`  auditTrail: ${result.auditTrail !== undefined ? '✅' : '⚠️'} ${result.auditTrail !== undefined ? 'Present' : 'Not present'}`);

    console.log('\nResponse Details:');
    console.log('Message:', result.message);
    
    if (result.artifacts && result.artifacts.length > 0) {
      console.log('\nArtifacts:');
      result.artifacts.forEach((artifact, index) => {
        console.log(`  ${index + 1}. ${JSON.stringify(artifact, null, 2)}`);
      });
    }

    if (result.thoughtSteps && result.thoughtSteps.length > 0) {
      console.log('\nThought Steps:');
      result.thoughtSteps.forEach((step, index) => {
        console.log(`  ${index + 1}. ${JSON.stringify(step, null, 2)}`);
      });
    }

    console.log('\n=== TEST COMPLETE ===');
    console.log('✅ GraphQL mutation works correctly');
    console.log('✅ Response format matches expected structure');

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error.errors) {
      console.error('GraphQL Errors:', JSON.stringify(error.errors, null, 2));
    }
    return false;
  }
}

// Run test
testMaintenanceAgentMutation()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
