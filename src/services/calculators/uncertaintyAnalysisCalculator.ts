/**
 * Uncertainty Analysis Calculator
 * Implements uncertainty calculations for porosity, saturation, and permeability
 * Based on requirements 4.5, 4.6, 4.7
 */

import {
  StatisticalSummary,
  QualityMetrics,
  CalculationParameters,
  CalculationError,
  ValidationResult
} from '../../types/petrophysics';

export interface UncertaintyParameters {
  // Porosity uncertainty parameters
  densityPorosityUncertainty?: number;    // Default: ±2%
  neutronPorosityUncertainty?: number;    // Default: ±3%
  
  // Saturation uncertainty parameters
  archieUncertainty?: number;             // Default: ±15%
  advancedMethodUncertainty?: number;     // Default: ±10%
  
  // Permeability uncertainty parameters
  correlationUncertainty?: number;        // Default: ±50%
  coreDataUncertainty?: number;          // Default: ±20%
  
  // Confidence level for uncertainty calculations
  confidenceLevel?: number;               // Default: 0.68 (1-sigma)
}

export interface UncertaintyResult {
  value: number;
  uncertainty: number;
  uncertaintyPercent: number;
  lowerBound: number;
  upperBound: number;
  confidenceLevel: number;
  method: string;
}

export interface UncertaintyAnalysis {
  porosity?: UncertaintyResult;
  saturation?: UncertaintyResult;
  permeability?: UncertaintyResult;
  combinedUncertainty?: UncertaintyResult;
  statistics: StatisticalSummary;
  qualityMetrics: QualityMetrics;
}

export interface MonteCarloParameters {
  iterations: number;                     // Default: 10000
  seed?: number;                         // For reproducible results
  correlationMatrix?: number[][];        // Parameter correlations
}

export interface ConfidenceInterval {
  level: number;                         // Confidence level (e.g., 0.68, 0.95)
  lowerBound: number;
  upperBound: number;
  mean: number;
  standardDeviation: number;
}

/**
 * Uncertainty Analysis Calculator Class
 */
export class UncertaintyAnalysisCalculator {
  private defaultParameters: UncertaintyParameters = {
    densityPorosityUncertainty: 0.02,      // ±2%
    neutronPorosityUncertainty: 0.03,      // ±3%
    archieUncertainty: 0.15,               // ±15%
    advancedMethodUncertainty: 0.10,       // ±10%
    correlationUncertainty: 0.50,          // ±50%
    coreDataUncertainty: 0.20,             // ±20%
    confidenceLevel: 0.68                  // 1-sigma
  };

  /**
   * Calculate porosity uncertainty using error propagation
   */
  public calculatePorosityUncertainty(
    densityPorosity: number[],
    neutronPorosity: number[],
    method: 'density' | 'neutron' | 'effective' | 'combined' = 'effective',
    parameters: Partial<UncertaintyParameters> = {}
  ): UncertaintyResult[] {
    const appliedParams = { ...this.defaultParameters, ...parameters };
    const results: UncertaintyResult[] = [];

    for (let i = 0; i < Math.min(densityPorosity.length, neutronPorosity.length); i++) {
      const phiD = densityPorosity[i];
      const phiN = neutronPorosity[i];

      if (isNaN(phiD) || isNaN(phiN) || phiD < 0 || phiN < 0) {
        results.push({
          value: NaN,
          uncertainty: NaN,
          uncertaintyPercent: NaN,
          lowerBound: NaN,
          upperBound: NaN,
          confidenceLevel: appliedParams.confidenceLevel!,
          method: method
        });
        continue;
      }

      let value: number;
      let uncertainty: number;

      switch (method) {
        case 'density':
          value = phiD;
          uncertainty = phiD * appliedParams.densityPorosityUncertainty!;
          break;

        case 'neutron':
          value = phiN;
          uncertainty = phiN * appliedParams.neutronPorosityUncertainty!;
          break;

        case 'effective':
          // Effective porosity = (density + neutron) / 2
          value = (phiD + phiN) / 2;
          // Error propagation for average: σ_avg = sqrt((σ_D^2 + σ_N^2) / 4)
          const sigmaD = phiD * appliedParams.densityPorosityUncertainty!;
          const sigmaN = phiN * appliedParams.neutronPorosityUncertainty!;
          uncertainty = Math.sqrt((sigmaD * sigmaD + sigmaN * sigmaN) / 4);
          break;

        case 'combined':
          // Weighted average based on uncertainty
          const wD = 1 / (appliedParams.densityPorosityUncertainty! ** 2);
          const wN = 1 / (appliedParams.neutronPorosityUncertainty! ** 2);
          value = (wD * phiD + wN * phiN) / (wD + wN);
          uncertainty = 1 / Math.sqrt(wD + wN);
          break;

        default:
          throw new Error(`Unknown porosity method: ${method}`);
      }

      const uncertaintyPercent = value > 0 ? (uncertainty / value) * 100 : 0;
      const zScore = this.getZScore(appliedParams.confidenceLevel!);
      const margin = uncertainty * zScore;

      results.push({
        value,
        uncertainty,
        uncertaintyPercent,
        lowerBound: value - margin,
        upperBound: value + margin,
        confidenceLevel: appliedParams.confidenceLevel!,
        method: method
      });
    }

    return results;
  }

