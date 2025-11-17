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
      
      if (!apiUrl || !apiKey) {
        console.error('❌ OSDU API configuration missing');
        return {
          statusCode: 503,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'OSDU API is not configured',
            answer: 'The OSDU search service is not currently available.',
            recordCount: 0,
            records: []
          }),
        };
      }
      
      // Call OSDU API using the correct format
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 50000);
      
      console.log('📤 Calling OSDU API with maxResults:', maxResults);
      
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
