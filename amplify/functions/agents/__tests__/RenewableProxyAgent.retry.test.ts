/**
 * Unit tests for RenewableProxyAgent retry logic
 * 
 * Tests retry logic with exponential backoff, error categorization,
 * and proper handling of different error types.
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

describe('RenewableProxyAgent - Retry Logic', () => {
  let agent: RenewableProxyAgent;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockReset();
    agent = new RenewableProxyAgent();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  // Helper function to mock validation success
  const mockValidationSuccess = () => {
    return {
      Configuration: {
        FunctionName: 'test-orchestrator-function',
        FunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-orchestrator-function',
      },
    };
  };

  // Helper function to create successful response
  const createSuccessResponse = () => ({
    success: true,
    message: 'Analysis complete',
    artifacts: [],
    thoughtSteps: [],
  });

  describe('Successful invocation on first attempt', () => {
    it('should not retry when first invocation succeeds', async () => {
      let invocationCount = 0;

      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve(mockValidationSuccess());
        }
        // InvokeCommand
        invocationCount++;
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify(createSuccessResponse())),
        });
      });

      const result = await agent.processQuery('Test query');

      expect(result.success).toBe(true);
      expect(invocationCount).toBe(1); // Only one invocation, no retries
    });

    it('should not log retry attempts when first invocation succeeds', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve(mockValidationSuccess());
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify(createSuccessResponse())),
        });
      });

      await agent.processQuery('Test query');

      const retryLogs = consoleLogSpy.mock.calls.filter(call => 
        call[0]?.includes('🔄 RenewableProxyAgent: Retry attempt')
      );

      expect(retryLogs.length).toBe(0);
    });
  });

  describe('Retry on timeout error', () => {
    it('should retry on timeout error', async () => {
      let invocationCount = 0;

      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve(mockValidationSuccess());
        }
        // InvokeCommand
        invocationCount++;
        if (invocationCount < 3) {
          const error: any = new Error('Task timed out after 60.00 seconds');
          error.name = 'TimeoutError';
          return Promise.reject(error);
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify(createSuccessResponse())),
        });
      });

      const result = await agent.processQuery('Test query');

      expect(result.success).toBe(true);
      expect(invocationCount).toBe(3); // 2 retries + 1 success
    });

    it('should log each retry attempt for timeout', async () => {
      let invocationCount = 0;

      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve(mockValidationSuccess());
        }
        invocationCount++;
        if (invocationCount < 2) {
          const error: any = new Error('Task timed out');
          error.name = 'TimeoutError';
          return Promise.reject(error);
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify(createSuccessResponse())),
        });
      });

      await agent.processQuery('Test query');

      const retryLogs = consoleLogSpy.mock.calls.filter(call => 
        call[0]?.includes('🔄 RenewableProxyAgent: Retry attempt')
      );

      expect(retryLogs.length).toBe(1); // One retry before success
      expect(retryLogs[0][1]).toMatchObject({
        attempt: 2,
        reason: 'TimeoutError',
        message: expect.stringContaining('timed out'),
      });
    });
  });

  describe('Retry on transient failure', () => {
    it('should retry on service unavailable error', async () => {
      let invocationCount = 0;

      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve(mockValidationSuccess());
        }
        invocationCount++;
        if (invocationCount < 2) {
          const error: any = new Error('Service Unavailable');
          error.name = 'ServiceException';
          error.$metadata = { httpStatusCode: 503 };
          return Promise.reject(error);
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify(createSuccessResponse())),
        });
      });

      const result = await agent.processQuery('Test query');

      expect(result.success).toBe(true);
      expect(invocationCount).toBe(2);
    });

    it('should retry on throttling error', async () => {
      let invocationCount = 0;

      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve(mockValidationSuccess());
        }
        invocationCount++;
        if (invocationCount < 2) {
          const error: any = new Error('Rate exceeded');
          error.name = 'ThrottlingException';
          return Promise.reject(error);
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify(createSuccessResponse())),
        });
      });

      const result = await agent.processQuery('Test query');

      expect(result.success).toBe(true);
      expect(invocationCount).toBe(2);
    });

    it('should log retry reason for transient failures', async () => {
      let invocationCount = 0;

      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve(mockValidationSuccess());
        }
        invocationCount++;
        if (invocationCount < 2) {
          const error: any = new Error('Service Unavailable');
          error.name = 'ServiceException';
          return Promise.reject(error);
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify(createSuccessResponse())),
        });
      });

      await agent.processQuery('Test query');

      const retryLogs = consoleLogSpy.mock.calls.filter(call => 
        call[0]?.includes('🔄 RenewableProxyAgent: Retry attempt')
      );

      expect(retryLogs.length).toBe(1);
      expect(retryLogs[0][1]).toMatchObject({
        attempt: 2,
        reason: 'ServiceException',
      });
    });
  });

  describe('No retry on permission error', () => {
    it('should not retry on AccessDeniedException', async () => {
      let invocationCount = 0;

      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve(mockValidationSuccess());
        }
        invocationCount++;
        const error: any = new Error('User is not authorized');
        error.name = 'AccessDeniedException';
        return Promise.reject(error);
      });

      const result = await agent.processQuery('Test query');

      expect(result.success).toBe(false);
      expect(invocationCount).toBe(1); // No retries
    });

    it('should not log retry attempts for permission errors', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve(mockValidationSuccess());
        }
        const error: any = new Error('User is not authorized');
        error.name = 'AccessDeniedException';
        return Promise.reject(error);
      });

      await agent.processQuery('Test query');

      const retryLogs = consoleLogSpy.mock.calls.filter(call => 
        call[0]?.includes('🔄 RenewableProxyAgent: Retry attempt')
      );

      expect(retryLogs.length).toBe(0);
    });

    it('should return error immediately for permission errors', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve(mockValidationSuccess());
        }
        const error: any = new Error('User is not authorized');
        error.name = 'AccessDeniedException';
        return Promise.reject(error);
      });

      const result = await agent.processQuery('Test query');

      expect(result.success).toBe(false);
      expect(result.message).toContain('not authorized');
    });
  });

  describe('No retry on validation error', () => {
    it('should not retry on InvalidParameterException', async () => {
      let invocationCount = 0;

      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve(mockValidationSuccess());
        }
        invocationCount++;
        const error: any = new Error('Invalid parameter');
        error.name = 'InvalidParameterException';
        return Promise.reject(error);
      });

      const result = await agent.processQuery('Test query');

      expect(result.success).toBe(false);
      expect(invocationCount).toBe(1); // No retries
    });

    it('should not retry on ResourceNotFoundException', async () => {
      let invocationCount = 0;

      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve(mockValidationSuccess());
        }
        invocationCount++;
        const error: any = new Error('Function not found');
        error.name = 'ResourceNotFoundException';
        return Promise.reject(error);
      });

      const result = await agent.processQuery('Test query');

      expect(result.success).toBe(false);
      expect(invocationCount).toBe(1); // No retries
    });
  });

  describe('Exponential backoff timing', () => {
    it('should use exponential backoff between retries', async () => {
      let invocationCount = 0;
      const invocationTimes: number[] = [];

      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve(mockValidationSuccess());
        }
        invocationCount++;
        invocationTimes.push(Date.now());
        
        if (invocationCount < 3) {
          const error: any = new Error('Service unavailable');
          error.name = 'ServiceException';
          return Promise.reject(error);
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify(createSuccessResponse())),
        });
      });

      await agent.processQuery('Test query');

      expect(invocationCount).toBe(3);
      expect(invocationTimes.length).toBe(3);

      // Check backoff timing (allowing some variance)
      const firstBackoff = invocationTimes[1] - invocationTimes[0];
      const secondBackoff = invocationTimes[2] - invocationTimes[1];

      // First backoff should be ~1000ms, second ~2000ms
      expect(firstBackoff).toBeGreaterThanOrEqual(900);
      expect(firstBackoff).toBeLessThanOrEqual(1200);
      expect(secondBackoff).toBeGreaterThanOrEqual(1900);
      expect(secondBackoff).toBeLessThanOrEqual(2200);
    });

    it('should log backoff delay for each retry', async () => {
      let invocationCount = 0;

      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve(mockValidationSuccess());
        }
        invocationCount++;
        if (invocationCount < 3) {
          const error: any = new Error('Service unavailable');
          error.name = 'ServiceException';
          return Promise.reject(error);
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify(createSuccessResponse())),
        });
      });

      await agent.processQuery('Test query');

      const retryLogs = consoleLogSpy.mock.calls.filter(call => 
        call[0]?.includes('🔄 RenewableProxyAgent: Retry attempt')
      );

      expect(retryLogs.length).toBe(2);
      expect(retryLogs[0][1]).toHaveProperty('backoffMs');
      expect(retryLogs[1][1]).toHaveProperty('backoffMs');
      
      // Verify exponential increase
      const firstBackoff = retryLogs[0][1].backoffMs;
      const secondBackoff = retryLogs[1][1].backoffMs;
      expect(secondBackoff).toBeGreaterThan(firstBackoff);
    });
  });

  describe('Aggregated error after all retries fail', () => {
    it('should return aggregated error after 3 failed attempts', async () => {
      let invocationCount = 0;

      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve(mockValidationSuccess());
        }
        invocationCount++;
        const error: any = new Error('Service unavailable');
        error.name = 'ServiceException';
        return Promise.reject(error);
      });

      const result = await agent.processQuery('Test query');

      expect(result.success).toBe(false);
      expect(invocationCount).toBe(3); // Max retries
      expect(result.message).toContain('after 3 attempts');
    });

    it('should include all error details in aggregated error', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve(mockValidationSuccess());
        }
        const error: any = new Error('Service unavailable');
        error.name = 'ServiceException';
        return Promise.reject(error);
      });

      const result = await agent.processQuery('Test query');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Service unavailable');
      expect(result.message).toContain('3 attempts');
    });

    it('should log final failure with retry summary', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve(mockValidationSuccess());
        }
        const error: any = new Error('Service unavailable');
        error.name = 'ServiceException';
        return Promise.reject(error);
      });

      await agent.processQuery('Test query');

      const failureLogs = consoleErrorSpy.mock.calls.filter(call => 
        call[0]?.includes('❌ RenewableProxyAgent: All retry attempts failed')
      );

      expect(failureLogs.length).toBe(1);
      expect(failureLogs[0][1]).toMatchObject({
        totalAttempts: 3,
        finalError: expect.stringContaining('Service unavailable'),
      });
    });

    it('should include retry history in error response', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve(mockValidationSuccess());
        }
        const error: any = new Error('Timeout');
        error.name = 'TimeoutError';
        return Promise.reject(error);
      });

      const result = await agent.processQuery('Test query');

      expect(result.success).toBe(false);
      expect(result.thoughtSteps).toBeDefined();
      
      // Should have thought steps showing retry attempts
      const retrySteps = result.thoughtSteps?.filter(step => 
        step.summary?.includes('Retry') || step.summary?.includes('attempt')
      );
      
      expect(retrySteps).toBeDefined();
    });
  });

  describe('Mixed error scenarios', () => {
    it('should handle different error types across retries', async () => {
      let invocationCount = 0;

      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve(mockValidationSuccess());
        }
        invocationCount++;
        
        if (invocationCount === 1) {
          const error: any = new Error('Throttling');
          error.name = 'ThrottlingException';
          return Promise.reject(error);
        }
        if (invocationCount === 2) {
          const error: any = new Error('Service unavailable');
          error.name = 'ServiceException';
          return Promise.reject(error);
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify(createSuccessResponse())),
        });
      });

      const result = await agent.processQuery('Test query');

      expect(result.success).toBe(true);
      expect(invocationCount).toBe(3);
    });

    it('should stop retrying if non-retryable error occurs', async () => {
      let invocationCount = 0;

      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve(mockValidationSuccess());
        }
        invocationCount++;
        
        // First attempt returns permission error (non-retryable)
        const error: any = new Error('Access denied');
        error.name = 'AccessDeniedException';
        return Promise.reject(error);
      });

      const result = await agent.processQuery('Test query');

      expect(result.success).toBe(false);
      expect(invocationCount).toBe(1); // Stopped immediately, no retry
    });
  });
});