  /**
   * Calculate saturation uncertainty
   */
  public calculateSaturationUncertainty(
    saturation: number[],
    method: 'archie' | 'waxman_smits' | 'dual_water' = 'archie',
    parameters: Partial<UncertaintyParameters> = {}
  ): UncertaintyResult[] {
    const appliedParams = { ...this.defaultParameters, ...parameters };
    const results: UncertaintyResult[] = [];

    for (const sw of saturation) {
      if (isNaN(sw) || sw < 0 || sw > 1) {
        results.push({
          value: NaN,
          uncertainty: NaN,
          uncertaintyPercent: NaN,
          lowerBound: NaN,
          upperBound: NaN,
          confidenceLevel: appliedParams.confidenceLevel!,
          method: method
        });
        continue;
      }

      let uncertaintyFactor: number;

      switch (method) {
        case 'archie':
          uncertaintyFactor = appliedParams.archieUncertainty!;
          break;
        case 'waxman_smits':
        case 'dual_water':
          uncertaintyFactor = appliedParams.advancedMethodUncertainty!;
          break;
        default:
          throw new Error(`Unknown saturation method: ${method}`);
      }

      const uncertainty = sw * uncertaintyFactor;
      const uncertaintyPercent = uncertaintyFactor * 100;
      const zScore = this.getZScore(appliedParams.confidenceLevel!);
      const margin = uncertainty * zScore;

      results.push({
        value: sw,
        uncertainty,
        uncertaintyPercent,
        lowerBound: Math.max(0, sw - margin),
        upperBound: Math.min(1, sw + margin),
        confidenceLevel: appliedParams.confidenceLevel!,
        method: method
      });
    }

    return results;
  }

  /**
   * Calculate permeability uncertainty
   */
  public calculatePermeabilityUncertainty(
    permeability: number[],
    method: 'correlation' | 'core_data' = 'correlation',
    parameters: Partial<UncertaintyParameters> = {}
  ): UncertaintyResult[] {
    const appliedParams = { ...this.defaultParameters, ...parameters };
    const results: UncertaintyResult[] = [];

    for (const k of permeability) {
      if (isNaN(k) || k <= 0) {
        results.push({
          value: NaN,
          uncertainty: NaN,
          uncertaintyPercent: NaN,
          lowerBound: NaN,
          upperBound: NaN,
          confidenceLevel: appliedParams.confidenceLevel!,
          method: method
        });
        continue;
      }

      let uncertaintyFactor: number;

      switch (method) {
        case 'correlation':
          uncertaintyFactor = appliedParams.correlationUncertainty!;
          break;
        case 'core_data':
          uncertaintyFactor = appliedParams.coreDataUncertainty!;
          break;
        default:
          throw new Error(`Unknown permeability method: ${method}`);
      }

      // Permeability uncertainty is typically log-normal
      const logK = Math.log10(k);
      const logUncertainty = Math.abs(logK) * uncertaintyFactor;
      const uncertaintyPercent = uncertaintyFactor * 100;
      
      const zScore = this.getZScore(appliedParams.confidenceLevel!);
      const logMargin = logUncertainty * zScore;

      const lowerBound = Math.pow(10, logK - logMargin);
      const upperBound = Math.pow(10, logK + logMargin);
      const uncertainty = (upperBound - lowerBound) / 2;

      results.push({
        value: k,
        uncertainty,
        uncertaintyPercent,
        lowerBound,
        upperBound,
        confidenceLevel: appliedParams.confidenceLevel!,
        method: method
      });
    }

    return results;
  }

