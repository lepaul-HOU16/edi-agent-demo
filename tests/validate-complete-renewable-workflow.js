#!/usr/bin/env node

/**
 * Complete Renewable Workflow Validation
 * Tests the entire workflow: terrain → layout → simulation → windrose → dashboard
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambda = new LambdaClient({ region: 'us-east-1' });

// Test configuration
const TEST_LOCATION = {
  latitude: 35.067482,
  longitude: -101.395466,
  radius_km: 5
};

const ORCHESTRATOR_FUNCTION = 'amplify-digitalassistant--renewableOrchestratorlam-JnyCeSEimNhE';

// Color output
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

async function invokeLambda(functionName, payload) {
  const command = new InvokeCommand({
    FunctionName: functionName,
    Payload: JSON.stringify(payload)
  });
  
  const response = await lambda.send(command);
  const result = JSON.parse(Buffer.from(response.Payload).toString());
  return result;
}

async function testTerrainAnalysis() {
  log('\n=== Step 1: Terrain Analysis ===', 'cyan');
  
  const payload = {
    query: `Analyze terrain at coordinates ${TEST_LOCATION.latitude}, ${TEST_LOCATION.longitude} with ${TEST_LOCATION.radius_km}km radius`,
    projectId: 'test-workflow-' + Date.now(),
    sessionId: 'test-session-' + Date.now()
  };
  
  try {
    const result = await invokeLambda(ORCHESTRATOR_FUNCTION, payload);
    
    // Check if result has success field directly (not wrapped in statusCode/body)
    if (result.success) {
      // Check for artifacts
      if (result.artifacts && result.artifacts.length > 0) {
        log('✅ Terrain analysis completed successfully', 'green');
        log(`   - Generated ${result.artifacts.length} artifact(s)`, 'green');
        
        // Check for terrain features
        const terrainArtifact = result.artifacts.find(a => a.type === 'wind_farm_terrain_analysis');
        if (terrainArtifact) {
          log('✅ Terrain artifact found', 'green');
          
          // Check for OSM features
          if (terrainArtifact.data && terrainArtifact.data.features) {
            log(`   - OSM features: ${terrainArtifact.data.features.length}`, 'green');
          }
          
          // Check for perimeter
          if (terrainArtifact.data && terrainArtifact.data.perimeter) {
            log('✅ Perimeter polygon present', 'green');
          }
        }
        
        // Get project ID from metadata
        const projectId = result.metadata?.projectId || payload.projectId;
        return { success: true, projectId, sessionId: payload.sessionId };
      } else {
        log('❌ No artifacts generated', 'red');
        return { success: false };
      }
    } else {
      log(`❌ Terrain analysis failed: ${result.message || 'Unknown error'}`, 'red');
      return { success: false };
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return { success: false };
  }
}

async function testLayoutOptimization(projectId, sessionId) {
  log('\n=== Step 2: Layout Optimization ===', 'cyan');
  
  const payload = {
    query: `Optimize turbine layout at coordinates ${TEST_LOCATION.latitude}, ${TEST_LOCATION.longitude}`,
    projectId,
    sessionId
  };
  
  try {
    const result = await invokeLambda(ORCHESTRATOR_FUNCTION, payload);
    
    if (result.success) {
      if (result.artifacts && result.artifacts.length > 0) {
        log('✅ Layout optimization completed successfully', 'green');
        log(`   - Generated ${result.artifacts.length} artifact(s)`, 'green');
        
        const layoutArtifact = result.artifacts.find(a => a.type === 'wind_farm_layout');
        if (layoutArtifact) {
          log('✅ Layout artifact found', 'green');
          
          // Check for turbines
          if (layoutArtifact.data && layoutArtifact.data.turbines) {
            log(`   - Turbines placed: ${layoutArtifact.data.turbines.length}`, 'green');
          }
          
          // Check for algorithm metadata
          if (layoutArtifact.data && layoutArtifact.data.algorithm) {
            log(`   - Algorithm used: ${layoutArtifact.data.algorithm}`, 'green');
          }
          
          // Check for S3 key
          if (layoutArtifact.data && layoutArtifact.data.s3_key) {
            log('✅ Layout saved to S3', 'green');
          }
        }
        
        return { success: true };
      } else {
        log('❌ No artifacts generated', 'red');
        return { success: false };
      }
    } else {
      log(`❌ Layout optimization failed: ${result.message || 'Unknown error'}`, 'red');
      return { success: false };
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return { success: false };
  }
}

async function testWakeSimulation(projectId, sessionId) {
  log('\n=== Step 3: Wake Simulation ===', 'cyan');
  
  const payload = {
    query: `Run wake simulation at coordinates ${TEST_LOCATION.latitude}, ${TEST_LOCATION.longitude}`,
    projectId,
    sessionId
  };
  
  try {
    const result = await invokeLambda(ORCHESTRATOR_FUNCTION, payload);
    
    if (result.success) {
      if (result.artifacts && result.artifacts.length > 0) {
        log('✅ Wake simulation completed successfully', 'green');
        log(`   - Generated ${result.artifacts.length} artifact(s)`, 'green');
        
        const wakeArtifact = result.artifacts.find(a => a.type === 'wake_analysis');
        if (wakeArtifact) {
          log('✅ Wake analysis artifact found', 'green');
          
          // Check for AEP
          if (wakeArtifact.data && wakeArtifact.data.aep_gwh) {
            log(`   - AEP: ${wakeArtifact.data.aep_gwh} GWh`, 'green');
          }
          
          // Check for capacity factor
          if (wakeArtifact.data && wakeArtifact.data.capacity_factor) {
            log(`   - Capacity Factor: ${(wakeArtifact.data.capacity_factor * 100).toFixed(1)}%`, 'green');
          }
        }
        
        return { success: true };
      } else {
        log('❌ No artifacts generated', 'red');
        return { success: false };
      }
    } else {
      log(`❌ Wake simulation failed: ${result.message || 'Unknown error'}`, 'red');
      log(`   Response: ${JSON.stringify(result, null, 2)}`, 'yellow');
      return { success: false };
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return { success: false };
  }
}

async function testWindRose(projectId, sessionId) {
  log('\n=== Step 4: Wind Rose Generation ===', 'cyan');
  
  const payload = {
    query: `Generate wind rose at coordinates ${TEST_LOCATION.latitude}, ${TEST_LOCATION.longitude}`,
    projectId,
    sessionId
  };
  
  try {
    const result = await invokeLambda(ORCHESTRATOR_FUNCTION, payload);
    
    if (result.success) {
      if (result.artifacts && result.artifacts.length > 0) {
        log('✅ Wind rose generated successfully', 'green');
        log(`   - Generated ${result.artifacts.length} artifact(s)`, 'green');
        
        const windRoseArtifact = result.artifacts.find(a => a.type === 'wind_rose');
        if (windRoseArtifact) {
          log('✅ Wind rose artifact found', 'green');
        }
        
        return { success: true };
      } else {
        log('❌ No artifacts generated', 'red');
        return { success: false };
      }
    } else {
      log(`❌ Wind rose generation failed: ${result.message || 'Unknown error'}`, 'red');
      return { success: false };
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return { success: false };
  }
}

async function testDashboard(projectId, sessionId) {
  log('\n=== Step 5: Dashboard Access ===', 'cyan');
  
  const payload = {
    query: 'Show project dashboard',
    projectId,
    sessionId
  };
  
  try {
    const result = await invokeLambda(ORCHESTRATOR_FUNCTION, payload);
    
    if (result.success) {
      if (result.artifacts && result.artifacts.length > 0) {
        log('✅ Dashboard generated successfully', 'green');
        log(`   - Generated ${result.artifacts.length} artifact(s)`, 'green');
        
        return { success: true };
      } else {
        log('❌ No artifacts generated', 'red');
        return { success: false };
      }
    } else {
      log(`❌ Dashboard generation failed: ${result.message || 'Unknown error'}`, 'red');
      return { success: false };
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return { success: false };
  }
}

async function runCompleteWorkflow() {
  log('╔════════════════════════════════════════════════════════════╗', 'blue');
  log('║   Complete Renewable Workflow Validation                  ║', 'blue');
  log('╚════════════════════════════════════════════════════════════╝', 'blue');
  
  const results = {
    terrain: false,
    layout: false,
    simulation: false,
    windrose: false,
    dashboard: false
  };
  
  // Step 1: Terrain Analysis
  const terrainResult = await testTerrainAnalysis();
  results.terrain = terrainResult.success;
  
  if (!terrainResult.success) {
    log('\n❌ Workflow stopped: Terrain analysis failed', 'red');
    return results;
  }
  
  // Step 2: Layout Optimization
  const layoutResult = await testLayoutOptimization(terrainResult.projectId, terrainResult.sessionId);
  results.layout = layoutResult.success;
  
  if (!layoutResult.success) {
    log('\n❌ Workflow stopped: Layout optimization failed', 'red');
    return results;
  }
  
  // Step 3: Wake Simulation
  const simulationResult = await testWakeSimulation(terrainResult.projectId, terrainResult.sessionId);
  results.simulation = simulationResult.success;
  
  if (!simulationResult.success) {
    log('\n⚠️  Wake simulation failed, continuing to test other features', 'yellow');
  }
  
  // Step 4: Wind Rose
  const windRoseResult = await testWindRose(terrainResult.projectId, terrainResult.sessionId);
  results.windrose = windRoseResult.success;
  
  // Step 5: Dashboard
  const dashboardResult = await testDashboard(terrainResult.projectId, terrainResult.sessionId);
  results.dashboard = dashboardResult.success;
  
  // Summary
  log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
  log('║   Workflow Validation Summary                              ║', 'blue');
  log('╚════════════════════════════════════════════════════════════╝', 'blue');
  
  log(`\nTerrain Analysis:      ${results.terrain ? '✅ PASS' : '❌ FAIL'}`, results.terrain ? 'green' : 'red');
  log(`Layout Optimization:   ${results.layout ? '✅ PASS' : '❌ FAIL'}`, results.layout ? 'green' : 'red');
  log(`Wake Simulation:       ${results.simulation ? '✅ PASS' : '❌ FAIL'}`, results.simulation ? 'green' : 'red');
  log(`Wind Rose:             ${results.windrose ? '✅ PASS' : '❌ FAIL'}`, results.windrose ? 'green' : 'red');
  log(`Dashboard:             ${results.dashboard ? '✅ PASS' : '❌ FAIL'}`, results.dashboard ? 'green' : 'red');
  
  const passCount = Object.values(results).filter(r => r).length;
  const totalCount = Object.keys(results).length;
  
  log(`\nOverall: ${passCount}/${totalCount} tests passed`, passCount === totalCount ? 'green' : 'yellow');
  
  return results;
}

// Run the workflow
runCompleteWorkflow()
  .then(results => {
    const allPassed = Object.values(results).every(r => r);
    process.exit(allPassed ? 0 : 1);
  })
  .catch(error => {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });
