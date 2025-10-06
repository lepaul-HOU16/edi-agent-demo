/**
 * TypeScript types for Renewable Energy Integration
 * 
 * These types define the data structures for communication between
 * the EDI Platform frontend and the Python renewable energy backend.
 */

// ============================================================================
// AgentCore Request/Response Types
// ============================================================================

/**
 * Request payload sent to AgentCore
 */
export interface AgentCoreRequest {
  prompt: string;
  sessionId?: string;
  userId?: string;
}

/**
 * Response received from AgentCore
 */
export interface AgentCoreResponse {
  message: string;
  artifacts: AgentCoreArtifact[];
  thoughtSteps: ThoughtStep[];
  projectId: string;
  status: 'success' | 'error';
}

/**
 * Artifact returned from AgentCore (Python backend)
 */
export interface AgentCoreArtifact {
  type: 'terrain' | 'layout' | 'simulation' | 'report';
  title?: string;               // Optional title from backend
  subtitle?: string;            // Optional subtitle from backend
  data: {
    mapHtml?: string;           // Folium HTML
    chartImage?: string;        // Base64 matplotlib image
    geojson?: GeoJSON;          // GeoJSON data
    metrics?: Record<string, any>;
  };
  metadata: {
    projectId: string;
    timestamp: string;
    s3Url?: string;
  };
}

/**
 * Thought step from agent reasoning
 */
export interface ThoughtStep {
  id: string;
  type: string;
  timestamp: number;
  title: string;
  summary: string;
  status: 'in_progress' | 'complete' | 'error';
}

// ============================================================================
// EDI Platform Artifact Types
// ============================================================================

/**
 * Base artifact interface for EDI Platform
 */
export interface BaseArtifact {
  messageContentType: string;
  title: string;
  subtitle?: string;
  projectId: string;
  s3Url?: string;
}

/**
 * Terrain Analysis Artifact
 */
export interface TerrainArtifact extends BaseArtifact {
  messageContentType: 'wind_farm_terrain_analysis';
  coordinates: { lat: number; lng: number };
  suitabilityScore: number;
  exclusionZones: ExclusionZone[];
  mapHtml: string;              // Folium HTML
  riskAssessment?: {
    environmental: number;
    regulatory: number;
    technical: number;
    overall: number;
  };
}

/**
 * Exclusion zone for terrain analysis
 */
export interface ExclusionZone {
  id: string;
  type: string;
  name: string;
  area: number;
  buffer: number;
  riskLevel: 'low' | 'medium' | 'high';
  coordinates: [number, number][];
}

/**
 * Layout Artifact
 */
export interface LayoutArtifact extends BaseArtifact {
  messageContentType: 'wind_farm_layout';
  turbineCount: number;
  totalCapacity: number;
  turbinePositions: TurbinePosition[];
  mapHtml: string;              // Folium HTML
  geojson: GeoJSON;
  layoutType?: string;
  windAngle?: number;
  spacing?: string;
}

/**
 * Turbine position
 */
export interface TurbinePosition {
  id: string;
  lat: number;
  lng: number;
  model?: string;
  capacity?: number;
}

/**
 * Simulation Artifact
 */
export interface SimulationArtifact extends BaseArtifact {
  messageContentType: 'wind_farm_simulation';
  performanceMetrics: {
    annualEnergyProduction: number;
    capacityFactor: number;
    wakeLosses: number;
    wakeEfficiency?: number;
    grossAEP?: number;
    netAEP?: number;
  };
  chartImages: {
    wakeMap?: string;            // Base64 image
    performanceChart?: string;   // Base64 image
  };
  performanceByDirection?: PerformanceByDirection[];
  optimizationRecommendations?: OptimizationRecommendation[];
}

/**
 * Performance by wind direction
 */
export interface PerformanceByDirection {
  direction: number;
  directionName: string;
  frequency: number;
  averageWindSpeed: number;
  grossPower: number;
  netPower: number;
  wakeLoss: number;
  efficiency: number;
}

/**
 * Optimization recommendation
 */
export interface OptimizationRecommendation {
  category: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  potentialImprovement: string;
}

/**
 * Report Artifact
 */
export interface ReportArtifact extends BaseArtifact {
  messageContentType: 'wind_farm_report';
  executiveSummary: string;
  recommendations: string[];
  reportHtml: string;
}

// ============================================================================
// GeoJSON Types
// ============================================================================

export interface GeoJSON {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Point' | 'Polygon' | 'LineString';
    coordinates: number[] | number[][] | number[][][];
  };
  properties: Record<string, any>;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration for renewable energy integration
 */
export interface RenewableConfig {
  enabled: boolean;
  agentCoreEndpoint: string;
  s3Bucket: string;
  region: string;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Custom error for AgentCore communication
 */
export class AgentCoreError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'AgentCoreError';
  }
}

/**
 * Custom error for authentication issues
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Custom error for connection issues
 */
export class ConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConnectionError';
  }
}
