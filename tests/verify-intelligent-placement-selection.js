#!/usr/bin/env node

/**
 * Test: Verify Intelligent Placement Algorithm Selection
 * 
 * This test verifies that the layout handler correctly selects:
 * - Intelligent placement when OSM features exist
 * - Grid layout fallback when OSM features are unavailable
 * 
 * Requirements tested: 2.1, 2.2, 2.3, 2.4, 2.5
 */

const AWS = require('aws-sdk');
const lambda = new AWS.Lambda({ region: process.env.AWS_REGION || 'us-east-1' });

// Test scenarios
const scenarios = [
  {
    name: 'Scenario 1: OSM features available - should use intelligent placement',
    event: {
      parameters: {
        latitude: 35.0,
        longitude: -101.0,
        num_turbines: 10,
        project_id: 'test-intelligent-placement'
      },
      project_context: {
        coordinates: {
          latitude: 35.0,
          longitude: -101.0
        },
        terrain_results: {
          exclusionZones: {
            buildings: [
              {
                geometry: {
                  type: 'Polygon',
                  coordinates: [[
                    [-101.01, 35.01],
                    [-101.00, 35.01],
                    [-101.00, 35.00],
                    [-101.01, 35.00],
                    [-101.01, 35.01]
                  ]]
                },
                properties: { type: 'building' }
              }
            ],
            roads: [
              {
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [-101.02, 35.02],
                    [-101.01, 35.01]
                  ]
                },
                properties: { type: 'road' }
              }
            ],
            waterBodies: []
          },
          geojson: {
            features: [
              {
                geometry: {
                  type: 'Polygon',
                  coordinates: [[
                    [-101.01, 35.01],
                    [-101.00, 35.01],
                    [-101.00, 35.00],
                    [-101.01, 35.00],
                    [-101.01, 35.01]
                  ]]
                },
                properties: { type: 'building' }
              }
            ]
          }
        }
      }
    },
    expectedAlgorithm: 'intelligent_osm_aware'
  },
  {
    name: 'Scenario 2: No OSM features - should use grid fallback',
    event: {
      parameters: {
        latitude: 35.0,
        longitude: -101.0,
        num_turbines: 10,
        project_id: 'test-grid-fallback'
      },
      project_context: {
        coordinates: {
          latitude: 35.0,
          longitude: -101.0
        },
        terrain_results: {
          exclusionZones: {
            buildings: [],
            roads: [],
            waterBodies: []
          },
          geojson: {
            features: []
          }
        }
      }
    },
    expectedAlgorithm: 'grid'
  },
  {
    name: 'Scenario 3: No terrain data at all - should use grid fallback',
    event: {
      parameters: {
        latitude: 35.0,
        longitude: -101.0,
        num_turbines: 10,
        project_id: 'test-no-terrain'
      },
      project_context: {
        coordinates: {
          latitude: 35.0,
          longitude: -101.0
        }
      }
    },
    expectedAlgorithm: 'grid'
  }
];

async function testAlgorithmSelection() {
  console.log('🧪 Testing Intelligent Placement Algorithm Selection\n');
  console.log('=' .repeat(70));
  
  // Get Lambda function name
  const functionName = process.env.LAYOUT_LAMBDA_NAME || 
    (await findLayoutLambda());
  
  if (!functionName) {
    console.error('❌ Could not find layout Lambda function');
    console.error('   Set LAYOUT_LAMBDA_NAME environment variable or ensure Lambda is deployed');
    process.exit(1);
  }
  
  console.log(`📍 Testing Lambda: ${functionName}\n`);
  
  let passCount = 0;
  let failCount = 0;
  
  for (const scenario of scenarios) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📋 ${scenario.name}`);
    console.log(`${'='.repeat(70)}\n`);
    
    try {
      // Invoke Lambda
      console.log('🚀 Invoking Lambda...');
      const response = await lambda.invoke({
        FunctionName: functionName,
        Payload: JSON.stringify(scenario.event)
      }).promise();
      
      const result = JSON.parse(response.Payload);
      const body = JSON.parse(result.body);
      
      console.log(`📊 Response Status: ${result.statusCode}`);
      console.log(`📊 Success: ${body.success}`);
      
      if (body.success && body.data) {
        const actualAlgorithm = body.data.layoutType;
        console.log(`📊 Algorithm Used: ${actualAlgorithm}`);
        console.log(`📊 Expected Algorithm: ${scenario.expectedAlgorithm}`);
        
        if (actualAlgorithm === scenario.expectedAlgorithm) {
          console.log('✅ PASS: Correct algorithm selected');
          passCount++;
        } else {
          console.log('❌ FAIL: Wrong algorithm selected');
          console.log(`   Expected: ${scenario.expectedAlgorithm}`);
          console.log(`   Got: ${actualAlgorithm}`);
          failCount++;
        }
        
        // Show turbine count
        console.log(`📊 Turbines Placed: ${body.data.turbineCount}`);
        
      } else {
        console.log('❌ FAIL: Lambda returned error');
        console.log(`   Error: ${body.error || 'Unknown error'}`);
        failCount++;
      }
      
    } catch (error) {
      console.log('❌ FAIL: Exception during test');
      console.error(`   Error: ${error.message}`);
      failCount++;
    }
  }
  
  // Summary
  console.log(`\n${'='.repeat(70)}`);
  console.log('📊 TEST SUMMARY');
  console.log(`${'='.repeat(70)}`);
  console.log(`✅ Passed: ${passCount}/${scenarios.length}`);
  console.log(`❌ Failed: ${failCount}/${scenarios.length}`);
  
  if (failCount === 0) {
    console.log('\n🎉 All tests passed! Algorithm selection is working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️ Some tests failed. Review the output above.');
    process.exit(1);
  }
}

async function findLayoutLambda() {
  try {
    const lambdaClient = new AWS.Lambda({ region: process.env.AWS_REGION || 'us-east-1' });
    const functions = await lambdaClient.listFunctions().promise();
    
    const layoutLambda = functions.Functions.find(f => 
      f.FunctionName.includes('RenewableLayoutTool') ||
      f.FunctionName.includes('renewableTools-layout')
    );
    
    return layoutLambda ? layoutLambda.FunctionName : null;
  } catch (error) {
    console.error('Error finding Lambda:', error.message);
    return null;
  }
}

// Run tests
testAlgorithmSelection().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