  /**
   * Perform Monte Carlo uncertainty analysis
   */
  public performMonteCarloAnalysis(
    inputValues: { [key: string]: number[] },
    uncertainties: { [key: string]: number[] },
    calculationFunction: (inputs: { [key: string]: number }) => number,
    mcParams: Partial<MonteCarloParameters> = {}
  ): ConfidenceInterval[] {
    const params = {
      iterations: 10000,
      seed: undefined,
      correlationMatrix: undefined,
      ...mcParams
    };

    if (params.seed !== undefined) {
      // Set seed for reproducible results (simplified implementation)
      Math.random = this.seededRandom(params.seed);
    }

    const keys = Object.keys(inputValues);
    const dataLength = inputValues[keys[0]].length;
    const results: ConfidenceInterval[] = [];

    for (let i = 0; i < dataLength; i++) {
      const monteCarloResults: number[] = [];

      for (let iter = 0; iter < params.iterations; iter++) {
        const sampledInputs: { [key: string]: number } = {};

        // Sample from normal distribution for each parameter
        for (const key of keys) {
          const mean = inputValues[key][i];
          const std = uncertainties[key][i];
          
          if (isNaN(mean) || isNaN(std)) {
            sampledInputs[key] = NaN;
          } else {
            sampledInputs[key] = this.sampleNormal(mean, std);
          }
        }

        // Calculate result for this iteration
        const result = calculationFunction(sampledInputs);
        if (!isNaN(result) && isFinite(result)) {
          monteCarloResults.push(result);
        }
      }

      // Calculate confidence intervals
      if (monteCarloResults.length > 0) {
        const sorted = monteCarloResults.sort((a, b) => a - b);
        const mean = monteCarloResults.reduce((sum, val) => sum + val, 0) / monteCarloResults.length;
        const variance = monteCarloResults.reduce((sum, val) => sum + (val - mean) ** 2, 0) / monteCarloResults.length;
        const std = Math.sqrt(variance);

        // Calculate different confidence levels
        const confidenceLevels = [0.68, 0.95, 0.99];
        const intervals: ConfidenceInterval[] = confidenceLevels.map(level => {
          const alpha = 1 - level;
          const lowerIndex = Math.floor(alpha / 2 * sorted.length);
          const upperIndex = Math.floor((1 - alpha / 2) * sorted.length) - 1;

          return {
            level,
            lowerBound: sorted[lowerIndex],
            upperBound: sorted[upperIndex],
            mean,
            standardDeviation: std
          };
        });

        results.push(...intervals);
      } else {
        // No valid results
        const nanInterval: ConfidenceInterval = {
          level: 0.68,
          lowerBound: NaN,
          upperBound: NaN,
          mean: NaN,
          standardDeviation: NaN
        };
        results.push(nanInterval);
      }
    }

    return results;
  }

  /**
   * Calculate propagated uncertainty for combined calculations
   */
  public propagateUncertainty(
    values: number[],
    uncertainties: number[],
    operation: 'add' | 'subtract' | 'multiply' | 'divide' | 'power' | 'log',
    operand?: number
  ): UncertaintyResult[] {
    if (values.length !== uncertainties.length) {
      throw new Error('Values and uncertainties arrays must have the same length');
    }

    const results: UncertaintyResult[] = [];

    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      const sigma = uncertainties[i];

      if (isNaN(value) || isNaN(sigma)) {
        results.push({
          value: NaN,
          uncertainty: NaN,
          uncertaintyPercent: NaN,
          lowerBound: NaN,
          upperBound: NaN,
          confidenceLevel: this.defaultParameters.confidenceLevel!,
          method: operation
        });
        continue;
      }

      let newValue: number;
      let newUncertainty: number;

      switch (operation) {
        case 'add':
          newValue = value + (operand || 0);
          newUncertainty = sigma; // Uncertainty unchanged for addition
          break;

        case 'subtract':
          newValue = value - (operand || 0);
          newUncertainty = sigma; // Uncertainty unchanged for subtraction
          break;

        case 'multiply':
          newValue = value * (operand || 1);
          if (value === 0) {
            newUncertainty = 0;
          } else {
            newUncertainty = Math.abs(newValue) * (sigma / Math.abs(value)); // Relative uncertainty preserved
          }
          break;

        case 'divide':
          if (operand === 0) {
            newValue = NaN;
            newUncertainty = NaN;
          } else {
            newValue = value / (operand || 1);
            newUncertainty = Math.abs(newValue) * (sigma / Math.abs(value)); // Relative uncertainty preserved
          }
          break;

        case 'power':
          const exponent = operand || 2;
          newValue = Math.pow(value, exponent);
          newUncertainty = Math.abs(newValue * exponent) * (sigma / Math.abs(value));
          break;

        case 'log':
          if (value <= 0) {
            newValue = NaN;
            newUncertainty = NaN;
          } else {
            newValue = Math.log(value);
            newUncertainty = sigma / value; // d(ln(x))/dx = 1/x
          }
          break;

        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      const uncertaintyPercent = Math.abs(newValue) > 0 ? (newUncertainty / Math.abs(newValue)) * 100 : 0;
      const zScore = this.getZScore(this.defaultParameters.confidenceLevel!);
      const margin = newUncertainty * zScore;

      results.push({
        value: newValue,
        uncertainty: newUncertainty,
        uncertaintyPercent,
        lowerBound: newValue - margin,
        upperBound: newValue + margin,
        confidenceLevel: this.defaultParameters.confidenceLevel!,
        method: operation
      });
    }

    return results;
  }

