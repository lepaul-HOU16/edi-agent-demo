/**
 * Integration tests for petrophysical calculation engine foundation
 * Tests the integration between types and engine functionality
 */

import { PetrophysicsCalculationEngine, petrophysicsEngine } from '../petrophysicsEngine';
import {
  WellLogData,
  CalculationParameters,
  PorosityMethod,
  ShaleVolumeMethod,
  SaturationMethod,
  PermeabilityMethod,
} from '../../types/petrophysics';

describe('Petrophysics Integration Tests', () => {
  describe('Type System Integration', () => {
    it('should properly type calculation methods', () => {
      const porosityMethod: PorosityMethod = 'density';
      const shaleMethod: ShaleVolumeMethod = 'larionov_tertiary';
      const saturationMethod: SaturationMethod = 'archie';
      const permeabilityMethod: PermeabilityMethod = 'kozeny_carman';

      expect(typeof porosityMethod).toBe('string');
      expect(typeof shaleMethod).toBe('string');
      expect(typeof saturationMethod).toBe('string');
      expect(typeof permeabilityMethod).toBe('string');
    });

    it('should validate calculation parameters with proper typing', () => {
      const engine = new PetrophysicsCalculationEngine();
      
      const params: CalculationParameters = {
        matrixDensity: 2.65,
        fluidDensity: 1.0,
        rw: 0.1,
        a: 1.0,
        m: 2.0,
        n: 2.0,
      };

      const result = engine.validateCalculationParameters('porosity', params);
      expect(result.isValid).toBe(true);
    });

    it('should work with the default engine instance', () => {
      expect(petrophysicsEngine).toBeInstanceOf(PetrophysicsCalculationEngine);
      
      const config = petrophysicsEngine.getConfig();
      expect(config.enableValidation).toBe(true);
    });
  });

  describe('Error Handling Integration', () => {
    it('should provide comprehensive error information', () => {
      const engine = new PetrophysicsCalculationEngine();
      
      const invalidParams: CalculationParameters = {
        matrixDensity: -1,
        rw: -0.5,
      };

      const result = engine.validateCalculationParameters('archie', invalidParams);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Check error structure
      result.errors.forEach(error => {
        expect(error).toHaveProperty('type');
        expect(error).toHaveProperty('severity');
        expect(error).toHaveProperty('message');
        expect(['parameter_error', 'data_error', 'numerical_error', 'method_error']).toContain(error.type);
        expect(['critical', 'major', 'minor']).toContain(error.severity);
      });
    });
  });

  describe('Configuration Integration', () => {
    it('should allow configuration updates that affect validation', () => {
      const engine = new PetrophysicsCalculationEngine({
        enableValidation: false,
      });

      // Even with validation disabled, the engine should still function
      const config = engine.getConfig();
      expect(config.enableValidation).toBe(false);
      
      // Update configuration
      engine.updateConfig({
        enableValidation: true,
        qualityThresholds: {
          dataCompleteness: 0.95,
          uncertaintyMax: 0.1,
        },
      });

      const updatedConfig = engine.getConfig();
      expect(updatedConfig.enableValidation).toBe(true);
      expect(updatedConfig.qualityThresholds.dataCompleteness).toBe(0.95);
    });
  });
});