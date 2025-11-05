/**
 * Test script to verify all petrophysics tools work correctly
 * Tests porosity, shale volume, and saturation calculations
 */

const AWS = require('aws-sdk');
const lambda = new AWS.Lambda({ region: process.env.AWS_REGION || 'us-east-1' });

// Get Lambda function name from environment or use default pattern
const FUNCTION_NAME = process.env.PETROPHYSICS_FUNCTION_NAME || 
  'amplify-digitalassistant-petrophysicsCalculator';

async function testTool(toolName, parameters) {
  console.log(`\n🧪 Testing ${toolName}...`);
  
  const payload = {
    tool: toolName,
    parameters: parameters
  };
  
  try {
    const result = await lambda.invoke({
      FunctionName: FUNCTION_NAME,
      Payload: JSON.stringify(payload)
    }).promise();
    
    const response = JSON.parse(result.Payload);
    
    if (response.error) {
      console.error(`❌ ${toolName} FAILED:`, response.error);
      return false;
    }
    
    if (response.success && response.artifacts && response.artifacts.length > 0) {
      const artifact = response.artifacts[0];
      const curveData = artifact.results?.curveData;
      const stats = artifact.results?.statistics;
      
      console.log(`✅ ${toolName} SUCCESS`);
      console.log(`   Well: ${artifact.wellName}`);
      console.log(`   Method: ${artifact.results?.method}`);
      console.log(`   Statistics:`, {
        mean: stats?.mean?.toFixed(3),
        stdDev: stats?.stdDev?.toFixed(3),
        min: stats?.min?.toFixed(3),
        max: stats?.max?.toFixed(3)
      });
      
      if (curveData) {
        const curves = Object.keys(curveData);
        console.log(`   Curves: ${curves.join(', ')}`);
        console.log(`   Data points:`, curves.map(c => `${c}=${curveData[c]?.length || 0}`).join(', '));
        
        // Check for null values in output
        const hasNulls = curves.some(curveName => {
          const data = curveData[curveName] || [];
          return data.some(val => val === -999.25 || val === -9999);
        });
        
        if (hasNulls) {
          console.warn(`   ⚠️  WARNING: Null values (-999.25 or -9999) found in output!`);
          return false;
        } else {
          console.log(`   ✓ No null values in output`);
        }
      }
      
      return true;
    } else {
      console.error(`❌ ${toolName} FAILED: No artifacts returned`);
      return false;
    }
  } catch (error) {
    console.error(`❌ ${toolName} ERROR:`, error.message);
    return false;
  }
}

async function runTests() {
  console.log('🔬 Testing Petrophysics Tools Fix');
  console.log('==================================\n');
  console.log(`Lambda Function: ${FUNCTION_NAME}`);
  
  const testWell = 'SANDSTONE_RESERVOIR_001';
  
  const tests = [
    {
      name: 'calculate_porosity',
      params: { wellName: testWell, method: 'density' }
    },
    {
      name: 'calculate_shale_volume',
      params: { wellName: testWell, method: 'larionov_tertiary' }
    },
    {
      name: 'calculate_saturation',
      params: { wellName: testWell, method: 'archie' }
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const success = await testTool(test.name, test.params);
    results.push({ tool: test.name, success });
  }
  
  console.log('\n📊 Test Summary');
  console.log('===============');
  results.forEach(r => {
    console.log(`${r.success ? '✅' : '❌'} ${r.tool}`);
  });
  
  const allPassed = results.every(r => r.success);
  
  if (allPassed) {
    console.log('\n🎉 All tests PASSED!');
    console.log('All petrophysics tools are working correctly.');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests FAILED');
    console.log('Please check the errors above.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
