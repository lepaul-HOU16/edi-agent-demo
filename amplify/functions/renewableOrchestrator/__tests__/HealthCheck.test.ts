/**
 * Health Check Endpoint Tests
 * 
 * Tests for orchestrator health check functionality including metadata,
 * tool configuration status, and environment variable validation.
 * 
 * Requirements: 6.1, 6.2
 */

import { handler } from '../handler';
import type { OrchestratorRequest } from '../types';

// Mock environment variables
const mockEnvVars = {
  RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME: 'test-terrain-function',
  RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME: 'test-layout-function',
  RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME: 'test-simulation-function',
  RENEWABLE_REPORT_TOOL_FUNCTION_NAME: 'test-report-function',
  AWS_LAMBDA_FUNCTION_NAME: 'test-orchestrator-function',
  AWS_LAMBDA_FUNCTION_VERSION: '$LATEST',
  AWS_REGION: 'us-east-1'
};

describe('Health Check Endpoint', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = process.env;
    
    // Set mock environment variables
    process.env = { ...originalEnv, ...mockEnvVars };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Basic Health Check', () => {
    test('should respond to __health_check__ query', async () => {
      const request: OrchestratorRequest = {
        query: '__health_check__',
        userId: 'test-user',
        sessionId: 'test-session'
      };

      const response = await handler(request);

      expect(response.success).toBe(true);
      expect(response.message).toBe('Orchestrator is healthy');
    });

    test('should return health check response structure', async () => {
      const request: OrchestratorRequest = {
        query: '__health_check__',
        userId: 'test-user',
        sessionId: 'test-session'
      };

      const response = await handler(request);

      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('artifacts');
      expect(response).toHaveProperty('thoughtSteps');
      expect(response).toHaveProperty('metadata');
      expect(response.artifacts).toEqual([]);
      expect(response.thoughtSteps).toEqual([]);
    });

    test('should complete health check quickly', async () => {
      const request: OrchestratorRequest = {
        query: '__health_check__',
        userId: 'test-user',
        sessionId: 'test-session'
      };

      const startTime = Date.now();
      const response = await handler(request);
      const duration = Date.now() - startTime;

      expect(response.success).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
    });
  });

  describe('Metadata Validation', () => {
    test('should return correct orchestrator metadata', async () => {
      const request: OrchestratorRequest = {
        query: '__health_check__',
        userId: 'test-user',
        sessionId: 'test-session'
      };

      const response = await handler(request);

      expect(response.metadata.health).toBeDefined();
      expect(response.metadata.health?.functionName).toBe('test-orchestrator-function');
      expect(response.metadata.health?.version).toBe('$LATEST');
      expect(response.metadata.health?.region).toBe('us-east-1');
    });

    test('should handle missing AWS metadata gracefully', async () => {
      // Remove AWS environment variables
      delete process.env.AWS_LAMBDA_FUNCTION_NAME;
      delete process.env.AWS_LAMBDA_FUNCTION_VERSION;
      delete process.env.AWS_REGION;

      const request: OrchestratorRequest = {
        query: '__health_check__',
        userId: 'test-user',
        sessionId: 'test-session'
      };

      const response = await handler(request);

      expect(response.success).toBe(true);
      expect(response.metadata.health?.functionName).toBe('unknown');
      expect(response.metadata.health?.version).toBe('unknown');
      expect(response.metadata.health?.region).toBe('unknown');
    });

    test('should include execution time in metadata', async () => {
      const request: OrchestratorRequest = {
        query: '__health_check__',
        userId: 'test-user',
        sessionId: 'test-session'
      };

      const response = await handler(request);

      expect(response.metadata.executionTime).toBeDefined();
      expect(typeof response.metadata.executionTime).toBe('number');
      expect(response.metadata.executionTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Tool Configuration Status', () => {
    test('should report all tools as configured when environment variables are set', async () => {
      const request: OrchestratorRequest = {
        query: '__health_check__',
        userId: 'test-user',
        sessionId: 'test-session'
      };

      const response = await handler(request);

      expect(response.metadata.health?.toolsConfigured).toBeDefined();
      expect(response.metadata.health?.toolsConfigured.terrain).toBe(true);
      expect(response.metadata.health?.toolsConfigured.layout).toBe(true);
      expect(response.metadata.health?.toolsConfigured.simulation).toBe(true);
      expect(response.metadata.health?.toolsConfigured.report).toBe(true);
    });

    test('should report missing tool configuration', async () => {
      // Remove one tool environment variable
      delete process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME;

      const request: OrchestratorRequest = {
        query: '__health_check__',
        userId: 'test-user',
        sessionId: 'test-session'
      };

      const response = await handler(request);

      expect(response.metadata.health?.toolsConfigured.terrain).toBe(false);
      expect(response.metadata.health?.toolsConfigured.layout).toBe(true);
      expect(response.metadata.health?.toolsConfigured.simulation).toBe(true);
      expect(response.metadata.health?.toolsConfigured.report).toBe(true);
    });

    test('should report all tools as not configured when no environment variables are set', async () => {
      // Remove all tool environment variables
      delete process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME;
      delete process.env.RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME;
      delete process.env.RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME;
      delete process.env.RENEWABLE_REPORT_TOOL_FUNCTION_NAME;

      const request: OrchestratorRequest = {
        query: '__health_check__',
        userId: 'test-user',
        sessionId: 'test-session'
      };

      const response = await handler(request);

      expect(response.metadata.health?.toolsConfigured.terrain).toBe(false);
      expect(response.metadata.health?.toolsConfigured.layout).toBe(false);
      expect(response.metadata.health?.toolsConfigured.simulation).toBe(false);
      expect(response.metadata.health?.toolsConfigured.report).toBe(false);
    });

    test('should include tool function names in health check', async () => {
      const request: OrchestratorRequest = {
        query: '__health_check__',
        userId: 'test-user',
        sessionId: 'test-session'
      };

      const response = await handler(request);

      expect(response.metadata.health?.toolFunctionNames).toBeDefined();
      expect(response.metadata.health?.toolFunctionNames.terrain).toBe('test-terrain-function');
      expect(response.metadata.health?.toolFunctionNames.layout).toBe('test-layout-function');
      expect(response.metadata.health?.toolFunctionNames.simulation).toBe('test-simulation-function');
      expect(response.metadata.health?.toolFunctionNames.report).toBe('test-report-function');
    });

    test('should show "not configured" for missing tool function names', async () => {
      // Remove some tool environment variables
      delete process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME;
      delete process.env.RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME;

      const request: OrchestratorRequest = {
        query: '__health_check__',
        userId: 'test-user',
        sessionId: 'test-session'
      };

      const response = await handler(request);

      expect(response.metadata.health?.toolFunctionNames.terrain).toBe('not configured');
      expect(response.metadata.health?.toolFunctionNames.layout).toBe('test-layout-function');
      expect(response.metadata.health?.toolFunctionNames.simulation).toBe('not configured');
      expect(response.metadata.health?.toolFunctionNames.report).toBe('test-report-function');
    });
  });

  describe('Environment Variable Logging', () => {
    test('should log environment variables on health check', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const request: OrchestratorRequest = {
        query: '__health_check__',
        userId: 'test-user',
        sessionId: 'test-session'
      };

      await handler(request);

      // Verify that environment variables were logged
      expect(consoleSpy).toHaveBeenCalledWith('Health check requested');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Environment variables:',
        expect.objectContaining({
          RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME: 'test-terrain-function',
          RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME: 'test-layout-function',
          RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME: 'test-simulation-function',
          RENEWABLE_REPORT_TOOL_FUNCTION_NAME: 'test-report-function',
          AWS_LAMBDA_FUNCTION_NAME: 'test-orchestrator-function',
          AWS_LAMBDA_FUNCTION_VERSION: '$LATEST',
          AWS_REGION: 'us-east-1'
        })
      );

      consoleSpy.mockRestore();
    });

    test('should log undefined for missing environment variables', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Remove some environment variables
      delete process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME;
      delete process.env.AWS_LAMBDA_FUNCTION_NAME;

      const request: OrchestratorRequest = {
        query: '__health_check__',
        userId: 'test-user',
        sessionId: 'test-session'
      };

      await handler(request);

      // Verify that undefined values are logged
      expect(consoleSpy).toHaveBeenCalledWith(
        'Environment variables:',
        expect.objectContaining({
          RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME: undefined,
          AWS_LAMBDA_FUNCTION_NAME: undefined
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Response Structure Validation', () => {
    test('should return empty arrays for artifacts and thoughtSteps', async () => {
      const request: OrchestratorRequest = {
        query: '__health_check__',
        userId: 'test-user',
        sessionId: 'test-session'
      };

      const response = await handler(request);

      expect(Array.isArray(response.artifacts)).toBe(true);
      expect(response.artifacts.length).toBe(0);
      expect(Array.isArray(response.thoughtSteps)).toBe(true);
      expect(response.thoughtSteps.length).toBe(0);
    });

    test('should return empty toolsUsed array in metadata', async () => {
      const request: OrchestratorRequest = {
        query: '__health_check__',
        userId: 'test-user',
        sessionId: 'test-session'
      };

      const response = await handler(request);

      expect(Array.isArray(response.metadata.toolsUsed)).toBe(true);
      expect(response.metadata.toolsUsed.length).toBe(0);
    });

    test('should not include error or validationErrors in metadata', async () => {
      const request: OrchestratorRequest = {
        query: '__health_check__',
        userId: 'test-user',
        sessionId: 'test-session'
      };

      const response = await handler(request);

      expect(response.metadata.error).toBeUndefined();
      expect(response.metadata.validationErrors).toBeUndefined();
    });

    test('should not include projectId in metadata for health check', async () => {
      const request: OrchestratorRequest = {
        query: '__health_check__',
        userId: 'test-user',
        sessionId: 'test-session'
      };

      const response = await handler(request);

      expect(response.metadata.projectId).toBeUndefined();
    });
  });

  describe('Integration with Normal Queries', () => {
    test('should not interfere with normal query processing', async () => {
      // First, do a health check
      const healthRequest: OrchestratorRequest = {
        query: '__health_check__',
        userId: 'test-user',
        sessionId: 'test-session'
      };

      const healthResponse = await handler(healthRequest);
      expect(healthResponse.success).toBe(true);
      expect(healthResponse.message).toBe('Orchestrator is healthy');

      // Then, do a normal query (this will fail without mocking Lambda client, but should not be a health check)
      const normalRequest: OrchestratorRequest = {
        query: 'Analyze terrain at 40.7128, -74.0060',
        userId: 'test-user',
        sessionId: 'test-session'
      };

      const normalResponse = await handler(normalRequest);
      
      // Should not be a health check response
      expect(normalResponse.message).not.toBe('Orchestrator is healthy');
      expect(normalResponse.metadata.health).toBeUndefined();
    });

    test('should only respond to exact __health_check__ query', async () => {
      // Test exact match
      const healthCheckRequest: OrchestratorRequest = {
        query: '__health_check__',
        userId: 'test-user',
        sessionId: 'test-session'
      };

      const healthCheckResponse = await handler(healthCheckRequest);
      expect(healthCheckResponse.message).toBe('Orchestrator is healthy');

      // Test non-matching queries (these should not trigger health check)
      const nonMatchingQueries = [
        'health_check',
        '__health_check',
        'health check',
        '__HEALTH_CHECK__',
        ' __health_check__ ',
        '__health_check__?'
      ];

      for (const query of nonMatchingQueries) {
        const request: OrchestratorRequest = {
          query,
          userId: 'test-user',
          sessionId: 'test-session'
        };

        const response = await handler(request);
        
        // Should not be a health check response
        expect(response.message).not.toBe('Orchestrator is healthy');
        expect(response.metadata.health).toBeUndefined();
      }
    }, 30000); // Increase timeout to 30 seconds for this test
  });

  describe('Edge Cases', () => {
    test('should handle health check with context', async () => {
      const request: OrchestratorRequest = {
        query: '__health_check__',
        userId: 'test-user',
        sessionId: 'test-session',
        context: {
          previousResults: { some: 'data' },
          projectId: 'test-project'
        }
      };

      const response = await handler(request);

      expect(response.success).toBe(true);
      expect(response.message).toBe('Orchestrator is healthy');
      // Context should not affect health check
    });

    test('should handle concurrent health checks', async () => {
      const requests = Array.from({ length: 5 }, () => ({
        query: '__health_check__',
        userId: 'test-user',
        sessionId: 'test-session'
      }));

      const responses = await Promise.all(requests.map(req => handler(req)));

      responses.forEach(response => {
        expect(response.success).toBe(true);
        expect(response.message).toBe('Orchestrator is healthy');
        expect(response.metadata.health).toBeDefined();
      });
    });

    test('should return consistent results across multiple health checks', async () => {
      const request: OrchestratorRequest = {
        query: '__health_check__',
        userId: 'test-user',
        sessionId: 'test-session'
      };

      const response1 = await handler(request);
      const response2 = await handler(request);

      // Should have same structure and configuration status
      expect(response1.success).toBe(response2.success);
      expect(response1.message).toBe(response2.message);
      expect(response1.metadata.health?.toolsConfigured).toEqual(
        response2.metadata.health?.toolsConfigured
      );
      expect(response1.metadata.health?.toolFunctionNames).toEqual(
        response2.metadata.health?.toolFunctionNames
      );
    });
  });
});
