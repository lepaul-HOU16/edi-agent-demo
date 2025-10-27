#!/usr/bin/env node

/**
 * Manual Testing Script for Terrain Query Routing Fix
 * 
 * Tests the fix for the critical routing bug where terrain analysis queries
 * were incorrectly matched by project listing patterns.
 * 
 * This script tests:
 * - Task 6.1: Problematic query routing
 * - Task 6.2: Legitimate project list queries
 * - Task 6.3: No regressions in other renewable queries
 * 
 * Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 4.1, 4.2, 4.3
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { CloudWatchLogsClient, FilterLogEventsCommand } = require('@aws-sdk/client-cloudwatch-logs');

const lambdaClient = new LambdaClient({});
const logsClient = new CloudWatchLogsClient({});

// Test configuration
const TEST_CONFIG = {
  orchestratorFunctionName: process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME || 'amplify-digitalassistant-renewableOrchestrator',
  sessionId: `test-session-${Date.now()}`,
  logGroupName: '/aws/lambda/amplify-digitalassistant-renewableOrchestrator'
};

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Print section header
 */
function printHeader(title) {
  console.log('\n' + colors.bright + colors.cyan + '═'.repeat(80) + colors.reset);
  console.log(colors.bright + colors.cyan + title + colors.reset);
  console.log(colors.bright + colors.cyan + '═'.repeat(80) + colors.reset + '\n');
}

/**
 * Print test result
 */
