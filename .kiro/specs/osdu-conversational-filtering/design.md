# Design Document

## Overview

This design implements conversational filtering for OSDU search results by maintaining search context in the chat session and applying client-side filters to existing results. The approach prioritizes speed (no API calls for filters), simplicity (minimal code changes), and user experience (natural language filtering).

**Key Design Principles:**
1. **Context Preservation**: Store OSDU results in session state
2. **Client-Side Filtering**: Apply filters to existing data without API calls
3. **Natural Language**: Support conversational filter queries
4. **Graceful Degradation**: Fall back to new search if context is missing

## Architecture

### High-Level Flow

```
User: "show me osdu wells"
    ↓
OSDU Search → Store Results in Context
    ↓
Display Results
    ↓
User: "filter by operator Shell"
    ↓
Detect Filter Intent → Check Context Exists
    ↓
Apply Client-Side Filter
    ↓
Display Filtered Results (Same Component)
    ↓
User: "show only depth > 3000"
    ↓
Apply Additional Filter to Filtered Results
    ↓
Display Further Filtered Results
```

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Browser)                        │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  CatalogChatBoxCloudscape                          │    │
│  │  - Manages conversation state                      │    │
│  │  - Stores OSDU search context (NEW)                │    │
│  │  - Handles filter queries (NEW)                    │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────┐    │
│  │  Intent Detection (Enhanced)                       │    │
│  │  - Detect "OSDU" keyword                           │    │
│  │  - Detect filter intent (NEW)                      │    │
│  │  - Check for existing OSDU context (NEW)           │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                          │
│         ┌─────────┴─────────┐                               │
│         │                   │                               │
│  ┌──────▼──────┐    ┌──────▼──────────────────────────┐   │
│  │ New OSDU    │    │ Filter Existing Results (NEW)    │   │
│  │ Search      │    │ - Parse filter criteria          │   │
│  │             │    │ - Apply to cached results        │   │
│  │             │    │ - Update display                 │   │
│  └─────────────┘    └─────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. OSDU Search Context State

**Location**: `src/app/catalog/page.tsx`

**Purpose**: Store OSDU search results and metadata for filtering

**Implementation**:
```typescript
interface OSDUSearchContext {
  query: string;                    // Original search query
  timestamp: Date;                  // When search was performed
  recordCount: number;              // Total records from API
  records: OSDURecord[];            // Full record array
  filteredRecords?: OSDURecord[];   // Currently filtered records
  activeFilters?: FilterCriteria[]; // Applied filters
}

interface FilterCriteria {
  type: 'operator' | 'location' | 'depth' | 'type' | 'status';
  value: string | number;
  operator?: '>' | '<' | '=' | 'contains';
}

// Add to page state
const [osduContext, setOsduContext] = useState<OSDUSearchContext | null>(null);
```

**State Management**:
- Store context after successful OSDU search
- Clear context on new OSDU search
- Preserve context across filter operations
- Reset context on session end

### 2. Filter Intent Detection

**Location**: `src/app/catalog/page.tsx` (within `handleChatSearch`)

**Purpose**: Detect when user wants to filter existing OSDU results

