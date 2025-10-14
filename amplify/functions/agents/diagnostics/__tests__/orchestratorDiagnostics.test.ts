import { OrchestratorDiagnostics, DiagnosticResult } from '../orchestratorDiagnostics';
import { LambdaClient } from '@aws-sdk/client-lambda';

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

describe('OrchestratorDiagnostics', () => {
  let diagnostics: OrchestratorDiagnostics;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    mockSend.mockReset();
    
    // Set default environment variables
    process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME = 'test-orchestrator';
    process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME = 'test-terrain';
    process.env.RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME = 'test-layout';
    process.env.RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME = 'test-simulation';
    process.env.RENEWABLE_REPORT_TOOL_FUNCTION_NAME = 'test-report';
    process.env.AWS_REGION = 'us-east-1';
    
    diagnostics = new OrchestratorDiagnostics();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('checkOrchestratorExists', () => {
    it('should return success when Lambda exists', async () => {
      mockSend.mockResolvedValueOnce({
        Configuration: {
          FunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-orchestrator',
          Runtime: 'nodejs18.x',
          State: 'Active',
          LastModified: '2024-01-01T00:00:00.000+0000'
        }
      });

      const result = await diagnostics.checkOrchestratorExists();

      expect(result.success).toBe(true);
      expect(result.step).toBe('Check Orchestrator Exists');
      expect(result.details.functionName).toBe('test-orchestrator');
      expect(result.details.functionArn).toContain('test-orchestrator');
      expect(result.details.runtime).toBe('nodejs18.x');
      expect(result.details.state).toBe('Active');
      expect(result.error).toBeUndefined();
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it('should return failure when Lambda does not exist', async () => {
      mockSend.mockRejectedValueOnce({
        name: 'ResourceNotFoundException',
        message: 'Function not found'
      });

      const result = await diagnostics.checkOrchestratorExists();

      expect(result.success).toBe(false);
      expect(result.step).toBe('Check Orchestrator Exists');
      expect(result.details.functionName).toBe('test-orchestrator');
      expect(result.details.errorName).toBe('ResourceNotFoundException');
      expect(result.error).toBe('Function not found');
      expect(result.recommendations).toContain('The orchestrator Lambda function does not exist');
      expect(result.recommendations).toContain('Deploy the function using: npx ampx sandbox');
    });

    it('should return failure when environment variable is not set', async () => {
      delete process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME;
      diagnostics = new OrchestratorDiagnostics();

      const result = await diagnostics.checkOrchestratorExists();

      expect(result.success).toBe(false);
      expect(result.step).toBe('Check Orchestrator Exists');
      expect(result.details.functionName).toBeUndefined();
      expect(result.error).toContain('RENEWABLE_ORCHESTRATOR_FUNCTION_NAME environment variable is not set');
      expect(result.recommendations).toContain('Set RENEWABLE_ORCHESTRATOR_FUNCTION_NAME environment variable');
      expect(result.recommendations).toContain('Run: npx ampx sandbox to deploy all Lambda functions');
    });

    it('should return failure with IAM recommendations when access is denied', async () => {
      mockSend.mockRejectedValueOnce({
        name: 'AccessDeniedException',
        message: 'User is not authorized to perform: lambda:GetFunction'
      });

      const result = await diagnostics.checkOrchestratorExists();

      expect(result.success).toBe(false);
      expect(result.details.errorName).toBe('AccessDeniedException');
      expect(result.recommendations).toContain('IAM permissions are missing for Lambda:GetFunction');
      expect(result.recommendations).toContain('Add lambda:GetFunction permission to the execution role');
    });

    it('should handle generic errors with appropriate recommendations', async () => {
      mockSend.mockRejectedValueOnce({
        name: 'NetworkError',
        message: 'Network connection failed'
      });

      const result = await diagnostics.checkOrchestratorExists();

      expect(result.success).toBe(false);
      expect(result.recommendations).toContain('Check AWS credentials are configured correctly');
      expect(result.recommendations).toContain('Verify network connectivity to AWS');
    });
  });

  describe('testOrchestratorInvocation', () => {
    it('should return success when invocation succeeds', async () => {
      const mockResponse = {
        success: true,
        message: 'Orchestrator is healthy',
        metadata: {
          functionName: 'test-orchestrator',
          version: '1.0',
          region: 'us-east-1'
        }
      };

      mockSend.mockResolvedValueOnce({
        StatusCode: 200,
        Payload: Buffer.from(JSON.stringify(mockResponse))
      });

      const result = await diagnostics.testOrchestratorInvocation();

      expect(result.success).toBe(true);
      expect(result.step).toBe('Test Orchestrator Invocation');
      expect(result.details.functionName).toBe('test-orchestrator');
      expect(result.details.query).toBe('__health_check__');
      expect(result.details.statusCode).toBe(200);
      expect(result.details.response).toEqual(mockResponse);
      expect(result.error).toBeUndefined();
    });

    it('should return failure when invocation fails with function error', async () => {
      const errorPayload = {
        errorMessage: 'Internal server error',
        errorType: 'Error'
      };

      mockSend.mockResolvedValueOnce({
        StatusCode: 200,
        FunctionError: 'Unhandled',
        Payload: Buffer.from(JSON.stringify(errorPayload))
      });

      const result = await diagnostics.testOrchestratorInvocation();

      expect(result.success).toBe(false);
      expect(result.details.functionError).toBe('Unhandled');
      expect(result.error).toContain('Function returned error: Unhandled');
      expect(result.recommendations).toContain('Check orchestrator Lambda logs in CloudWatch');
      expect(result.recommendations).toContain('Verify orchestrator handler code is correct');
    });

    it('should accept custom query parameter', async () => {
      mockSend.mockResolvedValueOnce({
        StatusCode: 200,
        Payload: Buffer.from(JSON.stringify({ success: true }))
      });

      const customQuery = 'analyze terrain for location X';
      const result = await diagnostics.testOrchestratorInvocation(customQuery);

      expect(result.success).toBe(true);
      expect(result.details.query).toBe(customQuery);
    });

    it('should return failure when environment variable is not set', async () => {
      delete process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME;
      diagnostics = new OrchestratorDiagnostics();

      const result = await diagnostics.testOrchestratorInvocation();

      expect(result.success).toBe(false);
      expect(result.error).toContain('RENEWABLE_ORCHESTRATOR_FUNCTION_NAME environment variable is not set');
      expect(result.recommendations).toContain('Set RENEWABLE_ORCHESTRATOR_FUNCTION_NAME environment variable');
    });

    it('should handle ResourceNotFoundException', async () => {
      mockSend.mockRejectedValueOnce({
        name: 'ResourceNotFoundException',
        message: 'Function not found'
      });

      const result = await diagnostics.testOrchestratorInvocation();

      expect(result.success).toBe(false);
      expect(result.details.errorName).toBe('ResourceNotFoundException');
      expect(result.recommendations).toContain('The orchestrator Lambda function does not exist');
      expect(result.recommendations).toContain('Deploy the function using: npx ampx sandbox');
    });

    it('should handle AccessDeniedException', async () => {
      mockSend.mockRejectedValueOnce({
        name: 'AccessDeniedException',
        message: 'User is not authorized'
      });

      const result = await diagnostics.testOrchestratorInvocation();

      expect(result.success).toBe(false);
      expect(result.recommendations).toContain('IAM permissions are missing for Lambda:InvokeFunction');
      expect(result.recommendations).toContain('Add lambda:InvokeFunction permission to the execution role');
    });

    it('should handle TooManyRequestsException', async () => {
      mockSend.mockRejectedValueOnce({
        name: 'TooManyRequestsException',
        message: 'Rate exceeded'
      });

      const result = await diagnostics.testOrchestratorInvocation();

      expect(result.success).toBe(false);
      expect(result.recommendations).toContain('Lambda throttling limit reached');
      expect(result.recommendations).toContain('Wait a moment and try again');
    });

    it('should handle generic errors', async () => {
      mockSend.mockRejectedValueOnce({
        name: 'UnknownError',
        message: 'Something went wrong'
      });

      const result = await diagnostics.testOrchestratorInvocation();

      expect(result.success).toBe(false);
      expect(result.recommendations).toContain('Check CloudWatch logs for detailed error information');
      expect(result.recommendations).toContain('Verify orchestrator function is deployed correctly');
    });
  });

  describe('checkEnvironmentVariables', () => {
    it('should return success when all environment variables are set', () => {
      const result = diagnostics.checkEnvironmentVariables();

      expect(result.success).toBe(true);
      expect(result.step).toBe('Check Environment Variables');
      expect(result.details.setVariables).toEqual({
        RENEWABLE_ORCHESTRATOR_FUNCTION_NAME: 'test-orchestrator',
        RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME: 'test-terrain',
        RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME: 'test-layout',
        RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME: 'test-simulation',
        RENEWABLE_REPORT_TOOL_FUNCTION_NAME: 'test-report',
        AWS_REGION: 'us-east-1'
      });
      expect(result.details.missingVariables).toEqual([]);
      expect(result.details.totalRequired).toBe(6);
      expect(result.details.totalSet).toBe(6);
      expect(result.error).toBeUndefined();
      expect(result.recommendations).toBeUndefined();
    });

    it('should return failure when some environment variables are missing', () => {
      delete process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME;
      delete process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME;
      diagnostics = new OrchestratorDiagnostics();

      const result = diagnostics.checkEnvironmentVariables();

      expect(result.success).toBe(false);
      expect(result.details.missingVariables).toContain('RENEWABLE_ORCHESTRATOR_FUNCTION_NAME');
      expect(result.details.missingVariables).toContain('RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME');
      expect(result.details.totalSet).toBe(4);
      expect(result.error).toBe('Missing 2 required environment variable(s)');
      expect(result.recommendations).toContain('Set missing environment variables in amplify/backend.ts');
      expect(result.recommendations).toContain('Run: npx ampx sandbox to deploy with correct environment variables');
    });

    it('should include critical warning when orchestrator function name is missing', () => {
      delete process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME;
      diagnostics = new OrchestratorDiagnostics();

      const result = diagnostics.checkEnvironmentVariables();

      expect(result.success).toBe(false);
      expect(result.recommendations).toContain('CRITICAL: Orchestrator function name must be set for renewable features to work');
    });

    it('should return failure when all environment variables are missing', () => {
      delete process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME;
      delete process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME;
      delete process.env.RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME;
      delete process.env.RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME;
      delete process.env.RENEWABLE_REPORT_TOOL_FUNCTION_NAME;
      delete process.env.AWS_REGION;
      diagnostics = new OrchestratorDiagnostics();

      const result = diagnostics.checkEnvironmentVariables();

      expect(result.success).toBe(false);
      expect(result.details.missingVariables.length).toBe(6);
      expect(result.details.totalSet).toBe(0);
      expect(result.error).toBe('Missing 6 required environment variable(s)');
    });

    it('should have consistent timing information', () => {
      const result = diagnostics.checkEnvironmentVariables();

      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeGreaterThan(0);
    });
  });

  describe('runFullDiagnostics', () => {
    it('should return all diagnostic results when everything passes', async () => {
      mockSend.mockResolvedValueOnce({
        Configuration: {
          FunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-orchestrator',
          Runtime: 'nodejs18.x',
          State: 'Active'
        }
      });

      mockSend.mockResolvedValueOnce({
        StatusCode: 200,
        Payload: Buffer.from(JSON.stringify({ success: true }))
      });

      const results = await diagnostics.runFullDiagnostics();

      expect(results).toHaveLength(3);
      expect(results[0].step).toBe('Check Environment Variables');
      expect(results[0].success).toBe(true);
      expect(results[1].step).toBe('Check Orchestrator Exists');
      expect(results[1].success).toBe(true);
      expect(results[2].step).toBe('Test Orchestrator Invocation');
      expect(results[2].success).toBe(true);
    });

    it('should stop after environment check if variables are missing', async () => {
      delete process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME;
      delete process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME;
      delete process.env.RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME;
      delete process.env.RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME;
      delete process.env.RENEWABLE_REPORT_TOOL_FUNCTION_NAME;
      delete process.env.AWS_REGION;
      diagnostics = new OrchestratorDiagnostics();

      const results = await diagnostics.runFullDiagnostics();

      expect(results).toHaveLength(1);
      expect(results[0].step).toBe('Check Environment Variables');
      expect(results[0].success).toBe(false);
    });

    it('should stop after exists check if orchestrator does not exist', async () => {
      mockSend.mockRejectedValueOnce({
        name: 'ResourceNotFoundException',
        message: 'Function not found'
      });

      const results = await diagnostics.runFullDiagnostics();

      expect(results).toHaveLength(2);
      expect(results[0].step).toBe('Check Environment Variables');
      expect(results[0].success).toBe(true);
      expect(results[1].step).toBe('Check Orchestrator Exists');
      expect(results[1].success).toBe(false);
    });

    it('should include invocation test failure if orchestrator exists but invocation fails', async () => {
      mockSend.mockResolvedValueOnce({
        Configuration: {
          FunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-orchestrator',
          Runtime: 'nodejs18.x',
          State: 'Active'
        }
      });

      mockSend.mockResolvedValueOnce({
        StatusCode: 200,
        FunctionError: 'Unhandled',
        Payload: Buffer.from(JSON.stringify({ errorMessage: 'Test error' }))
      });

      const results = await diagnostics.runFullDiagnostics();

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[2].success).toBe(false);
      expect(results[2].step).toBe('Test Orchestrator Invocation');
    });

    it('should continue to exists check even if only orchestrator env var is set', async () => {
      delete process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME;
      delete process.env.RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME;
      delete process.env.RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME;
      delete process.env.RENEWABLE_REPORT_TOOL_FUNCTION_NAME;
      diagnostics = new OrchestratorDiagnostics();

      mockSend.mockResolvedValueOnce({
        Configuration: {
          FunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-orchestrator',
          Runtime: 'nodejs18.x',
          State: 'Active'
        }
      });

      mockSend.mockResolvedValueOnce({
        StatusCode: 200,
        Payload: Buffer.from(JSON.stringify({ success: true }))
      });

      const results = await diagnostics.runFullDiagnostics();

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(false); // Env check fails
      expect(results[1].success).toBe(true);  // But exists check runs
      expect(results[2].success).toBe(true);  // And invocation test runs
    });
  });
});
