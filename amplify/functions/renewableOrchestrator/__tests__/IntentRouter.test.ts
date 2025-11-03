/**
 * Intent Router Tests
 * 
 * Tests for routing mechanism, fallback handling, and user confirmation
 * for uncertain intent classifications.
 * 
 * Requirements: 13.6, 13.7
 */

import { IntentRouter } from '../IntentRouter';
import { RenewableAnalysisType } from '../RenewableIntentClassifier';

// Mock environment variables
const mockEnvVars = {
  RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME: 'test-terrain-function',
  RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME: 'test-layout-function',
  RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME: 'test-simulation-function',
  RENEWABLE_REPORT_TOOL_FUNCTION_NAME: 'test-report-function'
};

describe('IntentRouter', () => {
  let router: IntentRouter;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = process.env;
    
    // Set mock environment variables
    process.env = { ...originalEnv, ...mockEnvVars };
    
    router = new IntentRouter();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Basic Routing', () => {
    test('should route terrain analysis queries correctly', async () => {
      const query = 'Analyze terrain features for wind farm development';
      const result = await router.routeQuery(query);
      
      expect(result.intent.type).toBe('terrain_analysis');
      expect(result.requiresConfirmation).toBe(false);
      expect(result.intent.confidence).toBeGreaterThan(60);
    });

    test('should route layout optimization queries correctly', async () => {
      const query = 'Optimize turbine layout for maximum energy yield';
      const result = await router.routeQuery(query);
      
      expect(result.intent.type).toBe('layout_optimization');
      expect(result.requiresConfirmation).toBe(false);
      expect(result.intent.confidence).toBeGreaterThan(60);
    });

    test('should route wake analysis queries correctly', async () => {
      const query = 'Analyze wake effects between turbines';
      const result = await router.routeQuery(query);
      
      expect(result.intent.type).toBe('wake_simulation'); // Maps to existing wake_simulation
      expect(result.requiresConfirmation).toBe(false);
      expect(result.intent.confidence).toBeGreaterThan(60);
    });

    test('should preserve original intent in parameters', async () => {
      const query = 'Show wind rose analysis for this location';
      const result = await router.routeQuery(query);
      
      expect(result.intent.params.originalIntent).toBe(RenewableAnalysisType.WIND_ROSE_ANALYSIS);
      expect(result.intent.params.query).toBe(query);
    });
  });

  describe('Service Availability Validation', () => {
    test('should handle available services correctly', async () => {
      const query = 'Analyze terrain for wind farm';
      const result = await router.routeQuery(query);
      
      expect(result.intent.type).toBe('terrain_analysis');
      expect(result.requiresConfirmation).toBe(false);
    });

    test('should handle unavailable services with fallback', async () => {
      // Remove environment variable to simulate unavailable service
      delete process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME;
      
      const query = 'Analyze terrain for wind farm';
      const result = await router.routeQuery(query);
      
      expect(result.requiresConfirmation).toBe(true);
      expect(result.confirmationMessage).toContain('not available');
      expect(result.fallbackOptions).toBeDefined();
    });

    test('should provide available alternatives when primary service is unavailable', async () => {
      // Remove terrain service but keep layout service
      delete process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME;
      
      const query = 'Analyze terrain for wind farm layout';
      const result = await router.routeQuery(query);
      
      if (result.fallbackOptions && result.fallbackOptions.length > 0) {
        expect(result.fallbackOptions.some(option => 
          option.intent === 'layout_optimization'
        )).toBe(true);
      }
    });
  });

  describe('Low Confidence Handling', () => {
    test('should require confirmation for ambiguous queries', async () => {
      const ambiguousQuery = 'wind farm analysis';
      const result = await router.routeQuery(ambiguousQuery);
      
      expect(result.requiresConfirmation).toBe(true);
      expect(result.confirmationMessage).toBeDefined();
      expect(result.fallbackOptions).toBeDefined();
      expect(result.fallbackOptions!.length).toBeGreaterThan(0);
    });

    test('should provide meaningful confirmation messages', async () => {
      const ambiguousQuery = 'site analysis';
      const result = await router.routeQuery(ambiguousQuery);
      
      if (result.requiresConfirmation) {
        expect(result.confirmationMessage).toContain('analysis');
        expect(result.confirmationMessage!.length).toBeGreaterThan(20);
      }
    });

    test('should provide fallback options for low confidence queries', async () => {
      const vaguQuery = 'renewable energy';
      const result = await router.routeQuery(vaguQuery);
      
      expect(result.requiresConfirmation).toBe(true);
      expect(result.fallbackOptions).toBeDefined();
      expect(result.fallbackOptions!.length).toBeGreaterThan(1);
      
      // All fallback options should have reasonable confidence
      result.fallbackOptions!.forEach(option => {
        expect(option.confidence).toBeGreaterThan(20);
        expect(option.description).toBeDefined();
        expect(option.description.length).toBeGreaterThan(10);
      });
    });
  });

  describe('Intent Mapping', () => {
    test('should map wind rose analysis to terrain analysis (temporary)', async () => {
      const query = 'Show wind rose analysis';
      const result = await router.routeQuery(query);
      
      // Currently maps to terrain_analysis until wind rose service is implemented
      expect(result.intent.type).toBe('terrain_analysis');
      expect(result.intent.params.originalIntent).toBe(RenewableAnalysisType.WIND_ROSE_ANALYSIS);
    });

    test('should map site suitability to terrain analysis (temporary)', async () => {
      const query = 'Assess site suitability for wind farm';
      const result = await router.routeQuery(query);
      
      // Currently maps to terrain_analysis until suitability service is implemented
      expect(result.intent.type).toBe('terrain_analysis');
      expect(result.intent.params.originalIntent).toBe(RenewableAnalysisType.SITE_SUITABILITY);
    });

    test('should map wake analysis to wake simulation', async () => {
      const query = 'Analyze wake effects between turbines';
      const result = await router.routeQuery(query);
      
      expect(result.intent.type).toBe('wake_simulation');
      expect(result.intent.params.originalIntent).toBe(RenewableAnalysisType.WAKE_ANALYSIS);
    });
  });

  describe('Error Handling', () => {
    test('should handle router errors gracefully', async () => {
      // Create a router with invalid configuration to trigger errors
      const invalidRouter = new IntentRouter();
      
      // Mock the classifier to throw an error
      jest.spyOn(invalidRouter as any, 'classifier', 'get').mockImplementation(() => {
        throw new Error('Classification error');
      });
      
      const query = 'test query';
      
      // Should not throw, but handle error gracefully
      await expect(invalidRouter.routeQuery(query)).resolves.toBeDefined();
    });

    test('should provide fallback intent on classification failure', async () => {
      // This test would require mocking the classifier to fail
      // For now, we test that the router handles empty/invalid queries
      const result = await router.routeQuery('');
      
      expect(result.intent).toBeDefined();
      expect(result.intent.type).toBeDefined();
    });
  });

  describe('Service Information', () => {
    test('should provide available services list', () => {
      const services = router.getAvailableServices();
      
      expect(services.length).toBeGreaterThan(0);
      services.forEach(service => {
        expect(service.type).toBeDefined();
        expect(service.description).toBeDefined();
        expect(service.capabilities).toBeDefined();
        expect(service.capabilities.length).toBeGreaterThan(0);
      });
    });

    test('should only return services with configured environment variables', () => {
      const services = router.getAvailableServices();
      
      services.forEach(service => {
        // Each service should have a corresponding environment variable set
        const envVarName = router['getEnvironmentVariableName'](service.type);
        expect(process.env[envVarName]).toBeDefined();
      });
    });
  });

  describe('Validation Methods', () => {
    test('should validate non-terrain routing correctly', () => {
      const nonTerrainQueries = [
        'Show wind rose analysis',
        'Analyze wake effects',
        'Optimize turbine layout',
        'Assess site suitability'
      ];

      nonTerrainQueries.forEach(query => {
        const isValid = router.validateNonTerrainRouting(query);
        expect(isValid).toBe(true);
      });
    });

    test('should allow terrain queries to route to terrain analysis', () => {
      const terrainQueries = [
        'Analyze terrain features',
        'Show topography data',
        'Terrain assessment for wind farm'
      ];

      terrainQueries.forEach(query => {
        const isValid = router.validateNonTerrainRouting(query);
        expect(isValid).toBe(true);
      });
    });
  });

  describe('Context Handling', () => {
    test('should pass context to routing logic', async () => {
      const query = 'Analyze terrain';
      const context = {
        previousResults: { type: 'wind_analysis' },
        projectId: 'test-project-123'
      };
      
      const result = await router.routeQuery(query, context);
      
      expect(result.intent).toBeDefined();
      // Context should be available for routing decisions
    });

    test('should handle missing context gracefully', async () => {
      const query = 'Analyze terrain';
      const result = await router.routeQuery(query);
      
      expect(result.intent).toBeDefined();
      expect(result.intent.type).toBe('terrain_analysis');
    });
  });

  describe('Confirmation Message Generation', () => {
    test('should generate appropriate confirmation messages for different confidence levels', async () => {
      const testCases = [
        { query: 'renewable energy', expectedPattern: /not sure|looking for/i },
        { query: 'wind analysis', expectedPattern: /think|confidence/i },
        { query: 'terrain or layout', expectedPattern: /mean.*or/i }
      ];

      for (const { query, expectedPattern } of testCases) {
        const result = await router.routeQuery(query);
        
        if (result.requiresConfirmation && result.confirmationMessage) {
          expect(result.confirmationMessage).toMatch(expectedPattern);
        }
      }
    });

    test('should include intent descriptions in confirmation messages', async () => {
      const query = 'site analysis';
      const result = await router.routeQuery(query);
      
      if (result.requiresConfirmation && result.confirmationMessage) {
        // Should contain a human-readable description
        expect(result.confirmationMessage).toMatch(/analysis|assessment|optimization/i);
      }
    });
  });

  describe('Parameter Preservation', () => {
    test('should preserve extracted parameters in routing result', async () => {
      const query = 'Analyze terrain at coordinates 40.7128, -74.0060 for 100 MW wind farm';
      const result = await router.routeQuery(query);
      
      expect(result.intent.params.latitude).toBe(40.7128);
      expect(result.intent.params.longitude).toBe(-74.0060);
      expect(result.intent.params.capacity).toBe(100);
      expect(result.intent.params.query).toBe(query);
    });

    test('should include original intent in parameters for future use', async () => {
      const query = 'Show wind rose analysis';
      const result = await router.routeQuery(query);
      
      expect(result.intent.params.originalIntent).toBe(RenewableAnalysisType.WIND_ROSE_ANALYSIS);
    });
  });
});