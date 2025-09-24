/**
 * Reservoir Quality Metrics Calculator
 * Implements net-to-gross ratio, weighted mean porosity, and completion efficiency calculations
 * Based on requirements 4.1, 4.4
 */

import {
  WellLogData,
  LogCurve,
  StatisticalSummary,
  QualityMetrics,
  CalculationParameters,
  CalculationError,
  ValidationResult
} from '../../types/petrophysics';

export interface ReservoirInterval {
  name: string;
  topDepth: number;
  bottomDepth: number;
  thickness: number;
  isReservoir: boolean;
  averagePorosity?: number;
  averagePermeability?: number;
  netToGross?: number;
}

export interface CompletionInterval {
  name: string;
  topDepth: number;
  bottomDepth: number;
  perforatedLength: number;
  netPayLength: number;
  completionEfficiency?: number;
}

export interface ReservoirQualityMetrics {
  netToGrossRatio: number;
  weightedMeanPorosity: number;
  totalThickness: number;
  cleanSandThickness: number;
  averageShaleVolume: number;
  reservoirIntervals: ReservoirInterval[];
  statistics: StatisticalSummary;
  qualityMetrics: QualityMetrics;
}

export interface CompletionEfficiencyMetrics {
  completionEfficiency: number;
  totalPerforatedLength: number;
  totalNetPayLength: number;
  completionIntervals: CompletionInterval[];
  statistics: StatisticalSummary;
}

export interface ReservoirQualityCutoffs {
  vshMax: number;        // Maximum shale volume for clean sand (default: 0.5)
  porosityMin: number;   // Minimum porosity for reservoir quality (default: 0.08)
  saturationMax: number; // Maximum water saturation for net pay (default: 0.6)
  permeabilityMin?: number; // Minimum permeability for flow units (optional)
}

/**
 * Reservoir Quality Calculator Class
 */
export class ReservoirQualityCalculator {
  private defaultCutoffs: ReservoirQualityCutoffs = {
    vshMax: 0.5,
    porosityMin: 0.08,
    saturationMax: 0.6,
    permeabilityMin: 0.1 // mD
  };

  /**
   * Calculate net-to-gross ratio: cleanSandThickness / totalThickness
   */
  public calculateNetToGross(
    depths: number[],
    shaleVolume: number[],
    porosity: number[],
    cutoffs: Partial<ReservoirQualityCutoffs> = {}
  ): ReservoirQualityMetrics {
    const appliedCutoffs = { ...this.defaultCutoffs, ...cutoffs };
    
    if (depths.length !== shaleVolume.length || depths.length !== porosity.length) {
      throw new Error('Input arrays must have the same length');
    }

    if (depths.length < 2) {
      throw new Error('At least 2 data points required for thickness calculation');
    }

    let totalThickness = 0;
    let cleanSandThickness = 0;
    let weightedPorositySum = 0;
    let weightedThicknessSum = 0;
    const reservoirIntervals: ReservoirInterval[] = [];
    
    let currentInterval: ReservoirInterval | null = null;
    let intervalPorositySum = 0;
    let intervalThickness = 0;
    let intervalDataPoints = 0;

    // Calculate thickness between each depth point
    for (let i = 0; i < depths.length - 1; i++) {
      const thickness = Math.abs(depths[i + 1] - depths[i]);
      const avgVsh = (shaleVolume[i] + shaleVolume[i + 1]) / 2;
      const avgPorosity = (porosity[i] + porosity[i + 1]) / 2;
      
      // Skip invalid data points
      if (isNaN(avgVsh) || isNaN(avgPorosity) || isNaN(thickness) || thickness === 0) {
        continue;
      }

      totalThickness += thickness;

      // Check if this interval meets reservoir quality criteria
      const isReservoir = avgVsh <= appliedCutoffs.vshMax && 
                         avgPorosity >= appliedCutoffs.porosityMin;

      if (isReservoir) {
        cleanSandThickness += thickness;
        weightedPorositySum += avgPorosity * thickness;
        weightedThicknessSum += thickness;
      }

      // Track reservoir intervals
      if (isReservoir && !currentInterval) {
        // Start new reservoir interval
        currentInterval = {
          name: `Reservoir_${reservoirIntervals.length + 1}`,
          topDepth: Math.min(depths[i], depths[i + 1]),
          bottomDepth: Math.max(depths[i], depths[i + 1]),
          thickness: thickness,
          isReservoir: true,
          averagePorosity: avgPorosity
        };
        intervalPorositySum = avgPorosity * thickness;
        intervalThickness = thickness;
        intervalDataPoints = 1;
      } else if (isReservoir && currentInterval) {
        // Continue current reservoir interval
        currentInterval.bottomDepth = Math.max(depths[i], depths[i + 1]);
        currentInterval.thickness += thickness;
        intervalPorositySum += avgPorosity * thickness;
        intervalThickness += thickness;
        intervalDataPoints++;
      } else if (!isReservoir && currentInterval) {
        // End current reservoir interval
        currentInterval.averagePorosity = intervalThickness > 0 ? 
          intervalPorositySum / intervalThickness : 0;
        currentInterval.netToGross = 1.0; // By definition, reservoir intervals are 100% net
        reservoirIntervals.push(currentInterval);
        currentInterval = null;
        intervalPorositySum = 0;
        intervalThickness = 0;
        intervalDataPoints = 0;
      }
    }

    // Close final interval if it's a reservoir
    if (currentInterval) {
      currentInterval.averagePorosity = intervalThickness > 0 ? 
        intervalPorositySum / intervalThickness : 0;
      currentInterval.netToGross = 1.0;
      reservoirIntervals.push(currentInterval);
    }

    // Calculate metrics
    const netToGrossRatio = totalThickness > 0 ? cleanSandThickness / totalThickness : 0;
    const weightedMeanPorosity = weightedThicknessSum > 0 ? 
      weightedPorositySum / weightedThicknessSum : 0;

    // Calculate average shale volume for the entire interval
    const validShaleVolume = shaleVolume.filter(val => !isNaN(val) && isFinite(val));
    const averageShaleVolume = validShaleVolume.length > 0 ? 
      validShaleVolume.reduce((sum, val) => sum + val, 0) / validShaleVolume.length : 0;

    // Calculate statistics
    const reservoirPorosities = reservoirIntervals
      .map(interval => interval.averagePorosity || 0)
      .filter(val => val > 0);

    const statistics = this.calculateStatistics(reservoirPorosities);

    // Calculate quality metrics
    const qualityMetrics: QualityMetrics = {
      dataCompleteness: validShaleVolume.length / shaleVolume.length,
      environmentalCorrections: [],
      uncertaintyRange: [0.02, 0.05], // ±2-5% for reservoir quality metrics
      confidenceLevel: validShaleVolume.length / shaleVolume.length > 0.8 ? 'high' : 'medium'
    };

    return {
      netToGrossRatio,
      weightedMeanPorosity,
      totalThickness,
      cleanSandThickness,
      averageShaleVolume,
      reservoirIntervals,
      statistics,
      qualityMetrics
    };
  }

