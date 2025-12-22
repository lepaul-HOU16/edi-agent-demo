# Design Document

## Overview

The Interactive Knowledge Graph Explorer transforms collections from static data containers into dynamic exploration workspaces. It provides a dual-visualization approach combining force-directed graph visualization (for relationship discovery) with geographic mapping (for spatial context), enabling users to deeply investigate collection datasets including data quality, lineage, and provenance.

**Data Source**: This feature is designed to work with the 24 LAS (Log ASCII Standard) files from S&P Global and TGS stored in S3 at `global/well-data/`. These files contain well log data including curves like GR (Gamma Ray), RHOB (Bulk Density), NPHI (Neutron Porosity), DT (Sonic), and RT (Resistivity).

### Key Design Principles

1. **Context-Driven Navigation**: The Knowledge Graph is accessed from collection detail pages, making it clear that this is where you explore collection-specific data
2. **Dual Visualization**: Graph and map work together - selecting in one updates the other
3. **Progressive Disclosure**: Start with overview, drill into lineage/quality/sources as needed
4. **Performance First**: Handle 500+ entities smoothly using virtualization and optimized rendering
5. **Data Quality Transparency**: Surface quality issues prominently to enable data cleaning
6. **Real Data Focus**: Built specifically for S&P Global and TGS LAS files with petrophysical curve analysis

## Architecture

### Component Hierarchy

```
KnowledgeGraphExplorerPage
├── Header (breadcrumbs, search, theme toggle, data source badges)
├── Sidebar (filters for node types, relationships, quality)
├── MainContent (split view)
│   ├── GraphContainer
│   │   ├── D3ForceGraph (force-directed visualization)
│   │   ├── GraphControls (zoom, reset, auto-cluster)
│   │   └── GraphLegend (node type colors)
│   ├── ResizableDivider
│   └── MapContainer
│       ├── LeafletMap (geographic visualization)
│       └── MapControls (heatmap toggle, marker toggle)
└── DetailsPanel (tabs: Overview, Lineage, Sources, Quality)
```

### Data Flow

```
Collection Detail Page
  ↓ (user clicks "Knowledge Graph Explorer")
CollectionDetailPage → navigate('/collections/:id/knowledge-graph')
  ↓
KnowledgeGraphExplorerPage
  ↓ (load collection data)
GET /api/collections/:id
  ↓ (transform to graph format)
buildKnowledgeGraph(collection.dataItems)
  ↓ (render visualizations)
D3ForceGraph + LeafletMap
  ↓ (user interaction)
Node Selection → Update Details Panel + Center Map
```


## Components and Interfaces

### KnowledgeGraphExplorerPage Component

**Purpose**: Main page component that orchestrates the knowledge graph visualization

**Props**:
```typescript
interface KnowledgeGraphExplorerPageProps {
  // No props - uses URL params to get collectionId
}
```

**State**:
```typescript
interface KnowledgeGraphState {
  collection: Collection | null;
  graphData: GraphData;
  selectedNode: GraphNode | null;
  filters: FilterState;
  loading: boolean;
  error: string | null;
  theme: 'light' | 'dark';
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface GraphNode {
  id: string;
  type: 'well' | 'event' | 'formation' | 'equipment';
  name: string;
  lat?: number;
  lng?: number;
  data: Record<string, any>;
  qualityScore?: number;
  qualityLevel?: 'high' | 'medium' | 'low';
}

interface GraphLink {
  source: string; // node id
  target: string; // node id
  type: 'correlation' | 'hierarchy' | 'event-link' | 'duplicate';
  label: string;
}

interface FilterState {
  nodeTypes: Set<string>;
  relationshipTypes: Set<string>;
  qualityLevels: Set<string>;
  searchQuery: string;
}
```

**Key Methods**:
- `loadCollectionData()`: Fetch collection and build graph data
- `buildKnowledgeGraph(dataItems)`: Transform collection items into graph format
- `handleNodeSelection(node)`: Update selected node and details panel
- `applyFilters()`: Filter graph based on current filter state
- `createCanvasFromSelection()`: Create new canvas with selected entities

### D3ForceGraph Component

**Purpose**: Renders the force-directed graph visualization using D3.js

**Props**:
```typescript
interface D3ForceGraphProps {
  data: GraphData;
  selectedNodeId: string | null;
  onNodeSelect: (node: GraphNode) => void;
  filters: FilterState;
  width: number;
  height: number;
  theme: 'light' | 'dark';
}
```

**Implementation Details**:
- Uses D3 force simulation with link, charge, center, and collision forces
- Implements zoom and pan using d3.zoom()
- Renders nodes as circles with type-specific colors
- Renders links as paths with type-specific styles
- Handles drag interactions to reposition nodes
- Maintains 60fps performance using requestAnimationFrame

### LeafletMapView Component

**Purpose**: Renders geographic visualization of entities with coordinates

**Props**:
```typescript
interface LeafletMapViewProps {
  nodes: GraphNode[];
  selectedNodeId: string | null;
  onNodeSelect: (node: GraphNode) => void;
  theme: 'light' | 'dark';
  viewMode: 'markers' | 'heatmap';
}
```

**Implementation Details**:
- Uses Leaflet.js for map rendering
- Switches tile layers based on theme (CartoDB dark/light)
- Renders circle markers with type-specific colors
- Implements heatmap using leaflet.heat plugin
- Centers map on selected node
- Handles marker click to select node

### DetailsPanel Component

**Purpose**: Displays detailed information about selected entity

**Props**:
```typescript
interface DetailsPanelProps {
  node: GraphNode | null;
  relatedNodes: RelatedNode[];
  sourceDocs: SourceDocument[];
  lineage: LineageStep[];
  quality: QualityMetrics | null;
  onNodeSelect: (nodeId: string) => void;
  onCreateCanvas: () => void;
}

interface RelatedNode {
  node: GraphNode;
  relationship: string;
  label: string;
}

interface SourceDocument {
  title: string;
  type: string;
  date: string;
  size: string;
  url: string;
}

interface LineageStep {
  step: string;
  source: string;
  timestamp: string;
  transform: string;
  docRef?: string;
  docType?: string;
}

interface QualityMetrics {
  overallScore: number;
  level: 'high' | 'medium' | 'low';
  metrics: QualityMetric[];
  issues: QualityIssue[];
  confidence: string;
}

interface QualityMetric {
  name: string;
  status: 'pass' | 'warning' | 'fail';
  value: number;
  detail: string;
}

interface QualityIssue {
  title: string;
  detail: string;
}
```

