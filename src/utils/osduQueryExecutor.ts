/**
 * OSDU Query Executor
 * 
 * Executes structured OSDU queries directly against the OSDU API
 * without AI agent processing for instant, deterministic results.
 * 
 * Requirements: 4.1, 4.2, 4.3
 */

import { generateClient } from "aws-amplify/data";
import { type Schema } from "@/../amplify/data/resource";
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
    // Create Amplify client
    const amplifyClient = generateClient<Schema>();

    // Call OSDU API directly with structured query
    // This bypasses AI agent processing for instant results
    const osduResponse = await amplifyClient.queries.osduSearch({
      query,
      dataPartition,
      maxResults
    });

    const executionTime = performance.now() - startTime;

    console.log('✅ OSDU query executed successfully:', {
      executionTime: `${executionTime.toFixed(2)}ms`,
      hasData: !!osduResponse.data,
      hasErrors: !!osduResponse.errors
    });

    // Handle GraphQL errors
    if (osduResponse.errors && osduResponse.errors.length > 0) {
      console.error('❌ GraphQL errors:', osduResponse.errors);
      const errorMessage = osduResponse.errors[0].message || 'GraphQL query failed';
      
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

    if (!osduResponse.data) {
      console.error('❌ No data in OSDU response');
      
      return {
        success: false,
        answer: 'No data received from OSDU API',
        recordCount: 0,
        records: [],
        query,
        executionTime,
        error: 'No data received from OSDU API'
      };
    }

    // Parse response data (handle potential double-stringification)
    let osduData;
    try {
      let parsedData = osduResponse.data;
      
      // First parse if it's a string
      if (typeof parsedData === 'string') {
        parsedData = JSON.parse(parsedData);
        console.log('📊 First parse complete, type:', typeof parsedData);
      }
      
      // Check if it's still a string (double-stringified)
      if (typeof parsedData === 'string') {
        parsedData = JSON.parse(parsedData);
        console.log('📊 Second parse complete (was double-stringified)');
      }
      
      osduData = parsedData;
      
      console.log('📊 Parsed OSDU data:', {
        type: typeof osduData,
        hasAnswer: !!osduData?.answer,
        recordCount: osduData?.recordCount,
        recordsLength: osduData?.records?.length
      });
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      
      return {
        success: false,
        answer: 'Failed to parse OSDU response',
        recordCount: 0,
        records: [],
        query,
        executionTime,
        error: `Parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`
      };
    }

    // Check if this is an error response from Lambda
    if (osduData.error) {
      console.error('❌ OSDU Lambda error:', osduData.error);
      
      return {
        success: false,
        answer: `OSDU API error: ${osduData.error}`,
        recordCount: 0,
        records: [],
        query,
        executionTime,
        error: osduData.error
      };
    }

    // Validate response has required fields
    if (typeof osduData !== 'object' || osduData === null) {
      console.error('❌ Invalid OSDU response type:', typeof osduData);
      
      return {
        success: false,
        answer: 'Invalid response format from OSDU API',
        recordCount: 0,
        records: [],
        query,
        executionTime,
        error: 'Invalid response format'
      };
    }

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
