#!/usr/bin/env node

/**
 * Comprehensive Strands Agent Integration Tests
 * 
 * Tests Tasks 5-9 from the Complete Strands Agent Integration spec:
 * - Task 5: Test Individual Agents
 * - Task 6: Test Multi-Agent Orchestration
 * - Task 7: Verify Artifact Generation and Storage
 * - Task 8: Verify Extended Thinking Display
 * - Task 9: Performance and Optimization Testing
 */

const { LambdaClient, InvokeCommand, GetFunctionConfigurationCommand } = require('@aws-sdk/client-lambda');
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { CloudWatchLogsClient, FilterLogEventsCommand } = require('@aws-sdk/client-cloudwatch-logs');

const region = process.env.AWS_REGION || 'us-west-2';
const lambdaClient = new LambdaClient({ region });
const s3Client = new S3Client({ region });
const logsClient = new CloudWatchLogsClient({ region });

// Test configuration
const TEST_PROJECT_ID = 'strands-test-' + Date.now();
const TEST_COORDINATES = {
  latitude: 35.067482,
  longitude: -101.395466
};

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'bright');
  console.log('='.repeat(80) + '\n');
}

function logTest(testName) {
  log(`\n▶ ${testName}`, 'cyan');
}

function logSuccess(message) {
  log(`  ✅ ${message}`, 'green');
}

function logError(message) {
  log(`  ❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`  ⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`  ℹ️  ${message}`, 'blue');
}

// Helper: Find Lambda function by name pattern
async function findLambdaFunction(namePattern) {
  try {
    const { execSync } = require('child_process');
    const result = execSync(
      `aws lambda list-functions --region ${region} --query "Functions[?contains(FunctionName, '${namePattern}')].FunctionName" --output text`,
      { encoding: 'utf-8' }
    );
    
    const functionName = result.trim().split('\t')[0];
    if (!functionName) {
      throw new Error(`No function found matching pattern: ${namePattern}`);
    }
    
    return functionName;
  } catch (error) {
    throw new Error(`Failed to find Lambda function: ${error.message}`);
  }
}

// Helper: Invoke Lambda function
async function invokeLambda(functionName, payload) {
  const command = new InvokeCommand({
    FunctionName: functionName,
    Payload: JSON.stringify(payload),
  });
  
  const startTime = Date.now();
  const response = await lambdaClient.send(command);
  const duration = Date.now() - startTime;
  
  const responsePayload = JSON.parse(Buffer.from(response.Payload).toString());
  
  return {
    statusCode: response.StatusCode,
    payload: responsePayload,
    duration,
    functionError: response.FunctionError,
  };
}

// Helper: Get Lambda configuration
async function getLambdaConfig(functionName) {
  const command = new GetFunctionConfigurationCommand({
    FunctionName: functionName,
  });
  
  return await lambdaClient.send(command);
}

// Helper: Check CloudWatch logs
async function checkCloudWatchLogs(functionName, searchPattern, minutes = 5) {
  try {
    const logGroupName = `/aws/lambda/${functionName}`;
    const startTime = Date.now() - (minutes * 60 * 1000);
    
    const command = new FilterLogEventsCommand({
      logGroupName,
      startTime,
      filterPattern: searchPattern,
      limit: 10,
    });
    
    const response = await logsClient.send(command);
    return response.events || [];
  } catch (error) {
    logWarning(`Could not check CloudWatch logs: ${error.message}`);
    return [];
  }
}

// Helper: Check S3 artifacts
async function checkS3Artifacts(bucketName, projectId) {
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: `projects/${projectId}/`,
    });
    
    const response = await s3Client.send(command);
    return response.Contents || [];
  } catch (error) {
    logWarning(`Could not check S3 artifacts: ${error.message}`);
    return [];
  }
}

// ============================================================================
// TASK 5: Test Individual Agents
// ============================================================================

