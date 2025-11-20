/**
 * Artifact Type Definitions
 * 
 * TypeScript interfaces for all artifact types supported by the platform.
 * These types ensure type safety and provide IntelliSense support.
 */

// ============================================================================
// Base Artifact Types
// ============================================================================

export interface BaseArtifact {
  type: string;
  data: {
    messageContentType: string;
    title: string;
    subtitle?: string;
    projectId?: string;
    metadata?: Record<string, any>;
    s3Artifacts?: Record<string, string>;
  };
  actions?: ActionButton[];
}

export interface ActionButton {
  label: string;
  query: string;
  icon: string;
  primary?: boolean;
}

// ============================================================================
// Renewable Energy Artifacts
// ============================================================================

export interface TerrainAnalysisArtifact extends BaseArtifact {
  type: 'wind_farm_terrain_analysis';
  data: {
    messageContentType: 'wind_farm_terrain_analysis';
    title: string;
    subtitle?: string;
    projectId: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    metrics: {
      totalFeatures: number;
      featuresByType: Record<string, number>;
      radiusKm?: number;
      analysisTimestamp?: string;
      exclusionZoneArea?: number;
      suitableArea?: number;
    };
    exclusionZones: GeoJSONFeature[];
    geojson?: GeoJSONFeatureCollection;
    mapHtml?: string;
    mapUrl?: string;
    windData?: {
      averageSpeed: number;
      predominantDirection: number;
      windRoseUrl?: string;
    };
    suitabilityScore?: number;
    recommendations?: string[];
    visualizations?: {
      interactive_map?: string;
      elevation_profile?: string;
      slope_analysis?: string;
    };
    s3Artifacts?: {
      interactiveMap?: string;
      elevationProfile?: string;
      slopeAnalysis?: string;
    };
  };
}

export interface LayoutOptimizationArtifact extends BaseArtifact {
  type: 'wind_farm_layout';
  data: {
    messageContentType: 'wind_farm_layout';
    title: string;
    subtitle?: string;
    projectId: string;
    turbineCount: number;
    totalCapacity: number;
    layoutType?: string;
    windAngle?: number;
    spacing?: {
      downwind: number;
      crosswind: number;
    };
    turbinePositions: TurbinePosition[];
    geojson?: GeoJSONFeatureCollection;
    mapHtml?: string;
    mapUrl?: string;
    metadata?: {
      algorithm?: string;
      algorithm_proof?: string;
      constraints_applied?: number;
      terrain_features_considered?: string[];
      placement_decisions?: PlacementDecision[];
      layout_metadata?: {
        total_turbines?: number;
        site_area_km2?: number;
        available_area_km2?: number;
        average_spacing_m?: number;
        capacity_factor_estimate?: number;
        annual_energy_production_GWh?: number;
      };
    };
    completedSteps?: string[];
    visualizations?: {
      interactive_map?: string;
      validation_chart?: string;
      spacing_analysis?: string;
    };
    s3Artifacts?: {
      interactiveMap?: string;
      validationChart?: string;
      spacingAnalysis?: string;
    };
  };
}

export interface WakeSimulationArtifact extends BaseArtifact {
  type: 'wind_farm_wake_analysis';
  data: {
    messageContentType: 'wind_farm_wake_analysis';
    title: string;
    subtitle?: string;
    projectId: string;
    turbineCount: number;
    totalCapacity: number;
    wakeModel: string;
    windSpeed: number;
    windDirection: number;
    results: {
      totalPowerLoss: number;
      averageEfficiency: number;
      annualEnergyLoss: number;
      turbineEfficiencies: TurbineEfficiency[];
    };
    visualizations?: {
      wakeMap?: string;
      efficiencyChart?: string;
      powerLossChart?: string;
    };
    recommendations?: string[];
    metadata?: {
      simulationTimestamp?: string;
      computationTime?: number;
      wakeModelParameters?: {
        thrustCoefficient?: number;
        wakeDecayConstant?: number;
        turbulenceIntensity?: number;
      };
      windConditions?: {
        averageSpeed?: number;
        predominantDirection?: number;
        turbulenceClass?: string;
        airDensity?: number;
      };
    };
    completedSteps?: string[];
    s3Artifacts?: {
      wakeMap?: string;
      efficiencyChart?: string;
      powerLossChart?: string;
      detailedReport?: string;
    };
  };
}

export interface WindRoseArtifact extends BaseArtifact {
  type: 'wind_rose_analysis';
  data: {
    messageContentType: 'wind_rose_analysis';
    title: string;
    subtitle?: string;
    projectId: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    windData: {
      averageSpeed: number;
      predominantDirection: number;
      maxSpeed?: number;
      calmPercentage?: number;
      dataPoints?: number;
      dataPeriod?: string;
    };
    directionBins: WindDirectionBin[];
    energyRose?: {
      description: string;
      directionContributions: EnergyContribution[];
    };
    visualizations?: {
      windRose?: string;
      energyRose?: string;
      speedDistribution?: string;
      interactivePlot?: string;
    };
    recommendations?: string[];
    metadata?: {
      dataSource?: string;
      measurementHeight?: number;
      dataResolution?: string;
      qualityScore?: number;
      analysisTimestamp?: string;
    };
    completedSteps?: string[];
    s3Artifacts?: {
      windRose?: string;
      energyRose?: string;
      speedDistribution?: string;
      interactivePlot?: string;
    };
  };
}

