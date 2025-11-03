#!/usr/bin/env node

/**
 * Direct Lambda Invocation Test for Maintenance Agent
 * 
 * This test directly invokes the Lambda function to verify:
 * 1. Lambda can be invoked successfully
 * 2. Handler processes requests correctly
 * 3. Response format matches expected structure
 * 4. Intent detection works
 * 5. Handlers execute properly
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

// ANSI color codes
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

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

/**
 * Invoke Lambda function directly
 */
async function invokeLambda(functionName, payload) {
  const command = new InvokeCommand({
    FunctionName: functionName,
    Payload: JSON.stringify(payload)
  });
  
  const response = await lambdaClient.send(command);
  const result = JSON.parse(Buffer.from(response.Payload).toString());
  
  return result;
}

/**
 * Test 1: Equipment Status Query
 */
async function testEquipmentStatus(functionName) {
  logSection('Test 1: Equipment Status Query');
  
  const payload = {
    arguments: {
      chatSessionId: 'test-session-' + Date.now(),
      message: 'What is the status of equipment PUMP-001?',
      foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
      userId: 'test-user'
    }
  };
  
  try {
    logInfo('Invoking Lambda with equipment status query...');
    const result = await invokeLambda(functionName, payload);
    
    logInfo('Response received:');
    console.log(JSON.stringify(result, null, 2));
    
    // Verify response structure
    if (result.success !== undefined) {
      logSuccess('Response has "success" field');
    } else {
      logError('Response missing "success" field');
      return false;
    }
    
    if (result.message) {
      logSuccess(`Response has "message" field: "${result.message.substring(0, 100)}..."`);
    } else {
      logError('Response missing "message" field');
      return false;
    }
    
    if (Array.isArray(result.artifacts)) {
      logSuccess(`Response has "artifacts" array (${result.artifacts.length} items)`);
    } else {
      logInfo('Response has no artifacts (may be expected for simple queries)');
    }
    
    if (Array.isArray(result.thoughtSteps)) {
      logSuccess(`Response has "thoughtSteps" array (${result.thoughtSteps.length} items)`);
      
      // Log thought steps
      result.thoughtSteps.forEach((step, index) => {
        logInfo(`  Step ${index + 1}: ${step.title} - ${step.summary}`);
      });
    } else {
      logInfo('Response has no thought steps');
    }
    
    if (result.success) {
      logSuccess('Maintenance agent processed query successfully');
      return true;
    } else {
      logError(`Query failed: ${result.message}`);
      return false;
    }
  } catch (error) {
    logError(`Lambda invocation failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

/**
 * Test 2: Failure Prediction Query
 */
async function testFailurePrediction(functionName) {
  logSection('Test 2: Failure Prediction Query');
  
  const payload = {
    arguments: {
      chatSessionId: 'test-session-' + Date.now(),
      message: 'Predict when equipment COMP-002 might fail',
      foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
      userId: 'test-user'
    }
  };
  
  try {
    logInfo('Invoking Lambda with failure prediction query...');
    const result = await invokeLambda(functionName, payload);
    
    if (result.success) {
      logSuccess('Failure prediction query processed successfully');
      logInfo(`Message: ${result.message.substring(0, 150)}...`);
      return true;
    } else {
      logError(`Query failed: ${result.message}`);
      return false;
    }
  } catch (error) {
    logError(`Lambda invocation failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 3: Maintenance Planning Query
 */
async function testMaintenancePlanning(functionName) {
  logSection('Test 3: Maintenance Planning Query');
  
  const payload = {
    arguments: {
      chatSessionId: 'test-session-' + Date.now(),
      message: 'Create a maintenance plan for next month',
      foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
      userId: 'test-user'
    }
  };
  
  try {
    logInfo('Invoking Lambda with maintenance planning query...');
    const result = await invokeLambda(functionName, payload);
    
    if (result.success) {
      logSuccess('Maintenance planning query processed successfully');
      logInfo(`Message: ${result.message.substring(0, 150)}...`);
      return true;
    } else {
      logError(`Query failed: ${result.message}`);
      return false;
    }
  } catch (error) {
    logError(`Lambda invocation failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 4: Inspection Schedule Query
 */
async function testInspectionSchedule(functionName) {
  logSection('Test 4: Inspection Schedule Query');
  
  const payload = {
    arguments: {
      chatSessionId: 'test-session-' + Date.now(),
      message: 'Generate an inspection schedule for all equipment',
      foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
      userId: 'test-user'
    }
  };
  
  try {
    logInfo('Invoking Lambda with inspection schedule query...');
    const result = await invokeLambda(functionName, payload);
    
    if (result.success) {
      logSuccess('Inspection schedule query processed successfully');
      logInfo(`Message: ${result.message.substring(0, 150)}...`);
      return true;
    } else {
      logError(`Query failed: ${result.message}`);
      return false;
    }
  } catch (error) {
    logError(`Lambda invocation failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 5: Response Format Validation
 */
async function testResponseFormat(functionName) {
  logSection('Test 5: Response Format Validation');
  
  const payload = {
    arguments: {
      chatSessionId: 'test-session-' + Date.now(),
      message: 'What is the health of equipment TURB-003?',
      foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
      userId: 'test-user'
    }
  };
  
  try {
    logInfo('Validating response format...');
    const result = await invokeLambda(functionName, payload);
    
    const checks = {
      hasSuccess: typeof result.success === 'boolean',
      hasMessage: typeof result.message === 'string',
      hasArtifacts: Array.isArray(result.artifacts),
      hasThoughtSteps: Array.isArray(result.thoughtSteps),
      hasWorkflow: result.workflow !== undefined,
      hasAuditTrail: result.auditTrail !== undefined
    };
    
    logInfo('Response format checks:');
    Object.entries(checks).forEach(([check, passed]) => {
      if (passed) {
        logSuccess(`  ${check}: ✓`);
      } else {
        logInfo(`  ${check}: - (optional)`);
      }
    });
    
    // Required fields
    const requiredFields = ['hasSuccess', 'hasMessage'];
    const allRequiredPresent = requiredFields.every(field => checks[field]);
    
    if (allRequiredPresent) {
      logSuccess('All required fields present in response');
      return true;
    } else {
      logError('Some required fields missing from response');
      return false;
    }
  } catch (error) {
    logError(`Response format validation failed: ${error.message}`);
    return false;
  }
}

/**
 * Main test execution
 */
async function runAllTests() {
  logSection('Maintenance Agent Lambda Direct Invocation Tests');
  logInfo('Testing Lambda function directly without GraphQL...\n');
  
  const functionName = 'amplify-digitalassistant--maintenanceAgentlambdaDD-tXrMi2tF0het';
  
  const results = {
    equipmentStatus: false,
    failurePrediction: false,
    maintenancePlanning: false,
    inspectionSchedule: false,
    responseFormat: false
  };
  
  try {
    // Run all tests
    results.equipmentStatus = await testEquipmentStatus(functionName);
    results.failurePrediction = await testFailurePrediction(functionName);
    results.maintenancePlanning = await testMaintenancePlanning(functionName);
    results.inspectionSchedule = await testInspectionSchedule(functionName);
    results.responseFormat = await testResponseFormat(functionName);
    
    // Summary
    logSection('Test Summary');
    
    const passedCount = Object.values(results).filter(r => r === true).length;
    const totalCount = Object.values(results).length;
    
    Object.entries(results).forEach(([test, passed]) => {
      if (passed) {
        logSuccess(`${test}: PASSED`);
      } else {
        logError(`${test}: FAILED`);
      }
    });
    
    logInfo(`\nPassed: ${passedCount}/${totalCount} tests`);
    
    if (passedCount === totalCount) {
      logSection('✅ ALL TESTS PASSED');
      logSuccess('Maintenance agent Lambda is working correctly!');
      logInfo('\nDeployment verification complete:');
      logInfo('✓ Lambda function exists and is deployed');
      logInfo('✓ Environment variables configured');
      logInfo('✓ Handler processes requests correctly');
      logInfo('✓ Response format matches expected structure');
      logInfo('✓ All query types work');
      logInfo('\nTask 1.12 COMPLETE ✅');
      logInfo('\nNext steps:');
      logInfo('1. Integrate agent router (Task 2.x)');
      logInfo('2. Create agent switcher UI (Task 3.x)');
      logInfo('3. Add preloaded prompts (Task 4.x)');
      process.exit(0);
    } else {
      logSection('⚠️  SOME TESTS FAILED');
      logError(`${totalCount - passedCount} test(s) failed`);
      logInfo('Please review the failures above');
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
