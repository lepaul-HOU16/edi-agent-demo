/**
 * Permeability Estimation Module
 * Implements industry-standard permeability estimation methods
 * Based on requirements 2.10, 2.11
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
  PermeabilityMethod
} from '../../types/petrophysics';

export interface PermeabilityCalculationRequest extends CalculationRequest {
  method: PermeabilityMethod;
  inputCurves: {
    porosity: LogCurve;  // Porosity curve (effective porosity)
    swi?: LogCurve;      // Irreducible water saturation curve (for Timur)
    depth: LogCurve;     // Depth curve
  };
}

export interface PermeabilityCalculationParameters extends CalculationParameters {
  grainSize: number;  // Average grain size in microns (for Kozeny-Carman)
  swi: number;        // Irreducible water saturation (for Timur)
  // Coates-Dumanoir parameters
  c?: number;         // Coates-Dumanoir coefficient
  x?: number;         // Coates-Dumanoir porosity exponent
  y?: number;         // Coates-Dumanoir saturation exponent
}

/**
 * Permeability Calculator Class
 * Provides multiple permeability estimation methods with validation and quality control
 */
export class PermeabilityCalculator {
  private defaultParameters: PermeabilityCalculationParameters = {
    grainSize: 100,    // Average grain size in microns
    swi: 0.2,          // Irreducible water saturation
    c: 10000,          // Coates-Dumanoir coefficient
    x: 4.0,            // Coates-Dumanoir porosity exponent
    y: 2.0,            // Coates-Dumanoir saturation exponent
  };

  /**
   * Calculate permeability using Kozeny-Carman equation
   * Formula: k = (φ³ / (1-φ)²) * (d²/180)
   * Where: k = permeability (mD), φ = porosity (fraction), d = grain size (microns)
   * Note: This formula includes unit conversion factors
   */
  public calculateKozenyCarman(
    porosityData: number[],
    parameters?: Partial<PermeabilityCalculationParameters>
  ): number[] {
    const params = { ...this.defaultParameters, ...parameters };
    const { grainSize } = params;

    return porosityData.map(porosity => {
      // Handle null values
      if (porosity === -999.25 || isNaN(porosity) || !isFinite(porosity)) {
        return -999.25;
      }

      // Validate input range (porosity should be between 0 and 1)
      if (porosity <= 0 || porosity >= 1) {
        return -999.25;
      }

      // Kozeny-Carman equation: k = (φ³ / (1-φ)²) * (d²/180)
      // Convert grain size from microns to cm and apply unit conversions
      const grainSizeCm = grainSize * 1e-4; // microns to cm
      const porosityTerm = Math.pow(porosity, 3) / Math.pow(1 - porosity, 2);
      const grainTerm = Math.pow(grainSizeCm, 2) / 180;
      
      // Result in cm², convert to mD (1 cm² = 1.013e9 mD)
      const permeabilityCm2 = porosityTerm * grainTerm;
      const permeabilityMd = permeabilityCm2 * 1.013e9;

      // Validate result (should be positive and reasonable)
      if (permeabilityMd <= 0 || permeabilityMd > 1e6) {
        return -999.25;
      }

      return permeabilityMd;
    });
  }

  /**
   * Calculate permeability using Timur correlation
   * Formula: k = 0.136 * (φ^4.4 / Swi^2)
   * Where: k = permeability (mD), φ = porosity (fraction), Swi = irreducible water saturation
   */
  public calculateTimur(
    porosityData: number[],
    swiData?: number[],
    parameters?: Partial<PermeabilityCalculationParameters>
  ): number[] {
    const params = { ...this.defaultParameters, ...parameters };
    const { swi: defaultSwi } = params;

    return porosityData.map((porosity, index) => {
      // Use provided Swi data or default value
      const swi = swiData ? swiData[index] : defaultSwi;

      // Handle null values
      if (porosity === -999.25 || (swiData && swi === -999.25) ||
          isNaN(porosity) || (swiData && isNaN(swi)) ||
          !isFinite(porosity) || (swiData && !isFinite(swi))) {
        return -999.25;
      }

      // Validate input ranges
      if (porosity <= 0 || porosity >= 1 || swi <= 0 || swi >= 1) {
        return -999.25;
      }

      // Timur correlation: k = 0.136 * (φ^4.4 / Swi^2)
      const permeability = 0.136 * (Math.pow(porosity, 4.4) / Math.pow(swi, 2));

      // Validate result (should be positive and reasonable)
      if (permeability <= 0 || permeability > 1e6) {
        return -999.25;
      }

      return permeability;
    });
  }

