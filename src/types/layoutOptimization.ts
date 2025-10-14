/**
 * Layout Optimization Types
 * 
 * Defines interfaces and types for turbine layout optimization algorithms
 * and multi-objective optimization considering energy yield, wake losses, and constraints.
 */

import { WindResourceData } from './windData';
import { TurbineLayout, TurbinePosition, TurbineSpecification, WakeAnalysisResults } from './wakeData';

// ============================================================================
// Layout Optimization Core Types
// ============================================================================

/**
 * Layout optimization configuration and results
 */
export interface LayoutOptimizationData {
  siteArea: OptimizationSiteArea;
  constraints: OptimizationConstraint[];
  windData: WindResourceData;
  turbineSpec: TurbineSpecification;
  optimizationConfig: OptimizationConfig;
  results: OptimizationResults;
  metadata: OptimizationMetadata;
}

/**
 * Site area for optimization
 */
export interface OptimizationSiteArea {
  boundary: GeoPolygon;
  availableArea: number; // square meters
  exclusionZones: ExclusionZone[];
  terrainFeatures: TerrainFeature[];
  elevationData?: ElevationData;
  roughnessData?: RoughnessData;
}

/**
 * Geographic polygon for site boundaries
 */
export interface GeoPolygon {
  coordinates: Array<[number, number]>; // [lng, lat] pairs
  holes?: Array<Array<[number, number]>>; // exclusion areas within boundary
}

/**
 * Exclusion zone within optimization area
 */
export interface ExclusionZone {
  id: string;
  type: 'building' | 'road' | 'water' | 'protected_area' | 'setback' | 'noise_buffer' | 'visual_buffer';
  geometry: GeoPolygon;
  setbackDistance: number; // meters
  reason: string;
  severity: 'absolute' | 'preferred' | 'flexible';
  cost?: number; // penalty cost if violated (for flexible constraints)
}

/**
 * Terrain feature affecting turbine placement
 */
export interface TerrainFeature {
  id: string;
  type: 'building' | 'road' | 'power_line' | 'water_body' | 'forest' | 'slope';
  geometry: GeoPolygon;
  height?: number; // meters
  windImpact: WindImpactAssessment;
  setbackRequirement: number; // meters
  turbulenceEffect: number; // turbulence intensity increase (0-1)
}

/**
 * Wind impact assessment for terrain features
 */
export interface WindImpactAssessment {
  turbulenceFactor: number; // 0-1 scale
  wakeInfluence: 'high' | 'medium' | 'low';
  flowDisruption: FlowDisruptionPattern;
  recommendedSetback: number; // meters
}

/**
 * Flow disruption pattern
 */
export interface FlowDisruptionPattern {
  upstreamDistance: number; // meters
  downstreamDistance: number; // meters
  lateralSpread: number; // meters
  intensityDecay: number; // decay rate
}

/**
 * Elevation data for site
 */
export interface ElevationData {
  gridResolution: number; // meters
  elevationGrid: number[][]; // elevation in meters
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  slopeGrid?: number[][]; // slope in degrees
  aspectGrid?: number[][]; // aspect in degrees
}

/**
 * Surface roughness data
 */
export interface RoughnessData {
  gridResolution: number; // meters
  roughnessGrid: number[][]; // roughness length in meters
  landUseGrid?: string[][]; // land use classification
}

// ============================================================================
// Optimization Configuration
// ============================================================================

/**
 * Optimization algorithm configuration
 */
export interface OptimizationConfig {
  algorithm: OptimizationAlgorithm;
  objectives: OptimizationObjective[];
  constraints: ConstraintConfig[];
  parameters: OptimizationParameters;
  convergenceCriteria: ConvergenceCriteria;
  outputConfig: OutputConfig;
}

/**
 * Optimization algorithm type
 */
export interface OptimizationAlgorithm {
  type: 'genetic_algorithm' | 'particle_swarm' | 'simulated_annealing' | 'gradient_based' | 'hybrid';
  parameters: AlgorithmParameters;
  parallelization: boolean;
  seedLayout?: TurbineLayout; // initial layout for optimization
}

/**
 * Algorithm-specific parameters
 */
