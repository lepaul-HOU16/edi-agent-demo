/**
 * Unit tests for Uncertainty Analysis Calculator
 * Tests porosity, saturation, and permeability uncertainty calculations
 */

import {
  UncertaintyAnalysisCalculator,
  UncertaintyParameters,
  UncertaintyResult,
  ConfidenceInterval,
  MonteCarloParameters
} from '../uncertaintyAnalysisCalculator';

describe('UncertaintyAnalysisCalculator', () => {
  let calculator: UncertaintyAnalysisCalculator;

  beforeEach(() => {
    calculator = new UncertaintyAnalysisCalculator();
  });

  describe('calculatePorosityUncertainty', () => {
    it('should calculate density porosity uncertainty correctly', () => {
      const densityPorosity = [0.15, 0.20, 0.12];
      const neutronPorosity = [0.18, 0.22, 0.10];

      const results = calculator.calculatePorosityUncertainty(
        densityPorosity,
        neutronPorosity,
        'density'
      );

      expect(results).toHaveLength(3);
      expect(results[0].value).toBe(0.15);
      expect(results[0].uncertainty).toBeCloseTo(0.003, 4); // 2% of 0.15
      expect(results[0].uncertaintyPercent).toBeCloseTo(2.0, 1);
      expect(results[0].method).toBe('density');
    });

    it('should calculate neutron porosity uncertainty correctly', () => {
      const densityPorosity = [0.15, 0.20, 0.12];
      const neutronPorosity = [0.18, 0.22, 0.10];

      const results = calculator.calculatePorosityUncertainty(
        densityPorosity,
        neutronPorosity,
        'neutron'
      );

      expect(results[0].value).toBe(0.18);
      expect(results[0].uncertainty).toBeCloseTo(0.0054, 4); // 3% of 0.18
      expect(results[0].uncertaintyPercent).toBeCloseTo(3.0, 1);
      expect(results[0].method).toBe('neutron');
    });

    it('should calculate effective porosity uncertainty correctly', () => {
      const densityPorosity = [0.15, 0.20];
      const neutronPorosity = [0.18, 0.22];

      const results = calculator.calculatePorosityUncertainty(
        densityPorosity,
        neutronPorosity,
        'effective'
      );

      // Effective porosity = (0.15 + 0.18) / 2 = 0.165
      expect(results[0].value).toBeCloseTo(0.165, 3);
      
      // Error propagation: sqrt((0.003^2 + 0.0054^2) / 4) ≈ 0.00309
      expect(results[0].uncertainty).toBeCloseTo(0.00309, 4);
      expect(results[0].method).toBe('effective');
    });

    it('should calculate combined porosity uncertainty correctly', () => {
      const densityPorosity = [0.15];
      const neutronPorosity = [0.18];

      const results = calculator.calculatePorosityUncertainty(
        densityPorosity,
        neutronPorosity,
        'combined'
      );

      // Weighted average based on inverse variance
      // wD = 1/(0.02^2) = 2500, wN = 1/(0.03^2) = 1111.11
      // value = (2500*0.15 + 1111.11*0.18) / (2500 + 1111.11) ≈ 0.159
      expect(results[0].value).toBeCloseTo(0.159, 3);
      expect(results[0].method).toBe('combined');
    });

    it('should handle invalid data gracefully', () => {
      const densityPorosity = [0.15, NaN, -0.05];
      const neutronPorosity = [0.18, 0.22, 0.10];

      const results = calculator.calculatePorosityUncertainty(
        densityPorosity,
        neutronPorosity,
        'effective'
      );

      expect(results).toHaveLength(3);
      expect(results[0].value).toBeCloseTo(0.165, 3);
      expect(isNaN(results[1].value)).toBe(true);
      expect(isNaN(results[2].value)).toBe(true);
    });

    it('should use custom uncertainty parameters', () => {
      const densityPorosity = [0.20];
      const neutronPorosity = [0.22];
      const customParams: Partial<UncertaintyParameters> = {
        densityPorosityUncertainty: 0.05, // 5% instead of default 2%
        neutronPorosityUncertainty: 0.07  // 7% instead of default 3%
      };

      const results = calculator.calculatePorosityUncertainty(
        densityPorosity,
        neutronPorosity,
        'density',
        customParams
      );

      expect(results[0].uncertainty).toBeCloseTo(0.01, 3); // 5% of 0.20
      expect(results[0].uncertaintyPercent).toBeCloseTo(5.0, 1);
    });

    it('should calculate confidence intervals correctly', () => {
      const densityPorosity = [0.15];
      const neutronPorosity = [0.18];
      const customParams: Partial<UncertaintyParameters> = {
        confidenceLevel: 0.95 // 95% confidence instead of default 68%
      };

      const results = calculator.calculatePorosityUncertainty(
        densityPorosity,
        neutronPorosity,
        'density',
        customParams
      );

      expect(results[0].confidenceLevel).toBe(0.95);
      // 95% confidence uses z-score ≈ 1.96
      const expectedMargin = results[0].uncertainty * 1.96;
      expect(results[0].upperBound - results[0].value).toBeCloseTo(expectedMargin, 4);
      expect(results[0].value - results[0].lowerBound).toBeCloseTo(expectedMargin, 4);
    });
  });

  describe('calculateSaturationUncertainty', () => {
    it('should calculate Archie saturation uncertainty correctly', () => {
      const saturation = [0.3, 0.5, 0.8];

      const results = calculator.calculateSaturationUncertainty(saturation, 'archie');

      expect(results).toHaveLength(3);
      expect(results[0].value).toBe(0.3);
      expect(results[0].uncertainty).toBeCloseTo(0.045, 4); // 15% of 0.3
      expect(results[0].uncertaintyPercent).toBeCloseTo(15.0, 1);
      expect(results[0].method).toBe('archie');
    });

    it('should calculate advanced method saturation uncertainty correctly', () => {
      const saturation = [0.4, 0.6];

      const results = calculator.calculateSaturationUncertainty(saturation, 'waxman_smits');

      expect(results[0].value).toBe(0.4);
      expect(results[0].uncertainty).toBeCloseTo(0.04, 4); // 10% of 0.4
      expect(results[0].uncertaintyPercent).toBeCloseTo(10.0, 1);
      expect(results[0].method).toBe('waxman_smits');
    });

    it('should handle saturation bounds correctly', () => {
      const saturation = [0.05, 0.95]; // Near boundaries

      const results = calculator.calculateSaturationUncertainty(saturation, 'archie');

      // Lower bound should not go below 0
      expect(results[0].lowerBound).toBeGreaterThanOrEqual(0);
      
      // Upper bound should not go above 1
      expect(results[1].upperBound).toBeLessThanOrEqual(1);
    });

    it('should handle invalid saturation values', () => {
      const saturation = [0.5, NaN, -0.1, 1.5];

      const results = calculator.calculateSaturationUncertainty(saturation, 'archie');

      expect(results).toHaveLength(4);
      expect(results[0].value).toBe(0.5);
      expect(isNaN(results[1].value)).toBe(true);
      expect(isNaN(results[2].value)).toBe(true);
      expect(isNaN(results[3].value)).toBe(true);
    });

    it('should use custom uncertainty parameters', () => {
      const saturation = [0.6];
      const customParams: Partial<UncertaintyParameters> = {
        archieUncertainty: 0.20 // 20% instead of default 15%
      };

      const results = calculator.calculateSaturationUncertainty(
        saturation,
        'archie',
        customParams
      );

      expect(results[0].uncertainty).toBeCloseTo(0.12, 3); // 20% of 0.6
      expect(results[0].uncertaintyPercent).toBeCloseTo(20.0, 1);
    });
  });

  describe('calculatePermeabilityUncertainty', () => {
    it('should calculate correlation permeability uncertainty correctly', () => {
      const permeability = [10, 100, 1000]; // mD

      const results = calculator.calculatePermeabilityUncertainty(permeability, 'correlation');

      expect(results).toHaveLength(3);
      expect(results[0].value).toBe(10);
      expect(results[0].uncertaintyPercent).toBeCloseTo(50.0, 1);
      expect(results[0].method).toBe('correlation');
      
      // Check log-normal distribution properties
      expect(results[0].lowerBound).toBeGreaterThan(0);
      expect(results[0].upperBound).toBeGreaterThan(results[0].value);
    });

    it('should calculate core data permeability uncertainty correctly', () => {
      const permeability = [50, 200];

      const results = calculator.calculatePermeabilityUncertainty(permeability, 'core_data');

      expect(results[0].value).toBe(50);
      expect(results[0].uncertaintyPercent).toBeCloseTo(20.0, 1);
      expect(results[0].method).toBe('core_data');
    });

    it('should handle log-normal distribution correctly', () => {
      const permeability = [100];

      const results = calculator.calculatePermeabilityUncertainty(permeability, 'correlation');

      // For log-normal distribution, the bounds should be asymmetric
      const lowerRatio = results[0].value / results[0].lowerBound;
      const upperRatio = results[0].upperBound / results[0].value;
      
      // These ratios should be approximately equal for log-normal distribution
      expect(lowerRatio).toBeCloseTo(upperRatio, 1);
    });

    it('should handle invalid permeability values', () => {
      const permeability = [100, NaN, 0, -10];

      const results = calculator.calculatePermeabilityUncertainty(permeability, 'correlation');

      expect(results).toHaveLength(4);
      expect(results[0].value).toBe(100);
      expect(isNaN(results[1].value)).toBe(true);
      expect(isNaN(results[2].value)).toBe(true);
      expect(isNaN(results[3].value)).toBe(true);
    });

    it('should use custom uncertainty parameters', () => {
      const permeability = [100];
      const customParams: Partial<UncertaintyParameters> = {
        correlationUncertainty: 0.30 // 30% instead of default 50%
      };

      const results = calculator.calculatePermeabilityUncertainty(
        permeability,
        'correlation',
        customParams
      );

      expect(results[0].uncertaintyPercent).toBeCloseTo(30.0, 1);
    });
  });

  describe('propagateUncertainty', () => {
    it('should propagate uncertainty for addition correctly', () => {
      const values = [10, 20];
      const uncertainties = [1, 2];

      const results = calculator.propagateUncertainty(values, uncertainties, 'add', 5);

      expect(results[0].value).toBe(15); // 10 + 5
      expect(results[0].uncertainty).toBe(1); // Unchanged for addition
      expect(results[1].value).toBe(25); // 20 + 5
      expect(results[1].uncertainty).toBe(2); // Unchanged for addition
    });

    it('should propagate uncertainty for multiplication correctly', () => {
      const values = [10, 20];
      const uncertainties = [1, 2]; // 10% and 10% relative uncertainty

      const results = calculator.propagateUncertainty(values, uncertainties, 'multiply', 2);

      expect(results[0].value).toBe(20); // 10 * 2
      expect(results[0].uncertainty).toBe(2); // Relative uncertainty preserved: 10% of 20
      expect(results[1].value).toBe(40); // 20 * 2
      expect(results[1].uncertainty).toBe(4); // Relative uncertainty preserved: 10% of 40
    });

    it('should propagate uncertainty for power operations correctly', () => {
      const values = [10];
      const uncertainties = [1]; // 10% relative uncertainty

      const results = calculator.propagateUncertainty(values, uncertainties, 'power', 2);

      expect(results[0].value).toBe(100); // 10^2
      // For power: σ_new = |n * x^n| * (σ/|x|) = |2 * 100| * (1/10) = 20
      expect(results[0].uncertainty).toBe(20);
    });

    it('should propagate uncertainty for logarithm correctly', () => {
      const values = [10];
      const uncertainties = [1];

      const results = calculator.propagateUncertainty(values, uncertainties, 'log');

      expect(results[0].value).toBeCloseTo(Math.log(10), 4);
      expect(results[0].uncertainty).toBeCloseTo(0.1, 4); // σ/x = 1/10
    });

    it('should handle division by zero', () => {
      const values = [10];
      const uncertainties = [1];

      const results = calculator.propagateUncertainty(values, uncertainties, 'divide', 0);

      expect(isNaN(results[0].value)).toBe(true);
      expect(isNaN(results[0].uncertainty)).toBe(true);
    });

    it('should handle logarithm of negative values', () => {
      const values = [-10];
      const uncertainties = [1];

      const results = calculator.propagateUncertainty(values, uncertainties, 'log');

      expect(isNaN(results[0].value)).toBe(true);
      expect(isNaN(results[0].uncertainty)).toBe(true);
    });

    it('should throw error for mismatched array lengths', () => {
      const values = [10, 20];
      const uncertainties = [1];

      expect(() => {
        calculator.propagateUncertainty(values, uncertainties, 'add');
      }).toThrow('Values and uncertainties arrays must have the same length');
    });
  });

  describe('performMonteCarloAnalysis', () => {
    it('should perform basic Monte Carlo analysis', () => {
      const inputValues = {
        porosity: [0.15, 0.20],
        saturation: [0.3, 0.4]
      };
      const uncertainties = {
        porosity: [0.01, 0.02],
        saturation: [0.03, 0.04]
      };

      // Simple calculation: porosity * (1 - saturation)
      const calculationFunction = (inputs: { [key: string]: number }) => {
        return inputs.porosity * (1 - inputs.saturation);
      };

      const mcParams: Partial<MonteCarloParameters> = {
        iterations: 1000,
        seed: 12345 // For reproducible results
      };

      const results = calculator.performMonteCarloAnalysis(
        inputValues,
        uncertainties,
        calculationFunction,
        mcParams
      );

      expect(results.length).toBeGreaterThan(0);
      
      // Check that we get reasonable confidence intervals
      const result68 = results.find(r => r.level === 0.68);
      expect(result68).toBeDefined();
      expect(result68!.lowerBound).toBeLessThan(result68!.upperBound);
      expect(result68!.mean).toBeGreaterThan(result68!.lowerBound);
      expect(result68!.mean).toBeLessThan(result68!.upperBound);
    });

    it('should handle NaN inputs in Monte Carlo analysis', () => {
      const inputValues = {
        porosity: [NaN, 0.20],
        saturation: [0.3, 0.4]
      };
      const uncertainties = {
        porosity: [0.01, 0.02],
        saturation: [0.03, 0.04]
      };

      const calculationFunction = (inputs: { [key: string]: number }) => {
        return inputs.porosity * (1 - inputs.saturation);
      };

      const results = calculator.performMonteCarloAnalysis(
        inputValues,
        uncertainties,
        calculationFunction,
        { iterations: 100 }
      );

      expect(results.length).toBeGreaterThan(0);
      // First result should be NaN due to NaN input
      expect(isNaN(results[0].mean)).toBe(true);
    });
  });

  describe('validateInputs', () => {
    it('should validate correct inputs', () => {
      const values = [0.15, 0.20, 0.12];
      const uncertainties = [0.01, 0.02, 0.015];

      const result = calculator.validateInputs(values, uncertainties);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect empty values array', () => {
      const values: number[] = [];

      const result = calculator.validateInputs(values);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('cannot be empty');
    });

    it('should detect mismatched array lengths', () => {
      const values = [0.15, 0.20];
      const uncertainties = [0.01, 0.02, 0.015];

      const result = calculator.validateInputs(values, uncertainties);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('same length');
    });

    it('should detect negative uncertainties', () => {
      const values = [0.15, 0.20];
      const uncertainties = [0.01, -0.02];

      const result = calculator.validateInputs(values, uncertainties);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('cannot be negative');
    });

    it('should validate parameter ranges', () => {
      const values = [0.15, 0.20];
      const parameters: Partial<UncertaintyParameters> = {
        densityPorosityUncertainty: 1.5, // Invalid: > 1
        confidenceLevel: 0.3 // Invalid: < 0.5
      };

      const result = calculator.validateInputs(values, undefined, parameters);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBe(2);
      expect(result.errors.some(e => e.message.includes('densityPorosityUncertainty'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('confidenceLevel'))).toBe(true);
    });

    it('should warn about low data completeness', () => {
      const values = [0.15, NaN, NaN, NaN, 0.20]; // 40% completeness (below 50% threshold)

      const result = calculator.validateInputs(values);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].message).toContain('Low data completeness');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle zero values correctly', () => {
      const values = [0, 0.15];
      const uncertainties = [0.01, 0.02];

      const results = calculator.propagateUncertainty(values, uncertainties, 'multiply', 2);

      expect(results[0].value).toBe(0);
      expect(results[0].uncertainty).toBe(0);
      expect(results[0].uncertaintyPercent).toBe(0);
    });

    it('should handle very small values correctly', () => {
      const permeability = [0.1, 1.0]; // Low permeability values

      const results = calculator.calculatePermeabilityUncertainty(permeability, 'correlation');

      expect(results[0].value).toBe(0.1);
      expect(results[0].lowerBound).toBeGreaterThan(0);
      expect(results[0].upperBound).toBeGreaterThan(results[0].value);
    });

    it('should handle very large values correctly', () => {
      const permeability = [10000, 100000]; // Very high permeability

      const results = calculator.calculatePermeabilityUncertainty(permeability, 'correlation');

      expect(results[0].value).toBe(10000);
      expect(results[0].lowerBound).toBeGreaterThan(0);
      expect(results[0].upperBound).toBeGreaterThan(results[0].value);
      expect(isFinite(results[0].upperBound)).toBe(true);
    });

    it('should throw error for unknown methods', () => {
      const values = [0.15];
      const uncertainties = [0.01];

      expect(() => {
        calculator.propagateUncertainty(values, uncertainties, 'unknown' as any);
      }).toThrow('Unknown operation: unknown');
    });
  });
});