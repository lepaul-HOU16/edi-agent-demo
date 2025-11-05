import type { Handler } from 'aws-lambda';

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

export const handler: Handler = async (event) => {
  console.log('🔍 OSDU Proxy: Received request');
  
  try {
    const { query, dataPartition = 'osdu', maxResults = 10 } = event.arguments as OSDUSearchRequest;
    
    // Validate inputs
    if (!query || query.trim().length === 0) {
      console.error('❌ OSDU Proxy: Empty query parameter');
      return JSON.stringify({
        error: 'Query parameter is required',
        answer: 'Please provide a search query.',
        recordCount: 0,
        records: []
      });
    }
    
    // Validate maxResults is within reasonable bounds
    if (maxResults < 1 || maxResults > 100) {
      console.error('❌ OSDU Proxy: Invalid maxResults parameter:', maxResults);
      return JSON.stringify({
        error: 'maxResults must be between 1 and 100',
        answer: 'Invalid search parameters. Please try again.',
        recordCount: 0,
        records: []
      });
    }
    
    // Get API configuration from environment
    const apiUrl = process.env.OSDU_API_URL;
    const apiKey = process.env.OSDU_API_KEY;
    
    if (!apiUrl || !apiKey) {
      console.error('❌ OSDU API configuration missing:', { 
        hasUrl: !!apiUrl, 
        hasKey: !!apiKey 
      });
      return JSON.stringify({
        error: 'OSDU API is not configured',
        answer: 'The OSDU search service is not currently available. Please contact your administrator.',
        recordCount: 0,
        records: []
      });
    }
    
    console.log('📤 Calling OSDU API:', { query, dataPartition, maxResults });
    
    // Call OSDU API with server-side API key and timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 50000); // 50 second timeout (within Lambda's 60s limit)
    
    let response;
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey // API key added server-side only
        },
        body: JSON.stringify({
          query,
          dataPartition,
          maxResults
        }),
        signal: controller.signal
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Handle network errors
      if (fetchError.name === 'AbortError') {
        console.error('❌ OSDU API timeout after 50 seconds');
        return JSON.stringify({
          error: 'Request timeout',
          answer: 'The OSDU search request timed out. Please try again with a more specific query.',
          recordCount: 0,
          records: []
        });
      }
      
      console.error('❌ OSDU API network error:', fetchError.message);
      return JSON.stringify({
        error: 'Network error',
        answer: 'Unable to reach OSDU service. Please check your connection and try again.',
        recordCount: 0,
        records: []
      });
    }
    
    clearTimeout(timeoutId);
    
    // Handle HTTP error responses with specific status codes
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OSDU API error:', response.status, errorText);
      
      let errorMessage = 'Unable to search OSDU data at this time.';
      let statusCode = 500;
      
      switch (response.status) {
        case 401:
          errorMessage = 'OSDU API authentication failed. Please contact your administrator.';
          statusCode = 401;
          break;
        case 403:
          errorMessage = 'Access to OSDU API is forbidden. Please verify your permissions.';
          statusCode = 403;
          break;
        case 404:
          errorMessage = 'OSDU API endpoint not found. Please contact your administrator.';
          statusCode = 404;
          break;
        case 429:
          errorMessage = 'Too many requests to OSDU API. Please wait a moment and try again.';
          statusCode = 429;
          break;
        case 500:
        case 502:
        case 503:
          errorMessage = 'OSDU service is temporarily unavailable. Please try again later.';
          statusCode = 503;
          break;
        default:
          errorMessage = `OSDU API error (${response.status}). Please try again.`;
          statusCode = response.status;
      }
      
      return JSON.stringify({
        error: `OSDU API request failed: ${response.status}`,
        answer: errorMessage,
        recordCount: 0,
        records: []
      });
    }
    
    // Parse and validate response
    let rawData: any;
    try {
      rawData = await response.json();
    } catch (parseError) {
      console.error('❌ Failed to parse OSDU API response:', parseError);
      return JSON.stringify({
        error: 'Invalid response from OSDU API',
        answer: 'Received invalid data from OSDU service. Please try again.',
        recordCount: 0,
        records: []
      });
    }
    
    console.log('📥 Raw OSDU API response structure:', {
      hasResponse: !!rawData.response,
      hasAnswer: !!rawData.answer,
      hasRecords: !!rawData.records,
      hasReasoningSteps: !!rawData.reasoningSteps,
      keys: Object.keys(rawData)
    });
    
    // Validate response structure
    if (!rawData || typeof rawData !== 'object') {
      console.error('❌ Invalid OSDU response structure:', rawData);
      return JSON.stringify({
        error: 'Invalid response structure',
        answer: 'Received unexpected data format from OSDU service.',
        recordCount: 0,
        records: []
      });
    }
    
    // Transform OSDU API response format to expected format
    // OSDU API returns: { response, sessionId, reasoningSteps, metadata }
    // We need: { answer, recordCount, records }
    let answer = '';
    let recordCount = 0;
    let records: any[] = [];
    
    // Extract answer from response field
    if (rawData.response) {
      answer = rawData.response;
    } else if (rawData.answer) {
      answer = rawData.answer;
    } else {
      answer = 'Search completed';
    }
    
    // Extract records from reasoningSteps tool results
    if (rawData.reasoningSteps && Array.isArray(rawData.reasoningSteps)) {
      for (const step of rawData.reasoningSteps) {
        if (step.type === 'tool_result' && step.result?.body?.records) {
          records = step.result.body.records;
          
          // Get metadata counts
          if (step.result.body.metadata) {
            recordCount = step.result.body.metadata.totalFound || 
                         step.result.body.metadata.returned || 
                         records.length;
          } else {
            recordCount = records.length;
          }
          break;
        }
      }
    }
    
    // If no records found in reasoningSteps, check top-level
    if (records.length === 0 && rawData.records && Array.isArray(rawData.records)) {
      records = rawData.records;
      recordCount = rawData.recordCount || records.length;
    }
    
    const validatedData: OSDUSearchResponse = {
      answer,
      recordCount,
      records
    };
    
    const stringifiedResponse = JSON.stringify(validatedData);
    
    console.log('✅ Transformed OSDU response:', { 
      recordCount: validatedData.recordCount,
      recordsLength: validatedData.records.length,
      answerLength: validatedData.answer.length,
      stringifiedLength: stringifiedResponse.length,
      stringifiedPreview: stringifiedResponse.substring(0, 200)
    });
    
    return stringifiedResponse;
    
  } catch (error) {
    console.error('❌ OSDU Proxy unexpected error:', error);
    
    // Sanitize error message to never expose API key or sensitive data
    let sanitizedMessage = 'An unexpected error occurred';
    if (error instanceof Error) {
      sanitizedMessage = error.message
        .replace(/[a-zA-Z0-9]{40,}/g, '[REDACTED]') // Remove potential API keys
        .replace(/https?:\/\/[^\s]+/g, '[URL]') // Remove URLs
        .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]'); // Remove IP addresses
    }
    
    return JSON.stringify({
      error: sanitizedMessage,
      answer: 'An unexpected error occurred while searching OSDU data. Please try again later.',
      recordCount: 0,
      records: []
    });
  }
};
