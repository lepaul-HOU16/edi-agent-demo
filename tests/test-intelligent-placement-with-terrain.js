#!/usr/bin/env node

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const lambda = new LambdaClient({ region: 'us-east-1' });

async function testWithTerrainContext() {
  console.log('\n' + '='.repeat(80));
  console.log('🧠 TESTING INTELLIGENT PLACEMENT WITH TERRAIN CONTEXT');
  console.log('='.repeat(80));
  
  // First, get terrain data
  console.log('\n📍 Step 1: Fetching terrain data...');
  const terrainCommand = new InvokeCommand({
    FunctionName: 'amplify-digitalassistant--RenewableTerrainToolFBBF-T9MqkWlRCCpJ',
    Payload: JSON.stringify({
      parameters: {
        latitude: 35.067482,
        longitude: -101.395466,
        radius_km: 5,
        project_id: 'intelligent-test'
      }
    })
  });
  
  const terrainResponse = await lambda.send(terrainCommand);
  const terrainResult = JSON.parse(Buffer.from(terrainResponse.Payload).toString());
  
  console.log(`✅ Terrain data received: ${terrainResult.data?.featureCount || 0} features`);
  
  // Now test layout with terrain context
  console.log('\n🏗️  Step 2: Testing layout with terrain context...');
  const layoutPayload = {
    parameters: {
      latitude: 35.067482,
      longitude: -101.395466,
      capacity_target_mw: 50,
      project_id: 'intelligent-test'
    },
    context: {
      terrain_results: terrainResult.data
    }
  };
  
  console.log(`   Terrain features in context: ${terrainResult.data?.featureCount || 0}`);
  
  const layoutCommand = new InvokeCommand({
    FunctionName: 'amplify-digitalassistant--RenewableLayoutTool14B26-KSWfrukjyOvG',
    Payload: JSON.stringify(layoutPayload)
  });
  
  const layoutResponse = await lambda.send(layoutCommand);
  const layoutResult = JSON.parse(Buffer.from(layoutResponse.Payload).toString());
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 LAYOUT RESULTS');
  console.log('='.repeat(80));
  
  if (layoutResult.data) {
    const data = layoutResult.data;
    console.log(`\n✅ Layout Type: ${data.layoutType}`);
    console.log(`   Turbine Count: ${data.turbineCount}`);
    console.log(`   Total Capacity: ${data.totalCapacity} MW`);
    console.log(`   Title: ${data.title}`);
    console.log(`   Subtitle: ${data.subtitle}`);
    
    if (data.layoutType === 'intelligent_osm_aware') {
      console.log('\n🎉 SUCCESS! Intelligent placement is working!');
      console.log(`   ✅ Algorithm: Intelligent OSM-aware placement`);
      console.log(`   ✅ Terrain constraints considered`);
    } else if (data.layoutType === 'grid') {
      console.log('\n⚠️  WARNING: Still using grid layout');
      console.log(`   ❌ Expected: intelligent_osm_aware`);
      console.log(`   ❌ Got: ${data.layoutType}`);
    }
    
    // Check first turbine properties
    if (data.geojson?.features?.[0]) {
      const firstTurbine = data.geojson.features[0];
      console.log('\n📍 First Turbine Properties:');
      console.log(`   ID: ${firstTurbine.properties.turbine_id}`);
      console.log(`   Capacity: ${firstTurbine.properties.capacity_MW} MW`);
      console.log(`   Hub Height: ${firstTurbine.properties.hub_height_m}m`);
      console.log(`   Rotor Diameter: ${firstTurbine.properties.rotor_diameter_m}m`);
      
      if (firstTurbine.properties.placement_method) {
        console.log(`   Placement Method: ${firstTurbine.properties.placement_method}`);
      }
    }
  } else {
    console.log('\n❌ ERROR: No data in layout result');
    console.log(JSON.stringify(layoutResult, null, 2));
  }
  
  console.log('\n' + '='.repeat(80));
}

testWithTerrainContext().catch(console.error);
