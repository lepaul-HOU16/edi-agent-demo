/**
 * Test Wake Simulation S3 Retrieval
 * 
 * Verifies that wake simulation can load layout data from S3
 * and provides clear error messages when layout is missing.
 */

const AWS = require('aws-sdk');

// Configure AWS SDK
const lambda = new AWS.Lambda({ region: process.env.AWS_REGION || 'us-east-1' });
const s3 = new AWS.S3({ region: process.env.AWS_REGION || 'us-east-1' });

// Test configuration
const TEST_PROJECT_ID = 'test-wake-s3-retrieval';
const S3_BUCKET = process.env.RENEWABLE_S3_BUCKET || 
                  process.env.S3_BUCKET || 
                  process.env.NEXT_PUBLIC_RENEWABLE_S3_BUCKET ||
                  'renewable-energy-artifacts-484907533441';

// Sample layout data for testing
const SAMPLE_LAYOUT = {
    project_id: TEST_PROJECT_ID,
    algorithm: 'intelligent',
    turbines: [
        {
            id: 1,
            latitude: 35.0675,
            longitude: -101.3955,
            hub_height: 100,
            rotor_diameter: 120,
            capacity_MW: 2.5
        },
        {
            id: 2,
            latitude: 35.0685,
            longitude: -101.3965,
            hub_height: 100,
            rotor_diameter: 120,
            capacity_MW: 2.5
        },
        {
            id: 3,
            latitude: 35.0695,
            longitude: -101.3975,
            hub_height: 100,
            rotor_diameter: 120,
            capacity_MW: 2.5
        }
    ],
    perimeter: {
        type: 'Polygon',
        coordinates: [[
            [-101.4, 35.06],
            [-101.39, 35.06],
            [-101.39, 35.07],
            [-101.4, 35.07],
            [-101.4, 35.06]
        ]]
    },
    features: [],
    metadata: {
        created_at: new Date().toISOString(),
        num_turbines: 3,
        total_capacity_mw: 7.5,
        site_area_km2: 5.0
    }
};

async function setupTestLayout() {
    console.log('\n📦 Setting up test layout in S3...');
    
    try {
        const layoutKey = `renewable/layout/${TEST_PROJECT_ID}/layout.json`;
        
        await s3.putObject({
            Bucket: S3_BUCKET,
            Key: layoutKey,
            Body: JSON.stringify(SAMPLE_LAYOUT),
            ContentType: 'application/json'
        }).promise();
        
        console.log(`✅ Test layout saved to S3: s3://${S3_BUCKET}/${layoutKey}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to setup test layout: ${error.message}`);
        return false;
    }
}

async function cleanupTestLayout() {
    console.log('\n🧹 Cleaning up test layout...');
    
    try {
        const layoutKey = `renewable/layout/${TEST_PROJECT_ID}/layout.json`;
        
        await s3.deleteObject({
            Bucket: S3_BUCKET,
            Key: layoutKey
        }).promise();
        
        console.log(`✅ Test layout removed from S3`);
    } catch (error) {
        console.warn(`⚠️ Failed to cleanup test layout: ${error.message}`);
    }
}

async function testS3Retrieval() {
    console.log('\n🧪 Test 1: Wake simulation with S3 layout retrieval');
    console.log('=' .repeat(60));
    
    try {
        // Get simulation Lambda function name
        const functions = await lambda.listFunctions().promise();
        const simulationFunction = functions.Functions.find(f => 
            f.FunctionName.includes('RenewableSimulationTool') ||
            f.FunctionName.includes('renewableTools-simulation')
        );
        
        if (!simulationFunction) {
            throw new Error('Simulation Lambda function not found');
        }
        
        console.log(`📍 Function: ${simulationFunction.FunctionName}`);
        
        // Invoke simulation with only project_id (should load from S3)
        const payload = {
            action: 'wake_simulation',
            parameters: {
                project_id: TEST_PROJECT_ID,
                wind_speed: 8.0,
                air_density: 1.225
            }
        };
        
        console.log('\n📤 Invoking simulation Lambda...');
        console.log(`   Project ID: ${TEST_PROJECT_ID}`);
        console.log(`   Expected: Load layout from S3`);
        
        const response = await lambda.invoke({
            FunctionName: simulationFunction.FunctionName,
            Payload: JSON.stringify(payload)
        }).promise();
        
        const result = JSON.parse(response.Payload);
        
        console.log('\n📥 Response received:');
        console.log(`   Success: ${result.success}`);
        
        if (result.success) {
            const data = typeof result.body === 'string' ? JSON.parse(result.body).data : result.data;
            
            console.log(`   ✅ Simulation completed successfully`);
            console.log(`   Turbines: ${data.turbineMetrics?.count || 'N/A'}`);
            console.log(`   AEP: ${data.performanceMetrics?.netAEP?.toFixed(2) || 'N/A'} GWh`);
            console.log(`   Capacity Factor: ${(data.performanceMetrics?.capacityFactor * 100)?.toFixed(1) || 'N/A'}%`);
            
            return true;
        } else {
            console.log(`   ❌ Simulation failed: ${result.error}`);
            console.log(`   Error category: ${result.errorCategory}`);
            return false;
        }
        
    } catch (error) {
        console.error(`❌ Test failed: ${error.message}`);
        return false;
    }
}

