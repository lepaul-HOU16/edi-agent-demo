/**
 * Porosity Calculation Module
 * Implements industry-standard porosity calculation methods
 * Based on requirements 2.1, 2.2, 2.3
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
  PorosityMethod
} from '../../types/petrophysics';

export interface PorosityCalculationRequest extends CalculationRequest {
  method: PorosityMethod;
  inputCurves: {
    rhob?: LogCurve;  // Bulk density curve
    nphi?: LogCurve;  // Neutron porosity curve
    depth: LogCurve;  // Depth curve
  };
}

export interface PorosityCalculationParameters extends CalculationParameters {
  matrixDensity: number;  // Default 2.65 g/cc for sandstone
  fluidDensity: number;   // Default 1.0 g/cc for water
}

/**
 * Porosity Calculator Class
 * Provides multiple porosity calculation methods with validation and quality control
 */
export class PorosityCalculator {
  private defaultParameters: PorosityCalculationParameters = {
    matrixDensity: 2.65,  // Sandstone matrix density
    fluidDensity: 1.0,    // Water density
  };

  /**
   * Calculate density porosity using the formula: φD = (ρma - ρb) / (ρma - ρf)
   * Where: ρma = matrix density, ρb = bulk density, ρf = fluid density
   * Standard formula: φD = (2.65 - RHOB) / (2.65 - 1.0)
   */
  public calculateDensityPorosity(
    rhobData: number[],
    parameters?: Partial<PorosityCalculationParameters>
  ): number[] {
    const params = { ...this.defaultParameters, ...parameters };
    const { matrixDensity, fluidDensity } = params;

    return rhobData.map(rhob => {
      // Handle null values
      if (rhob === -999.25 || isNaN(rhob) || !isFinite(rhob)) {
        return -999.25;
      }

      // Validate input range (typical bulk density range: 1.5 - 3.0 g/cc)
      if (rhob < 1.0 || rhob > 4.0) {
        return -999.25;
      }

      // Calculate density porosity: φD = (ρma - ρb) / (ρma - ρf)
      const porosity = (matrixDensity - rhob) / (matrixDensity - fluidDensity);

      // Validate result (porosity should be between 0 and 1)
      if (porosity < 0 || porosity > 1) {
        return -999.25;
      }

      return porosity;
    });
  }

  /**
   * Calculate neutron porosity using the formula: φN = NPHI / 100
   * Converts neutron porosity from percentage to decimal
   */
  public calculateNeutronPorosity(
    nphiData: number[],
    parameters?: Partial<PorosityCalculationParameters>
  ): number[] {
    return nphiData.map(nphi => {
      // Handle null values
      if (nphi === -999.25 || isNaN(nphi) || !isFinite(nphi)) {
        return -999.25;
      }

      // Validate input range (typical neutron porosity range: 0 - 100%)
      if (nphi < 0 || nphi > 100) {
        return -999.25;
      }

      // Convert from percentage to decimal: φN = NPHI / 100
      const porosity = nphi / 100;

      return porosity;
    });
  }

  /**
   * Calculate effective porosity as average of density and neutron porosity
   * Formula: φE = (φD + φN) / 2
   */
  public calculateEffectivePorosity(
    densityPorosity: number[],
    neutronPorosity: number[]
  ): number[] {
    if (densityPorosity.length !== neutronPorosity.length) {
      throw new Error('Density and neutron porosity arrays must have the same length');
    }

    return densityPorosity.map((phiD, index) => {
      const phiN = neutronPorosity[index];

      // Handle null values
      if (phiD === -999.25 || phiN === -999.25 || 
          isNaN(phiD) || isNaN(phiN) || 
          !isFinite(phiD) || !isFinite(phiN)) {
        return -999.25;
      }

      // Calculate effective porosity: φE = (φD + φN) / 2
      const effectivePorosity = (phiD + phiN) / 2;

      // Validate result
      if (effectivePorosity < 0 || effectivePorosity > 1) {
        return -999.25;
      }

      return effectivePorosity;
    });
  }

