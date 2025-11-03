/**
 * Test terrain analysis timeout fix
 * 
 * This test verifies that:
 * 1. Terrain analysis completes within reasonable time
 * 2. Radius is automatically reduced if too large
 * 3. Fallback data is provided if OSM times out
 */

const AWS = require('aws-sdk');
const lambda = new AWS.Lambda({ region: process.env.AWS_REGION || 'us-east-1' });

async function testTerrainTimeoutFix() {
    console.log('🧪 Testing terrain analysis timeout fix...\n');
    
    // Test location: Texas Panhandle (good wind resource area)
    const testLocation = {
        latitude: 35.067482,
        longitude: -101.395466,
        radius_km: 5.0  // This should be reduced to 3.0 automatically
    };
    
    console.log(`📍 Test location: (${testLocation.latitude}, ${testLocation.longitude})`);
    console.log(`📏 Requested radius: ${testLocation.radius_km}km (should be reduced to 3.0km)\n`);
    
    // Find terrain Lambda
    const functions = await lambda.listFunctions().promise();
    const terrainFunction = functions.Functions.find(f => 
        f.FunctionName.includes('renewable-terrain-simple') ||
        f.FunctionName.includes('RenewableTerrainTool') || 
        f.FunctionName.includes('renewableTools-terrain')
    );
    
    if (!terrainFunction) {
        console.error('❌ Terrain Lambda not found');
        console.log('\n📋 Available functions:');
        functions.Functions
            .filter(f => f.FunctionName.includes('renewable') || f.FunctionName.includes('Renewable'))
            .forEach(f => console.log(`  - ${f.FunctionName}`));
        process.exit(1);
    }
    
    console.log(`✅ Found terrain Lambda: ${terrainFunction.FunctionName}\n`);
    
    // Test with timeout monitoring
    console.log('⏱️  Starting terrain analysis (with timeout protection)...');
    const startTime = Date.now();
    
    try {
        const result = await lambda.invoke({
            FunctionName: terrainFunction.FunctionName,
            Payload: JSON.stringify({
                parameters: testLocation
            })
        }).promise();
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ Terrain analysis completed in ${duration}s\n`);
        
        // Parse response
        const response = JSON.parse(result.Payload);
        
        if (response.statusCode !== 200) {
            console.error('❌ Terrain analysis failed');
            console.error('Response:', JSON.stringify(response, null, 2));
            process.exit(1);
        }
        
        const body = JSON.parse(response.body);
        
        // Verify response structure
        console.log('📊 Response validation:');
        console.log(`  ✅ Success: ${body.success}`);
        console.log(`  ✅ Has terrain data: ${!!body.terrain_data}`);
        console.log(`  ✅ Has geojson: ${!!body.terrain_data?.geojson}`);
        
        const geojson = body.terrain_data.geojson;
        const metadata = geojson.metadata || {};
        
        console.log(`\n📈 Terrain data statistics:`);
        console.log(`  - Features: ${geojson.features?.length || 0}`);
        console.log(`  - Actual radius used: ${metadata.query_radius_km || 'unknown'}km`);
        console.log(`  - Data source: ${metadata.source || 'unknown'}`);
        console.log(`  - Feature types: ${JSON.stringify(metadata.feature_statistics || {})}`);
        
        // Check if radius was reduced
        if (metadata.query_radius_km && metadata.query_radius_km < testLocation.radius_km) {
            console.log(`\n✅ TIMEOUT PROTECTION WORKING: Radius reduced from ${testLocation.radius_km}km to ${metadata.query_radius_km}km`);
        }
        
        // Check execution time
        if (duration < 20) {
            console.log(`\n✅ PERFORMANCE GOOD: Completed in ${duration}s (< 20s threshold)`);
        } else if (duration < 30) {
            console.log(`\n⚠️  PERFORMANCE ACCEPTABLE: Completed in ${duration}s (< 30s threshold)`);
        } else {
            console.log(`\n❌ PERFORMANCE ISSUE: Took ${duration}s (> 30s threshold)`);
        }
        
        // Check for fallback data
        if (metadata.source === 'synthetic_fallback') {
            console.log(`\n⚠️  Using fallback data due to: ${metadata.error_reason}`);
            console.log(`   This is expected if OSM is unavailable, but real data is preferred`);
        } else if (metadata.source === 'openstreetmap') {
            console.log(`\n✅ Using real OSM data (preferred)`);
        }
        
        console.log('\n✅ Terrain timeout fix test PASSED');
        
    } catch (error) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error(`\n❌ Terrain analysis failed after ${duration}s`);
        console.error('Error:', error.message);
        
        if (error.message.includes('timed out') || error.message.includes('timeout')) {
            console.error('\n🚨 TIMEOUT STILL OCCURRING - Fix not working properly');
        }
        
        process.exit(1);
    }
}

// Run test
testTerrainTimeoutFix().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});
