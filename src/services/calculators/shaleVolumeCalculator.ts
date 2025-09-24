/**
 * Shale Volume Calculation Module
 * Implements industry-standard shale volume calculation methods
 * Based on requirements 2.4, 2.5, 2.6, 2.7
 */

import {
  CalculationRequest,
  CalculationResult,
  CalculationParameters,
  CalculationError,
  ValidationResult,
  QualityMetrics,
  StatisticalSummary,
  LogCurve,
  ShaleVolumeMethod
} from '../../types/petrophysics';

export interface ShaleVolumeCalculationRequest extends CalculationRequest {
  method: ShaleVolumeMethod;
  inputCurves: {
    gr: LogCurve;     // Gamma ray curve
    depth: LogCurve;  // Depth curve
  };
}

export interface ShaleVolumeCalculationParameters extends CalculationParameters {
  grClean: number;  // Clean sand gamma ray value (API units)
  grShale: number;  // Shale gamma ray value (API units)
}

/**
 * Shale Volume Calculator Class
 * Provides multiple shale volume calculation methods with validation and quality control
 */
export class ShaleVolumeCalculator {
  private defaultParameters: ShaleVolumeCalculationParameters = {
    grClean: 25,   // Typical clean sand GR value
    grShale: 150,  // Typical shale GR value
  };

  /**
   * Calculate Gamma Ray Index (IGR) from gamma ray log
   * Formula: IGR = (GR - GRclean) / (GRshale - GRclean)
   */
  private calculateGammaRayIndex(
    grData: number[],
    grClean: number,
    grShale: number
  ): number[] {
    return grData.map(gr => {
      // Handle null values
      if (gr === -999.25 || isNaN(gr) || !isFinite(gr)) {
        return -999.25;
      }

      // Validate input range (typical GR range: 0 - 300 API)
      if (gr < 0 || gr > 500) {
        return -999.25;
      }

      // Calculate IGR
      const igr = (gr - grClean) / (grShale - grClean);

      // Clamp IGR to valid range [0, 1]
      return Math.max(0, Math.min(1, igr));
    });
  }

  /**
   * Calculate shale volume using Larionov method for Tertiary rocks
   * Formula: Vsh = 0.083 * (2^(3.7 * IGR) - 1)
   */
  public calculateLarionovTertiary(
    grData: number[],
    parameters?: Partial<ShaleVolumeCalculationParameters>
  ): number[] {
    const params = { ...this.defaultParameters, ...parameters };
    const { grClean, grShale } = params;

    const igrData = this.calculateGammaRayIndex(grData, grClean, grShale);

    return igrData.map(igr => {
      // Handle null values
      if (igr === -999.25) {
        return -999.25;
      }

      // Larionov Tertiary formula: Vsh = 0.083 * (2^(3.7 * IGR) - 1)
      const vsh = 0.083 * (Math.pow(2, 3.7 * igr) - 1);

      // Clamp to valid range [0, 1]
      return Math.max(0, Math.min(1, vsh));
    });
  }

  /**
   * Calculate shale volume using Larionov method for Pre-Tertiary rocks
   * Formula: Vsh = 0.33 * (2^(2 * IGR) - 1)
   */
  public calculateLarionovPreTertiary(
    grData: number[],
    parameters?: Partial<ShaleVolumeCalculationParameters>
  ): number[] {
    const params = { ...this.defaultParameters, ...parameters };
    const { grClean, grShale } = params;

    const igrData = this.calculateGammaRayIndex(grData, grClean, grShale);

    return igrData.map(igr => {
      // Handle null values
      if (igr === -999.25) {
        return -999.25;
      }

      // Larionov Pre-Tertiary formula: Vsh = 0.33 * (2^(2 * IGR) - 1)
      const vsh = 0.33 * (Math.pow(2, 2 * igr) - 1);

      // Clamp to valid range [0, 1]
      return Math.max(0, Math.min(1, vsh));
    });
  }

  /**
   * Calculate shale volume using Linear method
   * Formula: Vsh = IGR
   */
  public calculateLinear(
    grData: number[],
    parameters?: Partial<ShaleVolumeCalculationParameters>
  ): number[] {
    const params = { ...this.defaultParameters, ...parameters };
    const { grClean, grShale } = params;

    const igrData = this.calculateGammaRayIndex(grData, grClean, grShale);

    return igrData.map(igr => {
      // Handle null values
      if (igr === -999.25) {
        return -999.25;
      }

      // Linear method: Vsh = IGR (already clamped in calculateGammaRayIndex)
      return igr;
    });
  }

