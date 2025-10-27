#!/usr/bin/env node

/**
 * End-to-End Renewable Workflow Test
 * 
 * Tests the complete renewable energy workflow from terrain analysis through
 * to report generation, verifying all UI elements, action buttons, and data flow.
 * 
 * Test Coverage:
 * - Terrain → Layout → Wake → Report workflow
 * - Perimeter visualization on terrain map
 * - Terrain features on layout map
 * - Turbines on layout map
 * - Wake heat map in iframe
 * - Action buttons at each step
 * - Dashboard accessibility at each step
 * - Financial analysis intent detection
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get AWS region from AWS CLI config if not set
let awsRegion = process.env.AWS_REGION;
if (!awsRegion) {
  try {
    awsRegion = execSync('aws configure get region', { encoding: 'utf-8' }).trim();
  } catch (error) {
    awsRegion = 'us-east-1';
  }
}

// Configure AWS SDK
AWS.config.update({ region: awsRegion });
const lambda = new AWS.Lambda();

console.log(`Using AWS Region: ${awsRegion}`);

// Test configuration
const TEST_LOCATION = {
  latitude: 35.067482,
  longitude: -101.395466,
  radius_km: 5
};

const TEST_QUERIES = {
  terrain: `Analyze terrain for wind farm at ${TEST_LOCATION.latitude}, ${TEST_LOCATION.longitude}`,
  layout: 'optimize turbine layout',
  wake: 'run wake simulation',
  report: 'generate comprehensive executive report',
  financial: 'perform financial analysis and ROI calculation',
  dashboard: 'show project dashboard'
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

/**
 * Log test result
 */
