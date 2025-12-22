/**
 * Knowledge Graph Builder
 * 
 * Transforms LAS file metadata into graph nodes and discovers relationships.
 * Handles duplicate detection and quality scoring for S&P Global/TGS well data.
 */

import { LASFileMetadata } from './lasDataLoader';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

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
}

export interface GraphLink {
  source: string;
  target: string;
  type: 'correlation' | 'hierarchy' | 'event-link' | 'duplicate';
  label: string;
  similarityScore?: number; // For duplicate links (0-100)
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

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  metadata: GraphMetadata;
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

// ============================================================================
// MAIN GRAPH BUILDER
// ============================================================================

/**
 * Build knowledge graph from LAS file metadata
 * Handles errors gracefully and returns partial results if possible
 */
export async function buildKnowledgeGraph(
  lasFiles: LASFileMetadata[]
): Promise<KnowledgeGraphData> {
  try {
    // Filter out files with errors
    const validFiles = lasFiles.filter(f => !f.error);
    const errorFiles = lasFiles.filter(f => f.error);
    
    if (errorFiles.length > 0) {
      console.warn(`⚠️ Skipping ${errorFiles.length} files with errors:`, 
        errorFiles.map(f => `${f.filename}: ${f.error}`));
    }
    
    if (validFiles.length === 0) {
      console.error('❌ No valid LAS files to build graph from');
      throw new Error('No valid LAS files found. All files failed to load or parse.');
    }
    
    console.log(`✅ Building graph from ${validFiles.length} valid LAS files`);
    
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // 1. Create well nodes from LAS files
    for (const lasFile of validFiles) {
      try {
        const wellNode = createWellNode(lasFile);
        nodes.push(wellNode);
      } catch (err) {
        console.error(`Error creating node for ${lasFile.filename}:`, err);
        // Continue with other files
      }
    }
    
    if (nodes.length === 0) {
      throw new Error('Failed to create any valid nodes from LAS files');
    }

    // 2. Discover relationships between wells
    try {
      console.log(`🔗 Discovering relationships between ${nodes.length} nodes...`);
      console.log(`📊 Sample node data for relationship discovery:`, {
        node1: nodes[0] ? {
          name: nodes[0].name,
          operator: nodes[0].data.operator,
          depth: nodes[0].data.depth,
          curves: nodes[0].data.curves,
          hasCoords: !!(nodes[0].lat && nodes[0].lng)
        } : 'No nodes',
        node2: nodes[1] ? {
          name: nodes[1].name,
          operator: nodes[1].data.operator,
          depth: nodes[1].data.depth,
          curves: nodes[1].data.curves,
          hasCoords: !!(nodes[1].lat && nodes[1].lng)
        } : 'Only one node'
      });
      
      let relationshipCount = 0;
      
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          try {
            const relationship = discoverWellRelationship(nodes[i], nodes[j]);
            if (relationship) {
              links.push(relationship);
              relationshipCount++;
            }
          } catch (err) {
            console.error(`Error discovering relationship between ${nodes[i].id} and ${nodes[j].id}:`, err);
            // Continue with other relationships
          }
        }
      }
      
      console.log(`✅ Found ${relationshipCount} relationships`);
      
      if (relationshipCount === 0) {
        console.warn(`⚠️ No relationships found! Checking criteria:`, {
          totalNodes: nodes.length,
          uniqueOperators: [...new Set(nodes.map(n => n.data.operator))],
          nodesWithCoords: nodes.filter(n => n.lat && n.lng).length,
          sampleDepthRanges: nodes.slice(0, 3).map(n => n.data.depth),
          sampleCurveCounts: nodes.slice(0, 3).map(n => n.data.curves.length)
        });
      }
    } catch (err) {
      console.error('Error in relationship discovery:', err);
      // Continue without relationships
    }

