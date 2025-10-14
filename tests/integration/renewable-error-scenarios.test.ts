/**
 * Integration tests for renewable orchestrator error scenarios
 * Tests various failure modes and validates error messages and remediation steps
 */

import { RenewableProxyAgent } from '../../amplify/functions/agents/renewableProxyAgent';
import { LambdaClient } from '@aws-sdk/client-lambda';

// Mock the renewableConfig module
jest.mock('../../amplify/functions/shared/renewableConfig', () => ({
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

describe('Renewable Orchestrator Error Scenarios', () => {
  let agent: RenewableProxyAgent;
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockSend.mockReset();
    agent = new RenewableProxyAgent();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Orchestrator Not Deployed', () => {
    it('should return clear error when orchestrator function does not exist', async () => {
      mockSend.mockRejectedValue({
        name: 'ResourceNotFoundException',
        message: 'Function not found',
        $metadata: {}
      });

      const response = await agent.processQuery('Analyze wind farm site at 40.7128, -74.0060');

      expect(response.success).toBe(false);
      expect(response.message.toLowerCase()).toContain('not deployed');
      expect(response.error).toBeDefined();
      expect(response.error?.type).toBe('NotFound');
      expect(response.error?.remediationSteps).toBeDefined();
      expect(response.error?.remediationSteps?.some((step: string) => 
        step.includes('npx ampx sandbox') || step.includes('deploy')
      )).toBe(true);
    });

    it('should provide helpful remediation steps for missing orchestrator', async () => {
      mockSend.mockRejectedValue({
        name: 'ResourceNotFoundException',
        message: 'Function not found',
        $metadata: {}
      });

      const response = await agent.processQuery('Analyze terrain features');

      expect(response.error?.remediationSteps).toBeDefined();
      expect(response.error?.remediationSteps?.length).toBeGreaterThan(0);
      expect(response.error?.remediationSteps?.some((step: string) => 
        step.includes('npx ampx sandbox') || step.includes('deploy')
      )).toBe(true);
    });
  });

  describe('Permission Denied', () => {
    it('should return clear error when IAM permissions are missing', async () => {
      mockSend.mockRejectedValue({
        name: 'AccessDeniedException',
        message: 'User is not authorized to perform: lambda:InvokeFunction',
        $metadata: {}
      });

      const response = await agent.processQuery('Analyze wind farm site');

      expect(response.success).toBe(false);
      expect(response.message.toLowerCase()).toContain('permission');
      expect(response.error?.type).toBe('PermissionDenied');
      expect(response.error?.remediationSteps).toBeDefined();
    });

    it('should provide IAM-specific remediation steps', async () => {
      mockSend.mockRejectedValue({
        name: 'AccessDeniedException',
        message: 'Access denied',
        $metadata: {}
      });

      const response = await agent.processQuery('Analyze site');

      expect(response.error?.remediationSteps).toBeDefined();
      expect(response.error?.remediationSteps?.some((step: string) => 
        step.toLowerCase().includes('iam') || step.toLowerCase().includes('permission')
      )).toBe(true);
    });
  });

  describe('Invalid Response', () => {
    it('should detect missing required fields in response', async () => {
      mockSend.mockResolvedValue({
        Payload: new TextEncoder().encode(JSON.stringify({
          data: 'some data'
          // Missing: success, message, artifacts
        }))
      });

      const response = await agent.processQuery('Analyze site');

      expect(response.success).toBe(false);
      expect(response.error?.type).toBe('InvalidResponse');
      expect(response.message.toLowerCase()).toContain('invalid');
    });

    it('should detect malformed artifacts array', async () => {
      mockSend.mockResolvedValue({
        Payload: new TextEncoder().encode(JSON.stringify({
          success: true,
          message: 'Complete',
          artifacts: 'not-an-array'
        }))
      });

      const response = await agent.processQuery('Analyze site');

      expect(response.success).toBe(false);
      expect(response.error?.type).toBe('InvalidResponse');
    });

    it('should detect default project ID', async () => {
      mockSend.mockResolvedValue({
        Payload: new TextEncoder().encode(JSON.stringify({
          success: true,
          message: 'Complete',
          artifacts: [],
          projectId: 'default-project'
        }))
      });

      const response = await agent.processQuery('Analyze site');

      expect(response.success).toBe(false);
      expect(response.error?.type).toBe('InvalidResponse');
      expect(response.message.toLowerCase()).toContain('default-project');
    });

    it('should provide validation-specific remediation steps', async () => {
      mockSend.mockResolvedValue({
        Payload: new TextEncoder().encode(JSON.stringify({
          invalid: 'response'
        }))
      });

      const response = await agent.processQuery('Analyze site');

      expect(response.error?.remediationSteps).toBeDefined();
      expect(response.error?.remediationSteps?.some((step: string) => 
        step.toLowerCase().includes('log') || step.toLowerCase().includes('check')
      )).toBe(true);
    });
  });

  describe('Tool Lambda Failure', () => {
    it('should handle terrain Lambda failure gracefully', async () => {
      mockSend.mockResolvedValue({
        Payload: new TextEncoder().encode(JSON.stringify({
          success: false,
          message: 'Terrain analysis failed',
          error: {
            type: 'ToolFailure',
            details: 'Terrain Lambda execution failed',
            toolName: 'terrain'
          },
          artifacts: []
        }))
      });

      const response = await agent.processQuery('Analyze terrain');

      expect(response.success).toBe(false);
      expect(response.error?.type).toBe('ToolFailure');
      expect(response.message.toLowerCase()).toContain('failed');
    });

    it('should provide tool-specific remediation steps', async () => {
      mockSend.mockResolvedValue({
        Payload: new TextEncoder().encode(JSON.stringify({
          success: false,
          message: 'Tool execution failed',
          error: {
            type: 'ToolFailure',
            details: 'Python dependencies missing',
            toolName: 'layout'
          },
          artifacts: []
        }))
      });

      const response = await agent.processQuery('Optimize layout');

      expect(response.error?.remediationSteps).toBeDefined();
      expect(response.error?.remediationSteps?.some((step: string) => 
        step.toLowerCase().includes('tool') || 
        step.toLowerCase().includes('lambda') ||
        step.toLowerCase().includes('dependencies')
      )).toBe(true);
    });
  });

  describe('Error Message Clarity', () => {
    it('should provide user-friendly error messages', async () => {
      const errorScenarios = [
        {
          error: { name: 'ResourceNotFoundException', message: 'Not found', $metadata: {} },
          expectedKeyword: 'deployed'
        },
        {
          error: { name: 'AccessDeniedException', message: 'Access denied', $metadata: {} },
          expectedKeyword: 'permission'
        }
      ];

      for (const scenario of errorScenarios) {
        mockSend.mockReset();
        mockSend.mockRejectedValue(scenario.error);

        const response = await agent.processQuery('Test query');

        expect(response.message.toLowerCase()).toContain(scenario.expectedKeyword);
      }
    });

    it('should include request ID for debugging when available', async () => {
      mockSend.mockRejectedValue({
        name: 'ServiceException',
        message: 'Internal error',
        $metadata: {
          requestId: 'test-request-123'
        }
      });

      const response = await agent.processQuery('Test query');

      // Request ID should be logged or included in error details
      expect(response.error).toBeDefined();
    });
  });

  describe('Remediation Steps Accuracy', () => {
    it('should provide actionable steps for each error type', async () => {
      const errorTypes = [
        'ResourceNotFoundException',
        'AccessDeniedException'
      ];

      for (const errorType of errorTypes) {
        mockSend.mockReset();
        mockSend.mockRejectedValue({
          name: errorType,
          message: 'Error',
          $metadata: {}
        });

        const response = await agent.processQuery('Test query');

        expect(response.error?.remediationSteps).toBeDefined();
        expect(response.error?.remediationSteps?.length).toBeGreaterThan(0);
        
        // Each step should be actionable
        const actionableSteps = response.error?.remediationSteps?.filter((step: string) =>
          /\b(check|run|verify|ensure|update|deploy|review)\b/i.test(step)
        );
        expect(actionableSteps?.length).toBeGreaterThan(0);
      }
    });

    it('should include CloudWatch log references when appropriate', async () => {
      mockSend.mockRejectedValue({
        name: 'ServiceException',
        message: 'Internal error',
        $metadata: {
          requestId: 'test-123'
        }
      });

      const response = await agent.processQuery('Test query');

      const hasLogReference = response.error?.remediationSteps?.some((step: string) =>
        step.toLowerCase().includes('cloudwatch') || 
        step.toLowerCase().includes('log')
      );
      expect(hasLogReference).toBe(true);
    });
  });

  describe('Loading State Handling', () => {
    it('should clear loading state on error', async () => {
      mockSend.mockRejectedValue({
        name: 'ServiceException',
        message: 'Error',
        $metadata: {}
      });

      const response = await agent.processQuery('Test query');

      // Response should be complete even on error
      expect(response).toBeDefined();
      expect(response.success).toBe(false);
      // Should have artifacts array (empty) to signal completion
      expect(response.artifacts).toBeDefined();
      expect(Array.isArray(response.artifacts)).toBe(true);
    });

    it('should allow retry after error', async () => {
      let callCount = 0;
      mockSend.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          throw { name: 'ServiceException', message: 'Error', $metadata: {} };
        }
        return {
          Payload: new TextEncoder().encode(JSON.stringify({
            success: true,
            message: 'Success',
            artifacts: []
          }))
        };
      });

      // First call should fail
      const response1 = await agent.processQuery('Test query');
      expect(response1.success).toBe(false);

      // Second call should succeed
      const response2 = await agent.processQuery('Test query');
      expect(response2.success).toBe(true);
    });
  });
});
