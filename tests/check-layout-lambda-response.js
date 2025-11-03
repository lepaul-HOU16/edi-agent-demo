#!/usr/bin/env node

/**
 * Check what the layout Lambda is actually returning
 * This will help us see if GeoJSON is in the response
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

async function testLayoutLambda() {
  console.log('🔍 Testing Layout Lambda Response\n');
  
  // Get the layout Lambda function name
  const layoutFunctionName = process.env.RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME;
  
  if (!layoutFunctionName) {
    console.error('❌ RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME not set');
    console.log('\nTo find it, run:');
    console.log('aws lambda list-functions --query "Functions[?contains(FunctionName, \'Layout\')].FunctionName"');
    process.exit(1);
  }
  
  console.log(`📍 Layout Lambda: ${layoutFunctionName}\n`);
  
  // Test payload - parameters must be nested under 'parameters' key
  const testPayload = {
    parameters: {
      center_lat: 35.0,
      center_lon: -101.0,
      radius_km: 5,
      num_turbines: 10,
      project_id: 'test-project-123'
    }
  };
  
  console.log('📤 Sending test payload:', JSON.stringify(testPayload, null, 2));
  
  try {
    const command = new InvokeCommand({
      FunctionName: layoutFunctionName,
      Payload: JSON.stringify(testPayload)
    });
    
    console.log('\n⏳ Invoking Lambda...\n');
    const response = await lambda.send(command);
    
    if (!response.Payload) {
      console.error('❌ No payload in response');
      return;
    }
    
    const result = JSON.parse(new TextDecoder().decode(response.Payload));
    
    console.log('✅ Lambda Response Received\n');
    console.log('📊 Response Structure:');
    console.log('  - statusCode:', result.statusCode);
    console.log('  - body type:', typeof result.body);
    
    const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
    
    console.log('\n📦 Body Structure:');
    console.log('  - Keys:', Object.keys(body).join(', '));
    
    if (body.geojson) {
      console.log('\n✅ GeoJSON FOUND in response!');
      console.log('  - Type:', body.geojson.type);
      console.log('  - Features:', body.geojson.features?.length || 0);
      
      if (body.geojson.features && body.geojson.features.length > 0) {
        console.log('\n📍 Feature Types:');
        const featureTypes = {};
        body.geojson.features.forEach(f => {
          const type = f.properties?.type || 'unknown';
          featureTypes[type] = (featureTypes[type] || 0) + 1;
        });
        Object.entries(featureTypes).forEach(([type, count]) => {
          console.log(`  - ${type}: ${count}`);
        });
        
        // Check for turbines
        const turbines = body.geojson.features.filter(f => f.properties?.type === 'turbine');
        if (turbines.length > 0) {
          console.log('\n🌀 Turbine Sample:');
          console.log(JSON.stringify(turbines[0], null, 2));
        }
        
        // Check for OSM features
        const osmFeatures = body.geojson.features.filter(f => 
          f.properties?.type && !['turbine', 'perimeter'].includes(f.properties.type)
        );
        if (osmFeatures.length > 0) {
          console.log('\n🗺️  OSM Features Found:', osmFeatures.length);
          console.log('Sample:', JSON.stringify(osmFeatures[0], null, 2));
        }
      }
    } else {
      console.log('\n❌ NO GeoJSON in response!');
      console.log('\nFull body:', JSON.stringify(body, null, 2));
    }
    
    // Check for completedSteps
    if (body.completedSteps) {
      console.log('\n✅ completedSteps found:', body.completedSteps);
    } else {
      console.log('\n❌ NO completedSteps in response');
    }
    
  } catch (error) {
    console.error('\n❌ Error invoking Lambda:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

testLayoutLambda().catch(console.error);
