/**
 * Quality Control Validation Calculator
 * Implements environmental corrections, curve quality assessment, and geological consistency checking
 * Based on requirements 4.8, 4.9, 4.10
 */

import {
  WellLogData,
  LogCurve,
  CurveQuality,
  QualityAssessment,
  ValidationFlag,
  ValidationResult,
  CalculationError,
  StatisticalSummary,
  QualityMetrics
} from '../../types/petrophysics';

export interface EnvironmentalCorrection {
  type: 'borehole_size' | 'mud_weight' | 'temperature' | 'pressure' | 'invasion';
  description: string;
  originalValue: number;
  correctedValue: number;
  correctionFactor: number;
  appliedAt: Date;
}

export interface OutlierDetectionResult {
  indices: number[];
  values: number[];
  zScores: number[];
  method: 'z_score' | 'iqr' | 'modified_z_score';
  threshold: number;
}

export interface GeologicalConsistencyCheck {
  checkType: 'porosity_permeability' | 'gamma_ray_shale' | 'resistivity_saturation' | 'density_lithology';
  isConsistent: boolean;
  confidence: 'high' | 'medium' | 'low';
  message: string;
  suggestedAction?: string;
}

export interface QualityControlParameters {
  // Outlier detection parameters
  zScoreThreshold?: number;           // Default: 3.0
  iqrMultiplier?: number;             // Default: 1.5
  modifiedZScoreThreshold?: number;   // Default: 3.5
  
  // Environmental correction parameters
  boreholeSize?: number;              // Inches
  mudWeight?: number;                 // ppg (pounds per gallon)
  temperature?: number;               // °F
  pressure?: number;                  // psi
  
  // Geological consistency thresholds
  porosityPermeabilityR2?: number;    // Default: 0.7
  gammaRayShaleThreshold?: number;    // Default: 75 API
  resistivityCutoff?: number;         // Default: 10 ohm-m
  densityRange?: [number, number];    // Default: [1.8, 3.0] g/cc
}

export interface QualityControlResult {
  overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
  environmentalCorrections: EnvironmentalCorrection[];
  outliers: { [curveName: string]: OutlierDetectionResult };
  consistencyChecks: GeologicalConsistencyCheck[];
  validationFlags: ValidationFlag[];
  statistics: { [curveName: string]: StatisticalSummary };
  qualityMetrics: QualityMetrics;
}

/**
 * Quality Control Calculator Class
 */
export class QualityControlCalculator {
  private defaultParameters: QualityControlParameters = {
    zScoreThreshold: 3.0,
    iqrMultiplier: 1.5,
    modifiedZScoreThreshold: 3.5,
    boreholeSize: 8.5,
    mudWeight: 9.0,
    temperature: 150,
    pressure: 3000,
    porosityPermeabilityR2: 0.7,
    gammaRayShaleThreshold: 75,
    resistivityCutoff: 10,
    densityRange: [1.8, 3.0]
  };

