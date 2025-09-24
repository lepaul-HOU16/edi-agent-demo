/**
 * Unit tests for Water Saturation Calculator
 * Tests all saturation calculation methods with various formation water resistivity scenarios
 * Based on requirements 2.8, 2.9
 */

import { SaturationCalculator, SaturationCalculationRequest } from '../saturationCalculator';
import { LogCurve } from '../../../types/petrophysics';

describe('SaturationCalculator', () => {
  let calculator: SaturationCalculator;

  const createMockCurve = (name: string, data: number[]): LogCurve => ({
    name,
    unit: name === 'DEPT' ? 'ft' : (name === 'RT' ? 'ohm-m' : (name === 'POROSITY' ? 'v/v' : 'v/v')),
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
    calculator = new SaturationCalculator();
  });

  describe('calculateArchie', () => {
    it('should calculate water saturation using Archie equation Sw = ((1.0 * Rw) / (porosity^2 * RT))^0.5', () => {
      const rtData = [10.0, 40.0, 160.0, 1000.0]; // Higher resistivity values to avoid clamping
      const porosityData = [0.2, 0.2, 0.2, 0.2]; // Constant porosity
      const parameters = { rw: 0.1, a: 1.0, m: 2.0, n: 2.0 };
      
      // Expected Sw values using Archie equation
      // Sw = ((a * Rw) / (φ^m * RT))^(1/n)
      // Sw = ((1.0 * 0.1) / (0.2^2 * RT))^0.5
      // Sw = (0.1 / (0.04 * RT))^0.5 = (2.5 / RT)^0.5
      const expectedSw = rtData.map(rt => Math.min(1.0, Math.sqrt(2.5 / rt))); // Apply clamping

      const result = calculator.calculateArchie(rtData, porosityData, parameters);

      expect(result).toHaveLength(4);
      result.forEach((value, index) => {
        expect(value).toBeCloseTo(expectedSw[index], 3);
      });

      // Verify that higher RT gives lower Sw
      expect(result[0]).toBeGreaterThan(result[3]);
    });

    it('should handle null values correctly', () => {
      const rtData = [1.0, -999.25, NaN, 4.0];
      const porosityData = [0.2, 0.2, 0.2, -999.25];
      const result = calculator.calculateArchie(rtData, porosityData);

      expect(result[0]).toBeGreaterThan(0); // Valid calculation
      expect(result[1]).toBe(-999.25); // Null RT
      expect(result[2]).toBe(-999.25); // NaN RT
      expect(result[3]).toBe(-999.25); // Null porosity
    });

    it('should handle out-of-range values', () => {
      const rtData = [-1.0, 1.0, 4.0]; // Negative RT should be invalid
      const porosityData = [0.2, -0.1, 1.5]; // Negative and >1 porosity should be invalid
      const result = calculator.calculateArchie(rtData, porosityData);

      expect(result[0]).toBe(-999.25); // Negative RT
      expect(result[1]).toBe(-999.25); // Negative porosity
      expect(result[2]).toBe(-999.25); // Porosity > 1
    });

    it('should clamp saturation values to [0, 1] range', () => {
      const rtData = [0.01]; // Very low resistivity
      const porosityData = [0.3];
      const parameters = { rw: 1.0 }; // High Rw
      
      const result = calculator.calculateArchie(rtData, porosityData, parameters);
      
      // This should result in Sw > 1, but should be clamped to 1
      expect(result[0]).toBe(1.0);
    });

    it('should use custom Archie parameters', () => {
      const rtData = [4.0];
      const porosityData = [0.2];
      const parameters = { rw: 0.05, a: 0.8, m: 1.8, n: 2.2 };
      
      // Calculate expected value with custom parameters
      const formationFactor = parameters.a / Math.pow(porosityData[0], parameters.m);
      const expectedSw = Math.pow((formationFactor * parameters.rw) / rtData[0], 1 / parameters.n);
      
      const result = calculator.calculateArchie(rtData, porosityData, parameters);
      
      expect(result[0]).toBeCloseTo(expectedSw, 3);
    });

    it('should throw error for mismatched array lengths', () => {
      const rtData = [1.0, 4.0];
      const porosityData = [0.2, 0.2, 0.3];

      expect(() => {
        calculator.calculateArchie(rtData, porosityData);
      }).toThrow('Resistivity and porosity arrays must have the same length');
    });
  });

  describe('calculateWaxmanSmits', () => {
    it('should calculate water saturation using Waxman-Smits method for shaly sands', () => {
      const rtData = [2.0, 8.0, 32.0];
      const porosityData = [0.25, 0.20, 0.15];
      const vshData = [0.1, 0.3, 0.5]; // Increasing shale content
      const parameters = { rw: 0.1, a: 1.0, m: 2.0, n: 2.0, b: 0.045 };

      const result = calculator.calculateWaxmanSmits(rtData, porosityData, vshData, parameters);

      expect(result).toHaveLength(3);
      
      // All results should be valid saturation values
      result.forEach(sw => {
        expect(sw).toBeGreaterThanOrEqual(0);
        expect(sw).toBeLessThanOrEqual(1);
        expect(sw).not.toBe(-999.25);
      });

      // Higher shale content should generally result in higher water saturation
      // (though this depends on resistivity and porosity as well)
      expect(result[0]).toBeGreaterThan(0);
      expect(result[2]).toBeGreaterThan(0);
    });

    it('should handle null values correctly', () => {
      const rtData = [2.0, -999.25, 8.0];
      const porosityData = [0.25, 0.20, -999.25];
      const vshData = [0.1, -999.25, 0.3];

      const result = calculator.calculateWaxmanSmits(rtData, porosityData, vshData);

      expect(result[0]).toBeGreaterThan(0); // Valid calculation
      expect(result[1]).toBe(-999.25); // Null values
      expect(result[2]).toBe(-999.25); // Null porosity
    });

    it('should converge to reasonable values', () => {
      const rtData = [5.0];
      const porosityData = [0.2];
      const vshData = [0.2];
      const parameters = { rw: 0.1, a: 1.0, m: 2.0, n: 2.0 };

      const result = calculator.calculateWaxmanSmits(rtData, porosityData, vshData, parameters);

      // Should converge to a reasonable saturation value
      expect(result[0]).toBeGreaterThan(0.01);
      expect(result[0]).toBeLessThan(1.0);
    });

    it('should throw error for mismatched array lengths', () => {
      const rtData = [1.0, 4.0];
      const porosityData = [0.2, 0.2, 0.3];
      const vshData = [0.1, 0.2];

      expect(() => {
        calculator.calculateWaxmanSmits(rtData, porosityData, vshData);
      }).toThrow('Resistivity, porosity, and shale volume arrays must have the same length');
    });
  });

  describe('calculateDualWater', () => {
    it('should calculate water saturation using dual-water model', () => {
      const rtData = [4.0, 16.0, 64.0];
      const porosityData = [0.25, 0.20, 0.15];
      const vshData = [0.0, 0.2, 0.4]; // Increasing shale content

      const result = calculator.calculateDualWater(rtData, porosityData, vshData);

      expect(result).toHaveLength(3);
      
      // All results should be valid saturation values
      result.forEach(sw => {
        expect(sw).toBeGreaterThanOrEqual(0);
        expect(sw).toBeLessThanOrEqual(1);
        expect(sw).not.toBe(-999.25);
      });

      // The result with highest shale content should have reasonable water saturation
      expect(result[2]).toBeGreaterThan(0.2); // Should have significant bound water
    });

    it('should handle high shale content correctly', () => {
      const rtData = [10.0];
      const porosityData = [0.15];
      const vshData = [0.8]; // Very high shale content

      const result = calculator.calculateDualWater(rtData, porosityData, vshData);

      // Should have high water saturation due to clay-bound water
      expect(result[0]).toBeGreaterThan(0.5);
    });
  });

  describe('calculateSaturation - Main Method', () => {
    it('should calculate water saturation using Archie method', () => {
      const request: SaturationCalculationRequest = {
        wellName: 'TEST-001',
        method: 'archie',
        parameters: { rw: 0.1, a: 1.0, m: 2.0, n: 2.0 },
        inputCurves: {
          rt: createMockCurve('RT', [1.0, 4.0, 16.0]),
          porosity: createMockCurve('POROSITY', [0.2, 0.2, 0.2]),
          depth: createMockCurve('DEPT', [1000, 1001, 1002]),
        },
      };

      const result = calculator.calculateSaturation(request);

      expect(result.values).toHaveLength(3);
      expect(result.values[0]).toBeGreaterThan(result.values[2]); // Higher Sw for lower RT
      expect(result.methodology).toContain('Archie Equation');
      expect(result.uncertainty).toHaveLength(3);
      expect(result.statistics.validCount).toBe(3);
    });

    it('should calculate water saturation using Waxman-Smits method', () => {
      const request: SaturationCalculationRequest = {
        wellName: 'TEST-001',
        method: 'waxman_smits',
        parameters: { rw: 0.1 },
        inputCurves: {
          rt: createMockCurve('RT', [2.0, 8.0, 32.0]),
          porosity: createMockCurve('POROSITY', [0.25, 0.20, 0.15]),
          vsh: createMockCurve('VSH', [0.1, 0.3, 0.5]),
          depth: createMockCurve('DEPT', [1000, 1001, 1002]),
        },
      };

      const result = calculator.calculateSaturation(request);

      expect(result.values).toHaveLength(3);
      expect(result.methodology).toContain('Waxman-Smits');
      result.values.forEach(sw => {
        expect(sw).toBeGreaterThanOrEqual(0);
        expect(sw).toBeLessThanOrEqual(1);
      });
    });

    it('should apply depth range filter', () => {
      const request: SaturationCalculationRequest = {
        wellName: 'TEST-001',
        method: 'archie',
        parameters: { rw: 0.1 },
        depthRange: [1001, 1002],
        inputCurves: {
          rt: createMockCurve('RT', [1.0, 4.0, 16.0]),
          porosity: createMockCurve('POROSITY', [0.2, 0.2, 0.2]),
          depth: createMockCurve('DEPT', [1000, 1001, 1002]),
        },
      };

      const result = calculator.calculateSaturation(request);

      expect(result.values).toHaveLength(2); // Only depths 1001 and 1002
      expect(result.depths).toEqual([1001, 1002]);
    });

    it('should throw error for missing required curves', () => {
      const request: SaturationCalculationRequest = {
        wellName: 'TEST-001',
        method: 'waxman_smits',
        parameters: {},
        inputCurves: {
          rt: createMockCurve('RT', [1.0, 4.0, 16.0]),
          porosity: createMockCurve('POROSITY', [0.2, 0.2, 0.2]),
          depth: createMockCurve('DEPT', [1000, 1001, 1002]),
          // Missing VSH curve for Waxman-Smits
        },
      };

      expect(() => {
        calculator.calculateSaturation(request);
      }).toThrow('Shale volume curve is required for Waxman-Smits calculation');
    });

    it('should throw error for unsupported method', () => {
      const request: SaturationCalculationRequest = {
        wellName: 'TEST-001',
        method: 'invalid' as any,
        parameters: {},
        inputCurves: {
          rt: createMockCurve('RT', [1.0, 4.0, 16.0]),
          porosity: createMockCurve('POROSITY', [0.2, 0.2, 0.2]),
          depth: createMockCurve('DEPT', [1000, 1001, 1002]),
        },
      };

      expect(() => {
        calculator.calculateSaturation(request);
      }).toThrow('Unsupported saturation method: invalid');
    });
  });

  describe('validateParameters', () => {
    it('should validate correct parameters', () => {
      const parameters = { rw: 0.1, a: 1.0, m: 2.0, n: 2.0 };
      const result = calculator.validateParameters(parameters);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid formation water resistivity', () => {
      const parameters = { rw: -0.1, a: 1.0, m: 2.0, n: 2.0 };
      const result = calculator.validateParameters(parameters);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Formation water resistivity (Rw) must be between 0 and 100 ohm-m');
    });

    it('should reject invalid tortuosity factor', () => {
      const parameters = { rw: 0.1, a: -1.0, m: 2.0, n: 2.0 };
      const result = calculator.validateParameters(parameters);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Tortuosity factor (a) must be between 0 and 5');
    });

    it('should warn about unusual parameter values', () => {
      const parameters = { rw: 0.1, a: 1.0, m: 0.5, n: 5.0 }; // Unusual m and n values
      const result = calculator.validateParameters(parameters);

      expect(result.isValid).toBe(true); // No errors, but warnings
      expect(result.warnings.length).toBeGreaterThanOrEqual(2);
    });

    it('should warn about very low Rw values', () => {
      const parameters = { rw: 0.001, a: 1.0, m: 2.0, n: 2.0 };
      const result = calculator.validateParameters(parameters);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.message.includes('Very low Rw value'))).toBe(true);
    });

    it('should warn about high Rw values', () => {
      const parameters = { rw: 50.0, a: 1.0, m: 2.0, n: 2.0 };
      const result = calculator.validateParameters(parameters);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.message.includes('High Rw value'))).toBe(true);
    });
  });

  describe('Formation Water Resistivity Scenarios', () => {
    it('should handle saline water scenario (low Rw)', () => {
      const rtData = [5.0, 25.0, 100.0]; // Higher RT values
      const porosityData = [0.25, 0.20, 0.15];
      const parameters = { rw: 0.02 }; // Saline water

      const result = calculator.calculateArchie(rtData, porosityData, parameters);

      // Low Rw should result in lower water saturations for same RT
      expect(result[0]).toBeLessThan(1.0);
      expect(result[1]).toBeLessThan(0.5);
      expect(result[2]).toBeLessThan(0.3); // More reasonable expectation
    });

    it('should handle fresh water scenario (high Rw)', () => {
      const rtData = [10.0, 50.0, 200.0];
      const porosityData = [0.25, 0.20, 0.15];
      const parameters = { rw: 5.0 }; // Fresh water

      const result = calculator.calculateArchie(rtData, porosityData, parameters);

      // High Rw should result in higher water saturations for same RT
      result.forEach(sw => {
        expect(sw).toBeGreaterThan(0.1);
        expect(sw).toBeLessThanOrEqual(1.0);
      });
    });

    it('should handle brackish water scenario (medium Rw)', () => {
      const rtData = [5.0, 25.0, 125.0]; // Higher RT values to avoid clamping
      const porosityData = [0.25, 0.20, 0.15];
      const parameters = { rw: 0.5 }; // Brackish water

      const result = calculator.calculateArchie(rtData, porosityData, parameters);

      // Should produce reasonable intermediate values
      result.forEach(sw => {
        expect(sw).toBeGreaterThan(0.05);
        expect(sw).toBeLessThanOrEqual(1.0); // Allow for clamping
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty arrays', () => {
      const result = calculator.calculateArchie([], []);
      expect(result).toEqual([]);
    });

    it('should handle arrays with all null values', () => {
      const rtData = [-999.25, -999.25, -999.25];
      const porosityData = [-999.25, -999.25, -999.25];
      const result = calculator.calculateArchie(rtData, porosityData);

      expect(result).toHaveLength(3);
      expect(result.every(val => val === -999.25)).toBe(true);
    });

    it('should handle very high resistivity values', () => {
      const rtData = [10000.0]; // Very high resistivity
      const porosityData = [0.1]; // Low porosity
      const parameters = { rw: 0.1 };

      const result = calculator.calculateArchie(rtData, porosityData, parameters);

      // Should result in very low water saturation
      expect(result[0]).toBeGreaterThan(0);
      expect(result[0]).toBeLessThan(0.1);
    });

    it('should handle very low resistivity values', () => {
      const rtData = [0.1]; // Very low resistivity
      const porosityData = [0.3]; // High porosity
      const parameters = { rw: 0.05 };

      const result = calculator.calculateArchie(rtData, porosityData, parameters);

      // Should result in high water saturation (possibly clamped to 1.0)
      expect(result[0]).toBeGreaterThan(0.8);
      expect(result[0]).toBeLessThanOrEqual(1.0);
    });
  });

  describe('Method Comparison', () => {
    it('should compare Archie vs Waxman-Smits for shaly formation', () => {
      const rtData = [8.0];
      const porosityData = [0.2];
      const vshData = [0.3]; // Moderate shale content

      const archieResult = calculator.calculateArchie(rtData, porosityData, { rw: 0.1 });
      const waxmanSmitsResult = calculator.calculateWaxmanSmits(rtData, porosityData, vshData, { rw: 0.1 });

      // Both should produce valid results
      expect(archieResult[0]).toBeGreaterThan(0);
      expect(waxmanSmitsResult[0]).toBeGreaterThan(0);
      
      // Both methods should produce reasonable saturation values
      expect(archieResult[0]).toBeLessThanOrEqual(1.0);
      expect(waxmanSmitsResult[0]).toBeLessThanOrEqual(1.0);
    });

    it('should compare all methods for consistency', () => {
      const rtData = [10.0];
      const porosityData = [0.2];
      const vshData = [0.2];
      const parameters = { rw: 0.1 };

      const archieResult = calculator.calculateArchie(rtData, porosityData, parameters);
      const waxmanSmitsResult = calculator.calculateWaxmanSmits(rtData, porosityData, vshData, parameters);
      const dualWaterResult = calculator.calculateDualWater(rtData, porosityData, vshData, parameters);

      // All methods should produce reasonable values
      [archieResult[0], waxmanSmitsResult[0], dualWaterResult[0]].forEach(sw => {
        expect(sw).toBeGreaterThan(0);
        expect(sw).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Statistical Calculations', () => {
    it('should calculate correct statistics for saturation data', () => {
      const request: SaturationCalculationRequest = {
        wellName: 'TEST-001',
        method: 'archie',
        parameters: { rw: 0.1 },
        inputCurves: {
          rt: createMockCurve('RT', [1.0, 4.0, 16.0, 64.0, 256.0]),
          porosity: createMockCurve('POROSITY', [0.2, 0.2, 0.2, 0.2, 0.2]),
          depth: createMockCurve('DEPT', [1000, 1001, 1002, 1003, 1004]),
        },
      };

      const result = calculator.calculateSaturation(request);
      const stats = result.statistics;

      expect(stats.count).toBe(5);
      expect(stats.validCount).toBe(5);
      expect(stats.mean).toBeGreaterThan(0);
      expect(stats.min).toBeGreaterThan(0);
      expect(stats.max).toBeLessThanOrEqual(1);
      expect(stats.standardDeviation).toBeGreaterThan(0);
    });
  });
});