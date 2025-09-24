import { 
  WellLogData, 
  CompletionTarget, 
  ReservoirZone, 
  CalculationResult,
  GeologicalMarker 
} from '../types/petrophysics';

/**
 * Service for identifying and ranking completion targets based on reservoir quality metrics
 * Implements algorithms for perforation interval optimization and target selection
 */
export class CompletionTargetService {
  private targets: CompletionTarget[] = [];
  private reservoirZones: ReservoirZone[] = [];

  /**
   * Identify completion targets based on reservoir quality criteria
   */
  identifyCompletionTargets(
    wellData: WellLogData,
    porosityResults: CalculationResult,
    permeabilityResults: CalculationResult,
    saturationResults: CalculationResult,
    shaleVolumeResults: CalculationResult,
    cutoffs: ReservoirCutoffs
  ): CompletionTarget[] {
    const targets: CompletionTarget[] = [];
    
    // Validate input data
    if (!this.validateInputData(wellData, porosityResults, permeabilityResults, saturationResults, shaleVolumeResults)) {
      throw new Error('Invalid input data for completion target identification');
    }

    const depths = porosityResults.depths;
    const porosity = porosityResults.values;
    const permeability = permeabilityResults.values;
    const saturation = saturationResults.values;
    const shaleVolume = shaleVolumeResults.values;

    // Find intervals that meet reservoir quality criteria
    const qualityIntervals = this.findQualityIntervals(
      depths,
      porosity,
      permeability,
      saturation,
      shaleVolume,
      cutoffs
    );

    // Convert quality intervals to completion targets
    qualityIntervals.forEach((interval, index) => {
      const target: CompletionTarget = {
        wellName: wellData.wellName,
        startDepth: interval.startDepth,
        endDepth: interval.endDepth,
        thickness: interval.endDepth - interval.startDepth,
        averagePorosity: interval.averagePorosity,
        estimatedPermeability: interval.averagePermeability,
        waterSaturation: interval.averageWaterSaturation,
        shaleVolume: interval.averageShaleVolume,
        ranking: 0, // Will be calculated later
        quality: this.assessTargetQuality(interval)
      };

      targets.push(target);
    });

    // Rank targets based on multiple criteria
    const rankedTargets = this.rankTargets(targets);
    
    // Store targets
    this.targets = [...this.targets, ...rankedTargets];
    
    return rankedTargets;
  }

  /**
   * Rank completion targets based on reservoir quality metrics
   */
  rankTargets(targets: CompletionTarget[]): CompletionTarget[] {
    // Calculate composite score for each target
    const scoredTargets = targets.map(target => ({
      ...target,
      compositeScore: this.calculateCompositeScore(target)
    }));

    // Sort by composite score (highest first)
    scoredTargets.sort((a, b) => b.compositeScore - a.compositeScore);

    // Assign rankings
    return scoredTargets.map((target, index) => ({
      ...target,
      ranking: index + 1
    }));
  }

  /**
   * Optimize perforation intervals within completion targets
   */
  optimizePerforationIntervals(
    targets: CompletionTarget[],
    perforationSpacing: number = 20, // feet
    minPerforationLength: number = 10, // feet
    maxPerforationLength: number = 100 // feet
  ): PerforationInterval[] {
    const perforationIntervals: PerforationInterval[] = [];

    targets.forEach(target => {
      if (target.thickness < minPerforationLength) {
        return; // Skip targets that are too thin
      }

      // Determine optimal perforation strategy based on target quality
      const strategy = this.getPerforationStrategy(target);
      
      switch (strategy) {
        case 'full_completion':
          perforationIntervals.push({
            targetId: `${target.wellName}_${target.startDepth}`,
            startDepth: target.startDepth,
            endDepth: target.endDepth,
            perforationDensity: 12, // shots per foot
            strategy: 'full_completion',
            expectedProductivity: this.calculateExpectedProductivity(target)
          });
          break;

        case 'selective_completion':
          const selectiveIntervals = this.identifySelectiveIntervals(target, perforationSpacing);
          perforationIntervals.push(...selectiveIntervals);
          break;

        case 'limited_completion':
          const limitedInterval = this.identifyLimitedInterval(target, maxPerforationLength);
          if (limitedInterval) {
            perforationIntervals.push(limitedInterval);
          }
          break;
      }
    });

    return perforationIntervals.sort((a, b) => b.expectedProductivity - a.expectedProductivity);
  }