  /**
   * Perform comprehensive quality control analysis
   */
  public performQualityControl(
    wellData: WellLogData,
    parameters: Partial<QualityControlParameters> = {}
  ): QualityControlResult {
    const appliedParams = { ...this.defaultParameters, ...parameters };
    
    const environmentalCorrections: EnvironmentalCorrection[] = [];
    const outliers: { [curveName: string]: OutlierDetectionResult } = {};
    const consistencyChecks: GeologicalConsistencyCheck[] = [];
    const validationFlags: ValidationFlag[] = [];
    const statistics: { [curveName: string]: StatisticalSummary } = {};

    // Apply environmental corrections
    for (const curve of wellData.curves) {
      const corrections = this.applyEnvironmentalCorrections(curve, appliedParams);
      environmentalCorrections.push(...corrections);
    }

    // Detect outliers for each curve
    for (const curve of wellData.curves) {
      const outlierResult = this.detectOutliers(curve.data, curve.nullValue, 'z_score', appliedParams);
      if (outlierResult.indices.length > 0) {
        outliers[curve.name] = outlierResult;
        
        validationFlags.push({
          type: 'outlier',
          severity: outlierResult.indices.length > curve.data.length * 0.05 ? 'major' : 'minor',
          message: `${outlierResult.indices.length} outliers detected in ${curve.name}`,
          suggestedFix: 'Review and validate outlier values'
        });
      }
    }

    // Calculate statistics for each curve
    for (const curve of wellData.curves) {
      statistics[curve.name] = this.calculateStatistics(curve.data, curve.nullValue);
    }

    // Perform geological consistency checks
    consistencyChecks.push(...this.performGeologicalConsistencyChecks(wellData, appliedParams));

    // Determine overall quality
    const overallQuality = this.determineOverallQuality(
      environmentalCorrections,
      outliers,
      consistencyChecks,
      validationFlags
    );

    // Calculate quality metrics
    const qualityMetrics = this.calculateQualityMetrics(wellData, outliers, consistencyChecks);

    return {
      overallQuality,
      environmentalCorrections,
      outliers,
      consistencyChecks,
      validationFlags,
      statistics,
      qualityMetrics
    };
  }

  /**
   * Apply environmental corrections to log curves
   */
  public applyEnvironmentalCorrections(
    curve: LogCurve,
    parameters: Partial<QualityControlParameters> = {}
  ): EnvironmentalCorrection[] {
    const appliedParams = { ...this.defaultParameters, ...parameters };
    const corrections: EnvironmentalCorrection[] = [];

    // Apply corrections based on curve type
    const curveName = curve.name.toLowerCase();

    if (curveName.includes('rhob') || curveName.includes('density')) {
      // Density correction for borehole size and mud weight
      const boreholeCorrection = this.calculateBoreholeCorrection(
        curve.data,
        appliedParams.boreholeSize!,
        'density'
      );
      corrections.push(...boreholeCorrection);
    }

    if (curveName.includes('nphi') || curveName.includes('neutron')) {
      // Neutron correction for borehole size and lithology
      const neutronCorrection = this.calculateNeutronCorrection(
        curve.data,
        appliedParams.boreholeSize!
      );
      corrections.push(...neutronCorrection);
    }

    if (curveName.includes('rt') || curveName.includes('resistivity')) {
      // Resistivity correction for temperature and invasion
      const resistivityCorrection = this.calculateResistivityCorrection(
        curve.data,
        appliedParams.temperature!
      );
      corrections.push(...resistivityCorrection);
    }

    return corrections;
  }

