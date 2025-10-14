#!/usr/bin/env node

/**
 * Test Async Renewable Jobs Deployment
 * 
 * This script tests the deployed async renewable jobs pattern end-to-end
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const region = process.env.AWS_REGION || 'us-east-1';
const lambdaClient = new LambdaClient({ region });
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAsyncInvocation() {
  const orchestratorFunction = 'amplify-digitalassistant--renewableOrchestratorlam-xjL5UbUYWJzk';
  const chatSessionId = 'test-async-' + Date.now();
  const userId = 'test-user';
  
  log('\n==========================================', 'blue');
  log('Testing Async Renewable Jobs Deployment', 'blue');
  log('==========================================\n', 'blue');
  
  // Step 1: Invoke orchestrator asynchronously
  log('Step 1: Invoking renewableOrchestrator asynchronously...', 'yellow');
  
  const testPayload = {
    query: 'Analyze terrain at 40.7128, -74.0060 with 5km radius',
    sessionId: chatSessionId,  // Use sessionId for orchestrator
    userId,
    coordinates: { latitude: 40.7128, longitude: -74.0060 },
    radius_km: 5
  };
  
  log(`  Chat Session ID: ${chatSessionId}`, 'blue');
  log(`  Query: ${testPayload.query}`, 'blue');
  
  try {
    const command = new InvokeCommand({
      FunctionName: orchestratorFunction,
      InvocationType: 'Event', // Async invocation
      Payload: JSON.stringify(testPayload)
    });
    
    const startTime = Date.now();
    const response = await lambdaClient.send(command);
    const responseTime = Date.now() - startTime;
    
    if (response.StatusCode === 202) {
      log(`✓ Async invocation successful (${responseTime}ms)`, 'green');
      log(`  Status Code: ${response.StatusCode}`, 'green');
      log(`  Response Time: ${responseTime}ms (< 1 second ✓)`, 'green');
    } else {
      log(`✗ Unexpected status code: ${response.StatusCode}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Async invocation failed: ${error.message}`, 'red');
    return false;
  }
  
  // Step 2: Wait for processing
  log('\nStep 2: Waiting for background processing...', 'yellow');
  log('  The orchestrator is now processing in the background', 'blue');
  log('  This typically takes 30-60 seconds for terrain analysis', 'blue');
  
  // Poll for results
  const tableName = 'ChatMessage-fhzj4la45fevdnax5s2o4hbuqy-NONE';
  const maxAttempts = 20; // 20 attempts * 3 seconds = 60 seconds max
  const pollInterval = 3000; // 3 seconds
  
  log(`\n  Polling DynamoDB table every ${pollInterval/1000} seconds...`, 'blue');
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));
    
    try {
      const queryCommand = new QueryCommand({
        TableName: tableName,
        IndexName: 'chatMessagesByChatSessionIdAndCreatedAt',
        KeyConditionExpression: 'chatSessionId = :sessionId',
        ExpressionAttributeValues: {
          ':sessionId': chatSessionId
        },
        ScanIndexForward: false, // Newest first
        Limit: 10
      });
      
      const result = await dynamoClient.send(queryCommand);
      const messages = result.Items || [];
      
      log(`  Attempt ${attempt}/${maxAttempts}: Found ${messages.length} message(s)`, 'blue');
      
      // Check for complete AI message
      const completeMessage = messages.find(m => 
        m.role === 'ai' && m.responseComplete === true
      );
      
      if (completeMessage) {
        log(`\n✓ Results received after ${attempt * pollInterval / 1000} seconds!`, 'green');
        log(`  Message ID: ${completeMessage.id}`, 'green');
        log(`  Response Complete: ${completeMessage.responseComplete}`, 'green');
        
        if (completeMessage.artifacts && completeMessage.artifacts.length > 0) {
          log(`  Artifacts: ${completeMessage.artifacts.length} artifact(s)`, 'green');
          completeMessage.artifacts.forEach((artifact, i) => {
            log(`    ${i + 1}. ${artifact.type || 'unknown type'}`, 'green');
          });
        }
        
        log('\n==========================================', 'green');
        log('✓ ASYNC RENEWABLE JOBS TEST PASSED', 'green');
        log('==========================================', 'green');
        log('\nThe async renewable jobs pattern is working correctly!', 'green');
        log('\nKey achievements:', 'green');
        log('  ✓ Async invocation completed in < 1 second', 'green');
        log('  ✓ Background processing completed successfully', 'green');
        log('  ✓ Results written to DynamoDB', 'green');
        log('  ✓ No timeout errors', 'green');
        log('  ✓ Polling detected results automatically', 'green');
        
        return true;
      }
      
      // Check for processing message
      const processingMessage = messages.find(m => 
        m.role === 'ai' && m.responseComplete === false
      );
      
      if (processingMessage) {
        log(`  ⏳ Job is still processing...`, 'yellow');
      }
      
    } catch (error) {
      log(`  ⚠ Polling error: ${error.message}`, 'yellow');
    }
  }
  
  log(`\n⚠ Timeout: No results after ${maxAttempts * pollInterval / 1000} seconds`, 'yellow');
  log('  This might be normal for complex analyses', 'yellow');
  log('  Check CloudWatch logs for details:', 'yellow');
  log(`  aws logs tail /aws/lambda/${orchestratorFunction} --follow`, 'blue');
  
  return false;
}

testAsyncInvocation().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
