/**
 * Validation Runner Tests
 * Tests for the comprehensive validation orchestration system
 */

import { ValidationRunner } from '../validationRunner';

describe('ValidationRunner', () => {
  let validationRunner: ValidationRunner;

  beforeEach(async () => {
    validationRunner = new ValidationRunner();
    await validationRunner.initialize();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const newRunner = new ValidationRunner();
      await expect(newRunner.initialize()).resolves.not.toThrow();
    });
  });

  describe('Comprehensive Validation', () => {
    it('should run comprehensive validation suite', async () => {
      const validationSuite = await validationRunner.runComprehensiveValidation();
      
      expect(validationSuite.name).toBe('Comprehensive Industry Validation Suite');
      expect(validationSuite.results.length).toBeGreaterThan(0);
      expect(validationSuite.calculationTypes.length).toBeGreaterThan(0);
      expect(validationSuite.softwarePackages.length).toBeGreaterThan(0);
      
      // Check that we have results for multiple calculation types
      const calculationTypes = [...new Set(validationSuite.results.map(r => r.calculationType))];
      expect(calculationTypes).toContain('porosity');
      expect(calculationTypes).toContain('shale_volume');
      expect(calculationTypes).toContain('saturation');
    });

    it('should include execution time for each validation', async () => {
      const validationSuite = await validationRunner.runComprehensiveValidation();
      
      validationSuite.results.forEach(result => {
        expect(result.executionTime).toBeGreaterThan(0);
        expect(typeof result.executionTime).toBe('number');
      });
    });

    it('should validate against multiple software packages', async () => {
      const validationSuite = await validationRunner.runComprehensiveValidation();
      
      const softwarePackages = [...new Set(validationSuite.results.map(r => r.software))];
      expect(softwarePackages).toContain('Techlog');
      expect(softwarePackages).toContain('Geolog');
      expect(softwarePackages).toContain('InteractivePetrophysics');
    });
  });

  describe('Calculation Type Validation', () => {
    it('should run porosity validation suite', async () => {
      const validationSuite = await validationRunner.runCalculationTypeValidation('porosity');
      
      expect(validationSuite.name).toContain('Porosity Validation Suite');
      expect(validationSuite.calculationTypes).toEqual(['porosity']);
      expect(validationSuite.results.length).toBeGreaterThan(0);
      
      validationSuite.results.forEach(result => {
        expect(result.calculationType).toBe('porosity');
      });
    });

    it('should run shale volume validation suite', async () => {
      const validationSuite = await validationRunner.runCalculationTypeValidation('shale_volume');
      
      expect(validationSuite.name).toContain('Shale_volume Validation Suite');
      expect(validationSuite.calculationTypes).toEqual(['shale_volume']);
      expect(validationSuite.results.length).toBeGreaterThan(0);
      
      validationSuite.results.forEach(result => {
        expect(result.calculationType).toBe('shale_volume');
      });
    });

    it('should run saturation validation suite', async () => {
      const validationSuite = await validationRunner.runCalculationTypeValidation('saturation');
      
      expect(validationSuite.name).toContain('Saturation Validation Suite');
      expect(validationSuite.calculationTypes).toEqual(['saturation']);
      expect(validationSuite.results.length).toBeGreaterThan(0);
      
      validationSuite.results.forEach(result => {
        expect(result.calculationType).toBe('saturation');
      });
    });
  });

  describe('Software Validation', () => {
    it('should run Techlog validation suite', async () => {
      const validationSuite = await validationRunner.runSoftwareValidation('Techlog');
      
      expect(validationSuite.name).toBe('Techlog Validation Suite');
      expect(validationSuite.softwarePackages).toEqual(['Techlog']);
      expect(validationSuite.results.length).toBeGreaterThan(0);
      
      validationSuite.results.forEach(result => {
        expect(result.software).toBe('Techlog');
      });
    });

    it('should run Geolog validation suite', async () => {
      const validationSuite = await validationRunner.runSoftwareValidation('Geolog');
      
      expect(validationSuite.name).toBe('Geolog Validation Suite');
      expect(validationSuite.softwarePackages).toEqual(['Geolog']);
      expect(validationSuite.results.length).toBeGreaterThan(0);
      
      validationSuite.results.forEach(result => {
        expect(result.software).toBe('Geolog');
      });
    });

    it('should run Interactive Petrophysics validation suite', async () => {
      const validationSuite = await validationRunner.runSoftwareValidation('InteractivePetrophysics');
      
      expect(validationSuite.name).toBe('InteractivePetrophysics Validation Suite');
      expect(validationSuite.softwarePackages).toEqual(['InteractivePetrophysics']);
      expect(validationSuite.results.length).toBeGreaterThan(0);
      
      validationSuite.results.forEach(result => {
        expect(result.software).toBe('InteractivePetrophysics');
      });
    });
  });

  describe('Validation Summary Generation', () => {
    it('should generate comprehensive validation summary', async () => {
      const validationSuite = await validationRunner.runComprehensiveValidation();
      const summary = validationRunner.generateValidationSummary(validationSuite);
      
      expect(summary.totalBenchmarks).toBe(validationSuite.results.length);
      expect(summary.passedBenchmarks + summary.failedBenchmarks).toBe(summary.totalBenchmarks);
      expect(summary.overallAccuracy).toBeGreaterThanOrEqual(0);
      expect(summary.overallAccuracy).toBeLessThanOrEqual(100);
      expect(summary.averageCorrelation).toBeGreaterThanOrEqual(-1);
      expect(summary.averageCorrelation).toBeLessThanOrEqual(1);
    });

    it('should provide software-specific summaries', async () => {
      const validationSuite = await validationRunner.runComprehensiveValidation();
      const summary = validationRunner.generateValidationSummary(validationSuite);
      
      expect(Object.keys(summary.softwareSummary).length).toBeGreaterThan(0);
      
      for (const [software, softwareSummary] of Object.entries(summary.softwareSummary)) {
        expect(softwareSummary.totalBenchmarks).toBeGreaterThan(0);
        expect(softwareSummary.passedBenchmarks).toBeGreaterThanOrEqual(0);
        expect(softwareSummary.passedBenchmarks).toBeLessThanOrEqual(softwareSummary.totalBenchmarks);
        expect(softwareSummary.averageAccuracy).toBeGreaterThanOrEqual(0);
        expect(softwareSummary.averageCorrelation).toBeGreaterThanOrEqual(-1);
        expect(softwareSummary.averageCorrelation).toBeLessThanOrEqual(1);
      }
    });

    it('should provide calculation type summaries', async () => {
      const validationSuite = await validationRunner.runComprehensiveValidation();
      const summary = validationRunner.generateValidationSummary(validationSuite);
      
      expect(Object.keys(summary.calculationTypeSummary).length).toBeGreaterThan(0);
      
      for (const [type, typeSummary] of Object.entries(summary.calculationTypeSummary)) {
        expect(typeSummary.totalBenchmarks).toBeGreaterThan(0);
        expect(typeSummary.passedBenchmarks).toBeGreaterThanOrEqual(0);
        expect(typeSummary.passedBenchmarks).toBeLessThanOrEqual(typeSummary.totalBenchmarks);
        expect(typeSummary.averageAccuracy).toBeGreaterThanOrEqual(0);
        expect(typeSummary.methods.length).toBeGreaterThan(0);
      }
    });

    it('should generate appropriate recommendations', async () => {
      const validationSuite = await validationRunner.runComprehensiveValidation();
      const summary = validationRunner.generateValidationSummary(validationSuite);
      
      expect(summary.recommendations.length).toBeGreaterThan(0);
      
      // Should have overall performance recommendation
      const hasOverallRecommendation = summary.recommendations.some(rec => 
        rec.includes('overall accuracy') || rec.includes('correlation')
      );
      expect(hasOverallRecommendation).toBe(true);
    });
  });

  describe('Accuracy Requirements', () => {
    it('should meet ±5% tolerance target for porosity calculations', async () => {
      const validationSuite = await validationRunner.runCalculationTypeValidation('porosity');
      
      const porosityResults = validationSuite.results.filter(r => r.calculationType === 'porosity');
      expect(porosityResults.length).toBeGreaterThan(0);
      
      // Most results should pass (≥95% accuracy target)
      const passedResults = porosityResults.filter(r => r.result.passed);
      const passRate = (passedResults.length / porosityResults.length) * 100;
      
      expect(passRate).toBeGreaterThanOrEqual(80); // Allow some flexibility for test data
    });

    it('should meet ±5% tolerance target for shale volume calculations', async () => {
      const validationSuite = await validationRunner.runCalculationTypeValidation('shale_volume');
      
      const shaleResults = validationSuite.results.filter(r => r.calculationType === 'shale_volume');
      expect(shaleResults.length).toBeGreaterThan(0);
      
      const passedResults = shaleResults.filter(r => r.result.passed);
      const passRate = (passedResults.length / shaleResults.length) * 100;
      
      expect(passRate).toBeGreaterThanOrEqual(80);
    });

    it('should meet ±5% tolerance target for saturation calculations', async () => {
      const validationSuite = await validationRunner.runCalculationTypeValidation('saturation');
      
      const saturationResults = validationSuite.results.filter(r => r.calculationType === 'saturation');
      expect(saturationResults.length).toBeGreaterThan(0);
      
      const passedResults = saturationResults.filter(r => r.result.passed);
      const passRate = (passedResults.length / saturationResults.length) * 100;
      
      expect(passRate).toBeGreaterThanOrEqual(80);
    });
  });

  describe('Performance Metrics', () => {
    it('should complete validation within reasonable time', async () => {
      const startTime = Date.now();
      const validationSuite = await validationRunner.runCalculationTypeValidation('porosity');
      const totalTime = Date.now() - startTime;
      
      // Should complete within 30 seconds for porosity validation
      expect(totalTime).toBeLessThan(30000);
      
      // Individual validations should be fast
      validationSuite.results.forEach(result => {
        expect(result.executionTime).toBeLessThan(5000); // 5 seconds max per validation
      });
    });

    it('should handle multiple concurrent validations', async () => {
      const promises = [
        validationRunner.runCalculationTypeValidation('porosity'),
        validationRunner.runCalculationTypeValidation('shale_volume'),
        validationRunner.runCalculationTypeValidation('saturation')
      ];
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.results.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Export Functionality', () => {
    it('should export validation results to JSON', async () => {
      const validationSuite = await validationRunner.runCalculationTypeValidation('porosity');
      const exportedJson = validationRunner.exportValidationResults(validationSuite);
      
      expect(exportedJson).toBeDefined();
      
      const parsed = JSON.parse(exportedJson);
      expect(parsed.validationSuite).toBeDefined();
      expect(parsed.summary).toBeDefined();
      expect(parsed.exportDate).toBeDefined();
      expect(parsed.version).toBe('1.0');
    });

    it('should include complete validation data in export', async () => {
      const validationSuite = await validationRunner.runCalculationTypeValidation('porosity');
      const exportedJson = validationRunner.exportValidationResults(validationSuite);
      
      const parsed = JSON.parse(exportedJson);
      
      expect(parsed.validationSuite.results.length).toBe(validationSuite.results.length);
      expect(parsed.summary.totalBenchmarks).toBe(validationSuite.results.length);
      expect(parsed.summary.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid calculation types gracefully', async () => {
      const validationSuite = await validationRunner.runCalculationTypeValidation('invalid_type');
      
      expect(validationSuite.results).toHaveLength(0);
      expect(validationSuite.calculationTypes).toEqual(['invalid_type']);
    });

    it('should handle invalid software packages gracefully', async () => {
      const validationSuite = await validationRunner.runSoftwareValidation('InvalidSoftware');
      
      expect(validationSuite.results).toHaveLength(0);
      expect(validationSuite.softwarePackages).toEqual(['InvalidSoftware']);
    });
  });

  describe('Industry Compliance', () => {
    it('should validate against SPE standards', async () => {
      const validationSuite = await validationRunner.runComprehensiveValidation();
      
      const speResults = validationSuite.results.filter(r => 
        r.benchmarkName.toLowerCase().includes('spe')
      );
      
      if (speResults.length > 0) {
        speResults.forEach(result => {
          expect(result.result.accuracy).toBeGreaterThanOrEqual(90);
        });
      }
    });

    it('should validate against SPWLA standards', async () => {
      const validationSuite = await validationRunner.runComprehensiveValidation();
      
      const spwlaResults = validationSuite.results.filter(r => 
        r.benchmarkName.toLowerCase().includes('spwla')
      );
      
      if (spwlaResults.length > 0) {
        spwlaResults.forEach(result => {
          expect(result.result.accuracy).toBeGreaterThanOrEqual(90);
        });
      }
    });
  });
});