/**
 * Wake Analysis Data Types
 * 
 * Defines interfaces and types for wake effect modeling and analysis
 * in wind farm layout optimization.
 */

// ============================================================================
// Wake Analysis Core Types
// ============================================================================

/**
 * Wake analysis configuration and results
 */
export interface WakeAnalysisData {
  turbineLayout: TurbineLayout;
  windData: WindResourceData;
  terrainData?: TerrainData;
  wakeModel: WakeModelConfig;
  results: WakeAnalysisResults;
  metadata: WakeAnalysisMetadata;
}

/**
 * Turbine layout definition
 */
export interface TurbineLayout {
  turbines: TurbinePosition[];
  siteArea: SiteArea;
  layoutType: 'grid' | 'optimized' | 'custom';
  spacing: TurbineSpacing;
  totalCapacity: number; // MW
  turbineModel: TurbineSpecification;
}

/**
 * Individual turbine position and properties
 */
export interface TurbinePosition {
  id: string;
  x: number; // meters from origin
  y: number; // meters from origin
  lat?: number; // geographic coordinates
  lng?: number;
  elevation?: number; // meters above sea level
  hubHeight: number; // meters
  rotorDiameter: number; // meters
  ratedPower: number; // kW
  status: 'active' | 'inactive' | 'maintenance';
  wakeEffects: WakeEffectData;
}

/**
 * Wake effects on individual turbine
 */
export interface WakeEffectData {
  upstreamTurbines: string[]; // IDs of turbines causing wake
  wakeDeficit: number; // percentage reduction in wind speed
  powerLoss: number; // percentage reduction in power output
  turbulenceIncrease: number; // percentage increase in turbulence
  fatigueLoad: number; // relative fatigue load increase
  wakeOverlap: WakeOverlapData[];
}

/**
 * Wake overlap between turbines
 */
export interface WakeOverlapData {
  sourceTurbineId: string;
  overlapPercentage: number; // 0-100%
  distanceDownstream: number; // meters
  lateralOffset: number; // meters
  wakeWidth: number; // meters at this distance
}

/**
 * Site area definition
 */
export interface SiteArea {
  boundary: GeoPolygon;
  availableArea: number; // square meters
  exclusionZones: ExclusionZone[];
  constraints: SiteConstraint[];
  windResource: WindResourceData;
}

/**
 * Geographic polygon
 */
export interface GeoPolygon {
  coordinates: Array<[number, number]>; // [lng, lat] pairs
  holes?: Array<Array<[number, number]>>; // exclusion areas
}

/**
 * Exclusion zone within site
 */
export interface ExclusionZone {
  id: string;
  type: 'building' | 'road' | 'water' | 'protected_area' | 'setback' | 'other';
  geometry: GeoPolygon;
  setbackDistance: number; // meters
  reason: string;
}

/**
 * Site constraint
 */
export interface SiteConstraint {
  type: 'noise' | 'visual' | 'environmental' | 'regulatory' | 'technical';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedArea?: GeoPolygon;
  mitigationOptions: string[];
}

/**
 * Turbine spacing configuration
 */
export interface TurbineSpacing {
  minimumDistance: number; // meters
  recommendedDistance: number; // meters
  prevailingWindSpacing: number; // rotor diameters
  crossWindSpacing: number; // rotor diameters
  optimizationCriteria: 'energy_yield' | 'wake_minimization' | 'cost_optimization';
}

/**
 * Turbine specification
 */
export interface TurbineSpecification {
  model: string;
  manufacturer: string;
  ratedPower: number; // kW
  rotorDiameter: number; // meters
  hubHeight: number; // meters
  cutInSpeed: number; // m/s
  ratedSpeed: number; // m/s
  cutOutSpeed: number; // m/s
  powerCurve: PowerCurvePoint[];
  thrustCurve: ThrustCurvePoint[];
}

/**
 * Power curve data point
 */
export interface PowerCurvePoint {
  windSpeed: number; // m/s
  power: number; // kW
  coefficient: number; // power coefficient Cp
}

