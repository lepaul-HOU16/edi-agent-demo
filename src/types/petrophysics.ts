/**
 * Core TypeScript interfaces for petrophysical calculations and well log data models
 * Based on requirements 2.1, 2.2, 6.1, 6.2
 */

// Geographic location interface
export interface GeographicLocation {
  latitude: number;
  longitude: number;
  utmZone?: string;
  utmEasting?: number;
  utmNorthing?: number;
}

// Well header information
export interface WellHeaderInfo {
  wellName: string;
  field: string;
  operator: string;
  location: GeographicLocation;
  elevation: number;
  totalDepth: number;
  spudDate?: Date;
  completionDate?: Date;
  wellType: 'vertical' | 'horizontal' | 'deviated';
}

// Curve quality assessment
export interface CurveQuality {
  completeness: number; // 0-1, percentage of valid data points
  outliers: number; // Number of outlier points
  gaps: number; // Number of data gaps
  environmentalCorrections: string[];
  qualityFlag?: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
}

// Individual log curve data
export interface LogCurve {
  name: string;
  unit: string;
  description: string;
  data: number[];
  nullValue: number;
  quality: CurveQuality;
  apiCode?: string; // API curve code for standardization
}

// Quality assessment for entire well
export interface QualityAssessment {
  overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
  completeness: number; // For backward compatibility
  dataCompleteness: number;
  issues: string[];
  recommendations: string[];
  environmentalCorrections?: string[];
  validationFlags?: ValidationFlag[];
  lastAssessment?: Date;
}

// Validation flags for quality control
export interface ValidationFlag {
  type: 'missing_curve' | 'invalid_data' | 'format_error' | 'outlier' | 'environmental';
  severity: 'critical' | 'major' | 'minor';
  message: string;
  depthRange?: [number, number];
  suggestedFix?: string;
}

// Complete well log data structure
export interface WellLogData {
  wellName: string;
  wellInfo: WellHeaderInfo;
  curves: LogCurve[];
  depthRange: [number, number];
  dataQuality: QualityAssessment;
  lastModified: Date;
  version: string;
}

// Calculation method types
export type PorosityMethod = 'density' | 'neutron' | 'effective' | 'total';
export type ShaleVolumeMethod = 'larionov_tertiary' | 'larionov_pre_tertiary' | 'linear' | 'clavier';
export type SaturationMethod = 'archie' | 'waxman_smits' | 'dual_water';
export type PermeabilityMethod = 'kozeny_carman' | 'timur' | 'coates_dumanoir';

// Calculation parameters for different methods
export interface CalculationParameters {
  // Porosity parameters
  matrixDensity?: number; // Default 2.65 g/cc for sandstone
  fluidDensity?: number;  // Default 1.0 g/cc for water
  
  // Shale volume parameters
  grClean?: number;       // Clean sand gamma ray value
  grShale?: number;       // Shale gamma ray value
  
  // Saturation parameters
  rw?: number;           // Formation water resistivity
  a?: number;            // Tortuosity factor (default 1.0)
  m?: number;            // Cementation exponent (default 2.0)
  n?: number;            // Saturation exponent (default 2.0)
  
  // Permeability parameters
  grainSize?: number;    // Average grain size in microns
  swi?: number;          // Irreducible water saturation
}

// Quality metrics for calculations
export interface QualityMetrics {
  dataCompleteness: number;
  environmentalCorrections: string[];
  uncertaintyRange: [number, number];
  confidenceLevel: 'high' | 'medium' | 'low';
  validationNotes?: string;
}

// Statistical summary for calculation results
export interface StatisticalSummary {
  mean: number;
  median: number;
  standardDeviation: number;
  min: number;
  max: number;
  percentiles: { [key: string]: number }; // P10, P50, P90, etc.
  count: number;
  validCount: number; // Count excluding null values
}

// Calculation request interface
export interface CalculationRequest {
  wellName: string;
  method: PorosityMethod | ShaleVolumeMethod | SaturationMethod | PermeabilityMethod;
  parameters: CalculationParameters;
  depthRange?: [number, number];
  outputCurveName?: string;
  validateInputs?: boolean;
}