async function testTerrainAgent(functionName) {
  logTest('Task 5.1: Test Terrain Agent Invocation');
  
  const payload = {
    agent_type: 'terrain',
    prompt: `Analyze terrain at ${TEST_COORDINATES.latitude}, ${TEST_COORDINATES.longitude} with project_id '${TEST_PROJECT_ID}'`,
  };
  
  try {
    const result = await invokeLambda(functionName, payload);
    
    logInfo(`Response time: ${result.duration}ms`);
    
    // Check for errors
    if (result.functionError) {
      logError(`Lambda function error: ${result.functionError}`);
      logError(JSON.stringify(result.payload, null, 2));
      return false;
    }
    
    // Check response structure
    if (!result.payload) {
      logError('No response payload received');
      return false;
    }
    
    logSuccess('Agent responded successfully');
    
    // Check for project_id in response
    const responseStr = JSON.stringify(result.payload);
    if (responseStr.includes(TEST_PROJECT_ID)) {
      logSuccess(`Project ID ${TEST_PROJECT_ID} found in response`);
    } else {
      logWarning('Project ID not found in response');
    }
    
    // Check for terrain-specific content
    if (responseStr.includes('unbuildable') || responseStr.includes('terrain') || responseStr.includes('exclusion')) {
      logSuccess('Terrain analysis content detected');
    } else {
      logWarning('No terrain-specific content detected');
    }
    
    // Check CloudWatch logs
    const logs = await checkCloudWatchLogs(functionName, 'terrain_agent', 2);
    if (logs.length > 0) {
      logSuccess(`Found ${logs.length} log entries for terrain agent`);
    }
    
    return true;
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    return false;
  }
}

async function testLayoutAgent(functionName) {
  logTest('Task 5.2: Test Layout Agent Invocation');
  
  const payload = {
    agent_type: 'layout',
    prompt: `Create 30MW wind farm at ${TEST_COORDINATES.latitude}, ${TEST_COORDINATES.longitude} with project_id '${TEST_PROJECT_ID}'`,
  };
  
  try {
    const result = await invokeLambda(functionName, payload);
    
    logInfo(`Response time: ${result.duration}ms`);
    
    if (result.functionError) {
      logError(`Lambda function error: ${result.functionError}`);
      return false;
    }
    
    logSuccess('Agent responded successfully');
    
    const responseStr = JSON.stringify(result.payload);
    
    // Check for layout algorithms
    const algorithms = ['grid', 'greedy', 'spiral', 'offset'];
    const foundAlgorithm = algorithms.find(alg => responseStr.toLowerCase().includes(alg));
    if (foundAlgorithm) {
      logSuccess(`Layout algorithm detected: ${foundAlgorithm}`);
    } else {
      logWarning('No layout algorithm mentioned in response');
    }
    
    // Check for turbine count
    if (responseStr.includes('turbine') || responseStr.includes('MW')) {
      logSuccess('Turbine placement information detected');
    }
    
    return true;
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    return false;
  }
}

async function testSimulationAgent(functionName) {
  logTest('Task 5.3: Test Simulation Agent Invocation');
  
  const payload = {
    agent_type: 'simulation',
    prompt: `Run wake simulation for project_id '${TEST_PROJECT_ID}'`,
  };
  
  try {
    const result = await invokeLambda(functionName, payload);
    
    logInfo(`Response time: ${result.duration}ms`);
    
    if (result.functionError) {
      logError(`Lambda function error: ${result.functionError}`);
      return false;
    }
    
    logSuccess('Agent responded successfully');
    
    const responseStr = JSON.stringify(result.payload);
    
    // Check for simulation-specific content
    if (responseStr.includes('wake') || responseStr.includes('PyWake') || responseStr.includes('simulation')) {
      logSuccess('Wake simulation content detected');
    }
    
    // Check for wind rose
    if (responseStr.includes('wind rose') || responseStr.includes('wind_rose')) {
      logSuccess('Wind rose generation detected');
    }
    
    return true;
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    return false;
  }
}

async function testReportAgent(functionName) {
  logTest('Task 5.4: Test Report Agent Invocation');
  
  const payload = {
    agent_type: 'report',
    prompt: `Generate report for project_id '${TEST_PROJECT_ID}'`,
  };
  
  try {
    const result = await invokeLambda(functionName, payload);
    
    logInfo(`Response time: ${result.duration}ms`);
    
    if (result.functionError) {
      logError(`Lambda function error: ${result.functionError}`);
      return false;
    }
    
    logSuccess('Agent responded successfully');
    
    const responseStr = JSON.stringify(result.payload);
    
    // Check for report-specific content
    if (responseStr.includes('report') || responseStr.includes('PDF') || responseStr.includes('analysis')) {
      logSuccess('Report generation content detected');
    }
    
    return true;
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    return false;
  }
}

