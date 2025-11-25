/**
 * Direct test of terrain Lambda to diagnose feature count issue
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambdaClient = new LambdaClient({});

async function testTerrainLambda() {
  console.log('🧪 Testing Terrain Lambda directly...\n');
  
  // Test coordinates (Texas Panhandle)
  const testPayload = {
    parameters: {
      latitude: 35.067482,
      longitude: -101.395466,
      radius_km: 5.0
    },
    action: 'terrain_analysis'
  };
  
  console.log('📍 Test Location:', testPayload.parameters);
  console.log('🔍 Expected: Multiple OSM features (buildings, roads, water, etc.)\n');
  
  try {
    // Get Lambda function name from environment or use default
    const functionName = process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME || 
                        'EnergyInsights-developmen-RenewableToolsFunction6D-r9tKTr47quRk';
    
    console.log(`📞 Invoking Lambda: ${functionName}\n`);
    
    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(testPayload)
    });
    
    const response = await lambdaClient.send(command);
    const result = JSON.parse(Buffer.from(response.Payload).toString());
    
    console.log('✅ Lambda Response:\n');
    console.log('Success:', result.success);
    console.log('Type:', result.type);
    
    if (result.data) {
      console.log('\n📊 Data Structure:');
      console.log('- Has coordinates:', !!result.data.coordinates);
      console.log('- Has exclusionZones:', !!result.data.exclusionZones);
      console.log('- Has metrics:', !!result.data.metrics);
      console.log('- Has geojson:', !!result.data.geojson);
      
      if (result.data.metrics) {
        console.log('\n📈 Metrics:');
        console.log('- Total Features:', result.data.metrics.totalFeatures);
        console.log('- Feature Breakdown:', JSON.stringify(result.data.metrics.featuresByType, null, 2));
      }
      
      if (result.data.geojson) {
        console.log('\n🗺️  GeoJSON:');
        console.log('- Type:', result.data.geojson.type);
        console.log('- Features Count:', result.data.geojson.features?.length);
        
        if (result.data.geojson.features && result.data.geojson.features.length > 0) {
          console.log('\n📍 Sample Features (first 5):');
          result.data.geojson.features.slice(0, 5).forEach((feature, idx) => {
            console.log(`  ${idx + 1}. Type: ${feature.properties?.type || 'unknown'}`);
            console.log(`     Geometry: ${feature.geometry?.type}`);
            console.log(`     Tags:`, feature.properties?.tags || {});
          });
        }
      }
      
      if (result.data.exclusionZones) {
        console.log('\n🚫 Exclusion Zones:', result.data.exclusionZones.length);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 DIAGNOSIS:');
    
    const featureCount = result.data?.metrics?.totalFeatures || 
                        result.data?.geojson?.features?.length || 0;
    
    if (featureCount === 0) {
      console.log('❌ PROBLEM: No features found!');
      console.log('   - OSM query may have failed');
      console.log('   - Check Lambda logs for OSM API errors');
    } else if (featureCount === 1) {
      console.log('⚠️  PROBLEM: Only 1 feature found (likely just the center point)');
      console.log('   - OSM query returned no actual terrain features');
      console.log('   - Location may be in remote area with sparse OSM data');
      console.log('   - Or OSM API query is too restrictive');
    } else if (featureCount < 10) {
      console.log('⚠️  WARNING: Very few features found');
      console.log(`   - Only ${featureCount} features detected`);
      console.log('   - Expected more features for 5km radius');
    } else {
      console.log(`✅ SUCCESS: ${featureCount} features found`);
      console.log('   - Terrain analysis working correctly');
    }
    
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error testing terrain Lambda:', error);
    console.error('Error details:', error.message);
  }
}

testTerrainLambda();
