/**
 * Unit tests for RenewableProxyAgent logging functionality
 * 
 * Tests comprehensive logging before/after orchestrator invocation,
 * execution duration tracking, request ID correlation, and error logging.
 */

import { RenewableProxyAgent } from '../renewableProxyAgent';
import { LambdaClient } from '@aws-sdk/client-lambda';

// Mock the renewableConfig module
jest.mock('../../shared/renewableConfig', () => ({
  getRenewableConfig: jest.fn(() => ({
    region: 'us-east-1',
    agentCoreEndpoint: 'test-orchestrator-function',
    enabled: true,
  })),
}));

// Mock AWS SDK Lambda Client
const mockSend = jest.fn();
jest.mock('@aws-sdk/client-lambda', () => {
  const actual = jest.requireActual('@aws-sdk/client-lambda');
  return {
    ...actual,
    LambdaClient: jest.fn(() => ({
      send: mockSend,
    })),
  };
});

describe('RenewableProxyAgent - Comprehensive Logging', () => {
  let agent: RenewableProxyAgent;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockSend.mockReset();
    agent = new RenewableProxyAgent();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  // Helper function to mock both validation and invocation
  const mockSuccessfulValidationAndInvocation = (invokeResponse: any) => {
    mockSend.mockImplementation((command) => {
      if (command.constructor.name === 'GetFunctionCommand') {
        return Promise.resolve({
          Configuration: {
            FunctionName: 'test-orchestrator-function',
            FunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-orchestrator-function',
          },
        });
      }
      // InvokeCommand
      return Promise.resolve({
        StatusCode: 200,
        Payload: new TextEncoder().encode(JSON.stringify(invokeResponse)),
      });
    });
  };

  // Helper function to mock validation success but invocation error
  const mockValidationSuccessInvocationError = (error: Error) => {
    mockSend.mockImplementation((command) => {
      if (command.constructor.name === 'GetFunctionCommand') {
        return Promise.resolve({
          Configuration: {
            FunctionName: 'test-orchestrator-function',
            FunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-orchestrator-function',
          },
        });
      }
      // InvokeCommand - reject with error
      return Promise.reject(error);
    });
  };

  describe('Logging before orchestrator invocation', () => {
    it('should log request ID and query details before invocation', async () => {
      const mockResponse = {
        success: true,
        message: 'Analysis complete',
        artifacts: [],
        thoughtSteps: [],
      };

      mockSuccessfulValidationAndInvocation(mockResponse);

      await agent.processQuery('Test query for wind farm analysis');

      // Check that pre-invocation log was called
      const preInvocationLog = consoleLogSpy.mock.calls.find(call => 
        call[0]?.includes('🚀 RenewableProxyAgent: Invoking orchestrator')
      );

      expect(preInvocationLog).toBeDefined();
      expect(preInvocationLog[1]).toMatchObject({
        functionName: 'test-orchestrator-function',
        payload: expect.objectContaining({
          query: expect.stringContaining('Test query'),
        }),
      });
      expect(preInvocationLog[1].requestId).toBeDefined();
      expect(preInvocationLog[1].timestamp).toBeDefined();
    });

    it('should log payload size and structure', async () => {
      const mockResponse = {
        success: true,
        message: 'Analysis complete',
        artifacts: [],
        thoughtSteps: [],
      };

      mockSuccessfulValidationAndInvocation(mockResponse);

      await agent.processQuery('Test query');

      const preInvocationLog = consoleLogSpy.mock.calls.find(call => 
        call[0]?.includes('🚀 RenewableProxyAgent: Invoking orchestrator')
      );

      expect(preInvocationLog[1]).toHaveProperty('payloadSize');
      expect(preInvocationLog[1].payloadSize).toBeGreaterThan(0);
    });

    it('should log session ID if set', async () => {
      const mockResponse = {
        success: true,
        message: 'Analysis complete',
        artifacts: [],
        thoughtSteps: [],
      };

      mockSuccessfulValidationAndInvocation(mockResponse);

      agent.setSessionId('test-session-123');
      await agent.processQuery('Test query');

      const initialLog = consoleLogSpy.mock.calls.find(call => 
        call[0]?.includes('🌱 RenewableProxyAgent: Processing query')
      );

      expect(initialLog[1]).toMatchObject({
        sessionId: 'test-session-123',
      });
    });
  });

  describe('Logging after successful invocation', () => {
    it('should log response structure and success status', async () => {
      const mockResponse = {
        success: true,
        message: 'Analysis complete',
        artifacts: [
          {
            type: 'terrain_map',
            data: { features: [] },
            metadata: { projectId: 'test-project-123' },
          },
        ],
        thoughtSteps: [{ action: 'Analyzing terrain' }],
      };

      mockSuccessfulValidationAndInvocation(mockResponse);

      await agent.processQuery('Test query');

      const postInvocationLog = consoleLogSpy.mock.calls.find(call => 
        call[0]?.includes('✅ RenewableProxyAgent: Orchestrator response received')
      );

      expect(postInvocationLog).toBeDefined();
      expect(postInvocationLog[1]).toMatchObject({
        success: true,
        responseStructure: {
          hasMessage: true,
          artifactCount: 1,
          thoughtStepCount: 1,
          hasError: false,
        },
      });
    });

    it('should log project ID from response', async () => {
      const mockResponse = {
        success: true,
        message: 'Analysis complete',
        artifacts: [
          {
            type: 'terrain_map',
            data: { features: [] },
            metadata: { projectId: 'terrain-2024-abc123' },
          },
        ],
        thoughtSteps: [],
      };

      mockSuccessfulValidationAndInvocation(mockResponse);

      await agent.processQuery('Test query');

      const postInvocationLog = consoleLogSpy.mock.calls.find(call => 
        call[0]?.includes('✅ RenewableProxyAgent: Orchestrator response received')
      );

      expect(postInvocationLog[1]).toMatchObject({
        projectId: 'terrain-2024-abc123',
      });
    });

    it('should log feature count from response', async () => {
      const mockFeatures = Array(151).fill(null).map((_, i) => ({
        id: `feature-${i}`,
        type: 'Feature',
      }));

      const mockResponse = {
        success: true,
        message: 'Analysis complete',
        artifacts: [
          {
            type: 'terrain_map',
            data: { features: mockFeatures },
            metadata: { projectId: 'test-project' },
          },
        ],
        thoughtSteps: [],
      };

      mockSuccessfulValidationAndInvocation(mockResponse);

      await agent.processQuery('Test query');

      const postInvocationLog = consoleLogSpy.mock.calls.find(call => 
        call[0]?.includes('✅ RenewableProxyAgent: Orchestrator response received')
      );

      expect(postInvocationLog[1]).toMatchObject({
        featureCount: 151,
      });
    });

    it('should log final summary with all metrics', async () => {
      const mockResponse = {
        success: true,
        message: 'Analysis complete',
        artifacts: [
          {
            type: 'terrain_map',
            data: { features: Array(151).fill({}) },
            metadata: { projectId: 'terrain-2024-xyz' },
          },
        ],
        thoughtSteps: [],
      };

      mockSuccessfulValidationAndInvocation(mockResponse);

      await agent.processQuery('Test query');

      const summaryLog = consoleLogSpy.mock.calls.find(call => 
        call[0]?.includes('🎉 RenewableProxyAgent: Query processed successfully')
      );

      expect(summaryLog).toBeDefined();
      expect(summaryLog[1]).toMatchObject({
        summary: {
          artifactCount: 1,
          thoughtStepCount: expect.any(Number),
          projectId: 'terrain-2024-xyz',
          featureCount: 151,
        },
        performance: {
          totalProcessing: expect.stringMatching(/\d+ms/),
          retryCount: 0,
        },
      });
    });
  });

  describe('Logging after failed invocation', () => {
    it('should log error details with request ID', async () => {
      const mockError = new Error('Orchestrator timeout');
      mockValidationSuccessInvocationError(mockError);

      await agent.processQuery('Test query');

      const errorLog = consoleErrorSpy.mock.calls.find(call => 
        call[0]?.includes('❌ RenewableProxyAgent: Error processing query')
      );

      expect(errorLog).toBeDefined();
      expect(errorLog[1]).toMatchObject({
        requestId: expect.any(String),
        error: {
          name: 'Error',
          message: expect.any(String), // Accept any error message
          stack: expect.any(String),
        },
      });
    });

    it('should log error in invocation log', async () => {
      const mockError = new Error('Lambda invocation failed');
      mockValidationSuccessInvocationError(mockError);

      await agent.processQuery('Test query');

      const invocationLog = consoleLogSpy.mock.calls.find(call => 
        call[0]?.includes('📊 RenewableProxyAgent: Invocation log (error)')
      );

      expect(invocationLog).toBeDefined();
      expect(invocationLog[1]).toMatchObject({
        success: false,
        error: 'Lambda invocation failed',
        duration: expect.any(Number),
      });
    });

    it('should log duration even on error', async () => {
      const mockError = new Error('Test error');
      mockValidationSuccessInvocationError(mockError);

      await agent.processQuery('Test query');

      const errorLog = consoleErrorSpy.mock.calls.find(call => 
        call[0]?.includes('❌ RenewableProxyAgent: Error processing query')
      );

      expect(errorLog[1]).toHaveProperty('duration');
      expect(errorLog[1].duration).toMatch(/\d+ms/);
    });
  });

  describe('Execution duration tracking', () => {
    it('should track orchestrator invocation duration', async () => {
      const mockResponse = {
        success: true,
        message: 'Analysis complete',
        artifacts: [],
        thoughtSteps: [],
      };

      mockSuccessfulValidationAndInvocation(mockResponse);

      await agent.processQuery('Test query');

      const durationLog = consoleLogSpy.mock.calls.find(call => 
        call[0]?.includes('⏱️ RenewableProxyAgent: Orchestrator invocation completed')
      );

      expect(durationLog).toBeDefined();
      expect(durationLog[1]).toMatchObject({
        duration: expect.stringMatching(/\d+ms/),
        statusCode: 200,
      });
    });

    it('should track total processing duration', async () => {
      const mockResponse = {
        success: true,
        message: 'Analysis complete',
        artifacts: [],
        thoughtSteps: [],
      };

      mockSuccessfulValidationAndInvocation(mockResponse);

      await agent.processQuery('Test query');

      const summaryLog = consoleLogSpy.mock.calls.find(call => 
        call[0]?.includes('🎉 RenewableProxyAgent: Query processed successfully')
      );

      expect(summaryLog[1].performance).toMatchObject({
        totalProcessing: expect.stringMatching(/\d+ms/),
        retryCount: expect.any(Number),
      });
    });

    it('should track retry count', async () => {
      const mockResponse = {
        success: true,
        message: 'Analysis complete',
        artifacts: [{ type: 'test', data: {} }],
        thoughtSteps: [{ action: 'test' }],
      };

      mockSuccessfulValidationAndInvocation(mockResponse);

      await agent.processQuery('Test query');

      const summaryLog = consoleLogSpy.mock.calls.find(call => 
        call[0]?.includes('🎉 RenewableProxyAgent: Query processed successfully')
      );

      expect(summaryLog[1].performance.retryCount).toBe(0);
    });
  });

  describe('Request ID correlation', () => {
    it('should generate unique request ID for each query', async () => {
      const mockResponse = {
        success: true,
        message: 'Analysis complete',
        artifacts: [],
        thoughtSteps: [],
      };

      mockSuccessfulValidationAndInvocation(mockResponse);

      await agent.processQuery('Query 1');
      
      // Get request IDs from first query
      const firstQueryRequestIds = consoleLogSpy.mock.calls
        .filter(call => call[1]?.requestId)
        .map(call => call[1].requestId);
      
      // Clear logs before second query
      consoleLogSpy.mockClear();
      
      await agent.processQuery('Query 2');
      
      // Get request IDs from second query
      const secondQueryRequestIds = consoleLogSpy.mock.calls
        .filter(call => call[1]?.requestId)
        .map(call => call[1].requestId);

      // Each query should have at least one request ID
      expect(firstQueryRequestIds.length).toBeGreaterThan(0);
      expect(secondQueryRequestIds.length).toBeGreaterThan(0);
      
      // Request IDs from different queries should be different
      expect(firstQueryRequestIds[0]).not.toBe(secondQueryRequestIds[0]);
    });

    it('should use same request ID across all logs for single query', async () => {
      const mockResponse = {
        success: true,
        message: 'Analysis complete',
        artifacts: [],
        thoughtSteps: [],
      };

      mockSuccessfulValidationAndInvocation(mockResponse);

      await agent.processQuery('Test query');

      const logsWithRequestId = consoleLogSpy.mock.calls
        .filter(call => call[1]?.requestId)
        .map(call => call[1].requestId);

      expect(logsWithRequestId.length).toBeGreaterThan(0);
      const uniqueRequestIds = new Set(logsWithRequestId);
      expect(uniqueRequestIds.size).toBe(1); // All same request ID
    });

    it('should include request ID in error logs', async () => {
      const mockError = new Error('Test error');
      mockValidationSuccessInvocationError(mockError);

      await agent.processQuery('Test query');

      const errorLog = consoleErrorSpy.mock.calls.find(call => 
        call[0]?.includes('❌ RenewableProxyAgent: Error processing query')
      );

      expect(errorLog[1]).toHaveProperty('requestId');
      expect(typeof errorLog[1].requestId).toBe('string');
      expect(errorLog[1].requestId.length).toBeGreaterThan(0);
    });
  });

  describe('Invocation log structure', () => {
    it('should log complete invocation record on success', async () => {
      const mockResponse = {
        success: true,
        message: 'Analysis complete',
        artifacts: [
          {
            type: 'terrain_map',
            data: { features: Array(151).fill({}) },
            metadata: { projectId: 'test-project' },
          },
        ],
        thoughtSteps: [],
      };

      mockSuccessfulValidationAndInvocation(mockResponse);

      await agent.processQuery('Test query');

      const invocationLog = consoleLogSpy.mock.calls.find(call => 
        call[0]?.includes('📊 RenewableProxyAgent: Invocation log')
      );

      expect(invocationLog).toBeDefined();
      expect(invocationLog[1]).toMatchObject({
        requestId: expect.any(String),
        timestamp: expect.any(Number),
        query: expect.any(String),
        orchestratorFunctionName: 'test-orchestrator-function',
        payload: expect.any(Object),
        success: true,
        projectId: 'test-project',
        featureCount: 151,
        artifactCount: 1,
      });
    });

    it('should log complete invocation record on error', async () => {
      const mockError = new Error('Test error');
      mockValidationSuccessInvocationError(mockError);

      await agent.processQuery('Test query');

      const invocationLog = consoleLogSpy.mock.calls.find(call => 
        call[0]?.includes('📊 RenewableProxyAgent: Invocation log (error)')
      );

      expect(invocationLog).toBeDefined();
      expect(invocationLog[1]).toMatchObject({
        requestId: expect.any(String),
        timestamp: expect.any(Number),
        query: expect.any(String),
        orchestratorFunctionName: 'test-orchestrator-function',
        payload: expect.any(Object),
        duration: expect.any(Number),
        success: false,
        error: 'Test error',
      });
    });
  });
});