  /**
   * Calculate completion efficiency: perforatedLength / netPayLength
   */
  public calculateCompletionEfficiency(
    completionIntervals: CompletionInterval[]
  ): CompletionEfficiencyMetrics {
    if (!completionIntervals || completionIntervals.length === 0) {
      throw new Error('At least one completion interval is required');
    }

    let totalPerforatedLength = 0;
    let totalNetPayLength = 0;
    const processedIntervals: CompletionInterval[] = [];

    for (const interval of completionIntervals) {
      if (interval.perforatedLength < 0 || interval.netPayLength < 0) {
        throw new Error('Perforated length and net pay length must be non-negative');
      }

      if (interval.perforatedLength > interval.netPayLength) {
        console.warn(`Warning: Perforated length (${interval.perforatedLength}) exceeds net pay length (${interval.netPayLength}) for interval ${interval.name}`);
      }

      const completionEfficiency = interval.netPayLength > 0 ? 
        interval.perforatedLength / interval.netPayLength : 0;

      const processedInterval: CompletionInterval = {
        ...interval,
        completionEfficiency
      };

      processedIntervals.push(processedInterval);
      totalPerforatedLength += interval.perforatedLength;
      totalNetPayLength += interval.netPayLength;
    }

    const overallCompletionEfficiency = totalNetPayLength > 0 ? 
      totalPerforatedLength / totalNetPayLength : 0;

    // Calculate statistics for completion efficiencies
    const efficiencies = processedIntervals
      .map(interval => interval.completionEfficiency || 0)
      .filter(val => !isNaN(val) && isFinite(val));

    const statistics = this.calculateStatistics(efficiencies);

    return {
      completionEfficiency: overallCompletionEfficiency,
      totalPerforatedLength,
      totalNetPayLength,
      completionIntervals: processedIntervals,
      statistics
    };
  }

  /**
   * Calculate weighted mean porosity by thickness
   */
  public calculateWeightedMeanPorosity(
    depths: number[],
    porosity: number[],
    weights?: number[]
  ): { weightedMean: number; totalWeight: number; statistics: StatisticalSummary } {
    if (depths.length !== porosity.length) {
      throw new Error('Depths and porosity arrays must have the same length');
    }

    if (weights && weights.length !== porosity.length) {
      throw new Error('Weights array must have the same length as porosity array');
    }

    let weightedSum = 0;
    let totalWeight = 0;
    const validPorosities: number[] = [];

    // If no weights provided, calculate thickness weights
    const calculatedWeights = weights || this.calculateThicknessWeights(depths);

    for (let i = 0; i < porosity.length; i++) {
      if (!isNaN(porosity[i]) && isFinite(porosity[i]) && porosity[i] > 0) {
        const weight = calculatedWeights[i] || 0;
        if (weight > 0) {
          weightedSum += porosity[i] * weight;
          totalWeight += weight;
          validPorosities.push(porosity[i]);
        }
      }
    }

    const weightedMean = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const statistics = this.calculateStatistics(validPorosities);

    return {
      weightedMean,
      totalWeight,
      statistics
    };
  }

