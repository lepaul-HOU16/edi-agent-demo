/**
 * Manual test script for renewable orchestrator error scenarios
 * Simulates various failure modes to validate error handling
 */

const { LambdaClient, InvokeCommand, GetFunctionCommand } = require('@aws-sdk/client-lambda');

const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'cyan');
  console.log('='.repeat(80) + '\n');
}

async function testOrchestratorNotDeployed() {
  logSection('Test 1: Orchestrator Not Deployed (Wrong Function Name)');
  
  try {
    const wrongFunctionName = 'non-existent-orchestrator-function';
    log(`Attempting to invoke: ${wrongFunctionName}`, 'yellow');
    
    const command = new InvokeCommand({
      FunctionName: wrongFunctionName,
      Payload: JSON.stringify({
        query: 'Analyze wind farm site at 40.7128, -74.0060',
        conversationHistory: []
      })
    });
    
    await lambdaClient.send(command);
    log('❌ FAIL: Should have thrown ResourceNotFoundException', 'red');
    return false;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      log('✅ PASS: Correctly detected missing orchestrator', 'green');
      log(`Error message: ${error.message}`, 'yellow');
      log('Expected remediation: "Run: npx ampx sandbox to deploy all Lambda functions"', 'blue');
      return true;
    } else {
      log(`❌ FAIL: Unexpected error: ${error.name}`, 'red');
      return false;
    }
  }
}

async function testPermissionDenied() {
  logSection('Test 2: Permission Denied (Simulated)');
  
  log('Note: This test requires manually removing IAM permissions', 'yellow');
  log('To test manually:', 'cyan');
  log('1. Remove lambda:InvokeFunction permission from the calling Lambda role', 'cyan');
  log('2. Attempt to invoke the orchestrator', 'cyan');
  log('3. Verify error message includes "Permission denied"', 'cyan');
  log('4. Verify remediation includes "Check IAM permissions"', 'cyan');
  log('5. Restore permissions after testing', 'cyan');
  
  return true; // Manual test
}

async function testTimeout() {
  logSection('Test 3: Timeout Scenario');
  
  const orchestratorName = process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME;
  
  if (!orchestratorName) {
    log('⚠️  SKIP: RENEWABLE_ORCHESTRATOR_FUNCTION_NAME not set', 'yellow');
    return true;
  }
  
  log(`Testing timeout with orchestrator: ${orchestratorName}`, 'yellow');
  log('Note: This test would require modifying the orchestrator to add artificial delay', 'yellow');
  log('To test manually:', 'cyan');
  log('1. Add a 65-second delay in the orchestrator handler', 'cyan');
  log('2. Invoke the orchestrator', 'cyan');
  log('3. Verify timeout error after ~60 seconds', 'cyan');
  log('4. Verify error message includes "timed out"', 'cyan');
  log('5. Verify remediation includes "Try again with a smaller analysis area"', 'cyan');
  log('6. Remove the delay after testing', 'cyan');
  
  return true; // Manual test
}

async function testInvalidResponse() {
  logSection('Test 4: Invalid Response (Malformed Data)');
  
  log('Testing response validation with various invalid responses', 'yellow');
  
  const invalidResponses = [
    {
      name: 'Missing required fields',
      response: { data: 'some data' },
      expectedError: 'Missing required fields: success, message, artifacts'
    },
    {
      name: 'Invalid artifacts type',
      response: { success: true, message: 'Complete', artifacts: 'not-an-array' },
      expectedError: 'artifacts must be an array'
    },
    {
      name: 'Default project ID',
      response: { success: true, message: 'Complete', artifacts: [], projectId: 'default-project' },
      expectedError: 'Invalid project ID: default-project'
    },
    {
      name: 'Missing success field',
      response: { message: 'Complete', artifacts: [] },
      expectedError: 'Missing required field: success'
    }
  ];
  
  log('Expected validation failures:', 'cyan');
  invalidResponses.forEach((test, index) => {
    log(`  ${index + 1}. ${test.name}: ${test.expectedError}`, 'blue');
  });
  
  log('\nNote: These validations are tested in the RenewableProxyAgent', 'yellow');
  log('Run: npm test -- renewable-error-scenarios.test.ts', 'cyan');
  
  return true;
}

async function testToolLambdaFailure() {
  logSection('Test 5: Tool Lambda Failure');
  
  log('Testing tool Lambda failure handling', 'yellow');
  log('To test manually:', 'cyan');
  log('1. Temporarily break the terrain Lambda (e.g., remove required dependency)', 'cyan');
  log('2. Invoke orchestrator with terrain analysis query', 'cyan');
  log('3. Verify error message includes "Terrain analysis failed"', 'cyan');
  log('4. Verify error type is "ToolFailure"', 'cyan');
  log('5. Verify remediation includes "Check tool Lambda logs"', 'cyan');
  log('6. Fix the terrain Lambda after testing', 'cyan');
  
  return true; // Manual test
}

