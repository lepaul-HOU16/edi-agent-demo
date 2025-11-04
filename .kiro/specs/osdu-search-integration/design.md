# Design Document

## Overview

This design implements OSDU Search API integration into the existing Data Catalog with a security-first, minimal-change approach. The integration adds a new backend Lambda function to proxy OSDU API requests, keeping the API key secure on the server side, and extends the existing catalog search flow with intent detection to route queries appropriately.

**Key Design Principles:**
1. **Security First**: API key never exposed to frontend
2. **Minimal Changes**: Additive feature, no refactoring of existing code
3. **Graceful Degradation**: Falls back to catalog search if OSDU unavailable
4. **Consistent UX**: Uses existing chat components and message patterns

## Architecture

### High-Level Flow

```
User Query
    ↓
CatalogChatBoxCloudscape (Frontend)
    ↓
Intent Detection (Frontend)
    ↓
    ├─→ [OSDU Intent] → osduSearch GraphQL Query → OSDU Proxy Lambda → OSDU API
    │                                                                      ↓
    │                                                                   Response
    │                                                                      ↓
    └─→ [Catalog Intent] → catalogSearch GraphQL Query → Catalog Lambda
                                                              ↓
                                                           Response
                                                              ↓
                                                        Display in Chat
```

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Browser)                        │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  CatalogChatBoxCloudscape                          │    │
│  │  - User input handling                             │    │
│  │  - Message display                                 │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────┐    │
│  │  Intent Detection (New)                            │    │
│  │  - Detect "OSDU" keyword                           │    │
│  │  - Route to appropriate backend                    │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                          │
│         ┌─────────┴─────────┐                               │
│         │                   │                               │
└─────────┼───────────────────┼───────────────────────────────┘
          │                   │
          │                   │
┌─────────▼─────────┐  ┌──────▼──────────────────────────────┐
│  catalogSearch    │  │  osduSearch (New)                    │
│  GraphQL Query    │  │  GraphQL Query                       │
│  (Existing)       │  │  - Validates request                 │
└─────────┬─────────┘  │  - Calls OSDU Proxy Lambda           │
          │            └──────┬──────────────────────────────┘
          │                   │
┌─────────▼─────────┐  ┌──────▼──────────────────────────────┐
│  Catalog Lambda   │  │  OSDU Proxy Lambda (New)             │
│  (Existing)       │  │  - Adds API key from env var         │
│                   │  │  - Calls external OSDU API           │
│                   │  │  - Sanitizes responses               │
└───────────────────┘  └──────┬──────────────────────────────┘
                              │
                       ┌──────▼──────────────────────────────┐
                       │  External OSDU Search API            │
                       │  https://mye6os9wfa.execute-api...   │
                       └─────────────────────────────────────┘
```

## Components and Interfaces

### 1. Frontend Intent Detection

**Location**: `src/app/catalog/page.tsx` (within `handleChatSearch` function)

**Purpose**: Detect whether a query should go to OSDU or catalog search

**Implementation**:
```typescript
// Add to handleChatSearch function
const detectSearchIntent = (query: string): 'osdu' | 'catalog' => {
  const lowerQuery = query.toLowerCase().trim();
  
  // OSDU intent detection
  if (lowerQuery.includes('osdu')) {
    console.log('🔍 OSDU search intent detected');
    return 'osdu';
  }
  
  // Default to catalog
  console.log('🔍 Catalog search intent detected');
  return 'catalog';
};

const searchIntent = detectSearchIntent(prompt);
```

**Interface**:
- Input: User query string
- Output: 'osdu' | 'catalog'
- Side effects: Console logging for debugging

### 2. OSDU Search GraphQL Query

**Location**: `amplify/data/resource.ts`

**Purpose**: Define GraphQL query for OSDU search

**Schema Definition**:
```typescript
osduSearch: a.query()
  .arguments({ 
    query: a.string().required(),
    dataPartition: a.string(),
    maxResults: a.integer()
  })
  .returns(a.json())
  .handler(a.handler.function(osduProxyFunction))
  .authorization(allow => [allow.authenticated()])
