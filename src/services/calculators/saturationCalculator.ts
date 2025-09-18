/**
 * Water Saturation Calculation Module
 * Implements industry-standard water saturation calculation methods
 * Based on requirements 2.8, 2.9
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
  SaturationMethod
} from '../../types/petrophysics';

export interface SaturationCalculationRequest extends CalculationRequest {
  method: SaturationMethod;
  inputCurves: {
    rt: LogCurve;        // True resistivity curve
    porosity: LogCurve;  // Porosity curve (effective porosity)
    vsh?: LogCurve;      // Shale volume curve (for Waxman-Smits)
    depth: LogCurve;     // Depth curve
  };
}

export interface SaturationCalculationParameters extends CalculationParameters {
  rw: number;    // Formation water resistivity (ohm-m)
  a: number;     // Tortuosity factor (dimensionless)
  m: number;     // Cementation exponent (dimensionless)
  n: number;     // Saturation exponent (dimensionless)
  // Waxman-Smits specific parameters
  b?: number;    // Cation exchange capacity coefficient
  qv?: number;   // Cation exchange capacity per unit pore volume
}

/**
 * Water Saturation Calculator Class
 * Provides multiple saturation calculation methods with validation and quality control
 */
export class SaturationCalculator {
  private defaultParameters: SaturationCalculationParameters = {
    rw: 0.1,    // Formation water resistivity (ohm-m)
    a: 1.0,     // Tortuosity factor
    m: 2.0,     // Cementation exponent
    n: 2.0,     // Saturation exponent
    b: 0.045,   // Waxman-Smits coefficient
    qv: 0.1,    // Cation exchange capacity
  };

  /**
   * Calculate water saturation using Archie's equation
   * Formula: Sw = ((a * Rw) / (φ^m * RT))^(1/n)
   * Standard form: Sw = ((1.0 * Rw) / (porosity^2 * RT))^0.5
   */
  public calculateArchie(
    rtData: number[],
    porosityData: number[],
    parameters?: Partial<SaturationCalculationParameters>
  ): number[] {
    const params = { ...this.defaultParameters, ...parameters };
    const { rw, a, m, n } = params;

    if (rtData.length !== porosityData.length) {
      throw new Error('Resistivity and porosity arrays must have the same length');
    }

    return rtData.map((rt, index) => {
      const porosity = porosityData[index];

      // Handle null values
      if (rt === -999.25 || porosity === -999.25 || 
          isNaN(rt) || isNaN(porosity) || 
          !isFinite(rt) || !isFinite(porosity)) {
        return -999.25;
      }

      // Validate input ranges
      if (rt <= 0 || porosity <= 0 || porosity > 1) {
        return -999.25;
      }

      // Calculate formation factor: F = a / φ^m
      const formationFactor = a / Math.pow(porosity, m);

      // Calculate water saturation: Sw = ((F * Rw) / RT)^(1/n)
      const sw = Math.pow((formationFactor * rw) / rt, 1 / n);

      // Clamp to valid range [0, 1]
      return Math.max(0, Math.min(1, sw));
    });
  }

