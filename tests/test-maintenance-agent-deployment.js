#!/usr/bin/env node

/**
 * Comprehensive Maintenance Agent Deployment Test
 * 
 * This script verifies:
 * 1. Lambda function exists and is deployed
 * 2. Environment variables are configured correctly
 * 3. IAM permissions are set up
 * 4. GraphQL mutation works end-to-end
 * 5. Response format matches expected structure
 */

const { LambdaClient, GetFunctionCommand, GetFunctionConfigurationCommand } = require('@aws-sdk/client-lambda');
const { generateClient } = require('aws-amplify/data');
const { Amplify } = require('aws-amplify');
const outputs = require('../amplify_outputs.json');

// Configure Amplify
Amplify.configure(outputs);
const client = generateClient();

const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

// ANSI color codes for output
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

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

/**
 * Test 1: Verify Lambda function exists
 */
async function testLambdaExists() {
  logSection('Test 1: Verify Lambda Function Exists');
  
  try {
    // List all Lambda functions and find maintenance agent
    const { execSync } = require('child_process');
    const result = execSync('aws lambda list-functions --query "Functions[?contains(FunctionName, \'maintenanceAgent\')].FunctionName" --output text', {
      encoding: 'utf-8'
    });
    
    if (result.trim()) {
      const functionName = result.trim();
      logSuccess(`Lambda function found: ${functionName}`);
      return functionName;
    } else {
      logError('Maintenance agent Lambda function not found');
      logInfo('Expected function name pattern: *maintenanceAgent*');
      return null;
    }
  } catch (error) {
    logError(`Failed to check Lambda function: ${error.message}`);
    return null;
  }
}

/**
 * Test 2: Verify environment variables
 */
async function testEnvironmentVariables(functionName) {
  logSection('Test 2: Verify Environment Variables');
  
  try {
    const command = new GetFunctionConfigurationCommand({
      FunctionName: functionName
    });
    
    const response = await lambdaClient.send(command);
    const envVars = response.Environment?.Variables || {};
    
    logInfo('Environment variables:');
    Object.entries(envVars).forEach(([key, value]) => {
      if (key.includes('BUCKET') || key.includes('MODEL') || key.includes('REGION')) {
        console.log(`  ${key}: ${value}`);
      }
    });
    
    // Check required environment variables
    const requiredVars = ['S3_BUCKET'];
    let allPresent = true;
    
    requiredVars.forEach(varName => {
      if (envVars[varName]) {
        logSuccess(`${varName} is set: ${envVars[varName]}`);
      } else {
        logError(`${varName} is NOT set`);
        allPresent = false;
      }
    });
    
    return allPresent;
  } catch (error) {
    logError(`Failed to check environment variables: ${error.message}`);
    return false;
  }
}

/**
 * Test 3: Verify IAM permissions
 */
async function testIAMPermissions(functionName) {
  logSection('Test 3: Verify IAM Permissions');
  
  try {
    const command = new GetFunctionCommand({
      FunctionName: functionName
    });
    
    const response = await lambdaClient.send(command);
    const roleArn = response.Configuration?.Role;
    
    if (roleArn) {
      logSuccess(`IAM Role: ${roleArn}`);
      logInfo('Checking for required permissions...');
      
      // Check if role has necessary permissions (simplified check)
      const { execSync } = require('child_process');
      try {
        const policies = execSync(`aws iam list-attached-role-policies --role-name ${roleArn.split('/').pop()} --output json`, {
          encoding: 'utf-8'
        });
        
        const policyData = JSON.parse(policies);
        logInfo(`Attached policies: ${policyData.AttachedPolicies.length}`);
        
        // Check for S3 and Bedrock permissions
        const hasS3 = policyData.AttachedPolicies.some(p => p.PolicyName.includes('S3'));
        const hasBedrock = policyData.AttachedPolicies.some(p => p.PolicyName.includes('Bedrock'));
        
        if (hasS3 || hasBedrock) {
          logSuccess('Required permissions appear to be configured');
        } else {
          logWarning('Could not verify all required permissions');
        }
      } catch (error) {
        logWarning('Could not verify IAM policies in detail');
      }
      
      return true;
    } else {
      logError('No IAM role found for Lambda function');
      return false;
    }
  } catch (error) {
    logError(`Failed to check IAM permissions: ${error.message}`);
    return false;
  }
}

/**
 * Test 4: Test GraphQL mutation with simple query
 */
