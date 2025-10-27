/**
 * Unit Tests for Context-Aware Error Messages
 * 
 * Tests the enhanced error message formatting for missing context scenarios
 */

import { formatValidationError, canSatisfyFromContext, type ProjectContext, type ParameterValidationResult } from '../../amplify/functions/renewableOrchestrator/parameterValidator';
import { ErrorMessageTemplates } from '../../amplify/functions/shared/errorMessageTemplates';

describe('Context-Aware Error Messages', () => {
  describe('formatMissingContextError', () => {
    test('should provide layout optimization guidance without context', () => {
      const message = ErrorMessageTemplates.formatMissingContextError(
        'layout_optimization',
        ['latitude', 'longitude']
      );
      
      expect(message).toContain('Missing required information: latitude, longitude');
      expect(message).toContain('optimize layout at 35.067482, -101.395466');
      expect(message).toContain('analyze terrain at 35.067482, -101.395466');
    });

    test('should include active project name when available', () => {
      const message = ErrorMessageTemplates.formatMissingContextError(
        'layout_optimization',
        ['latitude', 'longitude'],
        'west-texas-site'
      );
      
      expect(message).toContain('Active project: west-texas-site');
    });

    test('should provide wake simulation guidance', () => {
      const message = ErrorMessageTemplates.formatMissingContextError(
        'wake_simulation',
        ['project_id']
      );
      
      expect(message).toContain('Missing required information: project_id');
      expect(message).toContain('Create a layout');
      expect(message).toContain('run wake simulation for project-name');
    });

    test('should provide report generation guidance', () => {
      const message = ErrorMessageTemplates.formatMissingContextError(
        'report_generation',
        ['project_id']
      );
      
      expect(message).toContain('Missing required information: project_id');
      expect(message).toContain('Complete terrain analysis and layout optimization');
      expect(message).toContain('generate report for project-name');
    });
  });

  describe('formatValidationError with context', () => {
    test('should use context-aware message when context is available but missing data', () => {
      const validation: ParameterValidationResult = {
        isValid: false,
        errors: [],
        warnings: [],
        missingRequired: ['latitude', 'longitude'],
        invalidValues: [],
        satisfiedByContext: [],
        contextUsed: false
      };

      const projectContext: ProjectContext = {
        projectName: 'test-project'
        // No coordinates available
      };

      const message = formatValidationError(validation, 'layout_optimization', projectContext);
      
      expect(message).toContain('Missing required information');
      expect(message).toContain('optimize layout at');
      expect(message).toContain('analyze terrain');
      expect(message).toContain('Active project: test-project');
    });

    test('should use context-aware message when parameters could be satisfied by context', () => {
      const validation: ParameterValidationResult = {
        isValid: false,
        errors: [],
        warnings: [],
        missingRequired: ['latitude', 'longitude'],
        invalidValues: [],
        satisfiedByContext: [],
        contextUsed: false
      };

      const projectContext: ProjectContext = {
        projectName: 'test-project',
        coordinates: {
          latitude: 35.067482,
          longitude: -101.395466
        }
      };

      const message = formatValidationError(validation, 'layout_optimization', projectContext);
      
      // Should use context-aware message since context has coordinates
      expect(message).toContain('Missing required information');
    });

    test('should use basic message when no context available', () => {
      const validation: ParameterValidationResult = {
        isValid: false,
        errors: [],
        warnings: [],
        missingRequired: ['latitude', 'longitude'],
        invalidValues: [],
        satisfiedByContext: [],
        contextUsed: false
      };

      const message = formatValidationError(validation, 'layout_optimization');
      
      expect(message).toContain('Missing required parameters: latitude, longitude');
    });

    test('should handle invalid values separately', () => {
      const validation: ParameterValidationResult = {
        isValid: false,
        errors: [],
        warnings: [],
        missingRequired: [],
        invalidValues: ['latitude: must be between -90 and 90'],
        satisfiedByContext: [],
        contextUsed: false
      };

      const message = formatValidationError(validation, 'layout_optimization');
      
      expect(message).toContain('Invalid parameter values');
      expect(message).toContain('latitude: must be between -90 and 90');
    });

    test('should handle both missing and invalid parameters', () => {
      const validation: ParameterValidationResult = {
        isValid: false,
        errors: [],
        warnings: [],
        missingRequired: ['longitude'],
        invalidValues: ['latitude: must be between -90 and 90'],
        satisfiedByContext: [],
        contextUsed: false
      };

      const projectContext: ProjectContext = {
        projectName: 'test-project'
      };

      const message = formatValidationError(validation, 'layout_optimization', projectContext);
      
      expect(message).toContain('Missing required information');
      expect(message).toContain('Invalid parameter values');
    });
  });

  describe('Intent-specific guidance', () => {
    test('should provide terrain analysis guidance', () => {
      const validation: ParameterValidationResult = {
        isValid: false,
        errors: [],
        warnings: [],
        missingRequired: ['latitude', 'longitude'],
        invalidValues: [],
        satisfiedByContext: [],
        contextUsed: false
      };

      const message = formatValidationError(validation, 'terrain_analysis');
      
      expect(message).toContain('Missing required parameters');
      expect(message).toContain('terrain analysis');
      expect(message).toContain('coordinates');
    });

    test('should provide wake simulation guidance', () => {
      const validation: ParameterValidationResult = {
        isValid: false,
        errors: [],
        warnings: [],
        missingRequired: ['project_id'],
        invalidValues: [],
        satisfiedByContext: [],
        contextUsed: false
      };

      const projectContext: ProjectContext = {
        projectName: 'test-project'
      };

      const message = formatValidationError(validation, 'wake_simulation', projectContext);
      
      expect(message).toContain('Missing required information');
      expect(message).toContain('Create a layout');
    });

    test('should provide report generation guidance', () => {
      const validation: ParameterValidationResult = {
        isValid: false,
        errors: [],
        warnings: [],
        missingRequired: ['project_id'],
        invalidValues: [],
        satisfiedByContext: [],
        contextUsed: false
      };

      const projectContext: ProjectContext = {
        projectName: 'test-project'
      };

      const message = formatValidationError(validation, 'report_generation', projectContext);
      
      expect(message).toContain('Missing required information');
      expect(message).toContain('Complete terrain analysis and layout optimization');
    });
  });

  describe('Active project name inclusion', () => {
    test('should include active project name in layout optimization error', () => {
      const validation: ParameterValidationResult = {
        isValid: false,
        errors: [],
        warnings: [],
        missingRequired: ['latitude', 'longitude'],
        invalidValues: [],
        satisfiedByContext: [],
        contextUsed: false
      };

      const projectContext: ProjectContext = {
        projectName: 'west-texas-wind-farm'
      };

      const message = formatValidationError(validation, 'layout_optimization', projectContext);
      
      expect(message).toContain('Active project: west-texas-wind-farm');
    });

    test('should not include project name when not available', () => {
      const validation: ParameterValidationResult = {
        isValid: false,
        errors: [],
        warnings: [],
        missingRequired: ['latitude', 'longitude'],
        invalidValues: [],
        satisfiedByContext: [],
        contextUsed: false
      };

      const message = formatValidationError(validation, 'layout_optimization');
      
      expect(message).not.toContain('Active project:');
    });
  });

  describe('Suggestions for missing information', () => {
    test('should suggest providing coordinates or running terrain analysis', () => {
      const message = ErrorMessageTemplates.formatMissingContextError(
        'layout_optimization',
        ['latitude', 'longitude']
      );
      
      expect(message).toContain('Provide coordinates');
      expect(message).toContain('Run terrain analysis first');
    });

    test('should suggest creating layout or specifying project', () => {
      const message = ErrorMessageTemplates.formatMissingContextError(
        'wake_simulation',
        ['project_id']
      );
      
      expect(message).toContain('Create a layout');
      expect(message).toContain('specify a project');
    });

    test('should suggest completing workflow or specifying project', () => {
      const message = ErrorMessageTemplates.formatMissingContextError(
        'report_generation',
        ['project_id']
      );
      
      expect(message).toContain('Complete terrain analysis and layout optimization');
      expect(message).toContain('specify a project');
    });
  });
});