  /**
   * Calculate thickness weights from depth array
   */
  private calculateThicknessWeights(depths: number[]): number[] {
    const weights: number[] = [];

    if (depths.length < 2) {
      return depths.map(() => 1); // Equal weights if insufficient data
    }

    // First point gets half the distance to the next point
    weights[0] = Math.abs(depths[1] - depths[0]) / 2;

    // Middle points get half the distance to previous plus half to next
    for (let i = 1; i < depths.length - 1; i++) {
      const prevDistance = Math.abs(depths[i] - depths[i - 1]) / 2;
      const nextDistance = Math.abs(depths[i + 1] - depths[i]) / 2;
      weights[i] = prevDistance + nextDistance;
    }

    // Last point gets half the distance to the previous point
    weights[depths.length - 1] = Math.abs(depths[depths.length - 1] - depths[depths.length - 2]) / 2;

    return weights;
  }

  /**
   * Validate reservoir quality calculation inputs
   */
  public validateInputs(
    depths: number[],
    shaleVolume: number[],
    porosity: number[],
    cutoffs?: Partial<ReservoirQualityCutoffs>
  ): ValidationResult {
    const errors: CalculationError[] = [];
    const warnings: CalculationError[] = [];

    // Check array lengths
    if (depths.length !== shaleVolume.length || depths.length !== porosity.length) {
      errors.push({
        type: 'data_error',
        severity: 'critical',
        message: 'Input arrays must have the same length'
      });
    }

    // Check minimum data points
    if (depths.length < 2) {
      errors.push({
        type: 'data_error',
        severity: 'critical',
        message: 'At least 2 data points required for reservoir quality calculations'
      });
    }

    // Check depth ordering
    if (depths.length >= 2) {
      const isIncreasing = depths.every((depth, i) => i === 0 || depth >= depths[i - 1]);
      const isDecreasing = depths.every((depth, i) => i === 0 || depth <= depths[i - 1]);
      
      if (!isIncreasing && !isDecreasing) {
        warnings.push({
          type: 'data_error',
          severity: 'minor',
          message: 'Depth array is not monotonic - results may be unreliable'
        });
      }
    }

    // Check data ranges
    const validShaleVolume = shaleVolume.filter(val => !isNaN(val) && isFinite(val));
    const validPorosity = porosity.filter(val => !isNaN(val) && isFinite(val));

    if (validShaleVolume.some(val => val < 0 || val > 1)) {
      warnings.push({
        type: 'data_error',
        severity: 'minor',
        message: 'Shale volume values outside typical range (0-1)'
      });
    }

    if (validPorosity.some(val => val < 0 || val > 0.5)) {
      warnings.push({
        type: 'data_error',
        severity: 'minor',
        message: 'Porosity values outside typical range (0-0.5)'
      });
    }

    // Check data completeness
    const shaleCompleteness = validShaleVolume.length / shaleVolume.length;
    const porosityCompleteness = validPorosity.length / porosity.length;

    if (shaleCompleteness < 0.5 || porosityCompleteness < 0.5) {
      warnings.push({
        type: 'data_error',
        severity: 'major',
        message: 'Low data completeness may affect calculation reliability'
      });
    }

    // Validate cutoffs
    if (cutoffs) {
      if (cutoffs.vshMax !== undefined && (cutoffs.vshMax < 0 || cutoffs.vshMax > 1)) {
        errors.push({
          type: 'parameter_error',
          severity: 'major',
          message: 'Maximum shale volume cutoff must be between 0 and 1'
        });
      }

      if (cutoffs.porosityMin !== undefined && (cutoffs.porosityMin < 0 || cutoffs.porosityMin > 0.5)) {
        errors.push({
          type: 'parameter_error',
          severity: 'major',
          message: 'Minimum porosity cutoff must be between 0 and 0.5'
        });
      }

      if (cutoffs.saturationMax !== undefined && (cutoffs.saturationMax < 0 || cutoffs.saturationMax > 1)) {
        errors.push({
          type: 'parameter_error',
          severity: 'major',
          message: 'Maximum water saturation cutoff must be between 0 and 1'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      corrections: []
    };
  }

  /**
   * Calculate statistical summary for an array of values
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
 * Default instance of the reservoir quality calculator
 */
export const reservoirQualityCalculator = new ReservoirQualityCalculator();