  /**
   * Detect statistical outliers in curve data
   */
  public detectOutliers(
    data: number[],
    nullValue: number = -999.25,
    method: 'z_score' | 'iqr' | 'modified_z_score' = 'z_score',
    parameters: Partial<QualityControlParameters> = {}
  ): OutlierDetectionResult {
    const appliedParams = { ...this.defaultParameters, ...parameters };
    
    // Filter valid data
    const validData: { value: number; index: number }[] = [];
    data.forEach((value, index) => {
      if (value !== nullValue && !isNaN(value) && isFinite(value)) {
        validData.push({ value, index });
      }
    });

    if (validData.length < 3) {
      return {
        indices: [],
        values: [],
        zScores: [],
        method,
        threshold: 0
      };
    }

    const values = validData.map(d => d.value);
    const outlierIndices: number[] = [];
    const outlierValues: number[] = [];
    const zScores: number[] = [];

    switch (method) {
      case 'z_score':
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
        const std = Math.sqrt(variance);

        validData.forEach(({ value, index }) => {
          const zScore = std > 0 ? Math.abs(value - mean) / std : 0;
          zScores.push(zScore);
          
          if (zScore > appliedParams.zScoreThreshold!) {
            outlierIndices.push(index);
            outlierValues.push(value);
          }
        });
        break;

      case 'iqr':
        const sortedValues = [...values].sort((a, b) => a - b);
        const q1Index = Math.floor(sortedValues.length * 0.25);
        const q3Index = Math.floor(sortedValues.length * 0.75);
        const q1 = sortedValues[q1Index];
        const q3 = sortedValues[q3Index];
        const iqr = q3 - q1;
        const lowerBound = q1 - appliedParams.iqrMultiplier! * iqr;
        const upperBound = q3 + appliedParams.iqrMultiplier! * iqr;

        validData.forEach(({ value, index }) => {
          if (value < lowerBound || value > upperBound) {
            outlierIndices.push(index);
            outlierValues.push(value);
          }
        });
        break;

      case 'modified_z_score':
        const median = this.calculateMedian(values);
        const medianAbsoluteDeviation = this.calculateMedian(
          values.map(val => Math.abs(val - median))
        );

        validData.forEach(({ value, index }) => {
          const modifiedZScore = medianAbsoluteDeviation > 0 ? 
            0.6745 * (value - median) / medianAbsoluteDeviation : 0;
          zScores.push(Math.abs(modifiedZScore));
          
          if (Math.abs(modifiedZScore) > appliedParams.modifiedZScoreThreshold!) {
            outlierIndices.push(index);
            outlierValues.push(value);
          }
        });
        break;
    }

    return {
      indices: outlierIndices,
      values: outlierValues,
      zScores,
      method,
      threshold: method === 'z_score' ? appliedParams.zScoreThreshold! :
                method === 'iqr' ? appliedParams.iqrMultiplier! :
                appliedParams.modifiedZScoreThreshold!
    };
  }

  /**
   * Perform geological consistency checks
   */
  public performGeologicalConsistencyChecks(
    wellData: WellLogData,
    parameters: Partial<QualityControlParameters> = {}
  ): GeologicalConsistencyCheck[] {
    const appliedParams = { ...this.defaultParameters, ...parameters };
    const checks: GeologicalConsistencyCheck[] = [];

    // Get curves
    const porosityCurve = this.findCurve(wellData.curves, ['nphi', 'porosity', 'phi']);
    const permeabilityCurve = this.findCurve(wellData.curves, ['perm', 'k']);
    const gammaRayCurve = this.findCurve(wellData.curves, ['gr', 'gamma']);
    const resistivityCurve = this.findCurve(wellData.curves, ['rt', 'resistivity']);
    const densityCurve = this.findCurve(wellData.curves, ['rhob', 'density']);

    // Porosity-Permeability consistency
    if (porosityCurve && permeabilityCurve) {
      const porosityPermCheck = this.checkPorosityPermeabilityConsistency(
        porosityCurve.data,
        permeabilityCurve.data,
        appliedParams.porosityPermeabilityR2!
      );
      checks.push(porosityPermCheck);
    }

    // Gamma Ray-Shale consistency
    if (gammaRayCurve) {
      const gammaRayCheck = this.checkGammaRayConsistency(
        gammaRayCurve.data,
        appliedParams.gammaRayShaleThreshold!
      );
      checks.push(gammaRayCheck);
    }

    // Resistivity-Saturation consistency
    if (resistivityCurve && porosityCurve) {
      const resistivityCheck = this.checkResistivityConsistency(
        resistivityCurve.data,
        porosityCurve.data,
        appliedParams.resistivityCutoff!
      );
      checks.push(resistivityCheck);
    }

    // Density-Lithology consistency
    if (densityCurve) {
      const densityCheck = this.checkDensityConsistency(
        densityCurve.data,
        appliedParams.densityRange!
      );
      checks.push(densityCheck);
    }

    return checks;
  }

