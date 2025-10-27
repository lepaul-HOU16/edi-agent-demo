#!/usr/bin/env node

/**
 * Task 16: Backend Deployment Verification
 * Tests terrain, layout, and simulation tool Lambdas individually
 */

const { LambdaClient, InvokeCommand, GetFunctionConfigurationCommand } = require('@aws-sdk/client-lambda');

const lambda = new LambdaClient({ region: 'us-east-1' });

// Test coordinates (West Texas wind farm location)
const TEST_COORDINATES = {
  latitude: 35.067482,
  longitude: -101.395466,
  radius_km: 5
};

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

async function verifyEnvironmentVariables(functionName) {
  log(`\n📋 Verifying environment variables for ${functionName}...`, 'cyan');
  
  try {
    const command = new GetFunctionConfigurationCommand({
      FunctionName: functionName
    });
    
    const response = await lambda.send(command);
    const envVars = response.Environment?.Variables || {};
    
    log(`✅ Environment variables retrieved:`, 'green');
    Object.entries(envVars).forEach(([key, value]) => {
      if (key.includes('BUCKET') || key.includes('REGION')) {
        log(`   ${key}: ${value}`, 'blue');
      }
    });
    
    return envVars;
  } catch (error) {
    log(`❌ Failed to get environment variables: ${error.message}`, 'red');
    throw error;
  }
}

async function testTerrainTool() {
  log('\n' + '='.repeat(80), 'cyan');
  log('TEST 1: TERRAIN TOOL LAMBDA', 'cyan');
  log('='.repeat(80), 'cyan');
  
  const functionName = 'amplify-digitalassistant--RenewableTerrainToolFBBF-T9MqkWlRCCpJ';
  
  // Verify environment variables
  await verifyEnvironmentVariables(functionName);
  
  const payload = {
    latitude: TEST_COORDINATES.latitude,
    longitude: TEST_COORDINATES.longitude,
    radius_km: TEST_COORDINATES.radius_km,
    project_id: 'test-terrain-task16',
    capacity_target_mw: 100
  };
  
  log(`\n🚀 Invoking terrain tool with payload:`, 'yellow');
  log(JSON.stringify(payload, null, 2), 'blue');
  
  try {
    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(payload)
    });
    
    const startTime = Date.now();
    const response = await lambda.send(command);
    const duration = Date.now() - startTime;
    
    const result = JSON.parse(Buffer.from(response.Payload).toString());
    
    log(`\n⏱️  Execution time: ${duration}ms`, 'cyan');
    log(`📊 Status Code: ${response.StatusCode}`, 'cyan');
    
    if (response.FunctionError) {
      log(`❌ Function Error: ${response.FunctionError}`, 'red');
      log(JSON.stringify(result, null, 2), 'red');
      return false;
    }
    
    // Verify response structure
    const checks = [
      { name: 'Has success field', pass: 'success' in result },
      { name: 'Success is true', pass: result.success === true },
      { name: 'Has data field', pass: 'data' in result },
      { name: 'Has geojson', pass: result.data?.geojson !== undefined },
      { name: 'Has features array', pass: Array.isArray(result.data?.geojson?.features) },
      { name: 'Has perimeter feature', pass: result.data?.geojson?.features?.some(f => f.properties?.type === 'perimeter') },
      { name: 'Feature count > 0', pass: (result.data?.geojson?.features?.length || 0) > 0 }
    ];
    
    log('\n✅ Response validation:', 'green');
    checks.forEach(check => {
      const icon = check.pass ? '✅' : '❌';
      const color = check.pass ? 'green' : 'red';
      log(`   ${icon} ${check.name}`, color);
    });
    
    if (result.data?.geojson?.features) {
      log(`\n📍 Feature summary:`, 'cyan');
      log(`   Total features: ${result.data.geojson.features.length}`, 'blue');
      
      const featureTypes = {};
      result.data.geojson.features.forEach(f => {
        const type = f.properties?.type || 'unknown';
        featureTypes[type] = (featureTypes[type] || 0) + 1;
      });
      
      Object.entries(featureTypes).forEach(([type, count]) => {
        log(`   ${type}: ${count}`, 'blue');
      });
    }
    
    const allPassed = checks.every(c => c.pass);
    if (allPassed) {
      log('\n✅ TERRAIN TOOL TEST PASSED', 'green');
    } else {
      log('\n❌ TERRAIN TOOL TEST FAILED', 'red');
    }
    
    return allPassed;
    
  } catch (error) {
    log(`\n❌ Terrain tool invocation failed: ${error.message}`, 'red');
    console.error(error);
    return false;
  }
}

