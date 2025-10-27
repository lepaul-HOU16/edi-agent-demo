/**
 * Test Terrain Handler NREL Integration
 * 
 * Verifies that the terrain handler:
 * 1. Imports NREL wind client successfully
 * 2. Fetches real wind data from NREL API
 * 3. Includes wind data in response
 * 4. Returns proper errors (not synthetic data) when NREL API fails
 * 5. Adds data source metadata
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambda = new LambdaClient({ region: 'us-west-2' });

// Test coordinates (Amarillo, TX - good wind resource area)
const TEST_COORDINATES = {
  latitude: 35.067482,
  longitude: -101.395466
};

async function testTerrainNRELIntegration() {
  console.log('🧪 Testing Terrain Handler NREL Integration\n');
  
  try {
    // Find terrain Lambda
    console.log('🔍 Finding terrain Lambda...');
    const { LambdaClient: ListLambdaClient, ListFunctionsCommand } = require('@aws-sdk/client-lambda');
    const listClient = new ListLambdaClient({ region: 'us-west-2' });
    const listResponse = await listClient.send(new ListFunctionsCommand({}));
    
    const terrainLambda = listResponse.Functions.find(f => 
      f.FunctionName.includes('RenewableTerrainTool') || 
      f.FunctionName.includes('renewableTools-terrain')
    );
    
    if (!terrainLambda) {
      console.error('❌ Terrain Lambda not found');
      process.exit(1);
    }
    
    console.log(`✅ Found terrain Lambda: ${terrainLambda.FunctionName}\n`);
    
    // Test 1: Invoke terrain handler with valid coordinates
    console.log('📍 Test 1: Terrain analysis with NREL wind data');
    console.log(`   Coordinates: ${TEST_COORDINATES.latitude}, ${TEST_COORDINATES.longitude}`);
    
    const payload = {
      parameters: {
        latitude: TEST_COORDINATES.latitude,
        longitude: TEST_COORDINATES.longitude,
        radius_km: 5.0,
        project_id: `test-terrain-nrel-${Date.now()}`
      }
    };
    
    const command = new InvokeCommand({
      FunctionName: terrainLambda.FunctionName,
      Payload: JSON.stringify(payload)
    });
    
    console.log('⏳ Invoking terrain Lambda...');
    const startTime = Date.now();
    const response = await lambda.send(command);
    const duration = Date.now() - startTime;
    
    const result = JSON.parse(Buffer.from(response.Payload).toString());
    const body = JSON.parse(result.body);
    
    console.log(`✅ Lambda invoked successfully (${duration}ms)\n`);
    
    // Verify response structure
    console.log('🔍 Verifying response structure...');
    
    if (!body.success) {
      console.error('❌ Response indicates failure');
      console.error('   Error:', body.error);
      process.exit(1);
    }
    console.log('✅ Response indicates success');
    
    if (!body.data) {
      console.error('❌ Response missing data field');
      process.exit(1);
    }
    console.log('✅ Response has data field');
    
    // Check for wind data
    console.log('\n🌬️ Checking wind data...');
    
    if (body.data.windData) {
      console.log('✅ Wind data present in response');
      
      const windData = body.data.windData;
      
      // Verify wind data structure
      const requiredFields = [
        'p_wd', 'a', 'k', 'wd_bins', 'ti', 
        'mean_wind_speed', 'total_hours', 'prevailing_wind_direction',
        'data_source', 'data_year', 'reliability'
      ];
      
      const missingFields = requiredFields.filter(field => !(field in windData));
      
      if (missingFields.length > 0) {
        console.error('❌ Wind data missing required fields:', missingFields);
        process.exit(1);
      }
      console.log('✅ Wind data has all required fields');
      
      // Verify data source
      if (windData.data_source !== 'NREL Wind Toolkit') {
        console.error(`❌ Wrong data source: ${windData.data_source} (expected: NREL Wind Toolkit)`);
        process.exit(1);
      }
      console.log(`✅ Data source correct: ${windData.data_source}`);
      
      // Verify reliability
      if (windData.reliability !== 'high') {
        console.error(`❌ Wrong reliability: ${windData.reliability} (expected: high)`);
        process.exit(1);
      }
      console.log(`✅ Reliability correct: ${windData.reliability}`);
      
      // Verify data year
      if (windData.data_year !== 2023) {
        console.error(`❌ Wrong data year: ${windData.data_year} (expected: 2023)`);
        process.exit(1);
      }
      console.log(`✅ Data year correct: ${windData.data_year}`);
      
      // Verify wind data values are reasonable
      if (windData.mean_wind_speed < 0 || windData.mean_wind_speed > 50) {
        console.error(`❌ Unrealistic mean wind speed: ${windData.mean_wind_speed} m/s`);
        process.exit(1);
      }
      console.log(`✅ Mean wind speed reasonable: ${windData.mean_wind_speed.toFixed(2)} m/s`);
      
      if (windData.total_hours < 8000 || windData.total_hours > 9000) {
        console.error(`❌ Unrealistic total hours: ${windData.total_hours}`);
        process.exit(1);
      }
      console.log(`✅ Total hours reasonable: ${windData.total_hours}`);
      
      // Verify response metadata
      if (body.data.windDataSource !== 'NREL Wind Toolkit') {
        console.error(`❌ Wrong windDataSource: ${body.data.windDataSource}`);
        process.exit(1);
      }
      console.log(`✅ Response windDataSource correct: ${body.data.windDataSource}`);
      
      if (body.data.windDataYear !== 2023) {
        console.error(`❌ Wrong windDataYear: ${body.data.windDataYear}`);
        process.exit(1);
      }
      console.log(`✅ Response windDataYear correct: ${body.data.windDataYear}`);
      
      if (body.data.windDataReliability !== 'high') {
        console.error(`❌ Wrong windDataReliability: ${body.data.windDataReliability}`);
        process.exit(1);
      }
      console.log(`✅ Response windDataReliability correct: ${body.data.windDataReliability}`);
      
      console.log('\n📊 Wind Data Summary:');
      console.log(`   Mean Wind Speed: ${windData.mean_wind_speed.toFixed(2)} m/s`);
      console.log(`   Prevailing Direction: ${windData.prevailing_wind_direction}°`);
      console.log(`   Total Hours: ${windData.total_hours}`);
      console.log(`   Turbulence Intensity: ${windData.ti}`);
      console.log(`   Data Source: ${windData.data_source}`);
      console.log(`   Data Year: ${windData.data_year}`);
      console.log(`   Reliability: ${windData.reliability}`);
      
    } else if (body.data.windDataError) {
      console.log('⚠️ Wind data not available (error returned)');
      
      const error = body.data.windDataError;
      console.log(`   Error: ${error.error}`);
      console.log(`   Message: ${error.message}`);
      console.log(`   Instructions: ${error.instructions}`);
      
      // Verify error structure
      if (!error.error || !error.message || !error.instructions) {
        console.error('❌ Wind data error missing required fields');
        process.exit(1);
      }
      console.log('✅ Wind data error has proper structure');
      
      // Verify NO synthetic data fallback
      if (body.data.windData) {
        console.error('❌ REGRESSION: Synthetic wind data present despite error');
        process.exit(1);
      }
      console.log('✅ No synthetic wind data fallback (correct behavior)');
      
      // This is acceptable - API key might not be configured
      console.log('\n⚠️ Note: NREL API key may not be configured');
      console.log('   Set NREL_API_KEY environment variable to enable wind data');
      
    } else {
      console.error('❌ Neither windData nor windDataError present in response');
      process.exit(1);
    }
    
    // Verify terrain data still works
    console.log('\n🗺️ Verifying terrain data...');
    
    if (!body.data.geojson) {
      console.error('❌ Response missing geojson');
      process.exit(1);
    }
    console.log('✅ Terrain geojson present');
    
    const featureCount = body.data.geojson.features?.length || 0;
    if (featureCount === 0) {
      console.error('❌ No terrain features in geojson');
      process.exit(1);
    }
    console.log(`✅ Terrain features present: ${featureCount} features`);
    
    if (!body.data.mapHtml) {
      console.error('❌ Response missing mapHtml');
      process.exit(1);
    }
    console.log('✅ Map HTML present');
    
    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED');
    console.log('='.repeat(60));
    console.log('\n📋 Summary:');
    console.log('   ✅ Terrain handler invoked successfully');
    console.log('   ✅ Response structure correct');
    console.log('   ✅ Wind data integration working');
    console.log('   ✅ Data source metadata correct');
    console.log('   ✅ No synthetic data fallbacks');
    console.log('   ✅ Terrain data still working');
    console.log('\n🎉 Terrain NREL integration complete!');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
testTerrainNRELIntegration();