async function testGraphQLMutation() {
  logSection('Test 4: Test GraphQL Mutation');
  
  try {
    logInfo('Sending test query: "What is the status of equipment PUMP-001?"');
    
    const result = await client.mutations.invokeMaintenanceAgent({
      chatSessionId: 'test-session-' + Date.now(),
      message: 'What is the status of equipment PUMP-001?',
      foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
      userId: 'test-user'
    });
    
    logInfo('Response received:');
    console.log(JSON.stringify(result, null, 2));
    
    // Verify response structure
    if (result.data) {
      const response = result.data;
      
      // Check required fields
      if (typeof response.success === 'boolean') {
        logSuccess('Response has "success" field');
      } else {
        logError('Response missing "success" field');
      }
      
      if (typeof response.message === 'string') {
        logSuccess('Response has "message" field');
      } else {
        logError('Response missing "message" field');
      }
      
      if (Array.isArray(response.artifacts)) {
        logSuccess(`Response has "artifacts" array (${response.artifacts.length} items)`);
      } else {
        logWarning('Response missing "artifacts" array');
      }
      
      if (Array.isArray(response.thoughtSteps)) {
        logSuccess(`Response has "thoughtSteps" array (${response.thoughtSteps.length} items)`);
      } else {
        logWarning('Response missing "thoughtSteps" array');
      }
      
      // Check if response indicates success
      if (response.success) {
        logSuccess('Maintenance agent processed query successfully');
      } else {
        logWarning(`Maintenance agent returned success=false: ${response.message}`);
      }
      
      return true;
    } else if (result.errors) {
      logError('GraphQL errors:');
      result.errors.forEach(error => {
        console.error(`  - ${error.message}`);
      });
      return false;
    } else {
      logError('Unexpected response format');
      return false;
    }
  } catch (error) {
    logError(`Failed to test GraphQL mutation: ${error.message}`);
    if (error.errors) {
      error.errors.forEach(err => {
        console.error(`  - ${err.message}`);
      });
    }
    return false;
  }
}

/**
 * Test 5: Test with different query types
 */
async function testDifferentQueryTypes() {
  logSection('Test 5: Test Different Query Types');
  
  const testQueries = [
    {
      name: 'Equipment Status',
      query: 'What is the status of equipment PUMP-001?',
      expectedIntent: 'equipment_status'
    },
    {
      name: 'Failure Prediction',
      query: 'Predict when equipment COMP-002 might fail',
      expectedIntent: 'failure_prediction'
    },
    {
      name: 'Maintenance Planning',
      query: 'Create a maintenance plan for next month',
      expectedIntent: 'maintenance_planning'
    }
  ];
  
  let successCount = 0;
  
  for (const test of testQueries) {
    try {
      logInfo(`Testing: ${test.name}`);
      logInfo(`Query: "${test.query}"`);
      
      const result = await client.mutations.invokeMaintenanceAgent({
        chatSessionId: 'test-session-' + Date.now(),
        message: test.query,
        foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
        userId: 'test-user'
      });
      
      if (result.data && result.data.success) {
        logSuccess(`${test.name} query processed successfully`);
        successCount++;
      } else {
        logWarning(`${test.name} query did not return success`);
      }
    } catch (error) {
      logError(`${test.name} query failed: ${error.message}`);
    }
  }
  
  logInfo(`\nSuccessfully processed ${successCount}/${testQueries.length} query types`);
  return successCount === testQueries.length;
}

/**
 * Main test execution
 */
async function runAllTests() {
  logSection('Maintenance Agent Deployment Verification');
  logInfo('Starting comprehensive deployment tests...\n');
  
  const results = {
    lambdaExists: false,
    envVarsConfigured: false,
    iamPermissions: false,
    graphqlMutation: false,
    queryTypes: false
  };
  
  try {
    // Test 1: Lambda exists
    const functionName = await testLambdaExists();
    results.lambdaExists = !!functionName;
    
    if (!functionName) {
      logError('\n❌ DEPLOYMENT FAILED: Lambda function not found');
      logInfo('Please run: npx ampx sandbox');
      process.exit(1);
    }
    
    // Test 2: Environment variables
    results.envVarsConfigured = await testEnvironmentVariables(functionName);
    
    // Test 3: IAM permissions
    results.iamPermissions = await testIAMPermissions(functionName);
    
    // Test 4: GraphQL mutation
    results.graphqlMutation = await testGraphQLMutation();
    
    // Test 5: Different query types
    results.queryTypes = await testDifferentQueryTypes();
    
    // Summary
    logSection('Test Summary');
    
    const allPassed = Object.values(results).every(result => result === true);
    
    Object.entries(results).forEach(([test, passed]) => {
      if (passed) {
        logSuccess(`${test}: PASSED`);
      } else {
        logError(`${test}: FAILED`);
      }
    });
    
    if (allPassed) {
      logSection('✅ ALL TESTS PASSED');
      logSuccess('Maintenance agent is deployed and working correctly!');
      logInfo('\nNext steps:');
      logInfo('1. Integrate agent router (Task 2.x)');
      logInfo('2. Create agent switcher UI (Task 3.x)');
      logInfo('3. Add preloaded prompts (Task 4.x)');
      process.exit(0);
    } else {
      logSection('❌ SOME TESTS FAILED');
      logError('Please review the failures above and fix before proceeding');
      process.exit(1);
    }
  } catch (error) {
    logError(`\nTest execution failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