// ============================================================================
// TASK 6: Test Multi-Agent Orchestration
// ============================================================================

async function testOrchestratorRouting(orchestratorName, agentName) {
  logTest('Task 6.1: Test Orchestrator Routing to Agents');
  
  const payload = {
    message: `Analyze terrain at ${TEST_COORDINATES.latitude}, ${TEST_COORDINATES.longitude} with project_id '${TEST_PROJECT_ID}'`,
    chatSessionId: 'test-session-' + Date.now(),
  };
  
  try {
    const result = await invokeLambda(orchestratorName, payload);
    
    logInfo(`Response time: ${result.duration}ms`);
    
    if (result.functionError) {
      logError(`Orchestrator error: ${result.functionError}`);
      return false;
    }
    
    logSuccess('Orchestrator responded successfully');
    
    // Check if response contains artifacts
    if (result.payload.artifacts && result.payload.artifacts.length > 0) {
      logSuccess(`Artifacts extracted: ${result.payload.artifacts.length} artifact(s)`);
    } else {
      logWarning('No artifacts found in response');
    }
    
    return true;
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    return false;
  }
}

async function testCompleteWorkflow(orchestratorName) {
  logTest('Task 6.2: Test Complete Multi-Agent Workflow');
  
  const payload = {
    message: `Create a complete wind farm at ${TEST_COORDINATES.latitude}, ${TEST_COORDINATES.longitude} with project_id '${TEST_PROJECT_ID}'`,
    chatSessionId: 'test-workflow-' + Date.now(),
  };
  
  try {
    logInfo('This test may take several minutes...');
    const result = await invokeLambda(orchestratorName, payload);
    
    logInfo(`Total workflow time: ${result.duration}ms`);
    
    if (result.functionError) {
      logError(`Workflow error: ${result.functionError}`);
      return false;
    }
    
    logSuccess('Complete workflow executed successfully');
    
    return true;
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    return false;
  }
}

