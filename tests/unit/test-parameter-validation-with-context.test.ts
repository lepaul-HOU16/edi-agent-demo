/**
 * Unit tests for context-aware parameter validation
 * Tests the enhanced parameter validator with project context support
 */

import { 
  validateParameters, 
  canSatisfyFromContext,
  type ProjectContext,
  type ParameterValidationResult
} from '../../amplify/functions/renewableOrchestrator/parameterValidator';
import type { RenewableIntent } from '../../amplify/functions/renewableOrchestrator/types';

describe('Parameter Validation with Context', () => {
  
  describe('canSatisfyFromContext', () => {
    
    test('should return true for layout optimization with project coordinates', () => {
      const projectContext: ProjectContext = {
        projectName: 'test-project',
        coordinates: { latitude: 35.067482, longitude: -101.395466 }
      };
      
      expect(canSatisfyFromContext('latitude', 'layout_optimization', projectContext)).toBe(true);
      expect(canSatisfyFromContext('longitude', 'layout_optimization', projectContext)).toBe(true);
    });
    
    test('should return false for layout optimization without project coordinates', () => {
      const projectContext: ProjectContext = {
        projectName: 'test-project'
      };
      
      expect(canSatisfyFromContext('latitude', 'layout_optimization', projectContext)).toBe(false);
      expect(canSatisfyFromContext('longitude', 'layout_optimization', projectContext)).toBe(false);
    });
    
    test('should return false when no project context provided', () => {
      expect(canSatisfyFromContext('latitude', 'layout_optimization', undefined)).toBe(false);
    });
    
    test('should return true for wake simulation with layout results', () => {
      const projectContext: ProjectContext = {
        projectName: 'test-project',
        layout_results: { turbines: [] }
      };
      
      expect(canSatisfyFromContext('layout_results', 'wake_simulation', projectContext)).toBe(true);
    });
    
    test('should return false for unsupported intent types', () => {
      const projectContext: ProjectContext = {
        projectName: 'test-project',
        coordinates: { latitude: 35.067482, longitude: -101.395466 }
      };
      
      expect(canSatisfyFromContext('latitude', 'terrain_analysis', projectContext)).toBe(false);
    });
  });
  
  describe('validateParameters with context', () => {
    
    test('should accept layout optimization with project coordinates', () => {
      const intent: RenewableIntent = {
        type: 'layout_optimization',
        params: {},
        confidence: 90
      };
      
      const projectContext: ProjectContext = {
        projectName: 'test-project',
        coordinates: { latitude: 35.067482, longitude: -101.395466 }
      };
      
      const result = validateParameters(intent, projectContext);
      
      expect(result.isValid).toBe(true);
      expect(result.satisfiedByContext).toContain('latitude');
      expect(result.satisfiedByContext).toContain('longitude');
      expect(result.contextUsed).toBe(true);
      expect(result.missingRequired).toHaveLength(0);
    });
    
    test('should fail layout optimization without coordinates or context', () => {
      const intent: RenewableIntent = {
        type: 'layout_optimization',
        params: {},
        confidence: 90
      };
      
      const result = validateParameters(intent);
      
      expect(result.isValid).toBe(false);
      expect(result.missingRequired).toContain('latitude');
      expect(result.missingRequired).toContain('longitude');
      expect(result.satisfiedByContext).toHaveLength(0);
      expect(result.contextUsed).toBe(false);
    });
    
    test('should prefer explicit coordinates over context', () => {
      const intent: RenewableIntent = {
        type: 'layout_optimization',
        params: { 
          latitude: 40.0, 
          longitude: -100.0 
        },
        confidence: 90
      };
      
      const projectContext: ProjectContext = {
        projectName: 'test-project',
        coordinates: { latitude: 35.0, longitude: -101.0 }
      };
      
      const result = validateParameters(intent, projectContext);
      
      expect(result.isValid).toBe(true);
      expect(result.satisfiedByContext).toHaveLength(0);
      expect(result.contextUsed).toBe(false);
    });
    
    test('should validate explicit parameter values even with context', () => {
      const intent: RenewableIntent = {
        type: 'layout_optimization',
        params: { 
          latitude: 999, // Invalid value
          longitude: -100.0 
        },
        confidence: 90
      };
      
      const projectContext: ProjectContext = {
        projectName: 'test-project',
        coordinates: { latitude: 35.0, longitude: -101.0 }
      };
      
      const result = validateParameters(intent, projectContext);
      
      expect(result.isValid).toBe(false);
      expect(result.invalidValues).toContain('latitude');
    });
    
    test('should handle terrain analysis without context (not context-satisfiable)', () => {
      const intent: RenewableIntent = {
        type: 'terrain_analysis',
        params: {},
        confidence: 90
      };
      
      const projectContext: ProjectContext = {
        projectName: 'test-project',
        coordinates: { latitude: 35.0, longitude: -101.0 }
      };
      
      const result = validateParameters(intent, projectContext);
      
      // Terrain analysis requires explicit coordinates (not context-satisfiable)
      expect(result.isValid).toBe(false);
      expect(result.missingRequired).toContain('latitude');
      expect(result.missingRequired).toContain('longitude');
      expect(result.satisfiedByContext).toHaveLength(0);
    });
    
    test('should handle wake simulation with layout context', () => {
      const intent: RenewableIntent = {
        type: 'wake_simulation',
        params: {},
        confidence: 90
      };
      
      const projectContext: ProjectContext = {
        projectName: 'test-project',
        layout_results: { turbines: [] }
      };
      
      const result = validateParameters(intent, projectContext);
      
      // Wake simulation requires project_id, which is not in CONTEXT_SATISFIABLE_PARAMS
      // So it should still fail even with layout_results
      expect(result.isValid).toBe(false);
      expect(result.missingRequired).toContain('project_id');
    });
    
    test('should include context information in warnings', () => {
      const intent: RenewableIntent = {
        type: 'layout_optimization',
        params: {},
        confidence: 90
      };
      
      const projectContext: ProjectContext = {
        projectName: 'test-project',
        coordinates: { latitude: 35.067482, longitude: -101.395466 }
      };
      
      const result = validateParameters(intent, projectContext);
      
      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Using latitude from active project context'),
          expect.stringContaining('Using longitude from active project context')
        ])
      );
    });
    
    test('should handle partial context (only some parameters available)', () => {
      const intent: RenewableIntent = {
        type: 'layout_optimization',
        params: { latitude: 35.0 }, // Only latitude provided
        confidence: 90
      };
      
      const projectContext: ProjectContext = {
        projectName: 'test-project',
        coordinates: { latitude: 35.0, longitude: -101.0 }
      };
      
      const result = validateParameters(intent, projectContext);
      
      expect(result.isValid).toBe(true);
      expect(result.satisfiedByContext).toContain('longitude');
      expect(result.satisfiedByContext).not.toContain('latitude'); // Explicitly provided
    });
    
    test('should handle report generation with all results in context', () => {
      const intent: RenewableIntent = {
        type: 'report_generation',
        params: {},
        confidence: 90
      };
      
      const projectContext: ProjectContext = {
        projectName: 'test-project',
        terrain_results: { features: [] },
        layout_results: { turbines: [] }
      };
      
      const result = validateParameters(intent, projectContext);
      
      // Report generation requires project_id, not terrain/layout results
      expect(result.isValid).toBe(false);
      expect(result.missingRequired).toContain('project_id');
    });
  });
  
  describe('edge cases', () => {
    
    test('should handle null values in intent params', () => {
      const intent: RenewableIntent = {
        type: 'layout_optimization',
        params: { latitude: null, longitude: null },
        confidence: 90
      };
      
      const projectContext: ProjectContext = {
        projectName: 'test-project',
        coordinates: { latitude: 35.0, longitude: -101.0 }
      };
      
      const result = validateParameters(intent, projectContext);
      
      expect(result.isValid).toBe(true);
      expect(result.satisfiedByContext).toContain('latitude');
      expect(result.satisfiedByContext).toContain('longitude');
    });
    
    test('should handle undefined values in intent params', () => {
      const intent: RenewableIntent = {
        type: 'layout_optimization',
        params: { latitude: undefined, longitude: undefined },
        confidence: 90
      };
      
      const projectContext: ProjectContext = {
        projectName: 'test-project',
        coordinates: { latitude: 35.0, longitude: -101.0 }
      };
      
      const result = validateParameters(intent, projectContext);
      
      expect(result.isValid).toBe(true);
      expect(result.satisfiedByContext).toContain('latitude');
      expect(result.satisfiedByContext).toContain('longitude');
    });
    
    test('should handle empty project context', () => {
      const intent: RenewableIntent = {
        type: 'layout_optimization',
        params: {},
        confidence: 90
      };
      
      const projectContext: ProjectContext = {};
      
      const result = validateParameters(intent, projectContext);
      
      expect(result.isValid).toBe(false);
      expect(result.missingRequired).toContain('latitude');
      expect(result.missingRequired).toContain('longitude');
      expect(result.satisfiedByContext).toHaveLength(0);
    });
  });
});