```

**Interface**:
- Input:
  - `query`: string (required) - Natural language search query
  - `dataPartition`: string (optional, default: "osdu") - OSDU data partition
  - `maxResults`: integer (optional, default: 10) - Maximum results to return
- Output: JSON object with structure:
  ```typescript
  {
    answer: string;        // AI-generated response
    recordCount: number;   // Number of records found
    records: Array<any>;   // Array of OSDU records
  }
  ```

### 3. OSDU Proxy Lambda Function

**Location**: `amplify/functions/osduProxy/`

**Purpose**: Securely proxy requests to OSDU API with server-side API key

**File Structure**:
```
amplify/functions/osduProxy/
├── resource.ts          # Lambda definition
└── handler.ts           # Request handler
```

**resource.ts**:
```typescript
import { defineFunction } from '@aws-amplify/backend';

export const osduProxyFunction = defineFunction({
  name: 'osduProxy',
  entry: './handler.ts',
  timeoutSeconds: 30,
  environment: {
    OSDU_API_URL: 'https://mye6os9wfa.execute-api.us-east-1.amazonaws.com/prod/search',
    OSDU_API_KEY: process.env.OSDU_API_KEY || '' // Set in deployment
  }
});
```

**handler.ts**:
```typescript
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
      throw new Error('Query parameter is required');
    }
    
    // Get API configuration from environment
    const apiUrl = process.env.OSDU_API_URL;
    const apiKey = process.env.OSDU_API_KEY;
    
    if (!apiUrl || !apiKey) {
      console.error('❌ OSDU API configuration missing');
      throw new Error('OSDU API is not configured');
    }
    
    console.log('📤 Calling OSDU API:', { query, dataPartition, maxResults });
    
    // Call OSDU API with server-side API key
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey // API key added server-side only
      },
      body: JSON.stringify({
        query,
        dataPartition,
        maxResults
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OSDU API error:', response.status, errorText);
      throw new Error(`OSDU API request failed: ${response.status}`);
    }
    
    const data: OSDUSearchResponse = await response.json();
    console.log('✅ OSDU API response:', { recordCount: data.recordCount });
    
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
    
  } catch (error) {
    console.error('❌ OSDU Proxy error:', error);
    
    // Sanitize error message to never expose API key
    const sanitizedMessage = error instanceof Error 
      ? error.message.replace(/[a-zA-Z0-9]{40,}/g, '[REDACTED]')
      : 'Unknown error occurred';
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: sanitizedMessage,
        answer: 'Unable to search OSDU data at this time. Please try again later.',
        recordCount: 0,
        records: []
      })
    };
  }
};
```

**Security Features**:
- API key stored in Lambda environment variable only
- API key never logged or exposed in responses
- Error messages sanitized to remove any potential key leakage
- 30-second timeout to prevent hanging requests

### 4. Frontend Query Execution

**Location**: `src/app/catalog/page.tsx` (within `handleChatSearch` function)

**Purpose**: Execute appropriate search based on intent

**Implementation**:
```typescript
// In handleChatSearch function, after intent detection
if (searchIntent === 'osdu') {
  console.log('🔍 Executing OSDU search');
  
  const osduResponse = await amplifyClient.queries.osduSearch({
    query: prompt,
    dataPartition: 'osdu',
    maxResults: 10
  });
  
  if (osduResponse.data) {
    const osduData = typeof osduResponse.data === 'string' 
      ? JSON.parse(osduResponse.data) 
      : osduResponse.data;
    
    // Create message with OSDU results
    const osduMessage: Message = {
      id: uuidv4() as any,
      role: "ai" as any,
      content: {
        text: `**🔍 OSDU Search Results**\n\n${osduData.answer}\n\n**Found ${osduData.recordCount} records**\n\n${osduData.records.length > 0 ? '**Records:**\n\n```json-table-data\n' + JSON.stringify(osduData.records.slice(0, 5).map((r: any, i: number) => ({
          id: `osdu-${i}`,
          name: r.name || r.id || 'Unknown',
          type: r.type || 'OSDU Record',
          ...r
        })), null, 2) + '\n```' : ''}`
      } as any,
      responseComplete: true as any,
      createdAt: new Date().toISOString() as any,
      chatSessionId: '' as any,
      owner: '' as any
    } as any;
    
    setTimeout(() => {
      setMessages(prevMessages => [...prevMessages, osduMessage]);
    }, 0);
  }
} else {
  // Existing catalog search logic (unchanged)
  const searchResponse = await amplifyClient.queries.catalogSearch({
    prompt: prompt,
    existingContext: searchContextForBackend ? JSON.stringify(searchContextForBackend) : null
  });
  
  // ... existing catalog search handling ...
}
```

### 5. Backend Registration

**Location**: `amplify/backend.ts`

**Purpose**: Register OSDU proxy function with Amplify backend