  /**
   * Calculate water saturation using Waxman-Smits method for shaly sands
   * Formula: 1/RT = (Sw^n / (a * Rw * φ^m)) + (B * Qv * Sw / φ)
   * This is solved iteratively for Sw
   */
  public calculateWaxmanSmits(
    rtData: number[],
    porosityData: number[],
    vshData: number[],
    parameters?: Partial<SaturationCalculationParameters>
  ): number[] {
    const params = { ...this.defaultParameters, ...parameters };
    const { rw, a, m, n, b, qv } = params;

    if (rtData.length !== porosityData.length || rtData.length !== vshData.length) {
      throw new Error('Resistivity, porosity, and shale volume arrays must have the same length');
    }

    return rtData.map((rt, index) => {
      const porosity = porosityData[index];
      const vsh = vshData[index];

      // Handle null values
      if (rt === -999.25 || porosity === -999.25 || vsh === -999.25 ||
          isNaN(rt) || isNaN(porosity) || isNaN(vsh) ||
          !isFinite(rt) || !isFinite(porosity) || !isFinite(vsh)) {
        return -999.25;
      }

      // Validate input ranges
      if (rt <= 0 || porosity <= 0 || porosity > 1 || vsh < 0 || vsh > 1) {
        return -999.25;
      }

      // Calculate cation exchange capacity: Qv = b * Vsh / φ
      const qvCalc = (b || 0.045) * vsh / porosity;

      // Iterative solution for Sw using Newton-Raphson method
      let sw = 0.5; // Initial guess
      const maxIterations = 20;
      const tolerance = 1e-6;

      for (let i = 0; i < maxIterations; i++) {
        // Calculate conductivity terms
        const archieConduct = Math.pow(sw, n) / (a * rw * Math.pow(porosity, m));
        const clayConduct = qvCalc * sw / porosity;
        const totalConduct = archieConduct + clayConduct;

        // Function: f(Sw) = 1/RT - totalConductivity
        const f = 1 / rt - totalConduct;

        // Derivative: f'(Sw)
        const archieDerivative = n * Math.pow(sw, n - 1) / (a * rw * Math.pow(porosity, m));
        const clayDerivative = qvCalc / porosity;
        const fPrime = -(archieDerivative + clayDerivative);

        // Newton-Raphson update
        const swNew = sw - f / fPrime;

        // Check convergence
        if (Math.abs(swNew - sw) < tolerance) {
          sw = swNew;
          break;
        }

        sw = Math.max(0, Math.min(1, swNew)); // Clamp to valid range
      }

      return sw;
    });
  }

  /**
   * Calculate water saturation using dual-water model
   * Simplified implementation for clay-bound and free water
   */
  public calculateDualWater(
    rtData: number[],
    porosityData: number[],
    vshData: number[],
    parameters?: Partial<SaturationCalculationParameters>
  ): number[] {
    const params = { ...this.defaultParameters, ...parameters };
    const { rw, a, m, n } = params;

    // For simplicity, use a modified Archie equation with clay correction
    // This is a simplified dual-water model
    return rtData.map((rt, index) => {
      const porosity = porosityData[index];
      const vsh = vshData[index];

      // Handle null values
      if (rt === -999.25 || porosity === -999.25 || vsh === -999.25 ||
          isNaN(rt) || isNaN(porosity) || isNaN(vsh) ||
          !isFinite(rt) || !isFinite(porosity) || !isFinite(vsh)) {
        return -999.25;
      }

      // Validate input ranges
      if (rt <= 0 || porosity <= 0 || porosity > 1 || vsh < 0 || vsh > 1) {
        return -999.25;
      }

      // Effective porosity (reduced by clay-bound water)
      const phiEffective = porosity * (1 - vsh * 0.5); // Assume 50% of clay volume is bound water

      if (phiEffective <= 0) {
        return 1.0; // All water is bound water
      }

      // Modified Archie equation with effective porosity
      const formationFactor = a / Math.pow(phiEffective, m);
      const sw = Math.pow((formationFactor * rw) / rt, 1 / n);

      // Add clay-bound water saturation
      const swBound = vsh * 0.5; // Assume bound water saturation
      const swTotal = sw + swBound;

      return Math.max(0, Math.min(1, swTotal));
    });
  }

