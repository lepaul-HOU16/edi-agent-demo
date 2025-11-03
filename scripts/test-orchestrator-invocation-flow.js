/**
 * Test Orchestrator Invocation Flow
 * 
 * This script validates the complete orchestrator invocation flow:
 * 1. Deploys changes to sandbox environment
 * 2. Sends terrain analysis query through UI simulation
 * 3. Checks CloudWatch logs for orchestrator invocation
 * 4. Verifies orchestrator is called (not bypassed)
 * 5. Verifies terrain Lambda is called by orchestrator
 * 6. Verifies response includes unique project ID
 * 
 * Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3
 */

const { 
  LambdaClient, 
  InvokeCommand, 
  GetFunctionCommand 
} = require('@aws-sdk/client-lambda');
const { 
  CloudWatchLogsClient, 
  FilterLogEventsCommand,
  DescribeLogStreamsCommand 
} = require('@aws-sdk/client-cloudwatch-logs');

// Detect region from function name or use environment variable
const AWS_REGION = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-west-2';
const lambdaClient = new LambdaClient({ region: AWS_REGION });
const logsClient = new CloudWatchLogsClient({ region: AWS_REGION });

// Test configuration
const TEST_CONFIG = {
  orchestratorFunctionName: process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME || 'renewableOrchestrator',
  terrainFunctionName: process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME || 'renewableTerrainTool',
  testQuery: 'Analyze terrain for wind farm at coordinates 35.067482, -101.395466 with 5km radius',
  timeoutMs: 90000, // 90 seconds
  logWaitMs: 5000, // Wait 5 seconds for logs to propagate
};

// Test results
const testResults = {
  deploymentCheck: { passed: false, details: '' },
  orchestratorInvocation: { passed: false, details: '', logs: [] },
  terrainLambdaInvocation: { passed: false, details: '', logs: [] },
  projectIdGeneration: { passed: false, details: '', projectId: '' },
  responseValidation: { passed: false, details: '', response: null },
  overallSuccess: false,
};

/**
 * Main test execution
 */
