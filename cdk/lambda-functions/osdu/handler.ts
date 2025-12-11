import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { parseNaturalLanguageQuery, applyFilters, ParsedQuery } from '../shared/nlpParser';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

interface OSDUSearchRequest {
  query: string;
  dataPartition?: string;
  maxResults?: number;
}

interface OSDUSearchResponse {
  answer: string;
  recordCount: number;
  records: Array<any>;
}

interface OSDUCredentials {
  apiUrl: string;
  apiKey: string;
}

// Global credentials cache for Lambda reuse
let credentialsCache: OSDUCredentials | null = null;

/**
 * Get OSDU API credentials from AWS Secrets Manager
 */
async function getOSDUCredentials(): Promise<OSDUCredentials> {
  // Return cached credentials if available
  if (credentialsCache) {
    console.log('✅ Using cached OSDU credentials');
    return credentialsCache;
  }

  console.log('🔐 Fetching OSDU credentials from Secrets Manager');
  
  const secretsClient = new SecretsManagerClient({});
  const command = new GetSecretValueCommand({
    SecretId: 'osdu-credentials'
  });

  try {
    const response = await secretsClient.send(command);
    const secretString = response.SecretString;
    
    if (!secretString) {
      throw new Error('Secret value is empty');
    }

    const credentials = JSON.parse(secretString);
    
    // Validate required fields
    if (!credentials.apiUrl || !credentials.apiKey) {
      throw new Error('Missing required credential fields (apiUrl, apiKey)');
    }

    // Cache credentials
    credentialsCache = credentials;
    console.log('✅ OSDU credentials loaded successfully');
    
    return credentials;
  } catch (error) {
    console.error('❌ Failed to load OSDU credentials:', error);
    throw new Error('Unable to load OSDU credentials from Secrets Manager');
  }
}

/**
 * Filter demo data using shared NLP parser (fallback for when OSDU not configured)
 */