  /**
   * Main water saturation calculation method that handles different methods
   */
  public calculateSaturation(request: SaturationCalculationRequest): CalculationResult {
    const { method, inputCurves, parameters, depthRange } = request;
    const calcParams = { ...this.defaultParameters, ...parameters };

    let values: number[] = [];
    let methodology = '';
    let requiredCurves: string[] = [];

    try {
      switch (method) {
        case 'archie':
          values = this.calculateArchie(inputCurves.rt.data, inputCurves.porosity.data, calcParams);
          methodology = `Archie Equation: Sw = ((${calcParams.a} * ${calcParams.rw}) / (φ^${calcParams.m} * RT))^(1/${calcParams.n})`;
          requiredCurves = ['RT', 'POROSITY'];
          break;

        case 'waxman_smits':
          if (!inputCurves.vsh) {
            throw new Error('Shale volume curve is required for Waxman-Smits calculation');
          }
          values = this.calculateWaxmanSmits(
            inputCurves.rt.data,
            inputCurves.porosity.data,
            inputCurves.vsh.data,
            calcParams
          );
          methodology = `Waxman-Smits: 1/RT = (Sw^${calcParams.n} / (${calcParams.a} * ${calcParams.rw} * φ^${calcParams.m})) + (B * Qv * Sw / φ)`;
          requiredCurves = ['RT', 'POROSITY', 'VSH'];
          break;

        case 'dual_water':
          if (!inputCurves.vsh) {
            throw new Error('Shale volume curve is required for dual-water calculation');
          }
          values = this.calculateDualWater(
            inputCurves.rt.data,
            inputCurves.porosity.data,
            inputCurves.vsh.data,
            calcParams
          );
          methodology = `Dual-Water Model: Modified Archie with clay-bound water correction`;
          requiredCurves = ['RT', 'POROSITY', 'VSH'];
          break;

        default:
          throw new Error(`Unsupported saturation method: ${method}`);
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

      // Calculate uncertainty (±15% for Archie, ±10% for advanced methods)
      const baseUncertainty = method === 'archie' ? 0.15 : 0.10;
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
      throw new Error(`Saturation calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate saturation calculation parameters
   */
  public validateParameters(parameters: SaturationCalculationParameters): ValidationResult {
    const errors: CalculationError[] = [];
    const warnings: CalculationError[] = [];

    // Validate formation water resistivity
    if (parameters.rw <= 0 || parameters.rw > 100) {
      errors.push({
        type: 'parameter_error',
        severity: 'major',
        message: 'Formation water resistivity (Rw) must be between 0 and 100 ohm-m',
        suggestedFix: 'Use typical values: 0.01-1.0 ohm-m for saline water, 1-100 ohm-m for fresh water',
      });
    }

    // Validate tortuosity factor
    if (parameters.a <= 0 || parameters.a > 5) {
      errors.push({
        type: 'parameter_error',
        severity: 'major',
        message: 'Tortuosity factor (a) must be between 0 and 5',
        suggestedFix: 'Use typical values: 0.5-2.0, with 1.0 being most common',
      });
    }

    // Validate cementation exponent
    if (parameters.m < 1 || parameters.m > 4) {
      warnings.push({
        type: 'parameter_error',
        severity: 'minor',
        message: 'Cementation exponent (m) outside typical range (1.5-2.5)',
        suggestedFix: 'Use typical values: 2.0 for consolidated rocks, 1.3-1.8 for unconsolidated',
      });
    }

    // Validate saturation exponent
    if (parameters.n < 1 || parameters.n > 4) {
      warnings.push({
        type: 'parameter_error',
        severity: 'minor',
        message: 'Saturation exponent (n) outside typical range (1.5-2.5)',
        suggestedFix: 'Use typical values: 2.0 for water-wet rocks, higher for oil-wet',
      });
    }

    // Check for reasonable Rw values
    if (parameters.rw < 0.005) {
      warnings.push({
        type: 'parameter_error',
        severity: 'minor',
        message: 'Very low Rw value (<0.005 ohm-m) - verify formation water salinity',
        suggestedFix: 'Check formation water analysis or use regional Rw values',
      });
    }

    if (parameters.rw > 10) {
      warnings.push({
        type: 'parameter_error',
        severity: 'minor',
        message: 'High Rw value (>10 ohm-m) - verify for fresh water formations',
        suggestedFix: 'Confirm fresh water environment or check Rw measurement',
      });
    }

    // Validate Waxman-Smits parameters if provided
    if (parameters.b !== undefined && (parameters.b < 0 || parameters.b > 1)) {
      warnings.push({
        type: 'parameter_error',
        severity: 'minor',
        message: 'Waxman-Smits coefficient (b) outside typical range (0.01-0.1)',
        suggestedFix: 'Use typical value of 0.045 or calibrate from core data',
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
   * Calculate statistical summary for saturation data
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
   * Calculate quality metrics for saturation calculations
   */
  private calculateQualityMetrics(
    values: number[],
    method: SaturationMethod,
    requiredCurves: string[]
  ): QualityMetrics {
    const validCount = values.filter(val => val !== -999.25 && !isNaN(val) && isFinite(val)).length;
    const dataCompleteness = validCount / values.length;

    // Method-specific uncertainty ranges
    const uncertaintyRanges: { [key in SaturationMethod]: [number, number] } = {
      archie: [0.15, 0.25],        // ±15-25% for Archie equation
      waxman_smits: [0.10, 0.15],  // ±10-15% for Waxman-Smits
      dual_water: [0.10, 0.20],    // ±10-20% for dual-water model
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
      validationNotes: `Water saturation calculated using ${method} method with ${requiredCurves.join(', ')} curves`,
    };
  }
}