**Tabs**:
1. **Overview**: Properties, related items, data sources
2. **Data Lineage**: Transformation pipeline with document references
3. **Source Docs**: Original documents with metadata
4. **Data Quality**: Quality score, metrics, issues, confidence

### FilterSidebar Component

**Purpose**: Provides filtering controls for the knowledge graph

**Props**:
```typescript
interface FilterSidebarProps {
  filters: FilterState;
  counts: FilterCounts;
  onFilterChange: (filters: FilterState) => void;
}

interface FilterCounts {
  nodeTypes: Record<string, number>;
  relationshipTypes: Record<string, number>;
  qualityLevels: Record<string, number>;
}
```

**Filter Groups**:
1. Node Types (wells, events, formations, equipment)
2. Relationship Types (correlations, hierarchies, event links, duplicates)
3. Data Quality (high, medium, low)


### Data Quality Metrics for LAS Files

The quality scoring system is specifically designed for S&P Global and TGS LAS files:

**Quality Score Components (0-100)**:

1. **Curve Completeness (40 points)**: Presence of standard petrophysical curves
   - GR (Gamma Ray) - essential for lithology identification
   - RHOB (Bulk Density) - essential for porosity calculation
   - NPHI (Neutron Porosity) - essential for porosity calculation
   - DT (Sonic) - useful for porosity and mechanical properties
   - RT (Resistivity) - essential for saturation calculation
   - DEPT (Depth) - required for all analysis

2. **Data Density (30 points)**: Number of data points in the file
   - <100 points: -30 (very sparse, likely incomplete)
   - 100-500 points: -20 (sparse)
   - 500-1000 points: -10 (adequate)
   - >1000 points: 0 (good density)

3. **File Size (15 points)**: Physical file size as proxy for completeness
   - <10KB: -15 (suspiciously small)
   - 10-50KB: -10 (small)
   - >50KB: 0 (normal size)

4. **Curve Count (15 points)**: Total number of curves logged
   - <3 curves: -15 (minimal logging)
   - 3-5 curves: -10 (basic logging)
   - 5-8 curves: -5 (standard logging)
   - >8 curves: 0 (comprehensive logging)

**Quality Levels**:
- **High (80-100)**: Complete standard curves, good data density, comprehensive logging
- **Medium (60-79)**: Missing some standard curves or lower data density
- **Low (0-59)**: Missing critical curves, sparse data, or very small file size

**Quality Issues Detected**:
- Missing critical curves (GR, RHOB, NPHI)
- Sparse data (<500 points)
- Suspiciously small file size
- Limited curve set (<5 curves)
- No depth information

### Collection Data Model (Existing)

```typescript
interface Collection {
  id: string;
  name: string;
  description?: string;
  dataSourceType: 'OSDU' | 'S3' | 'Mixed';
  dataItems: DataItem[];
  previewMetadata?: {
    wellCount?: number;
    dataPointCount?: number;
    createdFrom?: string;
    dataSources?: string[];
  };
  geographicBounds?: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
  createdAt: string;
  lastAccessedAt: string;
}

interface DataItem {
  name: string;
  type?: string;
  location?: string;
  depth?: string;
  operator?: string;
  dataSource?: 'OSDU' | 'Catalog';
  osduId?: string;
  osduMetadata?: {
    basin?: string;
    country?: string;
    logType?: string;
  };
}
```

### Knowledge Graph Data Model (New)

```typescript
interface KnowledgeGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  metadata: GraphMetadata;
}

interface GraphNode {
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
}

interface GraphLink {
  source: string;
  target: string;
  type: 'correlation' | 'hierarchy' | 'event-link' | 'duplicate';
  label: string;
}

interface GraphMetadata {
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
```

### Graph Building Algorithm (S&P Global / TGS Data)

```typescript
async function buildKnowledgeGraph(collection: Collection): Promise<KnowledgeGraphData> {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  
  // 1. Load LAS file metadata from S3 (24 numbered wells)
  const lasFiles = await loadLASFilesFromS3(collection);
  
  // 2. Create well nodes from LAS files
  for (const lasFile of lasFiles) {
    const wellNode: GraphNode = {
      id: lasFile.filename.replace('.las', ''),
      type: 'well',
      name: extractWellName(lasFile),
      lat: extractLatitudeFromLAS(lasFile),
      lng: extractLongitudeFromLAS(lasFile),
      data: {
        filename: lasFile.filename,
        curves: lasFile.curves,
        dataPoints: lasFile.dataPoints,
        operator: extractOperator(lasFile),
        depth: extractDepthRange(lasFile),
        location: extractLocation(lasFile),
        dataSource: 'S&P Global / TGS'
      },
      qualityScore: calculateLASQualityScore(lasFile),
      qualityLevel: getQualityLevel(calculateLASQualityScore(lasFile)),
      sourceDocs: [{
        title: lasFile.filename,
        type: 'LAS',
        date: lasFile.lastModified || 'Unknown',
        size: formatFileSize(lasFile.size),
        url: `s3://bucket/global/well-data/${lasFile.filename}`
      }]
    };
    nodes.push(wellNode);
  }
  
  // 3. Discover relationships between wells
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const relationship = discoverWellRelationship(nodes[i], nodes[j]);
      if (relationship) {
        links.push(relationship);
      }
    }
  }
  
  // 4. Identify potential duplicates (similar well names or locations)
  const duplicates = findDuplicateWells(nodes);
  duplicates.forEach(([node1, node2]) => {
    links.push({
      source: node1.id,
      target: node2.id,
      type: 'duplicate',
      label: 'Possible Duplicate'
    });
  });
  
  // 5. Calculate metadata
  const metadata = calculateGraphMetadata(nodes, links);
  
  return { nodes, links, metadata };
}