    // 3. Identify potential duplicates
    try {
      const duplicates = findDuplicateWells(nodes);
      duplicates.forEach(({ nodes: [node1, node2], similarity }) => {
        links.push({
          source: node1.id,
          target: node2.id,
          type: 'duplicate',
          label: 'Possible Duplicate',
          similarityScore: Math.round(similarity * 100) // Convert to percentage
        });
      });
    } catch (err) {
      console.error('Error in duplicate detection:', err);
      // Continue without duplicate detection
    }

    // 4. Calculate metadata
    const metadata = calculateGraphMetadata(nodes, links);

    console.log(`✅ Graph built successfully: ${nodes.length} nodes, ${links.length} links`);
    
    return { nodes, links, metadata };
  } catch (err) {
    console.error('❌ Fatal error building knowledge graph:', err);
    throw err;
  }
}

// ============================================================================
// NODE CREATION
// ============================================================================

/**
 * Create a well node from LAS file metadata
 */
function createWellNode(lasFile: LASFileMetadata): GraphNode {
  const wellName = extractWellName(lasFile);
  const qualityScore = calculateLASQualityScore(lasFile);
  const qualityLevel = getQualityLevel(qualityScore);
  const lat = extractLatitudeFromLAS(lasFile);
  const lng = extractLongitudeFromLAS(lasFile);

  console.log(`📍 Creating node for ${wellName}:`, {
    filename: lasFile.filename,
    lat,
    lng,
    hasCoordinates: lat !== undefined && lng !== undefined
  });

  const node: GraphNode = {
    id: lasFile.filename.replace('.las', ''),
    type: 'well',
    name: wellName,
    lat,
    lng,
    data: {
      filename: lasFile.filename,
      curves: lasFile.curves,
      dataPoints: lasFile.dataPoints,
      operator: extractOperator(lasFile),
      depth: extractDepthRange(lasFile),
      location: extractLocation(lasFile),
      dataSource: 'S&P Global / TGS'
    },
    qualityScore,
    qualityLevel,
    sourceDocs: [{
      title: lasFile.filename,
      type: 'LAS',
      date: lasFile.lastModified || 'Unknown',
      size: formatFileSize(lasFile.size),
      url: `s3://bucket/global/well-data/${lasFile.filename}`
    }],
    lineage: createLineage(lasFile),
    quality: createQualityMetrics(lasFile, qualityScore, qualityLevel)
  };

  return node;
}

/**
 * Extract well name from LAS file
 */
function extractWellName(lasFile: LASFileMetadata): string {
  return lasFile.wellName;
}

/**
 * Extract operator from LAS file
 */
function extractOperator(lasFile: LASFileMetadata): string {
  return lasFile.operator;
}

/**
 * Extract depth range from LAS file
 */
function extractDepthRange(lasFile: LASFileMetadata): string {
  return lasFile.depthRange;
}

/**
 * Extract location from LAS file
 */
function extractLocation(lasFile: LASFileMetadata): string {
  return lasFile.location;
}

/**
 * Extract latitude from LAS file
 */
function extractLatitudeFromLAS(lasFile: LASFileMetadata): number | undefined {
  return lasFile.latitude;
}

/**
 * Extract longitude from LAS file
 */
function extractLongitudeFromLAS(lasFile: LASFileMetadata): number | undefined {
  return lasFile.longitude;
}

/**
 * Format file size for display
 */
