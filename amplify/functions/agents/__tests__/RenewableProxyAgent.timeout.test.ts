/**
 * Unit tests for RenewableProxyAgent timeout handling
 * 
 * Tests:
 * - Warning logged at 30 seconds
 * - Timeout error at 60 seconds
 * - Timeout error message includes remediation
 * - Loading state cleared on timeout
 * - Timeout with retry logic
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

describe('RenewableProxyAgent - Timeout Handling', () => {
  let agent: RenewableProxyAgent;
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockSend.mockReset();
    agent = new RenewableProxyAgent();
    
    // Spy on console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  // Helper function to mock both validation and invocation
  const mockSuccessfulValidation = () => {
    mockSend.mockResolvedValueOnce({
      Configuration: {
        FunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-orchestrator',
        Runtime: 'nodejs18.x',
      },
    });
  };

  describe('Warning at 30 seconds', () => {
    it('should log warning if orchestrator takes > 30 seconds', async () => {
      jest.useFakeTimers();

      mockSuccessfulValidation();

      // Mock slow orchestrator response (35 seconds)
      mockSend.mockImplementationOnce(async () => {
        // Advance timers to 35 seconds
        await jest.advanceTimersByTimeAsync(35000);
        
        return {
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify({
            success: true,
            message: 'Analysis complete',
            artifacts: [],
            thoughtSteps: [],
          })),
        };
      });

      // Start processing
      const promise = agent.processQuery('Analyze wind farm site');

      // Wait for promise to complete
      const response = await promise;

      // Verify warning was logged
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('⚠️ RenewableProxyAgent: Orchestrator taking longer than expected'),
        expect.objectContaining({
          duration: expect.stringContaining('30'),
        })
      );

      expect(response.success).toBe(true);
    });

    it('should include duration in warning message', async () => {
      jest.useFakeTimers();

      mockSuccessfulValidation();

      mockSend.mockImplementationOnce(async () => {
        await jest.advanceTimersByTimeAsync(32000);
        return {
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify({
            success: true,
            message: 'Complete',
            artifacts: [],
            thoughtSteps: [],
          })),
        };
      });

      const promise = agent.processQuery('Test query');
      await promise;

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          duration: expect.any(String),
          threshold: '30s',
        })
      );
    });
  });

  describe('Timeout at 60 seconds', () => {
    it('should return timeout error if orchestrator takes > 60 seconds', async () => {
      jest.useFakeTimers();

      mockSuccessfulValidation();

      // Mock orchestrator that hangs
      mockSend.mockImplementationOnce(async () => {
        // Simulate hanging request - advance timers past timeout
        await jest.advanceTimersByTimeAsync(61000);
        return {
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify({
            success: true,
            message: 'Complete',
            artifacts: [],
            thoughtSteps: [],
          })),
        };
      });

      const response = await agent.processQuery('Analyze terrain');

      expect(response.success).toBe(false);
      expect(response.message).toContain('timeout');
      expect(response.message).toContain('60 seconds');
    });

    it('should log timeout error with details', async () => {
      jest.useFakeTimers();

      mockSuccessfulValidation();

      mockSend.mockImplementationOnce(async () => {
        await jest.advanceTimersByTimeAsync(61000);
        return {
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify({ success: true })),
        };
      });

      await agent.processQuery('Test query');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ RenewableProxyAgent: Orchestrator timeout'),
        expect.objectContaining({
          duration: expect.stringContaining('60'),
          threshold: '60s',
        })
      );
    });
  });

  describe('Timeout error message with remediation', () => {
    it('should include remediation steps in timeout error', async () => {
      jest.useFakeTimers();

      mockSuccessfulValidation();

      mockSend.mockImplementationOnce(async () => {
        await jest.advanceTimersByTimeAsync(61000);
        return { StatusCode: 200, Payload: new TextEncoder().encode('{}') };
      });

      const response = await agent.processQuery('Analyze site');

      expect(response.message).toContain('Try again with a smaller analysis area');
      expect(response.message).toContain('Check Lambda timeout settings');
      expect(response.message).toContain('CloudWatch logs');
    });

    it('should include timeout-specific error type', async () => {
      mockSuccessfulValidation();

      // Mock a timeout error directly
      mockSend.mockImplementationOnce(async () => {
        const error: any = new Error('Orchestrator timeout after 60 seconds');
        error.name = 'TimeoutError';
        throw error;
      });

      const response = await agent.processQuery('Test');

      expect(response.thoughtSteps).toBeDefined();
      // Find the completion/error step (not the routing step)
      const errorStep = response.thoughtSteps?.find(step => 
        step.type === 'completion' && step.status === 'error'
      );
      expect(errorStep).toBeDefined();
      // The error step title should be "Analysis Timeout"
      expect(errorStep?.title).toMatch(/Timeout|Analysis Timeout/);
    });
  });

  describe('Loading state cleared on timeout', () => {
    it('should return complete response structure on timeout', async () => {
      jest.useFakeTimers();

      mockSuccessfulValidation();

      mockSend.mockImplementationOnce(async () => {
        await jest.advanceTimersByTimeAsync(61000);
        return { StatusCode: 200, Payload: new TextEncoder().encode('{}') };
      });

      const response = await agent.processQuery('Test query');

      // Verify response structure allows frontend to clear loading state
      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('artifacts');
      expect(response).toHaveProperty('thoughtSteps');
      expect(response).toHaveProperty('agentUsed');
      
      expect(response.success).toBe(false);
      expect(response.artifacts).toEqual([]);
      expect(response.thoughtSteps).toBeDefined();
      expect(response.thoughtSteps!.length).toBeGreaterThan(0);
    });

    it('should mark thought steps as complete or error on timeout', async () => {
      jest.useFakeTimers();

      mockSuccessfulValidation();

      mockSend.mockImplementationOnce(async () => {
        await jest.advanceTimersByTimeAsync(61000);
        return { StatusCode: 200, Payload: new TextEncoder().encode('{}') };
      });

      const response = await agent.processQuery('Test');

      // All thought steps should have a final status
      response.thoughtSteps?.forEach(step => {
        expect(['complete', 'error']).toContain(step.status);
      });
    });
  });

  describe('Timeout with retry logic', () => {
    it('should not retry on timeout errors', async () => {
      jest.useFakeTimers();

      mockSuccessfulValidation();

      let invocationCount = 0;
      mockSend.mockImplementation(async () => {
        invocationCount++;
        await jest.advanceTimersByTimeAsync(61000);
        return { StatusCode: 200, Payload: new TextEncoder().encode('{}') };
      });

      await agent.processQuery('Test query');

      // Should only invoke once for the actual query (validation was already done)
      expect(invocationCount).toBe(1);
    });

    it('should handle timeout during retry attempt', async () => {
      mockSuccessfulValidation();

      let invocationCount = 0;
      mockSend.mockImplementation(async () => {
        invocationCount++;
        
        if (invocationCount === 1) {
          // First attempt: retryable error (service error)
          const error: any = new Error('Internal server error');
          error.name = 'ServiceException';
          throw error;
        } else {
          // Second attempt: timeout error
          const timeoutError: any = new Error('Orchestrator timeout after 60 seconds');
          timeoutError.name = 'TimeoutError';
          throw timeoutError;
        }
      });

      const response = await agent.processQuery('Test query');

      expect(response.success).toBe(false);
      expect(response.message).toContain('timeout');
      expect(invocationCount).toBe(2); // First attempt + one retry
    });

    it('should aggregate timeout with previous retry attempts in error', async () => {
      mockSuccessfulValidation();

      let invocationCount = 0;
      mockSend.mockImplementation(async () => {
        invocationCount++;
        
        if (invocationCount === 1) {
          const throttleError: any = new Error('Rate exceeded');
          throttleError.name = 'ThrottlingException';
          throw throttleError;
        } else {
          const timeoutError: any = new Error('Orchestrator timeout after 60 seconds');
          timeoutError.name = 'TimeoutError';
          throw timeoutError;
        }
      });

      const response = await agent.processQuery('Test');

      expect(response.success).toBe(false);
      
      // Should mention timeout in error logs
      const errorLog = consoleErrorSpy.mock.calls.find(call => {
        const firstArg = typeof call[0] === 'string' ? call[0] : '';
        const secondArg = call[1];
        const secondArgStr = secondArg && typeof secondArg === 'object' ? JSON.stringify(secondArg) : '';
        return firstArg.includes('timeout') || secondArgStr.includes('timeout');
      });
      expect(errorLog).toBeDefined();
    });
  });

  describe('Timeout threshold configuration', () => {
    it('should use 60 second timeout threshold', async () => {
      jest.useFakeTimers();

      mockSuccessfulValidation();

      mockSend.mockImplementationOnce(async () => {
        await jest.advanceTimersByTimeAsync(61000);
        return { StatusCode: 200, Payload: new TextEncoder().encode('{}') };
      });

      const response = await agent.processQuery('Test');

      expect(response.success).toBe(false);
      expect(response.message).toContain('60 seconds');
    });

    it('should use 30 second warning threshold', async () => {
      jest.useFakeTimers();

      mockSuccessfulValidation();

      mockSend.mockImplementationOnce(async () => {
        await jest.advanceTimersByTimeAsync(35000);
        return {
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify({
            success: true,
            message: 'Complete',
            artifacts: [],
            thoughtSteps: [],
          })),
        };
      });

      await agent.processQuery('Test');

      // Should have warning at 30s
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          threshold: '30s',
        })
      );
    });
  });
});