export interface AlgorithmParameters {
  // Genetic Algorithm parameters
  populationSize?: number;
  generations?: number;
  crossoverRate?: number;
  mutationRate?: number;
  elitismRate?: number;
  
  // Particle Swarm parameters
  swarmSize?: number;
  inertiaWeight?: number;
  cognitiveWeight?: number;
  socialWeight?: number;
  
  // Simulated Annealing parameters
  initialTemperature?: number;
  coolingRate?: number;
  minTemperature?: number;
  
  // General parameters
  maxIterations?: number;
  tolerance?: number;
  randomSeed?: number;
}

/**
 * Optimization objective
 */
export interface OptimizationObjective {
  type: 'maximize_energy_yield' | 'minimize_wake_losses' | 'minimize_cost' | 'maximize_capacity_factor' | 'minimize_noise' | 'minimize_visual_impact';
  weight: number; // relative importance (0-1)
  priority: 'primary' | 'secondary' | 'tertiary';
  target?: number; // target value if applicable
  tolerance?: number; // acceptable deviation from target
}

/**
 * Constraint configuration
 */
export interface ConstraintConfig {
  type: 'minimum_spacing' | 'setback_distance' | 'noise_limit' | 'visual_impact' | 'grid_connection' | 'access_road';
  value: number;
  unit: string;
  enforcement: 'hard' | 'soft'; // hard = must satisfy, soft = penalty if violated
  penalty?: number; // penalty weight for soft constraints
}

/**
 * Optimization parameters
 */
export interface OptimizationParameters {
  minTurbineSpacing: number; // meters
  maxTurbineSpacing: number; // meters
  minSetbackDistance: number; // meters from boundaries
  gridResolution: number; // meters for candidate position grid
  wakeModelAccuracy: 'fast' | 'medium' | 'high';
  considerTerrainEffects: boolean;
  considerNoise: boolean;
  considerVisualImpact: boolean;
  multiDirectionalOptimization: boolean; // optimize for multiple wind directions
}

/**
 * Convergence criteria
 */
export interface ConvergenceCriteria {
  maxGenerations: number;
  toleranceThreshold: number; // relative improvement threshold
  stallGenerations: number; // generations without improvement before stopping
  targetFitness?: number; // stop if this fitness is reached
  maxComputationTime?: number; // seconds
}

/**
 * Output configuration
 */
export interface OutputConfig {
  saveIntermediateResults: boolean;
  generateVisualization: boolean;
  exportFormats: ('json' | 'csv' | 'gis' | 'cad')[];
  includeWakeAnalysis: boolean;
  includeSensitivityAnalysis: boolean;
}

// ============================================================================
// Optimization Constraints
// ============================================================================

/**
 * Optimization constraint definition
 */
export interface OptimizationConstraint {
  id: string;
  type: ConstraintType;
  description: string;
  parameters: ConstraintParameters;
  enforcement: 'hard' | 'soft';
  penalty?: number; // for soft constraints
  active: boolean;
}

/**
 * Constraint types
 */
export type ConstraintType = 
  | 'minimum_spacing'
  | 'setback_distance'
  | 'exclusion_zone'
  | 'noise_limit'
  | 'visual_impact'
  | 'grid_connection'
  | 'access_road'
  | 'terrain_slope'
  | 'wind_resource'
  | 'environmental'
  | 'regulatory';

/**
 * Constraint parameters
 */
export interface ConstraintParameters {
  value?: number;
  unit?: string;
  geometry?: GeoPolygon;
  direction?: number; // degrees
  distance?: number; // meters
  threshold?: number;
  [key: string]: any; // additional constraint-specific parameters
}

// ============================================================================
// Optimization Results
// ============================================================================

/**
 * Complete optimization results
 */
export interface OptimizationResults {
  bestLayout: OptimizedLayout;
  alternativeLayouts: OptimizedLayout[];
  optimizationHistory: OptimizationIteration[];
  performanceMetrics: PerformanceMetrics;
  constraintCompliance: ConstraintCompliance;
  recommendations: OptimizationRecommendation[];
  sensitivityAnalysis?: SensitivityAnalysis;
}

/**
 * Optimized turbine layout
 */