// Calculation result interface
export interface CalculationResult {
  values: number[];
  depths: number[];
  uncertainty: number[];
  quality: QualityMetrics;
  methodology: string;
  parameters: CalculationParameters;
  statistics: StatisticalSummary;
  timestamp: Date;
}

// Complete calculation results with metadata
export interface CalculationResults {
  wellName: string;
  calculationType: string;
  method: string;
  parameters: CalculationParameters;
  results: CalculationResult;
  statistics: StatisticalSummary;
  qualityMetrics: QualityMetrics;
  timestamp: Date;
}

// Error types for calculation engine
export interface CalculationError {
  type: 'parameter_error' | 'data_error' | 'numerical_error' | 'method_error';
  severity: 'critical' | 'major' | 'minor';
  message: string;
  suggestedFix?: string;
  context?: any;
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: CalculationError[];
  warnings: CalculationError[];
  corrections: AppliedCorrection[];
}

// Applied correction tracking
export interface AppliedCorrection {
  type: string;
  description: string;
  parameters: any;
  appliedAt: Date;
}

// Base calculation engine configuration
export interface CalculationEngineConfig {
  enableValidation: boolean;
  enableUncertaintyCalculation: boolean;
  defaultParameters: CalculationParameters;
  qualityThresholds: {
    dataCompleteness: number;
    uncertaintyMax: number;
  };
}

// Enhanced Workflow Types for Enhanced Strands Agent
export interface FormationEvaluationWorkflow {
  wellName: string;
  timestamp: Date;
  steps: string[];
  results: {
    dataQuality?: any;
    porosity?: any;
    shaleVolume?: any;
    saturation?: any;
    permeability?: any;
    reservoirQuality?: any;
    uncertainty?: any;
  };
  methodology: { [key: string]: MethodologyDocumentation };
  qualityMetrics: { [key: string]: QualityMetrics };
}

export interface MultiWellCorrelationAnalysis {
  wells: string[];
  timestamp: Date;
  correlationMethod: string;
  geologicalMarkers: GeologicalMarker[];
  reservoirZones: ReservoirZone[];
  completionTargets: CompletionTarget[];
  statistics: MultiWellStatistics;
}

export interface GeologicalMarker {
  id: string;
  name: string;
  type: 'formation_top' | 'sequence_boundary' | 'flooding_surface';
  depths: MarkerDepth[];
  color: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface MarkerDepth {
  wellName: string;
  depth: number;
}

export interface CorrelationLine {
  id: string;
  markerId: string;
  points: CorrelationPoint[];
  confidence: 'high' | 'medium' | 'low';
}

export interface CorrelationPoint {
  wellName: string;
  x: number;
  y: number;
  depth: number;
}

export interface ReservoirZone {
  name: string;
  topDepth: number;
  bottomDepth: number;
  thickness: number;
  averagePorosity: number;
  averagePermeability: number;
  netToGross: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  wellName: string;
}

export interface CompletionTarget {
  wellName: string;
  startDepth: number;
  endDepth: number;
  thickness: number;
  averagePorosity: number;
  estimatedPermeability: number;
  waterSaturation: number;
  shaleVolume: number;
  ranking: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface MultiWellStatistics {
  totalWells: number;
  averageDepthRange: [number, number];
  correlationQuality: 'high' | 'medium' | 'low';
  averagePorosity?: number;
  averagePermeability?: number;
  netToGrossRatio?: number;
}

export interface MethodologyDocumentation {
  name: string;
  description: string;
  industryReferences: string[];
  assumptions: string[];
  limitations: string[];
  methodology: string;
  uncertaintyRange: [number, number];
}

export interface CalculationAuditTrail {
  timestamp: Date;
  operation: string;
  parameters: { [key: string]: any };
  results: any;
  methodology: { [key: string]: MethodologyDocumentation };
  user: string;
}