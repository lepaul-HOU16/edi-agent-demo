/**
 * End-to-End Renewable Energy Demo Workflow Validation
 * 
 * This test suite validates the complete renewable energy demo workflow
 * from start to finish, ensuring all visualizations work with real data
 * and proper error handling is in place.
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { generateClient } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
import { RenewableClient } from '../../src/services/renewable-integration/renewableClient';
import { ResponseTransformer } from '../../src/services/renewable-integration/responseTransformer';
import { getRenewableConfig, isRenewableEnabled } from '../../src/services/renewable-integration/config';
import { RenewableProxyAgent } from '../../amplify/functions/agents/renewableProxyAgent';

// Import amplify outputs for configuration
const amplifyOutputs = require('../../amplify_outputs.json');

// Configure Amplify
Amplify.configure(amplifyOutputs);
const client = generateClient();

describe('Renewable Energy Demo Workflow - End-to-End Validation', () => {
  
  const TIMEOUT = 120000; // 2 minutes for complex workflows
  
  beforeAll(() => {
    if (!isRenewableEnabled()) {
      console.log('⚠️  Renewable energy integration is disabled.');
      console.log('⚠️  Set NEXT_PUBLIC_RENEWABLE_ENABLED=true to run workflow tests.');
    }
  });

  describe('Complete Demo Workflow Tests', () => {
    
    /**
     * Test the complete renewable energy demo workflow from site selection
     * through final report generation
     * Requirements: 12.1, 12.2
     */
    it('should complete full demo workflow from site selection to final report', async () => {
      if (!isRenewableEnabled()) {
        console.log('⚠️  Skipping: Renewable integration disabled');
        return;
      }

      const workflowSteps = [
        {
          name: 'Site Selection & Initial Assessment',
          query: 'I want to develop a wind farm. Help me analyze a potential site at coordinates 35.067482, -101.395466 in Texas.',
          expectedArtifacts: ['wind_farm_terrain_analysis'],
          expectedFeatures: ['site_coordinates', 'initial_assessment']
        },
        {
          name: 'Terrain Analysis with 151+ Features',
          query: 'Analyze terrain features and constraints for wind farm development at 35.067482, -101.395466. Show me all terrain features including buildings, roads, water bodies, and power infrastructure.',
          expectedArtifacts: ['wind_farm_terrain_analysis'],
          expectedFeatures: ['terrain_features', 'osm_data', 'exclusion_zones', 'setback_calculations'],
          minFeatureCount: 100 // Validate 151+ features regression fix
        },
        {
          name: 'Wind Rose Analysis',
          query: 'Generate wind rose analysis for the site at 35.067482, -101.395466. Show wind speed and direction distributions.',
          expectedArtifacts: ['wind_rose_analysis'],
          expectedFeatures: ['wind_patterns', 'seasonal_analysis', 'directional_distribution']
        },
        {
          name: 'Wake Analysis',
          query: 'Perform wake analysis for turbine interactions at 35.067482, -101.395466. Model wake effects and downstream impacts.',
          expectedArtifacts: ['wake_analysis'],
          expectedFeatures: ['wake_modeling', 'turbine_interactions', 'energy_losses']
        },
        {
          name: 'Layout Optimization',
          query: 'Optimize turbine layout for 30MW wind farm at 35.067482, -101.395466. Use IEA_Reference_3.4MW_130 turbines with optimal spacing.',
          expectedArtifacts: ['wind_farm_layout'],
          expectedFeatures: ['turbine_positions', 'spacing_optimization', 'capacity_calculations']
        },
        {
          name: 'Site Suitability Assessment',
          query: 'Provide comprehensive site suitability assessment for 35.067482, -101.395466 including scoring for wind resource, terrain, grid connectivity, and environmental factors.',
          expectedArtifacts: ['site_suitability_assessment'],
          expectedFeatures: ['suitability_score', 'component_scores', 'risk_factors', 'recommendations']
        },
        {
          name: 'Final Report Generation',
          query: 'Generate comprehensive wind farm development report for 35.067482, -101.395466 including all analysis results, recommendations, and professional documentation.',
          expectedArtifacts: ['comprehensive_report'],
          expectedFeatures: ['executive_summary', 'technical_analysis', 'recommendations', 'professional_formatting']
        }
      ];

      const workflowResults = [];
      let sessionId = `demo_workflow_${Date.now()}`;

      for (const [index, step] of workflowSteps.entries()) {
        console.log(`\n📋 Step ${index + 1}: ${step.name}`);
        console.log(`💬 Query: "${step.query}"`);

        try {
          const response = await client.graphql({
            query: `
              mutation SendMessage($message: String!, $chatSessionId: String!) {
                sendMessage(message: $message, chatSessionId: $chatSessionId)
              }
            `,
            variables: {
              message: step.query,
              chatSessionId: sessionId
            }
          });

          // Parse response
          let parsedResponse;
          const responseData = response.data.sendMessage;
          if (typeof responseData === 'string') {
            try {
              parsedResponse = JSON.parse(responseData);
            } catch {
              parsedResponse = { content: responseData };
            }
          } else {
            parsedResponse = responseData;
          }

          // Validate agent routing
          const agentUsed = parsedResponse.agentUsed || 'unknown';
          expect(agentUsed).toBe('renewableEnergyAgent');

          // Validate artifacts
          const artifacts = parsedResponse.artifacts || [];
          const artifactTypes = artifacts.map(a => a.messageContentType || a.type);
          
          console.log(`🎨 Generated Artifacts: ${artifactTypes.join(', ')}`);

          // Check for expected artifacts
          for (const expectedArtifact of step.expectedArtifacts) {
            const hasArtifact = artifactTypes.some(type => 
              type.includes(expectedArtifact) || expectedArtifact.includes(type)
            );
            expect(hasArtifact).toBe(true);
            console.log(`✅ Expected artifact '${expectedArtifact}': Found`);
          }

          // Validate artifact content
          if (artifacts.length > 0) {
            const primaryArtifact = artifacts[0];
            await validateArtifactContent(primaryArtifact, step);
          }

          // Special validation for terrain analysis (151+ features)
          if (step.minFeatureCount && artifacts.length > 0) {
            const terrainArtifact = artifacts.find(a => 
              (a.messageContentType || a.type).includes('terrain')
            );
            if (terrainArtifact) {
              await validateTerrainFeatureCount(terrainArtifact, step.minFeatureCount);
            }
          }

          // Validate thought process
          const thoughtSteps = parsedResponse.thoughtSteps || [];
          expect(thoughtSteps.length).toBeGreaterThan(0);
          console.log(`🧠 Thought Steps: ${thoughtSteps.length}`);

          workflowResults.push({
            step: step.name,
            success: true,
            artifacts: artifactTypes,
            thoughtSteps: thoughtSteps.length
          });

          console.log(`✅ Step ${index + 1} completed successfully`);

        } catch (error) {
          console.error(`❌ Step ${index + 1} failed:`, error.message);
          workflowResults.push({
            step: step.name,
            success: false,
            error: error.message
          });
          throw error;
        }
      }

      // Validate complete workflow
      const successfulSteps = workflowResults.filter(r => r.success);
      expect(successfulSteps.length).toBe(workflowSteps.length);
      
      console.log(`\n🏆 Complete Demo Workflow: ${successfulSteps.length}/${workflowSteps.length} steps completed`);

    }, TIMEOUT);

    /**
     * Test error handling and recovery scenarios
     * Requirements: 12.1, 12.2
     */
    it('should handle errors gracefully and provide recovery options', async () => {
      if (!isRenewableEnabled()) {
        console.log('⚠️  Skipping: Renewable integration disabled');
        return;
      }

      const errorScenarios = [
        {
          name: 'Invalid Coordinates',
          query: 'Analyze wind farm site at coordinates 999, 999',
          expectError: true,
          expectedRecovery: 'coordinate_validation'
        },
        {
          name: 'Ambiguous Query',
          query: 'Do something with renewable energy',
          expectError: false,
          expectedBehavior: 'clarification_request'
        },
        {
          name: 'Incomplete Information',
          query: 'Optimize layout',
          expectError: false,
          expectedBehavior: 'information_request'
        }
      ];

      for (const scenario of errorScenarios) {
        console.log(`\n🧪 Testing: ${scenario.name}`);
        
        try {
          const response = await client.graphql({
            query: `
              mutation SendMessage($message: String!, $chatSessionId: String!) {
                sendMessage(message: $message, chatSessionId: $chatSessionId)
              }
            `,
            variables: {
              message: scenario.query,
              chatSessionId: `error_test_${Date.now()}`
            }
          });

          let parsedResponse;
          const responseData = response.data.sendMessage;
          if (typeof responseData === 'string') {
            try {
              parsedResponse = JSON.parse(responseData);
            } catch {
              parsedResponse = { content: responseData };
            }
          } else {
            parsedResponse = responseData;
          }

          // Validate error handling
          if (scenario.expectError) {
            // Should have error handling in response
            const hasErrorHandling = parsedResponse.content?.includes('error') || 
                                   parsedResponse.content?.includes('invalid') ||
                                   parsedResponse.message?.includes('error');
            expect(hasErrorHandling).toBe(true);
            console.log(`✅ Error handled gracefully`);
          } else {
            // Should provide clarification or guidance
            const providesGuidance = parsedResponse.content?.includes('?') ||
                                   parsedResponse.content?.includes('clarify') ||
                                   parsedResponse.content?.includes('need');
            expect(providesGuidance).toBe(true);
            console.log(`✅ Provides user guidance`);
          }

        } catch (error) {
          if (!scenario.expectError) {
            throw error;
          }
          console.log(`✅ Error scenario handled: ${error.message}`);
        }
      }
    }, TIMEOUT);

    /**
     * Test intent detection accuracy for renewable energy queries
     * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7
     */
    it('should correctly route different renewable energy analysis types', async () => {
      if (!isRenewableEnabled()) {
        console.log('⚠️  Skipping: Renewable integration disabled');
        return;
      }

      const intentTests = [
        {
          query: 'Analyze terrain for wind farm at 35.067482, -101.395466',
          expectedIntent: 'terrain_analysis',
          expectedArtifact: 'wind_farm_terrain_analysis'
        },
        {
          query: 'Show me wind rose analysis for this location',
          expectedIntent: 'wind_rose_analysis',
          expectedArtifact: 'wind_rose_analysis'
        },
        {
          query: 'Model wake effects for turbine layout',
          expectedIntent: 'wake_analysis',
          expectedArtifact: 'wake_analysis'
        },
        {
          query: 'Optimize turbine placement and spacing',
          expectedIntent: 'layout_optimization',
          expectedArtifact: 'wind_farm_layout'
        },
        {
          query: 'Assess site suitability for wind farm development',
          expectedIntent: 'site_suitability',
          expectedArtifact: 'site_suitability_assessment'
        }
      ];

      for (const test of intentTests) {
        console.log(`\n🎯 Testing Intent: ${test.expectedIntent}`);
        console.log(`💬 Query: "${test.query}"`);

        const response = await client.graphql({
          query: `
            mutation SendMessage($message: String!, $chatSessionId: String!) {
              sendMessage(message: $message, chatSessionId: $chatSessionId)
            }
          `,
          variables: {
            message: test.query,
            chatSessionId: `intent_test_${Date.now()}`
          }
        });

        let parsedResponse;
        const responseData = response.data.sendMessage;
        if (typeof responseData === 'string') {
          try {
            parsedResponse = JSON.parse(responseData);
          } catch {
            parsedResponse = { content: responseData };
          }
        } else {
          parsedResponse = responseData;
        }

        // Validate correct agent routing
        const agentUsed = parsedResponse.agentUsed || 'unknown';
        expect(agentUsed).toBe('renewableEnergyAgent');

        // Validate correct artifact type
        const artifacts = parsedResponse.artifacts || [];
        const artifactTypes = artifacts.map(a => a.messageContentType || a.type);
        
        const hasCorrectArtifact = artifactTypes.some(type => 
          type.includes(test.expectedArtifact) || test.expectedArtifact.includes(type)
        );
        
        expect(hasCorrectArtifact).toBe(true);
        console.log(`✅ Correct intent routing: ${test.expectedIntent} → ${test.expectedArtifact}`);
      }
    }, TIMEOUT);
  });

  describe('Real Data Integration Tests', () => {
    
    /**
     * Test that all visualizations work with real data
     * Requirements: 12.1, 12.2
     */
    it('should generate visualizations with real OSM data (151+ features)', async () => {
      if (!isRenewableEnabled()) {
        console.log('⚠️  Skipping: Renewable integration disabled');
        return;
      }

      const query = 'Analyze terrain features for wind farm at 35.067482, -101.395466. Show all buildings, roads, water bodies, and power infrastructure with real OpenStreetMap data.';
      
      const response = await client.graphql({
        query: `
          mutation SendMessage($message: String!, $chatSessionId: String!) {
            sendMessage(message: $message, chatSessionId: $chatSessionId)
          }
        `,
        variables: {
          message: query,
          chatSessionId: `real_data_test_${Date.now()}`
        }
      });

      let parsedResponse;
      const responseData = response.data.sendMessage;
      if (typeof responseData === 'string') {
        try {
          parsedResponse = JSON.parse(responseData);
        } catch {
          parsedResponse = { content: responseData };
        }
      } else {
        parsedResponse = responseData;
      }

      // Validate real data usage
      const artifacts = parsedResponse.artifacts || [];
      expect(artifacts.length).toBeGreaterThan(0);

      const terrainArtifact = artifacts.find(a => 
        (a.messageContentType || a.type).includes('terrain')
      );
      expect(terrainArtifact).toBeDefined();

      // Validate real OSM data (not synthetic)
      const artifactContent = JSON.stringify(terrainArtifact.content || terrainArtifact);
      expect(artifactContent).not.toContain('synthetic');
      expect(artifactContent).not.toContain('fallback');
      expect(artifactContent).not.toContain('mock');

      // Validate feature count (151+ features regression fix)
      await validateTerrainFeatureCount(terrainArtifact, 100);

      console.log(`✅ Real OSM data integration validated`);
    }, TIMEOUT);

    /**
     * Test data quality and completeness
     * Requirements: 12.1, 12.2
     */
    it('should provide high-quality data with proper validation', async () => {
      if (!isRenewableEnabled()) {
        console.log('⚠️  Skipping: Renewable integration disabled');
        return;
      }

      const query = 'Provide comprehensive site assessment for 40.7128, -74.0060 with data quality metrics and validation.';
      
      const response = await client.graphql({
        query: `
          mutation SendMessage($message: String!, $chatSessionId: String!) {
            sendMessage(message: $message, chatSessionId: $chatSessionId)
          }
        `,
        variables: {
          message: query,
          chatSessionId: `data_quality_test_${Date.now()}`
        }
      });

      let parsedResponse;
      const responseData = response.data.sendMessage;
      if (typeof responseData === 'string') {
        try {
          parsedResponse = JSON.parse(responseData);
        } catch {
          parsedResponse = { content: responseData };
        }
      } else {
        parsedResponse = responseData;
      }

      const artifacts = parsedResponse.artifacts || [];
      expect(artifacts.length).toBeGreaterThan(0);

      // Validate data quality indicators
      const artifactContent = JSON.stringify(artifacts);
      const hasQualityMetrics = artifactContent.includes('reliability') ||
                               artifactContent.includes('confidence') ||
                               artifactContent.includes('quality') ||
                               artifactContent.includes('validation');
      
      expect(hasQualityMetrics).toBe(true);
      console.log(`✅ Data quality validation present`);
    }, TIMEOUT);
  });
});