/**
 * Thrust curve data point
 */
export interface ThrustCurvePoint {
  windSpeed: number; // m/s
  thrust: number; // kN
  coefficient: number; // thrust coefficient Ct
}

// ============================================================================
// Wake Model Types
// ============================================================================

/**
 * Wake model configuration
 */
export interface WakeModelConfig {
  modelType: 'jensen' | 'larsen' | 'fuga' | 'eddy_viscosity' | 'les';
  parameters: WakeModelParameters;
  validationData?: WakeValidationData;
  accuracy: 'low' | 'medium' | 'high' | 'research';
  computationalCost: 'low' | 'medium' | 'high';
}

/**
 * Wake model parameters
 */
export interface WakeModelParameters {
  wakeDecayConstant: number; // Jensen model alpha
  turbulenceIntensity: number; // ambient turbulence
  surfaceRoughness: number; // meters
  atmosphericStability: 'stable' | 'neutral' | 'unstable';
  windShear: number; // power law exponent
  airDensity: number; // kg/m³
  temperatureGradient?: number; // K/m
}

/**
 * Wake validation data
 */
export interface WakeValidationData {
  measurementCampaign: string;
  validationMetrics: ValidationMetric[];
  accuracy: number; // percentage
  bias: number; // percentage
  uncertainty: number; // percentage
}

/**
 * Validation metric
 */
export interface ValidationMetric {
  parameter: 'wind_speed' | 'power_output' | 'turbulence';
  correlation: number; // R²
  rmse: number; // root mean square error
  bias: number; // mean bias error
  validationRange: {
    min: number;
    max: number;
  };
}

// ============================================================================
// Wake Analysis Results
// ============================================================================

/**
 * Complete wake analysis results
 */
export interface WakeAnalysisResults {
  overallMetrics: WakeOverallMetrics;
  turbineResults: TurbineWakeResults[];
  wakeVisualization: WakeVisualizationData;
  optimizationRecommendations: WakeOptimizationRecommendation[];
  sensitivityAnalysis: WakeSensitivityAnalysis;
  uncertaintyAnalysis: WakeUncertaintyAnalysis;
}

/**
 * Overall wake analysis metrics
 */
export interface WakeOverallMetrics {
  totalWakeLoss: number; // percentage
  averageWakeLoss: number; // percentage
  maxWakeLoss: number; // percentage
  wakeEfficiency: number; // percentage (100% - wake loss)
  energyYieldReduction: number; // MWh/year
  capacityFactorReduction: number; // percentage points
  economicImpact: EconomicImpact;
}

/**
 * Economic impact of wake losses
 */
export interface EconomicImpact {
  annualRevenueLoss: number; // currency units
  netPresentValueImpact: number; // currency units
  paybackPeriodIncrease: number; // years
  levelizedCostIncrease: number; // currency/MWh
}

/**
 * Wake results for individual turbine
 */
export interface TurbineWakeResults {
  turbineId: string;
  position: TurbinePosition;
  wakeDeficit: number; // percentage
  powerReduction: number; // percentage
  energyLoss: number; // MWh/year
  turbulenceIncrease: number; // percentage
  fatigueImpact: number; // relative increase
  upstreamInfluences: UpstreamInfluence[];
  downstreamImpacts: DownstreamImpact[];
}

/**
 * Upstream wake influence on turbine
 */
export interface UpstreamInfluence {
  sourceTurbineId: string;
  distance: number; // meters
  direction: number; // degrees
  wakeContribution: number; // percentage of total deficit
  overlapArea: number; // square meters
}

/**
 * Downstream wake impact from turbine
 */
export interface DownstreamImpact {
  affectedTurbineId: string;
  distance: number; // meters
  direction: number; // degrees
  wakeContribution: number; // percentage deficit caused
  overlapArea: number; // square meters
}

// ============================================================================
// Wake Visualization Types
// ============================================================================

/**
 * Wake visualization data
 */
export interface WakeVisualizationData {
  wakeFields: WakeField[];
  flowVisualization: FlowVisualization;
  turbineInteractions: TurbineInteractionVisualization[];
  crossSections: WakeCrossSection[];
  animationFrames?: WakeAnimationFrame[];
}

