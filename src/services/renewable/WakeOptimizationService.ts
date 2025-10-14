/**
 * Wake Optimization Service
 * 
 * Provides wake loss calculations, optimization recommendations,
 * and downstream impact analysis for wind farm layouts.
 */

import {
  WakeAnalysisData,
  TurbineLayout,
  TurbinePosition,
  WindResourceData,
  WakeOptimizationRecommendation,
  OptimizationBenefit,
  OptimizationAction,
  TurbineWakeResults,
  WakeOverallMetrics,
  EconomicImpact,
  WakeAnalysisResults
} from '../../types/wakeData';

export class WakeOptimizationService {
  /**
   * Calculate wake losses for different turbine configurations
   */
  static calculateWakeLosses(
    turbineLayout: TurbineLayout,
    windData: WindResourceData,
    wakeModelType: 'jensen' | 'larsen' | 'fuga' = 'jensen'
  ): WakeAnalysisResults {
    const turbines = turbineLayout.turbines;
    const turbineResults: TurbineWakeResults[] = [];
    
    // Calculate wake effects for each turbine
    for (const turbine of turbines) {
      const wakeResult = this.calculateTurbineWakeEffects(
        turbine,
        turbines,
        windData,
        wakeModelType
      );
      turbineResults.push(wakeResult);
    }
    
    // Calculate overall metrics
    const overallMetrics = this.calculateOverallMetrics(
      turbineResults,
      turbineLayout.totalCapacity
    );
    
    // Generate optimization recommendations
    const optimizationRecommendations = this.generateOptimizationRecommendations(
      turbineResults,
      turbineLayout,
      windData
    );
    
    return {
      overallMetrics,
      turbineResults,
      wakeVisualization: {
        wakeFields: [],
        flowVisualization: { streamlines: [], velocityVectors: [] },
        turbineInteractions: [],
        crossSections: []
      },
      optimizationRecommendations,
      sensitivityAnalysis: {
        parameters: [],
        results: [],
        recommendations: []
      },
      uncertaintyAnalysis: {
        sources: [],
        totalUncertainty: 10,
        confidenceIntervals: [],
        recommendations: []
      }
    };
  }
  
  /**
   * Calculate wake effects for individual turbine
   */
  private static calculateTurbineWakeEffects(
    targetTurbine: TurbinePosition,
    allTurbines: TurbinePosition[],
    windData: WindResourceData,
    wakeModelType: string
  ): TurbineWakeResults {
    const upstreamTurbines = this.findUpstreamTurbines(
      targetTurbine,
      allTurbines,
      windData.statistics.prevailingDirection
    );
    
    // Calculate wake deficit using Jensen wake model (simplified)
    let totalWakeDeficit = 0;
    let totalPowerReduction = 0;
    let turbulenceIncrease = 0;
    
    const upstreamInfluences = upstreamTurbines.map(upstream => {
      const distance = this.calculateDistance(targetTurbine, upstream);
      const wakeDeficit = this.jensenWakeDeficit(
        distance,
        upstream.rotorDiameter,
        windData.statistics.meanWindSpeed
      );
      
      totalWakeDeficit += wakeDeficit;
      
      return {
        sourceTurbineId: upstream.id,
        distance,
        direction: this.calculateDirection(upstream, targetTurbine),
        wakeContribution: wakeDeficit,
        overlapArea: this.calculateWakeOverlapArea(upstream, targetTurbine, distance)
      };
    });
    
    // Convert wake deficit to power reduction
    totalPowerReduction = this.wakeDeficitToPowerReduction(totalWakeDeficit);
    
    // Calculate turbulence increase
    turbulenceIncrease = Math.min(50, upstreamTurbines.length * 5 + Math.random() * 10);
    
    // Calculate energy loss
    const annualEnergyLoss = this.calculateAnnualEnergyLoss(
      targetTurbine.ratedPower,
      totalPowerReduction,
      windData.statistics.meanWindSpeed
    );
    
    // Find downstream impacts
    const downstreamImpacts = this.calculateDownstreamImpacts(
      targetTurbine,
      allTurbines,
      windData.statistics.prevailingDirection
    );
    
    return {
      turbineId: targetTurbine.id,
      position: targetTurbine,
      wakeDeficit: totalWakeDeficit,
      powerReduction: totalPowerReduction,
      energyLoss: annualEnergyLoss,
      turbulenceIncrease,
      fatigueImpact: turbulenceIncrease * 0.02, // Simplified fatigue calculation
      upstreamInfluences,
      downstreamImpacts
    };
  }
  