function printResult(testName, passed, details = '') {
  const icon = passed ? '✅' : '❌';
  const color = passed ? colors.green : colors.red;
  console.log(`${icon} ${color}${testName}${colors.reset}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

/**
 * Invoke orchestrator with query
 */
async function invokeOrchestrator(query) {
  const payload = {
    query,
    sessionId: TEST_CONFIG.sessionId,
    context: {}
  };

  console.log(`${colors.blue}📤 Sending query:${colors.reset} "${query}"`);

  const command = new InvokeCommand({
    FunctionName: TEST_CONFIG.orchestratorFunctionName,
    Payload: JSON.stringify(payload)
  });

  const startTime = Date.now();
  const response = await lambdaClient.send(command);
  const duration = Date.now() - startTime;

  const result = JSON.parse(Buffer.from(response.Payload).toString());

  console.log(`${colors.blue}⏱️  Response time:${colors.reset} ${duration}ms`);
  console.log(`${colors.blue}📥 Response:${colors.reset}`);
  console.log(JSON.stringify(result, null, 2));

  return { result, duration };
}

/**
 * Get CloudWatch logs for the last invocation
 */
async function getRecentLogs(startTime) {
  try {
    const command = new FilterLogEventsCommand({
      logGroupName: TEST_CONFIG.logGroupName,
      startTime: startTime - 5000, // 5 seconds before
      filterPattern: '[ProjectListHandler]'
    });

    const response = await logsClient.send(command);
    
    if (response.events && response.events.length > 0) {
      console.log(`\n${colors.yellow}📋 CloudWatch Logs (Pattern Matching):${colors.reset}`);
      response.events.forEach(event => {
        console.log(`   ${event.message}`);
      });
    }

    return response.events || [];
  } catch (error) {
    console.warn(`${colors.yellow}⚠️  Could not fetch CloudWatch logs:${colors.reset}`, error.message);
    return [];
  }
}

/**
 * Task 6.1: Test problematic query
 */
async function testProblematicQuery() {
  printHeader('TASK 6.1: Test Problematic Query');

  const query = 'Analyze terrain at coordinates 35.067482, -101.395466 in Texas';
  
  console.log(`${colors.bright}Testing the exact query that was incorrectly routed to project list${colors.reset}\n`);

  const startTime = Date.now();
  const { result, duration } = await invokeOrchestrator(query);

  // Wait a moment for logs to be available
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Fetch CloudWatch logs
  const logs = await getRecentLogs(startTime);

  // Verify routing
  const tests = {
    success: result.success === true,
    notProjectList: !result.message.includes('projects that match') && !result.message.includes('Your Renewable Energy Projects'),
    hasArtifacts: result.artifacts && result.artifacts.length > 0,
    isTerrainAnalysis: result.artifacts && result.artifacts.some(a => a.type === 'wind_farm_terrain_analysis'),
    logsShowRejection: logs.some(log => log.message.includes('Rejected: Query contains action verb'))
  };

  console.log('\n' + colors.bright + 'Verification Results:' + colors.reset);
  printResult('Query succeeded', tests.success);
  printResult('Did NOT route to project list', tests.notProjectList, 
    tests.notProjectList ? 'Correctly routed to terrain analysis' : 'FAILED: Routed to project list');
  printResult('Generated artifacts', tests.hasArtifacts, 
    tests.hasArtifacts ? `Generated ${result.artifacts?.length || 0} artifact(s)` : 'No artifacts generated');
  printResult('Artifact is terrain analysis', tests.isTerrainAnalysis,
    tests.isTerrainAnalysis ? 'Correct artifact type' : 'Wrong artifact type');
  printResult('CloudWatch logs show rejection', tests.logsShowRejection,
    tests.logsShowRejection ? 'Pattern matching correctly rejected project list' : 'Check logs manually');

  const allPassed = Object.values(tests).every(t => t);
  
  console.log('\n' + colors.bright + (allPassed ? colors.green : colors.red) + 
    `Task 6.1: ${allPassed ? 'PASSED ✅' : 'FAILED ❌'}` + colors.reset);

  return allPassed;
}

/**
 * Task 6.2: Test legitimate project list queries
 */
async function testProjectListQueries() {
  printHeader('TASK 6.2: Test Legitimate Project List Queries');

  const queries = [
    'list my renewable projects',
    'show my projects'
  ];

  const results = [];

  for (const query of queries) {
    console.log(`\n${colors.bright}Testing: "${query}"${colors.reset}\n`);

    const startTime = Date.now();
    const { result, duration } = await invokeOrchestrator(query);

    // Wait for logs
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Fetch CloudWatch logs
    const logs = await getRecentLogs(startTime);

    // Verify routing
    const tests = {
      success: result.success === true,
      isProjectList: result.message.includes('Your Renewable Energy Projects') || 
                     result.message.includes('don\'t have any renewable energy projects'),
      noArtifacts: !result.artifacts || result.artifacts.length === 0,
      logsShowMatch: logs.some(log => log.message.includes('Matched pattern'))
    };

    console.log(colors.bright + 'Verification Results:' + colors.reset);
    printResult('Query succeeded', tests.success);
    printResult('Routed to project list', tests.isProjectList,
      tests.isProjectList ? 'Correctly identified as project list query' : 'FAILED: Not routed to project list');
    printResult('No artifacts (text response only)', tests.noArtifacts,
      tests.noArtifacts ? 'Correct - project list is text-only' : 'Unexpected artifacts');
    printResult('CloudWatch logs show match', tests.logsShowMatch,
      tests.logsShowMatch ? 'Pattern matching correctly identified project list' : 'Check logs manually');

    const passed = Object.values(tests).every(t => t);
    results.push({ query, passed, tests });

    console.log(colors.bright + (passed ? colors.green : colors.red) + 
      `Result: ${passed ? 'PASSED ✅' : 'FAILED ❌'}` + colors.reset);
  }

  const allPassed = results.every(r => r.passed);
  
  console.log('\n' + colors.bright + (allPassed ? colors.green : colors.red) + 
    `Task 6.2: ${allPassed ? 'PASSED ✅' : 'FAILED ❌'}` + colors.reset);

  return allPassed;
}

/**
 * Task 6.3: Verify no regressions
 */
async function testNoRegressions() {
  printHeader('TASK 6.3: Verify No Regressions');

  const testCases = [
    {
      name: 'Terrain Analysis',
      query: 'analyze terrain at 40.7128, -74.0060',
      expectedType: 'wind_farm_terrain_analysis',
      shouldHaveArtifacts: true
    },
    {
      name: 'Layout Optimization',
      query: 'optimize layout for my wind farm',
      expectedType: 'wind_farm_layout',
      shouldHaveArtifacts: true
    },
    {
      name: 'Wake Simulation',
      query: 'run wake simulation',
      expectedType: 'wake_simulation',
      shouldHaveArtifacts: true
    },
    {
      name: 'Report Generation',
      query: 'generate comprehensive report',
      expectedType: 'comprehensive_report',
      shouldHaveArtifacts: true
    },
    {
      name: 'Project Details',
      query: 'show project test-project-123',
      expectedType: 'project_details',
      shouldHaveArtifacts: false
    }
  ];

  const results = [];

  for (const testCase of testCases) {
    console.log(`\n${colors.bright}Testing: ${testCase.name}${colors.reset}`);
    console.log(`Query: "${testCase.query}"\n`);

    const startTime = Date.now();
    const { result, duration } = await invokeOrchestrator(testCase.query);

    // Verify routing
    const hasArtifacts = result.artifacts && result.artifacts.length > 0;
    const hasCorrectType = hasArtifacts && result.artifacts.some(a => a.type === testCase.expectedType);
    
    const tests = {
      success: result.success === true,
      correctArtifactPresence: hasArtifacts === testCase.shouldHaveArtifacts,
      correctType: testCase.shouldHaveArtifacts ? hasCorrectType : true,
      notProjectList: !result.message.includes('Your Renewable Energy Projects') || testCase.expectedType === 'project_details'
    };

    console.log(colors.bright + 'Verification Results:' + colors.reset);
    printResult('Query succeeded', tests.success);
    printResult('Correct artifact presence', tests.correctArtifactPresence,
      testCase.shouldHaveArtifacts 
        ? (hasArtifacts ? `Has artifacts: ${result.artifacts?.length || 0}` : 'Missing artifacts')
        : (hasArtifacts ? 'Unexpected artifacts' : 'Correctly no artifacts'));
    printResult('Correct artifact type', tests.correctType,
      testCase.shouldHaveArtifacts 
        ? (hasCorrectType ? `Type: ${testCase.expectedType}` : `Wrong type: ${result.artifacts?.[0]?.type || 'none'}`)
        : 'N/A');
    printResult('Not incorrectly routed to project list', tests.notProjectList,
      tests.notProjectList ? 'Correct routing' : 'FAILED: Incorrectly routed to project list');

    const passed = Object.values(tests).every(t => t);
    results.push({ testCase: testCase.name, passed, tests });

    console.log(colors.bright + (passed ? colors.green : colors.red) + 
      `Result: ${passed ? 'PASSED ✅' : 'FAILED ❌'}` + colors.reset);

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const allPassed = results.every(r => r.passed);
  
  console.log('\n' + colors.bright + 'Regression Test Summary:' + colors.reset);
  results.forEach(r => {
    printResult(r.testCase, r.passed);
  });

  console.log('\n' + colors.bright + (allPassed ? colors.green : colors.red) + 
    `Task 6.3: ${allPassed ? 'PASSED ✅' : 'FAILED ❌'}` + colors.reset);

  return allPassed;
}

/**
 * Main test execution
 */
async function runAllTests() {
  console.log(colors.bright + colors.blue);
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                            ║');
  console.log('║           TERRAIN QUERY ROUTING FIX - MANUAL VALIDATION TESTS             ║');
  console.log('║                                                                            ║');
  console.log('║  Testing the fix for the critical routing bug where terrain analysis      ║');
  console.log('║  queries were incorrectly matched by project listing patterns.            ║');
  console.log('║                                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  console.log(`\n${colors.bright}Test Configuration:${colors.reset}`);
  console.log(`  Orchestrator Function: ${TEST_CONFIG.orchestratorFunctionName}`);
  console.log(`  Session ID: ${TEST_CONFIG.sessionId}`);
  console.log(`  Log Group: ${TEST_CONFIG.logGroupName}`);

  const startTime = Date.now();

  try {
    // Run all test tasks
    const task61Passed = await testProblematicQuery();
    const task62Passed = await testProjectListQueries();
    const task63Passed = await testNoRegressions();

    // Final summary
    printHeader('FINAL TEST SUMMARY');

    const allPassed = task61Passed && task62Passed && task63Passed;

    console.log(colors.bright + 'Task Results:' + colors.reset);
    printResult('Task 6.1: Problematic Query', task61Passed);
    printResult('Task 6.2: Project List Queries', task62Passed);
    printResult('Task 6.3: No Regressions', task63Passed);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n${colors.bright}Total Test Duration:${colors.reset} ${duration}s`);

    if (allPassed) {
      console.log('\n' + colors.bright + colors.green);
      console.log('╔════════════════════════════════════════════════════════════════════════════╗');
      console.log('║                                                                            ║');
      console.log('║                        ✅ ALL TESTS PASSED ✅                              ║');
      console.log('║                                                                            ║');
      console.log('║  The terrain query routing fix is working correctly!                      ║');
      console.log('║  - Terrain queries route to terrain analysis                              ║');
      console.log('║  - Project list queries route to project list                             ║');
      console.log('║  - No regressions in other renewable queries                              ║');
      console.log('║                                                                            ║');
      console.log('║  Ready for deployment! ✅                                                  ║');
      console.log('║                                                                            ║');
      console.log('╚════════════════════════════════════════════════════════════════════════════╝');
      console.log(colors.reset);
      process.exit(0);
    } else {
      console.log('\n' + colors.bright + colors.red);
      console.log('╔════════════════════════════════════════════════════════════════════════════╗');
      console.log('║                                                                            ║');
      console.log('║                        ❌ TESTS FAILED ❌                                  ║');
      console.log('║                                                                            ║');
      console.log('║  Some tests did not pass. Please review the results above.                ║');
      console.log('║                                                                            ║');
      console.log('║  Action Required:                                                          ║');
      console.log('║  1. Review failed test details                                             ║');
      console.log('║  2. Check CloudWatch logs for pattern matching                            ║');
      console.log('║  3. Verify pattern fixes in projectListHandler.ts                         ║');
      console.log('║  4. Re-run tests after fixes                                               ║');
      console.log('║                                                                            ║');
      console.log('╚════════════════════════════════════════════════════════════════════════════╝');
      console.log(colors.reset);
      process.exit(1);
    }

  } catch (error) {
    console.error('\n' + colors.bright + colors.red + 'ERROR: Test execution failed' + colors.reset);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
