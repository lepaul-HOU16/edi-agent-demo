/**
 * Enhanced Petrophysical Calculation Engine
 * Provides foundation for industry-standard petrophysical calculations
 * Based on requirements 2.1, 2.2, 6.1, 6.2
 */

import {
  WellLogData,
  LogCurve,
  CalculationRequest,
  CalculationResult,
  CalculationResults,
  CalculationParameters,
  CalculationError,
  ValidationResult,
  QualityMetrics,
  StatisticalSummary,
  CalculationEngineConfig,
  AppliedCorrection,
  PorosityMethod,
  ShaleVolumeMethod,
  SaturationMethod,
  PermeabilityMethod
} from '../types/petrophysics';

/**
 * Base Petrophysical Calculation Engine
 * Provides core functionality for petrophysical calculations with error handling and validation
 */
export class PetrophysicsCalculationEngine {
  private config: CalculationEngineConfig;
  private wellData: Map<string, WellLogData>;
  private calculationCache: Map<string, CalculationResults>;

  constructor(config?: Partial<CalculationEngineConfig>) {
    this.config = {
      enableValidation: true,
      enableUncertaintyCalculation: true,
      defaultParameters: {
        matrixDensity: 2.65,
        fluidDensity: 1.0,
        a: 1.0,
        m: 2.0,
        n: 2.0,
      },
      qualityThresholds: {
        dataCompleteness: 0.8,
        uncertaintyMax: 0.3,
      },
      ...config,
    };

    this.wellData = new Map();
    this.calculationCache = new Map();
  }

