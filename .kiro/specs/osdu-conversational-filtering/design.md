# Design Document

## Overview

This design implements **Universal Conversational Filtering** across ALL search types in the catalog. Currently, only OSDU searches support NLP filtering - catalog searches (the 24 LAS files) do not.

**Current State**:
- ✅ OSDU searches: "show me BP wells" → filters work
- ❌ Catalog searches: "just the ones near Brunei" → no filtering, returns all 24 files
- ❌ Inconsistent UX between search types

**Target State**:
- ✅ OSDU searches: NLP filtering works
- ✅ Catalog searches: NLP filtering works
- ✅ Consistent UX across all search types

This design achieves universal filtering by:

1. **Creating shared NLP parser** - Extract common filtering logic into reusable utility
2. **Enhancing Catalog Lambda** - Add same filtering capabilities to catalog-search handler
3. **Unified Frontend Context** - Handle both OSDU and catalog contexts consistently
4. **Consistent Commands** - Same NLP commands work for all search types
5. **Fixing border radius** - Ensure consistent 8px border radius on first prompt

## Architecture

### Current (Broken) Flow - Catalog Searches

```
User: "show me my wells"
  ↓
Catalog Lambda returns all 24 LAS files
  ↓
User: "just the ones near Brunei"
  ↓
Catalog Lambda returns all 24 LAS files again (NO FILTERING!)
  ↓
User frustrated - filtering doesn't work
```

### New (Fixed) Flow - Universal Filtering

```
User: "show me my wells"
  ↓
Catalog Lambda returns all 24 LAS files
  ↓
Frontend stores results in catalogContext
  ↓
User: "just the ones near Brunei"
  ↓
Frontend detects filter intent
  ↓
Shared NLP Parser extracts: location="Brunei"
  ↓
Frontend filters cached results (no API call)
  ↓
Map updates to show only filtered wells
  ↓
User sees 8 wells near Brunei
```

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (CatalogPage)                   │
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │ osduContext  │         │catalogContext│                  │
│  │ (OSDU data)  │         │ (24 LAS files)│                  │
│  └──────────────┘         └──────────────┘                  │
│         │                         │                          │
│         └─────────┬───────────────┘                          │
│                   │                                          │
│         ┌─────────▼──────────┐                              │
│         │ detectFilterIntent │                              │
│         │  (unified logic)   │                              │
│         └─────────┬──────────┘                              │
│                   │                                          │
│         ┌─────────▼──────────┐                              │
│         │ applyContextFilter │                              │
│         │ (works for both)   │                              │
│         └─────────┬──────────┘                              │
│                   │                                          │
│         ┌─────────▼──────────┐                              │
│         │   Update Map       │                              │
│         └────────────────────┘                              │
└─────────────────────────────────────────────────────────────┘
                   │                         │
                   │                         │
        ┌──────────▼──────────┐   ┌─────────▼──────────┐
        │   OSDU Lambda       │   │  Catalog Lambda     │
        │                     │   │                     │
        │  ┌───────────────┐ │   │  ┌───────────────┐ │
        │  │ Shared NLP    │ │   │  │ Shared NLP    │ │
        │  │ Parser        │ │   │  │ Parser        │ │
        │  │ (common util) │ │   │  │ (common util) │ │
        │  └───────────────┘ │   │  └───────────────┘ │
        └─────────────────────┘   └────────────────────┘
```

## Components and Interfaces

### 1. Shared NLP Query Parser (New - Common Utility)

**Location**: `cdk/lambda-functions/shared/nlpParser.ts`

```typescript
interface ParsedQuery {
  locations: string[];      // ["north sea", "brunei", "malaysia"]
  operators: string[];      // ["BP", "Shell", "My Company"]
  wellPrefixes: string[];   // ["USA", "NOR", "WELL"]
  depthFilter?: {           // NEW: Depth filtering
    minDepth?: number;
    maxDepth?: number;
    unit: 'm' | 'ft';
  };
  rawQuery: string;         // Original query for fallback
  confidence: number;       // 0-1 confidence in parsing
}

function parseNaturalLanguageQuery(query: string): ParsedQuery {
  // Extract location keywords (Brunei, Malaysia, North Sea, etc.)
  // Extract operator names (BP, Shell, My Company, etc.)
  // Extract well name patterns (USA, NOR, WELL, etc.)
  // Extract depth filters (deeper than 3000m, etc.)
  // Return structured parameters
}
```

**Key Features**:
- Used by BOTH OSDU and Catalog Lambdas
- Consistent filtering logic across all search types
- Supports location, operator, well name, and depth filters
- Returns confidence score for filtering decisions

### 2. Catalog Lambda Handler (Enhanced)

**Location**: `cdk/lambda-functions/catalog-search/handler.ts`

**Changes**:
- Import shared NLP parser
- Add filtering logic for catalog demo data (24 LAS files)
- Support location filtering (Brunei, Malaysia, Offshore, etc.)
- Support depth filtering (deeper than X meters)
- Support operator filtering (My Company, etc.)
- Return filtered results with accurate count

```typescript
import { parseNaturalLanguageQuery } from '../shared/nlpParser';