**Implementation**:
```typescript
import { osduProxyFunction } from './functions/osduProxy/resource';

const backend = defineBackend({
  auth,
  data,
  storage,
  // ... existing functions ...
  osduProxyFunction // Add OSDU proxy
});

// Add environment variable for OSDU API key (set during deployment)
backend.osduProxyFunction.addEnvironment('OSDU_API_KEY', process.env.OSDU_API_KEY || '');
```

### 6. Environment Configuration

**Location**: `.env.local` (local development) and AWS Lambda Configuration (production)

**Purpose**: Store OSDU API key securely

**Local Development** (`.env.local`):
```bash
# OSDU Search API Configuration (Backend Only - Never commit real key)
OSDU_API_KEY=your-api-key-here
```

**Production**: Set via AWS Lambda environment variables in Amplify console or deployment script

**Security Notes**:
- Add `OSDU_API_KEY` to `.env.local.example` with placeholder value
- Add `.env.local` to `.gitignore` (already present)
- Document that real key must be set in AWS Lambda configuration
- Never commit real API key to version control

## Data Models

### OSDU Search Request
```typescript
interface OSDUSearchRequest {
  query: string;           // Natural language search query
  dataPartition?: string;  // OSDU data partition (default: "osdu")
  maxResults?: number;     // Maximum results (default: 10)
}
```

### OSDU Search Response
```typescript
interface OSDUSearchResponse {
  answer: string;          // AI-generated natural language response
  recordCount: number;     // Total number of records found
  records: Array<{         // Array of OSDU records
    id?: string;
    name?: string;
    type?: string;
    [key: string]: any;    // Additional OSDU-specific fields
  }>;
}
```

### Message Format (Existing)
```typescript
interface Message {
  id: string;
  role: 'human' | 'ai';
  content: {
    text: string;
  };
  responseComplete: boolean;
  createdAt: string;
  chatSessionId: string;
  owner: string;
}
```

## Error Handling

### Frontend Error Handling

**Scenario 1: OSDU API Unavailable**
```typescript
try {
  const osduResponse = await amplifyClient.queries.osduSearch({ ... });
  // ... handle response ...
} catch (error) {
  console.error('❌ OSDU search failed:', error);
  
  // Display error message to user
  const errorMessage: Message = {
    id: uuidv4() as any,
    role: "ai" as any,
    content: {
      text: `⚠️ **OSDU Search Unavailable**\n\nUnable to search OSDU data at this time. The service may be temporarily unavailable.\n\n💡 **Tip**: Try a regular catalog search instead.`
    } as any,
    responseComplete: true as any,
    createdAt: new Date().toISOString() as any,
    chatSessionId: '' as any,
    owner: '' as any
  } as any;
  
  setMessages(prevMessages => [...prevMessages, errorMessage]);
}
```

**Scenario 2: Invalid Query**
- Lambda validates query parameter
- Returns error response with user-friendly message
- Frontend displays error in chat

**Scenario 3: Timeout**
- Lambda has 30-second timeout
- If exceeded, returns timeout error
- Frontend displays timeout message with retry suggestion

### Backend Error Handling

**API Key Missing**:
```typescript
if (!apiKey) {
  console.error('❌ OSDU API key not configured');
  return {
    statusCode: 500,
    body: JSON.stringify({
      error: 'OSDU API is not configured',
      answer: 'OSDU search is currently unavailable.',
      recordCount: 0,
      records: []
    })
  };
}
```

**OSDU API Error**:
```typescript
if (!response.ok) {
  console.error('❌ OSDU API error:', response.status);
  return {
    statusCode: response.status,
    body: JSON.stringify({
      error: `OSDU API request failed: ${response.status}`,
      answer: 'Unable to complete OSDU search. Please try again.',
      recordCount: 0,
      records: []
    })
  };
}
```

**Network Error**:
```typescript
catch (error) {
  console.error('❌ Network error:', error);
  return {
    statusCode: 500,
    body: JSON.stringify({
      error: 'Network error occurred',
      answer: 'Unable to reach OSDU service. Please check your connection.',
      recordCount: 0,
      records: []
    })
  };
}
```

## Testing Strategy

### Unit Tests

**Test 1: Intent Detection**
```typescript
describe('detectSearchIntent', () => {
  it('should detect OSDU intent', () => {
    expect(detectSearchIntent('Show me OSDU wells')).toBe('osdu');
    expect(detectSearchIntent('osdu data')).toBe('osdu');
  });
  
  it('should default to catalog intent', () => {
    expect(detectSearchIntent('Show me wells')).toBe('catalog');
    expect(detectSearchIntent('weather maps')).toBe('catalog');
  });
});
```

