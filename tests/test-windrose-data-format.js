/**
 * Test to verify WindRose data format from backend
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambdaClient = new LambdaClient({});

async function testWindRoseDataFormat() {
  console.log('🧪 Testing WindRose Data Format\n');
  
  // Find simulation Lambda
  const { ListFunctionsCommand } = require('@aws-sdk/client-lambda');
  const listResponse = await lambdaClient.send(new ListFunctionsCommand({}));
  const simulationFunction = listResponse.Functions?.find(fn => 
    fn.FunctionName?.toLowerCase().includes('simulation') &&
    fn.FunctionName?.toLowerCase().includes('renewable')
  );
  
  if (!simulationFunction) {
    console.log('❌ Simulation Lambda not found');
    return;
  }
  
  console.log(`✅ Found simulation Lambda: ${simulationFunction.FunctionName}\n`);
  
  // Test wind rose analysis
  console.log('📋 Test 1: Wind Rose Analysis');
  const windRosePayload = {
    action: 'wind_rose',
    parameters: {
      project_id: 'test-windrose-format',
      latitude: 30.2672,
      longitude: -97.7431
    }
  };
  
  try {
    const command = new InvokeCommand({
      FunctionName: simulationFunction.FunctionName,
      Payload: JSON.stringify(windRosePayload)
    });
    
    const response = await lambdaClient.send(command);
    const result = JSON.parse(new TextDecoder().decode(response.Payload));
    const body = JSON.parse(result.body);
    
    console.log(`   Success: ${body.success}`);
    console.log(`   Type: ${body.type}`);
    
    if (body.data) {
      console.log(`   Has plotlyWindRose: ${!!body.data.plotlyWindRose}`);
      
      if (body.data.plotlyWindRose) {
        console.log(`   plotlyWindRose keys: ${Object.keys(body.data.plotlyWindRose).join(', ')}`);
        console.log(`   Has data property: ${!!body.data.plotlyWindRose.data}`);
        console.log(`   Has layout property: ${!!body.data.plotlyWindRose.layout}`);
        
        if (body.data.plotlyWindRose.data) {
          console.log(`   ✅ Plotly format CORRECT - has data array`);
        } else {
          console.log(`   ❌ Plotly format WRONG - missing data array`);
        }
      } else {
        console.log(`   ❌ No plotlyWindRose in response`);
      }
      
      // Check for legacy format
      if (body.data.windRoseData) {
        console.log(`   Has legacy windRoseData: ${Array.isArray(body.data.windRoseData)}`);
        if (Array.isArray(body.data.windRoseData) && body.data.windRoseData.length > 0) {
          const first = body.data.windRoseData[0];
          console.log(`   Legacy format keys: ${Object.keys(first).join(', ')}`);
        }
      }
    }
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('✅ Test Complete');
}

testWindRoseDataFormat().catch(console.error);
