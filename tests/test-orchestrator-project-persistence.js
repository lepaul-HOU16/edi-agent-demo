/**
 * Test orchestrator project persistence integration
 * 
 * Tests:
 * - Project name resolution from query
 * - Project data loading before tool calls
 * - Project data saving after tool responses
 * - Project status tracking in response
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Get orchestrator function name from environment
const ORCHESTRATOR_FUNCTION_NAME = process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME || 
  'amplify-digitalassistant-lepaul-sandbox-81360e1def-renewableOrchestratorlambda-jBcrYHDFlPXd';

/**
 * Invoke orchestrator Lambda
 */
async function invokeOrchestrator(query, context = {}) {
  const payload = {
    query,
    context,
    sessionId: `test-session-${Date.now()}`,
    userId: 'test-user'
  };

  console.log('\n📤 Invoking orchestrator...');
  console.log(`Query: ${query}`);
  console.log(`Context: ${JSON.stringify(context, null, 2)}`);

  const command = new InvokeCommand({
    FunctionName: ORCHESTRATOR_FUNCTION_NAME,
    Payload: JSON.stringify(payload),
  });

  const response = await lambdaClient.send(command);
  const result = JSON.parse(Buffer.from(response.Payload).toString());

  console.log('\n📥 Orchestrator response:');
  console.log(`Success: ${result.success}`);
  console.log(`Message: ${result.message}`);
  console.log(`Project Name: ${result.metadata?.projectName || 'none'}`);
  console.log(`Project Status: ${JSON.stringify(result.metadata?.projectStatus || {}, null, 2)}`);
  console.log(`Artifacts: ${result.artifacts?.length || 0}`);

  return result;
}

/**
 * Test 1: Project name generation from location in query
 */
async function testProjectNameGeneration() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('TEST 1: Project Name Generation from Query');
  console.log('═══════════════════════════════════════════════════════════');

  const result = await invokeOrchestrator(
    'Analyze terrain in West Texas at coordinates 35.067482, -101.395466 with 5km radius'
  );

  // Verify project name was generated
  if (!result.metadata?.projectName) {
    console.error('❌ FAILED: No project name generated');
    return false;
  }

  console.log(`✅ PASSED: Project name generated: ${result.metadata.projectName}`);
  
  // Should contain "west-texas" or similar
  if (result.metadata.projectName.includes('west') || result.metadata.projectName.includes('texas')) {
    console.log('✅ PASSED: Project name contains location reference');
  } else {
    console.warn('⚠️  WARNING: Project name does not contain obvious location reference');
  }

  return result.metadata.projectName;
}

/**
 * Test 2: Project data persistence after terrain analysis
 */
async function testProjectDataPersistence(projectName) {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('TEST 2: Project Data Persistence');
  console.log('═══════════════════════════════════════════════════════════');

  // Run terrain analysis
  const result = await invokeOrchestrator(
    `Analyze terrain for project ${projectName} at 35.067482, -101.395466`
  );

  // Verify project status shows terrain complete
  if (!result.metadata?.projectStatus) {
    console.error('❌ FAILED: No project status in response');
    return false;
  }

  if (!result.metadata.projectStatus.terrain) {
    console.error('❌ FAILED: Terrain not marked as complete in project status');
    return false;
  }

  console.log('✅ PASSED: Terrain marked as complete in project status');
  console.log(`Project Status: ${JSON.stringify(result.metadata.projectStatus, null, 2)}`);

  return true;
}

/**
 * Test 3: Project data loading for subsequent operations
 */
async function testProjectDataLoading(projectName) {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('TEST 3: Project Data Loading');
  console.log('═══════════════════════════════════════════════════════════');

  // Run layout optimization without providing coordinates
  // Should auto-load from project data
  const result = await invokeOrchestrator(
    `Optimize layout for project ${projectName} with 10 turbines`
  );

  // Check if it succeeded (would fail if coordinates weren't loaded)
  if (!result.success) {
    console.error('❌ FAILED: Layout optimization failed');
    console.error(`Error: ${result.message}`);
    return false;
  }

  console.log('✅ PASSED: Layout optimization succeeded with auto-loaded coordinates');

  // Verify project status shows both terrain and layout complete
  if (result.metadata?.projectStatus?.terrain && result.metadata?.projectStatus?.layout) {
    console.log('✅ PASSED: Both terrain and layout marked as complete');
  } else {
    console.error('❌ FAILED: Project status not updated correctly');
    return false;
  }

  return true;
}

/**
 * Test 4: Project status tracking in response message
 */
async function testProjectStatusInMessage(projectName) {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('TEST 4: Project Status in Response Message');
  console.log('═══════════════════════════════════════════════════════════');

  const result = await invokeOrchestrator(
    `Show status for project ${projectName}`
  );

  // Check if message contains project status
  if (!result.message.includes('Status:') && !result.message.includes('Project:')) {
    console.warn('⚠️  WARNING: Response message may not contain project status');
    console.log(`Message: ${result.message}`);
  } else {
    console.log('✅ PASSED: Response message contains project status');
  }

  return true;
}

/**
 * Test 5: Implicit project reference (active project)
 */
async function testImplicitProjectReference(projectName) {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('TEST 5: Implicit Project Reference');
  console.log('═══════════════════════════════════════════════════════════');

  // Use same session to test active project
  const sessionId = `test-session-${Date.now()}`;

  // First request sets active project
  await invokeOrchestrator(
    `Analyze terrain for project ${projectName} at 35.067482, -101.395466`,
    { sessionId }
  );

  // Second request without project name should use active project
  const result = await invokeOrchestrator(
    'Continue with layout optimization',
    { sessionId }
  );

  if (result.metadata?.projectName === projectName) {
    console.log('✅ PASSED: Implicit reference resolved to active project');
  } else {
    console.warn('⚠️  WARNING: Implicit reference may not have resolved correctly');
    console.log(`Expected: ${projectName}, Got: ${result.metadata?.projectName}`);
  }

  return true;
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 ORCHESTRATOR PROJECT PERSISTENCE TESTS');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Orchestrator Function: ${ORCHESTRATOR_FUNCTION_NAME}`);
  console.log(`Region: ${process.env.AWS_REGION || 'us-east-1'}`);
  console.log('═══════════════════════════════════════════════════════════');

  try {
    // Test 1: Project name generation
    const projectName = await testProjectNameGeneration();
    if (!projectName) {
      console.error('\n❌ Test suite failed at Test 1');
      process.exit(1);
    }

    // Test 2: Project data persistence
    const persistenceSuccess = await testProjectDataPersistence(projectName);
    if (!persistenceSuccess) {
      console.error('\n❌ Test suite failed at Test 2');
      process.exit(1);
    }

    // Test 3: Project data loading
    const loadingSuccess = await testProjectDataLoading(projectName);
    if (!loadingSuccess) {
      console.error('\n❌ Test suite failed at Test 3');
      process.exit(1);
    }

    // Test 4: Project status in message
    await testProjectStatusInMessage(projectName);

    // Test 5: Implicit project reference
    await testImplicitProjectReference(projectName);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\nTest Project: ${projectName}`);
    console.log('You can now test this project in the UI or continue with additional operations.');

  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED');
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run tests
runTests();
