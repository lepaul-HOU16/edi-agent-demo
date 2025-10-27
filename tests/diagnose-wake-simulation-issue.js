/**
 * Diagnostic test for wake simulation failure
 * Tests the complete flow from layout to wake simulation
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambdaClient = new LambdaClient({});

async function testWakeSimulation() {
  console.log('🔍 DIAGNOSING WAKE SIMULATION ISSUE');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  try {
    // Step 1: Get orchestrator function name
    const orchestratorName = process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME;
    
    if (!orchestratorName) {
      console.error('❌ RENEWABLE_ORCHESTRATOR_FUNCTION_NAME not set');
      console.log('\nRun: export RENEWABLE_ORCHESTRATOR_FUNCTION_NAME=$(aws lambda list-functions --query "Functions[?contains(FunctionName, \'renewableOrchestrator\')].FunctionName" --output text)');
      process.exit(1);
    }
    
    console.log(`✅ Orchestrator: ${orchestratorName}\n`);
    
    // Step 2: Test wake simulation query
    console.log('📋 Testing: "Run a wake simulation for this wind farm layout"');
    console.log('───────────────────────────────────────────────────────────\n');
    
    const wakeQuery = {
      query: 'Run a wake simulation for this wind farm layout',
      sessionId: `test-session-${Date.now()}`,
      context: {
        // Simulate having a layout from previous step
        layout_results: {
          geojson: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [-101.395466, 35.067482] },
                properties: { turbine_id: 'T001', capacity_MW: 2.5 }
              },
              {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [-101.385466, 35.067482] },
                properties: { turbine_id: 'T002', capacity_MW: 2.5 }
              }
            ]
          }
        },
        coordinates: {
          latitude: 35.067482,
          longitude: -101.395466
        }
      }
    };
    
    const command = new InvokeCommand({
      FunctionName: orchestratorName,
      Payload: JSON.stringify(wakeQuery)
    });
    
    const startTime = Date.now();
    const response = await lambdaClient.send(command);
    const duration = Date.now() - startTime;
    
    const payload = JSON.parse(Buffer.from(response.Payload).toString());
    
    console.log(`⏱️  Duration: ${duration}ms\n`);
    console.log('📦 RESPONSE:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(JSON.stringify(payload, null, 2));
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Analyze response
    if (payload.success) {
      console.log('✅ Wake simulation succeeded');
      
      if (payload.artifacts && payload.artifacts.length > 0) {
        console.log(`✅ Generated ${payload.artifacts.length} artifact(s)`);
        payload.artifacts.forEach((artifact, i) => {
          console.log(`   ${i + 1}. ${artifact.type}`);
        });
      } else {
        console.log('⚠️  No artifacts generated');
      }
    } else {
      console.log('❌ Wake simulation failed');
      console.log(`   Error: ${payload.message || payload.error || 'Unknown error'}`);
      
      if (payload.metadata?.errorCategory) {
        console.log(`   Category: ${payload.metadata.errorCategory}`);
      }
      
      if (payload.metadata?.details) {
        console.log('   Details:', JSON.stringify(payload.metadata.details, null, 2));
      }
    }
    
    // Step 3: Check layout data structure
    console.log('\n📊 LAYOUT DATA ANALYSIS:');
    console.log('───────────────────────────────────────────────────────────');
    
    if (wakeQuery.context.layout_results) {
      const layout = wakeQuery.context.layout_results;
      console.log(`✅ Layout provided in context`);
      console.log(`   Features: ${layout.geojson?.features?.length || 0}`);
      console.log(`   Has GeoJSON: ${!!layout.geojson}`);
      console.log(`   Structure: ${JSON.stringify(Object.keys(layout), null, 2)}`);
    } else {
      console.log('❌ No layout in context');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run test
testWakeSimulation();
