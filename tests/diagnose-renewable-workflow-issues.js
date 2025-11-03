/**
 * Diagnostic Test for Renewable Workflow Issues
 * 
 * Tests the specific issues reported:
 * 1. No call-to-action buttons showing
 * 2. Perimeter not showing on terrain features
 * 3. Features not showing on layout map
 * 4. Layout map not showing turbines
 * 5. Wake heat map visualization not available
 * 6. 'Perform financial analysis' returns terrain analysis map
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Test coordinates
const TEST_COORDS = {
  latitude: 35.067482,
  longitude: -101.395466
};

async function invokeLambda(functionName, payload) {
  console.log(`\n🔧 Invoking ${functionName}...`);
  console.log(`📦 Payload: ${JSON.stringify(payload, null, 2)}`);
  
  try {
    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(payload)
    });
    
    const response = await lambdaClient.send(command);
    const result = JSON.parse(new TextDecoder().decode(response.Payload));
    
    // Parse body if it's a Lambda proxy response
    if (result.body) {
      return typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Error invoking ${functionName}:`, error.message);
    throw error;
  }
}

async function test1_TerrainAnalysisPerimeter() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('TEST 1: Terrain Analysis - Perimeter Feature');
  console.log('═══════════════════════════════════════════════════════════');
  
  const orchestratorName = process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME;
  if (!orchestratorName) {
    console.error('❌ RENEWABLE_ORCHESTRATOR_FUNCTION_NAME not set');
    return;
  }
  
  const result = await invokeLambda(orchestratorName, {
    query: `Analyze terrain at ${TEST_COORDS.latitude}, ${TEST_COORDS.longitude} with 5km radius`,
    sessionId: `test-${Date.now()}`,
    userId: 'test-user'
  });
  
  console.log('\n📊 RESULTS:');
  console.log(`✅ Success: ${result.success}`);
  console.log(`📝 Message: ${result.message}`);
  console.log(`📦 Artifacts: ${result.artifacts?.length || 0}`);
  
  if (result.artifacts && result.artifacts.length > 0) {
    const terrainArtifact = result.artifacts.find(a => a.type === 'wind_farm_terrain_analysis');
    
    if (terrainArtifact) {
      console.log('\n🗺️  TERRAIN ARTIFACT ANALYSIS:');
      console.log(`   Has GeoJSON: ${!!terrainArtifact.data.geojson}`);
      
      if (terrainArtifact.data.geojson) {
        const features = terrainArtifact.data.geojson.features || [];
        console.log(`   Total Features: ${features.length}`);
        
        // Count feature types
        const featureTypes = {};
        features.forEach(f => {
          const type = f.properties?.type || 'unknown';
          featureTypes[type] = (featureTypes[type] || 0) + 1;
        });
        
        console.log('   Feature Breakdown:');
        Object.entries(featureTypes).forEach(([type, count]) => {
          console.log(`      ${type}: ${count}`);
        });
        
        // Check for perimeter specifically
        const perimeterFeatures = features.filter(f => f.properties?.type === 'perimeter');
        console.log(`\n   ⚠️  PERIMETER FEATURES: ${perimeterFeatures.length}`);
        
        if (perimeterFeatures.length === 0) {
          console.log('   ❌ ISSUE CONFIRMED: No perimeter features in GeoJSON');
        } else {
          console.log('   ✅ Perimeter features present');
          console.log(`   Sample perimeter: ${JSON.stringify(perimeterFeatures[0], null, 2)}`);
        }
      }
      
      // Check for action buttons
      console.log(`\n   Has Actions: ${!!terrainArtifact.actions}`);
      if (terrainArtifact.actions) {
        console.log(`   Action Count: ${terrainArtifact.actions.length}`);
        terrainArtifact.actions.forEach((action, i) => {
          console.log(`      ${i + 1}. ${action.label} (${action.query})`);
        });
      } else {
        console.log('   ❌ ISSUE CONFIRMED: No action buttons in artifact');
      }
    }
  }
}

async function test2_LayoutOptimizationMap() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('TEST 2: Layout Optimization - Turbines and Features on Map');
  console.log('═══════════════════════════════════════════════════════════');
  
  const orchestratorName = process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME;
  if (!orchestratorName) {
    console.error('❌ RENEWABLE_ORCHESTRATOR_FUNCTION_NAME not set');
    return;
  }
  
  // First, do terrain analysis to create project
  console.log('Step 1: Creating project with terrain analysis...');
  const terrainResult = await invokeLambda(orchestratorName, {
    query: `Analyze terrain at ${TEST_COORDS.latitude}, ${TEST_COORDS.longitude} with 5km radius`,
    sessionId: `test-layout-${Date.now()}`,
    userId: 'test-user'
  });
  
  const projectId = terrainResult.metadata?.projectId || terrainResult.metadata?.projectName;
  console.log(`   Project ID: ${projectId}`);
  
  // Now do layout optimization
  console.log('\nStep 2: Running layout optimization...');
  const layoutResult = await invokeLambda(orchestratorName, {
    query: 'optimize turbine layout',
    sessionId: `test-layout-${Date.now()}`,
    userId: 'test-user',
    context: {
      projectId: projectId
    }
  });
  
  console.log('\n📊 LAYOUT RESULTS:');
  console.log(`✅ Success: ${layoutResult.success}`);
  console.log(`📝 Message: ${layoutResult.message}`);
  console.log(`📦 Artifacts: ${layoutResult.artifacts?.length || 0}`);
  
  if (layoutResult.artifacts && layoutResult.artifacts.length > 0) {
    const layoutArtifact = layoutResult.artifacts.find(a => a.type === 'wind_farm_layout');
    
    if (layoutArtifact) {
      console.log('\n🗺️  LAYOUT ARTIFACT ANALYSIS:');
      console.log(`   Has GeoJSON: ${!!layoutArtifact.data.geojson}`);
      console.log(`   Turbine Count: ${layoutArtifact.data.turbineCount}`);
      console.log(`   Has Turbine Positions: ${!!layoutArtifact.data.turbinePositions}`);
      
      if (layoutArtifact.data.geojson) {
        const features = layoutArtifact.data.geojson.features || [];
        console.log(`   Total Features in GeoJSON: ${features.length}`);
        
        // Count feature types
        const featureTypes = {};
        features.forEach(f => {
          const type = f.properties?.type || 'unknown';
          featureTypes[type] = (featureTypes[type] || 0) + 1;
        });
        
        console.log('   Feature Breakdown:');
        Object.entries(featureTypes).forEach(([type, count]) => {
          console.log(`      ${type}: ${count}`);
        });
        
        // Check for turbines
        const turbineFeatures = features.filter(f => f.properties?.type === 'turbine');
        console.log(`\n   🔧 TURBINE FEATURES: ${turbineFeatures.length}`);
        
        if (turbineFeatures.length === 0) {
          console.log('   ❌ ISSUE CONFIRMED: No turbine features in GeoJSON');
        } else {
          console.log('   ✅ Turbine features present');
          console.log(`   Sample turbine: ${JSON.stringify(turbineFeatures[0], null, 2)}`);
        }
        
        // Check for terrain features
        const terrainFeatures = features.filter(f => f.properties?.type !== 'turbine');
        console.log(`\n   🌍 TERRAIN FEATURES: ${terrainFeatures.length}`);
        
        if (terrainFeatures.length === 0) {
          console.log('   ❌ ISSUE CONFIRMED: No terrain features in layout GeoJSON');
        } else {
          console.log('   ✅ Terrain features present in layout');
        }
      }
      
      // Check for action buttons
      console.log(`\n   Has Actions: ${!!layoutArtifact.actions}`);
      if (layoutArtifact.actions) {
        console.log(`   Action Count: ${layoutArtifact.actions.length}`);
      } else {
        console.log('   ❌ ISSUE CONFIRMED: No action buttons in layout artifact');
      }
    }
  }
}

async function test3_WakeSimulationHeatMap() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('TEST 3: Wake Simulation - Heat Map Visualization');
  console.log('═══════════════════════════════════════════════════════════');
  
  const orchestratorName = process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME;
  if (!orchestratorName) {
    console.error('❌ RENEWABLE_ORCHESTRATOR_FUNCTION_NAME not set');
    return;
  }
  
  // Create full workflow: terrain -> layout -> simulation
  console.log('Step 1: Creating project with terrain analysis...');
  const sessionId = `test-wake-${Date.now()}`;
  
  const terrainResult = await invokeLambda(orchestratorName, {
    query: `Analyze terrain at ${TEST_COORDS.latitude}, ${TEST_COORDS.longitude} with 5km radius`,
    sessionId,
    userId: 'test-user'
  });
  
  const projectId = terrainResult.metadata?.projectId || terrainResult.metadata?.projectName;
  console.log(`   Project ID: ${projectId}`);
  
  console.log('\nStep 2: Running layout optimization...');
  await invokeLambda(orchestratorName, {
    query: 'optimize turbine layout',
    sessionId,
    userId: 'test-user',
    context: { projectId }
  });
  
  console.log('\nStep 3: Running wake simulation...');
  const wakeResult = await invokeLambda(orchestratorName, {
    query: 'run wake simulation',
    sessionId,
    userId: 'test-user',
    context: { projectId }
  });
  
  console.log('\n📊 WAKE SIMULATION RESULTS:');
  console.log(`✅ Success: ${wakeResult.success}`);
  console.log(`📝 Message: ${wakeResult.message}`);
  console.log(`📦 Artifacts: ${wakeResult.artifacts?.length || 0}`);
  
  if (wakeResult.artifacts && wakeResult.artifacts.length > 0) {
    const wakeArtifact = wakeResult.artifacts.find(a => a.type === 'wake_simulation');
    
    if (wakeArtifact) {
      console.log('\n🔥 WAKE ARTIFACT ANALYSIS:');
      console.log(`   Has Visualizations: ${!!wakeArtifact.data.visualizations}`);
      
      if (wakeArtifact.data.visualizations) {
        const viz = wakeArtifact.data.visualizations;
        console.log('   Visualization Types:');
        Object.keys(viz).forEach(key => {
          console.log(`      ${key}: ${viz[key] ? '✅' : '❌'}`);
        });
        
        // Check specifically for wake_heat_map
        if (!viz.wake_heat_map) {
          console.log('\n   ❌ ISSUE CONFIRMED: wake_heat_map visualization missing');
        } else {
          console.log(`\n   ✅ wake_heat_map present: ${viz.wake_heat_map}`);
        }
      } else {
        console.log('   ❌ ISSUE CONFIRMED: No visualizations object in wake artifact');
      }
      
      // Check for action buttons
      console.log(`\n   Has Actions: ${!!wakeArtifact.actions}`);
      if (!wakeArtifact.actions) {
        console.log('   ❌ ISSUE CONFIRMED: No action buttons in wake artifact');
      }
    }
  }
}

async function test4_FinancialAnalysisIntent() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('TEST 4: Financial Analysis Intent Detection');
  console.log('═══════════════════════════════════════════════════════════');
  
  const orchestratorName = process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME;
  if (!orchestratorName) {
    console.error('❌ RENEWABLE_ORCHESTRATOR_FUNCTION_NAME not set');
    return;
  }
  
  const result = await invokeLambda(orchestratorName, {
    query: 'Perform financial analysis and ROI calculation',
    sessionId: `test-financial-${Date.now()}`,
    userId: 'test-user'
  });
  
  console.log('\n📊 FINANCIAL ANALYSIS RESULTS:');
  console.log(`✅ Success: ${result.success}`);
  console.log(`📝 Message: ${result.message}`);
  console.log(`📦 Artifacts: ${result.artifacts?.length || 0}`);
  
  if (result.artifacts && result.artifacts.length > 0) {
    console.log('\n   Artifact Types:');
    result.artifacts.forEach((artifact, i) => {
      console.log(`      ${i + 1}. ${artifact.type}`);
    });
    
    // Check if it's returning terrain analysis instead of financial
    const hasTerrainArtifact = result.artifacts.some(a => a.type === 'wind_farm_terrain_analysis');
    const hasFinancialArtifact = result.artifacts.some(a => a.type === 'financial_analysis' || a.type === 'report_generation');
    
    if (hasTerrainArtifact && !hasFinancialArtifact) {
      console.log('\n   ❌ ISSUE CONFIRMED: Financial analysis query returns terrain analysis artifact');
    } else if (hasFinancialArtifact) {
      console.log('\n   ✅ Correct artifact type returned');
    } else {
      console.log('\n   ⚠️  Unknown artifact type returned');
    }
  }
  
  // Check intent detection in metadata
  if (result.metadata?.toolsUsed) {
    console.log(`\n   Tools Used: ${result.metadata.toolsUsed.join(', ')}`);
    
    if (result.metadata.toolsUsed.includes('terrain_analysis')) {
      console.log('   ❌ ISSUE CONFIRMED: Intent misclassified as terrain_analysis');
    }
  }
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔍 RENEWABLE WORKFLOW DIAGNOSTIC TESTS');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`🌍 Region: ${process.env.AWS_REGION || 'us-east-1'}`);
  
  try {
    await test1_TerrainAnalysisPerimeter();
    await test2_LayoutOptimizationMap();
    await test3_WakeSimulationHeatMap();
    await test4_FinancialAnalysisIntent();
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ ALL DIAGNOSTIC TESTS COMPLETE');
    console.log('═══════════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
