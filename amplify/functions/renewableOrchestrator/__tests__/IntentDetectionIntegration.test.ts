/**
 * Intent Detection Integration Tests
 * 
 * End-to-end tests to validate that the complete intent detection system
 * works correctly and prevents regressions.
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7
 */

import { IntentRouter } from '../IntentRouter';
import { RenewableIntentClassifier, RenewableAnalysisType } from '../RenewableIntentClassifier';

// Mock environment variables for testing
const mockEnvVars = {
  RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME: 'test-terrain-function',
  RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME: 'test-layout-function',
  RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME: 'test-simulation-function',
  RENEWABLE_REPORT_TOOL_FUNCTION_NAME: 'test-report-function'
};

describe('Intent Detection Integration', () => {
  let router: IntentRouter;
  let classifier: RenewableIntentClassifier;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv, ...mockEnvVars };
    
    router = new IntentRouter();
    classifier = new RenewableIntentClassifier();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Critical Regression Prevention', () => {
    test('should NOT route all renewable queries to terrain analysis', async () => {
      const nonTerrainQueries = [
        { query: 'Show wind rose analysis for this location', expectedOriginalIntent: 'wind_rose_analysis' },
        { query: 'Analyze wake effects between turbines', expectedOriginalIntent: 'wake_analysis' },
        { query: 'Optimize turbine layout for maximum yield', expectedOriginalIntent: 'layout_optimization' },
        { query: 'Assess site suitability for development', expectedOriginalIntent: 'site_suitability' },
        { query: 'Generate wind rose diagram', expectedOriginalIntent: 'wind_rose_analysis' },
        { query: 'Calculate wake losses for wind farm', expectedOriginalIntent: 'wake_analysis' },
        { query: 'Find optimal turbine placement', expectedOriginalIntent: 'layout_optimization' }
      ];

      for (const { query, expectedOriginalIntent } of nonTerrainQueries) {
        const result = await router.routeQuery(query);
        
        // The critical fix: the original intent should be correctly detected
        // Even if it falls back to terrain_analysis due to service unavailability
        expect(result.intent.params.originalIntent).toBe(expectedOriginalIntent);
        
        console.log(`✅ Query "${query}" correctly detected as "${result.intent.params.originalIntent}" (routed to "${result.intent.type}")`);
      }
    });

    test('should correctly identify each renewable analysis type', async () => {
      const specificQueries = [
        { 
          query: 'Analyze terrain features and constraints for wind farm', 
          expected: 'terrain_analysis',
          originalIntent: RenewableAnalysisType.TERRAIN_ANALYSIS
        },
        { 
          query: 'Show wind rose analysis with directional data', 
          expected: 'terrain_analysis', // Currently maps to terrain until wind rose service exists
          originalIntent: RenewableAnalysisType.WIND_ROSE_ANALYSIS
        },
        { 
          query: 'Analyze wake effects and turbine interactions', 
          expected: 'wake_simulation',
          originalIntent: RenewableAnalysisType.WAKE_ANALYSIS
        },
        { 
          query: 'Optimize turbine layout for energy maximization', 
          expected: 'layout_optimization',
          originalIntent: RenewableAnalysisType.LAYOUT_OPTIMIZATION
        },
        { 
          query: 'Assess comprehensive site suitability', 
          expected: 'terrain_analysis', // Currently maps to terrain until suitability service exists
          originalIntent: RenewableAnalysisType.SITE_SUITABILITY
        }
      ];

      for (const { query, expected, originalIntent } of specificQueries) {
        const result = await router.routeQuery(query);
        
        expect(result.intent.type).toBe(expected);
        expect(result.intent.params.originalIntent).toBe(originalIntent);
        expect(result.intent.confidence).toBeGreaterThan(60);
        
        console.log(`✅ Query "${query}" routed to "${result.intent.type}" with original intent "${originalIntent}"`);
      }
    });
  });

  describe('Pattern Matching Accuracy', () => {
    test('should distinguish between similar renewable energy terms', async () => {
      const similarTermTests = [
        {
          queries: [
            'wind rose analysis for site assessment',
            'wind direction analysis and patterns',
            'seasonal wind rose diagram'
          ],
          expectedOriginalIntent: RenewableAnalysisType.WIND_ROSE_ANALYSIS
        },
        {
          queries: [
            'wake effect modeling between turbines',
            'turbine wake analysis and losses',
            'downstream wake impact assessment'
          ],
          expectedOriginalIntent: RenewableAnalysisType.WAKE_ANALYSIS
        },
        {
          queries: [
            'turbine layout optimization algorithm',
            'optimal wind farm layout design',
            'turbine placement optimization'
          ],
          expectedOriginalIntent: RenewableAnalysisType.LAYOUT_OPTIMIZATION
        }
      ];

      for (const { queries, expectedOriginalIntent } of similarTermTests) {
        for (const query of queries) {
          const result = await router.routeQuery(query);
          expect(result.intent.params.originalIntent).toBe(expectedOriginalIntent);
        }
      }
    });

    test('should handle exclusion patterns correctly', async () => {
      const exclusionTests = [
        {
          query: 'terrain analysis excluding wind rose factors',
          shouldBe: RenewableAnalysisType.TERRAIN_ANALYSIS,
          shouldNotBe: RenewableAnalysisType.WIND_ROSE_ANALYSIS
        },
        {
          query: 'wind rose analysis without terrain considerations',
          shouldBe: RenewableAnalysisType.WIND_ROSE_ANALYSIS,
          shouldNotBe: RenewableAnalysisType.TERRAIN_ANALYSIS
        },
        {
          query: 'layout optimization excluding wake effects',
          shouldBe: RenewableAnalysisType.LAYOUT_OPTIMIZATION,
          shouldNotBe: RenewableAnalysisType.WAKE_ANALYSIS
        }
      ];

      for (const { query, shouldBe, shouldNotBe } of exclusionTests) {
        const classificationResult = classifier.classifyIntent(query);
        expect(classificationResult.intent).toBe(shouldBe);
        expect(classificationResult.intent).not.toBe(shouldNotBe);
      }
    });
  });

  describe('Confidence and Fallback Handling', () => {
    test('should provide appropriate confidence levels', async () => {
      const confidenceTests = [
        { query: 'Show wind rose analysis', expectedMinConfidence: 70 },
        { query: 'Optimize turbine layout', expectedMinConfidence: 70 },
        { query: 'Analyze wake effects', expectedMinConfidence: 70 },
        { query: 'Terrain analysis with OSM', expectedMinConfidence: 70 },
        { query: 'renewable energy', expectedMaxConfidence: 60 }, // Ambiguous
        { query: 'site analysis', expectedMaxConfidence: 60 } // Ambiguous
      ];

      for (const { query, expectedMinConfidence, expectedMaxConfidence } of confidenceTests) {
        const result = await router.routeQuery(query);
        
        if (expectedMinConfidence) {
          expect(result.intent.confidence).toBeGreaterThanOrEqual(expectedMinConfidence);
        }
        
        if (expectedMaxConfidence) {
          expect(result.intent.confidence).toBeLessThanOrEqual(expectedMaxConfidence);
          expect(result.requiresConfirmation).toBe(true);
        }
      }
    });

    test('should provide meaningful alternatives for ambiguous queries', async () => {
      const ambiguousQueries = [
        'wind farm analysis',
        'site assessment',
        'renewable energy evaluation',
        'wind project analysis'
      ];

      for (const query of ambiguousQueries) {
        const result = await router.routeQuery(query);
        
        expect(result.requiresConfirmation).toBe(true);
        expect(result.fallbackOptions).toBeDefined();
        expect(result.fallbackOptions!.length).toBeGreaterThan(1);
        
        // All alternatives should have reasonable confidence and descriptions
        result.fallbackOptions!.forEach(option => {
          expect(option.confidence).toBeGreaterThan(20);
          expect(option.description).toBeDefined();
          expect(option.description.length).toBeGreaterThan(10);
        });
      }
    });
  });

  describe('Parameter Extraction Integration', () => {
    test('should extract and preserve parameters through the routing process', async () => {
      const parameterTests = [
        {
          query: 'Analyze terrain at coordinates 40.7128, -74.0060 for 100 MW wind farm within 5 km',
          expectedParams: {
            latitude: 40.7128,
            longitude: -74.0060,
            capacity: 100,
            radius: 5,
            unit: 'km'
          }
        },
        {
          query: 'Wind rose analysis including seasonal and hourly data',
          expectedParams: {
            includeSeasonal: true,
            includeHourly: true
          }
        },
        {
          query: 'Layout optimization considering wake effects and terrain constraints',
          expectedParams: {
            optimizeForWake: true,
            optimizeForTerrain: true
          }
        }
      ];

      for (const { query, expectedParams } of parameterTests) {
        const result = await router.routeQuery(query);
        
        Object.entries(expectedParams).forEach(([key, value]) => {
          expect(result.intent.params[key]).toBe(value);
        });
        
        // Should always preserve the original query
        expect(result.intent.params.query).toBe(query);
      }
    });
  });

  describe('Service Availability Integration', () => {
    test('should handle service availability gracefully', async () => {
      // Test with all services available
      const query = 'Optimize turbine layout';
      const result = await router.routeQuery(query);
      
      expect(result.intent.type).toBe('layout_optimization');
      expect(result.requiresConfirmation).toBe(false);
    });

    test('should provide fallbacks when services are unavailable', async () => {
      // Remove a service to test fallback
      delete process.env.RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME;
      
      const query = 'Optimize turbine layout for wind farm';
      const result = await router.routeQuery(query);
      
      expect(result.requiresConfirmation).toBe(true);
      expect(result.confirmationMessage).toContain('not available');
      
      if (result.fallbackOptions && result.fallbackOptions.length > 0) {
        // Should suggest available alternatives
        expect(result.fallbackOptions.every(option => 
          ['terrain_analysis', 'wake_simulation', 'report_generation'].includes(option.intent)
        )).toBe(true);
      }
    });
  });

  describe('End-to-End Workflow Validation', () => {
    test('should handle a complete renewable energy analysis workflow', async () => {
      const workflowQueries = [
        'Analyze terrain features for wind farm development',
        'Show wind rose analysis for the site',
        'Optimize turbine layout based on terrain and wind data',
        'Analyze wake effects for the optimized layout',
        'Assess overall site suitability for development'
      ];

      const results = [];
      
      for (const query of workflowQueries) {
        const result = await router.routeQuery(query);
        results.push({ query, result });
        
        // Each step should be routed correctly
        expect(result.intent).toBeDefined();
        expect(result.intent.type).toBeDefined();
        expect(result.intent.confidence).toBeGreaterThan(30);
        
        console.log(`Workflow step: "${query}" → ${result.intent.type} (${result.intent.confidence}% confidence)`);
      }
      
      // Verify we got different analysis types (not all terrain)
      const intentTypes = results.map(r => r.result.intent.type);
      const uniqueTypes = new Set(intentTypes);
      
      expect(uniqueTypes.size).toBeGreaterThan(1); // Should have multiple different intent types
      expect(intentTypes).not.toEqual(['terrain_analysis', 'terrain_analysis', 'terrain_analysis', 'terrain_analysis', 'terrain_analysis']);
    });

    test('should maintain consistency across similar queries', async () => {
      const similarQueries = [
        'Show wind rose analysis for this location',
        'Generate wind rose diagram for the site',
        'Wind direction analysis and patterns'
      ];

      const results = [];
      
      for (const query of similarQueries) {
        const result = await router.routeQuery(query);
        results.push(result.intent.params.originalIntent);
      }
      
      // All similar queries should have the same original intent
      expect(new Set(results).size).toBe(1);
      expect(results[0]).toBe(RenewableAnalysisType.WIND_ROSE_ANALYSIS);
    });
  });

  describe('Error Recovery and Robustness', () => {
    test('should handle malformed queries gracefully', async () => {
      const malformedQueries = [
        '', // Empty
        '   ', // Whitespace only
        'xyz123!@#', // Random characters
        'wind rose analisis terrian', // Multiple typos
        'show me the thing for the place' // Very vague
      ];

      for (const query of malformedQueries) {
        const result = await router.routeQuery(query);
        
        // Should not throw errors
        expect(result.intent).toBeDefined();
        expect(result.intent.type).toBeDefined();
        
        // Should require confirmation for unclear queries
        if (query.trim().length === 0 || result.intent.confidence < 50) {
          expect(result.requiresConfirmation).toBe(true);
        }
      }
    });

    test('should provide helpful error messages and suggestions', async () => {
      const unclearQuery = 'renewable stuff';
      const result = await router.routeQuery(unclearQuery);
      
      expect(result.requiresConfirmation).toBe(true);
      expect(result.confirmationMessage).toBeDefined();
      expect(result.fallbackOptions).toBeDefined();
      expect(result.fallbackOptions!.length).toBeGreaterThan(0);
      
      // Error message should be helpful
      expect(result.confirmationMessage!.length).toBeGreaterThan(20);
      expect(result.confirmationMessage).toMatch(/analysis|assessment|not sure/i);
    });
  });

  describe('Performance and Scalability', () => {
    test('should process queries efficiently', async () => {
      const startTime = Date.now();
      
      const queries = [
        'Analyze terrain features',
        'Show wind rose analysis',
        'Optimize turbine layout',
        'Analyze wake effects',
        'Assess site suitability'
      ];
      
      for (const query of queries) {
        await router.routeQuery(query);
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Should process all queries in reasonable time (less than 1 second)
      expect(totalTime).toBeLessThan(1000);
    });

    test('should handle concurrent queries correctly', async () => {
      const queries = [
        'Analyze terrain features for wind farm',
        'Show wind rose analysis for site',
        'Optimize turbine layout design',
        'Analyze wake effects modeling',
        'Assess comprehensive site suitability'
      ];
      
      // Process all queries concurrently
      const results = await Promise.all(
        queries.map(query => router.routeQuery(query))
      );
      
      // All should complete successfully
      expect(results.length).toBe(queries.length);
      results.forEach(result => {
        expect(result.intent).toBeDefined();
        expect(result.intent.type).toBeDefined();
      });
      
      // Should have different intent types (not all the same)
      const intentTypes = results.map(r => r.intent.type);
      const uniqueTypes = new Set(intentTypes);
      expect(uniqueTypes.size).toBeGreaterThan(1);
    });
  });
});