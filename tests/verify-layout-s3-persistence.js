#!/usr/bin/env node

/**
 * Verification Test: Layout S3 Persistence
 * 
 * Tests that layout optimization saves complete layout JSON to S3
 * with all required fields for wake simulation.
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });
const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

async function testLayoutS3Persistence() {
  console.log('\n🧪 Testing Layout S3 Persistence\n');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Find layout Lambda
    console.log('\n📍 Step 1: Finding layout Lambda...');
    const { execSync } = require('child_process');
    const layoutLambdaName = execSync(
      `aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableLayoutTool')].FunctionName" --output text`,
      { encoding: 'utf-8' }
    ).trim();
    
    if (!layoutLambdaName) {
      throw new Error('Layout Lambda not found');
    }
    console.log(`✅ Found layout Lambda: ${layoutLambdaName}`);
    
    // Step 2: Get S3 bucket name
    console.log('\n📍 Step 2: Getting S3 bucket name...');
    const bucketName = execSync(
      `aws lambda get-function-configuration --function-name "${layoutLambdaName}" --query "Environment.Variables.RENEWABLE_S3_BUCKET" --output text`,
      { encoding: 'utf-8' }
    ).trim();
    
    if (!bucketName || bucketName === 'None') {
      throw new Error('RENEWABLE_S3_BUCKET not configured');
    }
    console.log(`✅ S3 Bucket: ${bucketName}`);
    
    // Step 3: Invoke layout Lambda with test data
    console.log('\n📍 Step 3: Invoking layout Lambda...');
    const testProjectId = `test-layout-s3-${Date.now()}`;
    const testPayload = {
      parameters: {
        project_id: testProjectId,
        latitude: 35.0,
        longitude: -101.0,
        num_turbines: 5,
        turbine_model: 'GE 2.5-120',
        capacity_mw: 2.5,
        rotor_diameter: 120.0,
        spacing_d: 9.0
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
            type: 'FeatureCollection',
            features: []
          }
        }
      }
    };
    
    const invokeCommand = new InvokeCommand({
      FunctionName: layoutLambdaName,
      Payload: JSON.stringify(testPayload)
    });
    
    const invokeResponse = await lambda.send(invokeCommand);
    const responsePayload = JSON.parse(Buffer.from(invokeResponse.Payload).toString());
    
    // Handle both old format (with statusCode/body) and new format (direct response)
    let responseBody;
    if (responsePayload.statusCode) {
      console.log(`Status Code: ${responsePayload.statusCode}`);
      if (responsePayload.statusCode !== 200) {
        console.error('❌ Layout Lambda failed');
        console.error(JSON.stringify(responsePayload, null, 2));
        throw new Error('Layout Lambda invocation failed');
      }
      responseBody = JSON.parse(responsePayload.body);
    } else if (responsePayload.success) {
      // New format: direct response
      console.log('✅ Layout Lambda returned direct response');
      responseBody = responsePayload;
    } else {
      console.error('❌ Unexpected response format');
      console.error(JSON.stringify(responsePayload, null, 2));
      throw new Error('Unexpected response format');
    }
    
    console.log(`✅ Layout created: ${responseBody.data.turbineCount} turbines`);
    
    // Check if S3 key is in response
    if (responseBody.data.layoutS3Key) {
      console.log(`✅ Layout S3 key returned: ${responseBody.data.layoutS3Key}`);
    } else {
      console.warn('⚠️  No layoutS3Key in response (may be expected if S3 save failed)');
    }
    
    // Step 4: Verify layout JSON exists in S3
    console.log('\n📍 Step 4: Verifying layout JSON in S3...');
    const expectedS3Key = `renewable/layout/${testProjectId}/layout.json`;
    
    try {
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: expectedS3Key
      });
      
      const s3Response = await s3.send(getCommand);
      const layoutJson = await streamToString(s3Response.Body);
      const layoutData = JSON.parse(layoutJson);
      
      console.log(`✅ Layout JSON found in S3: ${expectedS3Key}`);
      
      // Step 5: Validate layout JSON structure
      console.log('\n📍 Step 5: Validating layout JSON structure...');
      
      const requiredFields = [
        'project_id',
        'algorithm',
        'turbines',
        'perimeter',
        'features',
        'metadata'
      ];
      
      const missingFields = requiredFields.filter(field => !(field in layoutData));
      
      if (missingFields.length > 0) {
        console.error(`❌ Missing required fields: ${missingFields.join(', ')}`);
        throw new Error('Layout JSON missing required fields');
      }
      
      console.log('✅ All required top-level fields present');
      
      // Validate turbines array
      if (!Array.isArray(layoutData.turbines)) {
        throw new Error('turbines is not an array');
      }
      console.log(`✅ Turbines array: ${layoutData.turbines.length} turbines`);
      
      // Validate turbine structure
      if (layoutData.turbines.length > 0) {
        const turbine = layoutData.turbines[0];
        const turbineFields = ['id', 'latitude', 'longitude', 'hub_height', 'rotor_diameter'];
        const missingTurbineFields = turbineFields.filter(field => !(field in turbine));
        
        if (missingTurbineFields.length > 0) {
          console.error(`❌ Turbine missing fields: ${missingTurbineFields.join(', ')}`);
          throw new Error('Turbine structure incomplete');
        }
        console.log('✅ Turbine structure valid');
      }
      
      // Validate perimeter
      if (!layoutData.perimeter || layoutData.perimeter.type !== 'Polygon') {
        throw new Error('Invalid perimeter structure');
      }
      console.log('✅ Perimeter polygon present');
      
      // Validate features array
      if (!Array.isArray(layoutData.features)) {
        throw new Error('features is not an array');
      }
      console.log(`✅ Features array: ${layoutData.features.length} OSM features`);
      
      // Validate metadata
      const metadataFields = ['created_at', 'num_turbines', 'total_capacity_mw', 'site_area_km2'];
      const missingMetadataFields = metadataFields.filter(field => !(field in layoutData.metadata));
      
      if (missingMetadataFields.length > 0) {
        console.error(`❌ Metadata missing fields: ${missingMetadataFields.join(', ')}`);
        throw new Error('Metadata incomplete');
      }
      console.log('✅ Metadata complete');
      
      // Step 6: Summary
      console.log('\n' + '='.repeat(60));
      console.log('✅ LAYOUT S3 PERSISTENCE TEST PASSED');
      console.log('='.repeat(60));
      console.log('\nLayout JSON Structure:');
      console.log(`  - Project ID: ${layoutData.project_id}`);
      console.log(`  - Algorithm: ${layoutData.algorithm}`);
      console.log(`  - Turbines: ${layoutData.turbines.length}`);
      console.log(`  - OSM Features: ${layoutData.features.length}`);
      console.log(`  - Perimeter: ${layoutData.perimeter.type}`);
      console.log(`  - Total Capacity: ${layoutData.metadata.total_capacity_mw} MW`);
      console.log(`  - Site Area: ${layoutData.metadata.site_area_km2.toFixed(2)} km²`);
      console.log(`  - Created: ${layoutData.metadata.created_at}`);
      console.log('\n✅ Wake simulation can now retrieve this layout data');
      
      return true;
      
    } catch (s3Error) {
      if (s3Error.name === 'NoSuchKey') {
        console.error(`❌ Layout JSON not found in S3: ${expectedS3Key}`);
        console.error('   Layout Lambda may have failed to save to S3');
      } else {
        console.error(`❌ S3 error: ${s3Error.message}`);
      }
      throw s3Error;
    }
    
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ LAYOUT S3 PERSISTENCE TEST FAILED');
    console.error('='.repeat(60));
    console.error(`\nError: ${error.message}`);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    return false;
  }
}

// Run test
testLayoutS3Persistence()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