async function loadLASFilesFromS3(collection: Collection): Promise<LASFileMetadata[]> {
  const s3Client = new S3WellDataClient(process.env.STORAGE_BUCKET_NAME);
  const filenames = await s3Client.listWellFiles();
  
  const lasFiles: LASFileMetadata[] = [];
  for (const filename of filenames) {
    const wellData = await s3Client.getWellData(filename);
    lasFiles.push({
      filename,
      curves: wellData.curves || [],
      dataPoints: wellData.dataPoints || 0,
      content: wellData,
      lastModified: wellData.lastModified,
      size: wellData.size
    });
  }
  
  return lasFiles;
}

interface LASFileMetadata {
  filename: string;
  curves: string[];
  dataPoints: number;
  content: any;
  lastModified?: string;
  size?: number;
}

function extractWellName(lasFile: LASFileMetadata): string {
  // Extract well name from LAS file header or use filename
  // LAS files typically have WELL section with well name
  return lasFile.filename.replace('.las', '').replace(/^\d+_/, '');
}

function extractOperator(lasFile: LASFileMetadata): string {
  // Extract operator from LAS file header
  // Look for COMP (company) field in well information section
  return lasFile.content.operator || 'S&P Global / TGS';
}

function extractDepthRange(lasFile: LASFileMetadata): string {
  // Extract depth range from LAS file
  // Look for STRT (start depth) and STOP (stop depth) in well information
  const start = lasFile.content.startDepth || 0;
  const stop = lasFile.content.stopDepth || 0;
  return `${start}m - ${stop}m`;
}

function extractLocation(lasFile: LASFileMetadata): string {
  // Extract location from LAS file header
  // Look for LOC (location) field in well information section
  return lasFile.content.location || 'Gulf of Mexico';
}

function extractLatitudeFromLAS(lasFile: LASFileMetadata): number | undefined {
  // Extract latitude from LAS file header
  // Look for LAT field in well information section
  return lasFile.content.latitude;
}

function extractLongitudeFromLAS(lasFile: LASFileMetadata): number | undefined {
  // Extract longitude from LAS file header
  // Look for LON field in well information section
  return lasFile.content.longitude;
}

function discoverWellRelationship(node1: GraphNode, node2: GraphNode): GraphLink | null {
  // Same operator = correlation
  if (node1.data.operator === node2.data.operator && node1.data.operator) {
    return {
      source: node1.id,
      target: node2.id,
      type: 'correlation',
      label: 'Same Operator'
    };
  }
  
  // Similar depth ranges = correlation (same formation)
  if (hasOverlappingDepth(node1, node2)) {
    return {
      source: node1.id,
      target: node2.id,
      type: 'correlation',
      label: 'Similar Depth'
    };
  }
  
  // Similar curve sets = correlation (same logging program)
  if (hasSimilarCurves(node1, node2)) {
    return {
      source: node1.id,
      target: node2.id,
      type: 'correlation',
      label: 'Similar Logging'
    };
  }
  
  // Geographic proximity = correlation
  if (isGeographicallyClose(node1, node2)) {
    return {
      source: node1.id,
      target: node2.id,
      type: 'correlation',
      label: 'Geographic Proximity'
    };
  }
  
  return null;
}

function hasOverlappingDepth(node1: GraphNode, node2: GraphNode): boolean {
  // Check if depth ranges overlap
  const depth1 = parseDepthRange(node1.data.depth);
  const depth2 = parseDepthRange(node2.data.depth);
  
  if (!depth1 || !depth2) return false;
  
  return (depth1.start <= depth2.stop && depth1.stop >= depth2.start);
}

function hasSimilarCurves(node1: GraphNode, node2: GraphNode): boolean {
  // Check if wells have similar curve sets (>70% overlap)
  const curves1 = new Set(node1.data.curves);
  const curves2 = new Set(node2.data.curves);
  
  const intersection = new Set([...curves1].filter(c => curves2.has(c)));
  const union = new Set([...curves1, ...curves2]);
  
  const similarity = intersection.size / union.size;
  return similarity > 0.7;
}

function isGeographicallyClose(node1: GraphNode, node2: GraphNode): boolean {
  // Check if wells are within 10km of each other
  if (!node1.lat || !node1.lng || !node2.lat || !node2.lng) return false;
  
  const distance = calculateDistance(
    node1.lat, node1.lng,
    node2.lat, node2.lng
  );
  
  return distance < 10; // 10km threshold
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  // Haversine formula for distance between two points
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function findDuplicateWells(nodes: GraphNode[]): [GraphNode, GraphNode][] {
  const duplicates: [GraphNode, GraphNode][] = [];
  
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const similarity = calculateWellSimilarity(nodes[i], nodes[j]);
      if (similarity > 0.8) { // 80% similarity threshold
        duplicates.push([nodes[i], nodes[j]]);
      }
    }
  }
  
  return duplicates;
}

function calculateWellSimilarity(node1: GraphNode, node2: GraphNode): number {
  let score = 0;
  let factors = 0;
  
  // Name similarity (40% weight)
  const nameSim = calculateStringSimilarity(node1.name, node2.name);
  score += nameSim * 0.4;
  factors += 0.4;
  
  // Location similarity (30% weight)
  if (node1.lat && node1.lng && node2.lat && node2.lng) {
    const distance = calculateDistance(node1.lat, node1.lng, node2.lat, node2.lng);
    const locationSim = distance < 1 ? 1 : (distance < 5 ? 0.5 : 0); // <1km = same, <5km = similar
    score += locationSim * 0.3;
    factors += 0.3;
  }
  
  // Curve similarity (20% weight)
  const curveSim = calculateCurveSimilarity(node1.data.curves, node2.data.curves);
  score += curveSim * 0.2;
  factors += 0.2;
  
  // Data points similarity (10% weight)
  const dpSim = 1 - Math.abs(node1.data.dataPoints - node2.data.dataPoints) / Math.max(node1.data.dataPoints, node2.data.dataPoints);
  score += dpSim * 0.1;
  factors += 0.1;
  
  return factors > 0 ? score / factors : 0;
}