/**
 * Wake field data for visualization
 */
export interface WakeField {
  turbineId: string;
  windDirection: number; // degrees
  windSpeed: number; // m/s
  wakeGeometry: WakeGeometry;
  velocityField: VelocityField;
  turbulenceField: TurbulenceField;
}

/**
 * Wake geometry definition
 */
export interface WakeGeometry {
  centerline: Array<[number, number]>; // x, y coordinates
  boundaries: {
    upper: Array<[number, number]>;
    lower: Array<[number, number]>;
  };
  expansionRate: number; // wake expansion coefficient
  recoveryDistance: number; // meters to full recovery
}

/**
 * Velocity field data
 */
export interface VelocityField {
  gridPoints: GridPoint[];
  resolution: number; // meters per grid point
  bounds: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  };
}

/**
 * Grid point with velocity data
 */
export interface GridPoint {
  x: number;
  y: number;
  velocity: number; // m/s
  velocityDeficit: number; // percentage
  direction: number; // degrees
}

/**
 * Turbulence field data
 */
export interface TurbulenceField {
  gridPoints: TurbulenceGridPoint[];
  ambientTurbulence: number; // percentage
  maxTurbulence: number; // percentage
}

/**
 * Grid point with turbulence data
 */
export interface TurbulenceGridPoint {
  x: number;
  y: number;
  turbulenceIntensity: number; // percentage
  turbulenceIncrease: number; // percentage above ambient
}

/**
 * Flow visualization data
 */
export interface FlowVisualization {
  streamlines: Streamline[];
  velocityVectors: VelocityVector[];
  pressureField?: PressureField;
  vorticityField?: VorticityField;
}

/**
 * Streamline data
 */
export interface Streamline {
  id: string;
  points: Array<[number, number]>;
  velocity: number[]; // velocity at each point
  color: string; // based on velocity or other parameter
}

/**
 * Velocity vector
 */
export interface VelocityVector {
  x: number;
  y: number;
  u: number; // x-component of velocity
  v: number; // y-component of velocity
  magnitude: number; // m/s
  direction: number; // degrees
}

/**
 * Pressure field (optional advanced visualization)
 */
export interface PressureField {
  gridPoints: Array<{
    x: number;
    y: number;
    pressure: number; // Pa
    pressureCoefficient: number;
  }>;
}

/**
 * Vorticity field (optional advanced visualization)
 */
export interface VorticityField {
  gridPoints: Array<{
    x: number;
    y: number;
    vorticity: number; // 1/s
  }>;
}

/**
 * Turbine interaction visualization
 */
export interface TurbineInteractionVisualization {
  sourceTurbineId: string;
  affectedTurbineId: string;
  interactionStrength: number; // 0-1
  visualElements: InteractionVisualElement[];
}

/**
 * Visual element for turbine interactions
 */
export interface InteractionVisualElement {
  type: 'wake_cone' | 'velocity_deficit' | 'turbulence_zone' | 'connection_line';
  geometry: any; // specific to element type
  styling: {
    color: string;
    opacity: number;
    lineWidth?: number;
    fillPattern?: string;
  };
}

/**
 * Wake cross-section data
 */
export interface WakeCrossSection {
  distance: number; // meters downstream
  profile: WakeProfile;
  turbineId: string;
  windDirection: number;
}

/**
 * Wake profile at specific distance
 */
export interface WakeProfile {
  lateralPositions: number[]; // meters from centerline
  velocityDeficits: number[]; // percentage
  turbulenceIntensities: number[]; // percentage
  wakeWidth: number; // meters (full width)
  centerlineDeficit: number; // percentage
}

/**
 * Animation frame for wake visualization
 */
export interface WakeAnimationFrame {
  timestamp: number; // milliseconds
  windDirection: number; // degrees
  windSpeed: number; // m/s
  wakeFields: WakeField[];
  turbineStates: TurbineAnimationState[];
}

