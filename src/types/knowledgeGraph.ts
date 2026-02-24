// Knowledge Graph Types

export interface GraphNode {
  id: string;
  type: 'well' | 'event' | 'formation' | 'equipment';
  name: string;
  lat?: number;
  lng?: number;
  data: Record<string, any>;
  qualityScore?: number;
  qualityLevel?: 'high' | 'medium' | 'low';
  sourceDocs?: SourceDocument[];
  lineage?: LineageStep[];
  quality?: QualityMetrics;
  // D3 force simulation properties
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'correlation' | 'hierarchy' | 'event-link' | 'duplicate';
  label: string;
  similarityScore?: number; // For duplicate links (0-100)
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  metadata?: GraphMetadata;
}

export interface GraphMetadata {
  totalNodes: number;
  totalLinks: number;
  duplicatesFound: number;
  dataSources: string[];
  nodeTypeCounts: Record<string, number>;
  linkTypeCounts: Record<string, number>;
  qualityDistribution: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface SourceDocument {
  title: string;
  type: string;
  date: string;
  size: string;
  url: string;
}

export interface LineageStep {
  step: string;
  source: string;
  timestamp: string;
  transform: string;
  docRef?: string;
  docType?: string;
}

export interface QualityMetrics {
  overallScore: number;
  level: 'high' | 'medium' | 'low';
  metrics: QualityMetric[];
  issues: QualityIssue[];
  confidence: string;
}

export interface QualityMetric {
  name: string;
  status: 'pass' | 'warning' | 'fail';
  value: number;
  detail: string;
}

export interface QualityIssue {
  title: string;
  detail: string;
}

export interface RelatedNode {
  node: GraphNode;
  relationship: string;
  label: string;
  similarityScore?: number; // For duplicate relationships (0-100)
}

export interface FilterState {
  nodeTypes: Set<string>;
  relationshipTypes: Set<string>;
  qualityLevels: Set<string>;
  searchQuery: string;
  showDuplicatesOnly: boolean; // Show only nodes with duplicate links
  selectedWells?: Set<string>; // Specific wells to show (if empty, show all)
}

export interface FilterCounts {
  nodeTypes: Record<string, number>;
  relationshipTypes: Record<string, number>;
  qualityLevels: Record<string, number>;
}