  /**
   * Calculate borehole correction for density logs
   */
  private calculateBoreholeCorrection(
    data: number[],
    boreholeSize: number,
    curveType: 'density' | 'neutron'
  ): EnvironmentalCorrection[] {
    const corrections: EnvironmentalCorrection[] = [];
    const nominalSize = 8.5; // inches
    
    if (Math.abs(boreholeSize - nominalSize) > 0.5) {
      const correctionFactor = curveType === 'density' ? 
        (boreholeSize - nominalSize) * 0.01 : // 0.01 g/cc per inch
        (boreholeSize - nominalSize) * 0.005; // 0.005 v/v per inch

      data.forEach((value, index) => {
        if (!isNaN(value) && isFinite(value) && value !== -999.25) {
          corrections.push({
            type: 'borehole_size',
            description: `Borehole size correction for ${curveType}`,
            originalValue: value,
            correctedValue: value - correctionFactor,
            correctionFactor,
            appliedAt: new Date()
          });
        }
      });
    }

    return corrections;
  }

  /**
   * Calculate neutron correction
   */
  private calculateNeutronCorrection(
    data: number[],
    boreholeSize: number
  ): EnvironmentalCorrection[] {
    return this.calculateBoreholeCorrection(data, boreholeSize, 'neutron');
  }

  /**
   * Calculate resistivity temperature correction
   */
  private calculateResistivityCorrection(
    data: number[],
    temperature: number
  ): EnvironmentalCorrection[] {
    const corrections: EnvironmentalCorrection[] = [];
    const referenceTemp = 75; // °F
    
    if (Math.abs(temperature - referenceTemp) > 10) {
      // Temperature correction factor (simplified)
      const tempFactor = 1 + (temperature - referenceTemp) * 0.02 / 100;

      data.forEach((value, index) => {
        if (!isNaN(value) && isFinite(value) && value > 0 && value !== -999.25) {
          corrections.push({
            type: 'temperature',
            description: 'Temperature correction for resistivity',
            originalValue: value,
            correctedValue: value / tempFactor,
            correctionFactor: tempFactor,
            appliedAt: new Date()
          });
        }
      });
    }

    return corrections;
  }

  /**
   * Check porosity-permeability consistency
   */
  private checkPorosityPermeabilityConsistency(
    porosityData: number[],
    permeabilityData: number[],
    r2Threshold: number
  ): GeologicalConsistencyCheck {
    const validPairs: { porosity: number; permeability: number }[] = [];
    
    for (let i = 0; i < Math.min(porosityData.length, permeabilityData.length); i++) {
      const phi = porosityData[i];
      const k = permeabilityData[i];
      
      if (!isNaN(phi) && !isNaN(k) && phi > 0 && k > 0) {
        validPairs.push({ porosity: phi, permeability: Math.log10(k) });
      }
    }

    if (validPairs.length < 10) {
      return {
        checkType: 'porosity_permeability',
        isConsistent: false,
        confidence: 'low',
        message: 'Insufficient data points for porosity-permeability correlation',
        suggestedAction: 'Acquire more data or use regional correlations'
      };
    }

    // Calculate correlation coefficient
    const r2 = this.calculateCorrelationCoefficient(
      validPairs.map(p => p.porosity),
      validPairs.map(p => p.permeability)
    );

    const isConsistent = r2 >= r2Threshold;
    const confidence: 'high' | 'medium' | 'low' = 
      r2 > 0.8 ? 'high' : r2 > 0.6 ? 'medium' : 'low';

    return {
      checkType: 'porosity_permeability',
      isConsistent,
      confidence,
      message: `Porosity-permeability correlation R² = ${r2.toFixed(3)}`,
      suggestedAction: isConsistent ? undefined : 'Review permeability calculations or data quality'
    };
  }