/**
 * Turbine state for animation
 */
export interface TurbineAnimationState {
  turbineId: string;
  rotorSpeed: number; // rpm
  powerOutput: number; // kW
  wakeIntensity: number; // 0-1
  status: 'generating' | 'idle' | 'maintenance';
}

// ============================================================================
// Wake Optimization Types
// ============================================================================

/**
 * Wake optimization recommendation
 */
export interface WakeOptimizationRecommendation {
  type: 'layout_modification' | 'turbine_selection' | 'control_strategy' | 'micro_siting';
  priority: 'high' | 'medium' | 'low';
  description: string;
  expectedBenefit: OptimizationBenefit;
  implementationCost: number; // relative cost (0-1)
  implementationComplexity: 'low' | 'medium' | 'high';
  actions: OptimizationAction[];
}

/**
 * Expected benefit from optimization
 */
export interface OptimizationBenefit {
  wakeLossReduction: number; // percentage points
  energyYieldIncrease: number; // MWh/year
  revenueIncrease: number; // currency units/year
  paybackPeriod: number; // years
  riskReduction: number; // relative risk reduction (0-1)
}

/**
 * Specific optimization action
 */
export interface OptimizationAction {
  action: string;
  targetTurbines: string[]; // turbine IDs
  parameters: Record<string, any>;
  expectedImpact: number; // relative impact (0-1)
  feasibility: number; // feasibility score (0-1)
}

// ============================================================================
// Sensitivity and Uncertainty Analysis
// ============================================================================

/**
 * Wake sensitivity analysis
 */
export interface WakeSensitivityAnalysis {
  parameters: SensitivityParameter[];
  results: SensitivityResult[];
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
  description: string;
}

/**
 * Sensitivity analysis result
 */
export interface SensitivityResult {
  parameter: string;
  sensitivity: number; // change in wake loss per unit change in parameter
  importance: 'high' | 'medium' | 'low';
  confidence: number; // 0-1
}

/**
 * Wake uncertainty analysis
 */
export interface WakeUncertaintyAnalysis {
  sources: UncertaintySource[];
  totalUncertainty: number; // percentage
  confidenceIntervals: ConfidenceInterval[];
  recommendations: string[];
}

/**
 * Source of uncertainty
 */
export interface UncertaintySource {
  source: 'wind_data' | 'wake_model' | 'turbine_performance' | 'terrain' | 'atmospheric_conditions';
  contribution: number; // percentage of total uncertainty
  description: string;
  mitigationOptions: string[];
}

/**
 * Confidence interval for results
 */
export interface ConfidenceInterval {
  parameter: string;
  confidenceLevel: number; // percentage (e.g., 95)
  lowerBound: number;
  upperBound: number;
  mean: number;
}

// ============================================================================
// Wake Analysis Metadata
// ============================================================================

/**
 * Wake analysis metadata
 */
export interface WakeAnalysisMetadata {
  analysisId: string;
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
  gridResolution: number; // meters
  domainSize: {
    width: number; // meters
    height: number; // meters
  };
  qualityMetrics: AnalysisQualityMetrics;
}

/**
 * Analysis quality metrics
 */
export interface AnalysisQualityMetrics {
  convergence: number; // 0-1
  gridIndependence: number; // 0-1
  massConservation: number; // percentage
  energyConservation: number; // percentage
  validationScore: number; // 0-1
}

// ============================================================================
// Import Dependencies
// ============================================================================

// Import wind data types (assuming they exist)
export interface WindResourceData {
  // This should be imported from windData.ts
  // Included here for completeness
  location: {
    lat: number;
    lng: number;
    name?: string;
  };
  windData: Array<{
    timestamp: string;
    windSpeed: number;
    windDirection: number;
  }>;
  statistics: {
    meanWindSpeed: number;
    prevailingDirection: number;
    powerDensity: number;
  };
}

// Import terrain data types (if available)
export interface TerrainData {
  elevation: number[][];
  roughness: number[][];
  obstacles: Array<{
    type: string;
    geometry: any;
    height: number;
  }>;
}