export interface OptimizedLayout {
  id: string;
  turbines: OptimizedTurbinePosition[];
  layoutMetrics: LayoutMetrics;
  energyAnalysis: EnergyAnalysis;
  wakeAnalysis: WakeAnalysisResults;
  costAnalysis: CostAnalysis;
  constraintViolations: ConstraintViolation[];
  fitnessScore: number; // overall optimization score
  rank: number; // ranking among alternative layouts
}

/**
 * Optimized turbine position with additional optimization data
 */
export interface OptimizedTurbinePosition extends TurbinePosition {
  optimizationData: TurbineOptimizationData;
}

/**
 * Optimization data for individual turbine
 */
export interface TurbineOptimizationData {
  candidateRank: number; // ranking among candidate positions
  constraintScores: Record<string, number>; // score for each constraint
  energyContribution: number; // MWh/year
  wakeImpact: number; // impact on other turbines (0-1)
  costContribution: number; // relative cost contribution
  optimizationHistory: TurbinePositionHistory[];
}

/**
 * History of turbine position during optimization
 */
export interface TurbinePositionHistory {
  generation: number;
  x: number;
  y: number;
  fitnessScore: number;
  constraintViolations: number;
}

/**
 * Layout performance metrics
 */
export interface LayoutMetrics {
  turbineCount: number;
  totalCapacity: number; // MW
  powerDensity: number; // MW/km²
  averageSpacing: number; // meters
  minSpacing: number; // meters
  maxSpacing: number; // meters
  layoutEfficiency: number; // percentage of optimal theoretical layout
  landUseEfficiency: number; // MW per hectare
}

/**
 * Energy analysis results
 */
export interface EnergyAnalysis {
  annualEnergyYield: number; // MWh/year
  capacityFactor: number; // percentage
  energyDensity: number; // MWh/year/km²
  lossBreakdown: EnergyLossBreakdown;
  monthlyProduction: MonthlyEnergyData[];
  directionalAnalysis: DirectionalEnergyAnalysis[];
}

/**
 * Energy loss breakdown
 */
export interface EnergyLossBreakdown {
  wakeLosses: number; // percentage
  availabilityLosses: number; // percentage
  electricalLosses: number; // percentage
  curtailmentLosses: number; // percentage
  otherLosses: number; // percentage
  totalLosses: number; // percentage
}

/**
 * Monthly energy production data
 */
export interface MonthlyEnergyData {
  month: number; // 1-12
  monthName: string;
  energyYield: number; // MWh
  capacityFactor: number; // percentage
  averageWindSpeed: number; // m/s
  wakeLosses: number; // percentage
}

/**
 * Directional energy analysis
 */
export interface DirectionalEnergyAnalysis {
  direction: number; // degrees
  frequency: number; // percentage of time
  energyContribution: number; // percentage of total energy
  averageWakeLoss: number; // percentage
  turbineEfficiency: number; // percentage
}

/**
 * Cost analysis results
 */
export interface CostAnalysis {
  capitalCosts: CapitalCosts;
  operationalCosts: OperationalCosts;
  totalProjectCost: number; // currency units
  costPerMW: number; // currency units per MW
  levelizedCostOfEnergy: number; // currency units per MWh
  netPresentValue: number; // currency units
  internalRateOfReturn: number; // percentage
  paybackPeriod: number; // years
}

/**
 * Capital costs breakdown
 */
export interface CapitalCosts {
  turbines: number; // currency units
  foundations: number;
  electrical: number;
  roads: number;
  gridConnection: number;
  development: number;
  contingency: number;
  total: number;
}

/**
 * Operational costs breakdown
 */
export interface OperationalCosts {
  maintenance: number; // currency units per year
  operations: number;
  insurance: number;
  landLease: number;
  utilities: number;
  total: number; // currency units per year
}

/**
 * Constraint violation
 */
export interface ConstraintViolation {
  constraintId: string;
  constraintType: ConstraintType;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description: string;
  affectedTurbines: string[]; // turbine IDs
  violationMagnitude: number; // how much the constraint is violated
  penalty: number; // penalty applied to fitness score
  mitigationOptions: string[];
}

/**
 * Constraint compliance summary
 */
