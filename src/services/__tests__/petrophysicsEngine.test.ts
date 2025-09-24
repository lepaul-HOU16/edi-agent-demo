/**
 * Unit tests for Petrophysical Calculation Engine
 * Tests core calculation interfaces and error handling
 * Based on requirements 2.1, 2.2, 6.1, 6.2
 */

import { PetrophysicsCalculationEngine } from '../petrophysicsEngine';
import {
  WellLogData,
  LogCurve,
  CalculationParameters,
  WellHeaderInfo,
  GeographicLocation,
  QualityAssessment,
  CurveQuality,
} from '../../types/petrophysics';

describe('PetrophysicsCalculationEngine', () => {
  let engine: PetrophysicsCalculationEngine;
  let mockWellData: WellLogData;

  beforeEach(() => {
    engine = new PetrophysicsCalculationEngine();

    // Create mock well data for testing
    const mockLocation: GeographicLocation = {
      latitude: 29.7604,
      longitude: -95.3698,
      utmZone: '15N',
      utmEasting: 276000,
      utmNorthing: 3290000,
    };

    const mockWellInfo: WellHeaderInfo = {
      wellName: 'TEST-001',
      field: 'Test Field',
      operator: 'Test Operator',
      location: mockLocation,
      elevation: 100,
      totalDepth: 10000,
      spudDate: new Date('2023-01-01'),
      wellType: 'vertical',
    };

    const mockCurveQuality: CurveQuality = {
      completeness: 0.95,
      outlierCount: 2,
      environmentalCorrections: ['borehole_correction'],
      qualityFlag: 'good',
    };

    const mockCurves: LogCurve[] = [
      {
        name: 'DEPT',
        unit: 'FT',
        description: 'Depth',
        data: [8000, 8001, 8002, 8003, 8004],
        nullValue: -999.25,
        quality: mockCurveQuality,
        apiCode: '00',
      },
      {
        name: 'GR',
        unit: 'API',
        description: 'Gamma Ray',
        data: [45, 50, 55, 60, 65],
        nullValue: -999.25,
        quality: mockCurveQuality,
        apiCode: '07',
      },
      {
        name: 'RHOB',
        unit: 'G/C3',
        description: 'Bulk Density',
        data: [2.45, 2.50, 2.55, 2.60, 2.65],
        nullValue: -999.25,
        quality: mockCurveQuality,
        apiCode: '17',
      },
      {
        name: 'NPHI',
        unit: 'V/V',
        description: 'Neutron Porosity',
        data: [0.15, 0.12, 0.10, 0.08, 0.05],
        nullValue: -999.25,
        quality: mockCurveQuality,
        apiCode: '42',
      },
    ];

    const mockQualityAssessment: QualityAssessment = {
      overallQuality: 'good',
      dataCompleteness: 0.95,
      environmentalCorrections: ['borehole_correction'],
      validationFlags: [],
      lastAssessment: new Date(),
    };

    mockWellData = {
      wellName: 'TEST-001',
      wellInfo: mockWellInfo,
      curves: mockCurves,
      depthRange: [8000, 8004],
      dataQuality: mockQualityAssessment,
      lastModified: new Date(),
      version: '1.0',
    };
  });

  describe('Constructor and Configuration', () => {
    it('should initialize with default configuration', () => {
      const config = engine.getConfig();
      expect(config.enableValidation).toBe(true);
      expect(config.enableUncertaintyCalculation).toBe(true);
      expect(config.defaultParameters.matrixDensity).toBe(2.65);
      expect(config.defaultParameters.fluidDensity).toBe(1.0);
    });

    it('should accept custom configuration', () => {
      const customEngine = new PetrophysicsCalculationEngine({
        enableValidation: false,
        defaultParameters: {
          matrixDensity: 2.71,
          a: 0.8,
        },
      });

      const config = customEngine.getConfig();
      expect(config.enableValidation).toBe(false);
      expect(config.defaultParameters.matrixDensity).toBe(2.71);
      expect(config.defaultParameters.a).toBe(0.8);
    });

    it('should update configuration', () => {
      engine.updateConfig({
        enableValidation: false,
        qualityThresholds: {
          dataCompleteness: 0.9,
          uncertaintyMax: 0.2,
        },
      });

      const config = engine.getConfig();
      expect(config.enableValidation).toBe(false);
      expect(config.qualityThresholds.dataCompleteness).toBe(0.9);
    });
  });

  describe('Well Data Loading and Validation', () => {
    it('should successfully load valid well data', () => {
      const result = engine.loadWellData(mockWellData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      const loadedData = engine.getWellData('TEST-001');
      expect(loadedData).toBeDefined();
      expect(loadedData?.wellName).toBe('TEST-001');
    });

    it('should reject well data with missing well name', () => {
      const invalidData = { ...mockWellData, wellName: '' };
      const result = engine.loadWellData(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Well name is required');
    });

    it('should reject well data with no curves', () => {
      const invalidData = { ...mockWellData, curves: [] };
      const result = engine.loadWellData(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2); // Both "no curves" and "no depth curve" errors
      expect(result.errors.some(e => e.message.includes('No log curves found'))).toBe(true);
    });

    it('should reject well data with invalid depth range', () => {
      const invalidData = { ...mockWellData, depthRange: [8004, 8000] as [number, number] };
      const result = engine.loadWellData(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Invalid depth range'))).toBe(true);
    });

    it('should warn about curves with low data completeness', () => {
      const lowQualityCurve: LogCurve = {
        name: 'RT',
        unit: 'OHMM',
        description: 'Resistivity',
        data: [10, -999.25, -999.25, -999.25, 20], // Only 2 valid out of 5
        nullValue: -999.25,
        quality: {
          completeness: 0.4,
          outlierCount: 0,
          environmentalCorrections: [],
          qualityFlag: 'poor',
        },
      };

      const dataWithLowQuality = {
        ...mockWellData,
        curves: [...mockWellData.curves, lowQualityCurve],
      };

      const result = engine.loadWellData(dataWithLowQuality);
      
      expect(result.isValid).toBe(true); // Should still be valid but with warnings
      expect(result.warnings.some(w => w.message.includes('low data completeness'))).toBe(true);
    });
  });

  describe('Calculation Parameter Validation', () => {
    it('should validate porosity calculation parameters', () => {
      const validParams: CalculationParameters = {
        matrixDensity: 2.65,
        fluidDensity: 1.0,
      };

      const result = engine.validateCalculationParameters('porosity', validParams);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid matrix density', () => {
      const invalidParams: CalculationParameters = {
        matrixDensity: -1.0, // Invalid negative value
      };

      const result = engine.validateCalculationParameters('porosity', invalidParams);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Matrix density'))).toBe(true);
    });

    it('should reject invalid fluid density', () => {
      const invalidParams: CalculationParameters = {
        fluidDensity: 5.0, // Unrealistically high
      };

      const result = engine.validateCalculationParameters('porosity', invalidParams);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Fluid density'))).toBe(true);
    });

    it('should validate Archie equation parameters', () => {
      const validParams: CalculationParameters = {
        rw: 0.1,
        a: 1.0,
        m: 2.0,
        n: 2.0,
      };

      const result = engine.validateCalculationParameters('archie', validParams);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid formation water resistivity', () => {
      const invalidParams: CalculationParameters = {
        rw: -0.1, // Invalid negative value
      };

      const result = engine.validateCalculationParameters('archie', invalidParams);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Formation water resistivity'))).toBe(true);
    });

    it('should warn about parameters outside typical ranges', () => {
      const atypicalParams: CalculationParameters = {
        a: 5.0, // Outside typical range
        m: 0.5, // Outside typical range
      };

      const result = engine.validateCalculationParameters('archie', atypicalParams);
      expect(result.isValid).toBe(true); // Valid but with warnings
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Statistical Calculations', () => {
    it('should calculate correct statistics for valid data', () => {
      const data = [1, 2, 3, 4, 5];
      const stats = engine.calculateStatistics(data);

      expect(stats.mean).toBe(3);
      expect(stats.median).toBe(3);
      expect(stats.min).toBe(1);
      expect(stats.max).toBe(5);
      expect(stats.count).toBe(5);
      expect(stats.validCount).toBe(5);
      expect(stats.standardDeviation).toBeCloseTo(Math.sqrt(2), 5);
    });

    it('should handle null values correctly', () => {
      const data = [1, 2, -999.25, 4, 5]; // -999.25 is null value
      const stats = engine.calculateStatistics(data, -999.25);

      expect(stats.mean).toBe(3); // (1+2+4+5)/4
      expect(stats.count).toBe(5);
      expect(stats.validCount).toBe(4);
    });

    it('should handle empty or all-null data', () => {
      const emptyData: number[] = [];
      const stats = engine.calculateStatistics(emptyData);

      expect(isNaN(stats.mean)).toBe(true);
      expect(stats.count).toBe(0);
      expect(stats.validCount).toBe(0);
    });

    it('should calculate percentiles correctly', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const stats = engine.calculateStatistics(data);

      expect(stats.percentiles.P10).toBeCloseTo(1.9, 1);
      expect(stats.percentiles.P50).toBe(5.5); // Median
      expect(stats.percentiles.P90).toBeCloseTo(9.1, 1);
    });
  });

  describe('Quality Metrics Calculation', () => {
    it('should calculate quality metrics for calculation results', () => {
      const inputData = [1, 2, 3, 4, 5];
      const outputData = [0.1, 0.2, 0.3, 0.4, 0.5];

      const metrics = engine.calculateQualityMetrics(
        inputData,
        outputData,
        'porosity',
        { matrixDensity: 2.65 }
      );

      expect(metrics.dataCompleteness).toBe(1.0);
      expect(metrics.confidenceLevel).toBe('high');
      expect(metrics.uncertaintyRange).toHaveLength(2);
    });

    it('should adjust uncertainty based on method type', () => {
      const inputData = [1, 2, 3, 4, 5];
      const outputData = [0.1, 0.2, 0.3, 0.4, 0.5];

      const porosityMetrics = engine.calculateQualityMetrics(
        inputData,
        outputData,
        'porosity',
        {}
      );

      const permeabilityMetrics = engine.calculateQualityMetrics(
        inputData,
        outputData,
        'permeability',
        {}
      );

      // Permeability should have higher uncertainty than porosity
      expect(permeabilityMetrics.uncertaintyRange[0]).toBeGreaterThan(
        porosityMetrics.uncertaintyRange[0]
      );
    });

    it('should lower confidence for incomplete data', () => {
      const inputData = [1, 2, -999.25, -999.25, 5]; // 60% completeness
      const outputData = [0.1, 0.2, -999.25, -999.25, 0.5];

      const metrics = engine.calculateQualityMetrics(
        inputData,
        outputData,
        'porosity',
        {},
      );

      expect(metrics.dataCompleteness).toBeLessThan(1.0);
      expect(metrics.confidenceLevel).toBe('low'); // 60% completeness results in 'low' confidence
    });
  });

  describe('Curve Data Access', () => {
    beforeEach(() => {
      engine.loadWellData(mockWellData);
    });

    it('should retrieve curve data by name', () => {
      const grCurve = engine.getCurveData('TEST-001', 'GR');
      
      expect(grCurve).toBeDefined();
      expect(grCurve?.name).toBe('GR');
      expect(grCurve?.unit).toBe('API');
      expect(grCurve?.data).toEqual([45, 50, 55, 60, 65]);
    });

    it('should handle case-insensitive curve names', () => {
      const grCurve = engine.getCurveData('TEST-001', 'gr');
      
      expect(grCurve).toBeDefined();
      expect(grCurve?.name).toBe('GR');
    });

    it('should return undefined for non-existent curve', () => {
      const nonExistentCurve = engine.getCurveData('TEST-001', 'NONEXISTENT');
      expect(nonExistentCurve).toBeUndefined();
    });

    it('should return undefined for non-existent well', () => {
      const curve = engine.getCurveData('NONEXISTENT-WELL', 'GR');
      expect(curve).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle exceptions during well data loading', () => {
      // Create malformed data that might cause exceptions
      const malformedData = {
        ...mockWellData,
        curves: null as any, // This should cause an error
      };

      const result = engine.loadWellData(malformedData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('data_error');
    });

    it('should provide meaningful error messages', () => {
      const invalidData = { ...mockWellData, wellName: '' };
      const result = engine.loadWellData(invalidData);
      
      expect(result.errors[0].message).toBe('Well name is required');
      expect(result.errors[0].severity).toBe('critical');
    });
  });

  describe('Cache Management', () => {
    it('should clear calculation cache', () => {
      // This is a basic test - more comprehensive cache testing would be added
      // when actual calculation methods are implemented
      expect(() => engine.clearCache()).not.toThrow();
    });
  });
});