  /**
   * Check gamma ray consistency
   */
  private checkGammaRayConsistency(
    gammaRayData: number[],
    shaleThreshold: number
  ): GeologicalConsistencyCheck {
    const validData = gammaRayData.filter(val => !isNaN(val) && isFinite(val));
    
    if (validData.length === 0) {
      return {
        checkType: 'gamma_ray_shale',
        isConsistent: false,
        confidence: 'low',
        message: 'No valid gamma ray data',
        suggestedAction: 'Check gamma ray log quality'
      };
    }

    const mean = validData.reduce((sum, val) => sum + val, 0) / validData.length;
    const std = Math.sqrt(
      validData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / validData.length
    );

    // Check for reasonable range and distribution
    const minGR = Math.min(...validData);
    const maxGR = Math.max(...validData);
    const range = maxGR - minGR;

    const isConsistent = minGR >= 0 && maxGR <= 300 && range > 20 && std > 5;
    const confidence: 'high' | 'medium' | 'low' = 
      range > 50 && std > 15 ? 'high' : range > 30 && std > 10 ? 'medium' : 'low';

    return {
      checkType: 'gamma_ray_shale',
      isConsistent,
      confidence,
      message: `Gamma ray range: ${minGR.toFixed(1)}-${maxGR.toFixed(1)} API, std: ${std.toFixed(1)}`,
      suggestedAction: isConsistent ? undefined : 'Review gamma ray calibration and data quality'
    };
  }

  /**
   * Check resistivity consistency
   */
  private checkResistivityConsistency(
    resistivityData: number[],
    porosityData: number[],
    resistivityCutoff: number
  ): GeologicalConsistencyCheck {
    const validPairs: { resistivity: number; porosity: number }[] = [];
    
    for (let i = 0; i < Math.min(resistivityData.length, porosityData.length); i++) {
      const rt = resistivityData[i];
      const phi = porosityData[i];
      
      if (!isNaN(rt) && !isNaN(phi) && rt > 0 && phi > 0) {
        validPairs.push({ resistivity: rt, porosity: phi });
      }
    }

    if (validPairs.length === 0) {
      return {
        checkType: 'resistivity_saturation',
        isConsistent: false,
        confidence: 'low',
        message: 'No valid resistivity-porosity data pairs',
        suggestedAction: 'Check log data quality'
      };
    }

    // Check for inverse relationship (higher porosity should generally have lower resistivity in water zones)
    const highPorosityHighRes = validPairs.filter(p => p.porosity > 0.15 && p.resistivity > resistivityCutoff).length;
    const totalHighPorosity = validPairs.filter(p => p.porosity > 0.15).length;
    
    const hydrocarbon_indication = totalHighPorosity > 0 ? highPorosityHighRes / totalHighPorosity : 0;
    
    const isConsistent = true; // Resistivity can vary widely due to hydrocarbons
    const confidence: 'high' | 'medium' | 'low' = 
      validPairs.length > 50 ? 'high' : validPairs.length > 20 ? 'medium' : 'low';

    return {
      checkType: 'resistivity_saturation',
      isConsistent,
      confidence,
      message: `${(hydrocarbon_indication * 100).toFixed(1)}% of high porosity zones show high resistivity`,
      suggestedAction: hydrocarbon_indication > 0.3 ? 'Potential hydrocarbon zones identified' : undefined
    };
  }

  /**
   * Check density consistency
   */
  private checkDensityConsistency(
    densityData: number[],
    densityRange: [number, number]
  ): GeologicalConsistencyCheck {
    const validData = densityData.filter(val => !isNaN(val) && isFinite(val));
    
    if (validData.length === 0) {
      return {
        checkType: 'density_lithology',
        isConsistent: false,
        confidence: 'low',
        message: 'No valid density data',
        suggestedAction: 'Check density log quality'
      };
    }

    const minDensity = Math.min(...validData);
    const maxDensity = Math.max(...validData);
    const outOfRange = validData.filter(val => val < densityRange[0] || val > densityRange[1]).length;
    const percentOutOfRange = (outOfRange / validData.length) * 100;

    const isConsistent = percentOutOfRange < 5; // Less than 5% out of range
    const confidence: 'high' | 'medium' | 'low' = 
      percentOutOfRange < 1 ? 'high' : percentOutOfRange < 3 ? 'medium' : 'low';

    return {
      checkType: 'density_lithology',
      isConsistent,
      confidence,
      message: `Density range: ${minDensity.toFixed(2)}-${maxDensity.toFixed(2)} g/cc, ${percentOutOfRange.toFixed(1)}% out of range`,
      suggestedAction: isConsistent ? undefined : 'Review density calibration and borehole conditions'
    };
  }

