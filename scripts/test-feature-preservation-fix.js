/**
 * Test Feature Preservation Fix
 * 
 * Tests that the optimization logic preserves all terrain features
 * and does not sample feature arrays.
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { fromIni } from '@aws-sdk/credential-providers';

const region = 'us-east-1';

// Create Lambda client
const lambda = new LambdaClient({
  region,
  credentials: fromIni({ profile: process.env.AWS_PROFILE || 'default' })
});

// Test coordinates - NEW location to avoid cache
const testCoordinates = {
  // Austin, Texas - different from previous tests
  latitude: 30.2672,
  longitude: -97.7431
};

console.log('🧪 Testing Feature Preservation Fix');
console.log('=====================================\n');

console.log('📍 Test Location: Austin, Texas');
console.log(`   Coordinates: ${testCoordinates.latitude}, ${testCoordinates.longitude}`);
console.log('   Using NEW location to ensure fresh data (no cache)\n');

async function testFeaturePreservation() {
  try {
    // Step 1: Invoke orchestrator with terrain analysis request
    console.log('📤 Step 1: Invoking renewable orchestrator...');
    
    const projectId = `test-feature-preservation-${Date.now()}`;
    console.log(`   Project ID: ${projectId}`);
    
    const payload = {
      query: `Analyze terrain for wind farm at ${testCoordinates.latitude}, ${testCoordinates.longitude}`,
      projectId: projectId,
      chatSessionId: 'test-session-feature-preservation'
    };
    
    // Get the actual function name from AWS
    const { ListFunctionsCommand } = await import('@aws-sdk/client-lambda');
    const listCommand = new ListFunctionsCommand({});
    const listResponse = await lambda.send(listCommand);
    
    const orchestratorFunction = listResponse.Functions?.find(f => 
      f.FunctionName?.includes('renewableOrchestrator') || 
      f.FunctionName?.includes('renewableOrchestratorlam')
    );
    
    if (!orchestratorFunction) {
      console.log('Available functions:', listResponse.Functions?.map(f => f.FunctionName));
      throw new Error('Renewable orchestrator function not found');
    }
    
    console.log(`   Function: ${orchestratorFunction.FunctionName}`);
    
    const command = new InvokeCommand({
      FunctionName: orchestratorFunction.FunctionName,
      Payload: JSON.stringify(payload)
    });
    
    console.log('   Waiting for response...\n');
    const response = await lambda.send(command);
    
    // Parse response
    const responsePayload = JSON.parse(new TextDecoder().decode(response.Payload));
    console.log('✅ Orchestrator response received\n');
    
    // Step 2: Analyze response for feature preservation
    console.log('📊 Step 2: Analyzing feature preservation...\n');
    
    if (responsePayload.statusCode === 200) {
      const body = JSON.parse(responsePayload.body);
      
      console.log('Response structure:');
      console.log(`   - Success: ${body.success}`);
      console.log(`   - Message length: ${body.message?.length || 0} chars`);
      console.log(`   - Artifacts: ${body.artifacts?.length || 0}\n`);
      
      if (body.artifacts && body.artifacts.length > 0) {
        const terrainArtifact = body.artifacts[0];
        
        console.log('Terrain Artifact Analysis:');
        console.log(`   - Type: ${terrainArtifact.messageContentType}`);
        console.log(`   - Project ID: ${terrainArtifact.projectId}`);
        
        // Check metrics
        if (terrainArtifact.metrics) {
          console.log(`\n📈 Metrics:`);
          console.log(`   - Total Features (reported): ${terrainArtifact.metrics.totalFeatures}`);
          console.log(`   - Features by type:`, terrainArtifact.metrics.featuresByType);
        }
        
        // Check actual feature arrays
        let actualFeatureCount = 0;
        
        if (terrainArtifact.geojson?.features) {
          actualFeatureCount = terrainArtifact.geojson.features.length;
          console.log(`\n✅ GeoJSON Features:`);
          console.log(`   - Count: ${actualFeatureCount}`);
          console.log(`   - Sample feature types:`, 
            terrainArtifact.geojson.features.slice(0, 5).map(f => f.properties?.feature_type)
          );
        }
        
        if (terrainArtifact.exclusionZones) {
          console.log(`\n✅ Exclusion Zones:`);
          console.log(`   - Count: ${terrainArtifact.exclusionZones.length}`);
        }
        
        // Validation
        console.log(`\n🔍 Validation Results:`);
        
        const expectedFeatures = terrainArtifact.metrics?.totalFeatures || 0;
        const actualFeatures = actualFeatureCount;
        
        if (expectedFeatures === actualFeatures) {
          console.log(`   ✅ PASS: Feature count matches!`);
          console.log(`      Expected: ${expectedFeatures}`);
          console.log(`      Actual: ${actualFeatures}`);
          console.log(`      Difference: 0 (perfect preservation)`);
        } else {
          console.log(`   ❌ FAIL: Feature count mismatch!`);
          console.log(`      Expected: ${expectedFeatures}`);
          console.log(`      Actual: ${actualFeatures}`);
          console.log(`      Lost: ${expectedFeatures - actualFeatures} features`);
          console.log(`      Preservation rate: ${((actualFeatures / expectedFeatures) * 100).toFixed(1)}%`);
        }
        
        // Check if features have proper structure
        if (terrainArtifact.geojson?.features && terrainArtifact.geojson.features.length > 0) {
          const sampleFeature = terrainArtifact.geojson.features[0];
          const hasType = sampleFeature.type === 'Feature';
          const hasGeometry = sampleFeature.geometry && typeof sampleFeature.geometry === 'object';
          const hasProperties = sampleFeature.properties && typeof sampleFeature.properties === 'object';
          
          console.log(`\n🔍 Feature Structure Validation:`);
          console.log(`   - Has 'type' field: ${hasType ? '✅' : '❌'}`);
          console.log(`   - Has 'geometry' field: ${hasGeometry ? '✅' : '❌'}`);
          console.log(`   - Has 'properties' field: ${hasProperties ? '✅' : '❌'}`);
          
          if (hasType && hasGeometry && hasProperties) {
            console.log(`   ✅ PASS: Features have correct GeoJSON structure`);
          } else {
            console.log(`   ❌ FAIL: Features missing required fields`);
          }
        }
        
        // Overall result
        console.log('\n' + '='.repeat(60));
        if (expectedFeatures === actualFeatures && actualFeatures > 100) {
          console.log('✅ TEST PASSED: Feature preservation is working correctly!');
          console.log(`   All ${actualFeatures} features were preserved without sampling.`);
        } else if (actualFeatures < 100) {
          console.log('⚠️  TEST WARNING: Low feature count detected');
          console.log(`   Only ${actualFeatures} features found. This may indicate:`);
          console.log('   - Sparse area with few OSM features');
          console.log('   - Data filtering issues');
          console.log('   - API rate limiting');
        } else {
          console.log('❌ TEST FAILED: Features were lost during processing');
          console.log(`   ${expectedFeatures - actualFeatures} features were lost.`);
          console.log('   Check CloudWatch logs for optimization details.');
        }
        console.log('='.repeat(60));
        
      } else {
        console.log('❌ No artifacts found in response');
      }
      
    } else {
      console.log('❌ Orchestrator returned error:');
      console.log(JSON.stringify(responsePayload, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    if (error.message) {
      console.error('   Message:', error.message);
    }
    process.exit(1);
  }
}

// Run test
testFeaturePreservation();
