/**
 * Task 14: End-to-End Wake Simulation Workflow Test
 * 
 * Tests the complete wake simulation workflow:
 * 1. Query routing to wake_simulation intent
 * 2. Orchestrator invokes simulation Lambda
 * 3. Wake data returns correctly
 * 4. Artifact displays in UI
 * 5. Multiple project support
 * 
 * Requirements: Wake Simulation Integration
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambdaClient = new LambdaClient({});

// Test configuration
const TEST_COORDINATES = {
  texas: { lat: 32.7767, lon: -96.7970, name: 'Dallas, TX' },
  kansas: { lat: 38.5767, lon: -97.6656, name: 'Salina, KS' },
  iowa: { lat: 42.0308, lon: -93.6319, name: 'Ames, IA' }
};

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
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
  console.log('\n' + '═'.repeat(70));
  log(title, 'bright');
  console.log('═'.repeat(70));
}

function logSubSection(title) {
  console.log('\n' + '─'.repeat(70));
  log(title, 'cyan');
  console.log('─'.repeat(70));
}

/**
 * Get orchestrator Lambda function name
 */
async function getOrchestratorFunctionName() {
  const { LambdaClient, ListFunctionsCommand } = require('@aws-sdk/client-lambda');
  const client = new LambdaClient({});
  
  try {
    // Paginate through all functions to find orchestrator
    let nextMarker = undefined;
    let orchestratorFunction = null;
    
    do {
      const response = await client.send(new ListFunctionsCommand({
        Marker: nextMarker,
        MaxItems: 50
      }));
      
      // Try multiple patterns to find orchestrator
      const patterns = [
        'orchestrator',  // Simplified pattern to match any orchestrator
        'renewableOrchestrator',
        'renewable-orchestrator',
        'RenewableOrchestrator'
      ];
      
      for (const pattern of patterns) {
        orchestratorFunction = response.Functions?.find(fn => 
          fn.FunctionName?.toLowerCase().includes(pattern.toLowerCase())
        );
        
        if (orchestratorFunction) {
          break;
        }
      }
      
      if (orchestratorFunction) {
        break;
      }
      
      nextMarker = response.NextMarker;
    } while (nextMarker);
    
    if (!orchestratorFunction) {
      throw new Error(
        `Orchestrator Lambda not found. Please ensure the sandbox is running with: npx ampx sandbox`
      );
    }
    
    return orchestratorFunction.FunctionName;
  } catch (error) {
    throw new Error(`Failed to find orchestrator Lambda: ${error.message}`);
  }
}

/**
 * Invoke orchestrator with query
 */
async function invokeOrchestrator(query, context = {}) {
  const functionName = await getOrchestratorFunctionName();
  
  const payload = {
    query,
    context,
    sessionId: `test-session-${Date.now()}`
  };
  
  log(`\n📤 Invoking orchestrator: ${functionName}`, 'blue');
  log(`   Query: "${query}"`, 'blue');
  
  const command = new InvokeCommand({
    FunctionName: functionName,
    Payload: JSON.stringify(payload)
  });
  
  const startTime = Date.now();
  const response = await lambdaClient.send(command);
  const duration = Date.now() - startTime;
  
  if (!response.Payload) {
    throw new Error('No payload in response');
  }
  
  const result = JSON.parse(new TextDecoder().decode(response.Payload));
  
  log(`✅ Response received in ${duration}ms`, 'green');
  
  return result;
}

/**
 * Test 1: Wake simulation query routing
 */
