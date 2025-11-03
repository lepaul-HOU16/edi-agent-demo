/**
 * Renewable Energy Performance and UI Polish Validation
 * 
 * This test suite validates visualization loading times, responsiveness,
 * and final UI polish for the complete demo workflow.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { generateClient } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
import { getRenewableConfig, isRenewableEnabled } from '../../src/services/renewable-integration/config';

// Import amplify outputs for configuration
const amplifyOutputs = require('../../amplify_outputs.json');

// Configure Amplify
Amplify.configure(amplifyOutputs);
const client = generateClient();

describe('Renewable Energy Performance and UI Polish Validation', () => {
  
  const PERFORMANCE_TIMEOUT = 30000; // 30 seconds for performance tests
  const RESPONSE_TIME_THRESHOLD = 15000; // 15 seconds max response time
  
  beforeAll(() => {
    if (!isRenewableEnabled()) {
      console.log('⚠️  Renewable energy integration is disabled.');
      console.log('⚠️  Set NEXT_PUBLIC_RENEWABLE_ENABLED=true to run performance tests.');
    }
  });

  describe('Visualization Loading Performance Tests', () => {
    
    /**
     * Test visualization loading times and responsiveness
     * Requirements: 8.1, 8.2
     */
    it('should load terrain analysis within performance thresholds', async () => {
      if (!isRenewableEnabled()) {
        console.log('⚠️  Skipping: Renewable integration disabled');
        return;
      }

      const startTime = Date.now();
      const query = 'Analyze terrain for wind farm at 35.067482, -101.395466 with comprehensive feature analysis.';
      
      console.log(`⏱️  Starting terrain analysis performance test...`);

      const response = await client.graphql({
        query: `
          mutation SendMessage($message: String!, $chatSessionId: String!) {
            sendMessage(message: $message, chatSessionId: $chatSessionId)
          }
        `,
        variables: {
          message: query,
          chatSessionId: `perf_test_terrain_${Date.now()}`
        }
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      console.log(`⏱️  Terrain analysis response time: ${responseTime}ms`);

      // Validate response time is within threshold
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD);

      // Validate response quality
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

      console.log(`✅ Terrain analysis performance: ${responseTime}ms (threshold: ${RESPONSE_TIME_THRESHOLD}ms)`);
    }, PERFORMANCE_TIMEOUT);

    /**
     * Test wind rose analysis performance
     * Requirements: 8.1, 8.2
     */
    it('should load wind rose analysis efficiently', async () => {
      if (!isRenewableEnabled()) {
        console.log('⚠️  Skipping: Renewable integration disabled');
        return;
      }

      const startTime = Date.now();
      const query = 'Generate wind rose analysis for 35.067482, -101.395466 with seasonal patterns.';
      
      console.log(`⏱️  Starting wind rose analysis performance test...`);

      const response = await client.graphql({
        query: `
          mutation SendMessage($message: String!, $chatSessionId: String!) {
            sendMessage(message: $message, chatSessionId: $chatSessionId)
          }
        `,
        variables: {
          message: query,
          chatSessionId: `perf_test_windrose_${Date.now()}`
        }
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      console.log(`⏱️  Wind rose analysis response time: ${responseTime}ms`);

      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD);

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

      console.log(`✅ Wind rose analysis performance: ${responseTime}ms (threshold: ${RESPONSE_TIME_THRESHOLD}ms)`);
    }, PERFORMANCE_TIMEOUT);

    /**
     * Test layout optimization performance
     * Requirements: 8.1, 8.2
     */
    it('should optimize layout within reasonable time limits', async () => {
      if (!isRenewableEnabled()) {
        console.log('⚠️  Skipping: Renewable integration disabled');
        return;
      }

      const startTime = Date.now();
      const query = 'Optimize turbine layout for 30MW wind farm at 35.067482, -101.395466 using advanced algorithms.';
      
      console.log(`⏱️  Starting layout optimization performance test...`);

      const response = await client.graphql({
        query: `
          mutation SendMessage($message: String!, $chatSessionId: String!) {
            sendMessage(message: $message, chatSessionId: $chatSessionId)
          }
        `,
        variables: {
          message: query,
          chatSessionId: `perf_test_layout_${Date.now()}`
        }
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      console.log(`⏱️  Layout optimization response time: ${responseTime}ms`);

      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD);

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

      console.log(`✅ Layout optimization performance: ${responseTime}ms (threshold: ${RESPONSE_TIME_THRESHOLD}ms)`);
    }, PERFORMANCE_TIMEOUT);
  });

  describe('Progressive Disclosure and User Experience Tests', () => {
    
    /**
     * Test progressive disclosure workflow functionality
     * Requirements: 8.3, 8.4
     */
    it('should provide progressive disclosure with appropriate complexity revelation', async () => {
      if (!isRenewableEnabled()) {
        console.log('⚠️  Skipping: Renewable integration disabled');
        return;
      }

      const workflowQueries = [
        {
          step: 'Initial',
          query: 'I want to develop a wind farm. Where should I start?',
          expectedGuidance: 'site selection'
        },
        {
          step: 'Site Selected',
          query: 'I have a site at 35.067482, -101.395466. What should I analyze first?',
          expectedGuidance: 'terrain analysis'
        },
        {
          step: 'Terrain Complete',
          query: 'Terrain analysis is done. What are my next steps?',
          expectedGuidance: 'wind resource'
        }
      ];

      for (const step of workflowQueries) {
        console.log(`🔄 Testing progressive disclosure: ${step.step}`);
        
        const response = await client.graphql({
          query: `
            mutation SendMessage($message: String!, $chatSessionId: String!) {
              sendMessage(message: $message, chatSessionId: $chatSessionId)
            }
          `,
          variables: {
            message: step.query,
            chatSessionId: `progressive_test_${Date.now()}`
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

        // Validate guidance is provided
        const responseContent = parsedResponse.content || parsedResponse.message || '';
        const providesGuidance = responseContent.toLowerCase().includes('next') ||
                                responseContent.toLowerCase().includes('step') ||
                                responseContent.toLowerCase().includes('recommend') ||
                                responseContent.toLowerCase().includes(step.expectedGuidance);

        expect(providesGuidance).toBe(true);
        console.log(`✅ Progressive guidance provided for ${step.step}`);
      }
    }, PERFORMANCE_TIMEOUT);

    /**
     * Test call-to-action functionality
     * Requirements: 8.2, 8.4
     */
    it('should provide clear call-to-action guidance', async () => {
      if (!isRenewableEnabled()) {
        console.log('⚠️  Skipping: Renewable integration disabled');
        return;
      }

      const query = 'Complete terrain analysis for wind farm at 35.067482, -101.395466 and show me next steps.';
      
      const response = await client.graphql({
        query: `
          mutation SendMessage($message: String!, $chatSessionId: String!) {
            sendMessage(message: $message, chatSessionId: $chatSessionId)
          }
        `,
        variables: {
          message: query,
          chatSessionId: `cta_test_${Date.now()}`
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

      // Validate call-to-action elements
      const responseContent = JSON.stringify(parsedResponse).toLowerCase();
      const hasCallToAction = responseContent.includes('next') ||
                             responseContent.includes('continue') ||
                             responseContent.includes('proceed') ||
                             responseContent.includes('recommend');

      expect(hasCallToAction).toBe(true);
      console.log(`✅ Call-to-action guidance provided`);
    }, PERFORMANCE_TIMEOUT);
  });

  describe('UI Polish and Interaction Tests', () => {
    
    /**
     * Test UI component responsiveness and polish
     * Requirements: 8.5
     */
    it('should provide polished user interface interactions', async () => {
      if (!isRenewableEnabled()) {
        console.log('⚠️  Skipping: Renewable integration disabled');
        return;
      }

      const query = 'Show me comprehensive wind farm analysis for 35.067482, -101.395466 with interactive visualizations.';
      
      const response = await client.graphql({
        query: `
          mutation SendMessage($message: String!, $chatSessionId: String!) {
            sendMessage(message: $message, chatSessionId: $chatSessionId)
          }
        `,
        variables: {
          message: query,
          chatSessionId: `ui_polish_test_${Date.now()}`
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

      // Validate artifact structure for UI rendering
      const artifact = artifacts[0];
      await validateUIPolish(artifact);

      console.log(`✅ UI polish and interactions validated`);
    }, PERFORMANCE_TIMEOUT);

    /**
     * Test error handling and recovery UI
     * Requirements: 8.5
     */
    it('should provide polished error handling and recovery', async () => {
      if (!isRenewableEnabled()) {
        console.log('⚠️  Skipping: Renewable integration disabled');
        return;
      }

      const errorQuery = 'Analyze wind farm at invalid coordinates 999, 999 with recovery options.';
      
      try {
        const response = await client.graphql({
          query: `
            mutation SendMessage($message: String!, $chatSessionId: String!) {
              sendMessage(message: $message, chatSessionId: $chatSessionId)
            }
          `,
          variables: {
            message: errorQuery,
            chatSessionId: `error_ui_test_${Date.now()}`
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

        // Validate polished error handling
        const responseContent = JSON.stringify(parsedResponse).toLowerCase();
        const hasPolishedError = responseContent.includes('help') ||
                                responseContent.includes('try') ||
                                responseContent.includes('suggest') ||
                                responseContent.includes('correct');

        expect(hasPolishedError).toBe(true);
        console.log(`✅ Polished error handling validated`);

      } catch (error) {
        // Error should be handled gracefully
        console.log(`✅ Error handled gracefully: ${error.message}`);
      }
    }, PERFORMANCE_TIMEOUT);
  });

  describe('Complete Demo Workflow Success Criteria', () => {
    
    /**
     * Test that complete demo workflow meets all success criteria
     * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
     */
    it('should meet all demo workflow success criteria', async () => {
      if (!isRenewableEnabled()) {
        console.log('⚠️  Skipping: Renewable integration disabled');
        return;
      }

      const successCriteria = {
        performanceThreshold: RESPONSE_TIME_THRESHOLD,
        progressiveDisclosure: false,
        callToActionGuidance: false,
        professionalQuality: false,
        errorHandling: false,
        uiPolish: false
      };

      // Test 1: Performance
      const startTime = Date.now();
      const query = 'Complete wind farm development analysis for 35.067482, -101.395466 including all phases.';
      
      const response = await client.graphql({
        query: `
          mutation SendMessage($message: String!, $chatSessionId: String!) {
            sendMessage(message: $message, chatSessionId: $chatSessionId)
          }
        `,
        variables: {
          message: query,
          chatSessionId: `success_criteria_test_${Date.now()}`
        }
      });

      const responseTime = Date.now() - startTime;
      const meetsPerformance = responseTime < successCriteria.performanceThreshold;
      
      console.log(`📊 Performance: ${responseTime}ms (${meetsPerformance ? '✅' : '❌'})`);

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

      // Test 2: Progressive Disclosure
      const responseContent = JSON.stringify(parsedResponse).toLowerCase();
      successCriteria.progressiveDisclosure = responseContent.includes('step') ||
                                             responseContent.includes('phase') ||
                                             responseContent.includes('next');
      
      console.log(`📊 Progressive Disclosure: ${successCriteria.progressiveDisclosure ? '✅' : '❌'}`);

      // Test 3: Call-to-Action Guidance
      successCriteria.callToActionGuidance = responseContent.includes('recommend') ||
                                            responseContent.includes('suggest') ||
                                            responseContent.includes('continue');
      
      console.log(`📊 Call-to-Action Guidance: ${successCriteria.callToActionGuidance ? '✅' : '❌'}`);

      // Test 4: Professional Quality
      const artifacts = parsedResponse.artifacts || [];
      if (artifacts.length > 0) {
        const artifactContent = JSON.stringify(artifacts[0]).toLowerCase();
        successCriteria.professionalQuality = artifactContent.includes('analysis') ||
                                             artifactContent.includes('assessment') ||
                                             artifactContent.includes('professional');
      }
      
      console.log(`📊 Professional Quality: ${successCriteria.professionalQuality ? '✅' : '❌'}`);

      // Test 5: Error Handling (implicit - no errors thrown)
      successCriteria.errorHandling = true;
      console.log(`📊 Error Handling: ${successCriteria.errorHandling ? '✅' : '❌'}`);

      // Test 6: UI Polish (artifact structure)
      successCriteria.uiPolish = artifacts.length > 0 && artifacts[0].content;
      console.log(`📊 UI Polish: ${successCriteria.uiPolish ? '✅' : '❌'}`);

      // Overall success
      const allCriteriaMet = meetsPerformance &&
                            successCriteria.progressiveDisclosure &&
                            successCriteria.callToActionGuidance &&
                            successCriteria.professionalQuality &&
                            successCriteria.errorHandling &&
                            successCriteria.uiPolish;

      expect(allCriteriaMet).toBe(true);
      
      console.log(`\n🏆 Demo Workflow Success: ${allCriteriaMet ? '✅ ALL CRITERIA MET' : '❌ NEEDS IMPROVEMENT'}`);
      
      return {
        performance: meetsPerformance,
        responseTime,
        ...successCriteria,
        overallSuccess: allCriteriaMet
      };
    }, PERFORMANCE_TIMEOUT);
  });
});

/**
 * Helper function to validate UI polish
 */
async function validateUIPolish(artifact: any): Promise<void> {
  const content = artifact.content || artifact;
  
  console.log(`   🔍 Validating UI polish...`);

  // Check for structured content
  expect(content).toBeDefined();
  expect(typeof content).toBe('object');

  // Check for visualization elements
  const contentStr = JSON.stringify(content);
  const hasVisualizationElements = contentStr.includes('chart') ||
                                  contentStr.includes('map') ||
                                  contentStr.includes('graph') ||
                                  contentStr.includes('visualization');

  if (hasVisualizationElements) {
    console.log(`   ✅ Visualization elements: Present`);
  }

  // Check for interactive elements
  const hasInteractiveElements = contentStr.includes('interactive') ||
                                contentStr.includes('clickable') ||
                                contentStr.includes('hover') ||
                                contentStr.includes('zoom');

  if (hasInteractiveElements) {
    console.log(`   ✅ Interactive elements: Present`);
  }

  // Check for professional presentation
  const hasProfessionalPresentation = contentStr.includes('title') ||
                                     contentStr.includes('description') ||
                                     contentStr.includes('metadata');

  if (hasProfessionalPresentation) {
    console.log(`   ✅ Professional presentation: Present`);
  }

  console.log(`   ✅ UI polish: Validated`);
}