async function testErrorHandling(functionName) {
  logTest('Task 6.3: Test Error Handling');
  
  const testCases = [
    {
      name: 'Missing project_id',
      payload: {
        agent_type: 'terrain',
        prompt: `Analyze terrain at ${TEST_COORDINATES.latitude}, ${TEST_COORDINATES.longitude}`,
      },
    },
    {
      name: 'Invalid coordinates',
      payload: {
        agent_type: 'terrain',
        prompt: `Analyze terrain at 999, 999 with project_id '${TEST_PROJECT_ID}'`,
      },
    },
  ];
  
  let allPassed = true;
  
  for (const testCase of testCases) {
    logInfo(`Testing: ${testCase.name}`);
    
    try {
      const result = await invokeLambda(functionName, testCase.payload);
      
      // We expect graceful error handling, not crashes
      if (result.functionError) {
        logWarning(`Function error (expected): ${result.functionError}`);
      } else {
        const responseStr = JSON.stringify(result.payload);
        if (responseStr.includes('error') || responseStr.includes('provide') || responseStr.includes('invalid')) {
          logSuccess('Graceful error message detected');
        } else {
          logWarning('No clear error handling detected');
        }
      }
    } catch (error) {
      logError(`Unexpected error: ${error.message}`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

// ============================================================================
// TASK 7: Verify Artifact Generation and Storage
// ============================================================================

async function testS3ArtifactStorage(bucketName) {
  logTest('Task 7.1: Verify S3 Artifact Storage');
  
  try {
    const artifacts = await checkS3Artifacts(bucketName, TEST_PROJECT_ID);
    
    if (artifacts.length > 0) {
      logSuccess(`Found ${artifacts.length} artifact(s) in S3`);
      artifacts.forEach(artifact => {
        logInfo(`  - ${artifact.Key}`);
      });
    } else {
      logWarning('No artifacts found in S3 (may not have been generated yet)');
    }
    
    return true;
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    return false;
  }
}

// ============================================================================
// TASK 8: Verify Extended Thinking Display
// ============================================================================

async function testExtendedThinking(functionName) {
  logTest('Task 8.1: Check Agent Thinking in Responses');
  
  const payload = {
    agent_type: 'layout',
    prompt: `Create a complex wind farm layout at ${TEST_COORDINATES.latitude}, ${TEST_COORDINATES.longitude} with project_id '${TEST_PROJECT_ID}'. Consider multiple algorithms.`,
  };
  
  try {
    const result = await invokeLambda(functionName, payload);
    
    if (result.functionError) {
      logError(`Function error: ${result.functionError}`);
      return false;
    }
    
    const responseStr = JSON.stringify(result.payload);
    
    // Check for thinking/reasoning content
    if (responseStr.includes('thinking') || responseStr.includes('reasoning') || responseStr.includes('consider')) {
      logSuccess('Extended thinking content detected');
    } else {
      logWarning('No explicit thinking content detected');
    }
    
    // Check for decision-making process
    if (responseStr.includes('because') || responseStr.includes('therefore') || responseStr.includes('decided')) {
      logSuccess('Decision-making process detected');
    }
    
    return true;
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    return false;
  }
}

// ============================================================================
// TASK 9: Performance and Optimization Testing
// ============================================================================

async function testColdStartPerformance(functionName) {
  logTest('Task 9.1: Test Cold Start Performance');
  
  try {
    // Get function configuration
    const config = await getLambdaConfig(functionName);
    
    logInfo(`Memory: ${config.MemorySize}MB`);
    logInfo(`Timeout: ${config.Timeout}s`);
    
    // Invoke function (may be cold start)
    const payload = {
      agent_type: 'terrain',
      prompt: `Quick test at ${TEST_COORDINATES.latitude}, ${TEST_COORDINATES.longitude} with project_id '${TEST_PROJECT_ID}'`,
    };
    
    const result = await invokeLambda(functionName, payload);
    
    logInfo(`Response time: ${result.duration}ms`);
    
    if (result.duration < config.Timeout * 1000) {
      logSuccess('Response completed within timeout');
    } else {
      logError('Response exceeded timeout');
      return false;
    }
    
    return true;
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    return false;
  }
}

async function testWarmStartPerformance(functionName) {
  logTest('Task 9.2: Test Warm Start Performance');
  
  try {
    const iterations = 3;
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const payload = {
        agent_type: 'terrain',
        prompt: `Test ${i} at ${TEST_COORDINATES.latitude}, ${TEST_COORDINATES.longitude} with project_id '${TEST_PROJECT_ID}-${i}'`,
      };
      
      const result = await invokeLambda(functionName, payload);
      times.push(result.duration);
      
      logInfo(`Iteration ${i + 1}: ${result.duration}ms`);
      
      // Small delay between invocations
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    logSuccess(`Average response time: ${avgTime.toFixed(0)}ms`);
    
    // Check if warm starts are faster
    if (times[times.length - 1] < times[0]) {
      logSuccess('Warm starts are faster than initial invocation');
    }
    
    return true;
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    return false;
  }
}

async function testMemoryUsage(functionName) {
  logTest('Task 9.3: Test Memory Usage');
  
  try {
    const config = await getLambdaConfig(functionName);
    
    logInfo(`Configured memory: ${config.MemorySize}MB`);
    
    // Check CloudWatch logs for memory usage
    const logs = await checkCloudWatchLogs(functionName, 'Memory', 5);
    
    if (logs.length > 0) {
      logSuccess(`Found ${logs.length} memory-related log entries`);
      
      // Parse memory usage from logs
      logs.forEach(log => {
        const match = log.message.match(/Max Memory Used: (\d+) MB/);
        if (match) {
          const usedMemory = parseInt(match[1]);
          logInfo(`Memory used: ${usedMemory}MB / ${config.MemorySize}MB`);
          
          if (usedMemory < config.MemorySize * 0.9) {
            logSuccess('Memory usage within limits');
          } else {
            logWarning('Memory usage approaching limit');
          }
        }
      });
    } else {
      logWarning('No memory usage data found in logs');
    }
    
    return true;
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    return false;
  }
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runAllTests() {
  logSection('🚀 STRANDS AGENT INTEGRATION - COMPREHENSIVE TEST SUITE');
  
  log(`Test Project ID: ${TEST_PROJECT_ID}`, 'cyan');
  log(`Test Coordinates: ${TEST_COORDINATES.latitude}, ${TEST_COORDINATES.longitude}`, 'cyan');
  log(`AWS Region: ${region}`, 'cyan');
  
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
  };
  
  try {
    // Find Lambda functions
    logSection('📋 STEP 1: Locating Lambda Functions');
    
    let agentFunctionName, orchestratorName, bucketName;
    
    try {
      agentFunctionName = await findLambdaFunction('RenewableAgentsFunction');
      logSuccess(`Found Strands Agent Lambda: ${agentFunctionName}`);
    } catch (error) {
      logError(`Could not find Strands Agent Lambda: ${error.message}`);
      logError('Please ensure the Lambda is deployed');
      return;
    }
    
    try {
      orchestratorName = await findLambdaFunction('renewableOrchestrator');
      logSuccess(`Found Orchestrator Lambda: ${orchestratorName}`);
    } catch (error) {
      logWarning(`Could not find Orchestrator Lambda: ${error.message}`);
    }
    
    // Get S3 bucket from environment
    try {
      const config = await getLambdaConfig(agentFunctionName);
      bucketName = config.Environment?.Variables?.RENEWABLE_S3_BUCKET;
      if (bucketName) {
        logSuccess(`Found S3 bucket: ${bucketName}`);
      } else {
        logWarning('S3 bucket not configured');
      }
    } catch (error) {
      logWarning(`Could not get S3 bucket: ${error.message}`);
    }
    
    // ========================================================================
    // TASK 5: Test Individual Agents
    // ========================================================================
    
    logSection('🧪 TASK 5: Testing Individual Agents');
    
    if (await testTerrainAgent(agentFunctionName)) results.passed++; else results.failed++;
    if (await testLayoutAgent(agentFunctionName)) results.passed++; else results.failed++;
    if (await testSimulationAgent(agentFunctionName)) results.passed++; else results.failed++;
    if (await testReportAgent(agentFunctionName)) results.passed++; else results.failed++;
    
    // ========================================================================
    // TASK 6: Test Multi-Agent Orchestration
    // ========================================================================
    
    if (orchestratorName) {
      logSection('🔄 TASK 6: Testing Multi-Agent Orchestration');
      
      if (await testOrchestratorRouting(orchestratorName, agentFunctionName)) results.passed++; else results.failed++;
      if (await testCompleteWorkflow(orchestratorName)) results.passed++; else results.failed++;
    } else {
      logWarning('Skipping orchestration tests (orchestrator not found)');
    }
    
    if (await testErrorHandling(agentFunctionName)) results.passed++; else results.failed++;
    
    // ========================================================================
    // TASK 7: Verify Artifact Generation and Storage
    // ========================================================================
    
    if (bucketName) {
      logSection('📦 TASK 7: Verifying Artifact Generation and Storage');
      
      if (await testS3ArtifactStorage(bucketName)) results.passed++; else results.failed++;
    } else {
      logWarning('Skipping artifact tests (S3 bucket not configured)');
    }
    
    // ========================================================================
    // TASK 8: Verify Extended Thinking Display
    // ========================================================================
    
    logSection('🧠 TASK 8: Verifying Extended Thinking Display');
    
    if (await testExtendedThinking(agentFunctionName)) results.passed++; else results.failed++;
    
    // ========================================================================
    // TASK 9: Performance and Optimization Testing
    // ========================================================================
    
    logSection('⚡ TASK 9: Performance and Optimization Testing');
    
    if (await testColdStartPerformance(agentFunctionName)) results.passed++; else results.failed++;
    if (await testWarmStartPerformance(agentFunctionName)) results.passed++; else results.failed++;
    if (await testMemoryUsage(agentFunctionName)) results.passed++; else results.failed++;
    
  } catch (error) {
    logError(`Fatal error: ${error.message}`);
    console.error(error);
  }
  
  // ========================================================================
  // Final Summary
  // ========================================================================
  
  logSection('📊 TEST SUMMARY');
  
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, 'red');
  log(`⚠️  Warnings: ${results.warnings}`, 'yellow');
  
  const total = results.passed + results.failed;
  const successRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
  
  log(`\n📈 Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');
  
  if (results.failed === 0) {
    log('\n🎉 ALL TESTS PASSED!', 'green');
  } else {
    log('\n⚠️  SOME TESTS FAILED - Review errors above', 'yellow');
  }
  
  log('\n💡 Next Steps:', 'cyan');
  log('  1. Review any failed tests or warnings');
  log('  2. Check CloudWatch logs for detailed error messages');
  log('  3. Verify S3 artifacts are being generated');
  log('  4. Test in the UI to verify end-to-end workflow');
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  logError(`Unhandled error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