function formatFileSize(size?: number): string {
  if (!size) return 'Unknown';
  
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Create lineage information for a well
 */
function createLineage(lasFile: LASFileMetadata): LineageStep[] {
  return [
    {
      step: '1',
      source: 'S3 Storage',
      timestamp: lasFile.lastModified || new Date().toISOString(),
      transform: 'LAS file uploaded to S3',
      docRef: lasFile.filename,
      docType: 'LAS'
    },
    {
      step: '2',
      source: 'LAS Parser',
      timestamp: new Date().toISOString(),
      transform: 'Parsed LAS file metadata and curves',
      docRef: lasFile.filename,
      docType: 'LAS'
    },
    {
      step: '3',
      source: 'Knowledge Graph Builder',
      timestamp: new Date().toISOString(),
      transform: 'Transformed into graph node with quality assessment'
    }
  ];
}

// ============================================================================
// QUALITY SCORING
// ============================================================================

/**
 * Calculate quality score for LAS file (0-100)
 * 
 * Scoring breakdown:
 * - Curve completeness: 40 points (standard petrophysical curves)
 * - Data density: 30 points (number of data points)
 * - File size: 15 points (proxy for completeness)
 * - Curve count: 15 points (logging program comprehensiveness)
 */
function calculateLASQualityScore(lasFile: LASFileMetadata): number {
  let score = 100;

  // Curve completeness (40 points)
  // Standard petrophysical curves: GR, RHOB, NPHI, DT, RT, DEPT
  const standardCurves = ['GR', 'RHOB', 'NPHI', 'DT', 'RT', 'DEPT'];
  const presentCurves = standardCurves.filter(curve =>
    lasFile.curves.some(c => c.toUpperCase().includes(curve))
  );
  score -= (standardCurves.length - presentCurves.length) * 6.67; // ~40 points total

  // Data density (30 points)
  if (lasFile.dataPoints < 100) score -= 30;
  else if (lasFile.dataPoints < 500) score -= 20;
  else if (lasFile.dataPoints < 1000) score -= 10;

  // File size (15 points)
  if (lasFile.size && lasFile.size < 10000) score -= 15; // <10KB
  else if (lasFile.size && lasFile.size < 50000) score -= 10; // <50KB

  // Curve count (15 points)
  if (lasFile.curves.length < 3) score -= 15;
  else if (lasFile.curves.length < 5) score -= 10;
  else if (lasFile.curves.length < 8) score -= 5;

  return Math.max(0, Math.min(100, score));
}

/**
 * Get quality level from score
 */
function getQualityLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
}

/**
 * Create detailed quality metrics
 */
function createQualityMetrics(
  lasFile: LASFileMetadata,
  overallScore: number,
  level: 'high' | 'medium' | 'low'
): QualityMetrics {
  const metrics: QualityMetric[] = [];
  const issues: QualityIssue[] = [];

  // Standard curves check
  const standardCurves = ['GR', 'RHOB', 'NPHI', 'DT', 'RT', 'DEPT'];
  const presentCurves = standardCurves.filter(curve =>
    lasFile.curves.some(c => c.toUpperCase().includes(curve))
  );
  const missingCurves = standardCurves.filter(curve =>
    !lasFile.curves.some(c => c.toUpperCase().includes(curve))
  );

  metrics.push({
    name: 'Curve Completeness',
    status: presentCurves.length >= 5 ? 'pass' : presentCurves.length >= 3 ? 'warning' : 'fail',
    value: (presentCurves.length / standardCurves.length) * 100,
    detail: `${presentCurves.length}/${standardCurves.length} standard curves present`
  });

  if (missingCurves.length > 0) {
    issues.push({
      title: 'Missing Standard Curves',
      detail: `Missing: ${missingCurves.join(', ')}. These curves are essential for comprehensive petrophysical analysis.`
    });
  }

  // Data density check
  metrics.push({
    name: 'Data Density',
    status: lasFile.dataPoints >= 1000 ? 'pass' : lasFile.dataPoints >= 500 ? 'warning' : 'fail',
    value: Math.min(100, (lasFile.dataPoints / 1000) * 100),
    detail: `${lasFile.dataPoints} data points`
  });

  if (lasFile.dataPoints < 500) {
    issues.push({
      title: 'Sparse Data',
      detail: `Only ${lasFile.dataPoints} data points. More data points provide better analysis resolution.`
    });
  }

  // File size check
  const sizeOk = !lasFile.size || lasFile.size >= 50000;
  metrics.push({
    name: 'File Size',
    status: sizeOk ? 'pass' : 'warning',
    value: sizeOk ? 100 : 50,
    detail: formatFileSize(lasFile.size)
  });

  if (lasFile.size && lasFile.size < 10000) {
    issues.push({
      title: 'Suspiciously Small File',
      detail: `File size is only ${formatFileSize(lasFile.size)}. This may indicate incomplete data.`
    });
  }

  // Curve count check
  metrics.push({
    name: 'Logging Comprehensiveness',
    status: lasFile.curves.length >= 8 ? 'pass' : lasFile.curves.length >= 5 ? 'warning' : 'fail',
    value: Math.min(100, (lasFile.curves.length / 10) * 100),
    detail: `${lasFile.curves.length} curves logged`
  });

  if (lasFile.curves.length < 5) {
    issues.push({
      title: 'Limited Curve Set',
      detail: `Only ${lasFile.curves.length} curves available. More curves enable more comprehensive analysis.`
    });
  }

  const confidence =
    level === 'high' ? 'High confidence - Complete standard curves, good data density' :
    level === 'medium' ? 'Medium confidence - Some missing curves or lower data density' :
    'Low confidence - Missing critical curves or sparse data';

  return {
    overallScore,
    level,
    metrics,
    issues,
    confidence
  };
}

