#!/usr/bin/env node

/**
 * Test the deployed terrain Lambda to verify enhanced OSM query
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

async function testDeployedLambda() {
  const client = new LambdaClient({ region: process.env.AWS_REGION || 'us-west-2' });
  
  console.log('🧪 Testing deployed terrain Lambda...\n');
  
  const testPayload = {
    parameters: {
      latitude: 35.067482,
      longitude: -101.395466,
      radius_km: 5.0,
      project_id: 'deployment-test-' + Date.now()
    }
  };
  
  console.log('Test parameters:');
  console.log(JSON.stringify(testPayload, null, 2));
  console.log('\n⏳ Invoking Lambda...\n');
  
  try {
    const command = new InvokeCommand({
      FunctionName: 'renewable-terrain-simple',
      Payload: JSON.stringify(testPayload)
    });
    
    const response = await client.send(command);
    let result = JSON.parse(Buffer.from(response.Payload).toString());
    
    // Handle API Gateway response format
    if (result.statusCode && result.body) {
      result = JSON.parse(result.body);
    }
    
    console.log('✅ Lambda invoked successfully\n');
    
    if (result.success) {
      const featureCount = result.data?.metrics?.totalFeatures || 0;
      const geojsonCount = result.data?.geojson?.features?.length || 0;
      
      console.log('📊 RESULTS:');
      console.log(`   Total Features: ${featureCount}`);
      console.log(`   GeoJSON Features: ${geojsonCount}`);
      console.log(`   Project ID: ${result.data?.projectId}`);
      
      if (featureCount >= 151) {
        console.log('\n✅ SUCCESS: Enhanced query is working!');
        console.log(`   Got ${featureCount} features (expected 151+)`);
      } else if (featureCount >= 100) {
        console.log('\n⚠️  PARTIAL: More features than before');
        console.log(`   Got ${featureCount} features (expected 151+)`);
        console.log('   Enhanced query may be partially working');
      } else {
        console.log('\n❌ FAILURE: Still getting limited features');
        console.log(`   Got ${featureCount} features (expected 151+)`);
        console.log('   Enhanced query may not be deployed');
      }
      
      // Sample some feature types
      if (result.data?.geojson?.features) {
        const featureTypes = {};
        result.data.geojson.features.forEach(f => {
          const label = f.properties?.feature_label || 'Unknown';
          featureTypes[label] = (featureTypes[label] || 0) + 1;
        });
        
        console.log('\n📋 Feature Types:');
        Object.entries(featureTypes)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .forEach(([type, count]) => {
            console.log(`   ${type}: ${count}`);
          });
      }
    } else {
      console.log('❌ Lambda returned error:');
      console.log(`   ${result.error || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.log('❌ ERROR invoking Lambda:');
    console.log(`   ${error.message}`);
    
    if (error.name === 'ResourceNotFoundException') {
      console.log('\n   Lambda function "renewable-terrain-simple" not found.');
      console.log('   Check if deployment completed successfully.');
    }
  }
}

testDeployedLambda().catch(console.error);
