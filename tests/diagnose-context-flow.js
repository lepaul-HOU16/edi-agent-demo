#!/usr/bin/env node
/**
 * Diagnose Context Flow Issue
 * 
 * This test checks if terrain results are properly flowing from
 * terrain analysis to layout optimization within the same project.
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { execSync } = require('child_process');

const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

const TEST_LOCATION = {
  latitude: 40.7589,  // Times Square, NYC (high OSM density)
  longitude: -73.9851,
  radius_km: 1,
  name: "Times Square, NYC"
};

async function diagnoseContextFlow() {
  console.log('='.repeat(80));
  console.log('DIAGNOSING CONTEXT FLOW: Terrain → Layout');
  console.log('='.repeat(80));
  console.log();
  
  try {
    // Find orchestrator Lambda
    console.log('📋 Finding orchestrator Lambda...');
    const orchestratorName = execSync(
      `aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" --output text`,
      { encoding: 'utf-8' }
    ).trim();
    
    if (!orchestratorName) {
      throw new Error('Orchestrator Lambda not found');
    }
    console.log(`✅ Found: ${orchestratorName}`);
    console.log();
    
    // Generate unique project name
    const projectName = `context-flow-test-${Date.now()}`;
    console.log(`🆔 Project Name: ${projectName}`);
    console.log();
    
    // Step 1: Run terrain analysis
    console.log('─'.repeat(80));
    console.log('STEP 1: TERRAIN ANALYSIS');
    console.log('─'.repeat(80));
    
    const terrainPayload = {
      query: `Analyze terrain for wind farm at ${TEST_LOCATION.latitude}, ${TEST_LOCATION.longitude} for project ${projectName}`,
      context: {
        project_name: projectName
      }
    };
    
    console.log(`📤 Invoking terrain analysis...`);
    const terrainCommand = new InvokeCommand({
      FunctionName: orchestratorName,
      Payload: JSON.stringify(terrainPayload)
    });
    
    const terrainResponse = await lambda.send(terrainCommand);
    const terrainResult = JSON.parse(Buffer.from(terrainResponse.Payload).toString());
    
    console.log(`✅ Terrain analysis complete`);
    console.log();
    
    // Check terrain results
    if (terrainResult.success) {
      console.log(`✅ Terrain analysis successful`);
      
      // Check for artifacts
      if (terrainResult.artifacts && terrainResult.artifacts.length > 0) {
        console.log(`✅ Generated ${terrainResult.artifacts.length} artifact(s)`);
        
        const terrainArtifact = terrainResult.artifacts.find(a => a.type === 'wind_farm_terrain_analysis');
        if (terrainArtifact && terrainArtifact.data) {
          const data = terrainArtifact.data;
          console.log(`📊 Terrain Data:`, {
            features: data.geojson?.features?.length || 0,
            hasExclusionZones: !!data.exclusionZones,
            buildings: data.exclusionZones?.buildings?.length || 0,
            roads: data.exclusionZones?.roads?.length || 0,
            waterBodies: data.exclusionZones?.waterBodies?.length || 0
          });
        }
      } else {
        console.log(`⚠️  No artifacts generated`);
      }
    } else {
      console.log(`❌ Terrain analysis failed:`, terrainResult.message);
      return false;
    }
    console.log();
    
    // Wait a moment for data to be saved
    console.log('⏳ Waiting 2 seconds for data to be saved...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log();
    
    // Step 2: Run layout optimization in SAME project
    console.log('─'.repeat(80));
    console.log('STEP 2: LAYOUT OPTIMIZATION (SAME PROJECT)');
    console.log('─'.repeat(80));
    
    const layoutPayload = {
      query: `Optimize turbine layout at ${TEST_LOCATION.latitude}, ${TEST_LOCATION.longitude} for project ${projectName}`,
      context: {
        project_name: projectName
      }
    };
    
    console.log(`📤 Invoking layout optimization...`);
    const layoutCommand = new InvokeCommand({
      FunctionName: orchestratorName,
      Payload: JSON.stringify(layoutPayload)
    });
    
    const layoutResponse = await lambda.send(layoutCommand);
    const layoutResult = JSON.parse(Buffer.from(layoutResponse.Payload).toString());
    
    console.log(`✅ Layout optimization complete`);
    console.log();
    
    // Check layout results
    if (layoutResult.success) {
      console.log(`✅ Layout optimization successful`);
      
      // Check for artifacts
      if (layoutResult.artifacts && layoutResult.artifacts.length > 0) {
        console.log(`✅ Generated ${layoutResult.artifacts.length} artifact(s)`);
        
        const layoutArtifact = layoutResult.artifacts.find(a => a.type === 'wind_farm_layout');
        if (layoutArtifact && layoutArtifact.data) {
          const data = layoutArtifact.data;
          console.log(`📊 Layout Data:`, {
            algorithm: data.algorithm,
            turbines: data.turbine_count,
            capacity: data.total_capacity_mw,
            geoJsonFeatures: data.geojson?.features?.length || 0
          });
          
          // Check algorithm info
          if (data.algorithm_info) {
            console.log(`🎯 Algorithm Info:`, {
              type: data.algorithm_info.type,
              verification: data.algorithm_info.verification,
              constraintsApplied: data.algorithm_info.constraints_applied
            });
            
            // THIS IS THE KEY CHECK
            if (data.algorithm_info.constraints_applied === 0) {
              console.log();
              console.log('❌ PROBLEM FOUND: constraints_applied = 0');
              console.log('   This means terrain data is NOT reaching the layout algorithm!');
              console.log();
            } else {
              console.log();
              console.log(`✅ SUCCESS: ${data.algorithm_info.constraints_applied} constraints applied!`);
              console.log();
            }
          }
        }
      } else {
        console.log(`⚠️  No artifacts generated`);
      }
    } else {
      console.log(`❌ Layout optimization failed:`, layoutResult.message);
      return false;
    }
    console.log();
    
    // Check CloudWatch logs for context flow
    console.log('─'.repeat(80));
    console.log('STEP 3: CHECK CLOUDWATCH LOGS');
    console.log('─'.repeat(80));
    
    try {
      const logGroupName = `/aws/lambda/${orchestratorName}`;
      const logs = execSync(
        `aws logs tail ${logGroupName} --since 2m --format short`,
        { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
      ).toString();
      
      console.log('Recent orchestrator logs (project resolution):');
      const projectLines = logs.split('\n').filter(line => 
        line.includes('PROJECT CONTEXT RESOLUTION') ||
        line.includes('Resolved project name') ||
        line.includes('Loaded project') ||
        line.includes('No existing data')
      );
      
      projectLines.slice(-10).forEach(line => {
        console.log(`   ${line}`);
      });
      console.log();
      
      console.log('Recent orchestrator logs (terrain context):');
      const relevantLines = logs.split('\n').filter(line => 
        line.includes('terrain_results') || 
        line.includes('exclusionZones') ||
        line.includes('TOOL CONTEXT') ||
        line.includes('LAYOUT INVOCATION')
      );
      
      relevantLines.slice(-20).forEach(line => {
        console.log(`   ${line}`);
      });
      console.log();
    } catch (error) {
      console.log('⚠️  Could not analyze CloudWatch logs');
    }
    
    // Summary
    console.log('='.repeat(80));
    console.log('DIAGNOSIS SUMMARY');
    console.log('='.repeat(80));
    console.log();
    console.log('If you see "constraints_applied = 0", the issue is:');
    console.log('  1. Terrain results ARE being saved to the project');
    console.log('  2. BUT they are NOT being loaded when layout runs');
    console.log('  3. OR they are loaded but not passed correctly to the layout Lambda');
    console.log();
    console.log('Check the CloudWatch logs above for:');
    console.log('  - "Has terrain_results: true" in TOOL CONTEXT PREPARATION');
    console.log('  - "Has terrain_results: true" in LAYOUT INVOCATION');
    console.log('  - "Exclusion Zones Being Passed to Layout" with non-zero counts');
    console.log();
    
    return true;
    
  } catch (error) {
    console.error('❌ ERROR during diagnosis:', error);
    console.error(error.stack);
    return false;
  }
}

// Run diagnosis
if (require.main === module) {
  diagnoseContextFlow()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { diagnoseContextFlow };