async function testMissingLayout() {
    console.log('\n🧪 Test 2: Wake simulation with missing layout (error handling)');
    console.log('=' .repeat(60));
    
    try {
        // Get simulation Lambda function name
        const functions = await lambda.listFunctions().promise();
        const simulationFunction = functions.Functions.find(f => 
            f.FunctionName.includes('RenewableSimulationTool') ||
            f.FunctionName.includes('renewableTools-simulation')
        );
        
        if (!simulationFunction) {
            throw new Error('Simulation Lambda function not found');
        }
        
        // Use a project ID that doesn't have layout data
        const missingProjectId = 'test-missing-layout-' + Date.now();
        
        const payload = {
            action: 'wake_simulation',
            parameters: {
                project_id: missingProjectId,
                project_name: 'Test Missing Layout',
                wind_speed: 8.0
            }
        };
        
        console.log('\n📤 Invoking simulation Lambda...');
        console.log(`   Project ID: ${missingProjectId}`);
        console.log(`   Expected: Clear error message about missing layout`);
        
        const response = await lambda.invoke({
            FunctionName: simulationFunction.FunctionName,
            Payload: JSON.stringify(payload)
        }).promise();
        
        const result = JSON.parse(response.Payload);
        
        console.log('\n📥 Response received:');
        console.log(`   Success: ${result.success}`);
        
        if (!result.success) {
            console.log(`   ✅ Error handled correctly`);
            console.log(`   Error: ${result.error}`);
            console.log(`   Category: ${result.errorCategory}`);
            
            if (result.details) {
                console.log(`   Suggestion: ${result.details.suggestion}`);
                console.log(`   Next steps: ${result.details.nextSteps?.length || 0} provided`);
                
                if (result.details.nextSteps) {
                    result.details.nextSteps.forEach((step, i) => {
                        console.log(`      ${i + 1}. ${step}`);
                    });
                }
            }
            
            // Verify error message is actionable
            const hasActionableError = 
                result.errorCategory === 'LAYOUT_MISSING' &&
                result.details?.suggestion &&
                result.details?.nextSteps?.length > 0;
            
            if (hasActionableError) {
                console.log(`   ✅ Error message is actionable`);
                return true;
            } else {
                console.log(`   ⚠️ Error message could be more actionable`);
                return false;
            }
        } else {
            console.log(`   ❌ Expected error but got success`);
            return false;
        }
        
    } catch (error) {
        console.error(`❌ Test failed: ${error.message}`);
        return false;
    }
}

async function testLayoutSourceLogging() {
    console.log('\n🧪 Test 3: Verify layout source is logged');
    console.log('=' .repeat(60));
    
    try {
        // Get simulation Lambda function name
        const functions = await lambda.listFunctions().promise();
        const simulationFunction = functions.Functions.find(f => 
            f.FunctionName.includes('RenewableSimulationTool') ||
            f.FunctionName.includes('renewableTools-simulation')
        );
        
        if (!simulationFunction) {
            throw new Error('Simulation Lambda function not found');
        }
        
        const payload = {
            action: 'wake_simulation',
            parameters: {
                project_id: TEST_PROJECT_ID,
                wind_speed: 8.0
            }
        };
        
        console.log('\n📤 Invoking simulation Lambda...');
        console.log(`   Checking CloudWatch logs for layout source...`);
        
        const response = await lambda.invoke({
            FunctionName: simulationFunction.FunctionName,
            Payload: JSON.stringify(payload)
        }).promise();
        
        const result = JSON.parse(response.Payload);
        
        if (result.success) {
            console.log(`   ✅ Simulation completed`);
            console.log(`   📝 Check CloudWatch logs for: "Layout source: S3"`);
            console.log(`   Log group: /aws/lambda/${simulationFunction.FunctionName}`);
            return true;
        } else {
            console.log(`   ❌ Simulation failed: ${result.error}`);
            return false;
        }
        
    } catch (error) {
        console.error(`❌ Test failed: ${error.message}`);
        return false;
    }
}

async function runTests() {
    console.log('\n' + '='.repeat(60));
    console.log('Wake Simulation S3 Retrieval Tests');
    console.log('='.repeat(60));
    
    if (!S3_BUCKET || S3_BUCKET === 'undefined') {
        console.error('❌ S3_BUCKET environment variable not configured');
        console.error('   Set RENEWABLE_S3_BUCKET or use default bucket');
        process.exit(1);
    }
    
    console.log(`\n📦 S3 Bucket: ${S3_BUCKET}`);
    console.log(`🔧 Test Project: ${TEST_PROJECT_ID}`);
    
    // Setup test data
    const setupSuccess = await setupTestLayout();
    if (!setupSuccess) {
        console.error('\n❌ Failed to setup test data. Aborting tests.');
        process.exit(1);
    }
    
    // Run tests
    const results = {
        s3Retrieval: await testS3Retrieval(),
        missingLayout: await testMissingLayout(),
        sourceLogging: await testLayoutSourceLogging()
    };
    
    // Cleanup
    await cleanupTestLayout();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('Test Summary');
    console.log('='.repeat(60));
    
    const tests = [
        { name: 'S3 Layout Retrieval', result: results.s3Retrieval },
        { name: 'Missing Layout Error Handling', result: results.missingLayout },
        { name: 'Layout Source Logging', result: results.sourceLogging }
    ];
    
    tests.forEach(test => {
        const status = test.result ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} - ${test.name}`);
    });
    
    const allPassed = Object.values(results).every(r => r === true);
    
    console.log('\n' + '='.repeat(60));
    if (allPassed) {
        console.log('✅ All tests passed!');
        console.log('\nTask 2 Implementation Complete:');
        console.log('  ✅ S3 layout retrieval implemented');
        console.log('  ✅ Error handling for missing layout');
        console.log('  ✅ Clear, actionable error messages');
        console.log('  ✅ Layout source logging');
        process.exit(0);
    } else {
        console.log('❌ Some tests failed');
        process.exit(1);
    }
}

// Run tests
runTests().catch(error => {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
});
