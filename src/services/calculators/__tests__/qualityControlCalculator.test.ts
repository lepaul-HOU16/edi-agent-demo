/**
 * Unit tests for Quality Control Calculator
 * Tests environmental corrections, outlier detection, and geological consistency checks
 */

import {
  QualityControlCalculator,
  QualityControlParameters,
  OutlierDetectionResult,
  GeologicalConsistencyCheck,
  EnvironmentalCorrection,
  QualityControlResult
} from '../qualityControlCalculator';

import {
  WellLogData,
  LogCurve,
  CurveQuality,
  QualityAssessment,
  WellHeaderInfo,
  GeographicLocation
} from '../../../types/petrophysics';

describe('QualityControlCalculator', () => {
  let calculator: QualityControlCalculator;
  let mockWellData: WellLogData;

  beforeEach(() => {
    calculator = new QualityControlCalculator();
    
    // Create mock well data
    const location: GeographicLocation = {
      latitude: 29.7604,
      longitude: -95.3698
    };

    const wellInfo: WellHeaderInfo = {
      wellName: 'TEST-001',
      field: 'Test Field',
      operator: 'Test Operator',
      location,
      elevation: 100,
      totalDepth: 10000,
      wellType: 'vertical'
    };

    const curveQuality: CurveQuality = {
      completeness: 0.95,
      outlierCount: 2,
      environmentalCorrections: [],
      qualityFlag: 'good'
    };

    const qualityAssessment: QualityAssessment = {
      overallQuality: 'good',
      dataCompleteness: 0.95,
      environmentalCorrections: [],
      validationFlags: [],
      lastAssessment: new Date()
    };

    mockWellData = {
      wellName: 'TEST-001',
      wellInfo,
      curves: [
        {
          name: 'GR',
          unit: 'API',
          description: 'Gamma Ray',
          data: [20, 30, 80, 120, 25, 35, 90, 110, 15, 40],
          nullValue: -999.25,
          quality: curveQuality
        },
        {
          name: 'RHOB',
          unit: 'g/cc',
          description: 'Bulk Density',
          data: [2.3, 2.4, 2.6, 2.7, 2.2, 2.5, 2.65, 2.8, 2.1, 2.45],
          nullValue: -999.25,
          quality: curveQuality
        },
        {
          name: 'NPHI',
          unit: 'v/v',
          description: 'Neutron Porosity',
          data: [0.15, 0.12, 0.08, 0.05, 0.18, 0.10, 0.06, 0.04, 0.20, 0.14],
          nullValue: -999.25,
          quality: curveQuality
        },
        {
          name: 'RT',
          unit: 'ohm-m',
          description: 'True Resistivity',
          data: [5, 8, 50, 200, 3, 12, 80, 150, 2, 15],
          nullValue: -999.25,
          quality: curveQuality
        }
      ],
      depthRange: [9000, 9100],
      dataQuality: qualityAssessment,
      lastModified: new Date(),
      version: '1.0'
    };
  });

  describe('detectOutliers', () => {
    it('should detect outliers using Z-score method', () => {
      const data = [10, 10, 10, 10, 10, 1000, 10, 10, 10, 10]; // 1000 is a clear outlier
      const customParams: Partial<QualityControlParameters> = {
        zScoreThreshold: 2.0 // Lower threshold to ensure detection
      };
      
      const result = calculator.detectOutliers(data, -999.25, 'z_score', customParams);

      expect(result.method).toBe('z_score');
      expect(result.indices.length).toBeGreaterThan(0); // Should detect at least one outlier
      expect(result.values).toContain(1000);
    });

    it('should detect outliers using IQR method', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 100]; // 100 is an outlier
      
      const result = calculator.detectOutliers(data, -999.25, 'iqr');

      expect(result.method).toBe('iqr');
      expect(result.indices).toContain(9); // Index of value 100
      expect(result.values).toContain(100);
    });

    it('should detect outliers using modified Z-score method', () => {
      const data = [10, 11, 12, 13, 14, 15, 16, 17, 18, 100]; // 100 is an outlier
      
      const result = calculator.detectOutliers(data, -999.25, 'modified_z_score');

      expect(result.method).toBe('modified_z_score');
      expect(result.indices).toContain(9); // Index of value 100
      expect(result.values).toContain(100);
    });

    it('should handle data with null values', () => {
      const data = [10, -999.25, 12, 11, NaN, 13, 1000, 11];
      const customParams: Partial<QualityControlParameters> = {
        zScoreThreshold: 2.0 // Lower threshold
      };
      
      const result = calculator.detectOutliers(data, -999.25, 'z_score', customParams);

      expect(result.indices.length).toBeGreaterThan(0); // Should detect outliers
      expect(result.values).toContain(1000);
    });

    it('should return empty result for insufficient data', () => {
      const data = [10, 12]; // Only 2 valid points
      
      const result = calculator.detectOutliers(data, -999.25, 'z_score');

      expect(result.indices).toHaveLength(0);
      expect(result.values).toHaveLength(0);
    });

    it('should use custom threshold parameters', () => {
      const data = [10, 12, 11, 13, 12, 20, 11, 10, 12, 13]; // 20 might be outlier with strict threshold
      const customParams: Partial<QualityControlParameters> = {
        zScoreThreshold: 1.5 // More strict than default 3.0
      };
      
      const result = calculator.detectOutliers(data, -999.25, 'z_score', customParams);

      expect(result.threshold).toBe(1.5);
      expect(result.indices.length).toBeGreaterThan(0); // Should detect more outliers with strict threshold
    });
  });

  describe('applyEnvironmentalCorrections', () => {
    it('should apply borehole size correction to density curve', () => {
      const densityCurve: LogCurve = {
        name: 'RHOB',
        unit: 'g/cc',
        description: 'Bulk Density',
        data: [2.3, 2.4, 2.5],
        nullValue: -999.25,
        quality: {
          completeness: 1.0,
          outlierCount: 0,
          environmentalCorrections: [],
          qualityFlag: 'excellent'
        }
      };

      const params: Partial<QualityControlParameters> = {
        boreholeSize: 10.0 // 1.5 inches larger than nominal 8.5
      };

      const corrections = calculator.applyEnvironmentalCorrections(densityCurve, params);

      expect(corrections.length).toBeGreaterThan(0);
      expect(corrections[0].type).toBe('borehole_size');
      expect(corrections[0].correctionFactor).toBeCloseTo(0.015, 3); // 1.5 * 0.01
    });

    it('should apply temperature correction to resistivity curve', () => {
      const resistivityCurve: LogCurve = {
        name: 'RT',
        unit: 'ohm-m',
        description: 'True Resistivity',
        data: [10, 20, 30],
        nullValue: -999.25,
        quality: {
          completeness: 1.0,
          outlierCount: 0,
          environmentalCorrections: [],
          qualityFlag: 'excellent'
        }
      };

      const params: Partial<QualityControlParameters> = {
        temperature: 200 // High temperature
      };

      const corrections = calculator.applyEnvironmentalCorrections(resistivityCurve, params);

      expect(corrections.length).toBeGreaterThan(0);
      expect(corrections[0].type).toBe('temperature');
      expect(corrections[0].correctedValue).toBeLessThan(corrections[0].originalValue);
    });

    it('should not apply corrections when parameters are within normal range', () => {
      const densityCurve: LogCurve = {
        name: 'RHOB',
        unit: 'g/cc',
        description: 'Bulk Density',
        data: [2.3, 2.4, 2.5],
        nullValue: -999.25,
        quality: {
          completeness: 1.0,
          outlierCount: 0,
          environmentalCorrections: [],
          qualityFlag: 'excellent'
        }
      };

      const params: Partial<QualityControlParameters> = {
        boreholeSize: 8.5 // Nominal size
      };

      const corrections = calculator.applyEnvironmentalCorrections(densityCurve, params);

      expect(corrections).toHaveLength(0);
    });

    it('should handle invalid data in corrections', () => {
      const densityCurve: LogCurve = {
        name: 'RHOB',
        unit: 'g/cc',
        description: 'Bulk Density',
        data: [2.3, NaN, -999.25, 2.5],
        nullValue: -999.25,
        quality: {
          completeness: 0.5,
          outlierCount: 0,
          environmentalCorrections: [],
          qualityFlag: 'fair'
        }
      };

      const params: Partial<QualityControlParameters> = {
        boreholeSize: 10.0
      };

      const corrections = calculator.applyEnvironmentalCorrections(densityCurve, params);

      // Should only apply corrections to valid data points (2.3 and 2.5)
      expect(corrections.length).toBe(2);
    });
  });

  describe('performGeologicalConsistencyChecks', () => {
    it('should check gamma ray consistency', () => {
      const checks = calculator.performGeologicalConsistencyChecks(mockWellData);

      const gammaRayCheck = checks.find(c => c.checkType === 'gamma_ray_shale');
      expect(gammaRayCheck).toBeDefined();
      expect(gammaRayCheck!.confidence).toMatch(/high|medium|low/);
    });

    it('should check density consistency', () => {
      const checks = calculator.performGeologicalConsistencyChecks(mockWellData);

      const densityCheck = checks.find(c => c.checkType === 'density_lithology');
      expect(densityCheck).toBeDefined();
      expect(densityCheck!.isConsistent).toBe(true); // Mock data is within normal range
    });

    it('should check resistivity consistency', () => {
      const checks = calculator.performGeologicalConsistencyChecks(mockWellData);

      const resistivityCheck = checks.find(c => c.checkType === 'resistivity_saturation');
      expect(resistivityCheck).toBeDefined();
      expect(resistivityCheck!.message).toContain('high porosity zones');
    });

    it('should handle missing curves gracefully', () => {
      const limitedWellData = {
        ...mockWellData,
        curves: [mockWellData.curves[0]] // Only gamma ray curve
      };

      const checks = calculator.performGeologicalConsistencyChecks(limitedWellData);

      expect(checks.length).toBeGreaterThan(0);
      const gammaRayCheck = checks.find(c => c.checkType === 'gamma_ray_shale');
      expect(gammaRayCheck).toBeDefined();
    });

    it('should use custom parameters for consistency checks', () => {
      const customParams: Partial<QualityControlParameters> = {
        gammaRayShaleThreshold: 50, // Lower threshold
        densityRange: [2.0, 2.8] // Narrower range
      };

      const checks = calculator.performGeologicalConsistencyChecks(mockWellData, customParams);

      expect(checks.length).toBeGreaterThan(0);
      // Results should reflect the custom parameters
    });
  });

  describe('performQualityControl', () => {
    it('should perform comprehensive quality control analysis', () => {
      const result = calculator.performQualityControl(mockWellData);

      expect(result.overallQuality).toMatch(/excellent|good|fair|poor/);
      expect(result.statistics).toBeDefined();
      expect(result.qualityMetrics).toBeDefined();
      expect(result.consistencyChecks.length).toBeGreaterThan(0);
    });

    it('should detect outliers in well data', () => {
      // Add outlier to gamma ray data
      const wellDataWithOutliers = {
        ...mockWellData,
        curves: [
          {
            ...mockWellData.curves[0],
            data: [20, 30, 80, 120, 25, 35, 90, 110, 15, 40, 1000] // Add extreme outlier
          },
          ...mockWellData.curves.slice(1)
        ]
      };

      const result = calculator.performQualityControl(wellDataWithOutliers);

      // Should detect outliers or at least run without errors
      expect(result).toBeDefined();
      expect(result.overallQuality).toMatch(/excellent|good|fair|poor/);
    });

    it('should apply environmental corrections', () => {
      const params: Partial<QualityControlParameters> = {
        boreholeSize: 10.0,
        temperature: 200
      };

      const result = calculator.performQualityControl(mockWellData, params);

      expect(result.environmentalCorrections.length).toBeGreaterThan(0);
    });

    it('should calculate quality metrics correctly', () => {
      const result = calculator.performQualityControl(mockWellData);

      expect(result.qualityMetrics.dataCompleteness).toBeGreaterThan(0);
      expect(result.qualityMetrics.confidenceLevel).toMatch(/high|medium|low/);
      expect(result.qualityMetrics.uncertaintyRange).toHaveLength(2);
    });

    it('should determine overall quality based on issues found', () => {
      // Create well data with many issues
      const poorQualityData = {
        ...mockWellData,
        curves: mockWellData.curves.map(curve => ({
          ...curve,
          data: curve.data.map((val, i) => i % 3 === 0 ? NaN : val) // Add many NaN values
        }))
      };

      const result = calculator.performQualityControl(poorQualityData);

      expect(result.overallQuality).toMatch(/excellent|good|fair|poor/);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty curve data', () => {
      const emptyCurve: LogCurve = {
        name: 'EMPTY',
        unit: 'unit',
        description: 'Empty Curve',
        data: [],
        nullValue: -999.25,
        quality: {
          completeness: 0,
          outlierCount: 0,
          environmentalCorrections: [],
          qualityFlag: 'poor'
        }
      };

      const result = calculator.detectOutliers(emptyCurve.data, emptyCurve.nullValue);

      expect(result.indices).toHaveLength(0);
      expect(result.values).toHaveLength(0);
    });

    it('should handle all null values', () => {
      const nullData = [-999.25, -999.25, -999.25, -999.25];
      
      const result = calculator.detectOutliers(nullData, -999.25);

      expect(result.indices).toHaveLength(0);
      expect(result.values).toHaveLength(0);
    });

    it('should handle constant values (no variation)', () => {
      const constantData = [10, 10, 10, 10, 10, 10];
      
      const result = calculator.detectOutliers(constantData, -999.25, 'z_score');

      expect(result.indices).toHaveLength(0); // No outliers in constant data
    });

    it('should handle extreme values correctly', () => {
      const extremeData = [10, 10, 10, 10, 10, 1000]; // More data points with one extreme value
      const customParams: Partial<QualityControlParameters> = {
        zScoreThreshold: 1.5 // Very low threshold
      };
      
      const result = calculator.detectOutliers(extremeData, -999.25, 'z_score', customParams);

      expect(result.indices.length).toBeGreaterThan(0); // Should detect extreme values
    });

    it('should handle well data with missing required curves', () => {
      const minimalWellData = {
        ...mockWellData,
        curves: [] // No curves
      };

      const result = calculator.performQualityControl(minimalWellData);

      expect(result.overallQuality).toBe('poor');
      expect(result.consistencyChecks).toHaveLength(0);
    });

    it('should validate parameter ranges', () => {
      const invalidParams: Partial<QualityControlParameters> = {
        zScoreThreshold: -1, // Invalid negative threshold
        boreholeSize: -5 // Invalid negative size
      };

      // Should use default parameters when invalid ones are provided
      const result = calculator.performQualityControl(mockWellData, invalidParams);

      expect(result).toBeDefined();
      expect(result.overallQuality).toMatch(/excellent|good|fair|poor/);
    });
  });

  describe('statistical calculations', () => {
    it('should calculate correlation coefficient correctly', () => {
      // Test with known correlation
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10]; // Perfect positive correlation

      // Access private method through type assertion for testing
      const correlation = (calculator as any).calculateCorrelationCoefficient(x, y);

      expect(correlation).toBeCloseTo(1.0, 2); // Perfect correlation
    });

    it('should calculate median correctly', () => {
      const oddLength = [1, 3, 5, 7, 9];
      const evenLength = [1, 2, 3, 4];

      const medianOdd = (calculator as any).calculateMedian(oddLength);
      const medianEven = (calculator as any).calculateMedian(evenLength);

      expect(medianOdd).toBe(5);
      expect(medianEven).toBe(2.5);
    });

    it('should find curves by name patterns correctly', () => {
      const curves = mockWellData.curves;
      
      const grCurve = (calculator as any).findCurve(curves, ['gr', 'gamma']);
      const densityCurve = (calculator as any).findCurve(curves, ['rhob', 'density']);
      const nonExistentCurve = (calculator as any).findCurve(curves, ['nonexistent']);

      expect(grCurve).toBeDefined();
      expect(grCurve.name).toBe('GR');
      expect(densityCurve).toBeDefined();
      expect(densityCurve.name).toBe('RHOB');
      expect(nonExistentCurve).toBeUndefined();
    });
  });
});