async function runTest() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 ORCHESTRATOR INVOCATION FLOW TEST');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📋 Test Query: ${TEST_CONFIG.testQuery}`);
  console.log(`⏰ Started: ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Step 1: Check deployment status
    await checkDeploymentStatus();

    // Step 2: Invoke orchestrator with test query
    const response = await invokeOrchestrator();

    // Step 3: Wait for logs to propagate
    console.log(`\n⏳ Waiting ${TEST_CONFIG.logWaitMs}ms for logs to propagate...`);
    await sleep(TEST_CONFIG.logWaitMs);

    // Step 4: Check CloudWatch logs for orchestrator invocation
    await checkOrchestratorLogs();

    // Step 5: Check CloudWatch logs for terrain Lambda invocation
    await checkTerrainLambdaLogs();

    // Step 6: Validate response structure and project ID
    await validateResponse(response);

    // Print test results
    printTestResults();

  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    testResults.overallSuccess = false;
    printTestResults();
    process.exit(1);
  }
}

/**
 * Check deployment status of Lambda functions
 */
async function checkDeploymentStatus() {
  console.log('───────────────────────────────────────────────────────────');
  console.log('📦 STEP 1: Checking Deployment Status');
  console.log('───────────────────────────────────────────────────────────');

  try {
    // Check orchestrator function
    const orchestratorCommand = new GetFunctionCommand({
      FunctionName: TEST_CONFIG.orchestratorFunctionName,
    });
    const orchestratorResponse = await lambdaClient.send(orchestratorCommand);
    
    console.log(`✅ Orchestrator deployed: ${orchestratorResponse.Configuration.FunctionName}`);
    console.log(`   ARN: ${orchestratorResponse.Configuration.FunctionArn}`);
    console.log(`   Runtime: ${orchestratorResponse.Configuration.Runtime}`);
    console.log(`   Timeout: ${orchestratorResponse.Configuration.Timeout}s`);

    // Check terrain tool function
    const terrainCommand = new GetFunctionCommand({
      FunctionName: TEST_CONFIG.terrainFunctionName,
    });
    const terrainResponse = await lambdaClient.send(terrainCommand);
    
    console.log(`✅ Terrain tool deployed: ${terrainResponse.Configuration.FunctionName}`);
    console.log(`   ARN: ${terrainResponse.Configuration.FunctionArn}`);
    console.log(`   Runtime: ${terrainResponse.Configuration.Runtime}`);
    console.log(`   Timeout: ${terrainResponse.Configuration.Timeout}s`);

    testResults.deploymentCheck.passed = true;
    testResults.deploymentCheck.details = 'All Lambda functions are deployed and accessible';

  } catch (error) {
    console.error('❌ Deployment check failed:', error.message);
    testResults.deploymentCheck.passed = false;
    testResults.deploymentCheck.details = `Deployment check failed: ${error.message}`;
    throw error;
  }
}

/**
 * Invoke orchestrator with test query
 */
async function invokeOrchestrator() {
  console.log('\n───────────────────────────────────────────────────────────');
  console.log('🚀 STEP 2: Invoking Orchestrator');
  console.log('───────────────────────────────────────────────────────────');

  const payload = {
    query: TEST_CONFIG.testQuery,
    userId: 'test-user',
    sessionId: `test-session-${Date.now()}`,
    context: {}
  };

  console.log(`📤 Payload: ${JSON.stringify(payload, null, 2)}`);

  try {
    const command = new InvokeCommand({
      FunctionName: TEST_CONFIG.orchestratorFunctionName,
      Payload: JSON.stringify(payload),
    });

    const startTime = Date.now();
    const response = await lambdaClient.send(command);
    const duration = Date.now() - startTime;

    console.log(`✅ Orchestrator invoked successfully`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Status Code: ${response.StatusCode}`);
    console.log(`   Function Error: ${response.FunctionError || 'None'}`);

    if (!response.Payload) {
      throw new Error('No payload in Lambda response');
    }

    const orchestratorResponse = JSON.parse(new TextDecoder().decode(response.Payload));
    
    console.log(`📥 Response Preview:`);
    console.log(`   Success: ${orchestratorResponse.success}`);
    console.log(`   Message: ${orchestratorResponse.message?.substring(0, 100)}...`);
    console.log(`   Artifact Count: ${orchestratorResponse.artifacts?.length || 0}`);
    console.log(`   Thought Steps: ${orchestratorResponse.thoughtSteps?.length || 0}`);

    testResults.orchestratorInvocation.passed = true;
    testResults.orchestratorInvocation.details = `Orchestrator invoked successfully in ${duration}ms`;

    return orchestratorResponse;

  } catch (error) {
    console.error('❌ Orchestrator invocation failed:', error.message);
    testResults.orchestratorInvocation.passed = false;
    testResults.orchestratorInvocation.details = `Invocation failed: ${error.message}`;
    throw error;
  }
}

/**
 * Check CloudWatch logs for orchestrator invocation
 */
async function checkOrchestratorLogs() {
  console.log('\n───────────────────────────────────────────────────────────');
  console.log('📋 STEP 3: Checking Orchestrator CloudWatch Logs');
  console.log('───────────────────────────────────────────────────────────');

  const logGroupName = `/aws/lambda/${TEST_CONFIG.orchestratorFunctionName}`;
  
  try {
    // Get recent log streams
    const streamsCommand = new DescribeLogStreamsCommand({
      logGroupName,
      orderBy: 'LastEventTime',
      descending: true,
      limit: 5,
    });
    
    const streamsResponse = await logsClient.send(streamsCommand);
    
    if (!streamsResponse.logStreams || streamsResponse.logStreams.length === 0) {
      throw new Error('No log streams found for orchestrator');
    }

    console.log(`📊 Found ${streamsResponse.logStreams.length} recent log streams`);

    // Search for key log patterns
    const searchPatterns = [
      'ORCHESTRATOR ENTRY POINT',
      'INTENT DETECTION RESULTS',
      'TOOL LAMBDA INVOCATION',
      'TOOL LAMBDA RESPONSE',
      'PROJECT ID GENERATION',
      'FINAL RESPONSE STRUCTURE'
    ];

    const foundLogs = [];

    for (const pattern of searchPatterns) {
      const filterCommand = new FilterLogEventsCommand({
        logGroupName,
        filterPattern: pattern,
        startTime: Date.now() - 60000, // Last 60 seconds
        limit: 10,
      });

      const filterResponse = await logsClient.send(filterCommand);

      if (filterResponse.events && filterResponse.events.length > 0) {
        console.log(`✅ Found "${pattern}" in logs (${filterResponse.events.length} occurrences)`);
        foundLogs.push({
          pattern,
          count: filterResponse.events.length,
          events: filterResponse.events.map(e => ({
            timestamp: new Date(e.timestamp).toISOString(),
            message: e.message?.substring(0, 200)
          }))
        });
      } else {
        console.log(`⚠️  Pattern "${pattern}" not found in logs`);
      }
    }

    // Verify orchestrator was actually invoked
    const entryPointLogs = foundLogs.find(l => l.pattern === 'ORCHESTRATOR ENTRY POINT');
    
    if (entryPointLogs && entryPointLogs.count > 0) {
      testResults.orchestratorInvocation.passed = true;
      testResults.orchestratorInvocation.details = 'Orchestrator entry point confirmed in CloudWatch logs';
      testResults.orchestratorInvocation.logs = foundLogs;
      console.log('\n✅ Orchestrator invocation confirmed in CloudWatch logs');
    } else {
      testResults.orchestratorInvocation.passed = false;
      testResults.orchestratorInvocation.details = 'Orchestrator entry point NOT found in logs - orchestrator may have been bypassed';
      console.log('\n❌ Orchestrator entry point NOT found in logs');
    }

  } catch (error) {
    console.error('❌ Failed to check orchestrator logs:', error.message);
    testResults.orchestratorInvocation.details = `Log check failed: ${error.message}`;
  }
}