export interface ConstraintCompliance {
  overallCompliance: number; // percentage (0-100)
  hardConstraintViolations: number;
  softConstraintViolations: number;
  complianceByType: Record<ConstraintType, number>; // compliance percentage by constraint type
  criticalViolations: ConstraintViolation[];
  recommendations: string[];
}

/**
 * Optimization iteration data
 */
export interface OptimizationIteration {
  generation: number;
  bestFitness: number;
  averageFitness: number;
  worstFitness: number;
  fitnessImprovement: number; // improvement from previous generation
  constraintViolations: number;
  computationTime: number; // seconds
  convergenceMetric: number;
}

/**
 * Performance metrics summary
 */
export interface PerformanceMetrics {
  energyMetrics: EnergyMetrics;
  economicMetrics: EconomicMetrics;
  environmentalMetrics: EnvironmentalMetrics;
  technicalMetrics: TechnicalMetrics;
  comparisonMetrics: ComparisonMetrics;
}

/**
 * Energy performance metrics
 */
export interface EnergyMetrics {
  annualEnergyYield: number; // MWh/year
  capacityFactor: number; // percentage
  energyDensity: number; // MWh/year/km²
  wakeEfficiency: number; // percentage (100% - wake losses)
  performanceRatio: number; // actual vs theoretical performance
}

/**
 * Economic performance metrics
 */
export interface EconomicMetrics {
  levelizedCostOfEnergy: number; // currency/MWh
  netPresentValue: number; // currency units
  internalRateOfReturn: number; // percentage
  paybackPeriod: number; // years
  profitabilityIndex: number;
}

/**
 * Environmental performance metrics
 */
export interface EnvironmentalMetrics {
  co2Savings: number; // tons CO2/year
  landUseEfficiency: number; // MW/hectare
  visualImpactScore: number; // 0-100 (lower is better)
  noiseImpactScore: number; // 0-100 (lower is better)
  ecologicalImpactScore: number; // 0-100 (lower is better)
}

/**
 * Technical performance metrics
 */
export interface TechnicalMetrics {
  layoutEfficiency: number; // percentage of theoretical optimum
  spacingOptimality: number; // how close to optimal spacing
  terrainSuitability: number; // suitability of chosen positions
  gridConnectionEfficiency: number; // electrical collection efficiency
  accessibilityScore: number; // ease of access for maintenance
}

/**
 * Comparison metrics against alternatives
 */
export interface ComparisonMetrics {
  energyYieldImprovement: number; // percentage vs baseline
  costReduction: number; // percentage vs baseline
  wakeReduction: number; // percentage vs baseline
  constraintImprovements: Record<string, number>; // improvement by constraint
  overallImprovement: number; // weighted overall improvement
}

// ============================================================================
// Optimization Recommendations
// ============================================================================

/**
 * Optimization recommendation
 */
export interface OptimizationRecommendation {
  id: string;
  type: RecommendationType;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  rationale: string;
  expectedBenefit: ExpectedBenefit;
  implementationCost: number; // relative cost (0-1)
  implementationComplexity: 'low' | 'medium' | 'high';
  timeframe: 'immediate' | 'short_term' | 'long_term';
  actions: RecommendationAction[];
  risks: Risk[];
}

/**
 * Recommendation types
 */
export type RecommendationType = 
  | 'layout_modification'
  | 'turbine_relocation'
  | 'turbine_removal'
  | 'turbine_addition'
  | 'spacing_adjustment'
  | 'constraint_relaxation'
  | 'technology_change'
  | 'phased_development'
  | 'micro_siting'
  | 'control_optimization';

/**
 * Expected benefit from recommendation
 */
export interface ExpectedBenefit {
  energyYieldIncrease: number; // MWh/year
  wakeLossReduction: number; // percentage points
  costReduction: number; // currency units
  constraintImprovements: string[];
  riskMitigation: string[];
  confidenceLevel: number; // 0-1
}

/**
 * Recommendation action
 */
export interface RecommendationAction {
  action: string;
  targetTurbines?: string[]; // turbine IDs if applicable
  parameters: Record<string, any>;
  sequence: number; // order of execution
  dependencies: string[]; // other actions that must be completed first
  estimatedCost: number; // currency units
  estimatedTime: number; // days
}