  /**
   * Jensen wake model implementation (simplified)
   */
  private static jensenWakeDeficit(
    distance: number,
    rotorDiameter: number,
    windSpeed: number,
    wakeDecayConstant: number = 0.075
  ): number {
    if (distance < rotorDiameter) return 0;
    
    // Jensen wake model: velocity deficit
    const thrustCoefficient = this.getThrustCoefficient(windSpeed);
    const wakeRadius = rotorDiameter / 2 + wakeDecayConstant * distance;
    const velocityDeficit = (1 - Math.sqrt(1 - thrustCoefficient)) * 
                           Math.pow(rotorDiameter / (2 * wakeRadius), 2);
    
    return Math.min(0.6, Math.max(0, velocityDeficit * 100)); // Percentage
  }
  
  /**
   * Get thrust coefficient based on wind speed
   */
  private static getThrustCoefficient(windSpeed: number): number {
    // Simplified thrust coefficient curve
    if (windSpeed < 3) return 0;
    if (windSpeed < 6) return 0.8;
    if (windSpeed < 12) return 0.8 - (windSpeed - 6) * 0.1;
    if (windSpeed < 25) return 0.2;
    return 0;
  }
  
  /**
   * Convert wake deficit to power reduction
   */
  private static wakeDeficitToPowerReduction(wakeDeficit: number): number {
    // Power reduction is approximately cubic relationship with velocity deficit
    const velocityDeficitRatio = wakeDeficit / 100;
    const powerReduction = 1 - Math.pow(1 - velocityDeficitRatio, 3);
    return powerReduction * 100; // Percentage
  }
  
  /**
   * Find upstream turbines affecting target turbine
   */
  private static findUpstreamTurbines(
    targetTurbine: TurbinePosition,
    allTurbines: TurbinePosition[],
    prevailingDirection: number
  ): TurbinePosition[] {
    const upstreamTurbines: TurbinePosition[] = [];
    
    for (const turbine of allTurbines) {
      if (turbine.id === targetTurbine.id) continue;
      
      const direction = this.calculateDirection(turbine, targetTurbine);
      const directionDiff = Math.abs(direction - prevailingDirection);
      
      // Consider turbine upstream if within 30 degrees of prevailing wind direction
      if (directionDiff <= 30 || directionDiff >= 330) {
        const distance = this.calculateDistance(turbine, targetTurbine);
        
        // Only consider turbines within reasonable wake influence distance
        if (distance <= turbine.rotorDiameter * 20) {
          upstreamTurbines.push(turbine);
        }
      }
    }
    
    return upstreamTurbines.sort((a, b) => 
      this.calculateDistance(a, targetTurbine) - this.calculateDistance(b, targetTurbine)
    );
  }
  
