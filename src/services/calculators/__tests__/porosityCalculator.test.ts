/**
 * Unit tests for Porosity Calculator
 * Tests all porosity calculation methods with edge cases
 * Based on requirements 2.1, 2.2, 2.3
 */

import { PorosityCalculator, PorosityCalculationRequest } from '../porosityCalculator';
import { LogCurve } from '../../../types/petrophysics';

describe('PorosityCalculator', () => {
  let calculator: PorosityCalculator;

  const createMockCurve = (name: string, data: number[]): LogCurve => ({
    name,
    unit: name === 'DEPT' ? 'ft' : (name === 'RHOB' ? 'g/cc' : '%'),
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
    calculator = new PorosityCalculator();
  });

  describe('calculateDensityPorosity', () => {
    it('should calculate density porosity using standard formula φD = (2.65 - RHOB) / (2.65 - 1.0)', () => {
      const rhobData = [2.0, 2.2, 2.4, 2.6];
      const expected = [
        (2.65 - 2.0) / (2.65 - 1.0), // 0.394
        (2.65 - 2.2) / (2.65 - 1.0), // 0.273
        (2.65 - 2.4) / (2.65 - 1.0), // 0.152
        (2.65 - 2.6) / (2.65 - 1.0), // 0.030
      ];

      const result = calculator.calculateDensityPorosity(rhobData);

      expect(result).toHaveLength(4);
      result.forEach((value, index) => {
        expect(value).toBeCloseTo(expected[index], 3);
      });
    });

    it('should handle null values correctly', () => {
      const rhobData = [2.0, -999.25, NaN, 2.4];
      const result = calculator.calculateDensityPorosity(rhobData);

      expect(result[0]).toBeCloseTo(0.394, 3);
      expect(result[1]).toBe(-999.25);
      expect(result[2]).toBe(-999.25);
      expect(result[3]).toBeCloseTo(0.152, 3);
    });

    it('should handle out-of-range values', () => {
      const rhobData = [0.5, 2.2, 4.5, 2.4]; // 0.5 and 4.5 are out of range
      const result = calculator.calculateDensityPorosity(rhobData);

      expect(result[0]).toBe(-999.25); // Out of range
      expect(result[1]).toBeCloseTo(0.273, 3);
      expect(result[2]).toBe(-999.25); // Out of range
      expect(result[3]).toBeCloseTo(0.152, 3);
    });

    it('should handle negative porosity values', () => {
      const rhobData = [3.0]; // Higher than matrix density
      const result = calculator.calculateDensityPorosity(rhobData);

      expect(result[0]).toBe(-999.25); // Negative porosity should be flagged as null
    });

    it('should use custom matrix and fluid densities', () => {
      const rhobData = [2.5];
      const parameters = { matrixDensity: 2.71, fluidDensity: 0.8 }; // Limestone matrix, oil fluid
      const expected = (2.71 - 2.5) / (2.71 - 0.8); // 0.110

      const result = calculator.calculateDensityPorosity(rhobData, parameters);

      expect(result[0]).toBeCloseTo(expected, 3);
    });
  });

  describe('calculateNeutronPorosity', () => {
    it('should calculate neutron porosity using formula φN = NPHI / 100', () => {
      const nphiData = [10, 15, 20, 25, 30];
      const expected = [0.10, 0.15, 0.20, 0.25, 0.30];

      const result = calculator.calculateNeutronPorosity(nphiData);

      expect(result).toHaveLength(5);
      result.forEach((value, index) => {
        expect(value).toBeCloseTo(expected[index], 3);
      });
    });

    it('should handle null values correctly', () => {
      const nphiData = [15, -999.25, NaN, 25];
      const result = calculator.calculateNeutronPorosity(nphiData);

      expect(result[0]).toBeCloseTo(0.15, 3);
      expect(result[1]).toBe(-999.25);
      expect(result[2]).toBe(-999.25);
      expect(result[3]).toBeCloseTo(0.25, 3);
    });

    it('should handle out-of-range values', () => {
      const nphiData = [-5, 15, 150, 25]; // -5 and 150 are out of range
      const result = calculator.calculateNeutronPorosity(nphiData);

      expect(result[0]).toBe(-999.25); // Out of range
      expect(result[1]).toBeCloseTo(0.15, 3);
      expect(result[2]).toBe(-999.25); // Out of range
      expect(result[3]).toBeCloseTo(0.25, 3);
    });

    it('should handle boundary values', () => {
      const nphiData = [0, 100];
      const result = calculator.calculateNeutronPorosity(nphiData);

      expect(result[0]).toBe(0);
      expect(result[1]).toBe(1);
    });
  });

  describe('calculateEffectivePorosity', () => {
    it('should calculate effective porosity as average of density and neutron porosity', () => {
      const densityPorosity = [0.20, 0.15, 0.25, 0.10];
      const neutronPorosity = [0.18, 0.17, 0.23, 0.12];
      const expected = [0.19, 0.16, 0.24, 0.11];

      const result = calculator.calculateEffectivePorosity(densityPorosity, neutronPorosity);

      expect(result).toHaveLength(4);
      result.forEach((value, index) => {
        expect(value).toBeCloseTo(expected[index], 3);
      });
    });

    it('should handle null values in either input', () => {
      const densityPorosity = [0.20, -999.25, 0.25, 0.10];
      const neutronPorosity = [0.18, 0.17, -999.25, 0.12];
      const result = calculator.calculateEffectivePorosity(densityPorosity, neutronPorosity);

      expect(result[0]).toBeCloseTo(0.19, 3);
      expect(result[1]).toBe(-999.25); // Null in density
      expect(result[2]).toBe(-999.25); // Null in neutron
      expect(result[3]).toBeCloseTo(0.11, 3);
    });

    it('should throw error for mismatched array lengths', () => {
      const densityPorosity = [0.20, 0.15];
      const neutronPorosity = [0.18, 0.17, 0.23];

      expect(() => {
        calculator.calculateEffectivePorosity(densityPorosity, neutronPorosity);
      }).toThrow('Density and neutron porosity arrays must have the same length');
    });

    it('should handle out-of-range effective porosity values', () => {
      const densityPorosity = [1.5, 0.15]; // 1.5 is > 1
      const neutronPorosity = [0.8, 0.17];
      const result = calculator.calculateEffectivePorosity(densityPorosity, neutronPorosity);

      expect(result[0]).toBe(-999.25); // Average > 1
      expect(result[1]).toBeCloseTo(0.16, 3);
    });
  });

  describe('calculatePorosity - Main Method', () => {

    it('should calculate density porosity method', () => {
      const request: PorosityCalculationRequest = {
        wellName: 'TEST-001',
        method: 'density',
        parameters: {},
        inputCurves: {
          rhob: createMockCurve('RHOB', [2.0, 2.2, 2.4]),
          depth: createMockCurve('DEPT', [1000, 1001, 1002]),
        },
      };

      const result = calculator.calculatePorosity(request);

      expect(result.values).toHaveLength(3);
      expect(result.values[0]).toBeCloseTo(0.394, 3);
      expect(result.values[1]).toBeCloseTo(0.273, 3);
      expect(result.values[2]).toBeCloseTo(0.152, 3);
      expect(result.methodology).toContain('Density Porosity');
      expect(result.uncertainty).toHaveLength(3);
      expect(result.statistics.validCount).toBe(3);
    });

    it('should calculate neutron porosity method', () => {
      const request: PorosityCalculationRequest = {
        wellName: 'TEST-001',
        method: 'neutron',
        parameters: {},
        inputCurves: {
          nphi: createMockCurve('NPHI', [15, 20, 25]),
          depth: createMockCurve('DEPT', [1000, 1001, 1002]),
        },
      };

      const result = calculator.calculatePorosity(request);

      expect(result.values).toHaveLength(3);
      expect(result.values[0]).toBeCloseTo(0.15, 3);
      expect(result.values[1]).toBeCloseTo(0.20, 3);
      expect(result.values[2]).toBeCloseTo(0.25, 3);
      expect(result.methodology).toContain('Neutron Porosity');
    });

    it('should calculate effective porosity method', () => {
      const request: PorosityCalculationRequest = {
        wellName: 'TEST-001',
        method: 'effective',
        parameters: {},
        inputCurves: {
          rhob: createMockCurve('RHOB', [2.0, 2.2]),
          nphi: createMockCurve('NPHI', [18, 17]),
          depth: createMockCurve('DEPT', [1000, 1001]),
        },
      };

      const result = calculator.calculatePorosity(request);

      expect(result.values).toHaveLength(2);
      // Effective = (density + neutron) / 2
      // First point: ((2.65-2.0)/(2.65-1.0) + 0.18) / 2 = (0.394 + 0.18) / 2 = 0.287
      expect(result.values[0]).toBeCloseTo(0.287, 3);
      expect(result.methodology).toContain('Effective Porosity');
    });

    it('should apply depth range filter', () => {
      const request: PorosityCalculationRequest = {
        wellName: 'TEST-001',
        method: 'neutron',
        parameters: {},
        depthRange: [1001, 1002],
        inputCurves: {
          nphi: createMockCurve('NPHI', [15, 20, 25]),
          depth: createMockCurve('DEPT', [1000, 1001, 1002]),
        },
      };

      const result = calculator.calculatePorosity(request);

      expect(result.values).toHaveLength(2); // Only depths 1001 and 1002
      expect(result.depths).toEqual([1001, 1002]);
      expect(result.values[0]).toBeCloseTo(0.20, 3);
      expect(result.values[1]).toBeCloseTo(0.25, 3);
    });

    it('should throw error for missing required curves', () => {
      const request: PorosityCalculationRequest = {
        wellName: 'TEST-001',
        method: 'density',
        parameters: {},
        inputCurves: {
          depth: createMockCurve('DEPT', [1000, 1001, 1002]),
          // Missing RHOB curve
        },
      };

      expect(() => {
        calculator.calculatePorosity(request);
      }).toThrow('RHOB curve is required for density porosity calculation');
    });

    it('should throw error for unsupported method', () => {
      const request: PorosityCalculationRequest = {
        wellName: 'TEST-001',
        method: 'invalid' as any,
        parameters: {},
        inputCurves: {
          depth: createMockCurve('DEPT', [1000, 1001, 1002]),
        },
      };

      expect(() => {
        calculator.calculatePorosity(request);
      }).toThrow('Unsupported porosity method: invalid');
    });
  });

  describe('validateParameters', () => {
    it('should validate correct parameters', () => {
      const parameters = { matrixDensity: 2.65, fluidDensity: 1.0 };
      const result = calculator.validateParameters(parameters);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid matrix density', () => {
      const parameters = { matrixDensity: -1, fluidDensity: 1.0 };
      const result = calculator.validateParameters(parameters);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Matrix density must be between 0 and 5 g/cc');
    });

    it('should reject invalid fluid density', () => {
      const parameters = { matrixDensity: 2.65, fluidDensity: 3.0 };
      const result = calculator.validateParameters(parameters);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Fluid density must be between 0 and 2 g/cc');
    });

    it('should warn about unusual parameter values', () => {
      const parameters = { matrixDensity: 1.5, fluidDensity: 1.0 }; // Low matrix density
      const result = calculator.validateParameters(parameters);

      expect(result.isValid).toBe(true); // No errors, but warnings
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toContain('Matrix density outside typical range');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty arrays', () => {
      const result = calculator.calculateDensityPorosity([]);
      expect(result).toEqual([]);
    });

    it('should handle arrays with all null values', () => {
      const rhobData = [-999.25, -999.25, -999.25];
      const result = calculator.calculateDensityPorosity(rhobData);

      expect(result).toHaveLength(3);
      expect(result.every(val => val === -999.25)).toBe(true);
    });

    it('should handle very small porosity values', () => {
      const rhobData = [2.64]; // Very close to matrix density
      const result = calculator.calculateDensityPorosity(rhobData);

      expect(result[0]).toBeCloseTo(0.006, 3); // Very small but valid porosity
    });

    it('should handle gas effect (neutron-density separation)', () => {
      // Gas effect: neutron reads low, density reads low (high porosity)
      const densityPorosity = [0.30]; // High density porosity (low bulk density)
      const neutronPorosity = [0.10]; // Low neutron porosity (gas effect)
      
      const result = calculator.calculateEffectivePorosity(densityPorosity, neutronPorosity);
      
      expect(result[0]).toBeCloseTo(0.20, 3); // Average of the two
    });
  });

  describe('Statistical Calculations', () => {
    it('should calculate correct statistics for valid data', () => {
      const request: PorosityCalculationRequest = {
        wellName: 'TEST-001',
        method: 'neutron',
        parameters: {},
        inputCurves: {
          nphi: createMockCurve('NPHI', [10, 15, 20, 25, 30]),
          depth: createMockCurve('DEPT', [1000, 1001, 1002, 1003, 1004]),
        },
      };

      const result = calculator.calculatePorosity(request);
      const stats = result.statistics;

      expect(stats.mean).toBeCloseTo(0.20, 3); // (0.1+0.15+0.2+0.25+0.3)/5
      expect(stats.median).toBeCloseTo(0.20, 3);
      expect(stats.min).toBeCloseTo(0.10, 3);
      expect(stats.max).toBeCloseTo(0.30, 3);
      expect(stats.count).toBe(5);
      expect(stats.validCount).toBe(5);
    });

    it('should handle statistics with null values', () => {
      const request: PorosityCalculationRequest = {
        wellName: 'TEST-001',
        method: 'neutron',
        parameters: {},
        inputCurves: {
          nphi: createMockCurve('NPHI', [10, -999.25, 20, -999.25, 30]),
          depth: createMockCurve('DEPT', [1000, 1001, 1002, 1003, 1004]),
        },
      };

      const result = calculator.calculatePorosity(request);
      const stats = result.statistics;

      expect(stats.mean).toBeCloseTo(0.20, 3); // (0.1+0.2+0.3)/3
      expect(stats.count).toBe(5);
      expect(stats.validCount).toBe(3);
    });
  });
});