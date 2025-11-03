#!/usr/bin/env node
/**
 * Diagnose Current Failures
 * 
 * Systematically checks:
 * 1. Wake simulation failure
 * 2. Grid layout instead of intelligent placement
 * 3. Missing perimeter features
 */

const AWS = require('aws-sdk');
const lambda = new AWS.Lambda({ region: process.env.AWS_REGION || 'us-east-1' });
const s3 = new AWS.S3({ region: process.env.AWS_REGION || 'us-east-1' });

console.log('🔍 Diagnosing Current Failures\n');
console.log('=====================================\n');

async function checkLayoutLambda() {
    console.log('1. 📋 Checking Layout Lambda Deployment:');
    
    try {
        const functions = await lambda.listFunctions().promise();
        const layoutFunction = functions.Functions.find(f => 
            f.FunctionName.includes('RenewableLayoutTool')
        );
        
        if (!layoutFunction) {
            console.log('   ❌ Layout Lambda not found!\n');
            return null;
        }
        
        console.log(`   ✅ Found: ${layoutFunction.FunctionName}`);
        
        // Check environment variables
        const config = await lambda.getFunctionConfiguration({
            FunctionName: layoutFunction.FunctionName
        }).promise();
        
        console.log('   Environment Variables:');
        console.log(`      S3_BUCKET: ${config.Environment?.Variables?.S3_BUCKET || 'NOT SET'}`);
        console.log(`      PROJECT_ID: ${config.Environment?.Variables?.PROJECT_ID || 'NOT SET'}`);
        
        // Check last modified
        console.log(`   Last Modified: ${config.LastModified}`);
        console.log('');
        
        return layoutFunction.FunctionName;
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
        return null;
    }
}

async function testLayoutInvocation(functionName) {
    console.log('2. 🧪 Testing Layout Lambda Invocation:');
    
    const testPayload = {
        latitude: 35.067482,
        longitude: -101.395466,
        num_turbines: 10,
        project_id: 'test-project-123'
    };
    
    try {
        console.log('   Invoking with test payload...');
        const result = await lambda.invoke({
            FunctionName: functionName,
            Payload: JSON.stringify(testPayload)
        }).promise();
        
        const response = JSON.parse(result.Payload);
        console.log('   Response Status:', result.StatusCode);
        
        if (response.errorMessage) {
            console.log('   ❌ Error:', response.errorMessage);
            console.log('   Error Type:', response.errorType);
            console.log('');
            return null;
        }
        
        const body = JSON.parse(response.body);
        console.log('   ✅ Success!');
        console.log(`   Algorithm Used: ${body.algorithm || 'UNKNOWN'}`);
        console.log(`   Turbines Placed: ${body.turbines?.length || 0}`);
        console.log(`   Layout JSON Key: ${body.layout_json_s3_key || 'NOT SET'}`);
        console.log('');
        
        return body;
    } catch (error) {
        console.log(`   ❌ Invocation Error: ${error.message}\n`);
        return null;
    }
}

async function checkS3LayoutData(s3Key, bucketName) {
    console.log('3. 📦 Checking S3 Layout Data:');
    
    if (!s3Key) {
        console.log('   ⚠️  No S3 key provided\n');
        return null;
    }
    
    try {
        console.log(`   Bucket: ${bucketName}`);
        console.log(`   Key: ${s3Key}`);
        
        const object = await s3.getObject({
            Bucket: bucketName,
            Key: s3Key
        }).promise();
        
        const layoutData = JSON.parse(object.Body.toString());
        console.log('   ✅ Layout JSON found in S3');
        console.log(`   Turbines in JSON: ${layoutData.turbines?.length || 0}`);
        console.log(`   Has perimeter: ${!!layoutData.perimeter}`);
        console.log(`   Has features: ${!!layoutData.features}`);
        console.log('');
        
        return layoutData;
    } catch (error) {
        console.log(`   ❌ S3 Error: ${error.message}\n`);
        return null;
    }
}

async function checkSimulationLambda() {
    console.log('4. 🌪️  Checking Wake Simulation Lambda:');
    
    try {
        const functions = await lambda.listFunctions().promise();
        const simFunction = functions.Functions.find(f => 
            f.FunctionName.includes('RenewableSimulationTool')
        );
        
        if (!simFunction) {
            console.log('   ❌ Simulation Lambda not found!\n');
            return null;
        }
        
        console.log(`   ✅ Found: ${simFunction.FunctionName}`);
        
        // Check environment variables
        const config = await lambda.getFunctionConfiguration({
            FunctionName: simFunction.FunctionName
        }).promise();
        
        console.log('   Environment Variables:');
        console.log(`      S3_BUCKET: ${config.Environment?.Variables?.S3_BUCKET || 'NOT SET'}`);
        console.log(`      PROJECT_ID: ${config.Environment?.Variables?.PROJECT_ID || 'NOT SET'}`);
        console.log(`   Last Modified: ${config.LastModified}`);
        console.log('');
        
        return simFunction.FunctionName;
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
        return null;
    }
}