  /**
   * Load well log data into the engine
   */
  public loadWellData(wellData: WellLogData): ValidationResult {
    try {
      const validation = this.validateWellData(wellData);
      
      if (validation.isValid || validation.errors.length === 0) {
        this.wellData.set(wellData.wellName, wellData);
      }

      return validation;
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          type: 'data_error',
          severity: 'critical',
          message: `Failed to load well data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        warnings: [],
        corrections: [],
      };
    }
  }

  /**
   * Validate well log data for completeness and quality
   */
  private validateWellData(wellData: WellLogData): ValidationResult {
    const errors: CalculationError[] = [];
    const warnings: CalculationError[] = [];
    const corrections: AppliedCorrection[] = [];

    // Check basic data structure
    if (!wellData.wellName || wellData.wellName.trim() === '') {
      errors.push({
        type: 'data_error',
        severity: 'critical',
        message: 'Well name is required',
      });
    }

    if (!wellData.curves || wellData.curves.length === 0) {
      errors.push({
        type: 'data_error',
        severity: 'critical',
        message: 'No log curves found in well data',
      });
    }

    // Validate depth range
    if (wellData.depthRange[0] >= wellData.depthRange[1]) {
      errors.push({
        type: 'data_error',
        severity: 'major',
        message: 'Invalid depth range: start depth must be less than end depth',
      });
    }

    // Check for required curves (basic validation)
    const curveNames = wellData.curves.map(curve => curve.name.toLowerCase());
    const requiredCurves = ['dept', 'depth']; // At least depth curve required
    
    const hasDepthCurve = requiredCurves.some(req => 
      curveNames.some(name => name.includes(req))
    );

    if (!hasDepthCurve) {
      errors.push({
        type: 'data_error',
        severity: 'critical',
        message: 'Depth curve is required for calculations',
      });
    }

    // Validate individual curves
    wellData.curves.forEach((curve, index) => {
      if (!curve.name || curve.name.trim() === '') {
        errors.push({
          type: 'data_error',
          severity: 'major',
          message: `Curve at index ${index} has no name`,
        });
      }

      if (!curve.data || curve.data.length === 0) {
        warnings.push({
          type: 'data_error',
          severity: 'minor',
          message: `Curve '${curve.name}' has no data`,
        });
      }

      // Check data completeness
      if (curve.data && curve.data.length > 0) {
        const validDataCount = curve.data.filter(val => 
          val !== curve.nullValue && !isNaN(val) && isFinite(val)
        ).length;
        
        const completeness = validDataCount / curve.data.length;
        
        if (completeness < this.config.qualityThresholds.dataCompleteness) {
          warnings.push({
            type: 'data_error',
            severity: 'minor',
            message: `Curve '${curve.name}' has low data completeness: ${(completeness * 100).toFixed(1)}%`,
          });
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      corrections,
    };
  }

  /**
   * Validate calculation parameters
   */
  public validateCalculationParameters(
    method: string,
    parameters: CalculationParameters
  ): ValidationResult {
    const errors: CalculationError[] = [];
    const warnings: CalculationError[] = [];

    // Validate porosity parameters
    if (method.includes('porosity') || method.includes('density')) {
      if (parameters.matrixDensity !== undefined) {
        if (parameters.matrixDensity <= 0 || parameters.matrixDensity > 5) {
          errors.push({
            type: 'parameter_error',
            severity: 'major',
            message: 'Matrix density must be between 0 and 5 g/cc',
          });
        }
      }

      if (parameters.fluidDensity !== undefined) {
        if (parameters.fluidDensity <= 0 || parameters.fluidDensity > 2) {
          errors.push({
            type: 'parameter_error',
            severity: 'major',
            message: 'Fluid density must be between 0 and 2 g/cc',
          });
        }
      }
    }

    // Validate Archie parameters
    if (method.includes('archie') || method.includes('saturation')) {
      if (parameters.a !== undefined && (parameters.a <= 0 || parameters.a > 5)) {
        warnings.push({
          type: 'parameter_error',
          severity: 'minor',
          message: 'Tortuosity factor (a) outside typical range (0.5-2.0)',
        });
      }

      if (parameters.m !== undefined && (parameters.m < 1 || parameters.m > 4)) {
        warnings.push({
          type: 'parameter_error',
          severity: 'minor',
          message: 'Cementation exponent (m) outside typical range (1.5-2.5)',
        });
      }

      if (parameters.n !== undefined && (parameters.n < 1 || parameters.n > 4)) {
        warnings.push({
          type: 'parameter_error',
          severity: 'minor',
          message: 'Saturation exponent (n) outside typical range (1.5-2.5)',
        });
      }

      if (parameters.rw !== undefined && (parameters.rw <= 0 || parameters.rw > 100)) {
        errors.push({
          type: 'parameter_error',
          severity: 'major',
          message: 'Formation water resistivity (Rw) must be between 0 and 100 ohm-m',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      corrections: [],
    };
  }

  /**
   * Calculate statistical summary for a data array
   */
  public calculateStatistics(data: number[], nullValue: number = -999.25): StatisticalSummary {
    // Filter out null values and invalid numbers
    const validData = data.filter(val => 
      val !== nullValue && !isNaN(val) && isFinite(val)
    );

    if (validData.length === 0) {
      return {
        mean: NaN,
        median: NaN,
        standardDeviation: NaN,
        min: NaN,
        max: NaN,
        percentiles: {},
        count: data.length,
        validCount: 0,
      };
    }

    const sortedData = [...validData].sort((a, b) => a - b);
    const mean = validData.reduce((sum, val) => sum + val, 0) / validData.length;
    
    const variance = validData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / validData.length;
    const standardDeviation = Math.sqrt(variance);

    // Calculate percentiles
    const percentiles: { [key: string]: number } = {};
    const percentileValues = [10, 25, 50, 75, 90];
    
    percentileValues.forEach(p => {
      const index = (p / 100) * (sortedData.length - 1);
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      
      if (lower === upper) {
        percentiles[`P${p}`] = sortedData[lower];
      } else {
        const weight = index - lower;
        percentiles[`P${p}`] = sortedData[lower] * (1 - weight) + sortedData[upper] * weight;
      }
    });

    return {
      mean,
      median: percentiles.P50,
      standardDeviation,
      min: sortedData[0],
      max: sortedData[sortedData.length - 1],
      percentiles,
      count: data.length,
      validCount: validData.length,
    };
  }

  /**
   * Calculate quality metrics for calculation results
   */
  public calculateQualityMetrics(
    inputData: number[],
    outputData: number[],
    method: string,
    parameters: CalculationParameters
  ): QualityMetrics {
    const inputStats = this.calculateStatistics(inputData);
    const outputStats = this.calculateStatistics(outputData);

    const dataCompleteness = Math.min(
      inputStats.validCount / inputStats.count,
      outputStats.validCount / outputStats.count
    );

    // Estimate uncertainty based on method and data quality
    let uncertaintyRange: [number, number] = [0.05, 0.15]; // Default 5-15%

    // Method-specific uncertainty estimates
    if (method.includes('porosity')) {
      uncertaintyRange = [0.02, 0.05]; // ±2-5% for porosity
    } else if (method.includes('saturation')) {
      uncertaintyRange = [0.10, 0.20]; // ±10-20% for saturation
    } else if (method.includes('permeability')) {
      uncertaintyRange = [0.30, 0.70]; // ±30-70% for permeability
    }

    // Adjust uncertainty based on data completeness
    if (dataCompleteness < 0.8) {
      uncertaintyRange = [uncertaintyRange[0] * 1.5, uncertaintyRange[1] * 1.5];
    }

    const confidenceLevel: 'high' | 'medium' | 'low' = 
      dataCompleteness > 0.9 ? 'high' :
      dataCompleteness > 0.7 ? 'medium' : 'low';

    return {
      dataCompleteness,
      environmentalCorrections: [], // To be populated by specific calculation methods
      uncertaintyRange,
      confidenceLevel,
    };
  }

  /**
   * Get well data by name
   */
  public getWellData(wellName: string): WellLogData | undefined {
    return this.wellData.get(wellName);
  }

  /**
   * Get curve data by name from a well
   */
  public getCurveData(wellName: string, curveName: string): LogCurve | undefined {
    const well = this.wellData.get(wellName);
    if (!well) return undefined;

    return well.curves.find(curve => 
      curve.name.toLowerCase() === curveName.toLowerCase()
    );
  }

  /**
   * Clear calculation cache
   */
  public clearCache(): void {
    this.calculationCache.clear();
  }

  /**
   * Get engine configuration
   */
  public getConfig(): CalculationEngineConfig {
    return { ...this.config };
  }

  /**
   * Update engine configuration
   */
  public updateConfig(newConfig: Partial<CalculationEngineConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * Default instance of the calculation engine
 */
export const petrophysicsEngine = new PetrophysicsCalculationEngine();