async function testWakeSimulationRouting() {
  logSection('TEST 1: Wake Simulation Query Routing');
  
  const testQueries = [
    'run wake simulation for project WindFarm-Alpha',
    'analyze wake effects for my wind farm',
    'show me wake analysis results',
    'calculate wake losses for the layout',
    'wake simulation for turbine layout'
  ];
  
  let passCount = 0;
  let failCount = 0;
  
  for (const query of testQueries) {
    try {
      logSubSection(`Testing: "${query}"`);
      
      const result = await invokeOrchestrator(query);
      
      // Check if intent was detected correctly
      const metadata = result.metadata || {};
      const toolsUsed = metadata.toolsUsed || [];
      
      log(`   Tools used: ${toolsUsed.join(', ')}`, 'cyan');
      log(`   Success: ${result.success}`, result.success ? 'green' : 'red');
      log(`   Artifacts: ${result.artifacts?.length || 0}`, 'cyan');
      
      // Verify wake_simulation was detected
      if (toolsUsed.includes('wake_simulation') || toolsUsed.includes('wake_analysis')) {
        log('   ✅ Wake simulation intent detected correctly', 'green');
        passCount++;
      } else {
        log(`   ❌ Expected wake_simulation, got: ${toolsUsed.join(', ')}`, 'red');
        failCount++;
      }
      
    } catch (error) {
      log(`   ❌ Error: ${error.message}`, 'red');
      failCount++;
    }
  }
  
  log(`\n📊 Routing Test Results: ${passCount} passed, ${failCount} failed`, 
    failCount === 0 ? 'green' : 'yellow');
  
  return { passCount, failCount };
}

/**
 * Test 2: Wake simulation with project context
 */
