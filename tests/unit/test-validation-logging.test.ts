/**
 * Unit Tests for Validation Logging
 * 
 * Tests the enhanced CloudWatch logging for parameter validation
 * with project context information.
 */

import { 
  validateParameters, 
  logValidationFailure,
  logValidationSuccess,
  type ProjectContext,
  type ParameterValidationResult
} from '../../amplify/functions/renewableOrchestrator/parameterValidator';
import type { RenewableIntent } from '../../amplify/functions/renewableOrchestrator/types';

describe('Validation Logging', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  
  beforeEach(() => {
    // Spy on console methods to capture logs
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });
  
  afterEach(() => {
    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
  
  describe('logValidationFailure', () => {
    it('should log validation failure with project context information', () => {
      const intent: RenewableIntent = {
        type: 'layout_optimization',
        params: {},
        confidence: 90
      };
      
      const projectContext: ProjectContext = {
        projectName: 'test-project',
        coordinates: { latitude: 35.0, longitude: -101.0 },
        terrain_results: { features: [] }
      };
      
      const validation: ParameterValidationResult = {
        isValid: false,
        errors: ['Missing required parameter: latitude'],
        warnings: [],
        missingRequired: ['latitude', 'longitude'],
        invalidValues: [],
        satisfiedByContext: [],
        contextUsed: false
      };
      
      const requestId = 'test-req-123';
      
      logValidationFailure(validation, intent, requestId, projectContext);
      
      // Verify console.error was called
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      // Get the logged JSON
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      
      // Verify log structure
      expect(loggedData).toMatchObject({
        level: 'ERROR',
        category: 'PARAMETER_VALIDATION',
        requestId: 'test-req-123',
        intentType: 'layout_optimization',
        validation: {
          isValid: false,
          missingRequired: ['latitude', 'longitude'],
          invalidValues: [],
          errors: ['Missing required parameter: latitude'],
          satisfiedByContext: [],
          contextUsed: false
        },
        projectContext: {
          hasActiveProject: true,
          projectName: 'test-project',
          hasCoordinates: true,
          hasTerrainResults: true,
          hasLayoutResults: false,
          hasSimulationResults: false
        },
        providedParameters: {}
      });
      
      // Verify timestamp exists
      expect(loggedData.timestamp).toBeDefined();
      expect(new Date(loggedData.timestamp).getTime()).toBeGreaterThan(0);
    });
    
    it('should log validation failure without project context', () => {
      const intent: RenewableIntent = {
        type: 'terrain_analysis',
        params: {},
        confidence: 85
      };
      
      const validation: ParameterValidationResult = {
        isValid: false,
        errors: ['Missing required parameter: latitude', 'Missing required parameter: longitude'],
        warnings: [],
        missingRequired: ['latitude', 'longitude'],
        invalidValues: [],
        satisfiedByContext: [],
        contextUsed: false
      };
      
      const requestId = 'test-req-456';
      
      logValidationFailure(validation, intent, requestId);
      
      // Verify console.error was called
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      // Get the logged JSON
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      
      // Verify project context flags are false when no context provided
      expect(loggedData.projectContext).toMatchObject({
        hasActiveProject: false,
        hasCoordinates: false,
        hasTerrainResults: false,
        hasLayoutResults: false,
        hasSimulationResults: false
      });
      
      // projectName should be undefined (not included in object)
      expect(loggedData.projectContext.projectName).toBeUndefined();
    });
    
    it('should log which parameters were satisfied by context', () => {
      const intent: RenewableIntent = {
        type: 'layout_optimization',
        params: {},
        confidence: 90
      };
      
      const projectContext: ProjectContext = {
        projectName: 'west-texas-site',
        coordinates: { latitude: 35.067482, longitude: -101.395466 },
        terrain_results: { features: [] }
      };
      
      const validation: ParameterValidationResult = {
        isValid: true,
        errors: [],
        warnings: ['Using latitude from active project context', 'Using longitude from active project context'],
        missingRequired: [],
        invalidValues: [],
        satisfiedByContext: ['latitude', 'longitude'],
        contextUsed: true
      };
      
      const requestId = 'test-req-789';
      
      // This should use logValidationSuccess since validation passed
      logValidationSuccess(validation, intent, requestId, projectContext);
      
      // Verify console.log was called (not console.error)
      expect(consoleLogSpy).toHaveBeenCalled();
      
      // Get the logged JSON
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[consoleLogSpy.mock.calls.length - 1][0]);
      
      // Verify context usage is logged
      expect(loggedData.validation).toMatchObject({
        isValid: true,
        satisfiedByContext: ['latitude', 'longitude'],
        contextUsed: true
      });
      
      expect(loggedData.projectContext).toMatchObject({
        hasActiveProject: true,
        projectName: 'west-texas-site',
        hasCoordinates: true
      });
    });
    
    it('should include all project context flags', () => {
      const intent: RenewableIntent = {
        type: 'report_generation',
        params: { project_id: 'complete-project' },
        confidence: 95
      };
      
      const projectContext: ProjectContext = {
        projectName: 'complete-project',
        coordinates: { latitude: 40.0, longitude: -100.0 },
        terrain_results: { features: [] },
        layout_results: { turbines: [] },
        simulation_results: { wake_analysis: {} },
        report_results: { report_url: 's3://...' }
      };
      
      const validation: ParameterValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        missingRequired: [],
        invalidValues: [],
        satisfiedByContext: [],
        contextUsed: false
      };
      
      const requestId = 'test-req-complete';
      
      logValidationSuccess(validation, intent, requestId, projectContext);
      
      // Get the logged JSON
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[consoleLogSpy.mock.calls.length - 1][0]);
      
      // Verify all context flags are present
      expect(loggedData.projectContext).toMatchObject({
        hasActiveProject: true,
        projectName: 'complete-project',
        hasCoordinates: true,
        hasTerrainResults: true,
        hasLayoutResults: true,
        hasSimulationResults: true
      });
    });
  });
  
  describe('logValidationSuccess', () => {
    it('should log validation success with context usage', () => {
      const intent: RenewableIntent = {
        type: 'wake_simulation',
        params: {},
        confidence: 88
      };
      
      const projectContext: ProjectContext = {
        projectName: 'simulation-project',
        layout_results: { turbines: [] }
      };
      
      const validation: ParameterValidationResult = {
        isValid: true,
        errors: [],
        warnings: ['Using layout from active project context'],
        missingRequired: [],
        invalidValues: [],
        satisfiedByContext: ['layout_results'],
        contextUsed: true
      };
      
      const requestId = 'test-req-success';
      
      logValidationSuccess(validation, intent, requestId, projectContext);
      
      // Verify console.log was called
      expect(consoleLogSpy).toHaveBeenCalled();
      
      // Get the logged JSON
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[consoleLogSpy.mock.calls.length - 1][0]);
      
      // Verify log structure
      expect(loggedData).toMatchObject({
        level: 'INFO',
        category: 'PARAMETER_VALIDATION',
        requestId: 'test-req-success',
        intentType: 'wake_simulation',
        validation: {
          isValid: true,
          warnings: ['Using layout from active project context'],
          satisfiedByContext: ['layout_results'],
          contextUsed: true
        },
        projectContext: {
          hasActiveProject: true,
          projectName: 'simulation-project',
          hasLayoutResults: true
        }
      });
    });
    
    it('should log validation success without context usage', () => {
      const intent: RenewableIntent = {
        type: 'terrain_analysis',
        params: { latitude: 35.0, longitude: -101.0 },
        confidence: 92
      };
      
      const validation: ParameterValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        missingRequired: [],
        invalidValues: [],
        satisfiedByContext: [],
        contextUsed: false
      };
      
      const requestId = 'test-req-no-context';
      
      logValidationSuccess(validation, intent, requestId);
      
      // Get the logged JSON
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[consoleLogSpy.mock.calls.length - 1][0]);
      
      // Verify context was not used
      expect(loggedData.validation).toMatchObject({
        isValid: true,
        satisfiedByContext: [],
        contextUsed: false
      });
      
      expect(loggedData.projectContext).toMatchObject({
        hasActiveProject: false
      });
    });
  });
  
  describe('Integration with validateParameters', () => {
    it('should produce loggable validation results with context', () => {
      const intent: RenewableIntent = {
        type: 'layout_optimization',
        params: {},
        confidence: 90
      };
      
      const projectContext: ProjectContext = {
        projectName: 'test-project',
        coordinates: { latitude: 35.0, longitude: -101.0 }
      };
      
      const validation = validateParameters(intent, projectContext);
      
      // Validation should pass because coordinates are in context
      expect(validation.isValid).toBe(true);
      expect(validation.contextUsed).toBe(true);
      expect(validation.satisfiedByContext).toContain('latitude');
      expect(validation.satisfiedByContext).toContain('longitude');
      
      // Should be loggable
      const requestId = 'test-integration';
      expect(() => {
        logValidationSuccess(validation, intent, requestId, projectContext);
      }).not.toThrow();
      
      // Verify log was created
      expect(consoleLogSpy).toHaveBeenCalled();
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[consoleLogSpy.mock.calls.length - 1][0]);
      expect(loggedData.validation.contextUsed).toBe(true);
    });
    
    it('should produce loggable validation results without context', () => {
      const intent: RenewableIntent = {
        type: 'layout_optimization',
        params: {},
        confidence: 90
      };
      
      const validation = validateParameters(intent);
      
      // Validation should fail because no coordinates provided
      expect(validation.isValid).toBe(false);
      expect(validation.contextUsed).toBe(false);
      expect(validation.missingRequired).toContain('latitude');
      expect(validation.missingRequired).toContain('longitude');
      
      // Should be loggable
      const requestId = 'test-integration-fail';
      expect(() => {
        logValidationFailure(validation, intent, requestId);
      }).not.toThrow();
      
      // Verify log was created
      expect(consoleErrorSpy).toHaveBeenCalled();
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(loggedData.validation.contextUsed).toBe(false);
      expect(loggedData.projectContext.hasActiveProject).toBe(false);
    });
  });
  
  describe('CloudWatch Log Structure', () => {
    it('should create structured logs suitable for CloudWatch Insights queries', () => {
      const intent: RenewableIntent = {
        type: 'layout_optimization',
        params: { capacity: 50 },
        confidence: 90
      };
      
      const projectContext: ProjectContext = {
        projectName: 'cloudwatch-test',
        coordinates: { latitude: 35.0, longitude: -101.0 }
      };
      
      const validation = validateParameters(intent, projectContext);
      const requestId = 'cloudwatch-test-123';
      
      logValidationSuccess(validation, intent, requestId, projectContext);
      
      // Get the logged JSON
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[consoleLogSpy.mock.calls.length - 1][0]);
      
      // Verify all required fields for CloudWatch Insights
      expect(loggedData).toHaveProperty('level');
      expect(loggedData).toHaveProperty('category');
      expect(loggedData).toHaveProperty('requestId');
      expect(loggedData).toHaveProperty('intentType');
      expect(loggedData).toHaveProperty('timestamp');
      expect(loggedData).toHaveProperty('validation');
      expect(loggedData).toHaveProperty('projectContext');
      expect(loggedData).toHaveProperty('providedParameters');
      
      // Verify nested structures
      expect(loggedData.validation).toHaveProperty('isValid');
      expect(loggedData.validation).toHaveProperty('contextUsed');
      expect(loggedData.validation).toHaveProperty('satisfiedByContext');
      
      expect(loggedData.projectContext).toHaveProperty('hasActiveProject');
      expect(loggedData.projectContext).toHaveProperty('hasCoordinates');
      expect(loggedData.projectContext).toHaveProperty('hasTerrainResults');
      expect(loggedData.projectContext).toHaveProperty('hasLayoutResults');
      expect(loggedData.projectContext).toHaveProperty('hasSimulationResults');
    });
    
    it('should support filtering by validation status', () => {
      const successIntent: RenewableIntent = {
        type: 'terrain_analysis',
        params: { latitude: 35.0, longitude: -101.0 },
        confidence: 90
      };
      
      const failIntent: RenewableIntent = {
        type: 'layout_optimization',
        params: {},
        confidence: 90
      };
      
      const successValidation = validateParameters(successIntent);
      const failValidation = validateParameters(failIntent);
      
      logValidationSuccess(successValidation, successIntent, 'success-req');
      logValidationFailure(failValidation, failIntent, 'fail-req');
      
      // Get both logs
      const successLog = JSON.parse(consoleLogSpy.mock.calls[consoleLogSpy.mock.calls.length - 1][0]);
      const failLog = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      
      // Verify they can be filtered by level
      expect(successLog.level).toBe('INFO');
      expect(failLog.level).toBe('ERROR');
      
      // Verify they can be filtered by validation.isValid
      expect(successLog.validation.isValid).toBe(true);
      expect(failLog.validation.isValid).toBe(false);
    });
    
    it('should support filtering by context usage', () => {
      const withContextIntent: RenewableIntent = {
        type: 'layout_optimization',
        params: {},
        confidence: 90
      };
      
      const withoutContextIntent: RenewableIntent = {
        type: 'terrain_analysis',
        params: { latitude: 35.0, longitude: -101.0 },
        confidence: 90
      };
      
      const projectContext: ProjectContext = {
        projectName: 'test',
        coordinates: { latitude: 35.0, longitude: -101.0 }
      };
      
      const withContextValidation = validateParameters(withContextIntent, projectContext);
      const withoutContextValidation = validateParameters(withoutContextIntent);
      
      logValidationSuccess(withContextValidation, withContextIntent, 'with-context', projectContext);
      logValidationSuccess(withoutContextValidation, withoutContextIntent, 'without-context');
      
      // Get both logs
      const logs = consoleLogSpy.mock.calls
        .filter(call => {
          try {
            const data = JSON.parse(call[0]);
            return data.category === 'PARAMETER_VALIDATION';
          } catch {
            return false;
          }
        })
        .map(call => JSON.parse(call[0]));
      
      const withContextLog = logs.find(log => log.requestId === 'with-context');
      const withoutContextLog = logs.find(log => log.requestId === 'without-context');
      
      // Verify context usage can be filtered
      expect(withContextLog?.validation.contextUsed).toBe(true);
      expect(withoutContextLog?.validation.contextUsed).toBe(false);
      
      expect(withContextLog?.projectContext.hasActiveProject).toBe(true);
      expect(withoutContextLog?.projectContext.hasActiveProject).toBe(false);
    });
  });
});
