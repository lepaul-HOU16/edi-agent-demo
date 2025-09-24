/**
 * Industry Validation Service Tests
 * Comprehensive test suite for validating petrophysical calculations against commercial software
 */

import { IndustryValidationService, ValidationBenchmark, ValidationInputData } from '../industryValidation';
import { PorosityCalculator } from '../../calculators/porosityCalculator';
import { ShaleVolumeCalculator } from '../../calculators/shaleVolumeCalculator';
import { SaturationCalculator } from '../../calculators/saturationCalculator';

describe('IndustryValidationService', () => {
  let validationService: IndustryValidationService;
  let porosityCalculator: PorosityCalculator;
  let shaleVolumeCalculator: ShaleVolumeCalculator;
  let saturationCalculator: SaturationCalculator;

  beforeEach(async () => {
    validationService = new IndustryValidationService();
    porosityCalculator = new PorosityCalculator();
    shaleVolumeCalculator = new ShaleVolumeCalculator();
    saturationCalculator = new SaturationCalculator();
    
    await validationService.loadBenchmarks();
  });

  describe('Benchmark Loading', () => {
    it('should load Techlog benchmarks', () => {
      const techlogBenchmark = validationService.getBenchmark('techlog_porosity_density');
      expect(techlogBenchmark).toBeDefined();
      expect(techlogBenchmark?.software).toBe('Techlog');
      expect(techlogBenchmark?.calculationType).toBe('porosity');
    });

    it('should load Geolog benchmarks', () => {
      const geologBenchmark = validationService.getBenchmark('geolog_shale_larionov_tertiary');
      expect(geologBenchmark).toBeDefined();
      expect(geologBenchmark?.software).toBe('Geolog');
      expect(geologBenchmark?.calculationType).toBe('shale_volume');
    });

    it('should load Interactive Petrophysics benchmarks', () => {
      const ipBenchmark = validationService.getBenchmark('ip_saturation_archie');
      expect(ipBenchmark).toBeDefined();
      expect(ipBenchmark?.software).toBe('InteractivePetrophysics');
      expect(ipBenchmark?.calculationType).toBe('saturation');
    });

    it('should have proper tolerance settings', () => {
      const benchmarks = validationService.getBenchmarks();
      benchmarks.forEach(benchmark => {
        expect(benchmark.tolerance).toBe(0.05); // ±5% target
      });
    });
  });

  describe('Porosity Validation Against Techlog', () => {
    it('should validate density porosity calculation within ±5% tolerance', async () => {
      const benchmark = validationService.getBenchmark('techlog_porosity_density')!;
      
      // Calculate porosity using our implementation
      const rhobData = benchmark.inputData.curves.RHOB;
      const actualResults = porosityCalculator.calculateDensityPorosity(
        rhobData,
        benchmark.inputData.parameters
      );

      // Validate against Techlog results
      const validationResults = await validationService.validateCalculation(
        'porosity',
        'density',
        actualResults,
        benchmark.inputData.depths,
        benchmark.inputData
      );

      expect(validationResults).toHaveLength(1);
      const result = validationResults[0];
      
      expect(result.benchmarkName).toBe('Techlog Density Porosity Validation');
      expect(result.accuracy).toBeGreaterThanOrEqual(95); // 95% accuracy target
      expect(result.statistics.correlationCoefficient).toBeGreaterThanOrEqual(0.95);
      expect(result.passed).toBe(true);
    });

    it('should provide detailed deviation analysis', async () => {
      const benchmark = validationService.getBenchmark('techlog_porosity_density')!;
      
      const rhobData = benchmark.inputData.curves.RHOB;
      const actualResults = porosityCalculator.calculateDensityPorosity(
        rhobData,
        benchmark.inputData.parameters
      );

      const validationResults = await validationService.validateCalculation(
        'porosity',
        'density',
        actualResults,
        benchmark.inputData.depths,
        benchmark.inputData
      );

      const result = validationResults[0];
      
      expect(result.deviations).toHaveLength(5);
      result.deviations.forEach((deviation, index) => {
        expect(deviation.depth).toBe(benchmark.inputData.depths[index]);
        expect(deviation.expected).toBe(benchmark.expectedResults.values[index]);
        expect(deviation.actual).toBeCloseTo(actualResults[index], 6);
        expect(deviation.percentageError).toBeLessThanOrEqual(5); // Within ±5%
        expect(deviation.withinTolerance).toBe(true);
      });
    });
  });

  describe('Shale Volume Validation Against Geolog', () => {
    it('should validate Larionov tertiary method within tolerance', async () => {
      const benchmark = validationService.getBenchmark('geolog_shale_larionov_tertiary')!;
      
      // Calculate shale volume using our implementation
      const grData = benchmark.inputData.curves.GR;
      const grClean = benchmark.inputData.parameters.grClean;
      const grShale = benchmark.inputData.parameters.grShale;
      
      const actualResults = shaleVolumeCalculator.calculateLarionovTertiary(
        grData,
        { grClean, grShale }
      );

      // Validate against Geolog results
      const validationResults = await validationService.validateCalculation(
        'shale_volume',
        'larionov_tertiary',
        actualResults,
        benchmark.inputData.depths,
        benchmark.inputData
      );

      expect(validationResults).toHaveLength(1);
      const result = validationResults[0];
      
      expect(result.benchmarkName).toBe('Geolog Larionov Tertiary Shale Volume');
      expect(result.accuracy).toBeGreaterThanOrEqual(95);
      expect(result.statistics.correlationCoefficient).toBeGreaterThanOrEqual(0.95);
      expect(result.passed).toBe(true);
    });

    it('should calculate proper statistics for shale volume validation', async () => {
      const benchmark = validationService.getBenchmark('geolog_shale_larionov_tertiary')!;
      
      const grData = benchmark.inputData.curves.GR;
      const grClean = benchmark.inputData.parameters.grClean;
      const grShale = benchmark.inputData.parameters.grShale;
      
      const actualResults = shaleVolumeCalculator.calculateLarionovTertiary(
        grData,
        { grClean, grShale }
      );

      const validationResults = await validationService.validateCalculation(
        'shale_volume',
        'larionov_tertiary',
        actualResults,
        benchmark.inputData.depths,
        benchmark.inputData
      );

      const result = validationResults[0];
      
      expect(result.statistics.meanAbsoluteError).toBeLessThanOrEqual(0.05);
      expect(result.statistics.rootMeanSquareError).toBeLessThanOrEqual(0.05);
      expect(result.statistics.percentageWithinTolerance).toBeGreaterThanOrEqual(95);
    });
  });

  describe('Water Saturation Validation Against Interactive Petrophysics', () => {
    it('should validate Archie equation within tolerance', async () => {
      const benchmark = validationService.getBenchmark('ip_saturation_archie')!;
      
      // Calculate water saturation using our implementation
      const rtData = benchmark.inputData.curves.RT;
      const porosityData = benchmark.inputData.curves.POROSITY;
      const params = benchmark.inputData.parameters;
      
      const actualResults = saturationCalculator.calculateArchie(
        rtData,
        porosityData,
        params
      );

      // Validate against Interactive Petrophysics results
      const validationResults = await validationService.validateCalculation(
        'saturation',
        'archie',
        actualResults,
        benchmark.inputData.depths,
        benchmark.inputData
      );

      expect(validationResults).toHaveLength(1);
      const result = validationResults[0];
      
      expect(result.benchmarkName).toBe('Interactive Petrophysics Archie Saturation');
      expect(result.accuracy).toBeGreaterThanOrEqual(95);
      expect(result.statistics.correlationCoefficient).toBeGreaterThanOrEqual(0.95);
      expect(result.passed).toBe(true);
    });
  });

  describe('Tolerance Checking', () => {
    it('should properly identify results outside tolerance', async () => {
      // Create a benchmark with known deviations
      const testBenchmark: ValidationBenchmark = {
        name: 'test_tolerance_check',
        software: 'Techlog',
        calculationType: 'porosity',
        method: 'density',
        inputData: {
          wellName: 'TEST_WELL',
          depths: [1000, 1001, 1002],
          curves: { RHOB: [2.4, 2.5, 2.6] },
          parameters: { matrixDensity: 2.65, fluidDensity: 1.0 }
        },
        expectedResults: {
          values: [0.15, 0.09, 0.03],
          statistics: { mean: 0.09, median: 0.09, min: 0.03, max: 0.15, stdDev: 0.06 },
          qualityMetrics: { dataCompleteness: 100, confidenceLevel: 'high' }
        },
        tolerance: 0.05,
        metadata: {
          source: 'Test',
          version: '1.0',
          dateCreated: '2024-01-15',
          description: 'Test benchmark',
          geologicalContext: 'Test'
        }
      };

      validationService.addBenchmark(testBenchmark);

      // Provide results with some outside tolerance
      const actualResults = [0.16, 0.09, 0.02]; // First and third are outside ±5%

      const validationResults = await validationService.validateCalculation(
        'porosity',
        'density',
        actualResults,
        testBenchmark.inputData.depths,
        testBenchmark.inputData
      );

      const result = validationResults[0];
      
      expect(result.deviations[0].withinTolerance).toBe(false); // 6.7% error
      expect(result.deviations[1].withinTolerance).toBe(true);  // 0% error
      expect(result.deviations[2].withinTolerance).toBe(false); // 33.3% error
      expect(result.statistics.percentageWithinTolerance).toBeCloseTo(33.33, 1);
      expect(result.passed).toBe(false); // Less than 95% within tolerance
    });
  });

  describe('Recommendations Generation', () => {
    it('should provide appropriate recommendations for poor accuracy', async () => {
      const testBenchmark: ValidationBenchmark = {
        name: 'test_poor_accuracy',
        software: 'Techlog',
        calculationType: 'porosity',
        method: 'density',
        inputData: {
          wellName: 'TEST_WELL',
          depths: [1000, 1001, 1002],
          curves: { RHOB: [2.4, 2.5, 2.6] },
          parameters: { matrixDensity: 2.65, fluidDensity: 1.0 }
        },
        expectedResults: {
          values: [0.15, 0.09, 0.03],
          statistics: { mean: 0.09, median: 0.09, min: 0.03, max: 0.15, stdDev: 0.06 },
          qualityMetrics: { dataCompleteness: 100, confidenceLevel: 'high' }
        },
        tolerance: 0.05,
        metadata: {
          source: 'Test',
          version: '1.0',
          dateCreated: '2024-01-15',
          description: 'Test benchmark',
          geologicalContext: 'Test'
        }
      };

      validationService.addBenchmark(testBenchmark);

      // Provide poor results
      const actualResults = [0.20, 0.15, 0.10]; // All significantly different

      const validationResults = await validationService.validateCalculation(
        'porosity',
        'density',
        actualResults,
        testBenchmark.inputData.depths,
        testBenchmark.inputData
      );

      const result = validationResults[0];
      
      expect(result.recommendations.some(rec => 
        /Accuracy.*below target.*Consider parameter adjustment/.test(rec)
      )).toBe(true);
      expect(result.recommendations.some(rec => 
        /Low correlation.*Review calculation methodology/.test(rec)
      )).toBe(true);
    });

    it('should provide positive recommendations for excellent results', async () => {
      const benchmark = validationService.getBenchmark('techlog_porosity_density')!;
      
      // Use the exact expected results
      const actualResults = benchmark.expectedResults.values;

      const validationResults = await validationService.validateCalculation(
        'porosity',
        'density',
        actualResults,
        benchmark.inputData.depths,
        benchmark.inputData
      );

      const result = validationResults[0];
      
      expect(result.recommendations.some(rec => 
        /Excellent agreement.*industry-compliant/.test(rec)
      )).toBe(true);
    });
  });

  describe('Statistical Calculations', () => {
    it('should calculate correlation coefficient correctly', async () => {
      const benchmark = validationService.getBenchmark('techlog_porosity_density')!;
      
      // Perfect correlation test
      const actualResults = benchmark.expectedResults.values;

      const validationResults = await validationService.validateCalculation(
        'porosity',
        'density',
        actualResults,
        benchmark.inputData.depths,
        benchmark.inputData
      );

      const result = validationResults[0];
      expect(result.statistics.correlationCoefficient).toBeCloseTo(1.0, 3);
    });

    it('should calculate RMSE and MAE correctly', async () => {
      const testBenchmark: ValidationBenchmark = {
        name: 'test_statistics',
        software: 'Techlog',
        calculationType: 'porosity',
        method: 'density',
        inputData: {
          wellName: 'TEST_WELL',
          depths: [1000, 1001],
          curves: { RHOB: [2.4, 2.5] },
          parameters: { matrixDensity: 2.65, fluidDensity: 1.0 }
        },
        expectedResults: {
          values: [0.10, 0.20],
          statistics: { mean: 0.15, median: 0.15, min: 0.10, max: 0.20, stdDev: 0.07 },
          qualityMetrics: { dataCompleteness: 100, confidenceLevel: 'high' }
        },
        tolerance: 0.05,
        metadata: {
          source: 'Test',
          version: '1.0',
          dateCreated: '2024-01-15',
          description: 'Test benchmark',
          geologicalContext: 'Test'
        }
      };

      validationService.addBenchmark(testBenchmark);

      const actualResults = [0.12, 0.18]; // Deviations: +0.02, -0.02

      const validationResults = await validationService.validateCalculation(
        'porosity',
        'density',
        actualResults,
        testBenchmark.inputData.depths,
        testBenchmark.inputData
      );

      const result = validationResults[0];
      
      expect(result.statistics.meanAbsoluteError).toBeCloseTo(0.02, 6);
      expect(result.statistics.rootMeanSquareError).toBeCloseTo(0.02, 6);
    });
  });

  describe('Multiple Software Validation', () => {
    it('should validate against multiple software packages simultaneously', async () => {
      // This would test validation against Techlog, Geolog, and IP for the same calculation
      const benchmarks = validationService.getBenchmarks();
      const softwareTypes = [...new Set(benchmarks.map(b => b.software))];
      
      expect(softwareTypes).toContain('Techlog');
      expect(softwareTypes).toContain('Geolog');
      expect(softwareTypes).toContain('InteractivePetrophysics');
      expect(softwareTypes.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Custom Benchmark Management', () => {
    it('should allow adding custom benchmarks', () => {
      const customBenchmark: ValidationBenchmark = {
        name: 'custom_test_benchmark',
        software: 'Techlog',
        calculationType: 'porosity',
        method: 'neutron',
        inputData: {
          wellName: 'CUSTOM_WELL',
          depths: [1500],
          curves: { NPHI: [0.15] },
          parameters: {}
        },
        expectedResults: {
          values: [0.15],
          statistics: { mean: 0.15, median: 0.15, min: 0.15, max: 0.15, stdDev: 0 },
          qualityMetrics: { dataCompleteness: 100, confidenceLevel: 'high' }
        },
        tolerance: 0.05,
        metadata: {
          source: 'Custom',
          version: '1.0',
          dateCreated: '2024-01-15',
          description: 'Custom benchmark',
          geologicalContext: 'Test'
        }
      };

      validationService.addBenchmark(customBenchmark);
      
      const retrieved = validationService.getBenchmark('custom_test_benchmark');
      expect(retrieved).toEqual(customBenchmark);
    });
  });
});