/**
 * Unit tests for Reservoir Quality Calculator
 * Tests net-to-gross ratio, weighted mean porosity, and completion efficiency calculations
 */

import {
  ReservoirQualityCalculator,
  ReservoirInterval,
  CompletionInterval,
  ReservoirQualityMetrics,
  CompletionEfficiencyMetrics,
  ReservoirQualityCutoffs
} from '../reservoirQualityCalculator';

describe('ReservoirQualityCalculator', () => {
  let calculator: ReservoirQualityCalculator;

  beforeEach(() => {
    calculator = new ReservoirQualityCalculator();
  });

  describe('calculateNetToGross', () => {
    it('should calculate net-to-gross ratio correctly for simple case', () => {
      const depths = [1000, 1010, 1020, 1030, 1040];
      const shaleVolume = [0.2, 0.3, 0.7, 0.8, 0.1]; // First 20ft + last 10ft = 30ft clean sand
      const porosity = [0.15, 0.12, 0.05, 0.04, 0.18];

      const result = calculator.calculateNetToGross(depths, shaleVolume, porosity);

      expect(result.totalThickness).toBe(40);
      expect(result.cleanSandThickness).toBe(30); // First 20ft and last 10ft
      expect(result.netToGrossRatio).toBeCloseTo(0.75, 2);
      expect(result.reservoirIntervals).toHaveLength(2);
    });

    it('should handle 100% reservoir quality rock', () => {
      const depths = [2000, 2010, 2020, 2030];
      const shaleVolume = [0.1, 0.2, 0.3, 0.1]; // All below 0.5 threshold
      const porosity = [0.15, 0.12, 0.10, 0.18]; // All above 0.08 threshold

      const result = calculator.calculateNetToGross(depths, shaleVolume, porosity);

      expect(result.netToGrossRatio).toBe(1.0);
      expect(result.totalThickness).toBe(30);
      expect(result.cleanSandThickness).toBe(30);
      expect(result.reservoirIntervals).toHaveLength(1);
    });

    it('should handle 0% reservoir quality rock', () => {
      const depths = [3000, 3010, 3020, 3030];
      const shaleVolume = [0.8, 0.9, 0.7, 0.8]; // All above 0.5 threshold
      const porosity = [0.05, 0.03, 0.04, 0.02]; // All below 0.08 threshold

      const result = calculator.calculateNetToGross(depths, shaleVolume, porosity);

      expect(result.netToGrossRatio).toBe(0.0);
      expect(result.totalThickness).toBe(30);
      expect(result.cleanSandThickness).toBe(0);
      expect(result.reservoirIntervals).toHaveLength(0);
    });

    it('should calculate weighted mean porosity correctly', () => {
      const depths = [4000, 4010, 4020]; // 20ft total
      const shaleVolume = [0.2, 0.3, 0.1]; // All reservoir quality
      const porosity = [0.15, 0.20, 0.10]; // Weighted average should be 0.15

      const result = calculator.calculateNetToGross(depths, shaleVolume, porosity);

      // Weighted mean = (0.175 * 10 + 0.15 * 10) / 20 = 0.1625
      expect(result.weightedMeanPorosity).toBeCloseTo(0.1625, 3);
    });

    it('should handle custom cutoffs', () => {
      const depths = [5000, 5010, 5020];
      const shaleVolume = [0.1, 0.4, 0.2]; // Second interval meets strict cutoff: avgVsh = 0.3
      const porosity = [0.12, 0.15, 0.10];

      const strictCutoffs: ReservoirQualityCutoffs = {
        vshMax: 0.3,
        porosityMin: 0.10,
        saturationMax: 0.6
      };

      const result = calculator.calculateNetToGross(depths, shaleVolume, porosity, strictCutoffs);

      expect(result.netToGrossRatio).toBe(0.5); // Only last 10ft meets criteria
      expect(result.reservoirIntervals).toHaveLength(1);
    });

    it('should handle invalid data gracefully', () => {
      const depths = [6000, 6010, 6020];
      const shaleVolume = [0.2, NaN, 0.3];
      const porosity = [0.15, 0.12, NaN];

      const result = calculator.calculateNetToGross(depths, shaleVolume, porosity);

      expect(result.totalThickness).toBe(0); // No valid intervals due to NaN values
      expect(result.qualityMetrics.dataCompleteness).toBeLessThan(1.0);
    });

    it('should throw error for mismatched array lengths', () => {
      const depths = [7000, 7010];
      const shaleVolume = [0.2, 0.3, 0.4];
      const porosity = [0.15, 0.12];

      expect(() => {
        calculator.calculateNetToGross(depths, shaleVolume, porosity);
      }).toThrow('Input arrays must have the same length');
    });

    it('should throw error for insufficient data points', () => {
      const depths = [8000];
      const shaleVolume = [0.2];
      const porosity = [0.15];

      expect(() => {
        calculator.calculateNetToGross(depths, shaleVolume, porosity);
      }).toThrow('At least 2 data points required');
    });
  });

  describe('calculateCompletionEfficiency', () => {
    it('should calculate completion efficiency correctly', () => {
      const intervals: CompletionInterval[] = [
        {
          name: 'Zone1',
          topDepth: 9000,
          bottomDepth: 9050,
          perforatedLength: 40,
          netPayLength: 50
        },
        {
          name: 'Zone2',
          topDepth: 9100,
          bottomDepth: 9130,
          perforatedLength: 25,
          netPayLength: 30
        }
      ];

      const result = calculator.calculateCompletionEfficiency(intervals);

      expect(result.totalPerforatedLength).toBe(65);
      expect(result.totalNetPayLength).toBe(80);
      expect(result.completionEfficiency).toBeCloseTo(0.8125, 4);
      expect(result.completionIntervals[0].completionEfficiency).toBeCloseTo(0.8, 2);
      expect(result.completionIntervals[1].completionEfficiency).toBeCloseTo(0.833, 3);
    });

    it('should handle 100% completion efficiency', () => {
      const intervals: CompletionInterval[] = [
        {
          name: 'FullyCompleted',
          topDepth: 10000,
          bottomDepth: 10050,
          perforatedLength: 50,
          netPayLength: 50
        }
      ];

      const result = calculator.calculateCompletionEfficiency(intervals);

      expect(result.completionEfficiency).toBe(1.0);
      expect(result.completionIntervals[0].completionEfficiency).toBe(1.0);
    });

    it('should handle zero net pay length', () => {
      const intervals: CompletionInterval[] = [
        {
          name: 'NoNetPay',
          topDepth: 11000,
          bottomDepth: 11020,
          perforatedLength: 0,
          netPayLength: 0
        }
      ];

      const result = calculator.calculateCompletionEfficiency(intervals);

      expect(result.completionEfficiency).toBe(0);
      expect(result.completionIntervals[0].completionEfficiency).toBe(0);
    });

    it('should warn when perforated length exceeds net pay length', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const intervals: CompletionInterval[] = [
        {
          name: 'OverPerforated',
          topDepth: 12000,
          bottomDepth: 12030,
          perforatedLength: 40,
          netPayLength: 30
        }
      ];

      const result = calculator.calculateCompletionEfficiency(intervals);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Perforated length (40) exceeds net pay length (30)')
      );
      expect(result.completionIntervals[0].completionEfficiency).toBeCloseTo(1.333, 3);
      
      consoleSpy.mockRestore();
    });

    it('should throw error for negative lengths', () => {
      const intervals: CompletionInterval[] = [
        {
          name: 'Invalid',
          topDepth: 13000,
          bottomDepth: 13030,
          perforatedLength: -10,
          netPayLength: 30
        }
      ];

      expect(() => {
        calculator.calculateCompletionEfficiency(intervals);
      }).toThrow('Perforated length and net pay length must be non-negative');
    });

    it('should throw error for empty intervals array', () => {
      expect(() => {
        calculator.calculateCompletionEfficiency([]);
      }).toThrow('At least one completion interval is required');
    });
  });

  describe('calculateWeightedMeanPorosity', () => {
    it('should calculate weighted mean porosity with thickness weights', () => {
      const depths = [14000, 14010, 14020, 14030]; // 10ft intervals
      const porosity = [0.10, 0.20, 0.15, 0.25];

      const result = calculator.calculateWeightedMeanPorosity(depths, porosity);

      // All intervals have equal thickness, so weighted mean = arithmetic mean
      const expectedMean = (0.10 + 0.20 + 0.15 + 0.25) / 4;
      expect(result.weightedMean).toBeCloseTo(expectedMean, 3);
      expect(result.totalWeight).toBeGreaterThan(0);
    });

    it('should calculate weighted mean porosity with custom weights', () => {
      const depths = [15000, 15010, 15020];
      const porosity = [0.10, 0.20, 0.30];
      const weights = [1, 2, 3]; // Give more weight to higher porosity values

      const result = calculator.calculateWeightedMeanPorosity(depths, porosity, weights);

      // Weighted mean = (0.10*1 + 0.20*2 + 0.30*3) / (1+2+3) = 1.4/6 = 0.233
      expect(result.weightedMean).toBeCloseTo(0.233, 3);
      expect(result.totalWeight).toBe(6);
    });

    it('should handle zero and negative porosity values', () => {
      const depths = [16000, 16010, 16020, 16030];
      const porosity = [0.15, 0, -0.05, 0.20]; // Only first and last are valid

      const result = calculator.calculateWeightedMeanPorosity(depths, porosity);

      expect(result.weightedMean).toBeCloseTo(0.175, 3); // Average of 0.15 and 0.20
      expect(result.statistics.validCount).toBe(2);
    });

    it('should handle NaN values gracefully', () => {
      const depths = [17000, 17010, 17020];
      const porosity = [0.15, NaN, 0.25];

      const result = calculator.calculateWeightedMeanPorosity(depths, porosity);

      expect(result.weightedMean).toBeCloseTo(0.20, 3); // Average of 0.15 and 0.25
      expect(result.statistics.validCount).toBe(2);
    });

    it('should throw error for mismatched array lengths', () => {
      const depths = [18000, 18010];
      const porosity = [0.15, 0.20, 0.25];

      expect(() => {
        calculator.calculateWeightedMeanPorosity(depths, porosity);
      }).toThrow('Depths and porosity arrays must have the same length');
    });

    it('should throw error for mismatched weights length', () => {
      const depths = [19000, 19010, 19020];
      const porosity = [0.15, 0.20, 0.25];
      const weights = [1, 2]; // Wrong length

      expect(() => {
        calculator.calculateWeightedMeanPorosity(depths, porosity, weights);
      }).toThrow('Weights array must have the same length as porosity array');
    });
  });

  describe('validateInputs', () => {
    it('should validate correct inputs', () => {
      const depths = [20000, 20010, 20020];
      const shaleVolume = [0.2, 0.4, 0.3];
      const porosity = [0.15, 0.12, 0.18];

      const result = calculator.validateInputs(depths, shaleVolume, porosity);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect mismatched array lengths', () => {
      const depths = [21000, 21010];
      const shaleVolume = [0.2, 0.4, 0.3];
      const porosity = [0.15, 0.12];

      const result = calculator.validateInputs(depths, shaleVolume, porosity);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('same length');
    });

    it('should detect insufficient data points', () => {
      const depths = [22000];
      const shaleVolume = [0.2];
      const porosity = [0.15];

      const result = calculator.validateInputs(depths, shaleVolume, porosity);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('At least 2 data points');
    });

    it('should warn about non-monotonic depths', () => {
      const depths = [23000, 23020, 23010]; // Not monotonic
      const shaleVolume = [0.2, 0.4, 0.3];
      const porosity = [0.15, 0.12, 0.18];

      const result = calculator.validateInputs(depths, shaleVolume, porosity);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].message).toContain('not monotonic');
    });

    it('should warn about values outside typical ranges', () => {
      const depths = [24000, 24010, 24020];
      const shaleVolume = [0.2, 1.5, 0.3]; // 1.5 is outside 0-1 range
      const porosity = [0.15, 0.12, 0.8]; // 0.8 is outside 0-0.5 range

      const result = calculator.validateInputs(depths, shaleVolume, porosity);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.message.includes('Shale volume'))).toBe(true);
      expect(result.warnings.some(w => w.message.includes('Porosity'))).toBe(true);
    });

    it('should warn about low data completeness', () => {
      const depths = [25000, 25010, 25020, 25030];
      const shaleVolume = [0.2, NaN, NaN, 0.3]; // 50% completeness
      const porosity = [0.15, NaN, NaN, NaN]; // 25% completeness (below 50% threshold)

      const result = calculator.validateInputs(depths, shaleVolume, porosity);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.message.includes('Low data completeness'))).toBe(true);
    });

    it('should validate cutoff parameters', () => {
      const depths = [26000, 26010, 26020];
      const shaleVolume = [0.2, 0.4, 0.3];
      const porosity = [0.15, 0.12, 0.18];
      const invalidCutoffs = {
        vshMax: 1.5, // Invalid: > 1
        porosityMin: -0.1, // Invalid: < 0
        saturationMax: 2.0 // Invalid: > 1
      };

      const result = calculator.validateInputs(depths, shaleVolume, porosity, invalidCutoffs);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBe(3);
      expect(result.errors.some(e => e.message.includes('shale volume cutoff'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('porosity cutoff'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('saturation cutoff'))).toBe(true);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle single reservoir interval spanning entire section', () => {
      const depths = [27000, 27010, 27020, 27030, 27040];
      const shaleVolume = [0.1, 0.2, 0.3, 0.2, 0.1]; // All reservoir quality
      const porosity = [0.15, 0.18, 0.12, 0.16, 0.20];

      const result = calculator.calculateNetToGross(depths, shaleVolume, porosity);

      expect(result.netToGrossRatio).toBe(1.0);
      expect(result.reservoirIntervals).toHaveLength(1);
      expect(result.reservoirIntervals[0].topDepth).toBe(27000);
      expect(result.reservoirIntervals[0].bottomDepth).toBe(27040);
    });

    it('should handle alternating reservoir and non-reservoir intervals', () => {
      const depths = [28000, 28010, 28020, 28030, 28040, 28050];
      const shaleVolume = [0.2, 0.8, 0.3, 0.9, 0.1, 0.7]; // Alternating quality
      const porosity = [0.15, 0.05, 0.12, 0.03, 0.18, 0.04];

      const result = calculator.calculateNetToGross(depths, shaleVolume, porosity);

      expect(result.reservoirIntervals.length).toBeGreaterThan(0);
      expect(result.netToGrossRatio).toBeCloseTo(0.6, 1); // 30ft out of 50ft (intervals 1, 3, 5)
    });

    it('should calculate statistics correctly for empty valid data', () => {
      const depths = [29000, 29010, 29020];
      const shaleVolume = [NaN, NaN, NaN];
      const porosity = [NaN, NaN, NaN];

      const result = calculator.calculateNetToGross(depths, shaleVolume, porosity);

      expect(result.statistics.validCount).toBe(0);
      expect(isNaN(result.statistics.mean)).toBe(true);
      expect(result.qualityMetrics.confidenceLevel).toBe('medium');
    });
  });
});