**Implementation**:
```typescript
const detectFilterIntent = (query: string, hasOsduContext: boolean): {
  isFilter: boolean;
  filterType?: string;
  filterValue?: string;
  filterOperator?: string;
} => {
  const lowerQuery = query.toLowerCase().trim();
  
  // Only detect filter intent if OSDU context exists
  if (!hasOsduContext) {
    return { isFilter: false };
  }
  
  // Filter keywords
  const filterKeywords = [
    'filter', 'show only', 'where', 'with', 
    'operator', 'location', 'depth', 'type', 'status',
    'greater than', 'less than', 'equals'
  ];
  
  const hasFilterKeyword = filterKeywords.some(kw => lowerQuery.includes(kw));
  
  if (!hasFilterKeyword) {
    return { isFilter: false };
  }
  
  // Parse filter type and value
  let filterType: string | undefined;
  let filterValue: string | undefined;
  let filterOperator: string = 'contains';
  
  // Operator filter
  if (lowerQuery.includes('operator')) {
    filterType = 'operator';
    const match = lowerQuery.match(/operator\s+(?:is\s+)?([a-z0-9\s]+)/i);
    if (match) filterValue = match[1].trim();
  }
  
  // Location filter
  else if (lowerQuery.includes('location') || lowerQuery.includes('country')) {
    filterType = 'location';
    const match = lowerQuery.match(/(?:location|country)\s+(?:is\s+)?([a-z0-9\s]+)/i);
    if (match) filterValue = match[1].trim();
  }
  
  // Depth filter
  else if (lowerQuery.includes('depth')) {
    filterType = 'depth';
    
    // Greater than
    if (lowerQuery.includes('greater than') || lowerQuery.includes('>')) {
      filterOperator = '>';
      const match = lowerQuery.match(/(?:greater than|>)\s*(\d+)/);
      if (match) filterValue = match[1];
    }
    // Less than
    else if (lowerQuery.includes('less than') || lowerQuery.includes('<')) {
      filterOperator = '<';
      const match = lowerQuery.match(/(?:less than|<)\s*(\d+)/);
      if (match) filterValue = match[1];
    }
    // Equals
    else {
      filterOperator = '=';
      const match = lowerQuery.match(/depth\s+(?:is\s+)?(\d+)/);
      if (match) filterValue = match[1];
    }
  }
  
  // Type filter
  else if (lowerQuery.includes('type')) {
    filterType = 'type';
    const match = lowerQuery.match(/type\s+(?:is\s+)?([a-z0-9\s]+)/i);
    if (match) filterValue = match[1].trim();
  }
  
  // Status filter
  else if (lowerQuery.includes('status')) {
    filterType = 'status';
    const match = lowerQuery.match(/status\s+(?:is\s+)?([a-z0-9\s]+)/i);
    if (match) filterValue = match[1].trim();
  }
  
  console.log('🔍 Filter intent detected:', { filterType, filterValue, filterOperator });
  
  return {
    isFilter: true,
    filterType,
    filterValue,
    filterOperator
  };
};
```

**Interface**:
- Input: User query string, boolean indicating if OSDU context exists
- Output: Filter intent object with type, value, and operator
- Side effects: Console logging for debugging

### 3. Client-Side Filter Application

**Location**: `src/app/catalog/page.tsx`

**Purpose**: Apply filters to existing OSDU records

**Implementation**:
```typescript
const applyOsduFilter = (
  records: OSDURecord[],
  filterType: string,
  filterValue: string,
  filterOperator: string = 'contains'
): OSDURecord[] => {
  console.log('🔧 Applying filter:', { filterType, filterValue, filterOperator, recordCount: records.length });
  
  const filtered = records.filter(record => {
    switch (filterType) {
      case 'operator':
        return record.operator?.toLowerCase().includes(filterValue.toLowerCase());
      
      case 'location':
        return (
          record.location?.toLowerCase().includes(filterValue.toLowerCase()) ||
          record.country?.toLowerCase().includes(filterValue.toLowerCase())
        );
      
      case 'depth':
        if (!record.depth) return false;
        const depthValue = parseFloat(record.depth.replace(/[^\d.]/g, ''));
        const targetDepth = parseFloat(filterValue);
        
        switch (filterOperator) {
          case '>':
            return depthValue > targetDepth;
          case '<':
            return depthValue < targetDepth;
          case '=':
            return Math.abs(depthValue - targetDepth) < 100; // Within 100 units
          default:
            return false;
        }
      
      case 'type':
        return record.type?.toLowerCase().includes(filterValue.toLowerCase());
      
      case 'status':
        return record.status?.toLowerCase().includes(filterValue.toLowerCase());
      
      default:
        return true;
    }
  });
  
  console.log('✅ Filter applied:', { originalCount: records.length, filteredCount: filtered.length });
  
  return filtered;
};
```