  /**
   * Main porosity calculation method that handles different porosity types
   */
  public calculatePorosity(request: PorosityCalculationRequest): CalculationResult {
    const { method, inputCurves, parameters, depthRange } = request;
    const calcParams = { ...this.defaultParameters, ...parameters };

    let values: number[] = [];
    let methodology = '';
    let requiredCurves: string[] = [];

    try {
      switch (method) {
        case 'density':
          if (!inputCurves.rhob) {
            throw new Error('RHOB curve is required for density porosity calculation');
          }
          values = this.calculateDensityPorosity(inputCurves.rhob.data, calcParams);
          methodology = `Density Porosity: φD = (${calcParams.matrixDensity} - RHOB) / (${calcParams.matrixDensity} - ${calcParams.fluidDensity})`;
          requiredCurves = ['RHOB'];
          break;

        case 'neutron':
          if (!inputCurves.nphi) {
            throw new Error('NPHI curve is required for neutron porosity calculation');
          }
          values = this.calculateNeutronPorosity(inputCurves.nphi.data, calcParams);
          methodology = 'Neutron Porosity: φN = NPHI / 100';
          requiredCurves = ['NPHI'];
          break;

        case 'effective':
          if (!inputCurves.rhob || !inputCurves.nphi) {
            throw new Error('Both RHOB and NPHI curves are required for effective porosity calculation');
          }
          const densityPhi = this.calculateDensityPorosity(inputCurves.rhob.data, calcParams);
          const neutronPhi = this.calculateNeutronPorosity(inputCurves.nphi.data, calcParams);
          values = this.calculateEffectivePorosity(densityPhi, neutronPhi);
          methodology = `Effective Porosity: φE = (φD + φN) / 2, where φD = (${calcParams.matrixDensity} - RHOB) / (${calcParams.matrixDensity} - ${calcParams.fluidDensity}) and φN = NPHI / 100`;
          requiredCurves = ['RHOB', 'NPHI'];
          break;

        case 'total':
          // For total porosity, use neutron porosity as it typically represents total porosity
          if (!inputCurves.nphi) {
            throw new Error('NPHI curve is required for total porosity calculation');
          }
          values = this.calculateNeutronPorosity(inputCurves.nphi.data, calcParams);
          methodology = 'Total Porosity: φT = NPHI / 100 (neutron porosity represents total porosity)';
          requiredCurves = ['NPHI'];
          break;

        default:
          throw new Error(`Unsupported porosity method: ${method}`);
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

      // Calculate uncertainty (±2% for density, ±3% for neutron)
      const baseUncertainty = method === 'density' ? 0.02 : 0.03;
      const uncertainty = values.map(val => 
        val === -999.25 ? -999.25 : Math.abs(val * baseUncertainty)
      );

      // Calculate statistics
      const statistics = this.calculateStatistics(values);

      // Calculate quality metrics
      const quality = this.calculateQualityMetrics(values, method, requiredCurves);

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
      throw new Error(`Porosity calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate porosity calculation parameters
   */
  public validateParameters(parameters: PorosityCalculationParameters): ValidationResult {
    const errors: CalculationError[] = [];
    const warnings: CalculationError[] = [];

    // Validate matrix density
    if (parameters.matrixDensity <= 0 || parameters.matrixDensity > 5) {
      errors.push({
        type: 'parameter_error',
        severity: 'major',
        message: 'Matrix density must be between 0 and 5 g/cc',
        suggestedFix: 'Use typical values: 2.65 (sandstone), 2.71 (limestone), 2.87 (dolomite)',
      });
    }

    // Validate fluid density
    if (parameters.fluidDensity <= 0 || parameters.fluidDensity > 2) {
      errors.push({
        type: 'parameter_error',
        severity: 'major',
        message: 'Fluid density must be between 0 and 2 g/cc',
        suggestedFix: 'Use typical values: 1.0 (water), 0.8 (oil), 0.2 (gas)',
      });
    }

    // Check for reasonable parameter ranges
    if (parameters.matrixDensity < 2.0 || parameters.matrixDensity > 3.5) {
      warnings.push({
        type: 'parameter_error',
        severity: 'minor',
        message: 'Matrix density outside typical range (2.0-3.5 g/cc)',
        suggestedFix: 'Verify matrix density is appropriate for the lithology',
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
   * Calculate statistical summary for porosity data
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
   * Calculate quality metrics for porosity calculations
   */
  private calculateQualityMetrics(
    values: number[],
    method: PorosityMethod,
    requiredCurves: string[]
  ): QualityMetrics {
    const validCount = values.filter(val => val !== -999.25 && !isNaN(val) && isFinite(val)).length;
    const dataCompleteness = validCount / values.length;

    // Method-specific uncertainty ranges
    const uncertaintyRanges: { [key in PorosityMethod]: [number, number] } = {
      density: [0.02, 0.03],    // ±2-3% for density porosity
      neutron: [0.03, 0.05],    // ±3-5% for neutron porosity
      effective: [0.02, 0.04],  // ±2-4% for effective porosity
      total: [0.03, 0.05],      // ±3-5% for total porosity
    };

    let uncertaintyRange = uncertaintyRanges[method];

    // Adjust uncertainty based on data completeness
    if (dataCompleteness < 0.8) {
      uncertaintyRange = [uncertaintyRange[0] * 1.5, uncertaintyRange[1] * 1.5];
    }

    const confidenceLevel: 'high' | 'medium' | 'low' = 
      dataCompleteness > 0.9 ? 'high' :
      dataCompleteness > 0.7 ? 'medium' : 'low';

    return {
      dataCompleteness,
      environmentalCorrections: [], // To be populated based on specific corrections applied
      uncertaintyRange,
      confidenceLevel,
      validationNotes: `Porosity calculated using ${method} method with ${requiredCurves.join(', ')} curves`,
    };
  }
}