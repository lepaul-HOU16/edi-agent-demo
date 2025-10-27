/**
 * Integration Tests for Context-Aware Error Messages
 * 
 * Tests the complete flow of error message generation from validation
 * through to user-facing error display.
 */

import { validateParameters, formatValidationError, type ProjectContext, type RenewableIntent } from '../../amplify/functions/renewableOrchestrator/parameterValidator';

describe('Context-Aware Error Messages Integration', () => {
  describe('Layout Optimization Error Flow', () => {
    test('should provide helpful error when coordinates missing and no context', () => {
      const intent: RenewableIntent = {
        type: 'layout_optimization',
        params: {},
        confidence: 90
      };

      const validation = validateParameters(intent);
      const errorMessage = formatValidationError(validation, intent.type);

      expect(validation.isValid).toBe(false);
      expect(validation.missingRequired).toContain('latitude');
      expect(validation.missingRequired).toContain('longitude');
      expect(errorMessage).toContain('Missing required parameters');
      expect(errorMessage).toContain('coordinates');
    });

    test('should provide context-aware error when project exists but no coordinates', () => {
      const intent: RenewableIntent = {
        type: 'layout_optimization',
        params: {},
        confidence: 90
      };

      const projectContext: ProjectContext = {
        projectName: 'test-project'
        // No coordinates
      };

      const validation = validateParameters(intent, projectContext);
      const errorMessage = formatValidationError(validation, intent.type, projectContext);

      expect(validation.isValid).toBe(false);
      expect(errorMessage).toContain('Missing required information');
      expect(errorMessage).toContain('optimize layout at');
      expect(errorMessage).toContain('analyze terrain');
      expect(errorMessage).toContain('Active project: test-project');
    });

    test('should validate successfully when context has coordinates', () => {
      const intent: RenewableIntent = {
        type: 'layout_optimization',
        params: {
          latitude: 35.067482,
          longitude: -101.395466
        },
        confidence: 90
      };

      const projectContext: ProjectContext = {
        projectName: 'test-project',
        coordinates: {
          latitude: 35.067482,
          longitude: -101.395466
        }
      };

      const validation = validateParameters(intent, projectContext);

      expect(validation.isValid).toBe(true);
      expect(validation.satisfiedByContext).toHaveLength(0); // Explicit params provided
    });
  });

  describe('Wake Simulation Error Flow', () => {
    test('should provide helpful error when project_id missing and no context', () => {
      const intent: RenewableIntent = {
        type: 'wake_simulation',
        params: {},
        confidence: 90
      };

      const validation = validateParameters(intent);
      const errorMessage = formatValidationError(validation, intent.type);

      expect(validation.isValid).toBe(false);
      expect(validation.missingRequired).toContain('project_id');
      expect(errorMessage).toContain('Missing required parameters');
    });

    test('should provide context-aware error when project exists but no layout', () => {
      const intent: RenewableIntent = {
        type: 'wake_simulation',
        params: {},
        confidence: 90
      };

      const projectContext: ProjectContext = {
        projectName: 'test-project'
        // No layout_results
      };

      const validation = validateParameters(intent, projectContext);
      const errorMessage = formatValidationError(validation, intent.type, projectContext);

      expect(validation.isValid).toBe(false);
      expect(errorMessage).toContain('Missing required information');
      expect(errorMessage).toContain('Create a layout');
      expect(errorMessage).toContain('Active project: test-project');
    });
  });

  describe('Report Generation Error Flow', () => {
    test('should provide helpful error when project_id missing and no context', () => {
      const intent: RenewableIntent = {
        type: 'report_generation',
        params: {},
        confidence: 90
      };

      const validation = validateParameters(intent);
      const errorMessage = formatValidationError(validation, intent.type);

      expect(validation.isValid).toBe(false);
      expect(validation.missingRequired).toContain('project_id');
      expect(errorMessage).toContain('Missing required parameters');
    });

    test('should provide context-aware error when project exists but incomplete', () => {
      const intent: RenewableIntent = {
        type: 'report_generation',
        params: {},
        confidence: 90
      };

      const projectContext: ProjectContext = {
        projectName: 'test-project',
        terrain_results: { features: [] }
        // No layout_results
      };

      const validation = validateParameters(intent, projectContext);
      const errorMessage = formatValidationError(validation, intent.type, projectContext);

      expect(validation.isValid).toBe(false);
      expect(errorMessage).toContain('Missing required information');
      expect(errorMessage).toContain('Complete terrain analysis and layout optimization');
      expect(errorMessage).toContain('Active project: test-project');
    });
  });

  describe('Error Message Consistency', () => {
    test('should maintain consistent format across intent types', () => {
      const intents: Array<{ type: string; params: any }> = [
        { type: 'layout_optimization', params: {} },
        { type: 'wake_simulation', params: {} },
        { type: 'report_generation', params: {} }
      ];

      const projectContext: ProjectContext = {
        projectName: 'test-project'
      };

      intents.forEach(({ type, params }) => {
        const intent: RenewableIntent = {
          type: type as any,
          params,
          confidence: 90
        };

        const validation = validateParameters(intent, projectContext);
        const errorMessage = formatValidationError(validation, intent.type, projectContext);

        // All should have consistent structure
        expect(errorMessage).toContain('Missing required information');
        expect(errorMessage).toContain('Active project: test-project');
        expect(errorMessage).toMatch(/To (optimize layout|run wake simulation|generate a report)/);
      });
    });

    test('should handle multiple missing parameters gracefully', () => {
      const intent: RenewableIntent = {
        type: 'layout_optimization',
        params: {},
        confidence: 90
      };

      const validation = validateParameters(intent);
      const errorMessage = formatValidationError(validation, intent.type);

      expect(validation.missingRequired.length).toBeGreaterThan(0);
      expect(errorMessage).toContain('latitude');
      expect(errorMessage).toContain('longitude');
    });
  });

  describe('Validation with Invalid Values', () => {
    test('should handle both missing and invalid parameters', () => {
      const intent: RenewableIntent = {
        type: 'layout_optimization',
        params: {
          latitude: 200 // Invalid: out of range
          // longitude missing
        },
        confidence: 90
      };

      const projectContext: ProjectContext = {
        projectName: 'test-project'
      };

      const validation = validateParameters(intent, projectContext);
      const errorMessage = formatValidationError(validation, intent.type, projectContext);

      expect(validation.isValid).toBe(false);
      expect(errorMessage).toContain('Missing required information');
      expect(errorMessage).toContain('Invalid parameter values');
    });
  });
});