  /**
   * Calculate permeability using Coates-Dumanoir correlation
   * Formula: k = C * (φ^x / Swi^y)
   * Default: k = 10000 * (φ^4 / Swi^2)
   */
  public calculateCoatesDumanoir(
    porosityData: number[],
    swiData?: number[],
    parameters?: Partial<PermeabilityCalculationParameters>
  ): number[] {
    const params = { ...this.defaultParameters, ...parameters };
    const { swi: defaultSwi, c, x, y } = params;

    return porosityData.map((porosity, index) => {
      // Use provided Swi data or default value
      const swi = swiData ? swiData[index] : defaultSwi;

      // Handle null values
      if (porosity === -999.25 || (swiData && swi === -999.25) ||
          isNaN(porosity) || (swiData && isNaN(swi)) ||
          !isFinite(porosity) || (swiData && !isFinite(swi))) {
        return -999.25;
      }

      // Validate input ranges
      if (porosity <= 0 || porosity >= 1 || swi <= 0 || swi >= 1) {
        return -999.25;
      }

      // Coates-Dumanoir correlation: k = C * (φ^x / Swi^y)
      const permeability = (c || 10000) * (Math.pow(porosity, x || 4.0) / Math.pow(swi, y || 2.0));

      // Validate result (should be positive and reasonable)
      if (permeability <= 0 || permeability > 1e6) {
        return -999.25;
      }

      return permeability;
    });
  }