// ============================================================================
// RELATIONSHIP DISCOVERY
// ============================================================================

/**
 * Discover relationship between two wells
 */
function discoverWellRelationship(node1: GraphNode, node2: GraphNode): GraphLink | null {
  // Same operator = correlation
  if (node1.data.operator === node2.data.operator && node1.data.operator !== 'S&P Global / TGS' && node1.data.operator !== 'Unknown') {
    console.log(`🔗 Found relationship: ${node1.name} ↔ ${node2.name} (Same Operator: ${node1.data.operator})`);
    return {
      source: node1.id,
      target: node2.id,
      type: 'correlation',
      label: 'Same Operator'
    };
  }

  // Similar depth ranges = correlation (same formation)
  if (hasOverlappingDepth(node1, node2)) {
    console.log(`🔗 Found relationship: ${node1.name} ↔ ${node2.name} (Similar Depth)`);
    return {
      source: node1.id,
      target: node2.id,
      type: 'correlation',
      label: 'Similar Depth'
    };
  }

  // Similar curve sets = correlation (same logging program)
  if (hasSimilarCurves(node1, node2)) {
    console.log(`🔗 Found relationship: ${node1.name} ↔ ${node2.name} (Similar Logging)`);
    return {
      source: node1.id,
      target: node2.id,
      type: 'correlation',
      label: 'Similar Logging'
    };
  }

  // Geographic proximity = correlation
  if (isGeographicallyClose(node1, node2)) {
    const distance = calculateDistance(node1.lat!, node1.lng!, node2.lat!, node2.lng!);
    console.log(`🔗 Found relationship: ${node1.name} ↔ ${node2.name} (${distance.toFixed(1)}km apart)`);
    return {
      source: node1.id,
      target: node2.id,
      type: 'correlation',
      label: `${distance.toFixed(1)}km apart`
    };
  }

  return null;
}

/**
 * Check if depth ranges overlap
 */
function hasOverlappingDepth(node1: GraphNode, node2: GraphNode): boolean {
  const depth1 = parseDepthRange(node1.data.depth);
  const depth2 = parseDepthRange(node2.data.depth);

  if (!depth1 || !depth2) return false;

  return depth1.start <= depth2.stop && depth1.stop >= depth2.start;
}

/**
 * Parse depth range string
 */
function parseDepthRange(depthStr: string): { start: number; stop: number } | null {
  const match = depthStr.match(/(\d+\.?\d*)m?\s*-\s*(\d+\.?\d*)m?/);
  if (!match) return null;

  return {
    start: parseFloat(match[1]),
    stop: parseFloat(match[2])
  };
}

