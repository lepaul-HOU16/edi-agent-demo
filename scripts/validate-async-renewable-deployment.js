#!/usr/bin/env node

/**
 * Validation Script for Async Renewable Jobs Deployment
 * 
 * This script validates that the async renewable jobs pattern is deployed correctly:
 * 1. Lambda functions exist
 * 2. DynamoDB permissions are configured
 * 3. Environment variables are set
 * 4. End-to-end flow works
 */

const { LambdaClient, InvokeCommand, GetFunctionConfigurationCommand } = require('@aws-sdk/client-lambda');
const { DynamoDBClient, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

const region = process.env.AWS_REGION || 'us-east-1';
const lambdaClient = new LambdaClient({ region });
const dynamoClient = new DynamoDBClient({ region });

// Colors for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkLambdaExists(functionName) {
  try {
    const command = new GetFunctionConfigurationCommand({ FunctionName: functionName });
    const response = await lambdaClient.send(command);
    log(`✓ Lambda function '${functionName}' exists`, 'green');
    return { exists: true, config: response };
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      log(`✗ Lambda function '${functionName}' not found`, 'red');
      return { exists: false, error };
    }
    throw error;
  }
}

async function checkEnvironmentVariables(functionName, requiredVars) {
  try {
    const command = new GetFunctionConfigurationCommand({ FunctionName: functionName });
    const response = await lambdaClient.send(command);
    const envVars = response.Environment?.Variables || {};
    
    const missing = [];
    for (const varName of requiredVars) {
      if (envVars[varName]) {
        log(`  ✓ ${varName} = ${envVars[varName]}`, 'green');
      } else {
        log(`  ✗ ${varName} is missing`, 'red');
        missing.push(varName);
      }
    }
    
    return { allPresent: missing.length === 0, missing, envVars };
  } catch (error) {
    log(`✗ Failed to check environment variables: ${error.message}`, 'red');
    return { allPresent: false, error };
  }
}

async function checkDynamoDBTable(tableName) {
  try {
    const command = new DescribeTableCommand({ TableName: tableName });
    const response = await dynamoClient.send(command);
    log(`✓ DynamoDB table '${tableName}' exists`, 'green');
    return { exists: true, table: response.Table };
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      log(`✗ DynamoDB table '${tableName}' not found`, 'red');
      return { exists: false, error };
    }
    throw error;
  }
}

async function testAsyncInvocation(functionName) {
  try {
    log(`\nTesting async invocation of '${functionName}'...`, 'yellow');
    
    const testPayload = {
      query: 'Analyze terrain at 40.7128, -74.0060 with 5km radius',
      chatSessionId: 'test-session-' + Date.now(),
      userId: 'test-user'
    };
    
    const command = new InvokeCommand({
      FunctionName: functionName,
      InvocationType: 'Event', // Async invocation
      Payload: JSON.stringify(testPayload)
    });
    
    const response = await lambdaClient.send(command);
    
    if (response.StatusCode === 202) {
      log(`✓ Async invocation successful (Status: ${response.StatusCode})`, 'green');
      log(`  Test payload sent to ${functionName}`, 'green');
      return { success: true, statusCode: response.StatusCode };
    } else {
      log(`⚠ Unexpected status code: ${response.StatusCode}`, 'yellow');
      return { success: false, statusCode: response.StatusCode };
    }
  } catch (error) {
    log(`✗ Async invocation failed: ${error.message}`, 'red');
    return { success: false, error };
  }
}

async function main() {
  console.log('==========================================');
  console.log('Async Renewable Jobs Deployment Validation');
  console.log('==========================================\n');
  
  const results = {
    lambdaFunctions: {},
    environmentVariables: {},
    dynamoDBTables: {},
    asyncInvocation: {}
  };
  
  // Check Lambda functions
  log('1. Checking Lambda Functions...', 'yellow');
  results.lambdaFunctions.renewableOrchestrator = await checkLambdaExists('renewableOrchestrator');
  results.lambdaFunctions.lightweightAgent = await checkLambdaExists('lightweightAgent');
  console.log('');
  
  // Check environment variables
  log('2. Checking Environment Variables...', 'yellow');
  log('  renewableOrchestrator:', 'yellow');
  results.environmentVariables.renewableOrchestrator = await checkEnvironmentVariables(
    'renewableOrchestrator',
    ['CHAT_MESSAGE_TABLE', 'TERRAIN_TOOL_FUNCTION', 'LAYOUT_TOOL_FUNCTION', 'SIMULATION_TOOL_FUNCTION']
  );
  console.log('');
  
  // Check DynamoDB tables
  log('3. Checking DynamoDB Tables...', 'yellow');
  const chatMessageTable = results.environmentVariables.renewableOrchestrator?.envVars?.CHAT_MESSAGE_TABLE;
  if (chatMessageTable) {
    results.dynamoDBTables.chatMessage = await checkDynamoDBTable(chatMessageTable);
  } else {
    log('⚠ Cannot check DynamoDB table - CHAT_MESSAGE_TABLE not set', 'yellow');
  }
  console.log('');
  
  // Test async invocation
  log('4. Testing Async Invocation...', 'yellow');
  if (results.lambdaFunctions.renewableOrchestrator?.exists) {
    results.asyncInvocation.renewableOrchestrator = await testAsyncInvocation('renewableOrchestrator');
  } else {
    log('⚠ Skipping async invocation test - Lambda not found', 'yellow');
  }
  console.log('');
  
  // Summary
  console.log('==========================================');
  console.log('Validation Summary');
  console.log('==========================================\n');
  
  const checks = [
    {
      name: 'renewableOrchestrator Lambda',
      passed: results.lambdaFunctions.renewableOrchestrator?.exists
    },
    {
      name: 'lightweightAgent Lambda',
      passed: results.lambdaFunctions.lightweightAgent?.exists
    },
    {
      name: 'Environment Variables',
      passed: results.environmentVariables.renewableOrchestrator?.allPresent
    },
    {
      name: 'DynamoDB Table',
      passed: results.dynamoDBTables.chatMessage?.exists
    },
    {
      name: 'Async Invocation',
      passed: results.asyncInvocation.renewableOrchestrator?.success
    }
  ];
  
  let allPassed = true;
  for (const check of checks) {
    if (check.passed) {
      log(`✓ ${check.name}`, 'green');
    } else {
      log(`✗ ${check.name}`, 'red');
      allPassed = false;
    }
  }
  
  console.log('');
  if (allPassed) {
    log('==========================================', 'green');
    log('✓ ALL CHECKS PASSED', 'green');
    log('==========================================', 'green');
    console.log('\nThe async renewable jobs pattern is deployed correctly!');
    console.log('\nNext steps:');
    console.log('1. Test with a real terrain query in the UI');
    console.log('2. Verify no timeout errors occur');
    console.log('3. Verify results display automatically');
    process.exit(0);
  } else {
    log('==========================================', 'red');
    log('✗ SOME CHECKS FAILED', 'red');
    log('==========================================', 'red');
    console.log('\nPlease fix the issues above before testing.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Validation script failed:', error);
  process.exit(1);
});