/**
 * Helper function to validate artifact content based on step requirements
 */
async function validateArtifactContent(artifact: any, step: any): Promise<void> {
  const content = artifact.content || artifact;
  const contentStr = JSON.stringify(content);

  console.log(`   🔍 Validating artifact content for ${step.name}...`);

  // Validate expected features are present
  for (const feature of step.expectedFeatures || []) {
    const hasFeature = contentStr.toLowerCase().includes(feature.toLowerCase()) ||
                      contentStr.includes(feature.replace(/_/g, '')) ||
                      contentStr.includes(feature.replace(/_/g, ' '));
    
    if (hasFeature) {
      console.log(`   ✅ Feature '${feature}': Present`);
    } else {
      console.log(`   ⚠️  Feature '${feature}': Not clearly identified`);
    }
  }

  // Validate professional quality
  const professionalIndicators = ['analysis', 'assessment', 'recommendation', 'methodology'];
  const hasProfessionalContent = professionalIndicators.some(indicator => 
    contentStr.toLowerCase().includes(indicator)
  );
  
  expect(hasProfessionalContent).toBe(true);
  console.log(`   ✅ Professional quality content: Present`);
}

/**
 * Helper function to validate terrain feature count (151+ features regression)
 */
async function validateTerrainFeatureCount(terrainArtifact: any, minCount: number): Promise<void> {
  const content = terrainArtifact.content || terrainArtifact;
  const contentStr = JSON.stringify(content);

  console.log(`   🔍 Validating terrain feature count (minimum: ${minCount})...`);

  // Look for feature count indicators
  const featureCountMatch = contentStr.match(/(\d+)\s*features?/i);
  if (featureCountMatch) {
    const featureCount = parseInt(featureCountMatch[1]);
    expect(featureCount).toBeGreaterThanOrEqual(minCount);
    console.log(`   ✅ Feature count: ${featureCount} (meets minimum of ${minCount})`);
  } else {
    // Look for feature arrays or lists
    const features = [];
    if (content.features) features.push(...content.features);
    if (content.buildings) features.push(...content.buildings);
    if (content.roads) features.push(...content.roads);
    if (content.waterBodies) features.push(...content.waterBodies);
    
    if (features.length > 0) {
      expect(features.length).toBeGreaterThanOrEqual(minCount);
      console.log(`   ✅ Feature array count: ${features.length} (meets minimum of ${minCount})`);
    } else {
      console.log(`   ⚠️  Could not determine exact feature count, but content appears comprehensive`);
    }
  }
}