async function testSimulationWithLayout(functionName, layoutData) {
    console.log('5. 🧪 Testing Wake Simulation with Layout Data:');
    
    if (!layoutData) {
        console.log('   ⚠️  No layout data available for testing\n');
        return;
    }
    
    const testPayload = {
        project_id: 'test-project-123',
        layout_data: layoutData
    };
    
    try {
        console.log('   Invoking with layout data...');
        const result = await lambda.invoke({
            FunctionName: functionName,
            Payload: JSON.stringify(testPayload)
        }).promise();
        
        const response = JSON.parse(result.Payload);
        console.log('   Response Status:', result.StatusCode);
        
        if (response.errorMessage) {
            console.log('   ❌ Error:', response.errorMessage);
            console.log('   Error Type:', response.errorType);
            if (response.stackTrace) {
                console.log('   Stack Trace:', response.stackTrace.slice(0, 3).join('\n   '));
            }
            console.log('');
            return;
        }
        
        const body = JSON.parse(response.body);
        console.log('   ✅ Success!');
        console.log(`   AEP: ${body.aep || 'N/A'}`);
        console.log(`   Capacity Factor: ${body.capacity_factor || 'N/A'}`);
        console.log('');
    } catch (error) {
        console.log(`   ❌ Invocation Error: ${error.message}\n`);
    }
}

async function checkTerrainFeatures() {
    console.log('6. 🗺️  Checking Terrain Features:');
    
    try {
        const functions = await lambda.listFunctions().promise();
        const terrainFunction = functions.Functions.find(f => 
            f.FunctionName.includes('RenewableTerrainTool')
        );
        
        if (!terrainFunction) {
            console.log('   ❌ Terrain Lambda not found!\n');
            return;
        }
        
        console.log(`   ✅ Found: ${terrainFunction.FunctionName}`);
        
        // Test invocation
        const testPayload = {
            latitude: 35.067482,
            longitude: -101.395466,
            radius_km: 5
        };
        
        console.log('   Testing terrain analysis...');
        const result = await lambda.invoke({
            FunctionName: terrainFunction.FunctionName,
            Payload: JSON.stringify(testPayload)
        }).promise();
        
        const response = JSON.parse(result.Payload);
        
        if (response.errorMessage) {
            console.log('   ❌ Error:', response.errorMessage);
            console.log('');
            return;
        }
        
        const body = JSON.parse(response.body);
        console.log('   ✅ Success!');
        console.log(`   Features Count: ${body.features?.length || 0}`);
        console.log(`   Has Perimeter: ${!!body.perimeter}`);
        console.log(`   Perimeter Points: ${body.perimeter?.coordinates?.[0]?.length || 0}`);
        console.log('');
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
    }
}

async function main() {
    // Check layout
    const layoutFunctionName = await checkLayoutLambda();
    
    if (!layoutFunctionName) {
        console.log('❌ Cannot proceed without layout Lambda\n');
        return;
    }
    
    // Test layout invocation
    const layoutResult = await testLayoutInvocation(layoutFunctionName);
    
    // Check S3 data
    let layoutData = null;
    if (layoutResult?.layout_json_s3_key) {
        const bucketName = process.env.S3_BUCKET || 'amplify-digitalassistant-lepaul-renewableartifactsbucket';
        layoutData = await checkS3LayoutData(layoutResult.layout_json_s3_key, bucketName);
    }
    
    // Check simulation
    const simFunctionName = await checkSimulationLambda();
    
    if (simFunctionName && layoutData) {
        await testSimulationWithLayout(simFunctionName, layoutData);
    }
    
    // Check terrain features
    await checkTerrainFeatures();
    
    console.log('=====================================');
    console.log('📊 Diagnosis Summary:\n');
    console.log('Issues Found:');
    if (!layoutResult?.layout_json_s3_key) {
        console.log('   ❌ Layout not saving to S3');
    }
    if (layoutResult?.algorithm === 'grid') {
        console.log('   ❌ Using grid layout instead of intelligent placement');
    }
    if (!layoutData?.perimeter) {
        console.log('   ❌ Missing perimeter data');
    }
    console.log('');
}

main().catch(console.error);