function logResult(test, status, message, details = null) {
  const result = {
    test,
    status,
    message,
    details,
    timestamp: new Date().toISOString()
  };
  
  testResults.details.push(result);
  
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${test}: ${message}`);
  
  if (details) {
    console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
  }
  
  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') testResults.failed++;
  else testResults.warnings++;
}

/**
 * Get orchestrator Lambda function name
 */
async function getOrchestratorFunctionName() {
  try {
    // Get all functions with pagination
    let allFunctions = [];
    let marker = null;
    
    do {
      const params = marker ? { Marker: marker } : {};
      const response = await lambda.listFunctions(params).promise();
      allFunctions = allFunctions.concat(response.Functions);
      marker = response.NextMarker;
    } while (marker);
    
    console.log(`Total Lambda functions found: ${allFunctions.length}`);
    
    // Try multiple patterns to find the orchestrator
    const patterns = [
      'renewableOrchestrator',
      'renewableOrchestratorlam',
      'RenewableOrchestrator',
      'Orchestrator'
    ];
    
    let orchestrator = null;
    for (const pattern of patterns) {
      orchestrator = allFunctions.find(f => 
        f.FunctionName.toLowerCase().includes(pattern.toLowerCase())
      );
      if (orchestrator) {
        console.log(`Found orchestrator using pattern: ${pattern}`);
        break;
      }
    }
    
    if (!orchestrator) {
      console.error('\nAvailable renewable-related Lambda functions:');
      allFunctions
        .filter(f => f.FunctionName.toLowerCase().includes('renewable'))
        .forEach(f => console.error(`  - ${f.FunctionName}`));
      throw new Error('Renewable orchestrator Lambda not found');
    }
    
    return orchestrator.FunctionName;
  } catch (error) {
    throw new Error(`Failed to find orchestrator: ${error.message}`);
  }
}

/**
 * Invoke orchestrator with query
 */
async function invokeOrchestrator(functionName, query, context = {}) {
  const payload = {
    query,
    chatSessionId: 'test-e2e-workflow',
    userId: 'test-user',
    context
  };
  
  console.log(`\n🔄 Invoking orchestrator with query: "${query}"`);
  
  try {
    const response = await lambda.invoke({
      FunctionName: functionName,
      Payload: JSON.stringify(payload)
    }).promise();
    
    const result = JSON.parse(response.Payload);
    
    if (result.errorMessage) {
      throw new Error(result.errorMessage);
    }
    
    return result;
  } catch (error) {
    throw new Error(`Orchestrator invocation failed: ${error.message}`);
  }
}

/**
 * Validate terrain analysis artifact
 */
function validateTerrainArtifact(artifact) {
  const tests = [];
  
  // Check artifact type
  if (artifact.type === 'wind_farm_terrain_analysis') {
    tests.push({ name: 'Terrain artifact type', pass: true });
  } else {
    tests.push({ name: 'Terrain artifact type', pass: false, actual: artifact.type });
  }
  
  // Check GeoJSON exists
  if (artifact.data?.geojson) {
    tests.push({ name: 'GeoJSON present', pass: true });
  } else {
    tests.push({ name: 'GeoJSON present', pass: false });
  }
  
  // Check for perimeter feature
  const features = artifact.data?.geojson?.features || [];
  const perimeterFeature = features.find(f => f.properties?.type === 'perimeter');
  
  if (perimeterFeature) {
    tests.push({ name: 'Perimeter feature present', pass: true });
    
    // Validate perimeter properties
    if (perimeterFeature.geometry?.type === 'Polygon') {
      tests.push({ name: 'Perimeter is Polygon', pass: true });
    } else {
      tests.push({ name: 'Perimeter is Polygon', pass: false, actual: perimeterFeature.geometry?.type });
    }
    
    if (perimeterFeature.properties?.radius_km) {
      tests.push({ name: 'Perimeter has radius', pass: true });
    } else {
      tests.push({ name: 'Perimeter has radius', pass: false });
    }
    
    if (perimeterFeature.properties?.area_km2) {
      tests.push({ name: 'Perimeter has area', pass: true });
    } else {
      tests.push({ name: 'Perimeter has area', pass: false });
    }
  } else {
    tests.push({ name: 'Perimeter feature present', pass: false });
  }
  
  // Check for terrain features (buildings, roads, water)
  const terrainFeatures = features.filter(f => 
    ['building', 'road', 'water'].includes(f.properties?.type)
  );
  
  if (terrainFeatures.length > 0) {
    tests.push({ name: 'Terrain features present', pass: true, count: terrainFeatures.length });
  } else {
    tests.push({ name: 'Terrain features present', pass: false });
  }
  
  // Check action buttons
  if (artifact.actions && artifact.actions.length > 0) {
    tests.push({ name: 'Action buttons present', pass: true, count: artifact.actions.length });
    
    // Check for "Optimize Turbine Layout" button
    const layoutButton = artifact.actions.find(a => 
      a.label.toLowerCase().includes('optimize') && a.label.toLowerCase().includes('layout')
    );
    
    if (layoutButton) {
      tests.push({ name: '"Optimize Layout" button present', pass: true });
      
      if (layoutButton.primary) {
        tests.push({ name: '"Optimize Layout" is primary', pass: true });
      } else {
        tests.push({ name: '"Optimize Layout" is primary', pass: false });
      }
    } else {
      tests.push({ name: '"Optimize Layout" button present', pass: false });
    }
    
    // Check for "View Project Dashboard" button
    const dashboardButton = artifact.actions.find(a => 
      a.label.toLowerCase().includes('dashboard')
    );
    
    if (dashboardButton) {
      tests.push({ name: '"View Dashboard" button present', pass: true });
    } else {
      tests.push({ name: '"View Dashboard" button present', pass: false });
    }
  } else {
    tests.push({ name: 'Action buttons present', pass: false });
  }
  
  // Check title and subtitle
  if (artifact.data?.title) {
    tests.push({ name: 'Title present', pass: true });
  } else {
    tests.push({ name: 'Title present', pass: false });
  }
  
  if (artifact.data?.subtitle) {
    tests.push({ name: 'Subtitle present', pass: true });
  } else {
    tests.push({ name: 'Subtitle present', pass: false });
  }
  
  return tests;
}

/**
 * Validate layout optimization artifact
 */
function validateLayoutArtifact(artifact) {
  const tests = [];
  
  // Check artifact type
  if (artifact.type === 'wind_farm_layout') {
    tests.push({ name: 'Layout artifact type', pass: true });
  } else {
    tests.push({ name: 'Layout artifact type', pass: false, actual: artifact.type });
  }
  
  // Check GeoJSON exists
  if (artifact.data?.geojson) {
    tests.push({ name: 'GeoJSON present', pass: true });
  } else {
    tests.push({ name: 'GeoJSON present', pass: false });
  }
  
  const features = artifact.data?.geojson?.features || [];
  
  // Check for terrain features (should be merged from terrain analysis)
  const terrainFeatures = features.filter(f => 
    ['building', 'road', 'water', 'perimeter'].includes(f.properties?.type)
  );
  
  if (terrainFeatures.length > 0) {
    tests.push({ name: 'Terrain features in layout', pass: true, count: terrainFeatures.length });
  } else {
    tests.push({ name: 'Terrain features in layout', pass: false });
  }
  
  // Check for turbine features
  const turbineFeatures = features.filter(f => f.properties?.type === 'turbine');
  
  if (turbineFeatures.length > 0) {
    tests.push({ name: 'Turbine features present', pass: true, count: turbineFeatures.length });
    
    // Validate turbine properties
    const firstTurbine = turbineFeatures[0];
    
    if (firstTurbine.geometry?.type === 'Point') {
      tests.push({ name: 'Turbines are Points', pass: true });
    } else {
      tests.push({ name: 'Turbines are Points', pass: false, actual: firstTurbine.geometry?.type });
    }
    
    if (firstTurbine.properties?.turbine_id) {
      tests.push({ name: 'Turbines have IDs', pass: true });
    } else {
      tests.push({ name: 'Turbines have IDs', pass: false });
    }
    
    if (firstTurbine.properties?.capacity_MW) {
      tests.push({ name: 'Turbines have capacity', pass: true });
    } else {
      tests.push({ name: 'Turbines have capacity', pass: false });
    }
    
    if (firstTurbine.properties?.hub_height_m) {
      tests.push({ name: 'Turbines have hub height', pass: true });
    } else {
      tests.push({ name: 'Turbines have hub height', pass: false });
    }
    
    if (firstTurbine.properties?.rotor_diameter_m) {
      tests.push({ name: 'Turbines have rotor diameter', pass: true });
    } else {
      tests.push({ name: 'Turbines have rotor diameter', pass: false });
    }
  } else {
    tests.push({ name: 'Turbine features present', pass: false });
  }
  
  // Check action buttons
  if (artifact.actions && artifact.actions.length > 0) {
    tests.push({ name: 'Action buttons present', pass: true, count: artifact.actions.length });
    
    // Check for "Run Wake Simulation" button
    const wakeButton = artifact.actions.find(a => 
      a.label.toLowerCase().includes('wake') && a.label.toLowerCase().includes('simulation')
    );
    
    if (wakeButton) {
      tests.push({ name: '"Run Wake Simulation" button present', pass: true });
      
      if (wakeButton.primary) {
        tests.push({ name: '"Run Wake Simulation" is primary', pass: true });
      } else {
        tests.push({ name: '"Run Wake Simulation" is primary', pass: false });
      }
    } else {
      tests.push({ name: '"Run Wake Simulation" button present', pass: false });
    }
    
    // Check for "View Project Dashboard" button
    const dashboardButton = artifact.actions.find(a => 
      a.label.toLowerCase().includes('dashboard')
    );
    
    if (dashboardButton) {
      tests.push({ name: '"View Dashboard" button present', pass: true });
    } else {
      tests.push({ name: '"View Dashboard" button present', pass: false });
    }
  } else {
    tests.push({ name: 'Action buttons present', pass: false });
  }
  
  return tests;
}

/**
 * Validate wake simulation artifact
 */
function validateWakeArtifact(artifact) {
  const tests = [];
  
  // Check artifact type
  if (artifact.type === 'wake_simulation') {
    tests.push({ name: 'Wake artifact type', pass: true });
  } else {
    tests.push({ name: 'Wake artifact type', pass: false, actual: artifact.type });
  }
  
  // Check visualizations object
  if (artifact.data?.visualizations) {
    tests.push({ name: 'Visualizations object present', pass: true });
    
    // Check for wake heat map URL
    if (artifact.data.visualizations.wake_heat_map) {
      tests.push({ name: 'Wake heat map URL present', pass: true });
      
      // Validate URL format
      const url = artifact.data.visualizations.wake_heat_map;
      if (url.startsWith('http') && url.includes('wake_heat_map.html')) {
        tests.push({ name: 'Wake heat map URL valid', pass: true });
      } else {
        tests.push({ name: 'Wake heat map URL valid', pass: false, url });
      }
    } else {
      tests.push({ name: 'Wake heat map URL present', pass: false });
    }
    
    // Check for other visualizations
    if (artifact.data.visualizations.wake_analysis) {
      tests.push({ name: 'Wake analysis chart present', pass: true });
    } else {
      tests.push({ name: 'Wake analysis chart present', pass: false });
    }
  } else {
    tests.push({ name: 'Visualizations object present', pass: false });
  }
  
  // Check action buttons
  if (artifact.actions && artifact.actions.length > 0) {
    tests.push({ name: 'Action buttons present', pass: true, count: artifact.actions.length });
    
    // Check for "Generate Report" button
    const reportButton = artifact.actions.find(a => 
      a.label.toLowerCase().includes('report')
    );
    
    if (reportButton) {
      tests.push({ name: '"Generate Report" button present', pass: true });
      
      if (reportButton.primary) {
        tests.push({ name: '"Generate Report" is primary', pass: true });
      } else {
        tests.push({ name: '"Generate Report" is primary', pass: false });
      }
    } else {
      tests.push({ name: '"Generate Report" button present', pass: false });
    }
    
    // Check for "Financial Analysis" button
    const financialButton = artifact.actions.find(a => 
      a.label.toLowerCase().includes('financial')
    );
    
    if (financialButton) {
      tests.push({ name: '"Financial Analysis" button present', pass: true });
    } else {
      tests.push({ name: '"Financial Analysis" button present', pass: false });
    }
    
    // Check for "View Project Dashboard" button
    const dashboardButton = artifact.actions.find(a => 
      a.label.toLowerCase().includes('dashboard')
    );
    
    if (dashboardButton) {
      tests.push({ name: '"View Dashboard" button present', pass: true });
    } else {
      tests.push({ name: '"View Dashboard" button present', pass: false });
    }
  } else {
    tests.push({ name: 'Action buttons present', pass: false });
  }
  
  return tests;
}

/**
 * Validate report generation artifact
 */
function validateReportArtifact(artifact) {
  const tests = [];
  
  // Check artifact type
  if (artifact.type === 'report_generation' || artifact.type === 'financial_analysis') {
    tests.push({ name: 'Report artifact type', pass: true });
  } else {
    tests.push({ name: 'Report artifact type', pass: false, actual: artifact.type });
  }
  
  // Check action buttons
  if (artifact.actions && artifact.actions.length > 0) {
    tests.push({ name: 'Action buttons present', pass: true, count: artifact.actions.length });
    
    // Check for "View Dashboard" button
    const dashboardButton = artifact.actions.find(a => 
      a.label.toLowerCase().includes('dashboard')
    );
    
    if (dashboardButton) {
      tests.push({ name: '"View Dashboard" button present', pass: true });
    } else {
      tests.push({ name: '"View Dashboard" button present', pass: false });
    }
  } else {
    tests.push({ name: 'Action buttons present', pass: false });
  }
  
  return tests;
}

/**
 * Validate financial analysis intent detection
 */
function validateFinancialIntent(result) {
  const tests = [];
  
  // Check that financial query doesn't generate terrain artifact
  const artifacts = result.artifacts || [];
  const hasTerrainArtifact = artifacts.some(a => a.type === 'wind_farm_terrain_analysis');
  
  if (!hasTerrainArtifact) {
    tests.push({ name: 'Financial query does not generate terrain', pass: true });
  } else {
    tests.push({ name: 'Financial query does not generate terrain', pass: false });
  }
  
  // Check for report or financial artifact
  const hasReportArtifact = artifacts.some(a => 
    a.type === 'report_generation' || a.type === 'financial_analysis'
  );
  
  if (hasReportArtifact) {
    tests.push({ name: 'Financial query generates report', pass: true });
  } else {
    tests.push({ name: 'Financial query generates report', pass: false });
  }
  
  return tests;
}

/**
 * Run complete workflow test
 */
async function runWorkflowTest() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  End-to-End Renewable Workflow Test');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  try {
    // Get orchestrator function name
    console.log('🔍 Finding orchestrator Lambda...');
    const functionName = await getOrchestratorFunctionName();
    console.log(`✅ Found: ${functionName}\n`);
    
    let projectContext = {};
    
    // ========================================================================
    // STEP 1: Terrain Analysis
    // ========================================================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  STEP 1: Terrain Analysis');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const terrainResult = await invokeOrchestrator(functionName, TEST_QUERIES.terrain, projectContext);
    
    if (terrainResult.artifacts && terrainResult.artifacts.length > 0) {
      const terrainArtifact = terrainResult.artifacts[0];
      const terrainTests = validateTerrainArtifact(terrainArtifact);
      
      terrainTests.forEach(test => {
        if (test.pass) {
          logResult(`Terrain: ${test.name}`, 'PASS', 'Validated', test.count ? { count: test.count } : null);
        } else {
          logResult(`Terrain: ${test.name}`, 'FAIL', 'Validation failed', test.actual ? { actual: test.actual } : null);
        }
      });
      
      // Update context for next step
      if (terrainResult.projectName) {
        projectContext.projectName = terrainResult.projectName;
        projectContext.terrain_results = terrainArtifact.data;
      }
    } else {
      logResult('Terrain Analysis', 'FAIL', 'No artifacts returned');
    }
    
    // ========================================================================
    // STEP 2: Layout Optimization
    // ========================================================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  STEP 2: Layout Optimization');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const layoutResult = await invokeOrchestrator(functionName, TEST_QUERIES.layout, projectContext);
    
    if (layoutResult.artifacts && layoutResult.artifacts.length > 0) {
      const layoutArtifact = layoutResult.artifacts[0];
      const layoutTests = validateLayoutArtifact(layoutArtifact);
      
      layoutTests.forEach(test => {
        if (test.pass) {
          logResult(`Layout: ${test.name}`, 'PASS', 'Validated', test.count ? { count: test.count } : null);
        } else {
          logResult(`Layout: ${test.name}`, 'FAIL', 'Validation failed', test.actual ? { actual: test.actual } : null);
        }
      });
      
      // Update context for next step
      if (layoutResult.projectName) {
        projectContext.projectName = layoutResult.projectName;
        projectContext.layout_results = layoutArtifact.data;
      }
    } else {
      logResult('Layout Optimization', 'FAIL', 'No artifacts returned');
    }
    
    // ========================================================================
    // STEP 3: Wake Simulation
    // ========================================================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  STEP 3: Wake Simulation');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const wakeResult = await invokeOrchestrator(functionName, TEST_QUERIES.wake, projectContext);
    
    if (wakeResult.artifacts && wakeResult.artifacts.length > 0) {
      const wakeArtifact = wakeResult.artifacts[0];
      const wakeTests = validateWakeArtifact(wakeArtifact);
      
      wakeTests.forEach(test => {
        if (test.pass) {
          logResult(`Wake: ${test.name}`, 'PASS', 'Validated', test.count ? { count: test.count } : null);
        } else {
          logResult(`Wake: ${test.name}`, 'FAIL', 'Validation failed', test.actual ? { actual: test.actual } : null);
        }
      });
      
      // Update context for next step
      if (wakeResult.projectName) {
        projectContext.projectName = wakeResult.projectName;
        projectContext.simulation_results = wakeArtifact.data;
      }
    } else {
      logResult('Wake Simulation', 'FAIL', 'No artifacts returned');
    }
    
    // ========================================================================
    // STEP 4: Report Generation
    // ========================================================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  STEP 4: Report Generation');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const reportResult = await invokeOrchestrator(functionName, TEST_QUERIES.report, projectContext);
    
    if (reportResult.artifacts && reportResult.artifacts.length > 0) {
      const reportArtifact = reportResult.artifacts[0];
      const reportTests = validateReportArtifact(reportArtifact);
      
      reportTests.forEach(test => {
        if (test.pass) {
          logResult(`Report: ${test.name}`, 'PASS', 'Validated', test.count ? { count: test.count } : null);
        } else {
          logResult(`Report: ${test.name}`, 'FAIL', 'Validation failed', test.actual ? { actual: test.actual } : null);
        }
      });
    } else {
      logResult('Report Generation', 'FAIL', 'No artifacts returned');
    }
    
    // ========================================================================
    // STEP 5: Financial Analysis Intent Detection
    // ========================================================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  STEP 5: Financial Analysis Intent Detection');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const financialResult = await invokeOrchestrator(functionName, TEST_QUERIES.financial, projectContext);
    
    const financialTests = validateFinancialIntent(financialResult);
    
    financialTests.forEach(test => {
      if (test.pass) {
        logResult(`Financial: ${test.name}`, 'PASS', 'Validated');
      } else {
        logResult(`Financial: ${test.name}`, 'FAIL', 'Validation failed');
      }
    });
    
    // ========================================================================
    // STEP 6: Dashboard Accessibility
    // ========================================================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  STEP 6: Dashboard Accessibility');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const dashboardResult = await invokeOrchestrator(functionName, TEST_QUERIES.dashboard, projectContext);
    
    if (dashboardResult.artifacts && dashboardResult.artifacts.length > 0) {
      logResult('Dashboard', 'PASS', 'Dashboard accessible at any workflow step');
    } else {
      logResult('Dashboard', 'FAIL', 'Dashboard not accessible');
    }
    
  } catch (error) {
    logResult('Workflow Test', 'FAIL', `Test execution failed: ${error.message}`);
    console.error('\n❌ Error:', error);
  }
}

/**
 * Print test summary
 */
function printSummary() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Test Summary');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log(`✅ Passed:   ${testResults.passed}`);
  console.log(`❌ Failed:   ${testResults.failed}`);
  console.log(`⚠️  Warnings: ${testResults.warnings}`);
  console.log(`📊 Total:    ${testResults.passed + testResults.failed + testResults.warnings}\n`);
  
  const successRate = ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1);
  console.log(`Success Rate: ${successRate}%\n`);
  
  if (testResults.failed > 0) {
    console.log('❌ FAILED TESTS:');
    testResults.details
      .filter(r => r.status === 'FAIL')
      .forEach(r => {
        console.log(`   - ${r.test}: ${r.message}`);
        if (r.details) {
          console.log(`     ${JSON.stringify(r.details)}`);
        }
      });
    console.log('');
  }
  
  // Save detailed results
  const resultsFile = path.join(__dirname, 'e2e-workflow-test-results.json');
  fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
  console.log(`📄 Detailed results saved to: ${resultsFile}\n`);
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run the test
runWorkflowTest()
  .then(printSummary)
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