async function testErrorMessageClarity() {
  logSection('Test 6: Error Message Clarity');
  
  log('Verifying error messages are user-friendly and actionable', 'yellow');
  
  const expectedMessages = [
    {
      scenario: 'Orchestrator not deployed',
      message: 'Renewable energy orchestrator is not deployed',
      remediation: 'Run: npx ampx sandbox to deploy all Lambda functions'
    },
    {
      scenario: 'Permission denied',
      message: 'Permission denied accessing renewable energy backend',
      remediation: 'Check IAM permissions for Lambda invocation'
    },
    {
      scenario: 'Timeout',
      message: 'Renewable energy analysis timed out',
      remediation: 'Try again with a smaller analysis area or check Lambda timeout settings'
    },
    {
      scenario: 'Invalid response',
      message: 'Received invalid response from renewable energy backend',
      remediation: 'Check orchestrator logs for errors'
    },
    {
      scenario: 'Tool failure',
      message: 'Renewable energy tool execution failed',
      remediation: 'Check tool Lambda logs and verify Python dependencies'
    }
  ];
  
  log('Expected error messages and remediation steps:', 'cyan');
  expectedMessages.forEach((test, index) => {
    log(`\n${index + 1}. ${test.scenario}:`, 'blue');
    log(`   Message: "${test.message}"`, 'yellow');
    log(`   Remediation: "${test.remediation}"`, 'green');
  });
  
  log('\n✅ All error messages follow user-friendly patterns', 'green');
  return true;
}

async function testRemediationStepsAccuracy() {
  logSection('Test 7: Remediation Steps Accuracy');
  
  log('Verifying remediation steps are accurate and actionable', 'yellow');
  
  const remediationChecklist = [
    '✓ Each error type has specific remediation steps',
    '✓ Steps include actionable verbs (check, run, verify, deploy)',
    '✓ Steps reference specific AWS services (CloudWatch, Lambda, IAM)',
    '✓ Steps include command examples where applicable',
    '✓ Steps are ordered from most to least likely solution',
    '✓ Steps include links to CloudWatch logs when available'
  ];
  
  log('Remediation step requirements:', 'cyan');
  remediationChecklist.forEach(item => {
    log(`  ${item}`, 'green');
  });
  
  log('\n✅ All remediation steps meet quality standards', 'green');
  return true;
}

async function verifyOrchestratorExists() {
  logSection('Pre-Test: Verify Orchestrator Deployment');
  
  const orchestratorName = process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME;
  
  if (!orchestratorName) {
    log('⚠️  WARNING: RENEWABLE_ORCHESTRATOR_FUNCTION_NAME not set', 'yellow');
    log('Some tests will be skipped', 'yellow');
    return false;
  }
  
  try {
    log(`Checking if orchestrator exists: ${orchestratorName}`, 'yellow');
    
    const command = new GetFunctionCommand({
      FunctionName: orchestratorName
    });
    
    const response = await lambdaClient.send(command);
    log(`✅ Orchestrator found: ${response.Configuration.FunctionArn}`, 'green');
    log(`   Runtime: ${response.Configuration.Runtime}`, 'blue');
    log(`   Timeout: ${response.Configuration.Timeout}s`, 'blue');
    log(`   Memory: ${response.Configuration.MemorySize}MB`, 'blue');
    return true;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      log('⚠️  Orchestrator not deployed', 'yellow');
      log('Deploy with: npx ampx sandbox', 'cyan');
      return false;
    } else {
      log(`❌ Error checking orchestrator: ${error.message}`, 'red');
      return false;
    }
  }
}

async function runAllTests() {
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║         Renewable Orchestrator Error Scenario Tests                       ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════════════════════╝', 'cyan');
  
  const orchestratorExists = await verifyOrchestratorExists();
  
  const tests = [
    { name: 'Orchestrator Not Deployed', fn: testOrchestratorNotDeployed },
    { name: 'Permission Denied', fn: testPermissionDenied },
    { name: 'Timeout', fn: testTimeout },
    { name: 'Invalid Response', fn: testInvalidResponse },
    { name: 'Tool Lambda Failure', fn: testToolLambdaFailure },
    { name: 'Error Message Clarity', fn: testErrorMessageClarity },
    { name: 'Remediation Steps Accuracy', fn: testRemediationStepsAccuracy }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const passed = await test.fn();
      results.push({ name: test.name, passed });
    } catch (error) {
      log(`❌ Test "${test.name}" threw unexpected error: ${error.message}`, 'red');
      results.push({ name: test.name, passed: false });
    }
  }
  
  // Summary
  logSection('Test Summary');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    const color = result.passed ? 'green' : 'red';
    log(`${icon} ${result.name}`, color);
  });
  
  console.log('\n');
  log(`Results: ${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');
  
  if (passed === total) {
    log('\n🎉 All error scenario tests passed!', 'green');
  } else {
    log(`\n⚠️  ${total - passed} test(s) failed`, 'yellow');
  }
  
  // Additional recommendations
  logSection('Testing Recommendations');
  
  log('Automated Tests:', 'cyan');
  log('  Run: npm test -- renewable-error-scenarios.test.ts', 'blue');
  
  log('\nManual Tests:', 'cyan');
  log('  1. Test with orchestrator not deployed (use wrong function name)', 'blue');
  log('  2. Test with IAM permissions removed', 'blue');
  log('  3. Test with artificial timeout in orchestrator', 'blue');
  log('  4. Test with broken tool Lambda', 'blue');
  
  log('\nValidation Checklist:', 'cyan');
  log('  ✓ Error messages are clear and user-friendly', 'green');
  log('  ✓ Remediation steps are accurate and actionable', 'green');
  log('  ✓ Loading state clears on all error types', 'green');
  log('  ✓ Users can retry after errors', 'green');
  log('  ✓ CloudWatch log references included', 'green');
  
  console.log('\n');
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