  /**
   * Validate uncertainty analysis inputs
   */
  public validateInputs(
    values: number[],
    uncertainties?: number[],
    parameters?: Partial<UncertaintyParameters>
  ): ValidationResult {
    const errors: CalculationError[] = [];
    const warnings: CalculationError[] = [];

    // Check basic inputs
    if (!values || values.length === 0) {
      errors.push({
        type: 'data_error',
        severity: 'critical',
        message: 'Values array is required and cannot be empty'
      });
    }

    if (uncertainties && uncertainties.length !== values.length) {
      errors.push({
        type: 'data_error',
        severity: 'critical',
        message: 'Uncertainties array must have the same length as values array'
      });
    }

    // Check for negative uncertainties
    if (uncertainties) {
      const negativeUncertainties = uncertainties.filter(u => !isNaN(u) && u < 0);
      if (negativeUncertainties.length > 0) {
        errors.push({
          type: 'data_error',
          severity: 'major',
          message: 'Uncertainty values cannot be negative'
        });
      }
    }

    // Validate parameters
    if (parameters) {
      const paramChecks = [
        { key: 'densityPorosityUncertainty', min: 0, max: 1 },
        { key: 'neutronPorosityUncertainty', min: 0, max: 1 },
        { key: 'archieUncertainty', min: 0, max: 1 },
        { key: 'advancedMethodUncertainty', min: 0, max: 1 },
        { key: 'correlationUncertainty', min: 0, max: 2 },
        { key: 'coreDataUncertainty', min: 0, max: 1 },
        { key: 'confidenceLevel', min: 0.5, max: 0.999 }
      ];

      for (const check of paramChecks) {
        const value = (parameters as any)[check.key];
        if (value !== undefined && (value < check.min || value > check.max)) {
          errors.push({
            type: 'parameter_error',
            severity: 'major',
            message: `${check.key} must be between ${check.min} and ${check.max}`
          });
        }
      }
    }

    // Check data quality
    const validValues = values.filter(v => !isNaN(v) && isFinite(v));
    const dataCompleteness = validValues.length / values.length;

    if (dataCompleteness < 0.5) {
      warnings.push({
        type: 'data_error',
        severity: 'major',
        message: 'Low data completeness may affect uncertainty analysis reliability'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      corrections: []
    };
  }

  /**
   * Get Z-score for given confidence level
   */
  private getZScore(confidenceLevel: number): number {
    // Approximate Z-scores for common confidence levels
    if (confidenceLevel >= 0.999) return 3.29;
    if (confidenceLevel >= 0.99) return 2.58;
    if (confidenceLevel >= 0.95) return 1.96;
    if (confidenceLevel >= 0.90) return 1.64;
    if (confidenceLevel >= 0.68) return 1.00;
    return 1.00; // Default to 1-sigma
  }

  /**
   * Sample from normal distribution (Box-Muller transform)
   */
  private sampleNormal(mean: number, std: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + std * z0;
  }

  /**
   * Seeded random number generator (simple LCG)
   */
  private seededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % Math.pow(2, 32);
      return state / Math.pow(2, 32);
    };
  }

  /**
   * Calculate statistical summary for uncertainty results
   */
  private calculateStatistics(data: number[]): StatisticalSummary {
    const validData = data.filter(val => !isNaN(val) && isFinite(val));

    if (validData.length === 0) {
      return {
        mean: NaN,
        median: NaN,
        standardDeviation: NaN,
        min: NaN,
        max: NaN,
        percentiles: {},
        count: data.length,
        validCount: 0
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
      validCount: validData.length
    };
  }
}

/**
 * Default instance of the uncertainty analysis calculator
 */
export const uncertaintyAnalysisCalculator = new UncertaintyAnalysisCalculator();