export interface ExecutiveReportArtifact extends BaseArtifact {
  type: 'wind_farm_report';
  data: {
    messageContentType: 'wind_farm_report';
    title: string;
    subtitle?: string;
    projectId: string;
    executiveSummary: string;
    recommendations: string[];
    keyFindings?: {
      windResource?: Record<string, any>;
      siteCharacteristics?: Record<string, any>;
      technicalDesign?: Record<string, any>;
      performance?: Record<string, any>;
      economics?: Record<string, any>;
    };
    reportHtml: string;
    s3Artifacts?: {
      fullReport?: string;
      financialModel?: string;
      technicalAppendix?: string;
    };
    completedSteps?: string[];
    metadata?: {
      reportVersion?: string;
      generatedBy?: string;
      generatedAt?: string;
      reviewStatus?: string;
      confidentiality?: string;
    };
  };
}

// ============================================================================
// Petrophysical Artifacts
// ============================================================================

export interface LogCurveVisualizationArtifact extends BaseArtifact {
  type: 'log_curve_visualization';
  data: {
    messageContentType: 'log_curve_visualization';
    title: string;
    subtitle?: string;
    wellName: string;
    curves: string[];
    depthRange: {
      start: number;
      end: number;
      unit: string;
    };
    plotUrl?: string;
    plotHtml?: string;
    statistics?: Record<string, CurveStatistics>;
    s3Artifacts?: {
      plot?: string;
      data?: string;
    };
  };
}

export interface PorosityAnalysisArtifact extends BaseArtifact {
  type: 'porosity_analysis';
  data: {
    messageContentType: 'porosity_analysis';
    title: string;
    subtitle?: string;
    wellName: string;
    method: string;
    results: {
      averagePorosity: number;
      minPorosity: number;
      maxPorosity: number;
      depthRange: {
        start: number;
        end: number;
      };
    };
    plotUrl?: string;
    recommendations?: string[];
    s3Artifacts?: {
      plot?: string;
      report?: string;
    };
  };
}

export interface MultiWellCorrelationArtifact extends BaseArtifact {
  type: 'multi_well_correlation';
  data: {
    messageContentType: 'multi_well_correlation';
    title: string;
    subtitle?: string;
    wells: string[];
    correlationMethod: string;
    plotUrl?: string;
    plotHtml?: string;
    findings?: string[];
    s3Artifacts?: {
      correlationPlot?: string;
      crossPlot?: string;
      report?: string;
    };
  };
}

// ============================================================================
// Supporting Types
// ============================================================================

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: string;
    coordinates: any;
  };
  properties: Record<string, any>;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export interface TurbinePosition {
  lat: number;
  lng: number;
  id?: string;
  capacity_MW?: number;
  hub_height_m?: number;
  rotor_diameter_m?: number;
}

export interface PlacementDecision {
  turbine_id: string;
  position: [number, number];
  avoided_features: string[];
  wind_exposure_score: number;
  placement_reason: string;
}

export interface TurbineEfficiency {
  turbineId: string;
  efficiency: number;
  powerOutput: number;
  wakeAffectedBy: string[];
}

export interface WindDirectionBin {
  direction: string;
  angle: number;
  frequency: number;
  averageSpeed: number;
  speedBins: Record<string, number>;
}

export interface EnergyContribution {
  direction: string;
  angle: number;
  energyContribution: number;
  capacityFactor: number;
}

export interface CurveStatistics {
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  count: number;
}

// ============================================================================
// Artifact Type Union
// ============================================================================

export type Artifact =
  | TerrainAnalysisArtifact
  | LayoutOptimizationArtifact
  | WakeSimulationArtifact
  | WindRoseArtifact
  | ExecutiveReportArtifact
  | LogCurveVisualizationArtifact
  | PorosityAnalysisArtifact
  | MultiWellCorrelationArtifact;

// ============================================================================
// Type Guards
// ============================================================================

export function isTerrainAnalysisArtifact(artifact: Artifact): artifact is TerrainAnalysisArtifact {
  return artifact.type === 'wind_farm_terrain_analysis';
}

export function isLayoutOptimizationArtifact(artifact: Artifact): artifact is LayoutOptimizationArtifact {
  return artifact.type === 'wind_farm_layout';
}

export function isWakeSimulationArtifact(artifact: Artifact): artifact is WakeSimulationArtifact {
  return artifact.type === 'wind_farm_wake_analysis';
}

export function isWindRoseArtifact(artifact: Artifact): artifact is WindRoseArtifact {
  return artifact.type === 'wind_rose_analysis';
}

export function isExecutiveReportArtifact(artifact: Artifact): artifact is ExecutiveReportArtifact {
  return artifact.type === 'wind_farm_report';
}

export function isLogCurveVisualizationArtifact(artifact: Artifact): artifact is LogCurveVisualizationArtifact {
  return artifact.type === 'log_curve_visualization';
}

export function isPorosityAnalysisArtifact(artifact: Artifact): artifact is PorosityAnalysisArtifact {
  return artifact.type === 'porosity_analysis';
}

export function isMultiWellCorrelationArtifact(artifact: Artifact): artifact is MultiWellCorrelationArtifact {
  return artifact.type === 'multi_well_correlation';
}
