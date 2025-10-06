/**
 * Comprehensive Terrain Analysis Debugging Script
 * Traces the complete execution path from query -> routing -> tool -> artifacts
 */

import fetch from 'node-fetch';
import fs from 'fs';

// Load Amplify configuration
const amplifyConfig = JSON.parse(fs.readFileSync('amplify_outputs.json', 'utf8'));

const GRAPHQL_ENDPOINT = amplifyConfig.data.url;
const API_KEY = amplifyConfig.data.api_key;

console.log('🔍 TERRAIN ANALYSIS DEBUGGING - Complete Execution Path Trace');
console.log('========================================');

// Test the exact terrain analysis query that's failing
const testTerrainAnalysis = `
  mutation ProcessMessage($input: ProcessMessageInput!) {
    processMessage(input: $input) {
      success
      message
      artifacts {
        messageContentType
        title
        subtitle
        analysisType
        coordinates {
          lat
          lng
        }
        suitabilityScore
        exclusionZones {
          water
          buildings
          roads
          protected
        }
        results {
          buildableArea
          majorConstraints
          recommendedSetbacks
        }
        projectId
      }
      thoughtSteps {
        id
        type
        title
        summary
        status
      }
      sourceAttribution {
        title
        url
        snippet
      }
      agentUsed
    }
  }
`;

