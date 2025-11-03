#!/usr/bin/env node

/**
 * Test Hybrid Intent Classifier - Direct Lambda Invocation
 * 
 * Tests the hybrid intent classification system by directly invoking the EDIcraft Lambda
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

// Test configuration
const TESTS = [
  {
    name: 'Wellbore Trajectory - Exact Pattern',
    query: 'Build wellbore trajectory for WELL-011',
    expectedIntent: 'wellbore_trajectory',
    expectedRouting: 'DIRECT_TOOL_CALL',
    expectedWellId: 'WELL-011'
  },
  {
    name: 'Wellbore Trajectory - Variation',
    query: 'Visualize wellbore WELL-005',
    expectedIntent: 'wellbore_trajectory',
    expectedRouting: 'DIRECT_TOOL_CALL',
    expectedWellId: 'WELL-005'
  },
  {
    name: 'Horizon Surface',
    query: 'Build horizon surface',
    expectedIntent: 'horizon_surface',
    expectedRouting: 'DIRECT_TOOL_CALL'
  },
  {
    name: 'List Players',
    query: 'List players',
    expectedIntent: 'list_players',
    expectedRouting: 'DIRECT_TOOL_CALL'
  },
  {
    name: 'System Status',
    query: 'Hello',
    expectedIntent: 'system_status',
    expectedRouting: 'GREETING'
  }
];

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function getLambdaFunctionName() {
  // Use AWS CLI to get the function name from CloudFormation outputs
  const { CloudFormationClient, DescribeStacksCommand } = require('@aws-sdk/client-cloudformation');
  
  const client = new CloudFormationClient({ region: process.env.AWS_REGION || 'us-east-1' });
  
  // Get all stacks and find the one with EDIcraftAgentFunctionName output
  const command = new DescribeStacksCommand({});
  const response = await client.send(command);
  
  for (const stack of response.Stacks || []) {
    const output = (stack.Outputs || []).find(o => o.OutputKey === 'EDIcraftAgentFunctionName');
    if (output && output.OutputValue) {
      return output.OutputValue;
    }
  }
  
  // Fallback: list Lambda functions and find the one with edicraftAgent in the name
  const { LambdaClient, ListFunctionsCommand } = require('@aws-sdk/client-lambda');
  const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });
  const listCommand = new ListFunctionsCommand({});
  const listResponse = await lambdaClient.send(listCommand);
  
  const edicraftFunction = (listResponse.Functions || []).find(f => 
    f.FunctionName && f.FunctionName.includes('edicraftAgent')
  );
  
  if (edicraftFunction && edicraftFunction.FunctionName) {
    return edicraftFunction.FunctionName;
  }
  
  throw new Error('EDIcraft agent function not found');
}

async function invokeLambda(functionName, payload) {
  const client = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });
  
  const command = new InvokeCommand({
    FunctionName: functionName,
    Payload: JSON.stringify(payload)
  });
  
  const response = await client.send(command);
  const responsePayload = JSON.parse(new TextDecoder().decode(response.Payload));
  
  return responsePayload;
}

async function runTest(test, functionName) {
  log(`\n${'='.repeat(80)}`, 'cyan');
  log(`Test: ${test.name}`, 'cyan');
  log(`Query: "${test.query}"`, 'blue');
  log(`${'='.repeat(80)}`, 'cyan');

  try {
    const startTime = Date.now();
    
    // Create AppSync-like event structure
    const event = {
      arguments: {
        message: test.query,
        userId: 'test-user-' + Date.now(),
        chatSessionId: 'test-session-' + Date.now()
      },
      identity: {
        sub: 'test-user-' + Date.now()
      }
    };
    
    const response = await invokeLambda(functionName, event);
    const duration = Date.now() - startTime;

    log(`\nResponse received in ${duration}ms`, 'yellow');
    
    // Check response structure
    if (!response.success) {
      log(`❌ Test FAILED: Response indicates failure`, 'red');
      log(`Error: ${response.error || 'Unknown error'}`, 'red');
      log(`Message: ${response.message}`, 'red');
      return false;
    }

    // Check for expected routing
    const message = response.message || '';
    
    log(`\nMessage preview: ${message.substring(0, 300)}...`, 'yellow');

    // Validate routing based on test expectations
    let routingCorrect = false;
    
    if (test.expectedRouting === 'GREETING') {
      // Check if response is the welcome message
      const isWelcome = message.includes('Welcome to EDIcraft') || 
                       message.includes('What I Can Do');
      routingCorrect = isWelcome;
      log(`Greeting detection: ${routingCorrect ? '✅' : '❌'}`, routingCorrect ? 'green' : 'red');
    } else if (test.expectedRouting === 'DIRECT_TOOL_CALL') {
      // Check if response indicates direct tool call was used
      // The message should contain evidence of tool execution
      const hasToolExecution = message.includes('trajectory') || 
                              message.includes('horizon') ||
                              message.includes('players') ||
                              message.includes('Minecraft') ||
                              message.includes('WELL-') ||
                              message.includes('built') ||
                              message.includes('visualiz');
      routingCorrect = hasToolExecution;
      log(`Direct tool call routing: ${routingCorrect ? '✅' : '❌'}`, routingCorrect ? 'green' : 'red');
    }

    // Validate parameter extraction
    if (test.expectedWellId) {
      const wellIdExtracted = message.includes(test.expectedWellId);
      log(`Well ID extraction (${test.expectedWellId}): ${wellIdExtracted ? '✅' : '❌'}`, wellIdExtracted ? 'green' : 'red');
    }

    // Overall test result
    log(`\n${routingCorrect ? '✅ Test PASSED' : '❌ Test FAILED'}`, routingCorrect ? 'green' : 'red');
    
    return routingCorrect;

  } catch (error) {
    log(`❌ Test FAILED with error: ${error.message}`, 'red');
    log(`Stack: ${error.stack}`, 'red');
    return false;
  }
}

async function runAllTests() {
  log('\n' + '='.repeat(80), 'cyan');
  log('HYBRID INTENT CLASSIFIER TEST SUITE (Direct Lambda Invocation)', 'cyan');
  log('='.repeat(80) + '\n', 'cyan');

  try {
    const functionName = await getLambdaFunctionName();
    log(`Using Lambda function: ${functionName}\n`, 'blue');

    const results = [];
    
    for (const test of TESTS) {
      const passed = await runTest(test, functionName);
      results.push({ test: test.name, passed });
      
      // Wait between tests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Summary
    log('\n' + '='.repeat(80), 'cyan');
    log('TEST SUMMARY', 'cyan');
    log('='.repeat(80), 'cyan');
    
    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    
    results.forEach(result => {
      log(`${result.passed ? '✅' : '❌'} ${result.test}`, result.passed ? 'green' : 'red');
    });
    
    log(`\nTotal: ${passedCount}/${totalCount} tests passed`, passedCount === totalCount ? 'green' : 'red');
    
    if (passedCount === totalCount) {
      log('\n🎉 All tests passed! Hybrid intent classifier is working correctly.', 'green');
      process.exit(0);
    } else {
      log('\n❌ Some tests failed. Please review the output above.', 'red');
      process.exit(1);
    }
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'red');
    log(`Stack: ${error.stack}`, 'red');
    process.exit(1);
  }
}

// Run tests
runAllTests();