async function filterCatalogData(
  wells: any[], 
  parsedQuery: ParsedQuery
): Promise<any[]> {
  let filtered = wells;
  
  // Filter by location
  if (parsedQuery.locations.length > 0) {
    filtered = filtered.filter(well => 
      parsedQuery.locations.some(loc => 
        well.properties.location?.toLowerCase().includes(loc.toLowerCase())
      )
    );
  }
  
  // Filter by depth
  if (parsedQuery.depthFilter) {
    filtered = filtered.filter(well => {
      const depth = parseDepth(well.properties.depth);
      return depth >= parsedQuery.depthFilter.minDepth;
    });
  }
  
  // Filter by operator
  if (parsedQuery.operators.length > 0) {
    filtered = filtered.filter(well =>
      parsedQuery.operators.some(op =>
        well.properties.operator?.toLowerCase().includes(op.toLowerCase())
      )
    );
  }
  
  return filtered;
}
```

### 3. OSDU Lambda Handler (Modified)

**Location**: `cdk/lambda-functions/osdu/handler.ts`

**Changes**:
- Import shared NLP parser (replace inline parser)
- Use shared parser for consistency
- Apply same filtering logic as catalog
- Maintain existing OSDU API integration

### 4. Frontend Context Management (Enhanced)

**Location**: `src/pages/CatalogPage.tsx`

**Changes**:
- Add `catalogContext` state (similar to existing `osduContext`)
- Implement unified `detectFilterIntent()` that works for both contexts
- Implement unified `applyContextFilter()` that works for both contexts
- Maintain separate contexts for OSDU and catalog searches
- Clear appropriate context when switching search types

```typescript
interface SearchContext {
  query: string;
  records: any[];
  filteredRecords: any[];
  activeFilters: ParsedQuery;
  searchType: 'osdu' | 'catalog';
}

const [osduContext, setOsduContext] = useState<SearchContext | null>(null);
const [catalogContext, setCatalogContext] = useState<SearchContext | null>(null);

function detectFilterIntent(query: string): boolean {
  // Detect if query is a filter command
  // "just the ones...", "only wells...", "show me only...", etc.
  return query.includes('just') || query.includes('only') || 
         query.includes('filter') || query.includes('near');
}

function applyContextFilter(
  context: SearchContext, 
  filterQuery: string
): SearchContext {
  // Parse filter query using shared NLP parser
  const parsed = parseNaturalLanguageQuery(filterQuery);
  
  // Apply filters to cached records
  const filtered = filterRecords(context.records, parsed);
  
  // Return updated context
  return {
    ...context,
    filteredRecords: filtered,
    activeFilters: parsed
  };
}
```

### 5. Prompt Input Styling (Fixed)

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

### Property 1: Shared parser produces consistent results

*For any* natural language query, when parsed by the shared NLP parser, it should produce identical filter criteria regardless of whether it's called from OSDU Lambda or Catalog Lambda.

**Validates: Requirements 8.1, 8.2, 8.3**

### Property 2: Location filtering works for all search types

*For any* search result set (OSDU or catalog), when filtered by location keyword, only results containing that location should be returned.

**Validates: Requirements 1.1, 6.2, 7.1**

### Property 3: Depth filtering works for all search types

*For any* search result set (OSDU or catalog), when filtered by depth criteria (e.g., "deeper than 3000m"), only results meeting that depth requirement should be returned.

**Validates: Requirements 6.3, 7.2**

### Property 4: Operator filtering works for all search types

*For any* search result set (OSDU or catalog), when filtered by operator name, only results with that operator should be returned.

**Validates: Requirements 1.2, 7.3**

### Property 5: Context persistence prevents redundant API calls

*For any* follow-up filter query, if a search context exists, the system should filter cached results instead of making a new API call.

**Validates: Requirements 2.2, 2.3, 4.2, 4.3**

### Property 6: Context reset restores original results

*For any* search context, when user requests "show all" or "reset", the system should restore the original unfiltered results.

**Validates: Requirements 2.5, 6.5, 7.4**

### Property 7: Separate contexts for different search types

*For any* user session, OSDU context and catalog context should be maintained separately and not interfere with each other.

**Validates: Requirements 4.5, 7.5**

### Property 8: Map synchronization with filtered results

*For any* filtered result set, the map should update to show only markers for the filtered wells.

**Validates: Requirements 3.1, 3.2**

### Property 9: Border radius is consistent

*For any* prompt input element, the border-radius should be 8px on all four corners.

**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

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