async function debugTerrainAnalysis() {
  console.log('🌍 Testing: "Analyze terrain for wind farm development at coordinates 32.7767, -96.7970"');
  console.log('⏰ Timestamp:', new Date().toISOString());
  
  const variables = {
    input: {
      message: "Analyze terrain for wind farm development at coordinates 32.7767, -96.7970",
      foundationModelId: "us.anthropic.claude-3-7-sonnet-20250219-v1:0",
      userId: "test-user-terrain-debug"
    }
  };

  try {
    console.log('📤 Sending GraphQL request...');
    console.log('🔗 Endpoint:', GRAPHQL_ENDPOINT);
    console.log('📋 Variables:', JSON.stringify(variables, null, 2));

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        query: testTerrainAnalysis,
        variables
      })
    });

    console.log('📥 Response status:', response.status);
    const result = await response.json();

    if (result.errors) {
      console.error('❌ GraphQL Errors:');
      result.errors.forEach((error, index) => {
        console.error(`Error ${index + 1}:`, error.message);
        console.error('Path:', error.path);
        console.error('Extensions:', error.extensions);
      });
    }

    if (result.data?.processMessage) {
      const data = result.data.processMessage;
      
      console.log('\n🎯 AGENT RESPONSE ANALYSIS');
      console.log('==========================');
      console.log('✅ Success:', data.success);
      console.log('🤖 Agent Used:', data.agentUsed);
      console.log('💭 Message Length:', data.message?.length || 0);
      console.log('🎨 Artifact Count:', data.artifacts?.length || 0);
      console.log('🧠 Thought Steps:', data.thoughtSteps?.length || 0);
      console.log('📚 Source Attribution:', data.sourceAttribution?.length || 0);

      console.log('\n📝 MESSAGE CONTENT:');
      console.log(data.message);

      if (data.artifacts && data.artifacts.length > 0) {
        console.log('\n🎨 ARTIFACT ANALYSIS');
        console.log('=====================');
        
        data.artifacts.forEach((artifact, index) => {
          console.log(`\n🎨 Artifact ${index + 1}:`);
          console.log('  📦 Type:', artifact.messageContentType);
          console.log('  🏷️ Title:', artifact.title);
          console.log('  📄 Subtitle:', artifact.subtitle);
          console.log('  🔍 Analysis Type:', artifact.analysisType);
          console.log('  📊 Suitability Score:', artifact.suitabilityScore);
          console.log('  🗺️ Has Coordinates:', !!artifact.coordinates);
          console.log('  ⚠️ Has Exclusion Zones:', !!artifact.exclusionZones);
          console.log('  📋 Has Results:', !!artifact.results);
          console.log('  🔗 Project ID:', artifact.projectId);
          
          if (artifact.coordinates) {
            console.log('    📍 Lat/Lng:', `${artifact.coordinates.lat}, ${artifact.coordinates.lng}`);
          }
          
          if (artifact.exclusionZones) {
            console.log('    🚫 Exclusion Zones:');
            console.log('      💧 Water:', artifact.exclusionZones.water);
            console.log('      🏠 Buildings:', artifact.exclusionZones.buildings);
            console.log('      🛣️ Roads:', artifact.exclusionZones.roads);
            console.log('      🌲 Protected:', artifact.exclusionZones.protected);
          }
          
          if (artifact.results) {
            console.log('    📊 Results:');
            console.log('      🏗️ Buildable Area:', artifact.results.buildableArea);
            console.log('      ⚠️ Major Constraints:', artifact.results.majorConstraints?.length || 0);
            console.log('      📏 Recommended Setbacks:', artifact.results.recommendedSetbacks);
          }

          // Full artifact structure for debugging
          console.log('    🔍 Full Artifact Keys:', Object.keys(artifact));
        });

        // Check if artifacts are properly structured for UI components
        const windFarmArtifacts = data.artifacts.filter(a => 
          a.messageContentType === 'wind_farm_terrain_analysis'
        );

        if (windFarmArtifacts.length > 0) {
          console.log('\n✅ WIND FARM TERRAIN ARTIFACTS FOUND!');
          console.log('🎯 Count:', windFarmArtifacts.length);
          
          const firstArtifact = windFarmArtifacts[0];
          console.log('\n🔍 FIRST WIND FARM ARTIFACT VALIDATION:');
          console.log('  ✅ Has messageContentType:', !!firstArtifact.messageContentType);
          console.log('  ✅ Has title:', !!firstArtifact.title);
          console.log('  ✅ Has coordinates:', !!firstArtifact.coordinates);
          console.log('  ✅ Has suitabilityScore:', typeof firstArtifact.suitabilityScore === 'number');
          console.log('  ✅ Has exclusionZones:', !!firstArtifact.exclusionZones);
          console.log('  ✅ Has results:', !!firstArtifact.results);
          
          // Test if this artifact would be properly rendered by WindFarmTerrainComponent
          const requiredFields = [
            'messageContentType',
            'title', 
            'coordinates',
            'suitabilityScore'
          ];
          
          const missingFields = requiredFields.filter(field => !firstArtifact[field]);
          
          if (missingFields.length === 0) {
            console.log('🎉 ARTIFACT IS PROPERLY STRUCTURED FOR UI RENDERING!');
          } else {
            console.log('❌ Missing required fields:', missingFields);
          }
          
        } else {
          console.log('❌ NO WIND FARM TERRAIN ARTIFACTS FOUND');
          console.log('🔍 Available artifact types:', 
            data.artifacts.map(a => a.messageContentType || 'unknown')
          );
        }
      } else {
        console.log('\n❌ NO ARTIFACTS RETURNED');
        console.log('🤔 This indicates the terrain analysis tool is not being called or not returning artifacts');
      }

      if (data.thoughtSteps && data.thoughtSteps.length > 0) {
        console.log('\n🧠 THOUGHT STEP ANALYSIS');
        console.log('========================');
        
        data.thoughtSteps.forEach((step, index) => {
          console.log(`\n💭 Step ${index + 1}:`);
          console.log('  🔍 Type:', step.type);
          console.log('  🏷️ Title:', step.title);
          console.log('  📄 Summary:', step.summary);
          console.log('  ✅ Status:', step.status);
        });

        // Look for terrain analysis execution
        const terrainSteps = data.thoughtSteps.filter(step => 
          step.title?.includes('terrain') || 
          step.summary?.includes('terrain') ||
          step.type === 'execution'
        );

        if (terrainSteps.length > 0) {
          console.log('\n🌍 TERRAIN ANALYSIS EXECUTION FOUND IN THOUGHT STEPS');
        } else {
          console.log('\n❌ NO TERRAIN ANALYSIS EXECUTION DETECTED IN THOUGHT STEPS');
        }
      }

      // Pattern matching analysis
      console.log('\n🎯 ROUTING ANALYSIS');
      console.log('===================');
      const message = "Analyze terrain for wind farm development at coordinates 32.7767, -96.7970";
      const lowerMessage = message.toLowerCase();

      // Test renewable patterns from agentRouter.ts
      const renewablePatterns = [
        /wind.*farm|wind.*turbine|turbine.*layout|wind.*energy/,
        /renewable.*energy|clean.*energy|green.*energy/,
        /terrain.*analysis|site.*analysis.*wind|unbuildable.*areas|exclusion.*zones/,
        /wind.*resource|wind.*speed.*analysis|wind.*data/,
        /turbine.*placement|layout.*optimization|turbine.*spacing/,
        /wind.*farm.*design|wind.*farm.*layout/,
        /wake.*analysis|wake.*effect|capacity.*factor/,
        /energy.*production.*wind|annual.*energy.*production|aep/,
        /wind.*simulation|performance.*simulation/,
        /offshore.*wind|onshore.*wind|wind.*project/,
        /megawatt.*wind|mw.*wind|gigawatt.*hour|gwh/,
        /wind.*farm.*development|renewable.*site.*design/
      ];

      console.log('🔍 Testing renewable patterns against message:');
      console.log('   Message:', message);
      console.log('   Lower:', lowerMessage);

      let matchedPatterns = [];
      renewablePatterns.forEach((pattern, index) => {
        const matches = pattern.test(lowerMessage);
        console.log(`   Pattern ${index + 1} (${pattern}): ${matches ? '✅ MATCH' : '❌ no match'}`);
        if (matches) {
          matchedPatterns.push(index + 1);
        }
      });

      if (matchedPatterns.length > 0) {
        console.log('🎯 RENEWABLE PATTERNS MATCHED:', matchedPatterns);
        
        if (data.agentUsed === 'renewableEnergyAgent') {
          console.log('✅ CORRECTLY ROUTED TO RENEWABLE ENERGY AGENT');
        } else {
          console.log('❌ PATTERN MATCHED BUT WRONG AGENT USED:', data.agentUsed);
        }
      } else {
        console.log('❌ NO RENEWABLE PATTERNS MATCHED - ROUTING ISSUE');
      }

      // Final diagnosis
      console.log('\n🏥 FINAL DIAGNOSIS');
      console.log('==================');

      if (data.agentUsed !== 'renewableEnergyAgent') {
        console.log('❌ ISSUE: Wrong agent used. Should be renewableEnergyAgent');
      } else if (!data.artifacts || data.artifacts.length === 0) {
        console.log('❌ ISSUE: No artifacts generated. renewableTerrainAnalysisTool not being called');
      } else if (!data.artifacts.some(a => a.messageContentType === 'wind_farm_terrain_analysis')) {
        console.log('❌ ISSUE: Wrong artifact type generated. Should be wind_farm_terrain_analysis');
      } else {
        console.log('✅ EVERYTHING LOOKS CORRECT - artifacts should be rendering in UI');
      }
      
    } else {
      console.error('❌ No data in response');
    }

    // Save full response for analysis
    fs.writeFileSync(
      'terrain-debug-response.json', 
      JSON.stringify(result, null, 2)
    );
    console.log('\n💾 Full response saved to terrain-debug-response.json');

  } catch (error) {
    console.error('❌ Request failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Execute the debug test
debugTerrainAnalysis().catch(console.error);