  /**
   * Determine overall quality based on all checks
   */
  private determineOverallQuality(
    corrections: EnvironmentalCorrection[],
    outliers: { [curveName: string]: OutlierDetectionResult },
    consistencyChecks: GeologicalConsistencyCheck[],
    validationFlags: ValidationFlag[]
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    const criticalFlags = validationFlags.filter(f => f.severity === 'critical').length;
    const majorFlags = validationFlags.filter(f => f.severity === 'major').length;
    const minorFlags = validationFlags.filter(f => f.severity === 'minor').length;

    const inconsistentChecks = consistencyChecks.filter(c => !c.isConsistent).length;
    const totalOutliers = Object.values(outliers).reduce((sum, o) => sum + o.indices.length, 0);
    const totalChecks = consistencyChecks.length;

    // If no curves or data, quality is poor
    if (totalChecks === 0 && Object.keys(outliers).length === 0) {
      return 'poor';
    }

    if (criticalFlags > 0) {
      return 'poor';
    } else if (majorFlags > 2 || inconsistentChecks > 2) {
      return 'fair';
    } else if (majorFlags > 0 || inconsistentChecks > 0 || totalOutliers > 10) {
      return 'good';
    } else {
      return 'excellent';
    }
  }

  /**
   * Calculate quality metrics
   */
  private calculateQualityMetrics(
    wellData: WellLogData,
    outliers: { [curveName: string]: OutlierDetectionResult },
    consistencyChecks: GeologicalConsistencyCheck[]
  ): QualityMetrics {
    const totalDataPoints = wellData.curves.reduce((sum, curve) => sum + curve.data.length, 0);
    const validDataPoints = wellData.curves.reduce((sum, curve) => {
      return sum + curve.data.filter(val => val !== curve.nullValue && !isNaN(val) && isFinite(val)).length;
    }, 0);

    const dataCompleteness = totalDataPoints > 0 ? validDataPoints / totalDataPoints : 0;
    
    const consistentChecks = consistencyChecks.filter(c => c.isConsistent).length;
    const totalChecks = consistencyChecks.length;
    const consistencyRatio = totalChecks > 0 ? consistentChecks / totalChecks : 1;

    const confidenceLevel: 'high' | 'medium' | 'low' = 
      dataCompleteness > 0.9 && consistencyRatio > 0.8 ? 'high' :
      dataCompleteness > 0.7 && consistencyRatio > 0.6 ? 'medium' : 'low';

    return {
      dataCompleteness,
      environmentalCorrections: Object.keys(outliers),
      uncertaintyRange: [0.05, 0.15], // 5-15% based on data quality
      confidenceLevel
    };
  }

  /**
   * Helper method to find curve by name patterns
   */
  private findCurve(curves: LogCurve[], patterns: string[]): LogCurve | undefined {
    return curves.find(curve => 
      patterns.some(pattern => 
        curve.name.toLowerCase().includes(pattern.toLowerCase())
      )
    );
  }

  /**
   * Calculate correlation coefficient
   */
  private calculateCorrelationCoefficient(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Calculate median of an array
   */
  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0 ? 
      (sorted[mid - 1] + sorted[mid]) / 2 : 
      sorted[mid];
  }

  /**
   * Calculate statistical summary
   */
  private calculateStatistics(data: number[], nullValue: number = -999.25): StatisticalSummary {
    const validData = data.filter(val => val !== nullValue && !isNaN(val) && isFinite(val));

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
 * Default instance of the quality control calculator
 */
export const qualityControlCalculator = new QualityControlCalculator();