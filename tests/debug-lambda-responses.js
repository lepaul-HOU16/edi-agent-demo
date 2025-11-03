#!/usr/bin/env node

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const lambda = new LambdaClient({ region: 'us-east-1' });

async function debugLambda(functionName, payload) {
  console.log(`\n=== Testing ${functionName} ===`);
  console.log('Payload:', JSON.stringify(payload, null, 2));
  
  try {
    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(payload)
    });
    
    const response = await lambda.send(command);
    const result = JSON.parse(Buffer.from(response.Payload).toString());
    
    console.log('\nRaw Response:');
    console.log(JSON.stringify(result, null, 2));
    
    if (response.FunctionError) {
      console.log('\nFunction Error:', response.FunctionError);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function main() {
  // Test terrain - parameters should be in event.parameters
  await debugLambda(
    'amplify-digitalassistant--RenewableTerrainToolFBBF-T9MqkWlRCCpJ',
    {
      parameters: {
        latitude: 35.067482,
        longitude: -101.395466,
        radius_km: 5,
        project_id: 'debug-test'
      }
    }
  );
  
  // Test layout - parameters should be in event.parameters
  await debugLambda(
    'amplify-digitalassistant--RenewableLayoutTool14B26-KSWfrukjyOvG',
    {
      parameters: {
        latitude: 35.067482,
        longitude: -101.395466,
        capacity_target_mw: 100,
        project_id: 'debug-test'
      }
    }
  );
  
  // Test simulation - parameters should be in event.parameters
  await debugLambda(
    'amplify-digitalassistant--RenewableSimulationToolF-xvLTjnDdGvWI',
    {
      parameters: {
        project_id: 'debug-test'
      },
      context: {
        layout_results: {
          turbine_positions: [
            { lat: 35.067482, lng: -101.395466, x: 0, y: 0 }
          ]
        }
      }
    }
  );
}

main();
