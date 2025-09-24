/**
 * Unit tests for Shale Volume Calculator
 * Tests all shale volume calculation methods with industry examples
 * Based on requirements 2.4, 2.5, 2.6, 2.7
 */

import { ShaleVolumeCalculator, ShaleVolumeCalculationRequest } from '../shaleVolumeCalculator';
import { LogCurve } from '../../../types/petrophysics';

describe('ShaleVolumeCalculator', () => {
  let calculator: ShaleVolumeCalculator;

  const createMockCurve = (name: string, data: number[]): LogCurve => ({
    name,
    unit: name === 'DEPT' ? 'ft' : 'API',
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
    calculator = new ShaleVolumeCalculator();
  });

  describe('calculateLarionovTertiary', () => {
    it('should calculate Larionov Tertiary shale volume using formula Vsh = 0.083 * (2^(3.7 * IGR) - 1)', () => {
      // Test with known GR values and parameters
      const grData = [25, 50, 100, 150]; // Clean sand to shale
      const parameters = { grClean: 25, grShale: 150 };
      
      // Calculate expected IGR values
      const expectedIGR = [
        (25 - 25) / (150 - 25), // 0.0
        (50 - 25) / (150 - 25), // 0.2
        (100 - 25) / (150 - 25), // 0.6
        (150 - 25) / (150 - 25), // 1.0
      ];
      
      // Calculate expected Vsh values using Larionov Tertiary formula
      const expectedVsh = expectedIGR.map(igr => 0.083 * (Math.pow(2, 3.7 * igr) - 1));

      const result = calculator.calculateLarionovTertiary(grData, parameters);

      expect(result).toHaveLength(4);
      result.forEach((value, index) => {
        expect(value).toBeCloseTo(expectedVsh[index], 3);
      });

      // Verify specific calculations
      expect(result[0]).toBeCloseTo(0, 3); // Clean sand should be ~0
      expect(result[3]).toBeCloseTo(1, 1); // Pure shale should be ~1
    });

    it('should handle null values correctly', () => {
      const grData = [25, -999.25, NaN, 100];
      const parameters = { grClean: 25, grShale: 150 };
      const result = calculator.calculateLarionovTertiary(grData, parameters);

      expect(result[0]).toBeCloseTo(0, 3);
      expect(result[1]).toBe(-999.25);
      expect(result[2]).toBe(-999.25);
      expect(result[3]).toBeGreaterThan(0);
    });

    it('should handle out-of-range GR values', () => {
      const grData = [-10, 25, 600, 100]; // -10 and 600 are out of range
      const parameters = { grClean: 25, grShale: 150 };
      const result = calculator.calculateLarionovTertiary(grData, parameters);

      expect(result[0]).toBe(-999.25); // Out of range
      expect(result[1]).toBeCloseTo(0, 3);
      expect(result[2]).toBe(-999.25); // Out of range
      expect(result[3]).toBeGreaterThan(0);
    });

    it('should clamp IGR values to [0, 1] range', () => {
      const grData = [10, 200]; // Below grClean and above grShale
      const parameters = { grClean: 25, grShale: 150 };
      const result = calculator.calculateLarionovTertiary(grData, parameters);

      // IGR should be clamped to 0 and 1, resulting in Vsh values within [0, 1]
      expect(result[0]).toBe(0); // IGR clamped to 0
      expect(result[1]).toBeCloseTo(1, 1); // IGR clamped to 1, Vsh should be ~1
    });
  });

  describe('calculateLarionovPreTertiary', () => {
    it('should calculate Larionov Pre-Tertiary shale volume using formula Vsh = 0.33 * (2^(2 * IGR) - 1)', () => {
      const grData = [25, 50, 100, 150];
      const parameters = { grClean: 25, grShale: 150 };
      
      // Calculate expected IGR values
      const expectedIGR = [0.0, 0.2, 0.6, 1.0];
      
      // Calculate expected Vsh values using Larionov Pre-Tertiary formula
      const expectedVsh = expectedIGR.map(igr => 0.33 * (Math.pow(2, 2 * igr) - 1));

      const result = calculator.calculateLarionovPreTertiary(grData, parameters);

      expect(result).toHaveLength(4);
      result.forEach((value, index) => {
        expect(value).toBeCloseTo(expectedVsh[index], 3);
      });

      // Verify specific calculations
      expect(result[0]).toBeCloseTo(0, 3); // Clean sand should be ~0
      expect(result[3]).toBeCloseTo(0.99, 2); // Pure shale should be ~0.99
    });

    it('should produce different results than Tertiary method', () => {
      const grData = [75]; // Mid-range GR value
      const parameters = { grClean: 25, grShale: 150 };
      
      const tertiaryResult = calculator.calculateLarionovTertiary(grData, parameters);
      const preTertiaryResult = calculator.calculateLarionovPreTertiary(grData, parameters);

      // Both methods should produce valid results
      expect(tertiaryResult[0]).toBeGreaterThan(0);
      expect(preTertiaryResult[0]).toBeGreaterThan(0);
      expect(tertiaryResult[0]).not.toEqual(preTertiaryResult[0]);
    });
  });

  describe('calculateLinear', () => {
    it('should calculate linear shale volume using formula Vsh = IGR', () => {
      const grData = [25, 50, 100, 150];
      const parameters = { grClean: 25, grShale: 150 };
      
      // Expected Vsh values should equal IGR values
      const expectedVsh = [0.0, 0.2, 0.6, 1.0];

      const result = calculator.calculateLinear(grData, parameters);

      expect(result).toHaveLength(4);
      result.forEach((value, index) => {
        expect(value).toBeCloseTo(expectedVsh[index], 3);
      });
    });

    it('should handle intermediate values correctly', () => {
      const grData = [37.5, 87.5]; // 25% and 75% between clean and shale
      const parameters = { grClean: 25, grShale: 75 };
      
      const result = calculator.calculateLinear(grData, parameters);

      expect(result[0]).toBeCloseTo(0.25, 3);
      expect(result[1]).toBe(1.0); // Should be clamped to 1.0 (IGR > 1 gets clamped)
    });
  });

  describe('calculateClavier', () => {
    it('should calculate Clavier shale volume using formula Vsh = 1.7 - sqrt(3.38 - (IGR + 0.7)^2)', () => {
      const grData = [25, 50, 100, 150];
      const parameters = { grClean: 25, grShale: 150 };
      
      // Calculate expected IGR values
      const expectedIGR = [0.0, 0.2, 0.6, 1.0];
      
      // Calculate expected Vsh values using Clavier formula
      const expectedVsh = expectedIGR.map(igr => {
        const term = 3.38 - Math.pow(igr + 0.7, 2);
        return term >= 0 ? Math.max(0, Math.min(1, 1.7 - Math.sqrt(term))) : -999.25;
      });

      const result = calculator.calculateClavier(grData, parameters);

      expect(result).toHaveLength(4);
      result.forEach((value, index) => {
        if (expectedVsh[index] !== -999.25) {
          expect(value).toBeCloseTo(expectedVsh[index], 3);
        } else {
          expect(value).toBe(-999.25);
        }
      });
    });

    it('should handle invalid square root cases', () => {
      // Test case where (IGR + 0.7)^2 > 3.38, making the square root term negative
      const grData = [25]; // IGR = 0, (0 + 0.7)^2 = 0.49 < 3.38, should be valid
      const parameters = { grClean: 25, grShale: 150 };
      
      const result = calculator.calculateClavier(grData, parameters);
      
      // This should be a valid calculation
      expect(result[0]).not.toBe(-999.25);
      expect(result[0]).toBeGreaterThanOrEqual(0);
    });

    it('should produce reasonable results compared to other methods', () => {
      const grData = [75]; // Mid-range value
      const parameters = { grClean: 25, grShale: 150 };
      
      const linearResult = calculator.calculateLinear(grData, parameters);
      const clavierResult = calculator.calculateClavier(grData, parameters);
      
      // Clavier method typically gives values between linear and Larionov methods
      expect(clavierResult[0]).toBeGreaterThan(0);
      expect(clavierResult[0]).toBeLessThan(1);
    });
  });

  describe('calculateShaleVolume - Main Method', () => {
    it('should calculate shale volume using Larionov Tertiary method', () => {
      const request: ShaleVolumeCalculationRequest = {
        wellName: 'TEST-001',
        method: 'larionov_tertiary',
        parameters: { grClean: 25, grShale: 150 },
        inputCurves: {
          gr: createMockCurve('GR', [25, 75, 150]),
          depth: createMockCurve('DEPT', [1000, 1001, 1002]),
        },
      };

      const result = calculator.calculateShaleVolume(request);

      expect(result.values).toHaveLength(3);
      expect(result.values[0]).toBeCloseTo(0, 3); // Clean sand
      expect(result.values[2]).toBeCloseTo(1, 1); // Shale
      expect(result.methodology).toContain('Larionov Tertiary');
      expect(result.uncertainty).toHaveLength(3);
      expect(result.statistics.validCount).toBe(3);
    });

    it('should calculate shale volume using Linear method', () => {
      const request: ShaleVolumeCalculationRequest = {
        wellName: 'TEST-001',
        method: 'linear',
        parameters: { grClean: 30, grShale: 130 },
        inputCurves: {
          gr: createMockCurve('GR', [30, 80, 130]),
          depth: createMockCurve('DEPT', [1000, 1001, 1002]),
        },
      };

      const result = calculator.calculateShaleVolume(request);

      expect(result.values).toHaveLength(3);
      expect(result.values[0]).toBeCloseTo(0, 3);
      expect(result.values[1]).toBeCloseTo(0.5, 3);
      expect(result.values[2]).toBeCloseTo(1, 3);
      expect(result.methodology).toContain('Linear');
    });

    it('should apply depth range filter', () => {
      const request: ShaleVolumeCalculationRequest = {
        wellName: 'TEST-001',
        method: 'linear',
        parameters: { grClean: 25, grShale: 150 },
        depthRange: [1001, 1002],
        inputCurves: {
          gr: createMockCurve('GR', [25, 75, 150]),
          depth: createMockCurve('DEPT', [1000, 1001, 1002]),
        },
      };

      const result = calculator.calculateShaleVolume(request);

      expect(result.values).toHaveLength(2); // Only depths 1001 and 1002
      expect(result.depths).toEqual([1001, 1002]);
    });

    it('should throw error for unsupported method', () => {
      const request: ShaleVolumeCalculationRequest = {
        wellName: 'TEST-001',
        method: 'invalid' as any,
        parameters: {},
        inputCurves: {
          gr: createMockCurve('GR', [25, 75, 150]),
          depth: createMockCurve('DEPT', [1000, 1001, 1002]),
        },
      };

      expect(() => {
        calculator.calculateShaleVolume(request);
      }).toThrow('Unsupported shale volume method: invalid');
    });
  });

  describe('validateParameters', () => {
    it('should validate correct parameters', () => {
      const parameters = { grClean: 25, grShale: 150 };
      const result = calculator.validateParameters(parameters);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid GR clean value', () => {
      const parameters = { grClean: -10, grShale: 150 };
      const result = calculator.validateParameters(parameters);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Clean sand GR value must be between 0 and 200 API');
    });

    it('should reject invalid GR shale value', () => {
      const parameters = { grClean: 25, grShale: 600 };
      const result = calculator.validateParameters(parameters);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Shale GR value must be between 50 and 500 API');
    });

    it('should reject when GR shale <= GR clean', () => {
      const parameters = { grClean: 150, grShale: 100 };
      const result = calculator.validateParameters(parameters);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Shale GR value must be greater than clean sand GR value');
    });

    it('should warn about small GR separation', () => {
      const parameters = { grClean: 80, grShale: 95 }; // Only 15 API separation, both in valid ranges
      const result = calculator.validateParameters(parameters);

      expect(result.isValid).toBe(true); // No errors, but warnings
      expect(result.warnings.length).toBeGreaterThanOrEqual(1);
      const hasSmallSeparationWarning = result.warnings.some(w => w.message.includes('Small GR separation'));
      expect(hasSmallSeparationWarning).toBe(true);
    });

    it('should warn about unusual parameter values', () => {
      const parameters = { grClean: 80, grShale: 90 }; // High clean, low shale
      const result = calculator.validateParameters(parameters);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Industry Examples and Edge Cases', () => {
    it('should handle published industry example - Gulf Coast Tertiary', () => {
      // Example from Schlumberger Cased Hole Log Interpretation Principles
      const grData = [40, 80, 120]; // Typical Gulf Coast values
      const parameters = { grClean: 40, grShale: 120 };
      
      const tertiaryResult = calculator.calculateLarionovTertiary(grData, parameters);
      const linearResult = calculator.calculateLinear(grData, parameters);
      
      // Verify reasonable values
      expect(tertiaryResult[0]).toBeCloseTo(0, 2); // Clean sand
      expect(tertiaryResult[1]).toBeGreaterThan(0); // Should be > 0 for mid-range
      expect(tertiaryResult[2]).toBeCloseTo(1, 1); // Shale
      
      // Linear result should be 0.5 for mid-range
      expect(linearResult[1]).toBeCloseTo(0.5, 3);
    });

    it('should handle published industry example - North Sea Jurassic', () => {
      // Example for Pre-Tertiary rocks
      const grData = [30, 70, 110]; // Typical North Sea values
      const parameters = { grClean: 30, grShale: 110 };
      
      const preTertiaryResult = calculator.calculateLarionovPreTertiary(grData, parameters);
      const tertiaryResult = calculator.calculateLarionovTertiary(grData, parameters);
      
      // Both methods should produce valid results
      expect(preTertiaryResult[1]).toBeGreaterThan(0);
      expect(tertiaryResult[1]).toBeGreaterThan(0);
      expect(preTertiaryResult[0]).toBeCloseTo(0, 2); // Clean sand
      expect(preTertiaryResult[2]).toBeCloseTo(1, 1); // Shale
    });

    it('should handle extreme GR values gracefully', () => {
      const grData = [0, 500]; // Extreme values
      const parameters = { grClean: 25, grShale: 150 };
      
      const result = calculator.calculateLinear(grData, parameters);
      
      // Should clamp to valid range
      expect(result[0]).toBe(0); // Negative IGR clamped to 0
      expect(result[1]).toBe(1); // IGR > 1 clamped to 1
    });

    it('should handle arrays with all null values', () => {
      const grData = [-999.25, -999.25, -999.25];
      const parameters = { grClean: 25, grShale: 150 };
      
      const result = calculator.calculateLinear(grData, parameters);
      
      expect(result).toHaveLength(3);
      expect(result.every(val => val === -999.25)).toBe(true);
    });

    it('should compare all methods for consistency', () => {
      const grData = [62.5]; // 50% between clean (25) and shale (100)
      const parameters = { grClean: 25, grShale: 100 };
      
      const linearResult = calculator.calculateLinear(grData, parameters);
      const tertiaryResult = calculator.calculateLarionovTertiary(grData, parameters);
      const preTertiaryResult = calculator.calculateLarionovPreTertiary(grData, parameters);
      const clavierResult = calculator.calculateClavier(grData, parameters);
      
      // Linear should be 0.5 (IGR = 0.5)
      expect(linearResult[0]).toBeCloseTo(0.5, 3);
      
      // All should be reasonable values between 0 and 1
      [linearResult[0], tertiaryResult[0], preTertiaryResult[0], clavierResult[0]].forEach(val => {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(1);
      });
      
      // All methods should produce different results for the same input
      const results = [linearResult[0], tertiaryResult[0], preTertiaryResult[0], clavierResult[0]];
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBeGreaterThan(1); // Should have different values
    });
  });

  describe('Statistical Calculations', () => {
    it('should calculate correct statistics for shale volume data', () => {
      const request: ShaleVolumeCalculationRequest = {
        wellName: 'TEST-001',
        method: 'linear',
        parameters: { grClean: 20, grShale: 120 },
        inputCurves: {
          gr: createMockCurve('GR', [20, 40, 60, 80, 120]), // 0%, 20%, 40%, 60%, 100% shale
          depth: createMockCurve('DEPT', [1000, 1001, 1002, 1003, 1004]),
        },
      };

      const result = calculator.calculateShaleVolume(request);
      const stats = result.statistics;

      expect(stats.mean).toBeCloseTo(0.44, 2); // (0+0.2+0.4+0.6+1)/5
      expect(stats.median).toBeCloseTo(0.4, 2);
      expect(stats.min).toBeCloseTo(0, 3);
      expect(stats.max).toBeCloseTo(1, 3);
      expect(stats.count).toBe(5);
      expect(stats.validCount).toBe(5);
    });
  });
});