  /**
   * Calculate downstream impacts from turbine
   */
  private static calculateDownstreamImpacts(
    sourceTurbine: TurbinePosition,
    allTurbines: TurbinePosition[],
    prevailingDirection: number
  ) {
    const downstreamImpacts = [];
    
    for (const turbine of allTurbines) {
      if (turbine.id === sourceTurbine.id) continue;
      
      const direction = this.calculateDirection(sourceTurbine, turbine);
      const directionDiff = Math.abs(direction - prevailingDirection);
      
      // Consider turbine downstream if within wake cone
      if (directionDiff <= 30 || directionDiff >= 330) {
        const distance = this.calculateDistance(sourceTurbine, turbine);
        
        if (distance <= sourceTurbine.rotorDiameter * 20) {
          const wakeContribution = this.jensenWakeDeficit(
            distance,
            sourceTurbine.rotorDiameter,
            8.0 // Assumed wind speed
          );
          
          downstreamImpacts.push({
            affectedTurbineId: turbine.id,
            distance,
            direction,
            wakeContribution,
            overlapArea: this.calculateWakeOverlapArea(sourceTurbine, turbine, distance)
          });
        }
      }
    }
    
    return downstreamImpacts;
  }
  
  /**
   * Calculate distance between two turbines
   */
  private static calculateDistance(turbine1: TurbinePosition, turbine2: TurbinePosition): number {
    const dx = turbine1.x - turbine2.x;
    const dy = turbine1.y - turbine2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * Calculate direction from turbine1 to turbine2 (degrees)
   */
  private static calculateDirection(turbine1: TurbinePosition, turbine2: TurbinePosition): number {
    const dx = turbine2.x - turbine1.x;
    const dy = turbine2.y - turbine1.y;
    let angle = Math.atan2(dy, dx) * 180 / Math.PI;
    if (angle < 0) angle += 360;
    return angle;
  }
  
  /**
   * Calculate wake overlap area
   */
  private static calculateWakeOverlapArea(
    sourceTurbine: TurbinePosition,
    targetTurbine: TurbinePosition,
    distance: number
  ): number {
    const wakeRadius = sourceTurbine.rotorDiameter / 2 + 0.075 * distance;
    const targetRadius = targetTurbine.rotorDiameter / 2;
    
    // Simplified overlap calculation
    const overlapRadius = Math.min(wakeRadius, targetRadius);
    return Math.PI * overlapRadius * overlapRadius;
  }
  
  /**
   * Calculate annual energy loss for turbine
   */
  private static calculateAnnualEnergyLoss(
    ratedPower: number,
    powerReduction: number,
    meanWindSpeed: number
  ): number {
    // Simplified capacity factor calculation
    const baseCapacityFactor = Math.min(0.5, meanWindSpeed / 20);
    const energyLossRatio = powerReduction / 100;
    const annualEnergyLoss = ratedPower * 8760 * baseCapacityFactor * energyLossRatio / 1000; // MWh
    
    return annualEnergyLoss;
  }
  
  /**
   * Calculate overall wake metrics
   */
  private static calculateOverallMetrics(
    turbineResults: TurbineWakeResults[],
    totalCapacity: number
  ): WakeOverallMetrics {
    const totalTurbines = turbineResults.length;
    const totalWakeLoss = turbineResults.reduce((sum, result) => sum + result.powerReduction, 0) / totalTurbines;
    const averageWakeLoss = totalWakeLoss;
    const maxWakeLoss = Math.max(...turbineResults.map(r => r.powerReduction));
    const wakeEfficiency = 100 - totalWakeLoss;
    
    const totalEnergyLoss = turbineResults.reduce((sum, result) => sum + result.energyLoss, 0);
    const capacityFactorReduction = totalWakeLoss * 0.35; // Simplified relationship
    
    // Economic impact calculation
    const electricityPrice = 50; // $/MWh
    const annualRevenueLoss = totalEnergyLoss * electricityPrice;
    const projectLifetime = 25; // years
    const discountRate = 0.08;
    
    const netPresentValueImpact = annualRevenueLoss * 
      ((1 - Math.pow(1 + discountRate, -projectLifetime)) / discountRate);
    
    const economicImpact: EconomicImpact = {
      annualRevenueLoss,
      netPresentValueImpact,
      paybackPeriodIncrease: totalWakeLoss * 0.1, // Simplified calculation
      levelizedCostIncrease: totalWakeLoss * 0.5 // $/MWh
    };
    
    return {
      totalWakeLoss,
      averageWakeLoss,
      maxWakeLoss,
      wakeEfficiency,
      energyYieldReduction: totalEnergyLoss,
      capacityFactorReduction,
      economicImpact
    };
  }
  
  /**
   * Generate optimization recommendations
   */
  private static generateOptimizationRecommendations(
    turbineResults: TurbineWakeResults[],
    turbineLayout: TurbineLayout,
    windData: WindResourceData
  ): WakeOptimizationRecommendation[] {
    const recommendations: WakeOptimizationRecommendation[] = [];
    
    // Find severely affected turbines (>10% power loss)
    const severelyAffected = turbineResults.filter(r => r.powerReduction > 10);
    
    if (severelyAffected.length > 0) {
      // Layout modification recommendation
      const layoutModification: WakeOptimizationRecommendation = {
        type: 'layout_modification',
        priority: 'high',
        description: `Relocate ${Math.min(3, severelyAffected.length)} severely affected turbines to reduce wake overlap`,
        expectedBenefit: {
          wakeLossReduction: Math.min(5, severelyAffected.length * 1.5),
          energyYieldIncrease: severelyAffected.reduce((sum, r) => sum + r.energyLoss, 0) * 0.6,
          revenueIncrease: severelyAffected.reduce((sum, r) => sum + r.energyLoss, 0) * 0.6 * 50,
          paybackPeriod: 2.5,
          riskReduction: 0.3
        },
        implementationCost: 0.4,
        implementationComplexity: 'medium',
        actions: severelyAffected.slice(0, 3).map(result => ({
          action: `Relocate turbine ${result.turbineId}`,
          targetTurbines: [result.turbineId],
          parameters: {
            currentPosition: { x: result.position.x, y: result.position.y },
            recommendedOffset: { x: 200, y: 100 }
          },
          expectedImpact: result.powerReduction / 100,
          feasibility: 0.8
        }))
      };
      
      recommendations.push(layoutModification);
    }
    
    // Turbine selection recommendation for high turbulence areas
    const highTurbulenceTurbines = turbineResults.filter(r => r.turbulenceIncrease > 20);
    
    if (highTurbulenceTurbines.length > 0) {
      const turbineSelection: WakeOptimizationRecommendation = {
        type: 'turbine_selection',
        priority: 'medium',
        description: `Consider turbines with better wake performance for ${highTurbulenceTurbines.length} high-turbulence locations`,
        expectedBenefit: {
          wakeLossReduction: 2.0,
          energyYieldIncrease: turbineLayout.totalCapacity * 8760 * 0.35 * 0.02,
          revenueIncrease: turbineLayout.totalCapacity * 8760 * 0.35 * 0.02 * 50,
          paybackPeriod: 5.0,
          riskReduction: 0.2
        },
        implementationCost: 0.6,
        implementationComplexity: 'high',
        actions: [{
          action: 'Upgrade to wake-optimized turbine models',
          targetTurbines: highTurbulenceTurbines.map(r => r.turbineId),
          parameters: {
            currentModel: turbineLayout.turbineModel.model,
            recommendedModel: 'Wake-Optimized Turbine'
          },
          expectedImpact: 0.6,
          feasibility: 0.7
        }]
      };
      
      recommendations.push(turbineSelection);
    }
    
    // Control strategy recommendation
    if (turbineResults.some(r => r.upstreamInfluences.length > 2)) {
      const controlStrategy: WakeOptimizationRecommendation = {
        type: 'control_strategy',
        priority: 'medium',
        description: 'Implement wake steering control to redirect wakes away from downstream turbines',
        expectedBenefit: {
          wakeLossReduction: 3.0,
          energyYieldIncrease: turbineLayout.totalCapacity * 8760 * 0.35 * 0.03,
          revenueIncrease: turbineLayout.totalCapacity * 8760 * 0.35 * 0.03 * 50,
          paybackPeriod: 3.0,
          riskReduction: 0.1
        },
        implementationCost: 0.2,
        implementationComplexity: 'low',
        actions: [{
          action: 'Install wake steering control system',
          targetTurbines: turbineResults.filter(r => r.downstreamImpacts.length > 1).map(r => r.turbineId),
          parameters: {
            steeringAngle: 5, // degrees
            activationWindSpeed: 6 // m/s
          },
          expectedImpact: 0.7,
          feasibility: 0.9
        }]
      };
      
      recommendations.push(controlStrategy);
    }
    
    // Sort recommendations by priority and expected benefit
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return b.expectedBenefit.wakeLossReduction - a.expectedBenefit.wakeLossReduction;
    });
  }
  
  /**
   * Provide wake optimization recommendations based on analysis
   */
  static provideOptimizationRecommendations(
    wakeData: WakeAnalysisData
  ): WakeOptimizationRecommendation[] {
    return wakeData.results.optimizationRecommendations;
  }
  
  /**
   * Show downstream impact on energy production
   */
  static calculateDownstreamEnergyImpact(
    sourceTurbine: TurbinePosition,
    affectedTurbines: TurbinePosition[],
    windData: WindResourceData
  ): {
    totalEnergyImpact: number; // MWh/year
    affectedTurbineCount: number;
    averageImpactPerTurbine: number; // %
    economicImpact: number; // $/year
  } {
    let totalEnergyImpact = 0;
    let totalPowerReduction = 0;
    
    for (const turbine of affectedTurbines) {
      const distance = this.calculateDistance(sourceTurbine, turbine);
      const wakeDeficit = this.jensenWakeDeficit(
        distance,
        sourceTurbine.rotorDiameter,
        windData.statistics.meanWindSpeed
      );
      
      const powerReduction = this.wakeDeficitToPowerReduction(wakeDeficit);
      const energyLoss = this.calculateAnnualEnergyLoss(
        turbine.ratedPower,
        powerReduction,
        windData.statistics.meanWindSpeed
      );
      
      totalEnergyImpact += energyLoss;
      totalPowerReduction += powerReduction;
    }
    
    const averageImpactPerTurbine = affectedTurbines.length > 0 ? 
      totalPowerReduction / affectedTurbines.length : 0;
    
    const economicImpact = totalEnergyImpact * 50; // Assuming $50/MWh
    
    return {
      totalEnergyImpact,
      affectedTurbineCount: affectedTurbines.length,
      averageImpactPerTurbine,
      economicImpact
    };
  }
  
  /**
   * Calculate wake losses for different turbine configurations
   */
  static compareLayoutConfigurations(
    layouts: TurbineLayout[],
    windData: WindResourceData
  ): Array<{
    layout: TurbineLayout;
    wakeEfficiency: number;
    totalWakeLoss: number;
    energyYield: number;
    economicValue: number;
    ranking: number;
  }> {
    const results = layouts.map(layout => {
      const wakeResults = this.calculateWakeLosses(layout, windData);
      const overallMetrics = wakeResults.overallMetrics;
      
      return {
        layout,
        wakeEfficiency: overallMetrics.wakeEfficiency,
        totalWakeLoss: overallMetrics.totalWakeLoss,
        energyYield: layout.totalCapacity * 8760 * 0.35 * (overallMetrics.wakeEfficiency / 100),
        economicValue: layout.totalCapacity * 8760 * 0.35 * (overallMetrics.wakeEfficiency / 100) * 50,
        ranking: 0 // Will be set after sorting
      };
    });
    
    // Sort by economic value and assign rankings
    results.sort((a, b) => b.economicValue - a.economicValue);
    results.forEach((result, index) => {
      result.ranking = index + 1;
    });
    
    return results;
  }
}