**Interface**:
- Input: Records array, filter type, filter value, filter operator
- Output: Filtered records array
- Side effects: Console logging for debugging

### 4. Enhanced Query Handling

**Location**: `src/app/catalog/page.tsx` (within `handleChatSearch`)

**Purpose**: Route queries to filter or new search based on intent

**Implementation**:
```typescript
// In handleChatSearch function
const handleChatSearch = async (prompt: string) => {
  // ... existing code ...
  
  // Check for filter intent first if OSDU context exists
  if (osduContext) {
    const filterIntent = detectFilterIntent(prompt, true);
    
    if (filterIntent.isFilter && filterIntent.filterType && filterIntent.filterValue) {
      console.log('🔍 Processing filter query');
      
      // Apply filter to existing results
      const baseRecords = osduContext.filteredRecords || osduContext.records;
      const filteredRecords = applyOsduFilter(
        baseRecords,
        filterIntent.filterType,
        filterIntent.filterValue,
        filterIntent.filterOperator
      );
      
      // Update context with filtered results
      const newFilter: FilterCriteria = {
        type: filterIntent.filterType as any,
        value: filterIntent.filterValue,
        operator: filterIntent.filterOperator as any
      };
      
      setOsduContext({
        ...osduContext,
        filteredRecords,
        activeFilters: [...(osduContext.activeFilters || []), newFilter]
      });
      
      // Create filter result message
      const filterMessage: Message = {
        id: uuidv4() as any,
        role: "ai" as any,
        content: {
          text: `**🔍 Filtered OSDU Results**\n\n` +
                `Applied filter: ${filterIntent.filterType} ${filterIntent.filterOperator || 'contains'} "${filterIntent.filterValue}"\n\n` +
                `**Found ${filteredRecords.length} of ${osduContext.recordCount} records**\n\n` +
                (filteredRecords.length > 0 
                  ? `\`\`\`osdu-search-response\n${JSON.stringify({
                      answer: `Filtered results by ${filterIntent.filterType}`,
                      recordCount: filteredRecords.length,
                      records: filteredRecords,
                      query: prompt
                    })}\n\`\`\``
                  : `No records match the filter criteria.\n\n**Suggestions:**\n- Try a different ${filterIntent.filterType} value\n- Use "show all" to see original results\n- Refine your filter criteria`)
        } as any,
        responseComplete: true as any,
        createdAt: new Date().toISOString() as any,
        chatSessionId: '' as any,
        owner: '' as any
      } as any;
      
      setTimeout(() => {
        setMessages(prevMessages => [...prevMessages, filterMessage]);
      }, 0);
      
      return; // Exit early, don't proceed to new search
    }
  }
  
  // Check for "show all" or "reset" to clear filters
  if (osduContext && (prompt.toLowerCase().includes('show all') || prompt.toLowerCase().includes('reset'))) {
    console.log('🔄 Resetting filters');
    
    setOsduContext({
      ...osduContext,
      filteredRecords: undefined,
      activeFilters: []
    });
    
    const resetMessage: Message = {
      id: uuidv4() as any,
      role: "ai" as any,
      content: {
        text: `**🔄 Filters Reset**\n\n` +
              `Showing all ${osduContext.recordCount} original results.\n\n` +
              `\`\`\`osdu-search-response\n${JSON.stringify({
                answer: `Showing all original OSDU search results`,
                recordCount: osduContext.recordCount,
                records: osduContext.records,
                query: osduContext.query
              })}\n\`\`\``
      } as any,
      responseComplete: true as any,
      createdAt: new Date().toISOString() as any,
      chatSessionId: '' as any,
      owner: '' as any
    } as any;
    
    setTimeout(() => {
      setMessages(prevMessages => [...prevMessages, resetMessage]);
    }, 0);
    
    return;
  }
  
  // Existing intent detection for new searches
  const searchIntent = detectSearchIntent(prompt);
  
  if (searchIntent === 'osdu') {
    // ... existing OSDU search code ...
    
    // After successful OSDU search, store context
    if (osduResponse.data) {
      const osduData = typeof osduResponse.data === 'string' 
        ? JSON.parse(osduResponse.data) 
        : osduResponse.data;
      
      // Store OSDU context for filtering
      setOsduContext({
        query: prompt,
        timestamp: new Date(),
        recordCount: osduData.recordCount,
        records: osduData.records,
        filteredRecords: undefined,
        activeFilters: []
      });
      
      console.log('💾 OSDU context stored:', { recordCount: osduData.recordCount });
      
      // ... existing message creation code ...
    }
  } else {
    // ... existing catalog search code ...
  }
};
```

### 5. Filter Help and Examples

**Location**: `src/app/catalog/page.tsx`

**Purpose**: Provide user guidance on filtering

**Implementation**:
```typescript
const getFilterHelp = (): string => {
  return `**🔍 OSDU Filtering Help**\n\n` +
         `You can filter your OSDU results using natural language:\n\n` +
         `**By Operator:**\n` +
         `- "filter by operator Shell"\n` +
         `- "show only operator BP"\n\n` +
         `**By Location:**\n` +
         `- "filter by location Norway"\n` +
         `- "show only country USA"\n\n` +
         `**By Depth:**\n` +
         `- "show wells with depth greater than 3000"\n` +
         `- "filter depth < 5000"\n\n` +
         `**By Type:**\n` +
         `- "filter by type production"\n` +
         `- "show only type exploration"\n\n` +
         `**By Status:**\n` +
         `- "filter by status active"\n` +
         `- "show only status producing"\n\n` +
         `**Reset Filters:**\n` +
         `- "show all"\n` +
         `- "reset filters"`;
};

