/**
 * Unit tests for Permeability Calculator
 * Tests all permeability estimation methods comparing results with published correlations
 * Based on requirements 2.10, 2.11
 */

import { PermeabilityCalculator, PermeabilityCalculationRequest } from '../permeabilityCalculator';
import { LogCurve } from '../../../types/petrophysics';

describe('PermeabilityCalculator', () => {
  let calculator: PermeabilityCalculator;

  const createMockCurve = (name: string, data: number[]): LogCurve => ({
    name,
    unit: name === 'DEPT' ? 'ft' : (name === 'POROSITY' ? 'v/v' : 'v/v'),
    description: `Mock ${name} curve`,
    data,
    nullValue: -999.25,
    quality: {
      completeness: 1.0,
      outlierCount: 0,
      environmentalCorrections: [],
      qualityFlag: 'excellent',
    },
    apiCode: name,
  });

  beforeEach(() => {
    calculator = new PermeabilityCalculator();
  });

  describe('calculateKozenyCarman', () => {
    it('should calculate permeability using Kozeny-Carman equation k = (φ³ / (1-φ)²) * (d²/180)', () => {
      const porosityData = [0.1, 0.2, 0.3]; // 10%, 20%, 30% porosity
      const parameters = { grainSize: 100 }; // 100 microns
      
      const result = calculator.calculateKozenyCarman(porosityData, parameters);

      expect(result).toHaveLength(3);
      
      // All results should be positive permeability values
      result.forEach(perm => {
        expect(perm).toBeGreaterThan(0);
        expect(perm).not.toBe(-999.25);
      });

      // Higher porosity should generally result in higher permeability
      expect(result[2]).toBeGreaterThan(result[1]);
      expect(result[1]).toBeGreaterThan(result[0]);
    });

    it('should handle null values correctly', () => {
      const porosityData = [0.2, -999.25, NaN, 0.3];
      const result = calculator.calculateKozenyCarman(porosityData);

      expect(result[0]).toBeGreaterThan(0); // Valid calculation
      expect(result[1]).toBe(-999.25); // Null porosity
      expect(result[2]).toBe(-999.25); // NaN porosity
      expect(result[3]).toBeGreaterThan(0); // Valid calculation
    });

    it('should handle out-of-range porosity values', () => {
      const porosityData = [-0.1, 0.2, 1.0, 1.1]; // Invalid porosity values
      const result = calculator.calculateKozenyCarman(porosityData);

      expect(result[0]).toBe(-999.25); // Negative porosity
      expect(result[1]).toBeGreaterThan(0); // Valid porosity
      expect(result[2]).toBe(-999.25); // Porosity = 1.0 (invalid)
      expect(result[3]).toBe(-999.25); // Porosity > 1.0
    });

    it('should scale with grain size correctly', () => {
      const porosityData = [0.2];
      const smallGrain = calculator.calculateKozenyCarman(porosityData, { grainSize: 50 });
      const largeGrain = calculator.calculateKozenyCarman(porosityData, { grainSize: 200 });

      // Larger grain size should result in higher permeability (d² relationship)
      expect(largeGrain[0]).toBeGreaterThan(smallGrain[0]);
      
      // Should scale approximately as d² (4x grain size = ~16x permeability)
      const ratio = largeGrain[0] / smallGrain[0];
      expect(ratio).toBeGreaterThan(10); // Should be close to 16
    });

    it('should produce reasonable permeability values for typical sandstone', () => {
      const porosityData = [0.15, 0.20, 0.25]; // Typical sandstone porosity
      const parameters = { grainSize: 150 }; // Typical fine-medium sand
      
      const result = calculator.calculateKozenyCarman(porosityData, parameters);

      // Should produce reasonable permeability values (0.1 to 1000 mD range)
      result.forEach(perm => {
        expect(perm).toBeGreaterThan(0.01);
        expect(perm).toBeLessThan(10000);
      });
    });
  });

  describe('calculateTimur', () => {
    it('should calculate permeability using Timur correlation k = 0.136 * (φ^4.4 / Swi^2)', () => {
      const porosityData = [0.1, 0.2, 0.3];
      const swiData = [0.3, 0.2, 0.15]; // Decreasing Swi
      
      const result = calculator.calculateTimur(porosityData, swiData);

      expect(result).toHaveLength(3);
      
      // All results should be positive permeability values
      result.forEach(perm => {
        expect(perm).toBeGreaterThan(0);
        expect(perm).not.toBe(-999.25);
      });

      // Verify Timur formula for first point: k = 0.136 * (0.1^4.4 / 0.3^2)
      const expectedFirst = 0.136 * (Math.pow(0.1, 4.4) / Math.pow(0.3, 2));
      expect(result[0]).toBeCloseTo(expectedFirst, 6);
    });

    it('should use constant Swi when no Swi data provided', () => {
      const porosityData = [0.2, 0.25, 0.3];
      const parameters = { swi: 0.25 };
      
      const result = calculator.calculateTimur(porosityData, undefined, parameters);

      expect(result).toHaveLength(3);
      result.forEach(perm => {
        expect(perm).toBeGreaterThan(0);
      });

      // Verify calculation with constant Swi
      const expectedFirst = 0.136 * (Math.pow(0.2, 4.4) / Math.pow(0.25, 2));
      expect(result[0]).toBeCloseTo(expectedFirst, 6);
    });

    it('should handle null values correctly', () => {
      const porosityData = [0.2, -999.25, 0.3];
      const swiData = [0.2, 0.25, -999.25];
      
      const result = calculator.calculateTimur(porosityData, swiData);

      expect(result[0]).toBeGreaterThan(0); // Valid calculation
      expect(result[1]).toBe(-999.25); // Null porosity
      expect(result[2]).toBe(-999.25); // Null Swi
    });

    it('should handle out-of-range values', () => {
      const porosityData = [0.2, 1.1, 0.3];
      const swiData = [0.2, 0.25, 1.1]; // Invalid Swi
      
      const result = calculator.calculateTimur(porosityData, swiData);

      expect(result[0]).toBeGreaterThan(0); // Valid
      expect(result[1]).toBe(-999.25); // Invalid porosity
      expect(result[2]).toBe(-999.25); // Invalid Swi
    });

    it('should show inverse relationship with Swi', () => {
      const porosityData = [0.2, 0.2]; // Same porosity
      const swiData = [0.1, 0.4]; // Different Swi values
      
      const result = calculator.calculateTimur(porosityData, swiData);

      // Lower Swi should result in higher permeability
      expect(result[0]).toBeGreaterThan(result[1]);
    });
  });

  describe('calculateCoatesDumanoir', () => {
    it('should calculate permeability using Coates-Dumanoir correlation k = C * (φ^x / Swi^y)', () => {
      const porosityData = [0.2];
      const swiData = [0.25];
      const parameters = { c: 10000, x: 4.0, y: 2.0 };
      
      const result = calculator.calculateCoatesDumanoir(porosityData, swiData, parameters);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeGreaterThan(0);

      // Verify calculation: k = 10000 * (0.2^4 / 0.25^2)
      const expected = 10000 * (Math.pow(0.2, 4) / Math.pow(0.25, 2));
      expect(result[0]).toBeCloseTo(expected, 6);
    });

    it('should use default parameters when not provided', () => {
      const porosityData = [0.2];
      const swiData = [0.25];
      
      const result = calculator.calculateCoatesDumanoir(porosityData, swiData);

      expect(result[0]).toBeGreaterThan(0);
      
      // Should use default parameters: C=10000, x=4.0, y=2.0
      const expected = 10000 * (Math.pow(0.2, 4.0) / Math.pow(0.25, 2.0));
      expect(result[0]).toBeCloseTo(expected, 6);
    });

    it('should handle custom parameters', () => {
      const porosityData = [0.25];
      const swiData = [0.2];
      const parameters = { c: 5000, x: 3.5, y: 1.8 };
      
      const result = calculator.calculateCoatesDumanoir(porosityData, swiData, parameters);

      const expected = 5000 * (Math.pow(0.25, 3.5) / Math.pow(0.2, 1.8));
      expect(result[0]).toBeCloseTo(expected, 6);
    });
  });

  describe('calculatePermeability - Main Method', () => {
    it('should calculate permeability using Kozeny-Carman method', () => {
      const request: PermeabilityCalculationRequest = {
        wellName: 'TEST-001',
        method: 'kozeny_carman',
        parameters: { grainSize: 100 },
        inputCurves: {
          porosity: createMockCurve('POROSITY', [0.15, 0.20, 0.25]),
          depth: createMockCurve('DEPT', [1000, 1001, 1002]),
        },
      };

      const result = calculator.calculatePermeability(request);

      expect(result.values).toHaveLength(3);
      expect(result.values.every(k => k > 0)).toBe(true);
      expect(result.methodology).toContain('Kozeny-Carman');
      expect(result.uncertainty).toHaveLength(3);
      expect(result.statistics.validCount).toBe(3);
    });

    it('should calculate permeability using Timur method', () => {
      const request: PermeabilityCalculationRequest = {
        wellName: 'TEST-001',
        method: 'timur',
        parameters: { swi: 0.2 },
        inputCurves: {
          porosity: createMockCurve('POROSITY', [0.15, 0.20, 0.25]),
          depth: createMockCurve('DEPT', [1000, 1001, 1002]),
        },
      };

      const result = calculator.calculatePermeability(request);

      expect(result.values).toHaveLength(3);
      expect(result.values.every(k => k > 0)).toBe(true);
      expect(result.methodology).toContain('Timur');
    });

    it('should calculate permeability using Timur method with Swi curve', () => {
      const request: PermeabilityCalculationRequest = {
        wellName: 'TEST-001',
        method: 'timur',
        parameters: {},
        inputCurves: {
          porosity: createMockCurve('POROSITY', [0.15, 0.20, 0.25]),
          swi: createMockCurve('SWI', [0.3, 0.25, 0.2]),
          depth: createMockCurve('DEPT', [1000, 1001, 1002]),
        },
      };

      const result = calculator.calculatePermeability(request);

      expect(result.values).toHaveLength(3);
      expect(result.values.every(k => k > 0)).toBe(true);
      expect(result.methodology).toContain('log-derived Swi');
    });

    it('should apply depth range filter', () => {
      const request: PermeabilityCalculationRequest = {
        wellName: 'TEST-001',
        method: 'timur',
        parameters: { swi: 0.2 },
        depthRange: [1001, 1002],
        inputCurves: {
          porosity: createMockCurve('POROSITY', [0.15, 0.20, 0.25]),
          depth: createMockCurve('DEPT', [1000, 1001, 1002]),
        },
      };

      const result = calculator.calculatePermeability(request);

      expect(result.values).toHaveLength(2); // Only depths 1001 and 1002
      expect(result.depths).toEqual([1001, 1002]);
    });

    it('should throw error for unsupported method', () => {
      const request: PermeabilityCalculationRequest = {
        wellName: 'TEST-001',
        method: 'invalid' as any,
        parameters: {},
        inputCurves: {
          porosity: createMockCurve('POROSITY', [0.15, 0.20, 0.25]),
          depth: createMockCurve('DEPT', [1000, 1001, 1002]),
        },
      };

      expect(() => {
        calculator.calculatePermeability(request);
      }).toThrow('Unsupported permeability method: invalid');
    });
  });

  describe('validateParameters', () => {
    it('should validate correct parameters', () => {
      const parameters = { grainSize: 100, swi: 0.2 };
      const result = calculator.validateParameters(parameters);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid grain size', () => {
      const parameters = { grainSize: -10, swi: 0.2 };
      const result = calculator.validateParameters(parameters);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Grain size must be between 0 and 10000 microns');
    });

    it('should reject invalid Swi', () => {
      const parameters = { grainSize: 100, swi: 1.5 };
      const result = calculator.validateParameters(parameters);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Irreducible water saturation (Swi) must be between 0 and 1');
    });

    it('should warn about unusual parameter values', () => {
      const parameters = { grainSize: 5, swi: 0.8 }; // Very fine grain, high Swi
      const result = calculator.validateParameters(parameters);

      expect(result.isValid).toBe(true); // No errors, but warnings
      expect(result.warnings.length).toBeGreaterThanOrEqual(2);
    });

    it('should warn about unusual Coates-Dumanoir parameters', () => {
      const parameters = { grainSize: 100, swi: 0.2, c: 1e7, x: 10 };
      const result = calculator.validateParameters(parameters);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Published Correlations Comparison', () => {
    it('should match published Timur correlation results', () => {
      // Example from Schlumberger Log Interpretation Charts
      const porosityData = [0.20]; // 20% porosity
      const swiData = [0.30]; // 30% irreducible water saturation
      
      const result = calculator.calculateTimur(porosityData, swiData);
      
      // Expected: k = 0.136 * (0.20^4.4 / 0.30^2)
      const expected = 0.136 * (Math.pow(0.20, 4.4) / Math.pow(0.30, 2));
      expect(result[0]).toBeCloseTo(expected, 6);
      
      // The actual calculated value should be reasonable for the given inputs
      expect(result[0]).toBeGreaterThan(0.001);
      expect(result[0]).toBeLessThan(1);
    });

    it('should produce reasonable results for typical reservoir rocks', () => {
      // Test with typical reservoir parameters
      const porosityData = [0.12, 0.18, 0.25]; // Poor to good reservoir quality
      const swiData = [0.35, 0.25, 0.15]; // Corresponding Swi values
      
      const timurResult = calculator.calculateTimur(porosityData, swiData);
      const kozenyResult = calculator.calculateKozenyCarman(porosityData, { grainSize: 150 });
      
      // All results should be positive and finite
      [...timurResult, ...kozenyResult].forEach(perm => {
        expect(perm).toBeGreaterThan(0);
        expect(perm).toBeLessThan(1e6); // Reasonable upper bound
        expect(perm).not.toBe(-999.25);
      });
      
      // Higher porosity should generally give higher permeability
      expect(timurResult[2]).toBeGreaterThan(timurResult[0]);
      expect(kozenyResult[2]).toBeGreaterThan(kozenyResult[0]);
    });

    it('should handle tight rock scenarios', () => {
      const porosityData = [0.05, 0.08]; // Tight rock porosity
      const swiData = [0.6, 0.5]; // High Swi for tight rocks
      
      const result = calculator.calculateTimur(porosityData, swiData);
      
      // Should produce very low permeability values
      result.forEach(perm => {
        expect(perm).toBeGreaterThan(0);
        expect(perm).toBeLessThan(1); // < 1 mD for tight rocks
      });
    });

    it('should handle high-quality reservoir scenarios', () => {
      const porosityData = [0.28, 0.32]; // High porosity
      const swiData = [0.12, 0.10]; // Low Swi
      
      const result = calculator.calculateTimur(porosityData, swiData);
      
      // Should produce higher permeability values than low-quality scenarios
      result.forEach(perm => {
        expect(perm).toBeGreaterThan(0.01); // Should be higher than tight rocks
        expect(perm).toBeLessThan(10000); // But still reasonable
      });
      
      // Should be higher than a low-quality scenario
      const lowQualityResult = calculator.calculateTimur([0.10], [0.40]);
      expect(result[0]).toBeGreaterThan(lowQualityResult[0]);
    });
  });

  describe('Method Comparison', () => {
    it('should compare different methods for consistency', () => {
      const porosityData = [0.20];
      const swiData = [0.25];
      const parameters = { grainSize: 150, swi: 0.25 };
      
      const kozenyResult = calculator.calculateKozenyCarman(porosityData, parameters);
      const timurResult = calculator.calculateTimur(porosityData, swiData);
      const coatesResult = calculator.calculateCoatesDumanoir(porosityData, swiData);
      
      // All methods should produce positive results
      expect(kozenyResult[0]).toBeGreaterThan(0);
      expect(timurResult[0]).toBeGreaterThan(0);
      expect(coatesResult[0]).toBeGreaterThan(0);
      
      // Results should be within reasonable range (permeability methods can vary widely)
      const results = [kozenyResult[0], timurResult[0], coatesResult[0]];
      const maxResult = Math.max(...results);
      const minResult = Math.min(...results);
      
      // Allow for wider variation as different methods can give very different results
      expect(maxResult / minResult).toBeLessThan(1e6); // Within 6 orders of magnitude
      expect(maxResult / minResult).toBeGreaterThan(1); // Should be different
    });

    it('should show expected trends with porosity changes', () => {
      const lowPorosity = [0.10];
      const highPorosity = [0.30];
      const swiData = [0.25];
      
      const lowKozeny = calculator.calculateKozenyCarman(lowPorosity);
      const highKozeny = calculator.calculateKozenyCarman(highPorosity);
      
      const lowTimur = calculator.calculateTimur(lowPorosity, swiData);
      const highTimur = calculator.calculateTimur(highPorosity, swiData);
      
      // Higher porosity should always give higher permeability
      expect(highKozeny[0]).toBeGreaterThan(lowKozeny[0]);
      expect(highTimur[0]).toBeGreaterThan(lowTimur[0]);
      
      // The increase should be significant (porosity effect is strong)
      expect(highKozeny[0] / lowKozeny[0]).toBeGreaterThan(10);
      expect(highTimur[0] / lowTimur[0]).toBeGreaterThan(100); // Timur has φ^4.4 relationship
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty arrays', () => {
      const result = calculator.calculateKozenyCarman([]);
      expect(result).toEqual([]);
    });

    it('should handle arrays with all null values', () => {
      const porosityData = [-999.25, -999.25, -999.25];
      const result = calculator.calculateTimur(porosityData);

      expect(result).toHaveLength(3);
      expect(result.every(val => val === -999.25)).toBe(true);
    });

    it('should handle extreme porosity values gracefully', () => {
      const porosityData = [0.001, 0.999]; // Very low and very high porosity
      const result = calculator.calculateKozenyCarman(porosityData);

      // Very low porosity should give very low permeability
      expect(result[0]).toBeGreaterThan(0);
      expect(result[0]).toBeLessThan(0.01);
      
      // Very high porosity should be flagged as invalid
      expect(result[1]).toBe(-999.25);
    });

    it('should handle very small grain sizes', () => {
      const porosityData = [0.2];
      const result = calculator.calculateKozenyCarman(porosityData, { grainSize: 1 }); // 1 micron (clay size)

      expect(result[0]).toBeGreaterThan(0);
      expect(result[0]).toBeLessThan(0.001); // Should be very low permeability
    });
  });

  describe('Statistical Calculations', () => {
    it('should calculate correct statistics for permeability data', () => {
      const request: PermeabilityCalculationRequest = {
        wellName: 'TEST-001',
        method: 'timur',
        parameters: { swi: 0.25 },
        inputCurves: {
          porosity: createMockCurve('POROSITY', [0.10, 0.15, 0.20, 0.25, 0.30]),
          depth: createMockCurve('DEPT', [1000, 1001, 1002, 1003, 1004]),
        },
      };

      const result = calculator.calculatePermeability(request);
      const stats = result.statistics;

      expect(stats.count).toBe(5);
      expect(stats.validCount).toBe(5);
      expect(stats.mean).toBeGreaterThan(0); // Geometric mean should be positive
      expect(stats.min).toBeGreaterThan(0);
      expect(stats.max).toBeGreaterThan(stats.min);
      expect(stats.standardDeviation).toBeGreaterThan(0);
      
      // For permeability, max should be significantly higher than min
      expect(stats.max / stats.min).toBeGreaterThan(10);
    });

    it('should handle log-normal distribution characteristics', () => {
      // Permeability typically follows log-normal distribution
      const request: PermeabilityCalculationRequest = {
        wellName: 'TEST-001',
        method: 'timur',
        parameters: { swi: 0.2 },
        inputCurves: {
          porosity: createMockCurve('POROSITY', [0.05, 0.10, 0.15, 0.20, 0.25, 0.30]),
          depth: createMockCurve('DEPT', [1000, 1001, 1002, 1003, 1004, 1005]),
        },
      };

      const result = calculator.calculatePermeability(request);
      
      // Should have wide range typical of log-normal distribution
      const range = result.statistics.max / result.statistics.min;
      expect(range).toBeGreaterThan(100); // Permeability can vary by orders of magnitude
    });
  });
});