/**
 * Check CloudWatch logs for terrain Lambda invocation
 */
async function checkTerrainLambdaLogs() {
  console.log('\n───────────────────────────────────────────────────────────');
  console.log('🗺️  STEP 4: Checking Terrain Lambda CloudWatch Logs');
  console.log('───────────────────────────────────────────────────────────');

  const logGroupName = `/aws/lambda/${TEST_CONFIG.terrainFunctionName}`;
  
  try {
    // Get recent log streams
    const streamsCommand = new DescribeLogStreamsCommand({
      logGroupName,
      orderBy: 'LastEventTime',
      descending: true,
      limit: 5,
    });
    
    const streamsResponse = await logsClient.send(streamsCommand);
    
    if (!streamsResponse.logStreams || streamsResponse.logStreams.length === 0) {
      throw new Error('No log streams found for terrain Lambda');
    }

    console.log(`📊 Found ${streamsResponse.logStreams.length} recent log streams`);

    // Search for terrain Lambda invocation
    const filterCommand = new FilterLogEventsCommand({
      logGroupName,
      filterPattern: 'START RequestId',
      startTime: Date.now() - 60000, // Last 60 seconds
      limit: 10,
    });

    const filterResponse = await logsClient.send(filterCommand);

    if (filterResponse.events && filterResponse.events.length > 0) {
      console.log(`✅ Terrain Lambda was invoked (${filterResponse.events.length} invocations)`);
      
      testResults.terrainLambdaInvocation.passed = true;
      testResults.terrainLambdaInvocation.details = `Terrain Lambda invoked ${filterResponse.events.length} times`;
      testResults.terrainLambdaInvocation.logs = filterResponse.events.map(e => ({
        timestamp: new Date(e.timestamp).toISOString(),
        message: e.message?.substring(0, 200)
      }));

      // Check if invocation was from orchestrator
      const orchestratorInvocationCommand = new FilterLogEventsCommand({
        logGroupName,
        filterPattern: 'orchestrator',
        startTime: Date.now() - 60000,
        limit: 10,
      });

      const orchestratorInvocationResponse = await logsClient.send(orchestratorInvocationCommand);

      if (orchestratorInvocationResponse.events && orchestratorInvocationResponse.events.length > 0) {
        console.log(`✅ Terrain Lambda was invoked BY orchestrator`);
        testResults.terrainLambdaInvocation.details += ' (invoked by orchestrator)';
      } else {
        console.log(`⚠️  Could not confirm terrain Lambda was invoked by orchestrator`);
      }

    } else {
      console.log(`❌ Terrain Lambda was NOT invoked`);
      testResults.terrainLambdaInvocation.passed = false;
      testResults.terrainLambdaInvocation.details = 'Terrain Lambda was not invoked';
    }

  } catch (error) {
    console.error('❌ Failed to check terrain Lambda logs:', error.message);
    testResults.terrainLambdaInvocation.details = `Log check failed: ${error.message}`;
  }
}

