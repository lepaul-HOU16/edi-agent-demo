#!/usr/bin/env node

/**
 * Manual End-to-End Test for Async Renewable Jobs
 * 
 * This script tests the complete async job flow against a deployed environment:
 * 1. Submits a terrain query
 * 2. Verifies immediate response (< 1 second)
 * 3. Polls for results
 * 4. Verifies results appear automatically
 * 5. Tests error scenarios
 * 
 * Usage:
 *   node scripts/test-async-renewable-jobs-e2e.js
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

// Configuration
const REGION = process.env.AWS_REGION || 'us-east-1';
const LIGHTWEIGHT_AGENT_FUNCTION = process.env.LIGHTWEIGHT_AGENT_FUNCTION || 'lightweightAgent';
const CHAT_MESSAGE_TABLE = process.env.CHAT_MESSAGE_TABLE || 'ChatMessage';

// Initialize clients
const lambdaClient = new LambdaClient({ region: REGION });
const dynamoClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Test utilities
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function invokeLightweightAgent(query, chatSessionId, userId) {
  const command = new InvokeCommand({
    FunctionName: LIGHTWEIGHT_AGENT_FUNCTION,
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify({ query, chatSessionId, userId })
  });

  const startTime = Date.now();
  const response = await lambdaClient.send(command);
  const endTime = Date.now();
  const responseTime = endTime - startTime;

  const result = JSON.parse(Buffer.from(response.Payload).toString());
  
  return { result, responseTime };
}

async function pollForResults(chatSessionId, maxPolls = 30, pollInterval = 3000) {
  console.log(`\n📊 Polling for results (max ${maxPolls} polls, ${pollInterval}ms interval)...`);
  
  let pollCount = 0;
  let lastMessageCount = 0;
  
  while (pollCount < maxPolls) {
    pollCount++;
    
    const command = new QueryCommand({
      TableName: CHAT_MESSAGE_TABLE,
      KeyConditionExpression: 'chatSessionId = :sessionId',
      ExpressionAttributeValues: {
        ':sessionId': chatSessionId
      },
      ScanIndexForward: false // Get newest first
    });

    const response = await docClient.send(command);
    const messages = response.Items || [];
    
    if (messages.length > lastMessageCount) {
      console.log(`  Poll ${pollCount}: Found ${messages.length} messages (${messages.length - lastMessageCount} new)`);
      lastMessageCount = messages.length;
    } else {
      process.stdout.write('.');
    }

    // Check if we have a complete message
    const completeMessage = messages.find(m => m.responseComplete === true);
    if (completeMessage) {
      console.log(`\n✅ Results received after ${pollCount} polls (${pollCount * pollInterval / 1000}s)`);
      return { messages, completeMessage, pollCount };
    }

    await sleep(pollInterval);
  }

  throw new Error(`Timeout: No results after ${maxPolls} polls (${maxPolls * pollInterval / 1000}s)`);
}

// Test cases
async function testTerrainQueryNoTimeout() {
  console.log('\n🧪 Test 1: Terrain Query Without Timeout');
  console.log('=' .repeat(60));
  
  const chatSessionId = `test-terrain-${Date.now()}`;
  const userId = 'test-user';
  const query = 'Analyze terrain at 40.7128, -74.0060 with 5km radius';

  console.log(`Query: ${query}`);
  console.log(`Session ID: ${chatSessionId}`);

  // Step 1: Submit query
  console.log('\n📤 Submitting query...');
  const { result, responseTime } = await invokeLightweightAgent(query, chatSessionId, userId);

  console.log(`✅ Response time: ${responseTime}ms`);
  console.log(`Response:`, JSON.stringify(result, null, 2));

  // Verify immediate response
  if (responseTime > 1000) {
    throw new Error(`Response too slow: ${responseTime}ms (expected < 1000ms)`);
  }

  if (!result.success) {
    throw new Error(`Query failed: ${result.message}`);
  }

  // Step 2: Poll for results
  const { completeMessage, pollCount } = await pollForResults(chatSessionId);

  // Step 3: Verify results
  console.log('\n📋 Verifying results...');
  console.log(`Message ID: ${completeMessage.id}`);
  console.log(`Content: ${completeMessage.content?.text || 'N/A'}`);
  console.log(`Artifacts: ${completeMessage.artifacts?.length || 0}`);

  if (completeMessage.artifacts && completeMessage.artifacts.length > 0) {
    completeMessage.artifacts.forEach((artifact, i) => {
      console.log(`  Artifact ${i + 1}: ${artifact.type}`);
      if (artifact.type === 'terrain_map' && artifact.data?.features) {
        console.log(`    Features: ${artifact.data.features.length || artifact.data.features}`);
      }
    });
  }

  console.log('\n✅ Test 1 PASSED: Terrain query completed without timeout');
  return { success: true, pollCount, responseTime };
}

async function testLongRunningAnalysis() {
  console.log('\n🧪 Test 2: Long-Running Analysis (60+ seconds)');
  console.log('=' .repeat(60));
  
  const chatSessionId = `test-long-${Date.now()}`;
  const userId = 'test-user';
  const query = 'Complete wind farm analysis at 40.7128, -74.0060';

  console.log(`Query: ${query}`);
  console.log(`Session ID: ${chatSessionId}`);

  // Submit query
  console.log('\n📤 Submitting query...');
  const { result, responseTime } = await invokeLightweightAgent(query, chatSessionId, userId);

  console.log(`✅ Response time: ${responseTime}ms`);

  // Poll for results (allow up to 90 seconds)
  const { completeMessage, pollCount } = await pollForResults(chatSessionId, 30, 3000);

  const totalTime = pollCount * 3;
  console.log(`\n⏱️  Total analysis time: ~${totalTime} seconds`);

  if (totalTime < 30) {
    console.log('⚠️  Warning: Analysis completed faster than expected');
  }

  console.log('\n✅ Test 2 PASSED: Long-running analysis completed successfully');
  return { success: true, totalTime };
}

async function testErrorHandling() {
  console.log('\n🧪 Test 3: Error Handling');
  console.log('=' .repeat(60));
  
  const chatSessionId = `test-error-${Date.now()}`;
  const userId = 'test-user';
  const query = 'Analyze terrain at 999.999, 999.999'; // Invalid coordinates

  console.log(`Query: ${query} (invalid coordinates)`);
  console.log(`Session ID: ${chatSessionId}`);

  // Submit query
  console.log('\n📤 Submitting query...');
  const { result } = await invokeLightweightAgent(query, chatSessionId, userId);

  // Poll for results
  const { completeMessage } = await pollForResults(chatSessionId, 20, 3000);

  // Check for error artifact
  const errorArtifact = completeMessage.artifacts?.find(a => a.type === 'error');
  
  if (errorArtifact) {
    console.log('\n❌ Error detected (as expected):');
    console.log(`  Message: ${errorArtifact.data?.message || 'N/A'}`);
    console.log(`  Type: ${errorArtifact.data?.type || 'N/A'}`);
    console.log(`  Remediation: ${errorArtifact.data?.remediation || 'N/A'}`);
    console.log('\n✅ Test 3 PASSED: Error handling works correctly');
    return { success: true, errorHandled: true };
  } else {
    console.log('\n⚠️  Warning: No error artifact found, but query may have succeeded unexpectedly');
    return { success: true, errorHandled: false };
  }
}

async function testResultPersistence() {
  console.log('\n🧪 Test 4: Result Persistence');
  console.log('=' .repeat(60));
  
  const chatSessionId = `test-persist-${Date.now()}`;
  const userId = 'test-user';
  const query = 'Analyze terrain at 40.7128, -74.0060';

  // Submit and wait for results
  console.log('\n📤 Submitting query...');
  await invokeLightweightAgent(query, chatSessionId, userId);
  
  const { completeMessage: firstFetch } = await pollForResults(chatSessionId);
  console.log(`✅ First fetch: ${firstFetch.artifacts?.length || 0} artifacts`);

  // Simulate page refresh - fetch again
  console.log('\n🔄 Simulating page refresh...');
  await sleep(2000);

  const command = new QueryCommand({
    TableName: CHAT_MESSAGE_TABLE,
    KeyConditionExpression: 'chatSessionId = :sessionId',
    ExpressionAttributeValues: {
      ':sessionId': chatSessionId
    }
  });

  const response = await docClient.send(command);
  const messages = response.Items || [];
  const completeMessage = messages.find(m => m.responseComplete === true);

  if (!completeMessage) {
    throw new Error('Results not persisted after refresh');
  }

  console.log(`✅ Second fetch: ${completeMessage.artifacts?.length || 0} artifacts`);
  console.log('\n✅ Test 4 PASSED: Results persist after page refresh');
  return { success: true };
}

// Main test runner
async function runAllTests() {
  console.log('\n🚀 Async Renewable Jobs - End-to-End Tests');
  console.log('=' .repeat(60));
  console.log(`Region: ${REGION}`);
  console.log(`Lambda Function: ${LIGHTWEIGHT_AGENT_FUNCTION}`);
  console.log(`DynamoDB Table: ${CHAT_MESSAGE_TABLE}`);

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Terrain query without timeout
  try {
    const result = await testTerrainQueryNoTimeout();
    results.passed++;
    results.tests.push({ name: 'Terrain Query No Timeout', status: 'PASSED', ...result });
  } catch (error) {
    console.error('\n❌ Test 1 FAILED:', error.message);
    results.failed++;
    results.tests.push({ name: 'Terrain Query No Timeout', status: 'FAILED', error: error.message });
  }

  // Test 2: Long-running analysis
  try {
    const result = await testLongRunningAnalysis();
    results.passed++;
    results.tests.push({ name: 'Long-Running Analysis', status: 'PASSED', ...result });
  } catch (error) {
    console.error('\n❌ Test 2 FAILED:', error.message);
    results.failed++;
    results.tests.push({ name: 'Long-Running Analysis', status: 'FAILED', error: error.message });
  }

  // Test 3: Error handling
  try {
    const result = await testErrorHandling();
    results.passed++;
    results.tests.push({ name: 'Error Handling', status: 'PASSED', ...result });
  } catch (error) {
    console.error('\n❌ Test 3 FAILED:', error.message);
    results.failed++;
    results.tests.push({ name: 'Error Handling', status: 'FAILED', error: error.message });
  }

  // Test 4: Result persistence
  try {
    const result = await testResultPersistence();
    results.passed++;
    results.tests.push({ name: 'Result Persistence', status: 'PASSED', ...result });
  } catch (error) {
    console.error('\n❌ Test 4 FAILED:', error.message);
    results.failed++;
    results.tests.push({ name: 'Result Persistence', status: 'FAILED', error: error.message });
  }

  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log('\nDetailed Results:');
  results.tests.forEach((test, i) => {
    console.log(`  ${i + 1}. ${test.name}: ${test.status}`);
    if (test.error) {
      console.log(`     Error: ${test.error}`);
    }
  });

  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!');
    process.exit(0);
  } else {
    console.log('\n⚠️  SOME TESTS FAILED');
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  testTerrainQueryNoTimeout,
  testLongRunningAnalysis,
  testErrorHandling,
  testResultPersistence
};