async function testLayoutTool() {
  log('\n' + '='.repeat(80), 'cyan');
  log('TEST 2: LAYOUT TOOL LAMBDA', 'cyan');
  log('='.repeat(80), 'cyan');
  
  const functionName = 'amplify-digitalassistant--RenewableLayoutTool14B26-KSWfrukjyOvG';
  
  // Verify environment variables
  await verifyEnvironmentVariables(functionName);
  
  // First, we need terrain results to pass to layout
  // For testing, we'll create a minimal terrain context
  const payload = {
    latitude: TEST_COORDINATES.latitude,
    longitude: TEST_COORDINATES.longitude,
    capacity_target_mw: 100,
    turbine_capacity_mw: 2.5,
    project_id: 'test-layout-task16',
    context: {
      terrain_results: {
        geojson: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: { type: 'Polygon', coordinates: [[[-101.4, 35.07], [-101.39, 35.07], [-101.39, 35.06], [-101.4, 35.06], [-101.4, 35.07]]] },
              properties: { type: 'perimeter', name: 'Site Perimeter' }
            }
          ]
        }
      }
    }
  };
  
  log(`\n🚀 Invoking layout tool with payload:`, 'yellow');
  log(JSON.stringify(payload, null, 2), 'blue');
  
  try {
    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(payload)
    });
    
    const startTime = Date.now();
    const response = await lambda.send(command);
    const duration = Date.now() - startTime;
    
    const result = JSON.parse(Buffer.from(response.Payload).toString());
    
    log(`\n⏱️  Execution time: ${duration}ms`, 'cyan');
    log(`📊 Status Code: ${response.StatusCode}`, 'cyan');
    
    if (response.FunctionError) {
      log(`❌ Function Error: ${response.FunctionError}`, 'red');
      log(JSON.stringify(result, null, 2), 'red');
      return false;
    }
    
    // Verify response structure
    const checks = [
      { name: 'Has success field', pass: 'success' in result },
      { name: 'Success is true', pass: result.success === true },
      { name: 'Has data field', pass: 'data' in result },
      { name: 'Has geojson', pass: result.data?.geojson !== undefined },
      { name: 'Has features array', pass: Array.isArray(result.data?.geojson?.features) },
      { name: 'Has turbine features', pass: result.data?.geojson?.features?.some(f => f.properties?.type === 'turbine') },
      { name: 'Has terrain features', pass: result.data?.geojson?.features?.some(f => f.properties?.type === 'perimeter') },
      { name: 'Turbines have properties', pass: result.data?.geojson?.features?.filter(f => f.properties?.type === 'turbine').every(f => f.properties?.turbine_id && f.properties?.capacity_MW) }
    ];
    
    log('\n✅ Response validation:', 'green');
    checks.forEach(check => {
      const icon = check.pass ? '✅' : '❌';
      const color = check.pass ? 'green' : 'red';
      log(`   ${icon} ${check.name}`, color);
    });
    
    if (result.data?.geojson?.features) {
      log(`\n📍 Feature summary:`, 'cyan');
      log(`   Total features: ${result.data.geojson.features.length}`, 'blue');
      
      const turbines = result.data.geojson.features.filter(f => f.properties?.type === 'turbine');
      const terrain = result.data.geojson.features.filter(f => f.properties?.type !== 'turbine');
      
      log(`   Turbines: ${turbines.length}`, 'blue');
      log(`   Terrain features: ${terrain.length}`, 'blue');
      
      if (turbines.length > 0) {
        log(`\n   Sample turbine properties:`, 'blue');
        const sample = turbines[0].properties;
        log(`     ID: ${sample.turbine_id}`, 'blue');
        log(`     Capacity: ${sample.capacity_MW} MW`, 'blue');
        log(`     Hub Height: ${sample.hub_height_m} m`, 'blue');
        log(`     Rotor Diameter: ${sample.rotor_diameter_m} m`, 'blue');
      }
    }
    
    const allPassed = checks.every(c => c.pass);
    if (allPassed) {
      log('\n✅ LAYOUT TOOL TEST PASSED', 'green');
    } else {
      log('\n❌ LAYOUT TOOL TEST FAILED', 'red');
    }
    
    return allPassed;
    
  } catch (error) {
    log(`\n❌ Layout tool invocation failed: ${error.message}`, 'red');
    console.error(error);
    return false;
  }
}