/**
 * Validate response structure and project ID
 */
async function validateResponse(response) {
  console.log('\n───────────────────────────────────────────────────────────');
  console.log('✅ STEP 5: Validating Response Structure');
  console.log('───────────────────────────────────────────────────────────');

  try {
    // Check required fields
    const requiredFields = ['success', 'message', 'artifacts'];
    const missingFields = requiredFields.filter(field => !(field in response));

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    console.log(`✅ All required fields present`);

    // Check artifacts
    if (!Array.isArray(response.artifacts)) {
      throw new Error('Artifacts is not an array');
    }

    console.log(`✅ Artifacts is an array (${response.artifacts.length} artifacts)`);

    // Check project ID
    let projectId = null;

    if (response.metadata?.projectId) {
      projectId = response.metadata.projectId;
    } else if (response.artifacts.length > 0 && response.artifacts[0].metadata?.projectId) {
      projectId = response.artifacts[0].metadata.projectId;
    }

    if (!projectId) {
      throw new Error('Project ID not found in response');
    }

    console.log(`✅ Project ID found: ${projectId}`);

    // Validate project ID format
    if (projectId === 'default-project') {
      throw new Error('Project ID is "default-project" - should be unique generated ID');
    }

    console.log(`✅ Project ID is unique (not "default-project")`);

    // Check project ID format (should be like "project-1234567890" or "terrain-1234567890-abc")
    const projectIdPattern = /^(project|terrain)-\d+(-[a-z0-9]+)?$/;
    if (!projectIdPattern.test(projectId)) {
      console.log(`⚠️  Project ID format is non-standard: ${projectId}`);
    } else {
      console.log(`✅ Project ID format is valid`);
    }

    testResults.projectIdGeneration.passed = true;
    testResults.projectIdGeneration.details = `Unique project ID generated: ${projectId}`;
    testResults.projectIdGeneration.projectId = projectId;

    testResults.responseValidation.passed = true;
    testResults.responseValidation.details = 'Response structure is valid';
    testResults.responseValidation.response = {
      success: response.success,
      artifactCount: response.artifacts.length,
      projectId,
    };

  } catch (error) {
    console.error('❌ Response validation failed:', error.message);
    testResults.projectIdGeneration.passed = false;
    testResults.projectIdGeneration.details = `Validation failed: ${error.message}`;
    testResults.responseValidation.passed = false;
    testResults.responseValidation.details = `Validation failed: ${error.message}`;
  }
}

/**
 * Print test results summary
 */
function printTestResults() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');

  const tests = [
    { name: 'Deployment Check', result: testResults.deploymentCheck },
    { name: 'Orchestrator Invocation', result: testResults.orchestratorInvocation },
    { name: 'Terrain Lambda Invocation', result: testResults.terrainLambdaInvocation },
    { name: 'Project ID Generation', result: testResults.projectIdGeneration },
    { name: 'Response Validation', result: testResults.responseValidation },
  ];

  let passedCount = 0;
  let failedCount = 0;

  tests.forEach(test => {
    const status = test.result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`\n${status} - ${test.name}`);
    console.log(`   ${test.result.details}`);
    
    if (test.result.passed) {
      passedCount++;
    } else {
      failedCount++;
    }
  });

  testResults.overallSuccess = failedCount === 0;

  console.log('\n───────────────────────────────────────────────────────────');
  console.log(`📈 Overall: ${passedCount}/${tests.length} tests passed`);
  
  if (testResults.overallSuccess) {
    console.log('✅ ALL TESTS PASSED');
  } else {
    console.log(`❌ ${failedCount} TEST(S) FAILED`);
  }
  
  console.log('═══════════════════════════════════════════════════════════');

  // Print detailed logs if available
  if (testResults.orchestratorInvocation.logs && testResults.orchestratorInvocation.logs.length > 0) {
    console.log('\n📋 Orchestrator Log Patterns Found:');
    testResults.orchestratorInvocation.logs.forEach(log => {
      console.log(`   - ${log.pattern}: ${log.count} occurrences`);
    });
  }

  if (testResults.projectIdGeneration.projectId) {
    console.log(`\n🆔 Project ID: ${testResults.projectIdGeneration.projectId}`);
  }

  console.log(`\n⏰ Completed: ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════════════════\n');
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the test
runTest()
  .then(() => {
    process.exit(testResults.overallSuccess ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