  /**
   * Generate completion recommendations based on target analysis
   */
  generateCompletionRecommendations(
    targets: CompletionTarget[],
    perforationIntervals: PerforationInterval[]
  ): CompletionRecommendation[] {
    const recommendations: CompletionRecommendation[] = [];

    targets.forEach(target => {
      const relatedPerforations = perforationIntervals.filter(
        perf => perf.targetId.includes(`${target.wellName}_${target.startDepth}`)
      );

      const recommendation: CompletionRecommendation = {
        targetId: `${target.wellName}_${target.startDepth}`,
        wellName: target.wellName,
        priority: this.calculatePriority(target),
        completionType: this.recommendCompletionType(target),
        perforationIntervals: relatedPerforations,
        stimulationRecommendation: this.recommendStimulation(target),
        expectedRecovery: this.estimateRecovery(target),
        riskAssessment: this.assessRisk(target),
        economicMetrics: this.calculateEconomicMetrics(target)
      };

      recommendations.push(recommendation);
    });

    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get all completion targets for a well
   */
  getTargetsForWell(wellName: string): CompletionTarget[] {
    return this.targets.filter(target => target.wellName === wellName);
  }

  /**
   * Get targets by quality rating
   */
  getTargetsByQuality(quality: 'excellent' | 'good' | 'fair' | 'poor'): CompletionTarget[] {
    return this.targets.filter(target => target.quality === quality);
  }

  /**
   * Export targets to various formats
   */
  exportTargets(format: 'json' | 'csv' | 'excel'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(this.targets, null, 2);
      case 'csv':
        return this.exportToCsv();
      case 'excel':
        return this.exportToExcel();
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  // Private helper methods

  private validateInputData(
    wellData: WellLogData,
    porosity: CalculationResult,
    permeability: CalculationResult,
    saturation: CalculationResult,
    shaleVolume: CalculationResult
  ): boolean {
    // Check that all results have the same length and depth arrays
    const lengths = [porosity.values.length, permeability.values.length, saturation.values.length, shaleVolume.values.length];
    return lengths.every(length => length === lengths[0]) && lengths[0] > 0;
  }

  private findQualityIntervals(
    depths: number[],
    porosity: number[],
    permeability: number[],
    saturation: number[],
    shaleVolume: number[],
    cutoffs: ReservoirCutoffs
  ): QualityInterval[] {
    const intervals: QualityInterval[] = [];
    let currentInterval: QualityInterval | null = null;

    for (let i = 0; i < depths.length; i++) {
      const meetsQuality = 
        porosity[i] >= cutoffs.porosityMin &&
        permeability[i] >= cutoffs.permeabilityMin &&
        saturation[i] <= cutoffs.waterSaturationMax &&
        shaleVolume[i] <= cutoffs.shaleVolumeMax;

      if (meetsQuality) {
        if (!currentInterval) {
          // Start new interval
          currentInterval = {
            startDepth: depths[i],
            endDepth: depths[i],
            averagePorosity: porosity[i],
            averagePermeability: permeability[i],
            averageWaterSaturation: saturation[i],
            averageShaleVolume: shaleVolume[i],
            dataPoints: 1
          };
        } else {
          // Extend current interval
          currentInterval.endDepth = depths[i];
          currentInterval.averagePorosity = 
            (currentInterval.averagePorosity * currentInterval.dataPoints + porosity[i]) / (currentInterval.dataPoints + 1);
          currentInterval.averagePermeability = 
            (currentInterval.averagePermeability * currentInterval.dataPoints + permeability[i]) / (currentInterval.dataPoints + 1);
          currentInterval.averageWaterSaturation = 
            (currentInterval.averageWaterSaturation * currentInterval.dataPoints + saturation[i]) / (currentInterval.dataPoints + 1);
          currentInterval.averageShaleVolume = 
            (currentInterval.averageShaleVolume * currentInterval.dataPoints + shaleVolume[i]) / (currentInterval.dataPoints + 1);
          currentInterval.dataPoints++;
        }
      } else {
        if (currentInterval && (currentInterval.endDepth - currentInterval.startDepth) >= 5) {
          // End current interval if it's thick enough (minimum 5 feet)
          intervals.push(currentInterval);
        }
        currentInterval = null;
      }
    }

    // Add final interval if it exists
    if (currentInterval && (currentInterval.endDepth - currentInterval.startDepth) >= 5) {
      intervals.push(currentInterval);
    }

    return intervals;
  }

  private assessTargetQuality(interval: QualityInterval): 'excellent' | 'good' | 'fair' | 'poor' {
    const thickness = interval.endDepth - interval.startDepth;
    const porosity = interval.averagePorosity;
    const permeability = interval.averagePermeability;
    const saturation = interval.averageWaterSaturation;

    // Scoring based on multiple criteria
    let score = 0;

    // Thickness scoring
    if (thickness >= 50) score += 3;
    else if (thickness >= 20) score += 2;
    else if (thickness >= 10) score += 1;

    // Porosity scoring
    if (porosity >= 0.20) score += 3;
    else if (porosity >= 0.15) score += 2;
    else if (porosity >= 0.10) score += 1;

    // Permeability scoring
    if (permeability >= 100) score += 3;
    else if (permeability >= 10) score += 2;
    else if (permeability >= 1) score += 1;

    // Water saturation scoring (lower is better)
    if (saturation <= 0.30) score += 3;
    else if (saturation <= 0.50) score += 2;
    else if (saturation <= 0.70) score += 1;

    // Convert score to quality rating
    if (score >= 10) return 'excellent';
    if (score >= 7) return 'good';
    if (score >= 4) return 'fair';
    return 'poor';
  }

  private calculateCompositeScore(target: CompletionTarget): number {
    // Weighted scoring system
    const weights = {
      thickness: 0.20,
      porosity: 0.25,
      permeability: 0.30,
      saturation: 0.25
    };

    // Normalize values to 0-100 scale
    const thicknessScore = Math.min(target.thickness / 100 * 100, 100);
    const porosityScore = Math.min(target.averagePorosity / 0.30 * 100, 100);
    const permeabilityScore = Math.min(Math.log10(target.estimatedPermeability + 1) / 3 * 100, 100);
    const saturationScore = Math.max((1 - target.waterSaturation) * 100, 0);

    return (
      thicknessScore * weights.thickness +
      porosityScore * weights.porosity +
      permeabilityScore * weights.permeability +
      saturationScore * weights.saturation
    );
  }

  private getPerforationStrategy(target: CompletionTarget): 'full_completion' | 'selective_completion' | 'limited_completion' {
    if (target.quality === 'excellent' && target.thickness >= 30) {
      return 'full_completion';
    } else if (target.quality === 'good' || (target.quality === 'excellent' && target.thickness < 30)) {
      return 'selective_completion';
    } else {
      return 'limited_completion';
    }
  }

  private identifySelectiveIntervals(target: CompletionTarget, spacing: number): PerforationInterval[] {
    const intervals: PerforationInterval[] = [];
    const totalThickness = target.thickness;
    const numIntervals = Math.ceil(totalThickness / spacing);

    for (let i = 0; i < numIntervals; i++) {
      const startDepth = target.startDepth + (i * spacing);
      const endDepth = Math.min(startDepth + spacing * 0.6, target.endDepth); // 60% perforation coverage

      intervals.push({
        targetId: `${target.wellName}_${target.startDepth}_${i}`,
        startDepth,
        endDepth,
        perforationDensity: 8,
        strategy: 'selective_completion',
        expectedProductivity: this.calculateExpectedProductivity(target) * 0.8
      });
    }

    return intervals;
  }

  private identifyLimitedInterval(target: CompletionTarget, maxLength: number): PerforationInterval | null {
    const intervalLength = Math.min(target.thickness, maxLength);
    const startDepth = target.startDepth + (target.thickness - intervalLength) / 2; // Center the interval

    return {
      targetId: `${target.wellName}_${target.startDepth}_limited`,
      startDepth,
      endDepth: startDepth + intervalLength,
      perforationDensity: 6,
      strategy: 'limited_completion',
      expectedProductivity: this.calculateExpectedProductivity(target) * 0.5
    };
  }

  private calculateExpectedProductivity(target: CompletionTarget): number {
    // Simplified productivity calculation based on reservoir properties
    const kh = target.estimatedPermeability * target.thickness;
    const phi = target.averagePorosity;
    const so = 1 - target.waterSaturation; // Oil saturation

    return kh * phi * so * 100; // Arbitrary productivity index
  }

  private calculatePriority(target: CompletionTarget): number {
    // Lower number = higher priority
    const qualityPriority = {
      'excellent': 1,
      'good': 2,
      'fair': 3,
      'poor': 4
    };

    return qualityPriority[target.quality] + (target.ranking * 0.1);
  }

  private recommendCompletionType(target: CompletionTarget): string {
    if (target.estimatedPermeability > 50) {
      return 'Conventional Completion';
    } else if (target.estimatedPermeability > 1) {
      return 'Hydraulic Fracturing';
    } else {
      return 'Multi-Stage Fracturing';
    }
  }

  private recommendStimulation(target: CompletionTarget): string {
    if (target.estimatedPermeability < 1) {
      return 'Multi-stage hydraulic fracturing with proppant';
    } else if (target.estimatedPermeability < 10) {
      return 'Acid fracturing or hydraulic fracturing';
    } else {
      return 'Acid stimulation or no stimulation required';
    }
  }

  private estimateRecovery(target: CompletionTarget): number {
    // Simplified recovery factor calculation
    const recoveryFactor = Math.min(
      0.6 * target.averagePorosity * (1 - target.waterSaturation),
      0.4
    );
    
    return recoveryFactor * target.thickness * 7758; // Convert to barrels per acre-foot
  }

  private assessRisk(target: CompletionTarget): 'low' | 'medium' | 'high' {
    if (target.quality === 'excellent' && target.waterSaturation < 0.4) {
      return 'low';
    } else if (target.quality === 'good' && target.waterSaturation < 0.6) {
      return 'medium';
    } else {
      return 'high';
    }
  }

  private calculateEconomicMetrics(target: CompletionTarget): EconomicMetrics {
    const estimatedRecovery = this.estimateRecovery(target);
    const completionCost = this.estimateCompletionCost(target);
    
    return {
      estimatedRecovery,
      completionCost,
      netPresentValue: estimatedRecovery * 50 - completionCost, // Assuming $50/bbl
      paybackPeriod: completionCost / (estimatedRecovery * 50 / 10), // 10-year production
      rateOfReturn: (estimatedRecovery * 50 - completionCost) / completionCost
    };
  }

  private estimateCompletionCost(target: CompletionTarget): number {
    const baseCost = 100000; // Base completion cost
    const perFootCost = 5000; // Cost per foot of completion
    const stimulationCost = target.estimatedPermeability < 10 ? 200000 : 50000;
    
    return baseCost + (target.thickness * perFootCost) + stimulationCost;
  }

  private exportToCsv(): string {
    const headers = [
      'Well Name', 'Start Depth', 'End Depth', 'Thickness', 'Avg Porosity', 
      'Est Permeability', 'Water Saturation', 'Shale Volume', 'Quality', 'Ranking'
    ];
    
    const rows = [headers.join(',')];
    
    this.targets.forEach(target => {
      rows.push([
        target.wellName,
        target.startDepth.toString(),
        target.endDepth.toString(),
        target.thickness.toString(),
        target.averagePorosity.toFixed(3),
        target.estimatedPermeability.toFixed(1),
        target.waterSaturation.toFixed(3),
        target.shaleVolume.toFixed(3),
        target.quality,
        target.ranking.toString()
      ].join(','));
    });
    
    return rows.join('\n');
  }

  private exportToExcel(): string {
    // This would require a proper Excel library implementation
    // For now, return a placeholder
    return 'Excel export would be implemented with a library like xlsx';
  }
}

// Supporting interfaces
interface ReservoirCutoffs {
  porosityMin: number;
  permeabilityMin: number;
  waterSaturationMax: number;
  shaleVolumeMax: number;
}

interface QualityInterval {
  startDepth: number;
  endDepth: number;
  averagePorosity: number;
  averagePermeability: number;
  averageWaterSaturation: number;
  averageShaleVolume: number;
  dataPoints: number;
}

interface PerforationInterval {
  targetId: string;
  startDepth: number;
  endDepth: number;
  perforationDensity: number;
  strategy: 'full_completion' | 'selective_completion' | 'limited_completion';
  expectedProductivity: number;
}

interface CompletionRecommendation {
  targetId: string;
  wellName: string;
  priority: number;
  completionType: string;
  perforationIntervals: PerforationInterval[];
  stimulationRecommendation: string;
  expectedRecovery: number;
  riskAssessment: 'low' | 'medium' | 'high';
  economicMetrics: EconomicMetrics;
}

interface EconomicMetrics {
  estimatedRecovery: number;
  completionCost: number;
  netPresentValue: number;
  paybackPeriod: number;
  rateOfReturn: number;
}

export default CompletionTargetService;