/**
 * Unit tests for renewable-specific error message templates
 */

import { 
  RENEWABLE_ERROR_MESSAGES, 
  RenewableErrorFormatter,
  type RenewableErrorTemplate 
} from '../../amplify/functions/shared/errorMessageTemplates';

describe('Renewable Error Templates', () => {
  describe('RENEWABLE_ERROR_MESSAGES', () => {
    test('should have LAYOUT_MISSING template', () => {
      const template = RENEWABLE_ERROR_MESSAGES.LAYOUT_MISSING;
      
      expect(template).toBeDefined();
      expect(template.title).toBe('Layout Data Not Found');
      expect(template.message).toContain('layout optimization');
      expect(template.action).toBe('Optimize Turbine Layout');
      expect(template.nextSteps).toBeDefined();
      expect(template.nextSteps!.length).toBeGreaterThan(0);
    });
    
    test('should have TERRAIN_MISSING template', () => {
      const template = RENEWABLE_ERROR_MESSAGES.TERRAIN_MISSING;
      
      expect(template).toBeDefined();
      expect(template.title).toBe('Terrain Data Not Found');
      expect(template.message).toContain('terrain analysis');
      expect(template.action).toBe('Analyze Terrain');
    });
    
    test('should have LAMBDA_TIMEOUT template', () => {
      const template = RENEWABLE_ERROR_MESSAGES.LAMBDA_TIMEOUT;
      
      expect(template).toBeDefined();
      expect(template.title).toBe('Analysis Taking Longer Than Expected');
      expect(template.message).toContain('processing');
      expect(template.action).toBe('Retry');
    });
    
    test('should have S3_RETRIEVAL_FAILED template', () => {
      const template = RENEWABLE_ERROR_MESSAGES.S3_RETRIEVAL_FAILED;
      
      expect(template).toBeDefined();
      expect(template.title).toBe('Unable to Retrieve Analysis Data');
      expect(template.message).toContain('error accessing');
    });
    
    test('should have PARAMETER_MISSING function template', () => {
      const template = RENEWABLE_ERROR_MESSAGES.PARAMETER_MISSING(['latitude', 'longitude']);
      
      expect(template).toBeDefined();
      expect(template.title).toBe('Missing Required Parameters');
      expect(template.message).toContain('latitude');
      expect(template.message).toContain('longitude');
    });
    
    test('should have PROJECT_NOT_FOUND function template', () => {
      const template = (RENEWABLE_ERROR_MESSAGES.PROJECT_NOT_FOUND as any)('test-project');
      
      expect(template).toBeDefined();
      expect(template.title).toBe('Project Not Found');
      expect(template.message).toContain('test-project');
      expect(template.action).toBe('List Projects');
    });
    
    test('should have LAMBDA_INVOCATION_FAILED function template', () => {
      const template = (RENEWABLE_ERROR_MESSAGES.LAMBDA_INVOCATION_FAILED as any)('terrain_analysis', 'Connection timeout');
      
      expect(template).toBeDefined();
      expect(template.title).toBe('Analysis Tool Error');
      expect(template.message).toContain('terrain_analysis');
      expect(template.message).toContain('Connection timeout');
      expect(template.action).toBe('Retry');
    });
    
    test('should have DEPLOYMENT_ISSUE function template', () => {
      const template = (RENEWABLE_ERROR_MESSAGES.DEPLOYMENT_ISSUE as any)('layout_optimization');
      
      expect(template).toBeDefined();
      expect(template.title).toBe('Tool Not Available');
      expect(template.message).toContain('layout_optimization');
      expect(template.message).toContain('not currently deployed');
    });
  });
  
  describe('RenewableErrorFormatter.formatForUser', () => {
    test('should format error template for user display', () => {
      const template = RENEWABLE_ERROR_MESSAGES.LAYOUT_MISSING;
      const formatted = RenewableErrorFormatter.formatForUser(template);
      
      expect(formatted).toContain('**Layout Data Not Found**');
      expect(formatted).toContain('Please run layout optimization');
      expect(formatted).toContain('**What to do next:**');
      expect(formatted).toContain('1.');
    });
    
    test('should include project name when provided', () => {
      const template = RENEWABLE_ERROR_MESSAGES.TERRAIN_MISSING;
      const formatted = RenewableErrorFormatter.formatForUser(template, 'texas-wind-farm');
      
      expect(formatted).toContain('**Current project:** texas-wind-farm');
    });
  });
  
  describe('RenewableErrorFormatter.formatForResponse', () => {
    test('should format error template for API response', () => {
      const template = RENEWABLE_ERROR_MESSAGES.LAMBDA_TIMEOUT;
      const response = RenewableErrorFormatter.formatForResponse(template, {
        projectName: 'test-project',
        projectId: 'proj-123',
        intentType: 'wake_simulation'
      });
      
      expect(response.success).toBe(false);
      expect(response.error).toBe(template.message);
      expect(response.errorTitle).toBe(template.title);
      expect(response.errorCategory).toBe('RENEWABLE_WORKFLOW_ERROR');
      expect(response.details.projectName).toBe('test-project');
      expect(response.details.projectId).toBe('proj-123');
      expect(response.details.intentType).toBe('wake_simulation');
      expect(response.details.action).toBe(template.action);
      expect(response.details.nextSteps).toEqual(template.nextSteps);
    });
  });
  
  describe('RenewableErrorFormatter.detectErrorType', () => {
    test('should detect layout missing error', () => {
      const error = new Error('Layout not found for project');
      const errorType = RenewableErrorFormatter.detectErrorType(error);
      
      expect(errorType).toBe('LAYOUT_MISSING');
    });
    
    test('should detect terrain missing error', () => {
      const error = new Error('Terrain data not found');
      const errorType = RenewableErrorFormatter.detectErrorType(error);
      
      expect(errorType).toBe('TERRAIN_MISSING');
    });
    
    test('should detect timeout error', () => {
      const error = new Error('Lambda function timed out after 300 seconds');
      const errorType = RenewableErrorFormatter.detectErrorType(error);
      
      expect(errorType).toBe('LAMBDA_TIMEOUT');
    });
    
    test('should detect S3 error', () => {
      const error = new Error('S3 bucket access denied');
      const errorType = RenewableErrorFormatter.detectErrorType(error);
      
      expect(errorType).toBe('S3_RETRIEVAL_FAILED');
    });
    
    test('should detect project not found error', () => {
      const error = new Error('Project xyz not found');
      const errorType = RenewableErrorFormatter.detectErrorType(error);
      
      expect(errorType).toBe('PROJECT_NOT_FOUND');
    });
    
    test('should detect Lambda invocation error', () => {
      const error = new Error('Lambda invocation failed');
      const errorType = RenewableErrorFormatter.detectErrorType(error);
      
      expect(errorType).toBe('LAMBDA_INVOCATION_FAILED');
    });
    
    test('should detect deployment issue', () => {
      const error = new Error('Function not configured');
      const errorType = RenewableErrorFormatter.detectErrorType(error);
      
      expect(errorType).toBe('DEPLOYMENT_ISSUE');
    });
    
    test('should return null for unknown error types', () => {
      const error = new Error('Some random error');
      const errorType = RenewableErrorFormatter.detectErrorType(error);
      
      expect(errorType).toBeNull();
    });
  });
  
  describe('RenewableErrorFormatter.generateErrorMessage', () => {
    test('should generate error message with detected type', () => {
      const error = new Error('Layout not found for project test-project');
      const result = RenewableErrorFormatter.generateErrorMessage(error, {
        intentType: 'wake_simulation',
        projectName: 'test-project'
      });
      
      expect(result.template.title).toBe('Layout Data Not Found');
      expect(result.formatted).toContain('**Layout Data Not Found**');
      expect(result.formatted).toContain('**Current project:** test-project');
    });
    
    test('should handle function templates with context', () => {
      const error = new Error('Missing required parameters');
      const result = RenewableErrorFormatter.generateErrorMessage(error, {
        intentType: 'layout_optimization',
        missingParams: ['latitude', 'longitude']
      });
      
      expect(result.template.title).toBe('Unexpected Error');
      expect(result.formatted).toContain('Missing required parameters');
    });
    
    test('should generate generic error for unknown types', () => {
      const error = new Error('Unknown error occurred');
      const result = RenewableErrorFormatter.generateErrorMessage(error, {
        intentType: 'terrain_analysis'
      });
      
      expect(result.template.title).toBe('Unexpected Error');
      expect(result.template.message).toBe('Unknown error occurred');
      expect(result.template.nextSteps).toBeDefined();
      expect(result.template.nextSteps!.length).toBeGreaterThan(0);
    });
  });
  
  describe('Error template CTA buttons', () => {
    test('LAYOUT_MISSING should have CTA button', () => {
      const template = RENEWABLE_ERROR_MESSAGES.LAYOUT_MISSING;
      
      expect(template.action).toBe('Optimize Turbine Layout');
    });
    
    test('TERRAIN_MISSING should have CTA button', () => {
      const template = RENEWABLE_ERROR_MESSAGES.TERRAIN_MISSING;
      
      expect(template.action).toBe('Analyze Terrain');
    });
    
    test('LAMBDA_TIMEOUT should have CTA button', () => {
      const template = RENEWABLE_ERROR_MESSAGES.LAMBDA_TIMEOUT;
      
      expect(template.action).toBe('Retry');
    });
    
    test('S3_RETRIEVAL_FAILED should not have CTA button', () => {
      const template = RENEWABLE_ERROR_MESSAGES.S3_RETRIEVAL_FAILED;
      
      expect(template.action).toBeUndefined();
    });
  });
});