/**
 * Check if wells have similar curve sets (>70% overlap)
 */
function hasSimilarCurves(node1: GraphNode, node2: GraphNode): boolean {
  const curves1 = new Set(node1.data.curves);
  const curves2 = new Set(node2.data.curves);

  const intersection = new Set([...curves1].filter(c => curves2.has(c)));
  const union = new Set([...curves1, ...curves2]);

  const similarity = intersection.size / union.size;
  return similarity > 0.7;
}

/**
 * Check if wells are geographically close (<10km)
 */
function isGeographicallyClose(node1: GraphNode, node2: GraphNode): boolean {
  if (!node1.lat || !node1.lng || !node2.lat || !node2.lng) return false;

  const distance = calculateDistance(node1.lat, node1.lng, node2.lat, node2.lng);
  return distance < 10; // 10km threshold
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ============================================================================
// DUPLICATE DETECTION
// ============================================================================

/**
 * Find potential duplicate wells
 */
function findDuplicateWells(nodes: GraphNode[]): Array<{ nodes: [GraphNode, GraphNode]; similarity: number }> {
  const duplicates: Array<{ nodes: [GraphNode, GraphNode]; similarity: number }> = [];

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const similarity = calculateWellSimilarity(nodes[i], nodes[j]);
      if (similarity > 0.8) {
        // 80% similarity threshold
        duplicates.push({ nodes: [nodes[i], nodes[j]], similarity });
      }
    }
  }

  return duplicates;
}

/**
 * Calculate similarity between two wells
 */
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
    const locationSim = distance < 1 ? 1 : distance < 5 ? 0.5 : 0; // <1km = same, <5km = similar
    score += locationSim * 0.3;
    factors += 0.3;
  }

  // Curve similarity (20% weight)
  const curveSim = calculateCurveSimilarity(node1.data.curves, node2.data.curves);
  score += curveSim * 0.2;
  factors += 0.2;

  // Data points similarity (10% weight)
  const dpSim =
    1 -
    Math.abs(node1.data.dataPoints - node2.data.dataPoints) /
      Math.max(node1.data.dataPoints, node2.data.dataPoints);
  score += dpSim * 0.1;
  factors += 0.1;

  return factors > 0 ? score / factors : 0;
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
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

/**
 * Calculate curve similarity (Jaccard index)
 */
function calculateCurveSimilarity(curves1: string[], curves2: string[]): number {
  const set1 = new Set(curves1);
  const set2 = new Set(curves2);

  const intersection = new Set([...set1].filter(c => set2.has(c)));
  const union = new Set([...set1, ...set2]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

// ============================================================================
// METADATA CALCULATION
// ============================================================================

/**
 * Calculate graph metadata
 */
function calculateGraphMetadata(nodes: GraphNode[], links: GraphLink[]): GraphMetadata {
  const nodeTypeCounts: Record<string, number> = {};
  const linkTypeCounts: Record<string, number> = {};
  const qualityDistribution = { high: 0, medium: 0, low: 0 };

  // Count node types
  nodes.forEach(node => {
    nodeTypeCounts[node.type] = (nodeTypeCounts[node.type] || 0) + 1;
    
    if (node.qualityLevel) {
      qualityDistribution[node.qualityLevel]++;
    }
  });

  // Count link types
  links.forEach(link => {
    linkTypeCounts[link.type] = (linkTypeCounts[link.type] || 0) + 1;
  });

  // Count duplicates
  const duplicatesFound = linkTypeCounts['duplicate'] || 0;

  // Get unique data sources
  const dataSources = [...new Set(nodes.map(n => n.data.dataSource))];

  return {
    totalNodes: nodes.length,
    totalLinks: links.length,
    duplicatesFound,
    dataSources,
    nodeTypeCounts,
    linkTypeCounts,
    qualityDistribution
  };
}