  /**
   * Calculate shale volume using Clavier method
   * Formula: Vsh = 1.7 - sqrt(3.38 - (IGR + 0.7)^2)
   */
  public calculateClavier(
    grData: number[],
    parameters?: Partial<ShaleVolumeCalculationParameters>
  ): number[] {
    const params = { ...this.defaultParameters, ...parameters };
    const { grClean, grShale } = params;

    const igrData = this.calculateGammaRayIndex(grData, grClean, grShale);

    return igrData.map(igr => {
      // Handle null values
      if (igr === -999.25) {
        return -999.25;
      }

      // Clavier formula: Vsh = 1.7 - sqrt(3.38 - (IGR + 0.7)^2)
      const term = 3.38 - Math.pow(igr + 0.7, 2);
      
      // Check if the term under square root is negative
      if (term < 0) {
        return -999.25;
      }

      const vsh = 1.7 - Math.sqrt(term);

      // Clamp to valid range [0, 1]
      return Math.max(0, Math.min(1, vsh));
    });
  }

  /**
   * Main shale volume calculation method that handles different methods
   */
  public calculateShaleVolume(request: ShaleVolumeCalculationRequest): CalculationResult {
    const { method, inputCurves, parameters, depthRange } = request;
    const calcParams = { ...this.defaultParameters, ...parameters };

    let values: number[] = [];
    let methodology = '';

    try {
      switch (method) {
        case 'larionov_tertiary':
          values = this.calculateLarionovTertiary(inputCurves.gr.data, calcParams);
          methodology = `Larionov Tertiary: Vsh = 0.083 * (2^(3.7 * IGR) - 1), where IGR = (GR - ${calcParams.grClean}) / (${calcParams.grShale} - ${calcParams.grClean})`;
          break;

        case 'larionov_pre_tertiary':
          values = this.calculateLarionovPreTertiary(inputCurves.gr.data, calcParams);
          methodology = `Larionov Pre-Tertiary: Vsh = 0.33 * (2^(2 * IGR) - 1), where IGR = (GR - ${calcParams.grClean}) / (${calcParams.grShale} - ${calcParams.grClean})`;
          break;

        case 'linear':
          values = this.calculateLinear(inputCurves.gr.data, calcParams);
          methodology = `Linear: Vsh = IGR, where IGR = (GR - ${calcParams.grClean}) / (${calcParams.grShale} - ${calcParams.grClean})`;
          break;

        case 'clavier':
          values = this.calculateClavier(inputCurves.gr.data, calcParams);
          methodology = `Clavier: Vsh = 1.7 - sqrt(3.38 - (IGR + 0.7)^2), where IGR = (GR - ${calcParams.grClean}) / (${calcParams.grShale} - ${calcParams.grClean})`;
          break;

        default:
          throw new Error(`Unsupported shale volume method: ${method}`);
      }

      // Apply depth range filter if specified
      let depths = inputCurves.depth.data;
      if (depthRange) {
        const filteredIndices = depths
          .map((depth, index) => ({ depth, index }))
          .filter(({ depth }) => depth >= depthRange[0] && depth <= depthRange[1])
          .map(({ index }) => index);

        depths = filteredIndices.map(i => depths[i]);
        values = filteredIndices.map(i => values[i]);
      }

      // Calculate uncertainty (±5% for shale volume calculations)
      const baseUncertainty = 0.05;
      const uncertainty = values.map(val => 
        val === -999.25 ? -999.25 : Math.abs(val * baseUncertainty)
      );

      // Calculate statistics
      const statistics = this.calculateStatistics(values);

      // Calculate quality metrics
      const quality = this.calculateQualityMetrics(values, method, inputCurves.gr);

      return {
        values,
        depths,
        uncertainty,
        quality,
        methodology,
        parameters: calcParams,
        statistics,
        timestamp: new Date(),
      };

    } catch (error) {
      throw new Error(`Shale volume calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate shale volume calculation parameters
   */
  public validateParameters(parameters: ShaleVolumeCalculationParameters): ValidationResult {
    const errors: CalculationError[] = [];
    const warnings: CalculationError[] = [];

    // Validate GR clean value
    if (parameters.grClean < 0 || parameters.grClean > 200) {
      errors.push({
        type: 'parameter_error',
        severity: 'major',
        message: 'Clean sand GR value must be between 0 and 200 API',
        suggestedFix: 'Use typical values: 15-50 API for clean sands',
      });
    }

    // Validate GR shale value
    if (parameters.grShale < 50 || parameters.grShale > 500) {
      errors.push({
        type: 'parameter_error',
        severity: 'major',
        message: 'Shale GR value must be between 50 and 500 API',
        suggestedFix: 'Use typical values: 100-200 API for shales',
      });
    }

    // Check that GR shale > GR clean
    if (parameters.grShale <= parameters.grClean) {
      errors.push({
        type: 'parameter_error',
        severity: 'critical',
        message: 'Shale GR value must be greater than clean sand GR value',
        suggestedFix: 'Ensure GRshale > GRclean for valid IGR calculation',
      });
    }

    // Check for reasonable separation
    const separation = parameters.grShale - parameters.grClean;
    if (separation < 20) {
      warnings.push({
        type: 'parameter_error',
        severity: 'minor',
        message: 'Small GR separation between clean and shale may reduce calculation accuracy',
        suggestedFix: 'Consider using local GR values with larger separation (>50 API)',
      });
    }

    // Check for typical ranges
    if (parameters.grClean > 75) {
      warnings.push({
        type: 'parameter_error',
        severity: 'minor',
        message: 'Clean sand GR value is higher than typical (>75 API)',
        suggestedFix: 'Verify clean sand baseline from log analysis',
      });
    }

    if (parameters.grShale < 100) {
      warnings.push({
        type: 'parameter_error',
        severity: 'minor',
        message: 'Shale GR value is lower than typical (<100 API)',
        suggestedFix: 'Verify shale baseline from log analysis',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      corrections: [],
    };
  }

  /**
   * Calculate statistical summary for shale volume data
   */
  private calculateStatistics(data: number[]): StatisticalSummary {
    const validData = data.filter(val => val !== -999.25 && !isNaN(val) && isFinite(val));

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

    const percentiles: { [key: string]: number } = {};
    [10, 25, 50, 75, 90].forEach(p => {
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
   * Calculate quality metrics for shale volume calculations
   */
  private calculateQualityMetrics(
    values: number[],
    method: ShaleVolumeMethod,
    grCurve: LogCurve
  ): QualityMetrics {
    const validCount = values.filter(val => val !== -999.25 && !isNaN(val) && isFinite(val)).length;
    const dataCompleteness = validCount / values.length;

    // Method-specific uncertainty ranges
    const uncertaintyRanges: { [key in ShaleVolumeMethod]: [number, number] } = {
      larionov_tertiary: [0.05, 0.10],     // ±5-10% for Larionov Tertiary
      larionov_pre_tertiary: [0.05, 0.10], // ±5-10% for Larionov Pre-Tertiary
      linear: [0.10, 0.15],                 // ±10-15% for Linear (less accurate)
      clavier: [0.05, 0.08],                // ±5-8% for Clavier
    };

    let uncertaintyRange = uncertaintyRanges[method];

    // Adjust uncertainty based on data completeness and GR curve quality
    if (dataCompleteness < 0.8 || grCurve.quality.qualityFlag === 'poor') {
      uncertaintyRange = [uncertaintyRange[0] * 1.5, uncertaintyRange[1] * 1.5];
    }

    const confidenceLevel: 'high' | 'medium' | 'low' = 
      dataCompleteness > 0.9 && grCurve.quality.qualityFlag === 'excellent' ? 'high' :
      dataCompleteness > 0.7 && grCurve.quality.qualityFlag !== 'poor' ? 'medium' : 'low';

    return {
      dataCompleteness,
      environmentalCorrections: grCurve.quality.environmentalCorrections,
      uncertaintyRange,
      confidenceLevel,
      validationNotes: `Shale volume calculated using ${method} method with GR curve quality: ${grCurve.quality.qualityFlag}`,
    };
  }
}