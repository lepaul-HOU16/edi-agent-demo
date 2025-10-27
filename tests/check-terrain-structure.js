#!/usr/bin/env node

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const lambda = new LambdaClient({ region: 'us-east-1' });

async function checkTerrainStructure() {
  const payload = {
    parameters: {
      latitude: 35.067482,
      longitude: -101.395466,
      radius_km: 5,
      project_id: 'structure-test'
    }
  };
  
  const command = new InvokeCommand({
    FunctionName: 'amplify-digitalassistant--RenewableTerrainToolFBBF-T9MqkWlRCCpJ',
    Payload: JSON.stringify(payload)
  });
  
  const response = await lambda.send(command);
  const result = JSON.parse(Buffer.from(response.Payload).toString());
  
  // Parse the body if it's a string
  const data = typeof result.body === 'string' ? JSON.parse(result.body) : result;
  
  console.log('Terrain Response Structure:');
  console.log('- Has data:', !!data.data);
  console.log('- Has exclusionZones:', !!data.data?.exclusionZones);
  console.log('- Has geojson:', !!data.data?.geojson);
  
  if (data.data?.exclusionZones) {
    const ez = data.data.exclusionZones;
    console.log('\nExclusion Zones:');
    console.log('  - buildings:', ez.buildings?.length || 0);
    console.log('  - roads:', ez.roads?.length || 0);
    console.log('  - waterBodies:', ez.waterBodies?.length || 0);
  } else {
    console.log('\n❌ NO EXCLUSION ZONES FOUND');
    console.log('Available keys in data:', Object.keys(data.data || {}));
  }
  
  if (data.data?.geojson?.features) {
    console.log('\nGeoJSON Features:', data.data.geojson.features.length);
    const types = {};
    data.data.geojson.features.forEach(f => {
      const type = f.properties?.feature_type || 'unknown';
      types[type] = (types[type] || 0) + 1;
    });
    console.log('Feature types:', types);
  }
}

checkTerrainStructure().catch(console.error);
