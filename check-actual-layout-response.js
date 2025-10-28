const AWS = require('aws-sdk');

async function checkLayoutResponse() {
  console.log('🔍 CHECKING ACTUAL LAYOUT LAMBDA RESPONSE');
  console.log('=' .repeat(80));
  
  const lambda = new AWS.Lambda({ region: 'us-east-1' });
  
  const testPayload = {
    latitude: 35.067482,
    longitude: -101.395466,
    radius_km: 5,
    turbine_count: 10,
    projectId: 'test-layout-check',
    terrain_data: {
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [[[-101.4, 35.07], [-101.39, 35.07], [-101.39, 35.06], [-101.4, 35.06], [-101.4, 35.07]]] },
          properties: { type: 'building', name: 'Test Building' }
        }
      ]
    }
  };
  
  console.log('\n📤 Invoking layout Lambda with test payload...');
  
  try {
    const result = await lambda.invoke({
      FunctionName: 'amplify-digitalassistant--RenewableLayoutToolB3B5E-JRhfq69yq1WC',
      Payload: JSON.stringify(testPayload)
    }).promise();
    
    console.log('\n✅ Lambda Response Status:', result.StatusCode);
    
    const response = JSON.parse(result.Payload);
    console.log('\n📦 Response Structure:');
    console.log('  statusCode:', response.statusCode);
    console.log('  body type:', typeof response.body);
    
    const body = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
    
    console.log('\n📊 Body Structure:');
    console.log('  success:', body.success);
    console.log('  turbine_count:', body.turbine_count);
    console.log('  total_capacity:', body.total_capacity);
    console.log('  has geojson:', !!body.geojson);
    
    if (body.geojson) {
      console.log('\n🗺️ GeoJSON Structure:');
      console.log('  type:', body.geojson.type);
      console.log('  features count:', body.geojson.features?.length || 0);
      
      if (body.geojson.features && body.geojson.features.length > 0) {
        console.log('\n📍 Feature Breakdown:');
        const featureTypes = {};
        body.geojson.features.forEach(f => {
          const type = f.properties?.type || f.geometry?.type || 'unknown';
          featureTypes[type] = (featureTypes[type] || 0) + 1;
        });
        
        Object.entries(featureTypes).forEach(([type, count]) => {
          console.log(`    ${type}: ${count}`);
        });
        
        console.log('\n🔍 First 3 Features:');
        body.geojson.features.slice(0, 3).forEach((f, i) => {
          console.log(`\n  Feature ${i + 1}:`);
          console.log('    geometry.type:', f.geometry?.type);
          console.log('    properties.type:', f.properties?.type);
          console.log('    properties.name:', f.properties?.name);
          console.log('    properties.turbine_id:', f.properties?.turbine_id);
          if (f.geometry?.type === 'Polygon') {
            console.log('    coordinates length:', f.geometry.coordinates?.[0]?.length || 0);
          }
        });
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ DIAGNOSIS COMPLETE');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack:', error.stack);
    }
  }
}

checkLayoutResponse().catch(console.error);
