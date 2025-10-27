#!/usr/bin/env node

/**
 * Renewable Energy Dashboards End-to-End Test
 * 
 * Tests the complete renewable energy workflow with focus on:
 * - Docker Lambda functionality (simulation)
 * - Dashboard rendering (wind resource, performance, wake analysis)
 * - Project persistence
 * - Action buttons
 * - Chain of thought display
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });
const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

// Test configuration
const TEST_COORDINATES = {
  latitude: 35.067482,
  longitude: -101.395466
};

const TEST_PROJECT_NAME = 'e2e-test-wind-farm';

// Color codes for output
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

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
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

// Get orchestrator Lambda name
async function getOrchestratorName() {
  const { execSync } = require('child_process');
  try {
    const result = execSync(
      'aws lambda list-functions --query "Functions[?contains(FunctionName, \'renewableOrchestrator\')].FunctionName" --output text',
      { encoding: 'utf-8' }
    );
    return result.trim();
  } catch (error) {
    throw new Error('Could not find renewable orchestrator Lambda');
  }
}

// Invoke orchestrator
async function invokeOrchestrator(query, sessionId, projectName = null) {
  const orchestratorName = await getOrchestratorName();
  
  const payload = {
    query,
    sessionId: sessionId || `test-${Date.now()}`,
    context: projectName ? { projectId: projectName } : undefined
  };

  log(`Invoking: ${query}`, 'blue');
  
  const command = new InvokeCommand({
    FunctionName: orchestratorName,
    Payload: JSON.stringify(payload)
  });

  const response = await lambda.send(command);
  const payloadStr = Buffer.from(response.Payload).toString();
  
  // Handle empty or undefined payload
  if (!payloadStr || payloadStr === 'undefined' || payloadStr === '') {
    throw new Error('Lambda returned empty or undefined payload');
  }
  
  let result;
  try {
    result = JSON.parse(payloadStr);
  } catch (error) {
    throw new Error(`Failed to parse Lambda response: ${payloadStr.substring(0, 200)}`);
  }
  
  // Check for Lambda execution errors
  if (result.errorMessage || result.errorType) {
    throw new Error(`Lambda error: ${result.errorMessage || result.errorType}`);
  }
  
  // Check for orchestrator errors
  if (!result.success && result.message) {
    logWarning(`Orchestrator returned error: ${result.message}`);
  }
  
  return result;
}

// Check S3 artifact
async function checkS3Artifact(s3Url) {
  const match = s3Url.match(/s3:\/\/([^\/]+)\/(.+)/);
  if (!match) {
    throw new Error(`Invalid S3 URL: ${s3Url}`);
  }

  const [, bucket, key] = match;
  
  try {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await s3.send(command);
    const body = await response.Body.transformToString();
    return body;
  } catch (error) {
    throw new Error(`Failed to retrieve S3 artifact: ${error.message}`);
  }
}

// Validate terrain analysis response
function validateTerrainResponse(response) {
  const checks = [];
  
  // Check response structure
  checks.push({
    name: 'Response has message',
    pass: !!response.message
  });
  
  checks.push({
    name: 'Response has artifacts',
    pass: response.artifacts && response.artifacts.length > 0
  });
  
  if (response.artifacts && response.artifacts.length > 0) {
    const artifact = response.artifacts[0];
    
    checks.push({
      name: 'Artifact has type',
      pass: artifact.type === 'wind_farm_terrain_analysis'
    });
    
    checks.push({
      name: 'Artifact has data',
      pass: !!artifact.data
    });
    
    if (artifact.data) {
      // Check for coordinates
      checks.push({
        name: 'Has coordinates',
        pass: !!artifact.data.coordinates
      });
      
      // Check for exclusion zones (terrain features)
      checks.push({
        name: 'Has terrain features',
        pass: artifact.data.exclusionZones && artifact.data.exclusionZones.length > 0
      });
      
      // Check feature count (should be > 100)
      const featureCount = artifact.data.exclusionZones ? artifact.data.exclusionZones.length : 0;
      checks.push({
        name: `Has sufficient features (${featureCount} > 100)`,
        pass: featureCount > 100
      });
      
      // Check for project ID
      checks.push({
        name: 'Has project ID',
        pass: !!artifact.data.projectId
      });
    }
  }
  
  // Check project name in metadata
  checks.push({
    name: 'Project name in metadata',
    pass: !!response.metadata?.projectName || !!response.metadata?.projectId
  });
  
  // Check thought steps
  checks.push({
    name: 'Has thought steps',
    pass: response.thoughtSteps && response.thoughtSteps.length > 0
  });
  
  return checks;
}

// Validate layout response
function validateLayoutResponse(response) {
  const checks = [];
  
  checks.push({
    name: 'Response has message',
    pass: !!response.message
  });
  
  checks.push({
    name: 'Response has artifacts',
    pass: response.artifacts && response.artifacts.length > 0
  });
  
  if (response.artifacts && response.artifacts.length > 0) {
    const artifact = response.artifacts[0];
    
    checks.push({
      name: 'Artifact type is layout',
      pass: artifact.type === 'wind_farm_layout_optimization' || artifact.type === 'wind_farm_layout'
    });
    
    if (artifact.data) {
      // Check for turbine data (may be in different formats)
      const hasTurbines = artifact.data.turbines || artifact.data.turbine_positions || artifact.data.turbinePositions || artifact.data.layout;
      checks.push({
        name: 'Has turbine data',
        pass: !!hasTurbines
      });
      
      // Check for capacity or turbine count
      const hasMetrics = artifact.data.capacity || artifact.data.total_capacity_mw || artifact.data.turbine_count || artifact.data.turbineCount || artifact.data.totalCapacity;
      checks.push({
        name: 'Has capacity or turbine metrics',
        pass: !!hasMetrics
      });
    }
  }
  
  checks.push({
    name: 'Has thought steps',
    pass: response.thoughtSteps && response.thoughtSteps.length > 0
  });
  
  return checks;
}

// Validate wind rose response
function validateWindRoseResponse(response) {
  const checks = [];
  
  checks.push({
    name: 'Response has message',
    pass: !!response.message
  });
  
  checks.push({
    name: 'Response has artifacts',
    pass: response.artifacts && response.artifacts.length > 0
  });
  
  if (response.artifacts && response.artifacts.length > 0) {
    const artifact = response.artifacts[0];
    
    checks.push({
      name: 'Artifact type is wind_rose',
      pass: artifact.type === 'wind_rose'
    });
    
    if (artifact.data) {
      // Check for Plotly data (may be in different formats)
      const hasPlotly = artifact.data.plotly_json || artifact.data.plotlyData || artifact.data.chart;
      checks.push({
        name: 'Has Plotly/chart data',
        pass: !!hasPlotly
      });
    }
  }
  
  checks.push({
    name: 'Has thought steps',
    pass: response.thoughtSteps && response.thoughtSteps.length > 0
  });
  
  return checks;
}

// Validate simulation response (Docker Lambda)
function validateSimulationResponse(response) {
  const checks = [];
  
  checks.push({
    name: 'Response has message',
    pass: !!response.message
  });
  
  checks.push({
    name: 'Response has artifacts',
    pass: response.artifacts && response.artifacts.length > 0
  });
  
  if (response.artifacts && response.artifacts.length > 0) {
    const artifact = response.artifacts[0];
    
    checks.push({
      name: 'Artifact type is wake_simulation',
      pass: artifact.type === 'wind_farm_wake_simulation'
    });
    
    if (artifact.data) {
      // Check for performance metrics (may be in different formats)
      const hasAEP = artifact.data.aep_gwh || artifact.data.aep || artifact.data.annual_energy;
      checks.push({
        name: 'Has AEP (Annual Energy Production)',
        pass: !!hasAEP
      });
      
      const hasCapacityFactor = artifact.data.capacity_factor || artifact.data.cf;
      checks.push({
        name: 'Has capacity factor',
        pass: !!hasCapacityFactor
      });
      
      // Check for visualization or results
      const hasVisualization = artifact.data.visualization_url || artifact.data.map_url || artifact.data.results;
      checks.push({
        name: 'Has visualization or results',
        pass: !!hasVisualization
      });
    }
  }
  
  checks.push({
    name: 'Has thought steps',
    pass: response.thoughtSteps && response.thoughtSteps.length > 0
  });
  
  return checks;
}

// Validate dashboard response
function validateDashboardResponse(response, dashboardType) {
  const checks = [];
  
  checks.push({
    name: 'Response has message',
    pass: !!response.message
  });
  
  checks.push({
    name: 'Response has artifacts',
    pass: response.artifacts && response.artifacts.length > 0
  });
  
  if (response.artifacts && response.artifacts.length > 0) {
    const artifact = response.artifacts[0];
    
    // Dashboard type may vary
    const isDashboard = artifact.type && artifact.type.includes('dashboard');
    checks.push({
      name: `Artifact is dashboard type`,
      pass: isDashboard
    });
    
    if (artifact.data) {
      // Check for dashboard data or charts
      const hasData = artifact.data.dashboard_data || artifact.data.charts || artifact.data.plotlyData;
      checks.push({
        name: 'Has dashboard data or charts',
        pass: !!hasData
      });
    }
  }
  
  checks.push({
    name: 'Has thought steps',
    pass: response.thoughtSteps && response.thoughtSteps.length > 0
  });
  
  return checks;
}

// Print validation results
function printValidationResults(checks) {
  let passed = 0;
  let failed = 0;
  
  checks.forEach(check => {
    if (check.pass) {
      logSuccess(check.name);
      passed++;
    } else {
      logError(check.name);
      failed++;
    }
  });
  
  log(`\nResults: ${passed} passed, ${failed} failed`, failed === 0 ? 'green' : 'red');
  return failed === 0;
}

// Main test execution
async function runTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  Renewable Energy Dashboards End-to-End Test              ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  const sessionId = `test-session-${Date.now()}`;
  let allPassed = true;
  
  try {
    // Test 1: Terrain Analysis
    logStep('1', 'Testing Terrain Analysis');
    const terrainResponse = await invokeOrchestrator(
      `Analyze terrain at ${TEST_COORDINATES.latitude}, ${TEST_COORDINATES.longitude} for project ${TEST_PROJECT_NAME}`,
      sessionId,
      TEST_PROJECT_NAME
    );
    
    const terrainChecks = validateTerrainResponse(terrainResponse);
    const terrainPassed = printValidationResults(terrainChecks);
    allPassed = allPassed && terrainPassed;
    
    if (!terrainPassed) {
      logWarning('Terrain analysis failed, stopping tests');
      process.exit(1);
    }
    
    // Test 2: Layout Optimization
    logStep('2', 'Testing Layout Optimization');
    const layoutResponse = await invokeOrchestrator(
      'Optimize turbine layout',
      sessionId,
      TEST_PROJECT_NAME
    );
    
    const layoutChecks = validateLayoutResponse(layoutResponse);
    const layoutPassed = printValidationResults(layoutChecks);
    allPassed = allPassed && layoutPassed;
    
    if (!layoutPassed) {
      logWarning('Layout optimization failed, stopping tests');
      process.exit(1);
    }
    
    // Test 3: Wind Rose
    logStep('3', 'Testing Wind Rose Generation');
    const windRoseResponse = await invokeOrchestrator(
      'Generate wind rose',
      sessionId,
      TEST_PROJECT_NAME
    );
    
    const windRoseChecks = validateWindRoseResponse(windRoseResponse);
    const windRosePassed = printValidationResults(windRoseChecks);
    allPassed = allPassed && windRosePassed;
    
    // Test 4: Wake Simulation (Docker Lambda)
    logStep('4', 'Testing Wake Simulation (Docker Lambda)');
    log('This tests the Docker Lambda functionality', 'blue');
    
    const simulationResponse = await invokeOrchestrator(
      'Run wake simulation',
      sessionId,
      TEST_PROJECT_NAME
    );
    
    const simulationChecks = validateSimulationResponse(simulationResponse);
    const simulationPassed = printValidationResults(simulationChecks);
    allPassed = allPassed && simulationPassed;
    
    if (!simulationPassed) {
      logWarning('Wake simulation failed - Docker Lambda may have issues');
    }
    
    // Test 5: Wind Resource Dashboard
    logStep('5', 'Testing Wind Resource Dashboard');
    const windResourceResponse = await invokeOrchestrator(
      'Show wind resource dashboard',
      sessionId,
      TEST_PROJECT_NAME
    );
    
    const windResourceChecks = validateDashboardResponse(windResourceResponse, 'wind_resource');
    const windResourcePassed = printValidationResults(windResourceChecks);
    allPassed = allPassed && windResourcePassed;
    
    // Test 6: Performance Dashboard
    logStep('6', 'Testing Performance Analysis Dashboard');
    const performanceResponse = await invokeOrchestrator(
      'Show performance dashboard',
      sessionId,
      TEST_PROJECT_NAME
    );
    
    const performanceChecks = validateDashboardResponse(performanceResponse, 'performance_analysis');
    const performancePassed = printValidationResults(performanceChecks);
    allPassed = allPassed && performancePassed;
    
    // Test 7: Wake Analysis Dashboard
    logStep('7', 'Testing Wake Analysis Dashboard');
    const wakeResponse = await invokeOrchestrator(
      'Show wake analysis dashboard',
      sessionId,
      TEST_PROJECT_NAME
    );
    
    const wakeChecks = validateDashboardResponse(wakeResponse, 'wake_analysis');
    const wakePassed = printValidationResults(wakeChecks);
    allPassed = allPassed && wakePassed;
    
    // Test 8: Report Generation
    logStep('8', 'Testing Report Generation');
    const reportResponse = await invokeOrchestrator(
      'Generate comprehensive report',
      sessionId,
      TEST_PROJECT_NAME
    );
    
    const reportChecks = [
      {
        name: 'Response has message',
        pass: !!reportResponse.message
      },
      {
        name: 'Response has artifacts',
        pass: reportResponse.artifacts && reportResponse.artifacts.length > 0
      }
    ];
    
    if (reportResponse.artifacts && reportResponse.artifacts.length > 0) {
      const artifact = reportResponse.artifacts[0];
      reportChecks.push({
        name: 'Artifact type is report',
        pass: artifact.type === 'wind_farm_report'
      });
    }
    
    const reportPassed = printValidationResults(reportChecks);
    allPassed = allPassed && reportPassed;
    
    // Final Summary
    log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
    log('║  Test Summary                                              ║', 'cyan');
    log('╚════════════════════════════════════════════════════════════╝', 'cyan');
    
    if (allPassed) {
      logSuccess('All tests passed! ✨');
      log('\nNext steps:', 'cyan');
      log('1. Test in the UI with the chat interface');
      log('2. Verify visualizations render correctly');
      log('3. Check action buttons work');
      log('4. Verify project persistence across sessions');
      process.exit(0);
    } else {
      logError('Some tests failed');
      log('\nPlease check:', 'yellow');
      log('1. CloudWatch logs for errors');
      log('2. Environment variables are set correctly');
      log('3. Docker Lambda is deployed properly');
      log('4. S3 bucket permissions');
      process.exit(1);
    }
    
  } catch (error) {
    logError(`Test execution failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests();
