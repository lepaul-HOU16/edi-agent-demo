/**
 * Integration tests for renewable error handling in orchestrator
 */

import { RENEWABLE_ERROR_MESSAGES, RenewableErrorFormatter } from '../../amplify/functions/shared/errorMessageTemplates';

describe('Renewable Error Handling Integration', () => {
  describe('Layout missing error flow', () => {
    test('should generate user-friendly error when layout is missing', () => {
      const error = new Error('Layout not found');
      const errorResult = RenewableErrorFormatter.generateErrorMessage(error, {
        intentType: 'wake_simulation',
        projectName: 'texas-wind-farm'
      });
      
      expect(errorResult.template.title).toBe('Layout Data Not Found');
      expect(errorResult.template.action).toBe('Optimize Turbine Layout');
      expect(errorResult.formatted).toContain('**Layout Data Not Found**');
      expect(errorResult.formatted).toContain('**Current project:** texas-wind-farm');
      expect(errorResult.formatted).toContain('**What to do next:**');
    });
  });
  
  describe('Terrain missing error flow', () => {
    test('should generate user-friendly error when terrain is missing', () => {
      const error = new Error('Terrain data not found');
      const errorResult = RenewableErrorFormatter.generateErrorMessage(error, {
        intentType: 'layout_optimization',
        projectName: 'california-solar-farm'
      });
      
      expect(errorResult.template.title).toBe('Terrain Data Not Found');
      expect(errorResult.template.action).toBe('Analyze Terrain');
      expect(errorResult.formatted).toContain('terrain analysis');
    });
  });
  
  describe('Lambda timeout error flow', () => {
    test('should generate user-friendly error when Lambda times out', () => {
      const error = new Error('Task timed out after 300.00 seconds');
      const errorResult = RenewableErrorFormatter.generateErrorMessage(error, {
        intentType: 'wake_simulation',
        projectName: 'offshore-wind-project'
      });
      
      expect(errorResult.template.title).toBe('Analysis Taking Longer Than Expected');
      expect(errorResult.template.action).toBe('Retry');
      expect(errorResult.formatted).toContain('still processing');
      expect(errorResult.formatted).toContain('try again');
    });
  });
  
  describe('S3 retrieval error flow', () => {
    test('should generate user-friendly error when S3 access fails', () => {
      const error = new Error('S3 GetObject failed: Access Denied');
      const errorResult = RenewableErrorFormatter.generateErrorMessage(error, {
        intentType: 'report_generation',
        projectName: 'midwest-wind-cluster'
      });
      
      expect(errorResult.template.title).toBe('Unable to Retrieve Analysis Data');
      expect(errorResult.formatted).toContain('error accessing');
      expect(errorResult.formatted).toContain('contact support');
    });
  });
  
  describe('Deployment issue error flow', () => {
    test('should generate user-friendly error when Lambda is not deployed', () => {
      const error = new Error('Function not configured');
      const errorResult = RenewableErrorFormatter.generateErrorMessage(error, {
        intentType: 'terrain_analysis'
      });
      
      // Should detect as DEPLOYMENT_ISSUE
      expect(errorResult.template.title).toBe('Tool Not Available');
      expect(errorResult.formatted).toContain('not currently deployed');
    });
    
    test('should handle Lambda invocation failures', () => {
      const error = new Error('Lambda invocation failed with error');
      const errorResult = RenewableErrorFormatter.generateErrorMessage(error, {
        intentType: 'terrain_analysis'
      });
      
      // This gets detected as LAMBDA_INVOCATION_FAILED
      expect(errorResult.template.title).toBe('Analysis Tool Error');
      expect(errorResult.formatted).toContain('terrain_analysis');
    });
  });
  
  describe('Error response formatting', () => {
    test('should format error for API response with all required fields', () => {
      const template = RENEWABLE_ERROR_MESSAGES.LAYOUT_MISSING;
      const response = RenewableErrorFormatter.formatForResponse(template, {
        projectName: 'test-project',
        projectId: 'proj-123',
        intentType: 'wake_simulation',
        error: new Error('Layout not found')
      });
      
      expect(response).toMatchObject({
        success: false,
        error: expect.any(String),
        errorTitle: 'Layout Data Not Found',
        errorCategory: 'RENEWABLE_WORKFLOW_ERROR',
        details: {
          projectName: 'test-project',
          projectId: 'proj-123',
          intentType: 'wake_simulation',
          action: 'Optimize Turbine Layout',
          nextSteps: expect.any(Array),
          originalError: 'Layout not found'
        }
      });
    });
  });
  
  describe('Error detection accuracy', () => {
    test('should correctly detect various error patterns', () => {
      const testCases = [
        { error: 'Layout not found', expected: 'LAYOUT_MISSING' },
        { error: 'Terrain data not found', expected: 'TERRAIN_MISSING' },
        { error: 'Lambda timed out', expected: 'LAMBDA_TIMEOUT' },
        { error: 'S3 bucket not accessible', expected: 'S3_RETRIEVAL_FAILED' },
        { error: 'Project xyz not found', expected: 'PROJECT_NOT_FOUND' },
        { error: 'Lambda invocation failed', expected: 'LAMBDA_INVOCATION_FAILED' },
        { error: 'Function not deployed', expected: 'DEPLOYMENT_ISSUE' }
      ];
      
      testCases.forEach(({ error, expected }) => {
        const errorObj = new Error(error);
        const detected = RenewableErrorFormatter.detectErrorType(errorObj);
        expect(detected).toBe(expected);
      });
    });
  });
  
  describe('CTA button generation', () => {
    test('should include CTA buttons in error messages where applicable', () => {
      const errorsWithCTA = [
        { template: RENEWABLE_ERROR_MESSAGES.LAYOUT_MISSING, action: 'Optimize Turbine Layout' },
        { template: RENEWABLE_ERROR_MESSAGES.TERRAIN_MISSING, action: 'Analyze Terrain' },
        { template: RENEWABLE_ERROR_MESSAGES.LAMBDA_TIMEOUT, action: 'Retry' }
      ];
      
      errorsWithCTA.forEach(({ template, action }) => {
        expect(template.action).toBe(action);
        const formatted = RenewableErrorFormatter.formatForUser(template);
        expect(formatted).toContain(template.title);
        expect(formatted).toContain(template.message);
      });
    });
    
    test('should not include CTA buttons for non-actionable errors', () => {
      const errorsWithoutCTA = [
        RENEWABLE_ERROR_MESSAGES.S3_RETRIEVAL_FAILED
      ];
      
      errorsWithoutCTA.forEach(template => {
        expect(template.action).toBeUndefined();
      });
    });
  });
});
