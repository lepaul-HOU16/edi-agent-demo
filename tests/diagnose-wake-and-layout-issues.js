/**
 * Diagnostic script for wake simulation and layout issues
 * 
 * Issues to diagnose:
 * 1. Wake simulation fails with "Tool execution failed" after layout generation
 * 2. Layout optimization not using intelligent placement algorithm
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambdaClient = new LambdaClient({});

async function getOrchestratorFunctionName() {
  const { ListFunctionsCommand } = require('@aws-sdk/client-lambda');
  const client = new LambdaClient({});
  
  let nextMarker = undefined;
  
  do {
    const response = await client.send(new ListFunctionsCommand({
      Marker: nextMarker,
      MaxItems: 50
    }));
    
    const orchestratorFunction = response.Functions?.find(fn => 
      fn.FunctionName?.toLowerCase().includes('orchestrator')
    );
    
    if (orchestratorFunction) {
      return orchestratorFunction.FunctionName;
    }
    
    nextMarker = response.NextMarker;
  } while (nextMarker);
  
  throw new Error('Orchestrator Lambda not found');
}

async function invokeOrchestrator(query, context = {}) {
  const functionName = await getOrchestratorFunctionName();
  
  const payload = {
    query,
    context,
    sessionId: `test-session-${Date.now()}`
  };
  
  console.log(`\n📤 Invoking: ${query}`);
  
  const command = new InvokeCommand({
    FunctionName: functionName,
    Payload: JSON.stringify(payload)
  });
  
  const response = await lambdaClient.send(command);
  const result = JSON.parse(new TextDecoder().decode(response.Payload));
  
  return result;
}

async function testCompleteWorkflow() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔍 DIAGNOSING WAKE SIMULATION AND LAYOUT ISSUES');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const projectName = `test-wake-layout-${Date.now()}`;
  const coords = { lat: 32.7767, lon: -96.797 };
  
  try {
    // Step 1: Terrain Analysis
    console.log('STEP 1: Terrain Analysis');
    console.log('─'.repeat(60));
    
    const terrainResult = await invokeOrchestrator(
      `analyze terrain at ${coords.lat}, ${coords.lon}`
    );
    
    console.log(`✅ Success: ${terrainResult.success}`);
    console.log(`📝 Message: ${terrainResult.message}`);
    console.log(`📊 Artifacts: ${terrainResult.artifacts?.length || 0}`);
    
    if (!terrainResult.success) {
      console.log('❌ Terrain analysis failed, cannot proceed');
      return;
    }
    
    // Step 2: Layout Optimization
    console.log('\n\nSTEP 2: Layout Optimization');
    console.log('─'.repeat(60));
    
    const layoutResult = await invokeOrchestrator(
      `optimize turbine layout`
    );
    
    console.log(`✅ Success: ${layoutResult.success}`);
    console.log(`📝 Message: ${layoutResult.message}`);
    console.log(`📊 Artifacts: ${layoutResult.artifacts?.length || 0}`);
    
    if (!layoutResult.success) {
      console.log('❌ Layout optimization failed');
      console.log(`   Error: ${layoutResult.message}`);
      return;
    }
    
    // Check layout artifact
    if (layoutResult.artifacts && layoutResult.artifacts.length > 0) {
      const layoutArtifact = layoutResult.artifacts[0];
      console.log(`\n📦 Layout Artifact Details:`);
      console.log(`   Type: ${layoutArtifact.type}`);
      console.log(`   Turbine Count: ${layoutArtifact.data?.turbineCount || 'N/A'}`);
      console.log(`   Layout Type: ${layoutArtifact.data?.layoutType || 'N/A'}`);
      
      // Check if intelligent placement was used
      const layoutType = layoutArtifact.data?.layoutType || '';
      if (layoutType.toLowerCase().includes('intelligent') || 
          layoutType.toLowerCase().includes('smart') ||
          layoutType.toLowerCase().includes('osm')) {
        console.log(`   ✅ Using intelligent placement`);
      } else {
        console.log(`   ⚠️  NOT using intelligent placement (using: ${layoutType})`);
        console.log(`   🔧 ISSUE FOUND: Layout should use intelligent placement with OSM data`);
      }
    }
    
    // Step 3: Wake Simulation
    console.log('\n\nSTEP 3: Wake Simulation');
    console.log('─'.repeat(60));
    
    const wakeResult = await invokeOrchestrator(
      `run wake simulation`
    );
    
    console.log(`✅ Success: ${wakeResult.success}`);
    console.log(`📝 Message: ${wakeResult.message}`);
    console.log(`📊 Artifacts: ${wakeResult.artifacts?.length || 0}`);
    
    if (!wakeResult.success) {
      console.log('\n❌ WAKE SIMULATION FAILED');
      console.log('─'.repeat(60));
      console.log(`Error: ${wakeResult.message}`);
      
      // Check metadata for more details
      if (wakeResult.metadata) {
        console.log(`\n📋 Metadata:`);
        console.log(JSON.stringify(wakeResult.metadata, null, 2));
      }
      
      // Diagnose the issue
      console.log('\n🔍 DIAGNOSIS:');
      
      if (wakeResult.message.includes('layout')) {
        console.log('   Issue: Layout data not being passed to wake simulation');
        console.log('   Possible causes:');
        console.log('   1. Project context not loading layout_results');
        console.log('   2. Layout data not saved to S3 properly');
        console.log('   3. Orchestrator not passing layout to simulation Lambda');
      }
      
      if (wakeResult.message.includes('Tool execution failed')) {
        console.log('   Issue: Generic tool execution failure');
        console.log('   Possible causes:');
        console.log('   1. Simulation Lambda crashed');
        console.log('   2. Missing required parameters');
        console.log('   3. Python dependencies not loaded');
        console.log('   4. NREL API issues');
      }
      
      return;
    }
    
    // Check wake artifact
    if (wakeResult.artifacts && wakeResult.artifacts.length > 0) {
      const wakeArtifact = wakeResult.artifacts[0];
      console.log(`\n📦 Wake Artifact Details:`);
      console.log(`   Type: ${wakeArtifact.type}`);
      console.log(`   AEP: ${wakeArtifact.data?.performanceMetrics?.netAEP || 'N/A'} GWh`);
      console.log(`   Capacity Factor: ${(wakeArtifact.data?.performanceMetrics?.capacityFactor * 100).toFixed(1) || 'N/A'}%`);
      console.log(`   Wake Losses: ${(wakeArtifact.data?.performanceMetrics?.wakeLosses * 100).toFixed(1) || 'N/A'}%`);
    }
    
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('✅ COMPLETE WORKFLOW SUCCESSFUL');
    console.log('═══════════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
  }
}

// Run diagnostic
testCompleteWorkflow().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
