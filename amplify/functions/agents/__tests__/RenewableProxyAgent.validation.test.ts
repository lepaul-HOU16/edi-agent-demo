/**
 * Unit tests for RenewableProxyAgent orchestrator validation functionality
 * 
 * Tests validation of orchestrator function name, Lambda existence checks,
 * pre-flight validation, caching mechanism, and error messages.
 */

import { RenewableProxyAgent } from '../renewableProxyAgent';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';

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

describe('RenewableProxyAgent - Orchestrator Validation', () => {
  let agent: RenewableProxyAgent;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockSend.mockReset();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Validation with valid orchestrator function name', () => {
    it('should successfully validate when orchestrator function exists', async () => {
      // Mock GetFunctionCommand to return success
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve({
            Configuration: {
              FunctionName: 'test-orchestrator-function',
              FunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-orchestrator-function',
            },
          });
        }
        // Mock InvokeCommand
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify({
            success: true,
            message: 'Test response',
            artifacts: [],
            thoughtSteps: [],
          })),
        });
      });

      agent = new RenewableProxyAgent();
      const result = await agent.processQuery('Test query');

      expect(result.success).toBe(true);
      
      // Verify validation was performed
      const validationLog = consoleLogSpy.mock.calls.find(call => 
        call[0]?.includes('✅ RenewableProxyAgent: Orchestrator validation passed')
      );
      expect(validationLog).toBeDefined();
    });

    it('should log validation success details', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve({
            Configuration: {
              FunctionName: 'test-orchestrator-function',
              FunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-orchestrator-function',
            },
          });
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify({
            success: true,
            message: 'Test response',
            artifacts: [],
            thoughtSteps: [],
          })),
        });
      });

      agent = new RenewableProxyAgent();
      await agent.processQuery('Test query');

      const validationLog = consoleLogSpy.mock.calls.find(call => 
        call[0]?.includes('✅ RenewableProxyAgent: Orchestrator validation passed')
      );

      expect(validationLog[1]).toMatchObject({
        functionName: 'test-orchestrator-function',
        functionArn: expect.stringContaining('test-orchestrator-function'),
      });
    });
  });

  describe('Validation with missing function name', () => {
    it('should return error when orchestrator function name is not set', async () => {
      // Mock config to return undefined function name
      const getRenewableConfig = require('../../shared/renewableConfig').getRenewableConfig;
      getRenewableConfig.mockReturnValueOnce({
        region: 'us-east-1',
        agentCoreEndpoint: undefined,
        enabled: true,
      });

      agent = new RenewableProxyAgent();
      const result = await agent.processQuery('Test query');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Orchestrator function name is not configured');
    });

    it('should return error when orchestrator function name is empty string', async () => {
      const getRenewableConfig = require('../../shared/renewableConfig').getRenewableConfig;
      getRenewableConfig.mockReturnValueOnce({
        region: 'us-east-1',
        agentCoreEndpoint: '',
        enabled: true,
      });

      agent = new RenewableProxyAgent();
      const result = await agent.processQuery('Test query');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Orchestrator function name is not configured');
    });

    it('should provide remediation steps for missing function name', async () => {
      const getRenewableConfig = require('../../shared/renewableConfig').getRenewableConfig;
      getRenewableConfig.mockReturnValueOnce({
        region: 'us-east-1',
        agentCoreEndpoint: undefined,
        enabled: true,
      });

      agent = new RenewableProxyAgent();
      const result = await agent.processQuery('Test query');

      expect(result.message).toContain('RENEWABLE_ORCHESTRATOR_FUNCTION_NAME');
      expect(result.message).toContain('npx ampx sandbox');
    });
  });

  describe('Validation with non-existent Lambda', () => {
    it('should return error when Lambda function does not exist', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          const error: any = new Error('Function not found');
          error.name = 'ResourceNotFoundException';
          return Promise.reject(error);
        }
        return Promise.resolve({});
      });

      agent = new RenewableProxyAgent();
      const result = await agent.processQuery('Test query');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Orchestrator Lambda function does not exist');
    });

    it('should provide deployment guidance for non-existent Lambda', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          const error: any = new Error('Function not found');
          error.name = 'ResourceNotFoundException';
          return Promise.reject(error);
        }
        return Promise.resolve({});
      });

      agent = new RenewableProxyAgent();
      const result = await agent.processQuery('Test query');

      expect(result.message.toLowerCase()).toContain('deploy');
      expect(result.message).toContain('test-orchestrator-function');
    });

    it('should log validation failure details', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          const error: any = new Error('Function not found');
          error.name = 'ResourceNotFoundException';
          return Promise.reject(error);
        }
        return Promise.resolve({});
      });

      agent = new RenewableProxyAgent();
      await agent.processQuery('Test query');

      const errorLog = consoleErrorSpy.mock.calls.find(call => 
        call[0]?.includes('❌ RenewableProxyAgent: Orchestrator validation failed')
      );

      expect(errorLog).toBeDefined();
      expect(errorLog[1]).toMatchObject({
        functionName: 'test-orchestrator-function',
        error: 'ResourceNotFoundException',
      });
    });
  });

  describe('Validation caching mechanism', () => {
    it('should cache validation result after first successful check', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve({
            Configuration: {
              FunctionName: 'test-orchestrator-function',
              FunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-orchestrator-function',
            },
          });
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify({
            success: true,
            message: 'Test response',
            artifacts: [],
            thoughtSteps: [],
          })),
        });
      });

      agent = new RenewableProxyAgent();
      
      // First query - should perform validation
      await agent.processQuery('Query 1');
      
      const firstCallCount = mockSend.mock.calls.filter(
        call => call[0].constructor.name === 'GetFunctionCommand'
      ).length;
      
      expect(firstCallCount).toBe(1);
      
      // Second query - should use cached result
      await agent.processQuery('Query 2');
      
      const secondCallCount = mockSend.mock.calls.filter(
        call => call[0].constructor.name === 'GetFunctionCommand'
      ).length;
      
      // Should still be 1 (not called again)
      expect(secondCallCount).toBe(1);
    });

    it('should log when using cached validation result', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve({
            Configuration: {
              FunctionName: 'test-orchestrator-function',
            },
          });
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify({
            success: true,
            message: 'Test response',
            artifacts: [],
            thoughtSteps: [],
          })),
        });
      });

      agent = new RenewableProxyAgent();
      
      await agent.processQuery('Query 1');
      consoleLogSpy.mockClear();
      
      await agent.processQuery('Query 2');
      
      const cachedLog = consoleLogSpy.mock.calls.find(call => 
        call[0]?.includes('RenewableProxyAgent: Using cached validation result')
      );
      
      expect(cachedLog).toBeDefined();
    });

    it('should not cache failed validation results', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          const error: any = new Error('Function not found');
          error.name = 'ResourceNotFoundException';
          return Promise.reject(error);
        }
        return Promise.resolve({});
      });

      agent = new RenewableProxyAgent();
      
      // First query - validation fails
      await agent.processQuery('Query 1');
      
      const firstCallCount = mockSend.mock.calls.filter(
        call => call[0].constructor.name === 'GetFunctionCommand'
      ).length;
      
      expect(firstCallCount).toBe(1);
      
      // Second query - should try validation again
      await agent.processQuery('Query 2');
      
      const secondCallCount = mockSend.mock.calls.filter(
        call => call[0].constructor.name === 'GetFunctionCommand'
      ).length;
      
      // Should be 2 (called again because first failed)
      expect(secondCallCount).toBe(2);
    });
  });

  describe('Error messages for validation failures', () => {
    it('should provide clear error message for missing function name', async () => {
      const getRenewableConfig = require('../../shared/renewableConfig').getRenewableConfig;
      getRenewableConfig.mockReturnValueOnce({
        region: 'us-east-1',
        agentCoreEndpoint: undefined,
        enabled: true,
      });

      agent = new RenewableProxyAgent();
      const result = await agent.processQuery('Test query');

      expect(result.message).toContain('Orchestrator function name is not configured');
      expect(result.message).toContain('environment variable');
      expect(result.message).toContain('RENEWABLE_ORCHESTRATOR_FUNCTION_NAME');
    });

    it('should provide clear error message for non-existent function', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          const error: any = new Error('Function not found');
          error.name = 'ResourceNotFoundException';
          return Promise.reject(error);
        }
        return Promise.resolve({});
      });

      agent = new RenewableProxyAgent();
      const result = await agent.processQuery('Test query');

      expect(result.message).toContain('Orchestrator Lambda function does not exist');
      expect(result.message).toContain('test-orchestrator-function');
      expect(result.message.toLowerCase()).toContain('deploy');
    });

    it('should provide clear error message for permission errors', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          const error: any = new Error('Access denied');
          error.name = 'AccessDeniedException';
          return Promise.reject(error);
        }
        return Promise.resolve({});
      });

      agent = new RenewableProxyAgent();
      const result = await agent.processQuery('Test query');

      expect(result.message).toContain('Permission denied');
      expect(result.message).toContain('IAM permissions');
      expect(result.message).toContain('lambda:GetFunction');
    });

    it('should include remediation steps in error response', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          const error: any = new Error('Function not found');
          error.name = 'ResourceNotFoundException';
          return Promise.reject(error);
        }
        return Promise.resolve({});
      });

      agent = new RenewableProxyAgent();
      const result = await agent.processQuery('Test query');

      // Should have thought steps with remediation
      expect(result.thoughtSteps).toBeDefined();
      expect(result.thoughtSteps!.length).toBeGreaterThan(1);
      
      // Check that at least one error step contains remediation with "deploy"
      const errorSteps = result.thoughtSteps!.filter(step => step.status === 'error');
      expect(errorSteps.length).toBeGreaterThan(0);
      
      const hasDeployInRemediation = errorSteps.some(step => 
        step.summary.toLowerCase().includes('deploy')
      );
      expect(hasDeployInRemediation).toBe(true);
    });

    it('should handle unexpected validation errors gracefully', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.reject(new Error('Unexpected network error'));
        }
        return Promise.resolve({});
      });

      agent = new RenewableProxyAgent();
      const result = await agent.processQuery('Test query');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Error validating orchestrator');
      expect(result.message).toContain('Unexpected network error');
    });
  });

  describe('Pre-flight check behavior', () => {
    it('should perform validation before first invocation', async () => {
      const commandOrder: string[] = [];
      
      mockSend.mockImplementation((command) => {
        commandOrder.push(command.constructor.name);
        
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve({
            Configuration: {
              FunctionName: 'test-orchestrator-function',
            },
          });
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify({
            success: true,
            message: 'Test response',
            artifacts: [],
            thoughtSteps: [],
          })),
        });
      });

      agent = new RenewableProxyAgent();
      await agent.processQuery('Test query');

      // GetFunctionCommand should come before InvokeCommand
      const getFunctionIndex = commandOrder.indexOf('GetFunctionCommand');
      const invokeIndex = commandOrder.indexOf('InvokeCommand');
      
      expect(getFunctionIndex).toBeGreaterThanOrEqual(0);
      expect(invokeIndex).toBeGreaterThan(getFunctionIndex);
    });

    it('should skip invocation if validation fails', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          const error: any = new Error('Function not found');
          error.name = 'ResourceNotFoundException';
          return Promise.reject(error);
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify({
            success: true,
            message: 'Should not reach here',
            artifacts: [],
            thoughtSteps: [],
          })),
        });
      });

      agent = new RenewableProxyAgent();
      await agent.processQuery('Test query');

      // InvokeCommand should not have been called
      const invokeCommands = mockSend.mock.calls.filter(
        call => call[0].constructor.name === 'InvokeCommand'
      );
      
      expect(invokeCommands.length).toBe(0);
    });
  });
});
