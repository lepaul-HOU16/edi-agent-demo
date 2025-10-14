/**
 * Error Categorization Tests
 * 
 * Tests for the error categorization system that maps Lambda errors
 * to specific error types with appropriate messages and remediation steps.
 */

import { ErrorCategorizer, RenewableErrorType } from '../errorCategorization';

describe('ErrorCategorizer', () => {
  describe('NotFound Error Categorization', () => {
    it('should categorize ResourceNotFoundException as NotFound', () => {
      const error = new Error('Function not found');
      error.name = 'ResourceNotFoundException';

      const categorized = ErrorCategorizer.categorizeError(error, 'test-request-123');

      expect(categorized.type).toBe(RenewableErrorType.NotFound);
      expect(categorized.message).toBe('Renewable Energy Backend Not Deployed');
      expect(categorized.details).toContain('not deployed or cannot be found');
      expect(categorized.requestId).toBe('test-request-123');
    });

    it('should provide correct remediation steps for NotFound errors', () => {
      const error = new Error('Lambda function renewableOrchestrator does not exist');
      error.name = 'ResourceNotFoundException';

      const categorized = ErrorCategorizer.categorizeError(error);

      expect(categorized.remediationSteps).toContain('Deploy the renewable energy backend using: npx ampx sandbox');
      expect(categorized.remediationSteps).toContain('Verify all Lambda functions are deployed in AWS Console');
      expect(categorized.remediationSteps.length).toBeGreaterThan(3);
    });

    it('should extract function name from error message', () => {
      const error = new Error('Function: renewableOrchestrator not found');
      error.name = 'ResourceNotFoundException';

      const categorized = ErrorCategorizer.categorizeError(error);

      expect(categorized.details).toContain('renewableOrchestrator');
    });

    it('should categorize "does not exist" messages as NotFound', () => {
      const error = new Error('The Lambda function does not exist');

      const categorized = ErrorCategorizer.categorizeError(error);

      expect(categorized.type).toBe(RenewableErrorType.NotFound);
    });
  });

  describe('Timeout Error Categorization', () => {
    it('should categorize TimeoutError as Timeout', () => {
      const error = new Error('Orchestrator timeout after 60 seconds');
      error.name = 'TimeoutError';

      const categorized = ErrorCategorizer.categorizeError(error, 'test-request-456');

      expect(categorized.type).toBe(RenewableErrorType.Timeout);
      expect(categorized.message).toBe('Renewable Energy Analysis Timed Out');
      expect(categorized.details).toContain('exceeded the timeout threshold');
      expect(categorized.requestId).toBe('test-request-456');
    });

    it('should provide correct remediation steps for Timeout errors', () => {
      const error = new Error('Task timed out after 60 seconds');
      error.name = 'TimeoutError';

      const categorized = ErrorCategorizer.categorizeError(error);

      expect(categorized.remediationSteps).toContain('Try again with a smaller analysis area (reduce radius parameter)');
      expect(categorized.remediationSteps).toContain('Check Lambda timeout settings in AWS Console (increase if needed)');
      expect(categorized.remediationSteps).toContain('Review CloudWatch logs for the orchestrator and tool Lambda functions');
      expect(categorized.remediationSteps.length).toBeGreaterThan(4);
    });

    it('should extract duration from timeout error message', () => {
      const error = new Error('Lambda timeout after 45 seconds');

      const categorized = ErrorCategorizer.categorizeError(error);

      expect(categorized.details).toContain('45 seconds');
    });

    it('should categorize "timed out" messages as Timeout', () => {
      const error = new Error('The operation timed out');

      const categorized = ErrorCategorizer.categorizeError(error);

      expect(categorized.type).toBe(RenewableErrorType.Timeout);
    });
  });

  describe('PermissionDenied Error Categorization', () => {
    it('should categorize AccessDeniedException as PermissionDenied', () => {
      const error = new Error('User is not authorized to perform lambda:InvokeFunction');
      error.name = 'AccessDeniedException';

      const categorized = ErrorCategorizer.categorizeError(error, 'test-request-789');

      expect(categorized.type).toBe(RenewableErrorType.PermissionDenied);
      expect(categorized.message).toBe('Permission Denied');
      expect(categorized.details).toContain('does not have permission');
      expect(categorized.requestId).toBe('test-request-789');
    });

    it('should provide correct remediation steps for PermissionDenied errors', () => {
      const error = new Error('Access denied');
      error.name = 'AccessDeniedException';

      const categorized = ErrorCategorizer.categorizeError(error);

      expect(categorized.remediationSteps).toContain('Add IAM permissions for lambda:InvokeFunction to the agent execution role');
      expect(categorized.remediationSteps).toContain('Add IAM permissions for lambda:GetFunction to the agent execution role');
      expect(categorized.remediationSteps.some(step => step.includes('Example policy needed'))).toBe(true);
      expect(categorized.remediationSteps.length).toBeGreaterThan(5);
    });

    it('should categorize UnauthorizedException as PermissionDenied', () => {
      const error = new Error('Not authorized');
      error.name = 'UnauthorizedException';

      const categorized = ErrorCategorizer.categorizeError(error);

      expect(categorized.type).toBe(RenewableErrorType.PermissionDenied);
    });

    it('should categorize "Permission denied" messages as PermissionDenied', () => {
      const error = new Error('Permission denied accessing Lambda function');

      const categorized = ErrorCategorizer.categorizeError(error);

      expect(categorized.type).toBe(RenewableErrorType.PermissionDenied);
    });
  });

  describe('InvalidResponse Error Categorization', () => {
    it('should categorize ValidationException as InvalidResponse', () => {
      const error = new Error('Invalid response structure');
      error.name = 'ValidationException';

      const categorized = ErrorCategorizer.categorizeError(error, 'test-request-101');

      expect(categorized.type).toBe(RenewableErrorType.InvalidResponse);
      expect(categorized.message).toBe('Invalid Response from Backend');
      expect(categorized.details).toContain('invalid or incomplete');
      expect(categorized.requestId).toBe('test-request-101');
    });

    it('should provide correct remediation steps for InvalidResponse errors', () => {
      const error = new Error('Missing required fields: success, message');

      const categorized = ErrorCategorizer.categorizeError(error);

      expect(categorized.remediationSteps).toContain('Check CloudWatch logs for the orchestrator Lambda function');
      expect(categorized.remediationSteps).toContain('Verify the orchestrator is returning the correct response structure');
      expect(categorized.remediationSteps).toContain('Ensure all required fields are present: success, message, artifacts');
      expect(categorized.remediationSteps.length).toBeGreaterThan(4);
    });

    it('should identify missing fields validation issue', () => {
      const error = new Error('Invalid response: Missing required fields: artifacts');

      const categorized = ErrorCategorizer.categorizeError(error);

      expect(categorized.type).toBe(RenewableErrorType.InvalidResponse);
      expect(categorized.details).toContain('missing required fields');
    });

    it('should identify invalid project ID issue', () => {
      const error = new Error('Invalid project ID detected: default-project');

      const categorized = ErrorCategorizer.categorizeError(error);

      expect(categorized.type).toBe(RenewableErrorType.InvalidResponse);
      expect(categorized.details).toContain('invalid project ID');
    });

    it('should identify invalid artifact structure issue', () => {
      const error = new Error('Invalid artifact structure at index 0');

      const categorized = ErrorCategorizer.categorizeError(error);

      expect(categorized.type).toBe(RenewableErrorType.InvalidResponse);
      expect(categorized.details).toContain('invalid structure');
    });
  });

  describe('ToolFailure Error Categorization', () => {
    it('should categorize tool execution errors as ToolFailure', () => {
      const error = new Error('Tool execution failed: terrain Lambda error');

      const categorized = ErrorCategorizer.categorizeError(error, 'test-request-202');

      expect(categorized.type).toBe(RenewableErrorType.ToolFailure);
      expect(categorized.message).toBe('Tool Execution Failed');
      expect(categorized.details).toContain('encountered an error');
      expect(categorized.requestId).toBe('test-request-202');
    });

    it('should provide correct remediation steps for ToolFailure errors', () => {
      const error = new Error('layout Lambda execution failed');

      const categorized = ErrorCategorizer.categorizeError(error);

      expect(categorized.remediationSteps).toContain('Check CloudWatch logs for the layout optimization tool Lambda function');
      expect(categorized.remediationSteps).toContain('Verify the tool Lambda is deployed correctly');
      expect(categorized.remediationSteps).toContain('Ensure the orchestrator is passing correct parameters to the tool');
      expect(categorized.remediationSteps.length).toBeGreaterThan(3);
    });

    it('should identify terrain tool failures', () => {
      const error = new Error('terrain Lambda failed to process request');

      const categorized = ErrorCategorizer.categorizeError(error);

      expect(categorized.type).toBe(RenewableErrorType.ToolFailure);
      expect(categorized.details).toContain('terrain analysis tool');
    });

    it('should identify layout tool failures', () => {
      const error = new Error('layout optimization failed');

      const categorized = ErrorCategorizer.categorizeError(error);

      expect(categorized.type).toBe(RenewableErrorType.ToolFailure);
      expect(categorized.details).toContain('layout optimization tool');
    });

    it('should identify simulation tool failures', () => {
      const error = new Error('simulation Lambda error');

      const categorized = ErrorCategorizer.categorizeError(error);

      expect(categorized.type).toBe(RenewableErrorType.ToolFailure);
      expect(categorized.details).toContain('simulation tool');
    });

    it('should identify report tool failures', () => {
      const error = new Error('report generation failed');

      const categorized = ErrorCategorizer.categorizeError(error);

      expect(categorized.type).toBe(RenewableErrorType.ToolFailure);
      expect(categorized.details).toContain('report generation tool');
    });

    it('should provide Python-specific remediation for Python errors', () => {
      const error = new Error('ModuleNotFoundError: No module named "geopandas"');

      const categorized = ErrorCategorizer.categorizeError(error);

      expect(categorized.type).toBe(RenewableErrorType.ToolFailure);
      expect(categorized.remediationSteps).toContain('Verify Python dependencies are installed in the Lambda layer');
      expect(categorized.remediationSteps).toContain('Check that the Lambda layer is attached to the function');
      expect(categorized.remediationSteps).toContain('Review requirements.txt for missing dependencies');
    });

    it('should handle ImportError as Python tool failure', () => {
      const error = new Error('ImportError: cannot import name "WindFarm"');

      const categorized = ErrorCategorizer.categorizeError(error);

      expect(categorized.type).toBe(RenewableErrorType.ToolFailure);
      expect(categorized.remediationSteps.some(step => step.includes('Python dependencies'))).toBe(true);
    });
  });

  describe('Unknown Error Categorization', () => {
    it('should categorize unrecognized errors as Unknown', () => {
      const error = new Error('Something went wrong');
      error.name = 'WeirdError';

      const categorized = ErrorCategorizer.categorizeError(error, 'test-request-303');

      expect(categorized.type).toBe(RenewableErrorType.Unknown);
      expect(categorized.message).toBe('Unexpected Error');
      expect(categorized.details).toContain('WeirdError');
      expect(categorized.details).toContain('Something went wrong');
      expect(categorized.requestId).toBe('test-request-303');
    });

    it('should provide generic remediation steps for Unknown errors', () => {
      const error = new Error('Unexpected error');

      const categorized = ErrorCategorizer.categorizeError(error);

      expect(categorized.remediationSteps).toContain('Check CloudWatch logs for detailed error information');
      expect(categorized.remediationSteps).toContain('Verify all Lambda functions are deployed and healthy');
      expect(categorized.remediationSteps).toContain('Check AWS service status for any outages');
      expect(categorized.remediationSteps.length).toBeGreaterThan(4);
    });

    it('should handle errors without name property', () => {
      const error = new Error('Generic error');

      const categorized = ErrorCategorizer.categorizeError(error);

      expect(categorized.type).toBe(RenewableErrorType.Unknown);
      expect(categorized.details).toContain('Error'); // Error objects have name "Error" by default
    });

    it('should handle errors without message property', () => {
      const error: any = { name: 'CustomError' };

      const categorized = ErrorCategorizer.categorizeError(error);

      expect(categorized.type).toBe(RenewableErrorType.Unknown);
      expect(categorized.details).toContain('unknown error occurred');
    });
  });

  describe('Error Formatting', () => {
    it('should format error for logging', () => {
      const error = new Error('Test error');
      error.name = 'TestError';

      const categorized = ErrorCategorizer.categorizeError(error, 'test-request-404');
      const formatted = ErrorCategorizer.formatForLogging(categorized);

      expect(formatted).toHaveProperty('errorType');
      expect(formatted).toHaveProperty('message');
      expect(formatted).toHaveProperty('details');
      expect(formatted).toHaveProperty('remediationSteps');
      expect(formatted).toHaveProperty('requestId', 'test-request-404');
      expect(formatted).toHaveProperty('originalError');
      expect(formatted.originalError).toHaveProperty('name', 'TestError');
      expect(formatted.originalError).toHaveProperty('message', 'Test error');
    });

    it('should format error for user display', () => {
      const error = new Error('Function not found');
      error.name = 'ResourceNotFoundException';

      const categorized = ErrorCategorizer.categorizeError(error, 'test-request-505');
      const formatted = ErrorCategorizer.formatForUser(categorized);

      expect(formatted).toContain('Renewable Energy Backend Not Deployed');
      expect(formatted).toContain('Remediation Steps:');
      expect(formatted).toContain('1. ');
      expect(formatted).toContain('Request ID: test-request-505');
    });

    it('should number remediation steps in user format', () => {
      const error = new Error('Timeout');
      error.name = 'TimeoutError';

      const categorized = ErrorCategorizer.categorizeError(error);
      const formatted = ErrorCategorizer.formatForUser(categorized);

      const steps = formatted.match(/\d+\. /g);
      expect(steps).not.toBeNull();
      expect(steps!.length).toBe(categorized.remediationSteps.length);
    });

    it('should include request ID in user format when available', () => {
      const error = new Error('Test error');

      const categorized = ErrorCategorizer.categorizeError(error, 'test-request-606');
      const formatted = ErrorCategorizer.formatForUser(categorized);

      expect(formatted).toContain('Request ID: test-request-606');
    });

    it('should not include request ID in user format when not available', () => {
      const error = new Error('Test error');

      const categorized = ErrorCategorizer.categorizeError(error);
      const formatted = ErrorCategorizer.formatForUser(categorized);

      expect(formatted).not.toContain('Request ID:');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null error', () => {
      const categorized = ErrorCategorizer.categorizeError(null);

      expect(categorized.type).toBe(RenewableErrorType.Unknown);
      expect(categorized.message).toBe('Unexpected Error');
    });

    it('should handle undefined error', () => {
      const categorized = ErrorCategorizer.categorizeError(undefined);

      expect(categorized.type).toBe(RenewableErrorType.Unknown);
      expect(categorized.message).toBe('Unexpected Error');
    });

    it('should handle string error', () => {
      const categorized = ErrorCategorizer.categorizeError('String error');

      expect(categorized.type).toBe(RenewableErrorType.Unknown);
    });

    it('should handle error object without standard properties', () => {
      const error = { custom: 'property' };

      const categorized = ErrorCategorizer.categorizeError(error);

      expect(categorized.type).toBe(RenewableErrorType.Unknown);
    });

    it('should preserve original error in categorized result', () => {
      const error = new Error('Original error');
      error.name = 'OriginalError';

      const categorized = ErrorCategorizer.categorizeError(error);

      expect(categorized.originalError).toBe(error);
      expect(categorized.originalError.name).toBe('OriginalError');
      expect(categorized.originalError.message).toBe('Original error');
    });
  });

  describe('Multiple Error Type Detection', () => {
    it('should prioritize NotFound over other error types', () => {
      const error = new Error('Function not found and permission denied');
      error.name = 'ResourceNotFoundException';

      const categorized = ErrorCategorizer.categorizeError(error);

      expect(categorized.type).toBe(RenewableErrorType.NotFound);
    });

    it('should prioritize Timeout over ToolFailure', () => {
      const error = new Error('terrain Lambda timed out');
      error.name = 'TimeoutError';

      const categorized = ErrorCategorizer.categorizeError(error);

      expect(categorized.type).toBe(RenewableErrorType.Timeout);
    });

    it('should prioritize PermissionDenied over InvalidResponse', () => {
      const error = new Error('Access denied: Invalid response');
      error.name = 'AccessDeniedException';

      const categorized = ErrorCategorizer.categorizeError(error);

      expect(categorized.type).toBe(RenewableErrorType.PermissionDenied);
    });
  });
});