/**
 * Risk associated with recommendation
 */
export interface Risk {
  type: 'technical' | 'economic' | 'environmental' | 'regulatory' | 'operational';
  description: string;
  probability: number; // 0-1
  impact: number; // 0-1
  mitigation: string[];
}

// ============================================================================
// Sensitivity Analysis
// ============================================================================

/**
 * Sensitivity analysis results
 */
export interface SensitivityAnalysis {
  parameters: SensitivityParameter[];
  results: SensitivityResult[];
  interactions: ParameterInteraction[];
  robustness: RobustnessAnalysis;
  recommendations: string[];
}

/**
 * Parameter for sensitivity analysis
 */
export interface SensitivityParameter {
  name: string;
  baseValue: number;
  range: {
    min: number;
    max: number;
  };
  unit: string;
  category: 'wind' | 'turbine' | 'economic' | 'constraint' | 'environmental';
  description: string;
}

/**
 * Sensitivity analysis result
 */
export interface SensitivityResult {
  parameter: string;
  sensitivity: number; // change in objective per unit change in parameter
  elasticity: number; // percentage change in objective per percentage change in parameter
  importance: 'high' | 'medium' | 'low';
  confidence: number; // 0-1
  nonlinearity: number; // measure of non-linear response
}

/**
 * Parameter interaction effect
 */
export interface ParameterInteraction {
  parameter1: string;
  parameter2: string;
  interactionStrength: number; // strength of interaction effect
  synergistic: boolean; // true if parameters reinforce each other
  description: string;
}

/**
 * Robustness analysis
 */
export interface RobustnessAnalysis {
  overallRobustness: number; // 0-1 (higher is more robust)
  sensitiveParameters: string[]; // parameters with high sensitivity
  robustParameters: string[]; // parameters with low sensitivity
  worstCaseScenario: ScenarioAnalysis;
  bestCaseScenario: ScenarioAnalysis;
  monteCarloResults?: MonteCarloResults;
}

/**
 * Scenario analysis
 */
export interface ScenarioAnalysis {
  scenario: string;
  parameterValues: Record<string, number>;
  energyYield: number; // MWh/year
  economicPerformance: number; // NPV or similar metric
  constraintViolations: number;
  probability: number; // 0-1
}

/**
 * Monte Carlo analysis results
 */
export interface MonteCarloResults {
  iterations: number;
  energyYieldDistribution: StatisticalDistribution;
  economicDistribution: StatisticalDistribution;
  constraintRiskDistribution: StatisticalDistribution;
  confidenceIntervals: ConfidenceInterval[];
}

/**
 * Statistical distribution
 */
export interface StatisticalDistribution {
  mean: number;
  median: number;
  standardDeviation: number;
  percentiles: Record<number, number>; // percentile -> value
  minimum: number;
  maximum: number;
}

/**
 * Confidence interval
 */
export interface ConfidenceInterval {
  parameter: string;
  confidenceLevel: number; // percentage (e.g., 95)
  lowerBound: number;
  upperBound: number;
  mean: number;
}

// ============================================================================
// Optimization Metadata
// ============================================================================

/**
 * Optimization metadata
 */
export interface OptimizationMetadata {
  optimizationId: string;
  createdAt: string;
  updatedAt: string;
  version: string;
  analyst: string;
  software: {
    name: string;
    version: string;
    modules: string[];
  };
  computationTime: number; // seconds
  iterations: number;
  convergenceAchieved: boolean;
  qualityMetrics: OptimizationQualityMetrics;
  inputDataSources: DataSource[];
}

/**
 * Optimization quality metrics
 */
export interface OptimizationQualityMetrics {
  convergenceRate: number; // 0-1
  solutionStability: number; // 0-1
  constraintSatisfaction: number; // 0-1
  diversityMaintained: number; // 0-1
  computationalEfficiency: number; // 0-1
}

/**
 * Data source information
 */
export interface DataSource {
  type: 'wind_data' | 'terrain_data' | 'constraint_data' | 'turbine_data' | 'economic_data';
  source: string;
  version?: string;
  lastUpdated: string;
  quality: 'high' | 'medium' | 'low';
  coverage: number; // percentage of required data available
}