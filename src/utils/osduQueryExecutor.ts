/**
 * OSDU Query Executor
 * 
 * Executes structured OSDU queries directly against the OSDU API
 * without AI agent processing for instant, deterministic results.
 * 
 * Requirements: 4.1, 4.2, 4.3
 */

import { searchOSDU } from '../lib/api/osdu';
import { QueryBuilderAnalytics } from './queryBuilderAnalytics';

export interface QueryExecutionResult {
  success: boolean;
  answer: string;
  recordCount: number;
  records: any[];
  query: string;
  executionTime: number;
  error?: string;
}

/**
 * Execute a structured OSDU query directly against the OSDU API
 * Bypasses AI agent processing for instant results
 * 
 * @param query - Formatted OSDU query string
 * @param dataPartition - OSDU data partition (default: 'osdu')
 * @param maxResults - Maximum number of results to return (default: 100)
 * @param dataType - Data type being queried (for analytics)
 * @param criteriaCount - Number of criteria in query (for analytics)
 * @param templateUsed - Template ID if template was used (for analytics)
 * @returns Query execution result with records and metadata
 */
export async function executeOSDUQuery(
  query: string,
  dataPartition: string = 'osdu',
  maxResults: number = 1000,
  dataType?: string,
  criteriaCount?: number,
  templateUsed?: string
): Promise<QueryExecutionResult> {
  const startTime = performance.now();
  
  console.log('🔧 Executing OSDU query:', {
    query,
    dataPartition,
    maxResults,
    timestamp: new Date().toISOString()
  });

  try {
    // Call OSDU REST API directly with structured query
    // This bypasses AI agent processing for instant results
    const osduData = await searchOSDU({
      query,
      dataPartition,
      maxResults
    });

    const executionTime = performance.now() - startTime;

    console.log('✅ OSDU query executed successfully:', {
      executionTime: `${executionTime.toFixed(2)}ms`,
      recordCount: osduData.recordCount
    });

    // Extract records and metadata
    const records = osduData.records || [];
    const recordCount = osduData.recordCount || records.length;
    const answer = osduData.answer || `Found ${recordCount} records matching your query`;

    console.log('✅ Query execution complete:', {
      recordCount,
      executionTime: `${executionTime.toFixed(2)}ms`,
      hasRecords: records.length > 0
    });

    // Track successful query execution metrics
    if (dataType && criteriaCount !== undefined) {
      QueryBuilderAnalytics.trackQueryExecution(
        query,
        dataType,
        criteriaCount,
        executionTime,
        recordCount,
        true, // success
        templateUsed
      );
    }

    return {
      success: true,
      answer,
      recordCount,
      records,
      query,
      executionTime
    };

  } catch (error) {
    const executionTime = performance.now() - startTime;
    
    console.error('❌ Query execution failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Track failed query execution metrics
    if (dataType && criteriaCount !== undefined) {
      QueryBuilderAnalytics.trackQueryExecution(
        query,
        dataType,
        criteriaCount,
        executionTime,
        0, // resultCount
        false, // success
        templateUsed,
        'execution_error',
        errorMessage
      );
    }
    
    return {
      success: false,
      answer: `Query execution failed: ${errorMessage}`,
      recordCount: 0,
      records: [],
      query,
      executionTime,
      error: errorMessage
    };
  }
}

/**
 * Convert OSDU records to well data format for display
 * 
 * @param osduRecords - Raw OSDU records from API
 * @returns Formatted well data for UI display
 */
export function convertOSDUToWellData(osduRecords: any[]): any[] {
  return osduRecords.map((osduRecord, index) => {
    // Extract coordinates from various possible OSDU structures
    let latitude = null;
    let longitude = null;
    
    // Try different coordinate field patterns
    if (osduRecord.location?.lat && osduRecord.location?.lon) {
      latitude = osduRecord.location.lat;
      longitude = osduRecord.location.lon;
    } else if (osduRecord.data?.SpatialLocation?.coordinates) {
      [longitude, latitude] = osduRecord.data.SpatialLocation.coordinates;
    } else if (osduRecord.data?.location?.coordinates) {
      [longitude, latitude] = osduRecord.data.location.coordinates;
    } else if (osduRecord.data?.location?.lat && osduRecord.data?.location?.lon) {
      latitude = osduRecord.data.location.lat;
      longitude = osduRecord.data.location.lon;
    } else if (osduRecord.coordinates) {
      [longitude, latitude] = osduRecord.coordinates;
    } else if (osduRecord.latitude && osduRecord.longitude) {
      latitude = osduRecord.latitude;
      longitude = osduRecord.longitude;
    }
    
    // Build well data object compatible with catalog format
    return {
      id: osduRecord.recordId || osduRecord.osduRecordId || osduRecord.id || `osdu-${index}`,
      name: osduRecord.WellName || osduRecord.name || osduRecord.Name || `OSDU-${index}`,
      type: osduRecord.recordType || osduRecord.kind || osduRecord.type || 'OSDU Record',
      location: osduRecord.field || osduRecord.location?.region || osduRecord.location || 'Unknown',
      operator: osduRecord.company || osduRecord.operator || 'Unknown',
      status: osduRecord.complianceStatus || osduRecord.status || 'Unknown',
      depth: osduRecord.TopDepth && osduRecord.BottomDepth 
        ? `${osduRecord.TopDepth}-${osduRecord.BottomDepth}m`
        : osduRecord.depth || 'Unknown',
      latitude,
      longitude,
      // Additional OSDU-specific fields
      basin: osduRecord.basin,
      country: osduRecord.country,
      logType: osduRecord.LogType,
      // Mark as OSDU source for tracking
      dataSource: 'OSDU',
      osduId: osduRecord.recordId || osduRecord.osduRecordId,
      // Preserve original OSDU data for reference
      _osduOriginal: osduRecord
    };
  });
}