async function testSimulationTool() {
  log('\n' + '='.repeat(80), 'cyan');
  log('TEST 3: SIMULATION TOOL LAMBDA', 'cyan');
  log('='.repeat(80), 'cyan');
  
  const functionName = 'amplify-digitalassistant--RenewableSimulationToolF-xvLTjnDdGvWI';
  
  // Verify environment variables
  await verifyEnvironmentVariables(functionName);
  
  // Create minimal layout context for simulation
  const payload = {
    project_id: 'test-simulation-task16',
    context: {
      layout_results: {
        turbine_positions: [
          { lat: 35.067482, lng: -101.395466, x: 0, y: 0 },
          { lat: 35.068, lng: -101.394, x: 500, y: 500 },
          { lat: 35.066, lng: -101.396, x: -500, y: -500 }
        ],
        turbine_capacity_mw: 2.5,
        hub_height_m: 80,
        rotor_diameter_m: 100
      },
      wind_data: {
        wind_speed_ms: 8.5,
        wind_direction_deg: 270,
        air_density: 1.225
      }
    }
  };
  
  log(`\n🚀 Invoking simulation tool with payload:`, 'yellow');
  log(JSON.stringify(payload, null, 2), 'blue');
  
  try {
    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(payload)
    });
    
    const startTime = Date.now();
    const response = await lambda.send(command);
    const duration = Date.now() - startTime;
    
    const result = JSON.parse(Buffer.from(response.Payload).toString());
    
    log(`\n⏱️  Execution time: ${duration}ms`, 'cyan');
    log(`📊 Status Code: ${response.StatusCode}`, 'cyan');
    
    if (response.FunctionError) {
      log(`❌ Function Error: ${response.FunctionError}`, 'red');
      log(JSON.stringify(result, null, 2), 'red');
      return false;
    }
    
    // Verify response structure
    const checks = [
      { name: 'Has success field', pass: 'success' in result },
      { name: 'Success is true', pass: result.success === true },
      { name: 'Has data field', pass: 'data' in result },
      { name: 'Has visualizations', pass: result.data?.visualizations !== undefined },
      { name: 'Has wake_heat_map URL', pass: typeof result.data?.visualizations?.wake_heat_map === 'string' },
      { name: 'Wake heat map URL is S3', pass: result.data?.visualizations?.wake_heat_map?.includes('s3') || result.data?.visualizations?.wake_heat_map?.includes('amazonaws.com') },
      { name: 'Has wake analysis data', pass: result.data?.wake_analysis !== undefined }
    ];
    
    log('\n✅ Response validation:', 'green');
    checks.forEach(check => {
      const icon = check.pass ? '✅' : '❌';
      const color = check.pass ? 'green' : 'red';
      log(`   ${icon} ${check.name}`, color);
    });
    
    if (result.data?.visualizations) {
      log(`\n📊 Visualization URLs:`, 'cyan');
      Object.entries(result.data.visualizations).forEach(([key, url]) => {
        log(`   ${key}: ${url?.substring(0, 80)}...`, 'blue');
      });
    }
    
    if (result.data?.wake_analysis) {
      log(`\n📈 Wake analysis summary:`, 'cyan');
      log(`   Total energy loss: ${result.data.wake_analysis.total_energy_loss_percent?.toFixed(2)}%`, 'blue');
      log(`   Average wake deficit: ${result.data.wake_analysis.average_wake_deficit?.toFixed(2)}%`, 'blue');
    }
    
    const allPassed = checks.every(c => c.pass);
    if (allPassed) {
      log('\n✅ SIMULATION TOOL TEST PASSED', 'green');
    } else {
      log('\n❌ SIMULATION TOOL TEST FAILED', 'red');
    }
    
    return allPassed;
    
  } catch (error) {
    log(`\n❌ Simulation tool invocation failed: ${error.message}`, 'red');
    console.error(error);
    return false;
  }
}

async function main() {
  log('\n' + '='.repeat(80), 'cyan');
  log('TASK 16: BACKEND DEPLOYMENT VERIFICATION', 'cyan');
  log('Testing terrain, layout, and simulation tool Lambdas', 'cyan');
  log('='.repeat(80), 'cyan');
  
  const results = {
    terrain: false,
    layout: false,
    simulation: false
  };
  
  try {
    // Test each Lambda individually
    results.terrain = await testTerrainTool();
    results.layout = await testLayoutTool();
    results.simulation = await testSimulationTool();
    
    // Summary
    log('\n' + '='.repeat(80), 'cyan');
    log('DEPLOYMENT VERIFICATION SUMMARY', 'cyan');
    log('='.repeat(80), 'cyan');
    
    const terrainIcon = results.terrain ? '✅' : '❌';
    const layoutIcon = results.layout ? '✅' : '❌';
    const simulationIcon = results.simulation ? '✅' : '❌';
    
    log(`${terrainIcon} Terrain Tool: ${results.terrain ? 'PASSED' : 'FAILED'}`, results.terrain ? 'green' : 'red');
    log(`${layoutIcon} Layout Tool: ${results.layout ? 'PASSED' : 'FAILED'}`, results.layout ? 'green' : 'red');
    log(`${simulationIcon} Simulation Tool: ${results.simulation ? 'PASSED' : 'FAILED'}`, results.simulation ? 'green' : 'red');
    
    const allPassed = Object.values(results).every(r => r);
    
    if (allPassed) {
      log('\n✅ ALL BACKEND LAMBDAS DEPLOYED AND WORKING', 'green');
      log('✅ Task 16 Complete: Backend deployment verified', 'green');
      process.exit(0);
    } else {
      log('\n❌ SOME BACKEND LAMBDAS FAILED', 'red');
      log('❌ Task 16 Incomplete: Fix failing Lambdas', 'red');
      process.exit(1);
    }
    
  } catch (error) {
    log(`\n❌ Test execution failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

main();