  /**
   * Main permeability calculation method that handles different methods
   */
  public calculatePermeability(request: PermeabilityCalculationRequest): CalculationResult {
    const { method, inputCurves, parameters, depthRange } = request;
    const calcParams = { ...this.defaultParameters, ...parameters };

    let values: number[] = [];
    let methodology = '';
    let requiredCurves: string[] = [];

    try {
      switch (method) {
        case 'kozeny_carman':
          values = this.calculateKozenyCarman(inputCurves.porosity.data, calcParams);
          methodology = `Kozeny-Carman: k = (φ³ / (1-φ)²) * (d²/180), where d = ${calcParams.grainSize} microns`;
          requiredCurves = ['POROSITY'];
          break;

        case 'timur':
          const swiData = inputCurves.swi?.data;
          values = this.calculateTimur(inputCurves.porosity.data, swiData, calcParams);
          methodology = swiData 
            ? `Timur: k = 0.136 * (φ^4.4 / Swi^2) using log-derived Swi`
            : `Timur: k = 0.136 * (φ^4.4 / Swi^2) with constant Swi = ${calcParams.swi}`;
          requiredCurves = swiData ? ['POROSITY', 'SWI'] : ['POROSITY'];
          break;

        case 'coates_dumanoir':
          const swiDataCD = inputCurves.swi?.data;
          values = this.calculateCoatesDumanoir(inputCurves.porosity.data, swiDataCD, calcParams);
          methodology = swiDataCD
            ? `Coates-Dumanoir: k = ${calcParams.c} * (φ^${calcParams.x} / Swi^${calcParams.y}) using log-derived Swi`
            : `Coates-Dumanoir: k = ${calcParams.c} * (φ^${calcParams.x} / Swi^${calcParams.y}) with constant Swi = ${calcParams.swi}`;
          requiredCurves = swiDataCD ? ['POROSITY', 'SWI'] : ['POROSITY'];
          break;

        default:
          throw new Error(`Unsupported permeability method: ${method}`);
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

      // Calculate uncertainty and quality metrics
      const { uncertainty, quality } = this.calculateUncertaintyAndQuality(values, method, requiredCurves);

      // Calculate statistics
      const statistics = this.calculateStatistics(values);

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
      throw new Error(`Permeability calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate uncertainty and quality metrics for permeability calculations
   */
  private calculateUncertaintyAndQuality(
    values: number[],
    method: PermeabilityMethod,
    requiredCurves: string[]
  ): { uncertainty: number[], quality: QualityMetrics } {
    const validCount = values.filter(val => val !== -999.25 && !isNaN(val) && isFinite(val)).length;
    const dataCompleteness = validCount / values.length;

    // Method-specific uncertainty ranges (permeability has high uncertainty)
    const uncertaintyRanges: { [key in PermeabilityMethod]: [number, number] } = {
      kozeny_carman: [0.50, 0.70],    // ±50-70% for Kozeny-Carman
      timur: [0.30, 0.50],            // ±30-50% for Timur correlation
      coates_dumanoir: [0.30, 0.50],  // ±30-50% for Coates-Dumanoir
    };

    let uncertaintyRange = uncertaintyRanges[method];

    // Adjust uncertainty based on data completeness
    if (dataCompleteness < 0.8) {
      uncertaintyRange = [uncertaintyRange[0] * 1.2, uncertaintyRange[1] * 1.2];
    }

    // Calculate uncertainty values (geometric mean for log-normal distribution)
    const uncertainty = values.map(val => {
      if (val === -999.25) return -999.25;
      // Use geometric uncertainty for permeability (log-normal distribution)
      return val * uncertaintyRange[1]; // Upper bound of uncertainty
    });

    const confidenceLevel: 'high' | 'medium' | 'low' = 
      dataCompleteness > 0.9 ? 'medium' : // Permeability is never high confidence from logs alone
      dataCompleteness > 0.7 ? 'low' : 'low';

    const quality: QualityMetrics = {
      dataCompleteness,
      environmentalCorrections: [], // To be populated based on specific corrections applied
      uncertaintyRange,
      confidenceLevel,
      validationNotes: `Permeability estimated using ${method} method with ${requiredCurves.join(', ')} curves. Note: Log-derived permeability has high uncertainty and should be calibrated with core/test data.`,
    };

    return { uncertainty, quality };
  }

  /**
   * Validate permeability calculation parameters
   */
  public validateParameters(parameters: PermeabilityCalculationParameters): ValidationResult {
    const errors: CalculationError[] = [];
    const warnings: CalculationError[] = [];

    // Validate grain size
    if (parameters.grainSize <= 0 || parameters.grainSize > 10000) {
      errors.push({
        type: 'parameter_error',
        severity: 'major',
        message: 'Grain size must be between 0 and 10000 microns',
        suggestedFix: 'Use typical values: 50-500 microns for sandstones',
      });
    }

    // Validate irreducible water saturation
    if (parameters.swi <= 0 || parameters.swi >= 1) {
      errors.push({
        type: 'parameter_error',
        severity: 'major',
        message: 'Irreducible water saturation (Swi) must be between 0 and 1',
        suggestedFix: 'Use typical values: 0.1-0.4 for sandstones, 0.05-0.2 for carbonates',
      });
    }

    // Check for reasonable parameter ranges
    if (parameters.grainSize < 10 || parameters.grainSize > 1000) {
      warnings.push({
        type: 'parameter_error',
        severity: 'minor',
        message: 'Grain size outside typical range (10-1000 microns)',
        suggestedFix: 'Verify grain size is appropriate for the formation',
      });
    }

    if (parameters.swi < 0.05 || parameters.swi > 0.6) {
      warnings.push({
        type: 'parameter_error',
        severity: 'minor',
        message: 'Swi outside typical range (0.05-0.6)',
        suggestedFix: 'Verify Swi from capillary pressure or resistivity analysis',
      });
    }

    // Validate Coates-Dumanoir parameters if provided
    if (parameters.c !== undefined && (parameters.c <= 0 || parameters.c > 1e6)) {
      warnings.push({
        type: 'parameter_error',
        severity: 'minor',
        message: 'Coates-Dumanoir coefficient outside typical range (100-100000)',
        suggestedFix: 'Use typical value of 10000 or calibrate from core data',
      });
    }

    if (parameters.x !== undefined && (parameters.x < 2 || parameters.x > 8)) {
      warnings.push({
        type: 'parameter_error',
        severity: 'minor',
        message: 'Coates-Dumanoir porosity exponent outside typical range (2-8)',
        suggestedFix: 'Use typical value of 4.0 or calibrate from core data',
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
   * Calculate statistical summary for permeability data (log-normal distribution)
   */
  private calculateStatistics(data: number[]): StatisticalSummary {
    const validData = data.filter(val => val !== -999.25 && !isNaN(val) && isFinite(val) && val > 0);

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

    // For permeability, use log-normal statistics
    const logData = validData.map(val => Math.log10(val));
    const sortedData = [...validData].sort((a, b) => a - b);
    const sortedLogData = [...logData].sort((a, b) => a - b);

    // Arithmetic statistics
    const mean = validData.reduce((sum, val) => sum + val, 0) / validData.length;
    const variance = validData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / validData.length;
    const standardDeviation = Math.sqrt(variance);

    // Geometric statistics (more appropriate for permeability)
    const logMean = logData.reduce((sum, val) => sum + val, 0) / logData.length;
    const geometricMean = Math.pow(10, logMean);

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
      mean: geometricMean, // Use geometric mean for permeability
      median: percentiles.P50,
      standardDeviation,
      min: sortedData[0],
      max: sortedData[sortedData.length - 1],
      percentiles,
      count: data.length,
      validCount: validData.length,
    };
  }
}