// Add help detection in handleChatSearch
if (osduContext && (prompt.toLowerCase().includes('help') || prompt.toLowerCase().includes('how to filter'))) {
  const helpMessage: Message = {
    id: uuidv4() as any,
    role: "ai" as any,
    content: {
      text: getFilterHelp()
    } as any,
    responseComplete: true as any,
    createdAt: new Date().toISOString() as any,
    chatSessionId: '' as any,
    owner: '' as any
  } as any;
  
  setTimeout(() => {
    setMessages(prevMessages => [...prevMessages, helpMessage]);
  }, 0);
  
  return;
}
```

## Data Models

### OSDU Search Context
```typescript
interface OSDUSearchContext {
  query: string;                    // Original search query
  timestamp: Date;                  // When search was performed
  recordCount: number;              // Total records from API
  records: OSDURecord[];            // Full record array
  filteredRecords?: OSDURecord[];   // Currently filtered records (optional)
  activeFilters?: FilterCriteria[]; // Applied filters (optional)
}
```

### Filter Criteria
```typescript
interface FilterCriteria {
  type: 'operator' | 'location' | 'depth' | 'type' | 'status';
  value: string | number;
  operator?: '>' | '<' | '=' | 'contains';
}
```

### OSDU Record (Existing)
```typescript
interface OSDURecord {
  id: string;
  name: string;
  type: string;
  operator?: string;
  location?: string;
  basin?: string;
  country?: string;
  depth?: string;
  logType?: string;
  status?: string;
  dataSource: string;
  latitude?: number | null;
  longitude?: number | null;
}
```

## Error Handling

### No OSDU Context
```typescript
if (!osduContext && filterIntent.isFilter) {
  const errorMessage: Message = {
    id: uuidv4() as any,
    role: "ai" as any,
    content: {
      text: `**⚠️ No OSDU Results to Filter**\n\n` +
            `Please perform an OSDU search first:\n` +
            `- "show me osdu wells"\n` +
            `- "search osdu for production wells"\n\n` +
            `Then you can apply filters to the results.`
    } as any,
    responseComplete: true as any,
    createdAt: new Date().toISOString() as any,
    chatSessionId: '' as any,
    owner: '' as any
  } as any;
  
  setMessages(prevMessages => [...prevMessages, errorMessage]);
  return;
}
```

### Invalid Filter Query
```typescript
if (filterIntent.isFilter && (!filterIntent.filterType || !filterIntent.filterValue)) {
  const errorMessage: Message = {
    id: uuidv4() as any,
    role: "ai" as any,
    content: {
      text: `**⚠️ Could Not Parse Filter**\n\n` +
            `I couldn't understand your filter criteria.\n\n` +
            getFilterHelp()
    } as any,
    responseComplete: true as any,
    createdAt: new Date().toISOString() as any,
    chatSessionId: '' as any,
    owner: '' as any
  } as any;
  
  setMessages(prevMessages => [...prevMessages, errorMessage]);
  return;
}
```

### Zero Results
```typescript
if (filteredRecords.length === 0) {
  const message = `**🔍 No Results Found**\n\n` +
                  `No records match your filter: ${filterIntent.filterType} ${filterIntent.filterOperator} "${filterIntent.filterValue}"\n\n` +
                  `**Suggestions:**\n` +
                  `- Try a different ${filterIntent.filterType} value\n` +
                  `- Use "show all" to see original ${osduContext.recordCount} results\n` +
                  `- Check spelling and try again`;
  
  // ... create and display message ...
}
```

## Testing Strategy

### Unit Tests

**Test 1: Filter Intent Detection**
```typescript
describe('detectFilterIntent', () => {
  it('should detect operator filter', () => {
    const result = detectFilterIntent('filter by operator Shell', true);
    expect(result.isFilter).toBe(true);
    expect(result.filterType).toBe('operator');
    expect(result.filterValue).toBe('Shell');
  });
  
  it('should not detect filter without context', () => {
    const result = detectFilterIntent('filter by operator Shell', false);
    expect(result.isFilter).toBe(false);
  });
});
```

**Test 2: Filter Application**
```typescript
describe('applyOsduFilter', () => {
  const mockRecords: OSDURecord[] = [
    { id: '1', name: 'Well-1', operator: 'Shell', type: 'Production', depth: '3500m' },
    { id: '2', name: 'Well-2', operator: 'BP', type: 'Exploration', depth: '4200m' },
    { id: '3', name: 'Well-3', operator: 'Shell', type: 'Production', depth: '2800m' }
  ];
  
  it('should filter by operator', () => {
    const filtered = applyOsduFilter(mockRecords, 'operator', 'Shell', 'contains');
    expect(filtered.length).toBe(2);
    expect(filtered.every(r => r.operator === 'Shell')).toBe(true);
  });
  
  it('should filter by depth greater than', () => {
    const filtered = applyOsduFilter(mockRecords, 'depth', '3000', '>');
    expect(filtered.length).toBe(2);
  });
});
```

### Integration Tests

**Test 1: End-to-End Filter Flow**
```bash
# Test script: tests/test-osdu-filtering.js
1. Perform OSDU search
2. Verify context is stored
3. Apply filter query
4. Verify filtered results displayed
5. Apply second filter
6. Verify cumulative filtering
7. Reset filters
8. Verify original results restored
```

### Manual Testing

**Test Cases**:
1. Search OSDU → Apply operator filter → Verify filtered results
2. Search OSDU → Apply depth filter → Verify numeric filtering
3. Search OSDU → Apply multiple filters → Verify AND logic
4. Search OSDU → Reset filters → Verify original results
5. Apply filter without OSDU search → Verify error message
6. Apply invalid filter → Verify help message
7. Filter returns zero results → Verify suggestions

## Performance Considerations

- **Client-Side Filtering**: Instant response, no API latency
- **Memory Usage**: Stores full OSDU results in browser memory (typically < 1MB)
- **Filter Complexity**: O(n) linear filtering, acceptable for typical result sets (< 1000 records)
- **Context Lifetime**: Cleared on page refresh or new OSDU search

### 6. Pagination State and Controls

**Location**: `src/components/OSDUSearchResponse.tsx`

**Purpose**: Paginate large result sets for better UX

**Implementation**:
```typescript
import { Pagination } from '@cloudscape-design/components';

