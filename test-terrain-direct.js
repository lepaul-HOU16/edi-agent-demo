const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambda = new LambdaClient({ region: 'us-east-1' });

async function testTerrain() {
  const payload = {
    parameters: {
      latitude: 35.067482,
      longitude: -101.395466,
      radius_km: 5,
      project_id: 'test-direct-invoke'
    }
  };

  console.log('🚀 Invoking terrain Lambda directly...');
  console.log('📦 Payload:', JSON.stringify(payload, null, 2));

  const command = new InvokeCommand({
    FunctionName: 'amplify-digitalassistant--RenewableTerrainToolFBBF-WH2Gs9R2lgfP',
    Payload: JSON.stringify(payload)
  });

  const response = await lambda.send(command);
  const result = JSON.parse(new TextDecoder().decode(response.Payload));

  console.log('\n✅ Full Lambda Response:');
  console.log(JSON.stringify(result, null, 2));
  
  console.log('\n📊 Response Keys:', Object.keys(result));
  console.log('Has geojson:', !!result.geojson);
  console.log('Has mapHtml:', !!result.mapHtml);
  
  if (result.geojson) {
    console.log('GeoJSON features:', result.geojson.features?.length || 0);
  }
}

testTerrain().catch(console.error);