async function testWakeSimulationWithProject() {
  logSection('TEST 2: Wake Simulation with Project Context');
  
  const projectName = `test-wake-project-${Date.now()}`;
  
  try {
    // Step 1: Create terrain analysis first
    logSubSection('Step 1: Creating terrain analysis');
    
    const terrainQuery = `analyze terrain at ${TEST_COORDINATES.texas.lat}, ${TEST_COORDINATES.texas.lon}`;
    const terrainResult = await invokeOrchestrator(terrainQuery);
    
    if (!terrainResult.success) {
      throw new Error('Terrain analysis failed');
    }
    
    log('   ✅ Terrain analysis completed', 'green');
    
    // Step 2: Create layout optimization
    logSubSection('Step 2: Creating layout optimization');
    
    const layoutQuery = `optimize turbine layout for project ${projectName}`;
    const layoutResult = await invokeOrchestrator(layoutQuery, {
      projectName,
      coordinates: {
        latitude: TEST_COORDINATES.texas.lat,
        longitude: TEST_COORDINATES.texas.lon
      }
    });
    
    if (!layoutResult.success) {
      throw new Error('Layout optimization failed');
    }
    
    log('   ✅ Layout optimization completed', 'green');
    
    // Step 3: Run wake simulation
    logSubSection('Step 3: Running wake simulation');
    
    const wakeQuery = `run wake simulation for project ${projectName}`;
    const wakeResult = await invokeOrchestrator(wakeQuery, {
      projectName
    });
    
    log(`   Success: ${wakeResult.success}`, wakeResult.success ? 'green' : 'red');
    log(`   Message: ${wakeResult.message}`, 'cyan');
    log(`   Artifacts: ${wakeResult.artifacts?.length || 0}`, 'cyan');
    
    if (wakeResult.artifacts && wakeResult.artifacts.length > 0) {
      const wakeArtifact = wakeResult.artifacts[0];
      log(`   Artifact type: ${wakeArtifact.type}`, 'cyan');
      
      // Verify artifact structure
      const requiredFields = [
        'messageContentType',
        'projectId',
        'performanceMetrics',
        'turbineMetrics'
      ];
      
      const missingFields = requiredFields.filter(field => !wakeArtifact.data[field]);
      
      if (missingFields.length === 0) {
        log('   ✅ All required fields present in artifact', 'green');
        
        // Log key metrics
        const metrics = wakeArtifact.data.performanceMetrics;
        if (metrics) {
          log(`   📊 Performance Metrics:`, 'cyan');
          log(`      - AEP: ${metrics.netAEP || metrics.annualEnergyProduction || 'N/A'} GWh`, 'cyan');
          log(`      - Capacity Factor: ${(metrics.capacityFactor * 100).toFixed(1)}%`, 'cyan');
          log(`      - Wake Losses: ${(metrics.wakeLosses * 100).toFixed(1)}%`, 'cyan');
        }
        
        return { success: true, projectName };
      } else {
        log(`   ❌ Missing fields: ${missingFields.join(', ')}`, 'red');
        return { success: false, error: 'Missing required fields' };
      }
    } else {
      log('   ❌ No artifacts returned', 'red');
      return { success: false, error: 'No artifacts' };
    }
    
  } catch (error) {
    log(`   ❌ Error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

/**
 * Test 3: Wake data structure validation
 */
async function testWakeDataStructure() {
  logSection('TEST 3: Wake Data Structure Validation');
  
  const query = `run wake simulation at ${TEST_COORDINATES.kansas.lat}, ${TEST_COORDINATES.kansas.lon}`;
  
  try {
    const result = await invokeOrchestrator(query);
    
    if (!result.success || !result.artifacts || result.artifacts.length === 0) {
      throw new Error('No wake simulation artifact returned');
    }
    
    const artifact = result.artifacts[0];
    
    logSubSection('Validating Artifact Structure');
    
    // Expected structure
    const expectedStructure = {
      type: 'wake_simulation',
      data: {
        messageContentType: 'wake_simulation',
        projectId: 'string',
        performanceMetrics: {
          netAEP: 'number',
          capacityFactor: 'number',
          wakeLosses: 'number'
        },
        turbineMetrics: {
          count: 'number',
          totalCapacity: 'number'
        }
      }
    };
    
    // Validate type
    if (artifact.type === 'wake_simulation') {
      log('   ✅ Artifact type: wake_simulation', 'green');
    } else {
      log(`   ❌ Expected type 'wake_simulation', got '${artifact.type}'`, 'red');
      return { success: false };
    }
    
    // Validate data structure
    const data = artifact.data;
    const checks = [
      { field: 'messageContentType', expected: 'wake_simulation', actual: data.messageContentType },
      { field: 'projectId', expected: 'string', actual: typeof data.projectId },
      { field: 'performanceMetrics', expected: 'object', actual: typeof data.performanceMetrics },
      { field: 'turbineMetrics', expected: 'object', actual: typeof data.turbineMetrics }
    ];
    
    let allValid = true;
    
    for (const check of checks) {
      if (check.field === 'messageContentType') {
        if (check.actual === check.expected) {
          log(`   ✅ ${check.field}: ${check.actual}`, 'green');
        } else {
          log(`   ❌ ${check.field}: expected '${check.expected}', got '${check.actual}'`, 'red');
          allValid = false;
        }
      } else {
        if (check.actual === check.expected) {
          log(`   ✅ ${check.field}: ${check.actual}`, 'green');
        } else {
          log(`   ❌ ${check.field}: expected ${check.expected}, got ${check.actual}`, 'red');
          allValid = false;
        }
      }
    }
    
    // Validate performance metrics
    if (data.performanceMetrics) {
      logSubSection('Performance Metrics Validation');
      
      const metricsChecks = [
        { field: 'capacityFactor', type: 'number' },
        { field: 'wakeLosses', type: 'number' }
      ];
      
      for (const check of metricsChecks) {
        const value = data.performanceMetrics[check.field];
        if (typeof value === check.type) {
          log(`   ✅ ${check.field}: ${value}`, 'green');
        } else {
          log(`   ❌ ${check.field}: expected ${check.type}, got ${typeof value}`, 'red');
          allValid = false;
        }
      }
    }
    
    // Validate turbine metrics
    if (data.turbineMetrics) {
      logSubSection('Turbine Metrics Validation');
      
      const turbineChecks = [
        { field: 'count', type: 'number' },
        { field: 'totalCapacity', type: 'number' }
      ];
      
      for (const check of turbineChecks) {
        const value = data.turbineMetrics[check.field];
        if (typeof value === check.type) {
          log(`   ✅ ${check.field}: ${value}`, 'green');
        } else {
          log(`   ❌ ${check.field}: expected ${check.type}, got ${typeof value}`, 'red');
          allValid = false;
        }
      }
    }
    
    return { success: allValid };
    
  } catch (error) {
    log(`   ❌ Error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

/**
 * Test 4: Multiple projects support
 */
async function testMultipleProjects() {
  logSection('TEST 4: Multiple Projects Support');
  
  const projects = [
    { name: `wake-test-1-${Date.now()}`, coords: TEST_COORDINATES.texas },
    { name: `wake-test-2-${Date.now()}`, coords: TEST_COORDINATES.kansas },
    { name: `wake-test-3-${Date.now()}`, coords: TEST_COORDINATES.iowa }
  ];
  
  const results = [];
  
  for (const project of projects) {
    try {
      logSubSection(`Testing project: ${project.name} (${project.coords.name})`);
      
      const query = `run wake simulation at ${project.coords.lat}, ${project.coords.lon} for project ${project.name}`;
      const result = await invokeOrchestrator(query);
      
      const success = result.success && result.artifacts && result.artifacts.length > 0;
      
      log(`   Success: ${success}`, success ? 'green' : 'red');
      
      if (success) {
        const artifact = result.artifacts[0];
        log(`   Project ID: ${artifact.data.projectId}`, 'cyan');
        log(`   Turbines: ${artifact.data.turbineMetrics?.count || 'N/A'}`, 'cyan');
        log(`   AEP: ${artifact.data.performanceMetrics?.netAEP || 'N/A'} GWh`, 'cyan');
      }
      
      results.push({ project: project.name, success });
      
    } catch (error) {
      log(`   ❌ Error: ${error.message}`, 'red');
      results.push({ project: project.name, success: false, error: error.message });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  log(`\n📊 Multiple Projects Test: ${successCount}/${projects.length} succeeded`, 
    failCount === 0 ? 'green' : 'yellow');
  
  return { successCount, failCount, total: projects.length };
}

/**
 * Test 5: UI artifact rendering compatibility
 */
async function testUICompatibility() {
  logSection('TEST 5: UI Artifact Rendering Compatibility');
  
  const query = `run wake simulation at ${TEST_COORDINATES.texas.lat}, ${TEST_COORDINATES.texas.lon}`;
  
  try {
    const result = await invokeOrchestrator(query);
    
    if (!result.success || !result.artifacts || result.artifacts.length === 0) {
      throw new Error('No artifact returned');
    }
    
    const artifact = result.artifacts[0];
    
    logSubSection('Checking UI Component Compatibility');
    
    // Check if artifact type matches what ChatMessage.tsx expects
    const expectedTypes = ['wake_simulation', 'wake_analysis'];
    
    if (expectedTypes.includes(artifact.type)) {
      log(`   ✅ Artifact type '${artifact.type}' is recognized by UI`, 'green');
    } else {
      log(`   ❌ Artifact type '${artifact.type}' not recognized by UI`, 'red');
      log(`      Expected one of: ${expectedTypes.join(', ')}`, 'yellow');
      return { success: false };
    }
    
    // Check required fields for WakeAnalysisArtifact component
    const requiredForUI = [
      'messageContentType',
      'title',
      'projectId',
      'performanceMetrics',
      'turbineMetrics'
    ];
    
    const missingForUI = requiredForUI.filter(field => !artifact.data[field]);
    
    if (missingForUI.length === 0) {
      log('   ✅ All required UI fields present', 'green');
    } else {
      log(`   ❌ Missing UI fields: ${missingForUI.join(', ')}`, 'red');
      return { success: false };
    }
    
    // Check optional but recommended fields
    const optionalFields = [
      'visualizations',
      'monthlyProduction',
      'windResourceData'
    ];
    
    logSubSection('Optional Fields (enhance UI experience)');
    
    for (const field of optionalFields) {
      if (artifact.data[field]) {
        log(`   ✅ ${field}: present`, 'green');
      } else {
        log(`   ⚠️  ${field}: not present (optional)`, 'yellow');
      }
    }
    
    // Verify JSON serializability (critical for frontend)
    try {
      const serialized = JSON.stringify(artifact);
      JSON.parse(serialized);
      log('   ✅ Artifact is JSON serializable', 'green');
    } catch (error) {
      log('   ❌ Artifact failed JSON serialization', 'red');
      return { success: false };
    }
    
    return { success: true };
    
  } catch (error) {
    log(`   ❌ Error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

/**
 * Main test execution
 */
async function runAllTests() {
  logSection('🧪 TASK 14: WAKE SIMULATION END-TO-END TESTS');
  
  log('\nTesting complete wake simulation workflow:', 'bright');
  log('  1. Query routing to wake_simulation intent', 'cyan');
  log('  2. Orchestrator invokes simulation Lambda', 'cyan');
  log('  3. Wake data returns correctly', 'cyan');
  log('  4. Artifact displays in UI', 'cyan');
  log('  5. Multiple project support', 'cyan');
  
  const results = {
    routing: null,
    projectContext: null,
    dataStructure: null,
    multipleProjects: null,
    uiCompatibility: null
  };
  
  try {
    // Test 1: Query routing
    results.routing = await testWakeSimulationRouting();
    
    // Test 2: Project context
    results.projectContext = await testWakeSimulationWithProject();
    
    // Test 3: Data structure
    results.dataStructure = await testWakeDataStructure();
    
    // Test 4: Multiple projects
    results.multipleProjects = await testMultipleProjects();
    
    // Test 5: UI compatibility
    results.uiCompatibility = await testUICompatibility();
    
  } catch (error) {
    log(`\n❌ Test execution failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
  
  // Summary
  logSection('📊 TEST SUMMARY');
  
  const testResults = [
    {
      name: 'Query Routing',
      passed: results.routing?.passCount || 0,
      failed: results.routing?.failCount || 0,
      success: (results.routing?.failCount || 0) === 0
    },
    {
      name: 'Project Context',
      success: results.projectContext?.success || false
    },
    {
      name: 'Data Structure',
      success: results.dataStructure?.success || false
    },
    {
      name: 'Multiple Projects',
      passed: results.multipleProjects?.successCount || 0,
      total: results.multipleProjects?.total || 0,
      success: (results.multipleProjects?.failCount || 0) === 0
    },
    {
      name: 'UI Compatibility',
      success: results.uiCompatibility?.success || false
    }
  ];
  
  let allPassed = true;
  
  for (const test of testResults) {
    const status = test.success ? '✅ PASS' : '❌ FAIL';
    const color = test.success ? 'green' : 'red';
    
    if (test.passed !== undefined) {
      log(`${status} - ${test.name}: ${test.passed}/${test.total || test.passed + test.failed} passed`, color);
    } else {
      log(`${status} - ${test.name}`, color);
    }
    
    if (!test.success) {
      allPassed = false;
    }
  }
  
  console.log('\n' + '═'.repeat(70));
  
  if (allPassed) {
    log('🎉 ALL TESTS PASSED', 'green');
    log('\n✅ Task 14 Complete: Wake simulation workflow verified', 'green');
    log('   - Orchestrator routes wake queries correctly', 'green');
    log('   - Simulation Lambda returns valid data', 'green');
    log('   - Artifacts are properly formatted', 'green');
    log('   - UI components can render artifacts', 'green');
    log('   - Multiple projects are supported', 'green');
  } else {
    log('⚠️  SOME TESTS FAILED', 'yellow');
    log('\nPlease review failed tests and fix issues before proceeding.', 'yellow');
  }
  
  console.log('═'.repeat(70) + '\n');
  
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
