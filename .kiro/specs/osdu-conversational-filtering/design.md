# Design Document

## Overview

The OSDU conversational search is fundamentally broken. It returns hardcoded demo OSDU well data instead of calling the real OSDU API. This is SEPARATE from the catalog demo data (24 LAS files) which should remain.

**Important Distinction**:
- **Catalog demo data** (24 LAS files) → KEEP THIS ✅
- **OSDU demo data** (50 fake OSDU wells) → REMOVE THIS ❌

This design fixes the OSDU search issue by:

1. **Removing OSDU demo data fallback** when OSDU API is configured
2. **Adding NLP query parser** to extract search parameters from natural language
3. **Connecting to real OSDU API** for all OSDU conversational searches
4. **Providing clear error messages** when OSDU is not configured
5. **Fixing border radius** inconsistency in prompt input (4px → 8px)
6. **Preserving catalog demo data** for regular catalog searches

## Architecture

### Current (Broken) Flow

```
User: "show me wells in the north sea"
  ↓
OSDU Lambda receives query
  ↓
Checks if OSDU_API_URL is configured
  ↓
NOT configured → Returns 50 hardcoded demo records (WRONG!)
  ↓
User sees fake data that doesn't match their query
```

### New (Fixed) Flow

```
User: "show me wells in the north sea"
  ↓
OSDU Lambda receives query
  ↓
Parse query to extract: location="north sea"
  ↓
Check if OSDU_API_URL is configured
  ↓
NOT configured → Return error: "OSDU API not configured"
IS configured → Call OSDU API with parsed parameters
  ↓
Return REAL results from OSDU API
```

## Components and Interfaces

### 1. NLP Query Parser (New)

**Location**: `cdk/lambda-functions/osdu/queryParser.ts`

```typescript
interface ParsedQuery {
  locations: string[];      // ["north sea", "gulf of mexico"]
  operators: string[];      // ["BP", "Shell"]
  wellPrefixes: string[];   // ["USA", "NOR"]
  rawQuery: string;         // Original query for fallback
}

function parseNaturalLanguageQuery(query: string): ParsedQuery {
  // Extract location keywords
  // Extract operator names
  // Extract well name patterns
  // Return structured parameters
}
```

### 2. OSDU API Client (Enhanced)

**Location**: `cdk/lambda-functions/osdu/osduClient.ts`

```typescript
interface OSDUSearchParams {
  query: string;
  locations?: string[];
  operators?: string[];
  wellPrefixes?: string[];
  maxResults?: number;
}

async function searchOSDU(params: OSDUSearchParams): Promise<OSDUSearchResponse> {
  // Validate OSDU_API_URL and OSDU_API_KEY are set
  // Build OSDU API request with parsed parameters
  // Call OSDU API
  // Transform response to standard format
  // Return results
}
```

### 3. OSDU Lambda Handler (Modified)

**Location**: `cdk/lambda-functions/osdu/handler.ts`

**Changes**:
- Remove demo data generation entirely when API is configured
- Add NLP query parsing before API call
- Return configuration error if OSDU not configured
- Pass parsed parameters to OSDU API
- Log all API calls for debugging

### 4. Prompt Input Styling (Fixed)

**Location**: `src/components/ExpandablePromptInput.tsx` or `src/globals.css`

**Changes**:
- Override border-radius to 8px for all corners
- Remove extra border-radius on top-right corner
- Ensure consistency with response containers

## Data Models

### Parsed Query

```typescript
interface ParsedQuery {
  locations: string[];      // Extracted location keywords
  operators: string[];      // Extracted operator names
  wellPrefixes: string[];   // Extracted well name patterns
  rawQuery: string;         // Original query text
  confidence: number;       // 0-1 confidence in parsing
}
```

### OSDU API Request

```typescript
interface OSDUAPIRequest {
  toolName: 'searchWells';
  input: {
    query: string;          // Natural language or structured query
    locations?: string[];   // Optional location filters
    operators?: string[];   // Optional operator filters
    wellPrefixes?: string[]; // Optional well name filters
    maxResults: number;     // Max records to return
  };
}
```

### OSDU API Response