**Test 2: OSDU Proxy Lambda**
```typescript
describe('OSDU Proxy Handler', () => {
  it('should call OSDU API with correct parameters', async () => {
    const event = {
      arguments: {
        query: 'test query',
        dataPartition: 'osdu',
        maxResults: 10
      }
    };
    
    const result = await handler(event);
    expect(result.statusCode).toBe(200);
  });
  
  it('should handle missing API key', async () => {
    delete process.env.OSDU_API_KEY;
    const result = await handler({ arguments: { query: 'test' } });
    expect(result.statusCode).toBe(500);
  });
});
```

### Integration Tests

**Test 1: End-to-End OSDU Search**
```bash
# Test script: tests/test-osdu-search-integration.js
node tests/test-osdu-search-integration.js
```

**Test 2: Fallback to Catalog**
- Disable OSDU API
- Verify catalog search still works
- Verify error message displayed

### Manual Testing

**Test Cases**:
1. Search with "OSDU" keyword → Should call OSDU API
2. Search without "OSDU" keyword → Should call catalog
3. OSDU API returns results → Should display in chat
4. OSDU API returns error → Should show error message
5. API key missing → Should fail gracefully
6. Network timeout → Should show timeout message

## Deployment Considerations

### Environment Variables

**Development**:
```bash
# .env.local
OSDU_API_KEY=<your-osdu-api-key-here>
```

**Production**:
- Set via AWS Amplify Console → Backend → Functions → osduProxy → Environment Variables
- Or via AWS CLI:
```bash
aws lambda update-function-configuration \
  --function-name osduProxy \
  --environment Variables={OSDU_API_KEY=<your-osdu-api-key-here>}
```

### Deployment Steps

1. **Add OSDU Proxy Function**:
   ```bash
   # Create function directory
   mkdir -p amplify/functions/osduProxy
   
   # Add resource.ts and handler.ts
   # (files created as per design)
   ```

2. **Update Backend Configuration**:
   ```bash
   # Edit amplify/backend.ts
   # Add osduProxyFunction to defineBackend
   ```

3. **Update Data Schema**:
   ```bash
   # Edit amplify/data/resource.ts
   # Add osduSearch query
   ```

4. **Deploy to Sandbox**:
   ```bash
   npx ampx sandbox
   ```

5. **Set Environment Variable**:
   ```bash
   # Via Amplify Console or AWS CLI
   aws lambda update-function-configuration \
     --function-name <deployed-function-name> \
     --environment Variables={OSDU_API_KEY=<real-key>}
   ```

6. **Test Integration**:
   ```bash
   node tests/test-osdu-search-integration.js
   ```

### Rollback Plan

If issues occur:
1. Remove `osduSearch` query from schema
2. Remove intent detection code from frontend
3. Remove `osduProxyFunction` from backend.ts
4. Redeploy: `npx ampx sandbox`
5. Existing catalog functionality remains intact

## Security Checklist

- [ ] API key stored in backend environment variables only
- [ ] API key never exposed in frontend code
- [ ] API key never logged in console or CloudWatch
- [ ] API key never committed to version control
- [ ] Error messages sanitized to remove key information
- [ ] `.env.local.example` has placeholder value only
- [ ] `.gitignore` includes `.env.local`
- [ ] Lambda function has appropriate IAM permissions
- [ ] HTTPS used for all API calls
- [ ] Request timeout set to prevent hanging

## Performance Considerations

- **Lambda Cold Start**: First request may take 1-2 seconds
- **OSDU API Latency**: External API call adds 500ms-2s
- **Timeout**: 30-second Lambda timeout prevents indefinite waiting
- **Caching**: Consider adding response caching if OSDU queries are repetitive
- **Rate Limiting**: Monitor OSDU API rate limits and add throttling if needed

## Future Enhancements

1. **Response Caching**: Cache OSDU responses for repeated queries
2. **Advanced Intent Detection**: Use LLM to detect OSDU intent more accurately
3. **Hybrid Search**: Combine OSDU and catalog results in single response
4. **OSDU Data Visualization**: Display OSDU records on map alongside catalog data
5. **Multi-Source Search**: Add more external data sources beyond OSDU
6. **Search History**: Track OSDU vs catalog search usage metrics