function filterDemoData(records: any[], filters: ParsedQuery): any[] {
  console.log('🔍 Filtering OSDU data with shared parser');
  console.log('📊 Input records:', records.length);
  console.log('🎯 Filters:', filters);
  
  // Use shared parser's applyFilters function
  const filtered = applyFilters(records, filters, {
    location: (record) => record.location || '',
    operator: (record) => record.operator || '',
    wellName: (record) => record.name || '',
    depth: (record) => {
      const depthStr = record.depth || '0m';
      const depthMatch = depthStr.match(/(\d+(?:\.\d+)?)/);
      return depthMatch ? parseFloat(depthMatch[1]) : 0;
    }
  });
  
  console.log('✅ Filtered OSDU data:', filtered.length, 'records match criteria');
  return filtered;
}

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  console.log('🔍 OSDU REST API Handler:', JSON.stringify(event, null, 2));
  
  const path = event.requestContext.http.path;
  const method = event.requestContext.http.method;
  
  try {
    // POST /api/osdu/search
    if (path === '/api/osdu/search' && method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { query, dataPartition = 'osdu', maxResults = 1000 } = body as OSDUSearchRequest;
      
      console.log('🔍 OSDU Search:', { query, dataPartition, maxResults });
      
      // Validate inputs
      if (!query || query.trim().length === 0) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Query parameter is required',
            answer: 'Please provide a search query.',
            recordCount: 0,
            records: []
          }),
        };
      }
      
      if (maxResults < 1 || maxResults > 10000) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'maxResults must be between 1 and 10000',
            answer: 'Invalid search parameters.',
            recordCount: 0,
            records: []
          }),
        };
      }
      
      // Try to call real OSDU API
      let useRealAPI = false;
      let credentials: OSDUCredentials | null = null;

      try {
        credentials = await getOSDUCredentials();
        useRealAPI = true;
        console.log('✅ Real OSDU API available');
      } catch (error) {
        console.log('⚠️ OSDU API not configured, falling back to demo data:', error.message);
      }

      // Use real OSDU API if available
      if (useRealAPI && credentials) {
        console.log('🔍 Calling real OSDU API - fetching first page to determine total');

        try {
          // First, fetch page 1 to get total count
          const firstResponse = await fetch(credentials.apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': credentials.apiKey
            },
            body: JSON.stringify({
              query: query,
              dataPartition: dataPartition,
              maxResults: 100, // Request max per page
              offset: 0
            })
          });

          if (!firstResponse.ok) {
            throw new Error(`OSDU API returned ${firstResponse.status}`);
          }

          const firstData = await firstResponse.json();
          console.log('🔍 Raw OSDU API response (first page):', JSON.stringify(firstData).substring(0, 500));
          
          // Extract first page wells and total count
          let allWells: any[] = [];
          let totalFound = 0;
          
          if (firstData.reasoningSteps && Array.isArray(firstData.reasoningSteps)) {
            for (const step of firstData.reasoningSteps) {
              if (step.type === 'tool_result' && step.tool === 'searchWells' && step.result?.body?.records) {
                allWells = step.result.body.records;
                totalFound = step.result.body.metadata?.totalFound || allWells.length;
                console.log(`✅ First page: ${allWells.length} wells (total available: ${totalFound})`);
                break;
              }
            }
          }
          
          const wells = allWells.slice(0, Math.min(allWells.length, maxResults));
          
          console.log(`✅ Returning ${wells.length} wells (total available: ${totalFound})`);
          
          // Transform OSDU records to frontend format
          const transformedWells = wells.map((record: any) => ({
            id: record.recordId || record.osduRecordId || 'unknown',
            name: record.name || record.WellName || record.Name || 'Unnamed',
            type: record.kind || record.recordType || 'unknown',
            operator: record.company || 'Unknown',
            location: record.field || record.basin || record.location?.region || 'Unknown',
            basin: record.basin || 'Unknown',
            country: record.country || 'Unknown',
            depth: record.BottomDepth ? `${record.BottomDepth}ft` : 'Unknown',
            status: record.complianceStatus || 'Unknown',
            dataSource: 'OSDU',
            latitude: record.location?.lat || null,
            longitude: record.location?.lon || null
          }));
          
          console.log('✅ Real OSDU search successful:', transformedWells.length, 'wells transformed');
          console.log('📍 Sample well:', transformedWells[0]);

          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              answer: data.response || `Found ${totalFound} wells in OSDU`,
              recordCount: totalFound,
              records: transformedWells
            }),
          };
        } catch (apiError) {
          console.error('❌ Real OSDU API error:', apiError);
          
          // Return error response
          return {
            statusCode: 502,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error: 'OSDU API error',
              answer: 'Unable to search OSDU data. Please check credentials and try again.',
              recordCount: 0,
              records: []
            }),
          };
        }
      }

      // Fallback to demo data if OSDU not configured
      console.log('⚠️ Using demo data (OSDU not configured)');
      
      // Generate realistic demo OSDU data with proper geographic distribution
      const regions = [
        { name: 'Gulf of Mexico', basin: 'Permian Basin', country: 'USA', latBase: 28, lonBase: -90, spread: 3 },
        { name: 'North Sea', basin: 'North Sea Basin', country: 'Norway', latBase: 60, lonBase: 3, spread: 2 },
        { name: 'South China Sea', basin: 'Pearl River Basin', country: 'Vietnam', latBase: 10, lonBase: 107, spread: 2.5 },
        { name: 'Persian Gulf', basin: 'Zagros Basin', country: 'UAE', latBase: 25, lonBase: 53, spread: 2 },
        { name: 'Caspian Sea', basin: 'South Caspian Basin', country: 'Kazakhstan', latBase: 42, lonBase: 51, spread: 2 }
      ];
      
      const allDemoRecords = Array.from({ length: Math.min(maxResults, 50) }, (_, i) => {
        const region = regions[i % regions.length];
        const wellsInRegion = Math.floor(i / regions.length);
        
        return {
          id: `osdu-demo-${i + 1}`,
          name: `${region.country.substring(0, 3).toUpperCase()}-${String.fromCharCode(65 + (wellsInRegion % 26))}-${wellsInRegion + 1}`,
          type: 'osdu:wks:master-data--Wellbore:1.0.0',
          operator: ['Shell', 'BP', 'Chevron', 'ExxonMobil', 'TotalEnergies'][i % 5],
          location: region.name,
          basin: region.basin,
          country: region.country,
          depth: `${2000 + (i * 100)}m`,
          status: ['Active', 'Producing', 'Exploration', 'Development'][i % 4],
          dataSource: 'OSDU',
          latitude: region.latBase + (Math.random() - 0.5) * region.spread,
          longitude: region.lonBase + (Math.random() - 0.5) * region.spread
        };
      });
      
      // Parse query and apply filters
      const filterCriteria = parseNaturalLanguageQuery(query);
      const filteredRecords = filterDemoData(allDemoRecords, filterCriteria);
      
      console.log('🔍 Query parsing:', {
        query,
        criteria: filterCriteria,
        totalRecords: allDemoRecords.length,
        filteredRecords: filteredRecords.length
      });
      
      // Build answer message
      let answerParts = [`Found ${filteredRecords.length} wells`];
      if (filterCriteria.locations.length > 0) {
        answerParts.push(`in ${filterCriteria.locations.join(', ')}`);
      }
      if (filterCriteria.operators.length > 0) {
        answerParts.push(`operated by ${filterCriteria.operators.join(', ')}`);
      }
      if (filterCriteria.wellPrefixes.length > 0) {
        answerParts.push(`with prefix ${filterCriteria.wellPrefixes.join(', ')}`);
      }
      answerParts.push('(Demo Data)');
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer: answerParts.join(' '),
          recordCount: filteredRecords.length,
          records: filteredRecords
        }),
      };
    }
    
    // GET /api/osdu/wells/{id}
    if (path.startsWith('/api/osdu/wells/') && method === 'GET') {
      const wellId = path.split('/').pop();
      console.log('🔍 Get OSDU well:', wellId);
      
      // This would call OSDU API to get specific well data
      // For now, return a placeholder
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: wellId,
          message: 'Well detail endpoint - to be implemented'
        }),
      };
    }
    
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Not found' }),
    };
    
  } catch (error) {
    console.error('❌ OSDU API error:', error);
    
    // Sanitize error message
    let sanitizedMessage = 'An unexpected error occurred';
    if (error instanceof Error) {
      sanitizedMessage = error.message
        .replace(/[a-zA-Z0-9]{40,}/g, '[REDACTED]')
        .replace(/https?:\/\/[^\s]+/g, '[URL]')
        .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]');
    }
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: sanitizedMessage,
        answer: 'An unexpected error occurred while searching OSDU data.',
        recordCount: 0,
        records: []
      }),
    };
  }
};