```typescript
interface OSDUAPIResponse {
  statusCode: number;
  body: {
    records: OSDURecord[];
    metadata: {
      totalFound: number;
      returned: number;
      filtered: number;
      authorized: number;
    };
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: No demo data when API configured

*For any* OSDU search request, if OSDU_API_URL and OSDU_API_KEY are set, the system should NEVER return hardcoded demo data.

**Validates: Requirements 1.5, 5.1, 5.2**

### Property 2: Configuration error when API not configured

*For any* OSDU search request, if OSDU_API_URL or OSDU_API_KEY are NOT set, the system should return a configuration error, not demo data.

**Validates: Requirements 3.1, 5.2**

### Property 3: Query parsing extracts parameters

*For any* natural language query containing location/operator/well name keywords, the parser should extract those parameters correctly.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 4: API calls include parsed parameters

*For any* parsed query with extracted parameters, the OSDU API call should include those parameters in the request.

**Validates: Requirements 2.4**

### Property 5: Error messages are clear and actionable

*For any* OSDU API error, the system should return a clear error message that explains what went wrong and how to fix it.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

### Property 6: Results are marked as OSDU source

*For any* successful OSDU API response, all returned records should be marked with dataSource="OSDU".

**Validates: Requirements 4.5**

### Property 7: Border radius is consistent

*For any* prompt input element, the border-radius should be 8px on all four corners.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

## Error Handling

### Configuration Errors

**When**: OSDU_API_URL or OSDU_API_KEY not set

**Response**:
```json
{
  "statusCode": 503,
  "body": {
    "error": "OSDU API not configured",
    "answer": "OSDU search is not available. Please configure OSDU_API_URL and OSDU_API_KEY environment variables.",
    "recordCount": 0,
    "records": []
  }
}
```

### API Errors

**When**: OSDU API returns error status

**Response**:
```json
{
  "statusCode": 502,
  "body": {
    "error": "OSDU API error: <status>",
    "answer": "Unable to search OSDU data. The OSDU service returned an error.",
    "recordCount": 0,
    "records": []
  }
}
```

### Timeout Errors

**When**: OSDU API call exceeds 50 seconds

**Response**:
```json
{
  "statusCode": 504,
  "body": {
    "error": "Request timeout",
    "answer": "The OSDU search request timed out. Please try again with a more specific query.",
    "recordCount": 0,
    "records": []
  }
}
```

### Zero Results

**When**: OSDU API returns empty results

**Response**:
```json
{
  "statusCode": 200,
  "body": {
    "answer": "No wells found matching your query. Try broadening your search criteria.",
    "recordCount": 0,
    "records": []
  }
}
```

## Testing Strategy

### Unit Tests

- Test query parser with various location keywords
- Test query parser with various operator names
- Test query parser with various well name patterns
- Test query parser with multiple criteria
- Test query parser with unparseable queries
- Test OSDU client with valid configuration
- Test OSDU client with missing configuration
- Test OSDU client with invalid configuration
- Test error message formatting

### Property-Based Tests

We will use **fast-check** (TypeScript property-based testing library) for property tests. Each property test should run a minimum of 100 iterations.

**Property 1: No demo data when API configured**
- Generate random OSDU_API_URL and OSDU_API_KEY values
- Generate random queries
- Verify response NEVER contains hardcoded demo data
- **Feature: osdu-conversational-filtering, Property 1: No demo data when API configured**

**Property 2: Configuration error when API not configured**
- Generate random queries
- Set OSDU_API_URL and OSDU_API_KEY to empty/undefined
- Verify response contains configuration error
- **Feature: osdu-conversational-filtering, Property 2: Configuration error when API not configured**

**Property 3: Query parsing extracts parameters**
- Generate random queries with known keywords
- Verify parser extracts expected parameters
- **Feature: osdu-conversational-filtering, Property 3: Query parsing extracts parameters**

**Property 4: API calls include parsed parameters**
- Generate random parsed queries
- Mock OSDU API client
- Verify API calls include parsed parameters
- **Feature: osdu-conversational-filtering, Property 4: API calls include parsed parameters**

**Property 5: Error messages are clear and actionable**
- Generate random error scenarios
- Verify error messages contain helpful information
- **Feature: osdu-conversational-filtering, Property 5: Error messages are clear and actionable**

### Integration Tests

- Test full flow: query → parse → API call → response
- Test with real OSDU API (if credentials available)
- Test with mock OSDU API
- Test error scenarios end-to-end
- Verify border radius in browser DevTools

### Manual Testing

- Configure OSDU_API_URL and OSDU_API_KEY
- Test "show me wells in the north sea" query
- Verify REAL OSDU data is returned
- Test with OSDU not configured
- Verify configuration error is returned
- Test various query patterns
- Inspect prompt input border radius in DevTools

## Implementation Notes

### Query Parsing Strategy

Use simple keyword matching for MVP:

**Location keywords**:
- "north sea" → location filter
- "gulf of mexico" → location filter
- "south china sea" → location filter
- "persian gulf" → location filter
- "caspian" → location filter

**Operator keywords**:
- "BP" → operator filter
- "Shell" → operator filter
- "Chevron" → operator filter
- "ExxonMobil" → operator filter
- "TotalEnergies" → operator filter

**Well name patterns**:
- "USA wells" → well name prefix "USA"
- "NOR wells" → well name prefix "NOR"
- Extract country codes from query

### OSDU API Integration

The OSDU API expects this format:

```json
{
  "toolName": "searchWells",
  "input": {
    "query": "natural language query or structured query",
    "maxResults": 1000
  }
}
```

We need to enhance this to pass parsed parameters. Options:

1. **Embed in query string**: "location:north sea operator:BP"
2. **Use structured query syntax**: Build OSDU query from parsed params
3. **Pass as separate fields**: Extend API contract (requires backend changes)

**Recommendation**: Use option 2 (structured query syntax) since OSDU Query Builder already does this.

### OSDU Demo Data Removal

**IMPORTANT**: This only affects OSDU demo data in `cdk/lambda-functions/osdu/handler.ts`. The catalog demo data (24 LAS files) is NOT affected.

**Current code in OSDU handler** (WRONG):
```typescript
// In cdk/lambda-functions/osdu/handler.ts
if (!apiUrl || !apiKey || apiUrl.includes('example.com')) {
  console.log('⚠️ OSDU API not configured, returning demo data');
  
  // Generate 50 fake OSDU wells - WRONG!
  const demoRecords = Array.from({ length: 50 }, (_, i) => {
    // ... fake OSDU data
  });
  
  return demoRecords; // WRONG!
}
```

**Fixed code in OSDU handler** (RIGHT):
```typescript
// In cdk/lambda-functions/osdu/handler.ts
if (!apiUrl || !apiKey || apiUrl.includes('example.com')) {
  console.log('❌ OSDU API not configured');
  return {
    statusCode: 503,
    body: {
      error: 'OSDU API not configured',
      answer: 'OSDU search is not available. Please configure OSDU_API_URL and OSDU_API_KEY.',
      recordCount: 0,
      records: []
    }
  };
}
```

**Catalog demo data remains unchanged** - the 24 LAS files in the catalog Lambda are preserved.

### Border Radius Fix

Add CSS override in `src/globals.css`:

```css
.awsui-prompt-input,
.awsui-prompt-input__container {
  border-radius: 8px !important;
}

/* Remove extra border radius on top-right corner */
.awsui-prompt-input:first-child {
  border-top-right-radius: 8px !important;
}
```

### Performance Considerations

- Query parsing is simple string matching, very fast (< 1ms)
- OSDU API calls may take 5-30 seconds depending on query complexity
- Use 50 second timeout to prevent hanging
- Log all API calls for debugging and performance monitoring

### Backward Compatibility

**BREAKING CHANGE**: OSDU demo data will no longer be returned when OSDU is not configured. This is intentional - returning fake OSDU data is worse than returning an error.

**What's changing**:
- ❌ OSDU demo data (50 fake OSDU wells) → REMOVED
- ✅ Catalog demo data (24 LAS files) → PRESERVED

**Migration path**:
1. Configure OSDU_API_URL and OSDU_API_KEY in production
2. Test with real OSDU API
3. Deploy changes
4. Users will see real OSDU data or clear error messages
5. Catalog searches continue to work with demo data

