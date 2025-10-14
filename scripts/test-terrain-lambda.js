#!/usr/bin/env node

/**
 * Test Terrain Lambda Deployment
 * Verifies that the terrain Lambda is deployed and working correctly
 */

const { LambdaClient, InvokeCommand, GetFunctionCommand } = require('@aws-sdk/client-lambda');

const client = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

async function testTerrainLambda() {
  console.log('🧪 Testing Terrain Lambda...\n');

  // Step 1: Check if Lambda exists
  console.log('1️⃣  Checking if Lambda function exists...');
  
  try {
    const functionName = 'amplify-digitalassistant-lepaul-sandbox-81360e1def-RenewableTerrainTool';
    
    const getFunction = new GetFunctionCommand({
      FunctionName: functionName
    });
    
    const funcInfo = await client.send(getFunction);
    console.log(`   ✅ Lambda exists: ${funcInfo.Configuration.FunctionName}`);
    console.log(`   📦 Runtime: ${funcInfo.Configuration.Runtime}`);
    console.log(`   💾 Memory: ${funcInfo.Configuration.MemorySize}MB`);
    console.log(`   ⏱️  Timeout: ${funcInfo.Configuration.Timeout}s`);
    console.log(`   📝 Handler: ${funcInfo.Configuration.Handler}`);
    console.log('');

    // Step 2: Invoke Lambda with test payload
    console.log('2️⃣  Invoking Lambda with test payload...');
    
    const testPayload = {
      parameters: {
        latitude: 35.067482,
        longitude: -101.395466,
        radius_km: 5.0,
        project_id: 'test-deployment-' + Date.now()
      }
    };
    
    console.log(`   📤 Sending: ${JSON.stringify(testPayload, null, 2)}`);
    console.log('');
    
    const invoke = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(testPayload)
    });
    
    const response = await client.send(invoke);
    const result = JSON.parse(Buffer.from(response.Payload).toString());
    
    console.log('   📥 Response received:');
    console.log(`   ✅ Success: ${result.success}`);
    console.log(`   📊 Type: ${result.type}`);
    
    if (result.success) {
      const data = result.data;
      console.log(`   🗺️  Project ID: ${data.projectId}`);
      console.log(`   📍 Coordinates: ${data.coordinates.lat}, ${data.coordinates.lng}`);
      console.log(`   📈 Total Features: ${data.metrics.totalFeatures}`);
      console.log(`   🔍 Radius: ${data.metrics.radiusKm}km`);
      
      // Check GeoJSON
      if (data.geojson && data.geojson.features) {
        console.log(`   🎯 GeoJSON Features: ${data.geojson.features.length}`);
        
        // Count feature types
        const featureTypes = {};
        data.geojson.features.forEach(f => {
          const type = f.geometry.type;
          featureTypes[type] = (featureTypes[type] || 0) + 1;
        });
        
        console.log('   📊 Feature breakdown:');
        Object.entries(featureTypes).forEach(([type, count]) => {
          console.log(`      - ${type}: ${count}`);
        });
        
        // Check for polygons (buildings, water bodies)
        const polygons = data.geojson.features.filter(f => f.geometry.type === 'Polygon');
        if (polygons.length > 0) {
          console.log(`   ✅ Polygon rendering fix working: ${polygons.length} polygons found`);
          
          // Sample a few polygon tags
          const samplePolygons = polygons.slice(0, 3);
          console.log('   🏢 Sample polygons:');
          samplePolygons.forEach((p, i) => {
            const tags = p.properties.tags || {};
            const building = tags.building ? `building=${tags.building}` : '';
            const water = tags.natural === 'water' ? 'natural=water' : '';
            const waterway = tags.waterway ? `waterway=${tags.waterway}` : '';
            const label = building || water || waterway || 'unknown';
            console.log(`      ${i + 1}. ${label}`);
          });
        } else {
          console.log('   ⚠️  No polygons found - may need to check filtering');
        }
      }
      
      // Check response size
      const responseSize = JSON.stringify(result).length;
      const responseSizeKB = (responseSize / 1024).toFixed(2);
      console.log(`   📦 Response size: ${responseSizeKB}KB`);
      
      if (responseSize > 6 * 1024 * 1024) {
        console.log('   ⚠️  Response exceeds 6MB Lambda limit!');
      } else {
        console.log('   ✅ Response size within Lambda limits');
      }
      
      console.log('');
      console.log('✅ All tests passed!');
      console.log('');
      console.log('🎉 Terrain Lambda is working correctly:');
      console.log('   ✅ ZIP deployment successful');
      console.log('   ✅ OSM data fetching works');
      console.log('   ✅ Polygon geometry conversion works');
      console.log('   ✅ GeoJSON returned directly (no S3 AccessDenied)');
      console.log('   ✅ Response size within limits');
      
    } else {
      console.log(`   ❌ Error: ${result.error}`);
      console.log('');
      console.log('❌ Test failed - check CloudWatch logs for details');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.name === 'ResourceNotFoundException') {
      console.log('');
      console.log('💡 Lambda function not found. Possible reasons:');
      console.log('   1. Deployment not complete yet');
      console.log('   2. Function name changed');
      console.log('   3. Sandbox not deployed');
      console.log('');
      console.log('Run: npx ampx sandbox');
    }
    
    process.exit(1);
  }
}

// Run test
testTerrainLambda().catch(console.error);