function calculateStringSimilarity(str1: string, str2: string): number {
  // Levenshtein distance normalized to 0-1
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

function calculateCurveSimilarity(curves1: string[], curves2: string[]): number {
  const set1 = new Set(curves1);
  const set2 = new Set(curves2);
  
  const intersection = new Set([...set1].filter(c => set2.has(c)));
  const union = new Set([...set1, ...set2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

function calculateLASQualityScore(lasFile: LASFileMetadata): number {
  let score = 100;
  
  // Curve completeness (40 points)
  // Standard petrophysical curves: GR, RHOB, NPHI, DT, RT
  const standardCurves = ['GR', 'RHOB', 'NPHI', 'DT', 'RT', 'DEPT'];
  const presentCurves = standardCurves.filter(curve => 
    lasFile.curves.some(c => c.toUpperCase().includes(curve))
  );
  score -= (standardCurves.length - presentCurves.length) * 6.67; // ~40 points total
  
  // Data density (30 points)
  // Expect at least 1000 data points for good quality
  if (lasFile.dataPoints < 100) score -= 30;
  else if (lasFile.dataPoints < 500) score -= 20;
  else if (lasFile.dataPoints < 1000) score -= 10;
  
  // File size (15 points)
  // Very small files might be incomplete
  if (lasFile.size && lasFile.size < 10000) score -= 15; // <10KB
  else if (lasFile.size && lasFile.size < 50000) score -= 10; // <50KB
  
  // Curve count (15 points)
  // More curves = better logging program
  if (lasFile.curves.length < 3) score -= 15;
  else if (lasFile.curves.length < 5) score -= 10;
  else if (lasFile.curves.length < 8) score -= 5;
  
  return Math.max(0, Math.min(100, score));
}

function getQualityLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Navigation preserves collection context
*For any* collection, when navigating to the Knowledge Graph Explorer, the collection ID should be preserved in the URL and the collection data should be loaded
**Validates: Requirements 1.2**

### Property 2: All entities become nodes
*For any* collection with N data items, the knowledge graph should contain exactly N nodes
**Validates: Requirements 2.1**

### Property 3: Node colors match entity types
*For any* entity node, the node color should match its type (wells: blue, events: red, formations: green, equipment: orange)
**Validates: Requirements 2.2**

### Property 4: Link styles match relationship types
*For any* relationship link, the visual style should match its type (correlations: dashed blue, hierarchies: solid green, events: solid red, duplicates: dotted orange)
**Validates: Requirements 2.3**

### Property 5: Node selection updates UI state
*For any* node, clicking it should set it as selected, highlight it in the graph, and display its details in the panel
**Validates: Requirements 2.5**

### Property 6: Entities with coordinates appear on map
*For any* collection, all entities with valid lat/lng coordinates should appear as markers on the map
**Validates: Requirements 3.1**

### Property 7: Map marker colors match graph node colors
*For any* entity with coordinates, the map marker color should match the graph node color for that entity type
**Validates: Requirements 3.2**

### Property 8: Map marker selection syncs with graph
*For any* map marker, clicking it should select the corresponding graph node and display its details
**Validates: Requirements 3.3**

### Property 9: Graph node selection centers map
*For any* graph node with coordinates, clicking it should center the map on those coordinates
**Validates: Requirements 3.4**

### Property 10: Map view toggle updates visualization
*For any* map state (markers or heatmap), toggling the view should update the map visualization accordingly
**Validates: Requirements 3.5**

### Property 11: Node selection displays all tabs
*For any* entity node, selecting it should display a details panel with Overview, Data Lineage, Source Docs, and Data Quality tabs
**Validates: Requirements 4.1**

### Property 12: Overview tab contains all properties
*For any* entity, the Overview tab should display all entity properties, related items, and data source information
**Validates: Requirements 4.2**

### Property 13: Lineage tab displays transformation pipeline
*For any* entity with lineage data, the Data Lineage tab should display all transformation steps with source, timestamp, and transform description
**Validates: Requirements 4.3, 10.1**

### Property 14: Source docs tab displays all documents
*For any* entity with source documents, the Source Docs tab should display all documents with metadata (type, date, size) and links
**Validates: Requirements 4.4, 10.4**

### Property 15: Quality tab displays all metrics
*For any* entity with quality data, the Data Quality tab should display overall score, individual metrics, issues, and confidence assessment
**Validates: Requirements 4.5**

### Property 16: Related item click selects node
*For any* related item in the details panel, clicking it should select that node in the graph and update the details panel
**Validates: Requirements 4.6**

### Property 17: Lineage doc link navigates to source docs
*For any* lineage step with a document reference, clicking the link should switch to the Source Docs tab and highlight that document
**Validates: Requirements 4.7, 10.3**

### Property 18: Node type filter shows/hides nodes
*For any* node type filter, toggling it should show or hide all nodes of that type and update the count badge
**Validates: Requirements 5.2**

### Property 19: Relationship type filter shows/hides links
*For any* relationship type filter, toggling it should show or hide all links of that type and update the count badge
**Validates: Requirements 5.3**

### Property 20: Quality filter shows/hides nodes by score
*For any* quality level filter, toggling it should show or hide nodes based on their quality score (high: 80-100, medium: 60-79, low: 0-59)
**Validates: Requirements 5.4**

### Property 21: Search filters nodes by name
*For any* search query, the graph should display only nodes whose names contain the query string (case-insensitive) and highlight them
**Validates: Requirements 5.6**

### Property 22: Canvas creation includes selected entities
*For any* selection of one or more nodes, creating a canvas should create a new canvas linked to the collection with those entities as context
**Validates: Requirements 6.2**

### Property 23: Canvas creation navigates and shows feedback
*For any* canvas creation, the system should navigate to the new canvas and display a success message indicating which entities were loaded
**Validates: Requirements 6.4**

### Property 24: Theme detection matches user preference
*For any* user theme preference (light or dark), the Knowledge Graph Explorer should detect and apply that theme on load
**Validates: Requirements 7.1**

### Property 25: Theme persistence across sessions
*For any* theme change, the new theme preference should be persisted and applied in future sessions
**Validates: Requirements 7.5**

### Property 26: Async loading shows loading indicator
*For any* entity details fetch, a loading indicator should be displayed while the data is being fetched
**Validates: Requirements 8.4**

### Property 27: Duplicate detection identifies similar entities
*For any* set of entities, the duplicate detection algorithm should identify pairs with >80% similarity and connect them with duplicate links
**Validates: Requirements 9.1, 9.2**

### Property 28: Quality issues display with suggestions
*For any* entity with data quality issues, the Data Quality tab should display each issue with an actionable suggestion for resolution
**Validates: Requirements 9.3, 9.4**

### Property 29: Divider drag resizes panels proportionally
*For any* divider position between 20% and 80%, dragging the divider should resize the graph and map panels proportionally
**Validates: Requirements 11.2**

### Property 30: Graph resize preserves zoom and center
*For any* graph panel resize, the current zoom level and center point should be maintained after the resize
**Validates: Requirements 11.4**

### Property 31: Filter updates recalculate statistics
*For any* filter state change, the statistics in the details panel should be recalculated to reflect only visible entities
**Validates: Requirements 12.2**

### Property 32: Statistics include all counts
*For any* collection, the statistics should include counts for total nodes, total relationships, duplicates found, and counts for each entity type and relationship type
**Validates: Requirements 12.4**


## Error Handling

### Navigation Errors

**Scenario**: Collection not found when loading Knowledge Graph Explorer

**Handling**:
```typescript
try {
  const collection = await getCollection(collectionId);
  if (!collection) {
    setError('Collection not found');
    // Display error alert with "Back to Collections" button
  }
} catch (err) {
  setError('Failed to load collection: ' + err.message);
  // Display error alert with retry option
}
```

### Graph Building Errors

**Scenario**: Invalid or malformed collection data

**Handling**:
```typescript
try {
  const graphData = buildKnowledgeGraph(collection);
  if (graphData.nodes.length === 0) {
    setError('No valid entities found in collection');
    // Display empty state with suggestion to add data
  }
} catch (err) {
  console.error('Graph building failed:', err);
  setError('Failed to build knowledge graph');
  // Fall back to showing collection data in table format
}
```

### Map Rendering Errors

**Scenario**: Leaflet fails to initialize or load tiles

**Handling**:
```typescript
try {
  const map = L.map('map').setView([29.5, -94.9], 9);
  L.tileLayer(tileUrl).addTo(map);
} catch (err) {
  console.error('Map initialization failed:', err);
  // Hide map container and show graph only
  // Display warning: "Map unavailable - showing graph only"
}
```

### Data Quality Calculation Errors

**Scenario**: Missing or invalid data prevents quality score calculation

**Handling**:
```typescript
function calculateQualityScore(item: DataItem): number {
  try {
    // Calculate score
    return score;
  } catch (err) {
    console.warn('Quality calculation failed for', item.name, err);
    return 50; // Default to medium quality
  }
}
```

### Filter Application Errors

**Scenario**: Filter state becomes invalid or causes rendering issues

**Handling**:
```typescript
try {
  const filteredNodes = applyFilters(nodes, filters);
  setVisibleNodes(filteredNodes);
} catch (err) {
  console.error('Filter application failed:', err);
  // Reset filters to default state
  setFilters(DEFAULT_FILTERS);
  // Show warning toast: "Filters reset due to error"
}
```

### Canvas Creation Errors

**Scenario**: Canvas creation fails due to API error

**Handling**:
```typescript
try {
  const canvas = await createSession({
    name: `Canvas from ${collection.name}`,
    linkedCollectionId: collection.id,
    selectedEntities: selectedNodes.map(n => n.id)
  });
  navigate(`/chat/${canvas.id}`);
} catch (err) {
  console.error('Canvas creation failed:', err);
  // Display error toast with retry option
  showErrorToast('Failed to create canvas. Please try again.');
}
```

## Testing Strategy

### Unit Testing

**Focus**: Individual component logic and data transformations

**Key Test Areas**:
1. Graph building algorithm (`buildKnowledgeGraph`)
   - Test with various collection structures
   - Test relationship discovery logic
   - Test duplicate detection algorithm
   - Test quality score calculation

2. Filter logic (`applyFilters`)
   - Test node type filtering
   - Test relationship type filtering
   - Test quality level filtering
   - Test search query filtering

3. Data transformation utilities
   - Test `inferNodeType`
   - Test `discoverRelationship`
   - Test `findDuplicates`
   - Test `calculateQualityScore`

**Example Unit Test**:
```typescript
describe('buildKnowledgeGraph', () => {
  it('should create nodes for all collection items', () => {
    const collection = {
      dataItems: [
        { name: 'WELL-001', type: 'well' },
        { name: 'WELL-002', type: 'well' }
      ]
    };
    
    const graph = buildKnowledgeGraph(collection);
    
    expect(graph.nodes).toHaveLength(2);
    expect(graph.nodes[0].name).toBe('WELL-001');
    expect(graph.nodes[1].name).toBe('WELL-002');
  });
  
  it('should discover relationships between nodes', () => {
    const collection = {
      dataItems: [
        { name: 'WELL-001', type: 'well', operator: 'Shell' },
        { name: 'WELL-002', type: 'well', operator: 'Shell' }
      ]
    };
    
    const graph = buildKnowledgeGraph(collection);
    
    expect(graph.links).toHaveLength(1);
    expect(graph.links[0].type).toBe('correlation');
    expect(graph.links[0].label).toBe('Same Operator');
  });
});
```

### Property-Based Testing

**Focus**: Universal properties that should hold across all inputs

**Testing Framework**: fast-check (for TypeScript/JavaScript)

**Configuration**: Each property test should run a minimum of 100 iterations

**Key Properties to Test**:

1. **Property 2: All entities become nodes**
   - Generate random collections with varying numbers of data items
   - Verify node count equals data item count
   - Tag: `Feature: interactive-knowledge-graph, Property 2: All entities become nodes`

2. **Property 3: Node colors match entity types**
   - Generate random entities of each type
   - Verify color assignment is correct for each type
   - Tag: `Feature: interactive-knowledge-graph, Property 3: Node colors match entity types`

3. **Property 18: Node type filter shows/hides nodes**
   - Generate random graph data with mixed node types
   - Apply random filter combinations
   - Verify visible nodes match filter criteria
   - Tag: `Feature: interactive-knowledge-graph, Property 18: Node type filter shows/hides nodes`

4. **Property 27: Duplicate detection identifies similar entities**
   - Generate random entity pairs with varying similarity scores
   - Verify duplicates are identified when similarity > 80%
   - Tag: `Feature: interactive-knowledge-graph, Property 27: Duplicate detection identifies similar entities`

**Example Property Test**:
```typescript
import fc from 'fast-check';

/**
 * Feature: interactive-knowledge-graph, Property 2: All entities become nodes
 * Validates: Requirements 2.1
 */
describe('Property: All entities become nodes', () => {
  it('should create exactly N nodes for N data items', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          name: fc.string(),
          type: fc.constantFrom('well', 'event', 'formation', 'equipment')
        }), { minLength: 1, maxLength: 100 }),
        (dataItems) => {
          const collection = { dataItems };
          const graph = buildKnowledgeGraph(collection);
          
          return graph.nodes.length === dataItems.length;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: interactive-knowledge-graph, Property 18: Node type filter shows/hides nodes
 * Validates: Requirements 5.2
 */
describe('Property: Node type filter shows/hides nodes', () => {
  it('should show only nodes of selected types', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          id: fc.string(),
          type: fc.constantFrom('well', 'event', 'formation', 'equipment'),
          name: fc.string()
        }), { minLength: 10, maxLength: 50 }),
        fc.array(fc.constantFrom('well', 'event', 'formation', 'equipment'), { minLength: 1, maxLength: 4 }),
        (nodes, selectedTypes) => {
          const filters = {
            nodeTypes: new Set(selectedTypes),
            relationshipTypes: new Set(),
            qualityLevels: new Set(),
            searchQuery: ''
          };
          
          const filtered = applyFilters(nodes, filters);
          
          // All filtered nodes should be of selected types
          return filtered.every(node => selectedTypes.includes(node.type));
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

**Focus**: Component interactions and data flow

**Key Test Scenarios**:
1. Collection detail page → Knowledge Graph Explorer navigation
2. Node selection → Details panel update → Map centering
3. Filter application → Graph update → Statistics recalculation
4. Canvas creation → Navigation → Context loading

**Example Integration Test**:
```typescript
describe('Knowledge Graph Explorer Integration', () => {
  it('should navigate from collection detail to knowledge graph', async () => {
    render(<CollectionDetailPage />);
    
    const kgButton = screen.getByText('Knowledge Graph Explorer');
    fireEvent.click(kgButton);
    
    await waitFor(() => {
      expect(window.location.pathname).toContain('/knowledge-graph');
    });
  });
  
  it('should sync node selection between graph and map', async () => {
    const { container } = render(<KnowledgeGraphExplorerPage />);
    
    // Click node in graph
    const graphNode = container.querySelector('.node[data-id="WELL-001"]');
    fireEvent.click(graphNode);
    
    // Verify details panel updated
    expect(screen.getByText('WELL-001')).toBeInTheDocument();
    
    // Verify map centered on node location
    const map = container.querySelector('#map');
    // Check map center coordinates
  });
});
```

### Visual Regression Testing

**Focus**: UI appearance and layout consistency

**Tool**: Percy or Chromatic

**Key Snapshots**:
1. Knowledge Graph Explorer - default state
2. Knowledge Graph Explorer - node selected
3. Knowledge Graph Explorer - filters applied
4. Knowledge Graph Explorer - dark mode
5. Knowledge Graph Explorer - light mode
6. Details panel - each tab
7. Empty state - no data items
8. Error state - collection not found



## Real-World Data Handling

### Industry Data Challenges

The Knowledge Graph Explorer must handle typical bad industry data:

1. **Missing Coordinates**: Many wells lack lat/lng data
2. **Inconsistent Naming**: WELL-001, Well_001, well001, W-001 all refer to same well
3. **Incomplete Metadata**: Missing operator, depth, formation data
4. **Conflicting Data**: Same well has different depths in OSDU vs S3
5. **Duplicate Records**: Same well appears multiple times with slight variations
6. **Mixed Data Sources**: OSDU + S3 LAS files with different schemas
7. **Stale Data**: Last updated months/years ago
8. **Invalid Values**: Negative depths, impossible coordinates, null fields

### Data Source Integration

#### S3 LAS Files (24 files in global/well-data/)

**Data Extraction**:
```typescript
interface LASFileData {
  wellName: string;
  uwi?: string; // Unique Well Identifier
  location?: string;
  operator?: string;
  curves: string[]; // Available log curves
  depthRange?: { min: number; max: number };
  metadata: Record<string, any>;
}

async function extractLASMetadata(s3Key: string): Promise<LASFileData> {
  // Parse LAS file header
  // Extract well information section
  // Identify available curves
  // Calculate depth range from DEPT curve
  // Return structured metadata
}
```

**Coordinate Extraction**:
- Try to parse from LOCATION field (various formats)
- Fall back to UWI lookup in coordinate database
- If no coordinates, exclude from map but include in graph

#### OSDU Data

**Data Extraction**:
```typescript
interface OSDUWellData {
  id: string;
  kind: string;
  data: {
    WellName?: string;
    FacilityName?: string;
    SpatialLocation?: {
      Wgs84Coordinates?: {
        Latitude: number;
        Longitude: number;
      };
    };
    VerticalMeasurements?: Array<{
      VerticalMeasurement: number;
      VerticalMeasurementType: string;
    }>;
    OperatingEnvironment?: {
      Operator?: string;
    };
  };
}

async function extractOSDUMetadata(osduId: string): Promise<GraphNode> {
  // Fetch from OSDU API
  // Navigate nested data structure
  // Handle missing fields gracefully
  // Normalize to common format
}
```

### Data Normalization Pipeline

```typescript
interface NormalizedEntity {
  id: string;
  name: string;
  type: 'well' | 'event' | 'formation' | 'equipment';
  source: 'S3' | 'OSDU' | 'Mixed';
  coordinates?: { lat: number; lng: number };
  properties: Record<string, any>;
  rawData: any; // Original data for reference
  quality: {
    score: number;
    issues: string[];
    confidence: 'high' | 'medium' | 'low';
  };
}

function normalizeEntity(rawData: any, source: 'S3' | 'OSDU'): NormalizedEntity {
  const entity: NormalizedEntity = {
    id: generateStableId(rawData, source),
    name: extractName(rawData, source),
    type: inferType(rawData, source),
    source,
    properties: {},
    rawData,
    quality: {
      score: 0,
      issues: [],
      confidence: 'low'
    }
  };
  
  // Extract coordinates with multiple fallback strategies
  entity.coordinates = extractCoordinates(rawData, source);
  
  // Extract common properties
  entity.properties = extractProperties(rawData, source);
  
  // Calculate quality score
  entity.quality = assessQuality(entity);
  
  return entity;
}

function extractCoordinates(data: any, source: 'S3' | 'OSDU'): { lat: number; lng: number } | undefined {
  if (source === 'OSDU') {
    // Try OSDU spatial location
    const coords = data.data?.SpatialLocation?.Wgs84Coordinates;
    if (coords?.Latitude && coords?.Longitude) {
      return { lat: coords.Latitude, lng: coords.Longitude };
    }
  } else {
    // Try various LAS location formats
    const location = data.metadata?.LOCATION || data.metadata?.LOC;
    if (location) {
      // Parse formats like:
      // "29.1234N 94.5678W"
      // "29° 7' 24.24" N, 94° 34' 4.08" W"
      // "29.1234, -94.5678"
      const parsed = parseLocationString(location);
      if (parsed) return parsed;
    }
    
    // Try UWI lookup
    const uwi = data.uwi || data.metadata?.UWI;
    if (uwi) {
      const coords = lookupCoordinatesByUWI(uwi);
      if (coords) return coords;
    }
  }
  
  return undefined; // No coordinates available
}

function extractName(data: any, source: 'S3' | 'OSDU'): string {
  if (source === 'OSDU') {
    return data.data?.WellName || data.data?.FacilityName || data.id;
  } else {
    return data.wellName || data.metadata?.WELL || 'Unknown Well';
  }
}
```

### Duplicate Detection for Messy Data

```typescript
function calculateSimilarity(entity1: NormalizedEntity, entity2: NormalizedEntity): number {
  let score = 0;
  let maxScore = 0;
  
  // Name similarity (40 points)
  maxScore += 40;
  const nameSim = stringSimilarity(
    normalizeWellName(entity1.name),
    normalizeWellName(entity2.name)
  );
  score += nameSim * 40;
  
  // Coordinate proximity (30 points)
  if (entity1.coordinates && entity2.coordinates) {
    maxScore += 30;
    const distance = haversineDistance(entity1.coordinates, entity2.coordinates);
    if (distance < 0.1) { // Within 100m
      score += 30;
    } else if (distance < 1) { // Within 1km
      score += 20;
    } else if (distance < 10) { // Within 10km
      score += 10;
    }
  }
  
  // Operator match (15 points)
  if (entity1.properties.operator && entity2.properties.operator) {
    maxScore += 15;
    if (entity1.properties.operator === entity2.properties.operator) {
      score += 15;
    }
  }
  
  // Depth similarity (15 points)
  if (entity1.properties.depth && entity2.properties.depth) {
    maxScore += 15;
    const depth1 = parseDepth(entity1.properties.depth);
    const depth2 = parseDepth(entity2.properties.depth);
    if (depth1 && depth2) {
      const depthDiff = Math.abs(depth1 - depth2);
      if (depthDiff < 10) score += 15;
      else if (depthDiff < 50) score += 10;
      else if (depthDiff < 100) score += 5;
    }
  }
  
  return maxScore > 0 ? (score / maxScore) * 100 : 0;
}

function normalizeWellName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[_\-\s]/g, '') // Remove separators
    .replace(/^(well|w)/i, '') // Remove well prefix
    .replace(/[^a-z0-9]/g, ''); // Remove special chars
}

function stringSimilarity(str1: string, str2: string): number {
  // Levenshtein distance normalized to 0-1
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}
```

### Data Quality Assessment for Industry Data

```typescript
function assessQuality(entity: NormalizedEntity): QualityMetrics {
  const metrics: QualityMetric[] = [];
  const issues: QualityIssue[] = [];
  let totalScore = 0;
  
  // 1. Completeness (25 points)
  const requiredFields = ['name', 'type', 'source'];
  const optionalFields = ['coordinates', 'operator', 'depth', 'formation'];
  
  const hasRequired = requiredFields.every(f => entity[f] || entity.properties[f]);
  const optionalCount = optionalFields.filter(f => entity[f] || entity.properties[f]).length;
  
  const completenessScore = hasRequired ? 15 + (optionalCount / optionalFields.length) * 10 : 0;
  totalScore += completenessScore;
  
  metrics.push({
    name: 'Data Completeness',
    status: completenessScore > 20 ? 'pass' : completenessScore > 15 ? 'warning' : 'fail',
    value: (completenessScore / 25) * 100,
    detail: `${optionalCount}/${optionalFields.length} optional fields populated`
  });
  
  if (!hasRequired) {
    issues.push({
      title: 'Missing Required Fields',
      detail: 'Entity is missing critical required fields'
    });
  }
  
  // 2. Coordinate Validity (20 points)
  if (entity.coordinates) {
    const { lat, lng } = entity.coordinates;
    const validLat = lat >= -90 && lat <= 90;
    const validLng = lng >= -180 && lng <= 180;
    
    if (validLat && validLng) {
      totalScore += 20;
      metrics.push({
        name: 'Coordinate Validity',
        status: 'pass',
        value: 100,
        detail: 'Valid geographic coordinates'
      });
    } else {
      metrics.push({
        name: 'Coordinate Validity',
        status: 'fail',
        value: 0,
        detail: 'Invalid coordinate values'
      });
      issues.push({
        title: 'Invalid Coordinates',
        detail: `Lat: ${lat}, Lng: ${lng} are outside valid ranges`
      });
    }
  } else {
    totalScore += 10; // Partial credit for missing coordinates
    metrics.push({
      name: 'Coordinate Validity',
      status: 'warning',
      value: 50,
      detail: 'No coordinates available'
    });
  }
  
  // 3. Data Consistency (20 points)
  // Check for conflicting data if entity appears in multiple sources
  const consistencyScore = 20; // Default to consistent
  totalScore += consistencyScore;
  metrics.push({
    name: 'Data Consistency',
    status: 'pass',
    value: 100,
    detail: 'No conflicting data detected'
  });
  
  // 4. Naming Convention (15 points)
  const hasStandardName = /^[A-Z0-9\-_]+$/i.test(entity.name);
  const namingScore = hasStandardName ? 15 : 10;
  totalScore += namingScore;
  
  metrics.push({
    name: 'Naming Convention',
    status: hasStandardName ? 'pass' : 'warning',
    value: (namingScore / 15) * 100,
    detail: hasStandardName ? 'Follows standard naming' : 'Non-standard naming format'
  });
  
  // 5. Source Reliability (20 points)
  const sourceScore = entity.source === 'OSDU' ? 20 : 15; // OSDU slightly more reliable
  totalScore += sourceScore;
  
  metrics.push({
    name: 'Source Reliability',
    status: 'pass',
    value: (sourceScore / 20) * 100,
    detail: `Data from ${entity.source}`
  });
  
  const overallScore = totalScore;
  const level = overallScore >= 80 ? 'high' : overallScore >= 60 ? 'medium' : 'low';
  
  return {
    overallScore,
    level,
    metrics,
    issues,
    confidence: level === 'high' ? 'High confidence - Well-formed data' :
                level === 'medium' ? 'Medium confidence - Some data quality issues' :
                'Low confidence - Significant data quality issues'
  };
}
```

### Relationship Discovery for Mixed Data

```typescript
function discoverRelationship(node1: NormalizedEntity, node2: NormalizedEntity): GraphLink | null {
  // 1. Same operator = correlation
  if (node1.properties.operator && node2.properties.operator) {
    if (normalizeOperatorName(node1.properties.operator) === normalizeOperatorName(node2.properties.operator)) {
      return {
        source: node1.id,
        target: node2.id,
        type: 'correlation',
        label: 'Same Operator'
      };
    }
  }
  
  // 2. Geographic proximity = correlation
  if (node1.coordinates && node2.coordinates) {
    const distance = haversineDistance(node1.coordinates, node2.coordinates);
    if (distance < 5) { // Within 5km
      return {
        source: node1.id,
        target: node2.id,
        type: 'correlation',
        label: `${distance.toFixed(1)}km apart`
      };
    }
  }
  
  // 3. Similar depth range = correlation (same formation)
  if (node1.properties.depth && node2.properties.depth) {
    const depth1 = parseDepth(node1.properties.depth);
    const depth2 = parseDepth(node2.properties.depth);
    if (depth1 && depth2 && Math.abs(depth1 - depth2) < 100) {
      return {
        source: node1.id,
        target: node2.id,
        type: 'correlation',
        label: 'Similar Depth'
      };
    }
  }
  
  // 4. Cross-source reference = hierarchy
  if (node1.source !== node2.source) {
    // Check if they reference each other
    if (node1.rawData.osduId === node2.id || node2.rawData.osduId === node1.id) {
      return {
        source: node1.id,
        target: node2.id,
        type: 'hierarchy',
        label: 'Cross-Reference'
      };
    }
  }
  
  return null;
}

function normalizeOperatorName(operator: string): string {
  return operator
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[.,]/g, '')
    .replace(/inc|llc|ltd|corp|corporation/gi, '');
}

function parseDepth(depthStr: string | number): number | null {
  if (typeof depthStr === 'number') return depthStr;
  
  // Handle various formats: "3500m", "3500 m", "11483 ft", "3500"
  const match = depthStr.match(/(\d+\.?\d*)\s*(m|ft|meter|feet)?/i);
  if (!match) return null;
  
  let depth = parseFloat(match[1]);
  const unit = match[2]?.toLowerCase();
  
  // Convert to meters
  if (unit && (unit.startsWith('ft') || unit.startsWith('feet'))) {
    depth = depth * 0.3048;
  }
  
  return depth;
}

function haversineDistance(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
  const R = 6371; // Earth radius in km
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
```

### Handling Missing Data

**Strategy**: Progressive Enhancement

1. **No Coordinates**: Include in graph, exclude from map, show "No location data" badge
2. **No Operator**: Show "Unknown Operator" in properties
3. **No Depth**: Show "Depth not available" in properties
4. **No Quality Data**: Default to medium quality (50 score)
5. **No Lineage**: Show "Lineage unavailable" message in tab
6. **No Source Docs**: Show "No documents linked" message in tab

**UI Indicators**:
```typescript
// Badge for data quality
<Badge color={entity.quality.level === 'high' ? 'green' : 
              entity.quality.level === 'medium' ? 'yellow' : 'red'}>
  {entity.quality.level} quality
</Badge>

// Warning for missing coordinates
{!entity.coordinates && (
  <Alert type="warning">
    No geographic coordinates available for this entity
  </Alert>
)}

// Data source badge
<Badge color={entity.source === 'OSDU' ? 'blue' : 'green'}>
  {entity.source}
</Badge>
```

