/**
 * Layout Optimization Service
 * 
 * Implements multi-objective optimization algorithms for turbine placement
 * considering energy yield, wake losses, and terrain constraints.
 */

import {
  LayoutOptimizationData,
  OptimizationConfig,
  OptimizationResults,
  OptimizedLayout,
  OptimizedTurbinePosition,
  OptimizationConstraint,
  OptimizationSiteArea,
  LayoutMetrics,
  EnergyAnalysis,
  ConstraintViolation,
  OptimizationRecommendation,
  PerformanceMetrics,
  ConstraintCompliance,
  OptimizationIteration,
  TurbineOptimizationData
} from '../../types/layoutOptimization';
import { WindResourceData } from '../../types/windData';
import { TurbineSpecification, WakeAnalysisResults } from '../../types/wakeData';
import { WakeOptimizationService } from './WakeOptimizationService';

/**
 * Layout Optimization Service
 * 
 * Provides turbine layout optimization using genetic algorithms and other
 * multi-objective optimization techniques.
 */
export class LayoutOptimizationService {
  private wakeService: WakeOptimizationService;
  private optimizationHistory: OptimizationIteration[] = [];
  private currentGeneration = 0;

  constructor() {
    this.wakeService = new WakeOptimizationService();
  }

  /**
   * Optimize turbine layout for a given site
   */
  async optimizeLayout(
    siteArea: OptimizationSiteArea,
    windData: WindResourceData,
    turbineSpec: TurbineSpecification,
    constraints: OptimizationConstraint[],
    config: OptimizationConfig
  ): Promise<OptimizationResults> {
    console.log('Starting layout optimization...');
    
    try {
      // Initialize optimization
      this.optimizationHistory = [];
      this.currentGeneration = 0;

      // Generate candidate positions
      const candidatePositions = this.generateCandidatePositions(siteArea, config);
      console.log(`Generated ${candidatePositions.length} candidate positions`);

      // Filter by hard constraints
      const validPositions = this.filterByConstraints(candidatePositions, constraints, siteArea);
      console.log(`${validPositions.length} positions remain after constraint filtering`);

      if (validPositions.length === 0) {
        throw new Error('No valid positions found after applying constraints');
      }

      // Run optimization algorithm
      const optimizationResults = await this.runOptimization(
        validPositions,
        windData,
        turbineSpec,
        constraints,
        config,
        siteArea
      );

      // Generate recommendations
      const recommendations = this.generateRecommendations(optimizationResults, constraints);

      return {
        bestLayout: optimizationResults.bestLayout,
        alternativeLayouts: optimizationResults.alternativeLayouts,
        optimizationHistory: this.optimizationHistory,
        performanceMetrics: optimizationResults.performanceMetrics,
        constraintCompliance: optimizationResults.constraintCompliance,
        recommendations
      };

    } catch (error) {
      console.error('Layout optimization failed:', error);
      throw new Error(`Layout optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate candidate turbine positions within site boundary
   */
  private generateCandidatePositions(
    siteArea: OptimizationSiteArea,
    config: OptimizationConfig
  ): Array<{ x: number; y: number; lat: number; lng: number }> {
    const positions: Array<{ x: number; y: number; lat: number; lng: number }> = [];
    const gridResolution = config.parameters.gridResolution || 100; // meters

    // Get site bounds
    const bounds = this.calculateSiteBounds(siteArea.boundary);
    
    // Generate grid of candidate positions
    for (let x = bounds.minX; x <= bounds.maxX; x += gridResolution) {
      for (let y = bounds.minY; y <= bounds.maxY; y += gridResolution) {
        // Check if position is within site boundary
        if (this.isPointInPolygon({ x, y }, siteArea.boundary)) {
          // Check if position is not in exclusion zones
          const inExclusionZone = siteArea.exclusionZones.some(zone => 
            this.isPointInPolygon({ x, y }, zone.geometry)
          );
          
          if (!inExclusionZone) {
            // Convert to geographic coordinates (simplified conversion)
            const lat = bounds.centerLat + (y - bounds.centerY) / 111000; // rough conversion
            const lng = bounds.centerLng + (x - bounds.centerX) / (111000 * Math.cos(bounds.centerLat * Math.PI / 180));
            
            positions.push({ x, y, lat, lng });
          }
        }
      }
    }

    return positions;
  }

  /**
   * Calculate site boundary bounds
   */
  private calculateSiteBounds(boundary: { coordinates: Array<[number, number]> }) {
    const coords = boundary.coordinates;
    
    // For testing, assume coordinates are already in local coordinate system (meters)
    // In a real implementation, this would handle geographic coordinate conversion
    const xs = coords.map(c => c[0]);
    const ys = coords.map(c => c[1]);
    
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    // For geographic coordinates (if needed)
    const centerLat = centerY / 111000; // Rough conversion for testing
    const centerLng = centerX / (111000 * Math.cos(centerLat * Math.PI / 180));
    
    return { minX, maxX, minY, maxY, centerX, centerY, centerLat, centerLng };
  }

  /**
   * Check if point is inside polygon
   */
  private isPointInPolygon(point: { x: number; y: number }, polygon: { coordinates: Array<[number, number]> }): boolean {
    // Simplified point-in-polygon test using bounding box for now
    // In a real implementation, you'd use a proper geometric library like turf.js
    const coords = polygon.coordinates;
    if (coords.length < 3) return false;
    
    // Get bounding box
    const minX = Math.min(...coords.map(c => c[0]));
    const maxX = Math.max(...coords.map(c => c[0]));
    const minY = Math.min(...coords.map(c => c[1]));
    const maxY = Math.max(...coords.map(c => c[1]));
    
    // Simple bounding box check (not perfect but works for testing)
    return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
  }

  /**
   * Filter candidate positions by constraints
   */
  private filterByConstraints(
    candidates: Array<{ x: number; y: number; lat: number; lng: number }>,
    constraints: OptimizationConstraint[],
    siteArea: OptimizationSiteArea
  ): Array<{ x: number; y: number; lat: number; lng: number }> {
    return candidates.filter(position => {
      // Check hard constraints
      for (const constraint of constraints) {
        if (constraint.enforcement === 'hard' && constraint.active) {
          if (!this.satisfiesConstraint(position, constraint, siteArea)) {
            return false;
          }
        }
      }
      return true;
    });
  }

  /**
   * Check if position satisfies a constraint
   */
  private satisfiesConstraint(
    position: { x: number; y: number; lat: number; lng: number },
    constraint: OptimizationConstraint,
    siteArea: OptimizationSiteArea
  ): boolean {
    switch (constraint.type) {
      case 'setback_distance':
        return this.checkSetbackDistance(position, constraint, siteArea);
      case 'exclusion_zone':
        return this.checkExclusionZone(position, constraint);
      case 'terrain_slope':
        return this.checkTerrainSlope(position, constraint, siteArea);
      default:
        return true; // Unknown constraint types are ignored
    }
  }

  /**
   * Check setback distance constraint
   */
  private checkSetbackDistance(
    position: { x: number; y: number },
    constraint: OptimizationConstraint,
    siteArea: OptimizationSiteArea
  ): boolean {
    const requiredDistance = constraint.parameters.value || 0;
    
    // Check distance from site boundary
    const distanceToBoundary = this.calculateDistanceToBoundary(position, siteArea.boundary);
    if (distanceToBoundary < requiredDistance) {
      return false;
    }
    
    // Check distance from terrain features
    for (const feature of siteArea.terrainFeatures) {
      const distanceToFeature = this.calculateDistanceToPolygon(position, feature.geometry);
      if (distanceToFeature < feature.setbackRequirement) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Check exclusion zone constraint
   */
  private checkExclusionZone(
    position: { x: number; y: number },
    constraint: OptimizationConstraint
  ): boolean {
    if (constraint.parameters.geometry) {
      return !this.isPointInPolygon(position, constraint.parameters.geometry);
    }
    return true;
  }

  /**
   * Check terrain slope constraint
   */
  private checkTerrainSlope(
    position: { x: number; y: number },
    constraint: OptimizationConstraint,
    siteArea: OptimizationSiteArea
  ): boolean {
    if (!siteArea.elevationData) {
      return true; // No elevation data available
    }
    
    const maxSlope = constraint.parameters.value || 30; // degrees
    const slope = this.calculateSlope(position, siteArea.elevationData);
    
    return slope <= maxSlope;
  }

  /**
   * Calculate distance to boundary
   */
  private calculateDistanceToBoundary(
    position: { x: number; y: number },
    boundary: { coordinates: Array<[number, number]> }
  ): number {
    // Simplified distance calculation
    // In a real implementation, you'd use proper geometric algorithms
    let minDistance = Infinity;
    const coords = boundary.coordinates;
    
    for (let i = 0; i < coords.length - 1; i++) {
      const distance = this.distanceToLineSegment(
        position,
        { x: coords[i][0], y: coords[i][1] },
        { x: coords[i + 1][0], y: coords[i + 1][1] }
      );
      minDistance = Math.min(minDistance, distance);
    }
    
    return minDistance;
  }

  /**
   * Calculate distance to polygon
   */
  private calculateDistanceToPolygon(
    position: { x: number; y: number },
    polygon: { coordinates: Array<[number, number]> }
  ): number {
    return this.calculateDistanceToBoundary(position, polygon);
  }

  /**
   * Calculate distance from point to line segment
   */
  private distanceToLineSegment(
    point: { x: number; y: number },
    lineStart: { x: number; y: number },
    lineEnd: { x: number; y: number }
  ): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) {
      return Math.sqrt(A * A + B * B);
    }
    
    let param = dot / lenSq;
    
    if (param < 0) {
      param = 0;
    } else if (param > 1) {
      param = 1;
    }
    
    const xx = lineStart.x + param * C;
    const yy = lineStart.y + param * D;
    
    const dx = point.x - xx;
    const dy = point.y - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate slope at position
   */
  private calculateSlope(
    position: { x: number; y: number },
    elevationData: { gridResolution: number; elevationGrid: number[][]; bounds: any }
  ): number {
    // Simplified slope calculation
    // In a real implementation, you'd interpolate elevation data properly
    return 0; // Placeholder - assume flat terrain
  }

  /**
   * Run genetic algorithm optimization
   */
  private async runOptimization(
    validPositions: Array<{ x: number; y: number; lat: number; lng: number }>,
    windData: WindResourceData,
    turbineSpec: TurbineSpecification,
    constraints: OptimizationConstraint[],
    config: OptimizationConfig,
    siteArea: OptimizationSiteArea
  ): Promise<{
    bestLayout: OptimizedLayout;
    alternativeLayouts: OptimizedLayout[];
    performanceMetrics: PerformanceMetrics;
    constraintCompliance: ConstraintCompliance;
  }> {
    const algorithm = config.algorithm;
    const populationSize = algorithm.parameters.populationSize || 50;
    const maxGenerations = algorithm.parameters.generations || 100;
    const crossoverRate = algorithm.parameters.crossoverRate || 0.8;
    const mutationRate = algorithm.parameters.mutationRate || 0.1;
    const elitismRate = algorithm.parameters.elitismRate || 0.1;

    // Initialize population
    let population = this.initializePopulation(validPositions, populationSize, turbineSpec, config);
    
    let bestLayout: OptimizedLayout | null = null;
    const alternativeLayouts: OptimizedLayout[] = [];

    // Evolution loop
    for (let generation = 0; generation < maxGenerations; generation++) {
      this.currentGeneration = generation;
      
      // Evaluate fitness for all individuals
      const evaluatedPopulation = await this.evaluatePopulation(
        population,
        windData,
        turbineSpec,
        constraints,
        siteArea,
        config
      );
      
      // Sort by fitness (higher is better)
      evaluatedPopulation.sort((a, b) => b.fitnessScore - a.fitnessScore);
      
      // Update best layout
      if (!bestLayout || evaluatedPopulation[0].fitnessScore > bestLayout.fitnessScore) {
        bestLayout = evaluatedPopulation[0];
      }
      
      // Store alternative layouts
      if (generation % 10 === 0 && evaluatedPopulation.length > 1) {
        alternativeLayouts.push(evaluatedPopulation[1]);
      }
      
      // Record optimization history
      const iterationData: OptimizationIteration = {
        generation,
        bestFitness: evaluatedPopulation[0].fitnessScore,
        averageFitness: evaluatedPopulation.reduce((sum, layout) => sum + layout.fitnessScore, 0) / evaluatedPopulation.length,
        worstFitness: evaluatedPopulation[evaluatedPopulation.length - 1].fitnessScore,
        fitnessImprovement: generation > 0 ? 
          evaluatedPopulation[0].fitnessScore - this.optimizationHistory[generation - 1].bestFitness : 0,
        constraintViolations: evaluatedPopulation[0].constraintViolations.length,
        computationTime: 0, // Would be measured in real implementation
        convergenceMetric: this.calculateConvergenceMetric(evaluatedPopulation)
      };
      
      this.optimizationHistory.push(iterationData);
      
      // Check convergence
      if (this.hasConverged(generation, config.convergenceCriteria)) {
        console.log(`Optimization converged at generation ${generation}`);
        break;
      }
      
      // Create next generation
      population = this.createNextGeneration(
        evaluatedPopulation,
        validPositions,
        crossoverRate,
        mutationRate,
        elitismRate,
        populationSize
      );
    }

    if (!bestLayout) {
      throw new Error('Optimization failed to produce a valid layout');
    }

    // Calculate performance metrics
    const performanceMetrics = this.calculatePerformanceMetrics(bestLayout, alternativeLayouts);
    
    // Calculate constraint compliance
    const constraintCompliance = this.calculateConstraintCompliance(bestLayout, constraints);

    return {
      bestLayout,
      alternativeLayouts: alternativeLayouts.slice(0, 5), // Keep top 5 alternatives
      performanceMetrics,
      constraintCompliance
    };
  }

  /**
   * Initialize population with random layouts
   */
  private initializePopulation(
    validPositions: Array<{ x: number; y: number; lat: number; lng: number }>,
    populationSize: number,
    turbineSpec: TurbineSpecification,
    config: OptimizationConfig
  ): OptimizedLayout[] {
    const population: OptimizedLayout[] = [];
    const minSpacing = config.parameters.minTurbineSpacing || turbineSpec.rotorDiameter * 3;
    
    for (let i = 0; i < populationSize; i++) {
      const turbines = this.generateRandomLayout(validPositions, minSpacing, turbineSpec);
      
      const layout: OptimizedLayout = {
        id: `layout_${i}`,
        turbines,
        layoutMetrics: this.calculateLayoutMetrics(turbines),
        energyAnalysis: this.createPlaceholderEnergyAnalysis(),
        wakeAnalysis: this.createPlaceholderWakeAnalysis(),
        costAnalysis: this.createPlaceholderCostAnalysis(),
        constraintViolations: [],
        fitnessScore: 0,
        rank: i
      };
      
      population.push(layout);
    }
    
    return population;
  }

  /**
   * Generate random turbine layout
   */
  private generateRandomLayout(
    validPositions: Array<{ x: number; y: number; lat: number; lng: number }>,
    minSpacing: number,
    turbineSpec: TurbineSpecification
  ): OptimizedTurbinePosition[] {
    const turbines: OptimizedTurbinePosition[] = [];
    const maxTurbines = Math.min(50, Math.floor(validPositions.length / 10)); // Reasonable limit
    const targetTurbines = Math.floor(Math.random() * maxTurbines) + 5; // At least 5 turbines
    
    const availablePositions = [...validPositions];
    
    for (let i = 0; i < targetTurbines && availablePositions.length > 0; i++) {
      // Select random position
      const randomIndex = Math.floor(Math.random() * availablePositions.length);
      const position = availablePositions[randomIndex];
      
      // Create turbine
      const turbine: OptimizedTurbinePosition = {
        id: `turbine_${i}`,
        x: position.x,
        y: position.y,
        lat: position.lat,
        lng: position.lng,
        elevation: 0, // Placeholder
        hubHeight: turbineSpec.hubHeight,
        rotorDiameter: turbineSpec.rotorDiameter,
        ratedPower: turbineSpec.ratedPower,
        status: 'active',
        wakeEffects: {
          upstreamTurbines: [],
          wakeDeficit: 0,
          powerLoss: 0,
          turbulenceIncrease: 0,
          fatigueLoad: 0,
          wakeOverlap: []
        },
        optimizationData: {
          candidateRank: i,
          constraintScores: {},
          energyContribution: 0,
          wakeImpact: 0,
          costContribution: 0,
          optimizationHistory: []
        }
      };
      
      turbines.push(turbine);
      
      // Remove positions too close to this turbine
      for (let j = availablePositions.length - 1; j >= 0; j--) {
        const distance = Math.sqrt(
          Math.pow(availablePositions[j].x - position.x, 2) +
          Math.pow(availablePositions[j].y - position.y, 2)
        );
        
        if (distance < minSpacing) {
          availablePositions.splice(j, 1);
        }
      }
    }
    
    return turbines;
  }

  /**
   * Evaluate fitness of population
   */
  private async evaluatePopulation(
    population: OptimizedLayout[],
    windData: WindResourceData,
    turbineSpec: TurbineSpecification,
    constraints: OptimizationConstraint[],
    siteArea: OptimizationSiteArea,
    config: OptimizationConfig
  ): Promise<OptimizedLayout[]> {
    const evaluatedPopulation: OptimizedLayout[] = [];
    
    for (const layout of population) {
      const evaluatedLayout = await this.evaluateLayout(
        layout,
        windData,
        turbineSpec,
        constraints,
        siteArea,
        config
      );
      evaluatedPopulation.push(evaluatedLayout);
    }
    
    return evaluatedPopulation;
  }

  /**
   * Evaluate individual layout fitness
   */
  private async evaluateLayout(
    layout: OptimizedLayout,
    windData: WindResourceData,
    turbineSpec: TurbineSpecification,
    constraints: OptimizationConstraint[],
    siteArea: OptimizationSiteArea,
    config: OptimizationConfig
  ): Promise<OptimizedLayout> {
    // Calculate energy analysis
    const energyAnalysis = this.calculateEnergyAnalysis(layout, windData, turbineSpec);
    
    // Calculate wake analysis (simplified)
    const wakeAnalysis = await this.calculateWakeAnalysis(layout, windData, turbineSpec);
    
    // Calculate cost analysis
    const costAnalysis = this.calculateCostAnalysis(layout, turbineSpec);
    
    // Check constraint violations
    const constraintViolations = this.checkConstraintViolations(layout, constraints, siteArea);
    
    // Calculate fitness score
    const fitnessScore = this.calculateFitnessScore(
      energyAnalysis,
      wakeAnalysis,
      costAnalysis,
      constraintViolations,
      config
    );
    
    return {
      ...layout,
      energyAnalysis,
      wakeAnalysis,
      costAnalysis,
      constraintViolations,
      fitnessScore
    };
  }

  /**
   * Calculate energy analysis for layout
   */
  private calculateEnergyAnalysis(
    layout: OptimizedLayout,
    windData: WindResourceData,
    turbineSpec: TurbineSpecification
  ): EnergyAnalysis {
    // Simplified energy calculation
    const turbineCount = layout.turbines.length;
    const meanWindSpeed = windData.statistics.meanWindSpeed;
    
    // Basic energy estimation (would be much more complex in reality)
    const annualHours = 8760;
    const capacityFactor = Math.min(0.45, meanWindSpeed / 15); // Simplified CF calculation
    const annualEnergyYield = turbineCount * turbineSpec.ratedPower * capacityFactor * annualHours / 1000; // MWh
    
    return {
      annualEnergyYield,
      capacityFactor: capacityFactor * 100,
      energyDensity: annualEnergyYield / (layout.layoutMetrics.totalCapacity || 1),
      lossBreakdown: {
        wakeLosses: 10, // Placeholder
        availabilityLosses: 3,
        electricalLosses: 2,
        curtailmentLosses: 1,
        otherLosses: 2,
        totalLosses: 18
      },
      monthlyProduction: [], // Would be calculated in real implementation
      directionalAnalysis: [] // Would be calculated in real implementation
    };
  }

  /**
   * Calculate wake analysis for layout
   */
  private async calculateWakeAnalysis(
    layout: OptimizedLayout,
    windData: WindResourceData,
    turbineSpec: TurbineSpecification
  ): Promise<WakeAnalysisResults> {
    // This would use the WakeOptimizationService in a real implementation
    // For now, return placeholder data
    return this.createPlaceholderWakeAnalysis();
  }

  /**
   * Calculate cost analysis for layout
   */
  private calculateCostAnalysis(
    layout: OptimizedLayout,
    turbineSpec: TurbineSpecification
  ) {
    const turbineCount = layout.turbines.length;
    const totalCapacity = turbineCount * turbineSpec.ratedPower / 1000; // MW
    
    // Simplified cost calculation (would be much more detailed in reality)
    const turbineCost = turbineCount * 1.2e6; // $1.2M per turbine
    const foundationCost = turbineCount * 200000; // $200k per foundation
    const electricalCost = totalCapacity * 150000; // $150k per MW
    const roadsCost = turbineCount * 50000; // $50k per turbine for access
    const gridConnectionCost = totalCapacity * 100000; // $100k per MW
    const developmentCost = totalCapacity * 50000; // $50k per MW
    const contingency = (turbineCost + foundationCost + electricalCost + roadsCost + gridConnectionCost + developmentCost) * 0.1;
    
    const totalProjectCost = turbineCost + foundationCost + electricalCost + roadsCost + gridConnectionCost + developmentCost + contingency;
    
    return {
      capitalCosts: {
        turbines: turbineCost,
        foundations: foundationCost,
        electrical: electricalCost,
        roads: roadsCost,
        gridConnection: gridConnectionCost,
        development: developmentCost,
        contingency,
        total: totalProjectCost
      },
      operationalCosts: {
        maintenance: totalCapacity * 25000, // $25k per MW per year
        operations: totalCapacity * 15000,
        insurance: totalCapacity * 10000,
        landLease: totalCapacity * 5000,
        utilities: totalCapacity * 2000,
        total: totalCapacity * 57000
      },
      totalProjectCost,
      costPerMW: totalProjectCost / totalCapacity,
      levelizedCostOfEnergy: 45, // $/MWh (simplified)
      netPresentValue: totalProjectCost * 0.2, // Simplified NPV
      internalRateOfReturn: 8.5, // Simplified IRR
      paybackPeriod: 12 // years
    };
  }

  /**
   * Check constraint violations
   */
  private checkConstraintViolations(
    layout: OptimizedLayout,
    constraints: OptimizationConstraint[],
    siteArea: OptimizationSiteArea
  ): ConstraintViolation[] {
    const violations: ConstraintViolation[] = [];
    
    for (const constraint of constraints) {
      if (!constraint.active) continue;
      
      const violation = this.checkLayoutConstraint(layout, constraint, siteArea);
      if (violation) {
        violations.push(violation);
      }
    }
    
    return violations;
  }

  /**
   * Check individual constraint for layout
   */
  private checkLayoutConstraint(
    layout: OptimizedLayout,
    constraint: OptimizationConstraint,
    siteArea: OptimizationSiteArea
  ): ConstraintViolation | null {
    switch (constraint.type) {
      case 'minimum_spacing':
        return this.checkMinimumSpacing(layout, constraint);
      case 'setback_distance':
        return this.checkLayoutSetback(layout, constraint, siteArea);
      default:
        return null;
    }
  }

  /**
   * Check minimum spacing constraint
   */
  private checkMinimumSpacing(
    layout: OptimizedLayout,
    constraint: OptimizationConstraint
  ): ConstraintViolation | null {
    const minSpacing = constraint.parameters.value || 0;
    const violatingTurbines: string[] = [];
    let maxViolation = 0;
    
    for (let i = 0; i < layout.turbines.length; i++) {
      for (let j = i + 1; j < layout.turbines.length; j++) {
        const turbine1 = layout.turbines[i];
        const turbine2 = layout.turbines[j];
        
        const distance = Math.sqrt(
          Math.pow(turbine1.x - turbine2.x, 2) +
          Math.pow(turbine1.y - turbine2.y, 2)
        );
        
        if (distance < minSpacing) {
          const violation = minSpacing - distance;
          if (violation > maxViolation) {
            maxViolation = violation;
          }
          
          if (!violatingTurbines.includes(turbine1.id)) {
            violatingTurbines.push(turbine1.id);
          }
          if (!violatingTurbines.includes(turbine2.id)) {
            violatingTurbines.push(turbine2.id);
          }
        }
      }
    }
    
    if (violatingTurbines.length > 0) {
      return {
        constraintId: constraint.id,
        constraintType: constraint.type,
        severity: maxViolation > minSpacing * 0.5 ? 'major' : 'moderate',
        description: `${violatingTurbines.length} turbines violate minimum spacing requirement`,
        affectedTurbines: violatingTurbines,
        violationMagnitude: maxViolation,
        penalty: constraint.penalty || 1000,
        mitigationOptions: ['Increase turbine spacing', 'Remove conflicting turbines', 'Relocate turbines']
      };
    }
    
    return null;
  }

  /**
   * Check setback distance constraint for layout
   */
  private checkLayoutSetback(
    layout: OptimizedLayout,
    constraint: OptimizationConstraint,
    siteArea: OptimizationSiteArea
  ): ConstraintViolation | null {
    // Simplified setback check
    // In reality, this would check each turbine against all relevant features
    return null; // Placeholder
  }

  /**
   * Calculate fitness score
   */
  private calculateFitnessScore(
    energyAnalysis: EnergyAnalysis,
    wakeAnalysis: WakeAnalysisResults,
    costAnalysis: any,
    constraintViolations: ConstraintViolation[],
    config: OptimizationConfig
  ): number {
    let score = 0;
    
    // Energy yield component (maximize)
    const energyWeight = config.objectives.find(obj => obj.type === 'maximize_energy_yield')?.weight || 0.4;
    score += energyWeight * (energyAnalysis.annualEnergyYield / 100000); // Normalize to reasonable scale
    
    // Wake loss component (minimize)
    const wakeWeight = config.objectives.find(obj => obj.type === 'minimize_wake_losses')?.weight || 0.3;
    score += wakeWeight * (1 - (energyAnalysis.lossBreakdown.wakeLosses / 100));
    
    // Cost component (minimize)
    const costWeight = config.objectives.find(obj => obj.type === 'minimize_cost')?.weight || 0.2;
    score += costWeight * (1 / (costAnalysis.levelizedCostOfEnergy / 50)); // Normalize LCOE
    
    // Constraint penalty
    const constraintPenalty = constraintViolations.reduce((sum, violation) => sum + violation.penalty, 0);
    score -= constraintPenalty / 10000; // Scale penalty appropriately
    
    return Math.max(0, score); // Ensure non-negative score
  }

  /**
   * Calculate layout metrics
   */
  private calculateLayoutMetrics(turbines: OptimizedTurbinePosition[]): LayoutMetrics {
    const turbineCount = turbines.length;
    const totalCapacity = turbines.reduce((sum, turbine) => sum + turbine.ratedPower, 0) / 1000; // MW
    
    // Calculate spacing statistics
    const spacings: number[] = [];
    for (let i = 0; i < turbines.length; i++) {
      for (let j = i + 1; j < turbines.length; j++) {
        const distance = Math.sqrt(
          Math.pow(turbines[i].x - turbines[j].x, 2) +
          Math.pow(turbines[i].y - turbines[j].y, 2)
        );
        spacings.push(distance);
      }
    }
    
    const averageSpacing = spacings.length > 0 ? spacings.reduce((sum, s) => sum + s, 0) / spacings.length : 0;
    const minSpacing = spacings.length > 0 ? Math.min(...spacings) : 0;
    const maxSpacing = spacings.length > 0 ? Math.max(...spacings) : 0;
    
    return {
      turbineCount,
      totalCapacity,
      powerDensity: totalCapacity / 10, // Placeholder - would calculate actual site area
      averageSpacing,
      minSpacing,
      maxSpacing,
      layoutEfficiency: 85, // Placeholder
      landUseEfficiency: totalCapacity / 100 // Placeholder
    };
  }

  /**
   * Create placeholder energy analysis
   */
  private createPlaceholderEnergyAnalysis(): EnergyAnalysis {
    return {
      annualEnergyYield: 0,
      capacityFactor: 0,
      energyDensity: 0,
      lossBreakdown: {
        wakeLosses: 0,
        availabilityLosses: 0,
        electricalLosses: 0,
        curtailmentLosses: 0,
        otherLosses: 0,
        totalLosses: 0
      },
      monthlyProduction: [],
      directionalAnalysis: []
    };
  }

  /**
   * Create placeholder wake analysis
   */
  private createPlaceholderWakeAnalysis(): WakeAnalysisResults {
    return {
      overallMetrics: {
        totalWakeLoss: 0,
        averageWakeLoss: 0,
        maxWakeLoss: 0,
        wakeEfficiency: 100,
        energyYieldReduction: 0,
        capacityFactorReduction: 0,
        economicImpact: {
          annualRevenueLoss: 0,
          netPresentValueImpact: 0,
          paybackPeriodIncrease: 0,
          levelizedCostIncrease: 0
        }
      },
      turbineResults: [],
      wakeVisualization: {
        wakeFields: [],
        flowVisualization: {
          streamlines: [],
          velocityVectors: []
        },
        turbineInteractions: [],
        crossSections: []
      },
      optimizationRecommendations: [],
      sensitivityAnalysis: {
        parameters: [],
        results: [],
        recommendations: []
      },
      uncertaintyAnalysis: {
        sources: [],
        totalUncertainty: 0,
        confidenceIntervals: [],
        recommendations: []
      }
    };
  }

  /**
   * Create placeholder cost analysis
   */
  private createPlaceholderCostAnalysis() {
    return {
      capitalCosts: {
        turbines: 0,
        foundations: 0,
        electrical: 0,
        roads: 0,
        gridConnection: 0,
        development: 0,
        contingency: 0,
        total: 0
      },
      operationalCosts: {
        maintenance: 0,
        operations: 0,
        insurance: 0,
        landLease: 0,
        utilities: 0,
        total: 0
      },
      totalProjectCost: 0,
      costPerMW: 0,
      levelizedCostOfEnergy: 0,
      netPresentValue: 0,
      internalRateOfReturn: 0,
      paybackPeriod: 0
    };
  }

  /**
   * Calculate convergence metric
   */
  private calculateConvergenceMetric(population: OptimizedLayout[]): number {
    if (population.length < 2) return 0;
    
    const fitnessValues = population.map(layout => layout.fitnessScore);
    const mean = fitnessValues.reduce((sum, f) => sum + f, 0) / fitnessValues.length;
    const variance = fitnessValues.reduce((sum, f) => sum + Math.pow(f - mean, 2), 0) / fitnessValues.length;
    
    return Math.sqrt(variance); // Standard deviation as convergence metric
  }

  /**
   * Check if optimization has converged
   */
  private hasConverged(generation: number, criteria: any): boolean {
    if (generation < 10) return false; // Need minimum generations
    
    const recentHistory = this.optimizationHistory.slice(-criteria.stallGenerations || 10);
    if (recentHistory.length < (criteria.stallGenerations || 10)) return false;
    
    const improvements = recentHistory.map(h => h.fitnessImprovement);
    const avgImprovement = improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length;
    
    return avgImprovement < (criteria.toleranceThreshold || 0.001);
  }

  /**
   * Create next generation using genetic operators
   */
  private createNextGeneration(
    population: OptimizedLayout[],
    validPositions: Array<{ x: number; y: number; lat: number; lng: number }>,
    crossoverRate: number,
    mutationRate: number,
    elitismRate: number,
    populationSize: number
  ): OptimizedLayout[] {
    const nextGeneration: OptimizedLayout[] = [];
    
    // Elitism - keep best individuals
    const eliteCount = Math.floor(populationSize * elitismRate);
    for (let i = 0; i < eliteCount; i++) {
      nextGeneration.push({ ...population[i], id: `gen${this.currentGeneration + 1}_elite_${i}` });
    }
    
    // Generate offspring through crossover and mutation
    while (nextGeneration.length < populationSize) {
      // Selection (tournament selection)
      const parent1 = this.tournamentSelection(population, 3);
      const parent2 = this.tournamentSelection(population, 3);
      
      // Crossover
      let offspring1, offspring2;
      if (Math.random() < crossoverRate) {
        [offspring1, offspring2] = this.crossover(parent1, parent2);
      } else {
        offspring1 = { ...parent1 };
        offspring2 = { ...parent2 };
      }
      
      // Mutation
      if (Math.random() < mutationRate) {
        offspring1 = this.mutate(offspring1, validPositions);
      }
      if (Math.random() < mutationRate) {
        offspring2 = this.mutate(offspring2, validPositions);
      }
      
      // Add to next generation
      offspring1.id = `gen${this.currentGeneration + 1}_${nextGeneration.length}`;
      offspring2.id = `gen${this.currentGeneration + 1}_${nextGeneration.length + 1}`;
      
      nextGeneration.push(offspring1);
      if (nextGeneration.length < populationSize) {
        nextGeneration.push(offspring2);
      }
    }
    
    return nextGeneration;
  }

  /**
   * Tournament selection
   */
  private tournamentSelection(population: OptimizedLayout[], tournamentSize: number): OptimizedLayout {
    const tournament: OptimizedLayout[] = [];
    
    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * population.length);
      tournament.push(population[randomIndex]);
    }
    
    // Return best individual from tournament
    tournament.sort((a, b) => b.fitnessScore - a.fitnessScore);
    return tournament[0];
  }

  /**
   * Crossover operation
   */
  private crossover(parent1: OptimizedLayout, parent2: OptimizedLayout): [OptimizedLayout, OptimizedLayout] {
    // Simple crossover - combine turbines from both parents
    const offspring1Turbines = [...parent1.turbines.slice(0, Math.floor(parent1.turbines.length / 2))];
    const offspring2Turbines = [...parent2.turbines.slice(0, Math.floor(parent2.turbines.length / 2))];
    
    // Add remaining turbines from other parent (avoiding duplicates by position)
    for (const turbine of parent2.turbines) {
      const tooClose = offspring1Turbines.some(existing => 
        Math.sqrt(Math.pow(existing.x - turbine.x, 2) + Math.pow(existing.y - turbine.y, 2)) < 200
      );
      if (!tooClose && offspring1Turbines.length < 50) {
        offspring1Turbines.push({ ...turbine, id: `turbine_${offspring1Turbines.length}` });
      }
    }
    
    for (const turbine of parent1.turbines) {
      const tooClose = offspring2Turbines.some(existing => 
        Math.sqrt(Math.pow(existing.x - turbine.x, 2) + Math.pow(existing.y - turbine.y, 2)) < 200
      );
      if (!tooClose && offspring2Turbines.length < 50) {
        offspring2Turbines.push({ ...turbine, id: `turbine_${offspring2Turbines.length}` });
      }
    }
    
    const offspring1: OptimizedLayout = {
      ...parent1,
      turbines: offspring1Turbines,
      layoutMetrics: this.calculateLayoutMetrics(offspring1Turbines),
      fitnessScore: 0 // Will be recalculated
    };
    
    const offspring2: OptimizedLayout = {
      ...parent2,
      turbines: offspring2Turbines,
      layoutMetrics: this.calculateLayoutMetrics(offspring2Turbines),
      fitnessScore: 0 // Will be recalculated
    };
    
    return [offspring1, offspring2];
  }

  /**
   * Mutation operation
   */
  private mutate(
    individual: OptimizedLayout,
    validPositions: Array<{ x: number; y: number; lat: number; lng: number }>
  ): OptimizedLayout {
    const mutatedTurbines = [...individual.turbines];
    
    // Random mutation type
    const mutationType = Math.random();
    
    if (mutationType < 0.3 && mutatedTurbines.length > 1) {
      // Remove a random turbine
      const randomIndex = Math.floor(Math.random() * mutatedTurbines.length);
      mutatedTurbines.splice(randomIndex, 1);
    } else if (mutationType < 0.6 && mutatedTurbines.length < 50 && validPositions.length > 0) {
      // Add a new turbine
      const randomPosition = validPositions[Math.floor(Math.random() * validPositions.length)];
      const newTurbine: OptimizedTurbinePosition = {
        id: `turbine_${mutatedTurbines.length}`,
        x: randomPosition.x,
        y: randomPosition.y,
        lat: randomPosition.lat,
        lng: randomPosition.lng,
        elevation: 0,
        hubHeight: individual.turbines[0]?.hubHeight || 100,
        rotorDiameter: individual.turbines[0]?.rotorDiameter || 120,
        ratedPower: individual.turbines[0]?.ratedPower || 2500,
        status: 'active',
        wakeEffects: {
          upstreamTurbines: [],
          wakeDeficit: 0,
          powerLoss: 0,
          turbulenceIncrease: 0,
          fatigueLoad: 0,
          wakeOverlap: []
        },
        optimizationData: {
          candidateRank: 0,
          constraintScores: {},
          energyContribution: 0,
          wakeImpact: 0,
          costContribution: 0,
          optimizationHistory: []
        }
      };
      mutatedTurbines.push(newTurbine);
    } else if (mutatedTurbines.length > 0) {
      // Move a random turbine
      const randomIndex = Math.floor(Math.random() * mutatedTurbines.length);
      const randomPosition = validPositions[Math.floor(Math.random() * validPositions.length)];
      
      mutatedTurbines[randomIndex] = {
        ...mutatedTurbines[randomIndex],
        x: randomPosition.x,
        y: randomPosition.y,
        lat: randomPosition.lat,
        lng: randomPosition.lng
      };
    }
    
    return {
      ...individual,
      turbines: mutatedTurbines,
      layoutMetrics: this.calculateLayoutMetrics(mutatedTurbines),
      fitnessScore: 0 // Will be recalculated
    };
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(
    bestLayout: OptimizedLayout,
    alternativeLayouts: OptimizedLayout[]
  ): PerformanceMetrics {
    return {
      energyMetrics: {
        annualEnergyYield: bestLayout.energyAnalysis.annualEnergyYield,
        capacityFactor: bestLayout.energyAnalysis.capacityFactor,
        energyDensity: bestLayout.energyAnalysis.energyDensity,
        wakeEfficiency: 100 - bestLayout.energyAnalysis.lossBreakdown.wakeLosses,
        performanceRatio: 0.85 // Placeholder
      },
      economicMetrics: {
        levelizedCostOfEnergy: bestLayout.costAnalysis.levelizedCostOfEnergy,
        netPresentValue: bestLayout.costAnalysis.netPresentValue,
        internalRateOfReturn: bestLayout.costAnalysis.internalRateOfReturn,
        paybackPeriod: bestLayout.costAnalysis.paybackPeriod,
        profitabilityIndex: 1.2 // Placeholder
      },
      environmentalMetrics: {
        co2Savings: bestLayout.energyAnalysis.annualEnergyYield * 0.5, // tons CO2/year
        landUseEfficiency: bestLayout.layoutMetrics.landUseEfficiency,
        visualImpactScore: 30, // Placeholder
        noiseImpactScore: 25, // Placeholder
        ecologicalImpactScore: 20 // Placeholder
      },
      technicalMetrics: {
        layoutEfficiency: bestLayout.layoutMetrics.layoutEfficiency,
        spacingOptimality: 85, // Placeholder
        terrainSuitability: 90, // Placeholder
        gridConnectionEfficiency: 95, // Placeholder
        accessibilityScore: 80 // Placeholder
      },
      comparisonMetrics: {
        energyYieldImprovement: 0, // Would compare against baseline
        costReduction: 0,
        wakeReduction: 0,
        constraintImprovements: {},
        overallImprovement: 0
      }
    };
  }

  /**
   * Calculate constraint compliance
   */
  private calculateConstraintCompliance(
    layout: OptimizedLayout,
    constraints: OptimizationConstraint[]
  ): ConstraintCompliance {
    const totalConstraints = constraints.filter(c => c.active).length;
    const violatedConstraints = layout.constraintViolations.length;
    const overallCompliance = totalConstraints > 0 ? 
      ((totalConstraints - violatedConstraints) / totalConstraints) * 100 : 100;
    
    const hardViolations = layout.constraintViolations.filter(v => 
      constraints.find(c => c.id === v.constraintId)?.enforcement === 'hard'
    ).length;
    
    const softViolations = violatedConstraints - hardViolations;
    
    return {
      overallCompliance,
      hardConstraintViolations: hardViolations,
      softConstraintViolations: softViolations,
      complianceByType: {}, // Would be calculated in real implementation
      criticalViolations: layout.constraintViolations.filter(v => v.severity === 'critical'),
      recommendations: [
        'Review turbine spacing to meet minimum distance requirements',
        'Consider adjusting layout to improve constraint compliance',
        'Evaluate trade-offs between energy yield and constraint satisfaction'
      ]
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(
    results: {
      bestLayout: OptimizedLayout;
      alternativeLayouts: OptimizedLayout[];
      performanceMetrics: PerformanceMetrics;
      constraintCompliance: ConstraintCompliance;
    },
    constraints: OptimizationConstraint[]
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    
    // Spacing optimization recommendation
    if (results.bestLayout.layoutMetrics.minSpacing < results.bestLayout.layoutMetrics.averageSpacing * 0.8) {
      recommendations.push({
        id: 'spacing_optimization',
        type: 'spacing_adjustment',
        priority: 'high',
        title: 'Optimize Turbine Spacing',
        description: 'Some turbines are placed closer than optimal, which may increase wake losses.',
        rationale: 'Increasing spacing between closely placed turbines can reduce wake interactions and improve energy yield.',
        expectedBenefit: {
          energyYieldIncrease: results.bestLayout.energyAnalysis.annualEnergyYield * 0.05,
          wakeLossReduction: 2,
          costReduction: 0,
          constraintImprovements: ['Improved minimum spacing compliance'],
          riskMitigation: ['Reduced wake-related energy losses'],
          confidenceLevel: 0.8
        },
        implementationCost: 0.3,
        implementationComplexity: 'medium',
        timeframe: 'short_term',
        actions: [
          {
            action: 'Increase spacing for closely placed turbines',
            targetTurbines: [], // Would identify specific turbines
            parameters: { minSpacing: results.bestLayout.layoutMetrics.averageSpacing * 1.2 },
            sequence: 1,
            dependencies: [],
            estimatedCost: 50000,
            estimatedTime: 30
          }
        ],
        risks: [
          {
            type: 'economic',
            description: 'May require removing some turbines, reducing total capacity',
            probability: 0.4,
            impact: 0.3,
            mitigation: ['Careful analysis of energy yield vs capacity trade-offs']
          }
        ]
      });
    }
    
    // Constraint compliance recommendation
    if (results.constraintCompliance.overallCompliance < 90) {
      recommendations.push({
        id: 'constraint_compliance',
        type: 'layout_modification',
        priority: 'high',
        title: 'Improve Constraint Compliance',
        description: 'Current layout violates several constraints that may affect project feasibility.',
        rationale: 'Ensuring full constraint compliance is critical for project approval and operation.',
        expectedBenefit: {
          energyYieldIncrease: 0,
          wakeLossReduction: 0,
          costReduction: 0,
          constraintImprovements: ['Improved regulatory compliance', 'Reduced project risk'],
          riskMitigation: ['Reduced permitting delays', 'Improved stakeholder acceptance'],
          confidenceLevel: 0.9
        },
        implementationCost: 0.2,
        implementationComplexity: 'low',
        timeframe: 'immediate',
        actions: [
          {
            action: 'Relocate turbines violating constraints',
            parameters: {},
            sequence: 1,
            dependencies: [],
            estimatedCost: 25000,
            estimatedTime: 14
          }
        ],
        risks: []
      });
    }
    
    // Energy yield optimization recommendation
    if (results.performanceMetrics.energyMetrics.capacityFactor < 35) {
      recommendations.push({
        id: 'energy_optimization',
        type: 'micro_siting',
        priority: 'medium',
        title: 'Optimize for Higher Energy Yield',
        description: 'Current capacity factor is below industry average. Consider micro-siting adjustments.',
        rationale: 'Small adjustments in turbine positions can capture better wind resources and improve energy yield.',
        expectedBenefit: {
          energyYieldIncrease: results.bestLayout.energyAnalysis.annualEnergyYield * 0.08,
          wakeLossReduction: 1,
          costReduction: 0,
          constraintImprovements: [],
          riskMitigation: ['Improved project economics'],
          confidenceLevel: 0.7
        },
        implementationCost: 0.4,
        implementationComplexity: 'high',
        timeframe: 'long_term',
        actions: [
          {
            action: 'Conduct detailed wind resource assessment',
            parameters: {},
            sequence: 1,
            dependencies: [],
            estimatedCost: 100000,
            estimatedTime: 90
          },
          {
            action: 'Adjust turbine positions based on micro-scale wind patterns',
            parameters: {},
            sequence: 2,
            dependencies: ['Conduct detailed wind resource assessment'],
            estimatedCost: 75000,
            estimatedTime: 60
          }
        ],
        risks: [
          {
            type: 'technical',
            description: 'Micro-siting adjustments may conflict with other constraints',
            probability: 0.3,
            impact: 0.4,
            mitigation: ['Integrated optimization considering all constraints']
          }
        ]
      });
    }
    
    return recommendations;
  }
}