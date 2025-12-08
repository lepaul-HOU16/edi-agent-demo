import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

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

interface FilterCriteria {
  locations: string[];
  operators: string[];
  wellPrefixes: string[];
}

/**
 * Parse natural language query to extract filter criteria
 */
function parseNaturalLanguageQuery(query: string): FilterCriteria {
  const lowerQuery = query.toLowerCase();
  const criteria: FilterCriteria = {
    locations: [],
    operators: [],
    wellPrefixes: []
  };
  
  // Location keywords - check for variations
  const locationKeywords = [
    { name: 'north sea', patterns: ['north sea', 'northsea', 'north-sea'] },
    { name: 'gulf of mexico', patterns: ['gulf of mexico', 'gulf', 'gom', 'mexico'] },
    { name: 'south china sea', patterns: ['south china sea', 'south china', 'scs'] },
    { name: 'persian gulf', patterns: ['persian gulf', 'persian', 'arabian gulf'] },
    { name: 'caspian sea', patterns: ['caspian sea', 'caspian'] }
  ];
  
  for (const location of locationKeywords) {
    if (location.patterns.some(pattern => lowerQuery.includes(pattern))) {
      criteria.locations.push(location.name);
    }
  }
  
  // Operator keywords - check for company names with flexible matching
  const operatorKeywords = [
    { name: 'BP', patterns: ['bp', 'british petroleum'] },
    { name: 'Shell', patterns: ['shell', 'royal dutch shell'] },
    { name: 'Chevron', patterns: ['chevron'] },
    { name: 'ExxonMobil', patterns: ['exxonmobil', 'exxon', 'mobil'] },
    { name: 'TotalEnergies', patterns: ['totalenergies', 'total'] }
  ];
  
  for (const operator of operatorKeywords) {
    // Check if any pattern matches (case-insensitive)
    if (operator.patterns.some(pattern => lowerQuery.includes(pattern))) {
      criteria.operators.push(operator.name);
    }
  }
  
  // Well name prefixes - check for country codes
  const wellPrefixes = [
    { prefix: 'USA', patterns: ['usa', 'us ', 'united states', 'american'] },
    { prefix: 'NOR', patterns: ['nor', 'norway', 'norwegian'] },
    { prefix: 'VIE', patterns: ['vie', 'vietnam', 'vietnamese'] },
    { prefix: 'UAE', patterns: ['uae', 'emirates', 'dubai', 'abu dhabi'] },
    { prefix: 'KAZ', patterns: ['kaz', 'kazakhstan'] }
  ];
  
  for (const well of wellPrefixes) {
    if (well.patterns.some(pattern => lowerQuery.includes(pattern))) {
      criteria.wellPrefixes.push(well.prefix);
    }
  }
  
  return criteria;
}

/**
 * Filter demo data based on parsed criteria
 */
function filterDemoData(records: any[], criteria: FilterCriteria): any[] {
  if (criteria.locations.length === 0 && 
      criteria.operators.length === 0 && 
      criteria.wellPrefixes.length === 0) {
    return records; // No filters, return all
  }
  
  return records.filter(record => {
    // Location filter (case-insensitive substring match)
    if (criteria.locations.length > 0) {
      const recordLocation = (record.location || '').toLowerCase();
      const matchesLocation = criteria.locations.some(loc => 
        recordLocation.includes(loc.toLowerCase())
      );
      if (!matchesLocation) return false;
    }
    
    // Operator filter (exact match)
    if (criteria.operators.length > 0) {
      const matchesOperator = criteria.operators.includes(record.operator);
      if (!matchesOperator) return false;
    }
    
    // Well name prefix filter
    if (criteria.wellPrefixes.length > 0) {
      const recordName = record.name || '';
      const matchesPrefix = criteria.wellPrefixes.some(prefix => 
        recordName.startsWith(prefix)
      );
      if (!matchesPrefix) return false;
    }
    
    return true; // Passed all filters
  });
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
      
      // Get API configuration
      const apiUrl = process.env.OSDU_API_URL;
      const apiKey = process.env.OSDU_API_KEY;
      
      // If OSDU not configured, return demo data for testing
      if (!apiUrl || !apiKey || apiUrl.includes('example.com')) {
        console.log('⚠️ OSDU API not configured, returning demo data');
        
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
      
      // Call OSDU API using the correct format
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 50000);
      
      console.log('📤 Calling OSDU API with query:', query, 'maxResults:', maxResults);
      
      let response;
      try {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
          },
          body: JSON.stringify({
            toolName: 'searchWells',
            input: {
              query: query,
              maxResults: maxResults
            }
          }),
          signal: controller.signal
        });
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          return {
            statusCode: 504,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error: 'Request timeout',
              answer: 'The OSDU search request timed out.',
              recordCount: 0,
              records: []
            }),
          };
        }
        
        return {
          statusCode: 502,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Network error',
            answer: 'Unable to reach OSDU service.',
            recordCount: 0,
            records: []
          }),
        };
      }
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ OSDU API error:', response.status, errorText);
        
        return {
          statusCode: response.status,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: `OSDU API request failed: ${response.status}`,
            answer: 'Unable to search OSDU data at this time.',
            recordCount: 0,
            records: []
          }),
        };
      }
      
      // Parse response
      let rawData: any;
      try {
        rawData = await response.json();
      } catch (parseError) {
        return {
          statusCode: 502,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Invalid response from OSDU API',
            answer: 'Received invalid data from OSDU service.',
            recordCount: 0,
            records: []
          }),
        };
      }
      
      // Transform response - handle the new API format
      let answer = 'Search completed';
      let recordCount = 0;
      let records: any[] = [];
      
      // New API format: { statusCode, body: { records, metadata } }
      if (rawData.body && rawData.body.records) {
        records = rawData.body.records;
        const metadata = rawData.body.metadata || {};
        recordCount = metadata.totalFound || metadata.returned || records.length;
        answer = `Found ${recordCount} wells in OSDU`;
        
        console.log('📊 Extracted from new API format:', {
          recordsLength: records.length,
          totalFound: metadata.totalFound,
          returned: metadata.returned,
          filtered: metadata.filtered,
          authorized: metadata.authorized,
          finalRecordCount: recordCount
        });
      }
      // Fallback: old format with reasoningSteps
      else if (rawData.reasoningSteps && Array.isArray(rawData.reasoningSteps)) {
        for (const step of rawData.reasoningSteps) {
          if (step.type === 'tool_result' && step.result?.body?.records) {
            records = step.result.body.records;
            recordCount = step.result.body.metadata?.totalFound || 
                         step.result.body.metadata?.returned || 
                         records.length;
            
            console.log('📊 Extracted from reasoningSteps:', {
              recordsLength: records.length,
              totalFound: step.result.body.metadata?.totalFound,
              returned: step.result.body.metadata?.returned,
              finalRecordCount: recordCount
            });
            break;
          }
        }
      }
      // Fallback: top-level records
      else if (rawData.records) {
        records = rawData.records;
        recordCount = rawData.recordCount || records.length;
        
        console.log('📊 Extracted from top-level:', {
          recordsLength: records.length,
          recordCount: rawData.recordCount,
          finalRecordCount: recordCount
        });
      }
      
      const result: OSDUSearchResponse = {
        answer,
        recordCount,
        records
      };
      
      console.log('✅ OSDU search successful:', { recordCount, recordsLength: records.length });
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
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
