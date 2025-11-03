/**
 * Test script to verify Plotly wind rose data flows through the system
 * 
 * Tests:
 * 1. Backend generates Plotly data
 * 2. Orchestrator passes through Plotly data
 * 3. Frontend receives and can render Plotly data
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

async function testWindRosePlotlyFlow() {
  console.log('🧪 Testing Wind Rose Plotly Data Flow\n');
  
  // Test coordinates
  const testLat = 35.067482;
  const testLng = -101.395466;
  const projectId = `test-windrose-${Date.now()}`;
  
  try {
    // Step 1: Test simulation Lambda directly
    console.log('📍 Step 1: Testing simulation Lambda directly...');
    const simulationFunctionName = process.env.RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME;
    
    if (!simulationFunctionName) {
      console.error('❌ RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME not set');
      process.exit(1);
    }
    
    const simulationPayload = {
      action: 'wind_rose',
      parameters: {
        project_id: projectId,
        latitude: testLat,
        longitude: testLng,
        wind_speed: 8.5
      }
    };
    
    console.log(`   Invoking: ${simulationFunctionName}`);
    console.log(`   Payload:`, JSON.stringify(simulationPayload, null, 2));
    
    const simulationCommand = new InvokeCommand({
      FunctionName: simulationFunctionName,
      Payload: JSON.stringify(simulationPayload)
    });
    
    const simulationResponse = await lambda.send(simulationCommand);
    const simulationResult = JSON.parse(Buffer.from(simulationResponse.Payload).toString());
    
    console.log(`   Response success: ${simulationResult.success}`);
    console.log(`   Response type: ${simulationResult.type}`);
    
    // Check for Plotly data
    const hasPlotlyData = !!(simulationResult.data?.plotlyWindRose);
    const hasPngUrl = !!(simulationResult.data?.visualizations?.wind_rose || simulationResult.data?.windRoseUrl);
    
    console.log(`   ✅ Has Plotly data: ${hasPlotlyData}`);
    console.log(`   ✅ Has PNG fallback: ${hasPngUrl}`);
    
    if (hasPlotlyData) {
      const plotlyData = simulationResult.data.plotlyWindRose;
      console.log(`   📊 Plotly data structure:`);
      console.log(`      - data: ${Array.isArray(plotlyData.data) ? plotlyData.data.length : 0} traces`);
      console.log(`      - layout: ${plotlyData.layout ? 'present' : 'missing'}`);
      console.log(`      - statistics: ${plotlyData.statistics ? 'present' : 'missing'}`);
      
      if (plotlyData.statistics) {
        console.log(`      - avg speed: ${plotlyData.statistics.average_speed} m/s`);
        console.log(`      - max speed: ${plotlyData.statistics.max_speed} m/s`);
        console.log(`      - prevailing: ${plotlyData.statistics.prevailing_direction}`);
      }
    } else {
      console.log(`   ⚠️  No Plotly data in simulation response`);
    }
    
    console.log('');
    
    // Step 2: Test orchestrator
    console.log('📍 Step 2: Testing orchestrator with wind rose query...');
    const orchestratorFunctionName = process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME;
    
    if (!orchestratorFunctionName) {
      console.error('❌ RENEWABLE_ORCHESTRATOR_FUNCTION_NAME not set');
      process.exit(1);
    }
    
    const orchestratorPayload = {
      query: `show me a wind rose for ${testLat}, ${testLng}`,
      chatSessionId: `test-session-${Date.now()}`,
      userId: 'test-user'
    };
    
    console.log(`   Invoking: ${orchestratorFunctionName}`);
    console.log(`   Query: "${orchestratorPayload.query}"`);
    
    const orchestratorCommand = new InvokeCommand({
      FunctionName: orchestratorFunctionName,
      Payload: JSON.stringify(orchestratorPayload)
    });
    
    const orchestratorResponse = await lambda.send(orchestratorCommand);
    const orchestratorResult = JSON.parse(Buffer.from(orchestratorResponse.Payload).toString());
    
    console.log(`   Response success: ${orchestratorResult.success}`);
    
    // Check artifacts
    const artifacts = orchestratorResult.data?.artifacts || [];
    console.log(`   Artifacts count: ${artifacts.length}`);
    
    const windRoseArtifact = artifacts.find(a => a.type === 'wind_rose_analysis');
    
    if (windRoseArtifact) {
      console.log(`   ✅ Found wind_rose_analysis artifact`);
      
      const artifactHasPlotly = !!(windRoseArtifact.data?.plotlyWindRose);
      const artifactHasPng = !!(windRoseArtifact.data?.visualizationUrl || 
                                windRoseArtifact.data?.windRoseUrl || 
                                windRoseArtifact.data?.mapUrl);
      
      console.log(`   ✅ Artifact has Plotly data: ${artifactHasPlotly}`);
      console.log(`   ✅ Artifact has PNG fallback: ${artifactHasPng}`);
      
      if (artifactHasPlotly) {
        const plotlyData = windRoseArtifact.data.plotlyWindRose;
        console.log(`   📊 Plotly data in artifact:`);
        console.log(`      - data: ${Array.isArray(plotlyData.data) ? plotlyData.data.length : 0} traces`);
        console.log(`      - layout: ${plotlyData.layout ? 'present' : 'missing'}`);
        console.log(`      - statistics: ${plotlyData.statistics ? 'present' : 'missing'}`);
      } else {
        console.log(`   ❌ FAIL: Plotly data NOT passed through orchestrator`);
        console.log(`   Available artifact data keys:`, Object.keys(windRoseArtifact.data));
      }
      
      if (artifactHasPng) {
        const pngUrl = windRoseArtifact.data.visualizationUrl || 
                       windRoseArtifact.data.windRoseUrl || 
                       windRoseArtifact.data.mapUrl;
        console.log(`   🖼️  PNG URL: ${pngUrl}`);
      }
    } else {
      console.log(`   ❌ FAIL: No wind_rose_analysis artifact found`);
      console.log(`   Available artifact types:`, artifacts.map(a => a.type));
    }
    
    console.log('');
    
    // Summary
    console.log('📊 Test Summary:');
    console.log('================');
    
    const simulationGeneratesPlotly = hasPlotlyData;
    const orchestratorPassesPlotly = windRoseArtifact && !!(windRoseArtifact.data?.plotlyWindRose);
    
    console.log(`✅ Simulation generates Plotly data: ${simulationGeneratesPlotly ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Orchestrator passes Plotly data: ${orchestratorPassesPlotly ? 'PASS' : 'FAIL'}`);
    
    if (simulationGeneratesPlotly && orchestratorPassesPlotly) {
      console.log('\n🎉 SUCCESS: Plotly wind rose data flows through entire pipeline!');
      console.log('   Frontend should now display interactive Plotly wind rose.');
      return true;
    } else {
      console.log('\n❌ FAILURE: Plotly data pipeline broken');
      if (!simulationGeneratesPlotly) {
        console.log('   Issue: Simulation Lambda not generating Plotly data');
      }
      if (!orchestratorPassesPlotly) {
        console.log('   Issue: Orchestrator not passing through Plotly data');
      }
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.error(error.stack);
    return false;
  }
}

// Run test
testWindRosePlotlyFlow()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
