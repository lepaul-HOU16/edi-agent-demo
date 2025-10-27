/**
 * Parameter Validation Tests
 * 
 * Tests for parameter validation logic to ensure proper error handling
 * and clear error messages for missing or invalid parameters.
 */

import { 
  validateParameters, 
  applyDefaultParameters, 
  formatValidationError 
} from '../parameterValidator';
import type { RenewableIntent } from '../types';

describe('Parameter Validation', () => {
  describe('validateParameters', () => {
    describe('terrain_analysis', () => {
      it('should validate valid terrain analysis parameters', () => {
        const intent: RenewableIntent = {
          type: 'terrain_analysis',
          params: {
            latitude: 35.067482,
            longitude: -101.395466,
            radius_km: 5,
            setback_m: 200
          },
          confidence: 90
        };
        
        const result = validateParameters(intent);
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.missingRequired).toHaveLength(0);
        expect(result.invalidValues).toHaveLength(0);
      });
      
      it('should fail when latitude is missing', () => {
        const intent: RenewableIntent = {
          type: 'terrain_analysis',
          params: {
            longitude: -101.395466
          },
          confidence: 90
        };
        
        const result = validateParameters(intent);
        
        expect(result.isValid).toBe(false);
        expect(result.missingRequired).toContain('latitude');
        expect(result.errors).toContain('Missing required parameter: latitude');
      });
      
      it('should fail when longitude is missing', () => {
        const intent: RenewableIntent = {
          type: 'terrain_analysis',
          params: {
            latitude: 35.067482
          },
          confidence: 90
        };
        
        const result = validateParameters(intent);
        
        expect(result.isValid).toBe(false);
        expect(result.missingRequired).toContain('longitude');
        expect(result.errors).toContain('Missing required parameter: longitude');
      });
      
      it('should fail when latitude is out of range', () => {
        const intent: RenewableIntent = {
          type: 'terrain_analysis',
          params: {
            latitude: 95.0, // Invalid: > 90
            longitude: -101.395466
          },
          confidence: 90
        };
        
        const result = validateParameters(intent);
        
        expect(result.isValid).toBe(false);
        expect(result.invalidValues).toContain('latitude');
        expect(result.errors.some(e => e.includes('Latitude must be between -90 and 90'))).toBe(true);
      });
      
      it('should fail when longitude is out of range', () => {
        const intent: RenewableIntent = {
          type: 'terrain_analysis',
          params: {
            latitude: 35.067482,
            longitude: -185.0 // Invalid: < -180
          },
          confidence: 90
        };
        
        const result = validateParameters(intent);
        
        expect(result.isValid).toBe(false);
        expect(result.invalidValues).toContain('longitude');
        expect(result.errors.some(e => e.includes('Longitude must be between -180 and 180'))).toBe(true);
      });
      
      it('should warn about missing optional parameters', () => {
        const intent: RenewableIntent = {
          type: 'terrain_analysis',
          params: {
            latitude: 35.067482,
            longitude: -101.395466
          },
          confidence: 90
        };
        
        const result = validateParameters(intent);
        
        expect(result.isValid).toBe(true);
        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.warnings.some(w => w.includes('radius_km'))).toBe(true);
      });
    });
    
    describe('layout_optimization', () => {
      it('should validate valid layout optimization parameters', () => {
        const intent: RenewableIntent = {
          type: 'layout_optimization',
          params: {
            latitude: 35.067482,
            longitude: -101.395466,
            capacity: 30,
            num_turbines: 12
          },
          confidence: 90
        };
        
        const result = validateParameters(intent);
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
      
      it('should pass when capacity is missing (will use default)', () => {
        const intent: RenewableIntent = {
          type: 'layout_optimization',
          params: {
            latitude: 35.067482,
            longitude: -101.395466
          },
          confidence: 90
        };
        
        const result = validateParameters(intent);
        
        // Capacity is now optional with a default value
        expect(result.isValid).toBe(true);
        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.warnings.some(w => w.includes('capacity'))).toBe(true);
      });
      
      it('should fail when capacity is invalid', () => {
        const intent: RenewableIntent = {
          type: 'layout_optimization',
          params: {
            latitude: 35.067482,
            longitude: -101.395466,
            capacity: -10 // Invalid: negative
          },
          confidence: 90
        };
        
        const result = validateParameters(intent);
        
        expect(result.isValid).toBe(false);
        expect(result.invalidValues).toContain('capacity');
        expect(result.errors.some(e => e.includes('Capacity must be greater than 0'))).toBe(true);
      });
      
      it('should fail when capacity is too large', () => {
        const intent: RenewableIntent = {
          type: 'layout_optimization',
          params: {
            latitude: 35.067482,
            longitude: -101.395466,
            capacity: 1500 // Invalid: > 1000
          },
          confidence: 90
        };
        
        const result = validateParameters(intent);
        
        expect(result.isValid).toBe(false);
        expect(result.invalidValues).toContain('capacity');
        expect(result.errors.some(e => e.includes('Capacity must be 1000 MW or less'))).toBe(true);
      });
    });
    
    describe('wake_simulation', () => {
      it('should validate valid wake simulation parameters', () => {
        const intent: RenewableIntent = {
          type: 'wake_simulation',
          params: {
            project_id: 'project-123'
          },
          confidence: 90
        };
        
        const result = validateParameters(intent);
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
      
      it('should fail when project_id is missing', () => {
        const intent: RenewableIntent = {
          type: 'wake_simulation',
          params: {},
          confidence: 90
        };
        
        const result = validateParameters(intent);
        
        expect(result.isValid).toBe(false);
        expect(result.missingRequired).toContain('project_id');
      });
      
      it('should fail when project_id has invalid characters', () => {
        const intent: RenewableIntent = {
          type: 'wake_simulation',
          params: {
            project_id: 'project@123!' // Invalid: special characters
          },
          confidence: 90
        };
        
        const result = validateParameters(intent);
        
        expect(result.isValid).toBe(false);
        expect(result.invalidValues).toContain('project_id');
        expect(result.errors.some(e => e.includes('can only contain letters, numbers, hyphens, and underscores'))).toBe(true);
      });
    });
    
    describe('report_generation', () => {
      it('should validate valid report generation parameters', () => {
        const intent: RenewableIntent = {
          type: 'report_generation',
          params: {
            project_id: 'project-123'
          },
          confidence: 90
        };
        
        const result = validateParameters(intent);
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
      
      it('should fail when project_id is missing', () => {
        const intent: RenewableIntent = {
          type: 'report_generation',
          params: {},
          confidence: 90
        };
        
        const result = validateParameters(intent);
        
        expect(result.isValid).toBe(false);
        expect(result.missingRequired).toContain('project_id');
      });
    });
  });
  
  describe('applyDefaultParameters', () => {
    it('should apply default radius_km for terrain analysis', () => {
      const intent: RenewableIntent = {
        type: 'terrain_analysis',
        params: {
          latitude: 35.067482,
          longitude: -101.395466
        },
        confidence: 90
      };
      
      const result = applyDefaultParameters(intent);
      
      expect(result.params.radius_km).toBe(5);
      expect(result.params.setback_m).toBe(200);
    });
    
    it('should generate project_id if not provided', () => {
      const intent: RenewableIntent = {
        type: 'terrain_analysis',
        params: {
          latitude: 35.067482,
          longitude: -101.395466
        },
        confidence: 90
      };
      
      const result = applyDefaultParameters(intent);
      
      expect(result.params.project_id).toBeDefined();
      expect(result.params.project_id).toMatch(/^project-\d+$/);
    });
    
    it('should calculate num_turbines from capacity for layout optimization', () => {
      const intent: RenewableIntent = {
        type: 'layout_optimization',
        params: {
          latitude: 35.067482,
          longitude: -101.395466,
          capacity: 30
        },
        confidence: 90
      };
      
      const result = applyDefaultParameters(intent);
      
      expect(result.params.num_turbines).toBe(12); // 30 / 2.5 = 12
    });
    
    it('should not override existing num_turbines', () => {
      const intent: RenewableIntent = {
        type: 'layout_optimization',
        params: {
          latitude: 35.067482,
          longitude: -101.395466,
          capacity: 30,
          num_turbines: 15
        },
        confidence: 90
      };
      
      const result = applyDefaultParameters(intent);
      
      expect(result.params.num_turbines).toBe(15); // Should keep existing value
    });
  });
  
  describe('formatValidationError', () => {
    it('should format missing required parameters error', () => {
      const validation = {
        isValid: false,
        errors: ['Missing required parameter: latitude', 'Missing required parameter: longitude'],
        warnings: [],
        missingRequired: ['latitude', 'longitude'],
        invalidValues: [],
        satisfiedByContext: [],
        contextUsed: false
      };
      
      const message = formatValidationError(validation, 'terrain_analysis');
      
      expect(message).toContain('Missing required parameters: latitude, longitude');
      expect(message).toContain('please provide coordinates');
    });
    
    it('should format invalid values error', () => {
      const validation = {
        isValid: false,
        errors: ['Invalid latitude: Latitude must be between -90 and 90'],
        warnings: [],
        missingRequired: [],
        invalidValues: ['latitude'],
        satisfiedByContext: [],
        contextUsed: false
      };
      
      const message = formatValidationError(validation, 'terrain_analysis');
      
      expect(message).toContain('Invalid parameter values: latitude');
    });
    
    it('should include guidance for layout optimization', () => {
      const validation = {
        isValid: false,
        errors: ['Missing required parameter: latitude'],
        warnings: [],
        missingRequired: ['latitude'],
        invalidValues: [],
        satisfiedByContext: [],
        contextUsed: false
      };
      
      const message = formatValidationError(validation, 'layout_optimization');
      
      // Updated guidance now mentions coordinates are required, capacity is optional
      expect(message).toContain('please provide coordinates');
      expect(message).toContain('Optionally specify capacity');
    });
  });
});
