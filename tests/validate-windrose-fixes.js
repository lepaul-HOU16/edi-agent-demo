/**
 * Validation test for WindRose UI fixes
 * Tests that backend returns correct Plotly format and no duplicate titles
 */

const { LambdaClient, InvokeCommand, ListFunctionsCommand } = require('@aws-sdk/client-lambda');

const lambdaClient = new LambdaClient({});

async function validateWindRoseFixes() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 WINDROSE UI FIXES VALIDATION');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Find simulation Lambda
  const listResponse = await lambdaClient.send(new ListFunctionsCommand({}));
  const simulationFunction = listResponse.Functions?.find(fn => 
    fn.FunctionName?.toLowerCase().includes('simulation') &&
    fn.FunctionName?.toLowerCase().includes('renewable')
  );
  
  if (!simulationFunction) {
    console.log('❌ Simulation Lambda not found');
    return;
  }
  
  console.log(`✅ Found simulation Lambda: ${simulationFunction.FunctionName}\n`);
  
  // Test 1: Validate Plotly Format
  console.log('📋 Test 1: Plotly Format Validation');
  console.log('   Testing wind rose analysis returns correct Plotly format...\n');
  
  const windRosePayload = {
    action: 'wind_rose',
    parameters: {
      project_id: 'validation-test',
      latitude: 30.2672,
      longitude: -97.7431
    }
  };
  
  try {
    const command = new InvokeCommand({
      FunctionName: simulationFunction.FunctionName,
      Payload: JSON.stringify(windRosePayload)
    });
    
    const response = await lambdaClient.send(command);
    const result = JSON.parse(new TextDecoder().decode(response.Payload));
    const body = JSON.parse(result.body);
    
    console.log(`   Response success: ${body.success}`);
    console.log(`   Response type: ${body.type}`);
    
    if (!body.success) {
      console.log(`   ❌ Request failed: ${body.error}`);
      return;
    }
    
    // Validate Plotly format
    const data = body.data;
    let plotlyFormatValid = true;
    let errors = [];
    
    // Check 1: plotlyWindRose exists
    if (!data.plotlyWindRose) {
      plotlyFormatValid = false;
      errors.push('Missing plotlyWindRose object');
    } else {
      console.log('   ✅ plotlyWindRose object present');
      
      // Check 2: Has data array
      if (!data.plotlyWindRose.data || !Array.isArray(data.plotlyWindRose.data)) {
        plotlyFormatValid = false;
        errors.push('Missing or invalid plotlyWindRose.data array');
      } else {
        console.log(`   ✅ plotlyWindRose.data array present (${data.plotlyWindRose.data.length} traces)`);
      }
      
      // Check 3: Has layout object
      if (!data.plotlyWindRose.layout || typeof data.plotlyWindRose.layout !== 'object') {
        plotlyFormatValid = false;
        errors.push('Missing or invalid plotlyWindRose.layout object');
      } else {
        console.log('   ✅ plotlyWindRose.layout object present');
      }
      
      // Check 4: Has statistics
      if (!data.plotlyWindRose.statistics) {
        plotlyFormatValid = false;
        errors.push('Missing plotlyWindRose.statistics');
      } else {
        console.log('   ✅ plotlyWindRose.statistics present');
      }
      
      // Check 5: Has data source metadata
      if (data.plotlyWindRose.dataSource) {
        console.log(`   ✅ Data source: ${data.plotlyWindRose.dataSource}`);
      }
      
      if (data.plotlyWindRose.dataYear) {
        console.log(`   ✅ Data year: ${data.plotlyWindRose.dataYear}`);
      }
    }
    
    // Check 6: No legacy windRoseData array
    if (data.windRoseData) {
      console.log('   ⚠️  Legacy windRoseData array still present (should be removed)');
    } else {
      console.log('   ✅ No legacy windRoseData array');
    }
    
    console.log('\n' + '─'.repeat(60) + '\n');
    
    // Test 2: Validate No Duplicate Titles
    console.log('📋 Test 2: Duplicate Title Check');
    console.log('   Checking for duplicate title fields...\n');
    
    const dataStr = JSON.stringify(data);
    const titleMatches = dataStr.match(/"title":/g) || [];
    const subtitleMatches = dataStr.match(/"subtitle":/g) || [];
    
    console.log(`   Title fields found: ${titleMatches.length}`);
    console.log(`   Subtitle fields found: ${subtitleMatches.length}`);
    
    let duplicateTitlesValid = true;
    
    // Should have exactly 1 title field
    if (titleMatches.length > 1) {
      duplicateTitlesValid = false;
      console.log(`   ❌ Multiple title fields detected (expected 1, found ${titleMatches.length})`);
    } else if (titleMatches.length === 1) {
      console.log('   ✅ Single title field (correct)');
    }
    
    // Subtitle should be removed or minimal
    if (subtitleMatches.length > 0) {
      console.log(`   ⚠️  Subtitle field present (${subtitleMatches.length})`);
    } else {
      console.log('   ✅ No subtitle field');
    }
    
    // Check for title in nested objects
    if (data.visualizations) {
      const vizStr = JSON.stringify(data.visualizations);
      const vizTitles = vizStr.match(/"title":/g) || [];
      if (vizTitles.length > 0) {
        duplicateTitlesValid = false;
        console.log(`   ❌ Found ${vizTitles.length} title(s) in visualizations (should be 0)`);
      } else {
        console.log('   ✅ No titles in visualizations');
      }
    }
    
    console.log('\n' + '─'.repeat(60) + '\n');
    
    // Test 3: Validate Error Handling
    console.log('📋 Test 3: Error Handling Validation');
    console.log('   Checking error response structure...\n');
    
    // Test with invalid coordinates
    const invalidPayload = {
      action: 'wind_rose',
      parameters: {
        project_id: 'error-test'
        // Missing latitude and longitude
      }
    };
    
    try {
      const errorCommand = new InvokeCommand({
        FunctionName: simulationFunction.FunctionName,
        Payload: JSON.stringify(invalidPayload)
      });
      
      const errorResponse = await lambdaClient.send(errorCommand);
      const errorResult = JSON.parse(new TextDecoder().decode(errorResponse.Payload));
      const errorBody = JSON.parse(errorResult.body);
      
      if (!errorBody.success && errorBody.error) {
        console.log('   ✅ Error response structure correct');
        console.log(`   Error message: ${errorBody.error}`);
        if (errorBody.errorCategory) {
          console.log(`   Error category: ${errorBody.errorCategory}`);
        }
      } else {
        console.log('   ❌ Error response structure incorrect');
      }
    } catch (e) {
      console.log(`   ⚠️  Error test failed: ${e.message}`);
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('📊 VALIDATION SUMMARY');
    console.log('═'.repeat(60) + '\n');
    
    console.log(`Plotly Format: ${plotlyFormatValid ? '✅ PASS' : '❌ FAIL'}`);
    if (errors.length > 0) {
      errors.forEach(err => console.log(`  - ${err}`));
    }
    
    console.log(`Duplicate Titles: ${duplicateTitlesValid ? '✅ PASS' : '❌ FAIL'}`);
    
    const allTestsPass = plotlyFormatValid && duplicateTitlesValid;
    
    console.log('\n' + '═'.repeat(60));
    if (allTestsPass) {
      console.log('✅ ALL VALIDATIONS PASSED');
      console.log('WindRose UI fixes are working correctly!');
    } else {
      console.log('❌ SOME VALIDATIONS FAILED');
      console.log('Please review the errors above and fix the issues.');
    }
    console.log('═'.repeat(60));
    
  } catch (error) {
    console.error(`\n❌ Validation error: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

validateWindRoseFixes().catch(console.error);