export const OSDUSearchResponse: React.FC<OSDUSearchResponseProps> = ({
  answer,
  recordCount,
  records,
  query
}) => {
  // Pagination state
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const pageSize = 10;
  
  // Calculate paginated items
  const startIndex = (currentPageIndex - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRecords = records.slice(startIndex, endIndex);
  const totalPages = Math.ceil(records.length / pageSize);
  
  // Update display count for summary
  const displayCount = paginatedRecords.length;
  const showingStart = records.length > 0 ? startIndex + 1 : 0;
  const showingEnd = startIndex + displayCount;
  
  return (
    <SpaceBetween size="l">
      {/* ... existing header and summary ... */}
      
      {/* Records Table with Pagination */}
      {hasRecords ? (
        <Table
          columnDefinitions={[/* ... existing columns ... */]}
          items={paginatedRecords}  // Use paginated records instead of slice(0, 10)
          loadingText="Loading OSDU records"
          sortingDisabled={false}
          variant="container"
          wrapLines={true}
          stripedRows={true}
          pagination={
            records.length > pageSize ? (
              <Pagination
                currentPageIndex={currentPageIndex}
                onChange={({ detail }) => setCurrentPageIndex(detail.currentPageIndex)}
                pagesCount={totalPages}
                ariaLabels={{
                  nextPageLabel: "Next page",
                  previousPageLabel: "Previous page",
                  pageLabel: pageNumber => `Page ${pageNumber} of ${totalPages}`
                }}
              />
            ) : undefined
          }
          header={
            <Header
              counter={`(${showingStart}-${showingEnd} of ${recordCount})`}
              description="OSDU subsurface data records"
            >
              Record Details
            </Header>
          }
        />
      ) : (
        // ... existing empty state ...
      )}
    </SpaceBetween>
  );
};
```

**Interface**:
- Input: Records array, current page index
- Output: Paginated records for display
- Side effects: Page navigation updates displayed records

**Pagination Behavior**:
- Show pagination only if records > 10
- Reset to page 1 when new search or filter applied
- Preserve page when component re-renders with same data
- Disable prev/next buttons at boundaries

### 7. Pagination Reset on Filter

**Location**: `src/app/catalog/page.tsx` (within filter handling)

**Purpose**: Reset pagination when filters change the result set

**Implementation**:
```typescript
// When creating filtered result message, include pagination reset hint
const filterMessage: Message = {
  id: uuidv4() as any,
  role: "ai" as any,
  content: {
    text: `**🔍 Filtered OSDU Results**\n\n` +
          `Applied filter: ${filterIntent.filterType} ${filterIntent.filterOperator || 'contains'} "${filterIntent.filterValue}"\n\n` +
          `**Found ${filteredRecords.length} of ${osduContext.recordCount} records**\n\n` +
          (filteredRecords.length > 0 
            ? `\`\`\`osdu-search-response\n${JSON.stringify({
                answer: `Filtered results by ${filterIntent.filterType}`,
                recordCount: filteredRecords.length,
                records: filteredRecords,
                query: prompt,
                resetPagination: true  // Hint to reset pagination
              })}\n\`\`\``
            : `No records match the filter criteria.`)
  } as any,
  // ... rest of message ...
};
```

**Note**: The OSDUSearchResponse component will automatically reset to page 1 when it receives new records array (React state management).

## Future Enhancements

1. **Advanced Filters**: Support OR logic, regex patterns, date ranges
2. **Filter Persistence**: Save filters across sessions
3. **Filter UI**: Visual filter builder with dropdowns and sliders
4. **Export Filtered Results**: Download filtered data as CSV/JSON
5. **Filter Analytics**: Track most common filter patterns
6. **Smart Suggestions**: Auto-suggest filter values based on data
7. **Undo/Redo**: Full filter history with undo capability
8. **Configurable Page Size**: Allow users to choose 10, 25, 50, 100 records per page
9. **Jump to Page**: Direct page number input for large result sets

