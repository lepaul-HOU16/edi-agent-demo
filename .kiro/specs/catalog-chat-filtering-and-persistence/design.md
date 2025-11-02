# Design Document

## Overview

This design addresses two critical issues in the Data Catalog chat interface:

1. **Broken filtering context** where chat queries don't filter the displayed table
2. **Lost conversation state** when the browser is reloaded

The solution involves three main components:
- Enhanced state management to track filtered vs. unfiltered data
- Message persistence using localStorage and S3
- Improved communication between chat and table components

## Architecture

### Current Architecture Issues

**Problem 1: Filtering Context Lost**
```
User Query: "wells with log curve data"
    ↓
Backend processes query → Returns filtered wells
    ↓
Chat component receives response
    ↓
❌ Table component doesn't receive filtered data
    ↓
Table still shows all 151 wells instead of filtered subset
```

**Problem 2: No Message Persistence**
```
User has conversation → Builds up context
    ↓
User reloads browser
    ↓
❌ messages state is cleared (React state only)
❌ sessionId persists but messages are lost
    ↓
User sees empty chat, must start over
```

### Proposed Architecture

**Solution 1: Filtered Data Flow**
```
User Query: "wells with log curve data"
    ↓
Frontend detects filter operation (has existing data)
    ↓
Backend receives: { prompt, sessionId, existingContext: { hasExistingData: true, wellCount: 151 } }
    ↓
Backend loads wells from S3, filters them, returns filtered subset
    ↓
Chat component receives: { filteredData: [...], stats: { wellCount: 15, totalWells: 151 } }
    ↓
✅ Chat updates analysisData state with filtered wells
    ↓
✅ Table component receives filtered data via props
    ↓
✅ Table shows "15 of 151 wells" with filtered results
```

**Solution 2: Message Persistence Flow**
```
User sends message
    ↓
Message added to messages state
    ↓
✅ Save messages to localStorage: catalog_messages_{sessionId}
    ↓
User reloads browser
    ↓
✅ Load sessionId from localStorage
    ↓
✅ Load messages from localStorage: catalog_messages_{sessionId}
    ↓
✅ Restore messages state
    ↓
✅ Load table data from S3 using sessionId
    ↓
✅ User sees full conversation and data
```

## Components and Interfaces

### 1. Enhanced State Management (catalog/page.tsx)

**Current State:**
```typescript
const [messages, setMessages] = useState<Message[]>([]);
const [analysisData, setAnalysisData] = useState<any>(null);
const [sessionId, setSessionId] = useState<string>(() => {
  // Only loads sessionId from localStorage
  const storedSessionId = localStorage.getItem('catalog_session_id');
  return storedSessionId || uuidv4();
});
```

**Enhanced State:**
```typescript
// Add filtered data tracking
const [analysisData, setAnalysisData] = useState<any>(null);
const [filteredData, setFilteredData] = useState<any>(null);
const [filterStats, setFilterStats] = useState<{
  filteredCount: number;
  totalCount: number;
  isFiltered: boolean;
} | null>(null);

// Enhanced session initialization with message restoration
const [sessionId, setSessionId] = useState<string>(() => {
  if (typeof window !== 'undefined') {
    const storedSessionId = localStorage.getItem('catalog_session_id');
    if (storedSessionId) {
      return storedSessionId;
    }
  }
  return uuidv4();
});

// Load messages on mount
useEffect(() => {
  if (typeof window !== 'undefined' && sessionId) {
    const storedMessages = localStorage.getItem(`catalog_messages_${sessionId}`);
    if (storedMessages) {
      try {
        const parsedMessages = JSON.parse(storedMessages);
        setMessages(parsedMessages);
        console.log('📦 Restored messages from localStorage:', parsedMessages.length);
      } catch (error) {
        console.error('Failed to parse stored messages:', error);
      }
    }
  }
}, [sessionId]);

// Save messages whenever they change
useEffect(() => {
  if (typeof window !== 'undefined' && sessionId && messages.length > 0) {
    localStorage.setItem(`catalog_messages_${sessionId}`, JSON.stringify(messages));
    console.log('💾 Saved messages to localStorage:', messages.length);
  }
}, [messages, sessionId]);
```

### 2. Table Data Prop Flow

**Current Implementation:**
```typescript
// CatalogChatBoxCloudscape receives hierarchicalData but doesn't use it for filtering
<CatalogChatBoxCloudscape
  onInputChange={setUserInput}
  userInput={userInput}
  messages={messages}
  setMessages={setMessages}
  onSendMessage={handleChatSearch}
  hierarchicalData={analysisData} // ❌ Not used for filtering
/>
```

**Enhanced Implementation:**
```typescript
// Pass both full data and filtered data
<CatalogChatBoxCloudscape
  onInputChange={setUserInput}
  userInput={userInput}
  messages={messages}
  setMessages={setMessages}
  onSendMessage={handleChatSearch}
  hierarchicalData={analysisData} // Full dataset
  filteredData={filteredData} // Filtered subset
  filterStats={filterStats} // Filter statistics
/>

// Inside CatalogChatBoxCloudscape, use filtered data when available
const displayData = filteredData || hierarchicalData;
const displayStats = filterStats || {
  filteredCount: hierarchicalData?.length || 0,
  totalCount: hierarchicalData?.length || 0,
  isFiltered: false
};
```

### 3. Backend Response Enhancement

**Current Response:**
```json
{
  "type": "complete",
  "data": {
    "message": "Found 15 wells with log curve data",
    "files": {
      "metadata": "s3://...",
      "geojson": "s3://..."
    },
    "stats": {
      "wellCount": 15
    }
  }
}
```

**Enhanced Response:**
```json
{
  "type": "complete",
  "data": {
    "message": "Found 15 wells with log curve data",
    "files": {
      "metadata": "s3://...",
      "geojson": "s3://..."
    },
    "stats": {
      "wellCount": 15,
      "totalWells": 151,
      "isFiltered": true,
      "filterCriteria": "wells with log curve data"
    },
    "isFilterOperation": true
  }
}
```

### 4. Filter Detection Logic

**Enhanced handleChatSearch:**
```typescript
const handleChatSearch = useCallback(async (prompt: string) => {
  // Detect filter operation
  const isFirstQuery = !analysisData || analysisData.length === 0;
  const lowerPrompt = prompt.toLowerCase().trim();
  
  // Enhanced filter keywords
  const filterKeywords = [
    'filter', 'with', 'having', 'show wells with',
    'wells with', 'that have', 'containing',
    'depth', 'greater than', 'less than',
    'operator', 'operated by', 'log curve', 'curve'
  ];
  
  const isLikelyFilter = !isFirstQuery && 
    filterKeywords.some(keyword => lowerPrompt.includes(keyword));
  
  // Prepare context
  let searchContextForBackend = null;
  if (!isFirstQuery && analysisData && analysisData.length > 0) {
    searchContextForBackend = {
      wellCount: analysisData.length,
      queryType: analysisQueryType,
      timestamp: new Date().toISOString(),
      isFilterOperation: isLikelyFilter,
      hasExistingData: true
    };
  }
  
  // Call backend
  const searchResponse = await amplifyClient.mutations.catalogSearch({
    prompt: prompt,
    sessionId: sessionId,
    osduInstance: JSON.stringify(osduInstance),
    authToken: authToken,
    existingContext: searchContextForBackend ? JSON.stringify(searchContextForBackend) : null,
    polygonFilters: polygonFilters ? JSON.stringify(polygonFilters) : null
  });
  
  // Process response
  if (searchResponse.data) {
    const catalogData = searchResponse.data.data;
    
    // Check if this is a filter operation
    if (catalogData.isFilterOperation) {
      // Store filtered data separately
      setFilteredData(catalogData.filteredWells);
      setFilterStats({
        filteredCount: catalogData.stats.wellCount,
        totalCount: catalogData.stats.totalWells || analysisData.length,
        isFiltered: true
      });
      
      // Keep original analysisData unchanged
      console.log('✅ Filter applied:', {
        filtered: catalogData.stats.wellCount,
        total: catalogData.stats.totalWells || analysisData.length
      });
    } else {
      // Fresh search - update both
      setAnalysisData(catalogData.wells);
      setFilteredData(null);
      setFilterStats(null);
    }
  }
}, [analysisData, analysisQueryType, sessionId]);
```

### 5. Table Component Updates

**ProfessionalGeoscientistDisplay Component:**
```typescript
function ProfessionalGeoscientistDisplay({
  tableData,
  searchQuery,
  queryType,
  weatherData,
  filterStats // NEW: Add filter stats prop
}: {
  tableData: any[],
  searchQuery: string,
  queryType?: string,
  weatherData?: any,
  filterStats?: { filteredCount: number; totalCount: number; isFiltered: boolean } | null
}) {
  // ... existing code ...
  
  // Update header to show filter stats
  const headerCounter = filterStats?.isFiltered
    ? `(${filterStats.filteredCount} of ${filterStats.totalCount} total)`
    : `(${tableData.length} total)`;
  
  return (
    <Table
      // ... existing props ...
      header={
        <Header
          counter={headerCounter}
          description={
            filterStats?.isFiltered
              ? "Filtered results - click any row to view details"
              : "Click any row to view detailed information"
          }
        >
          Well Data
        </Header>
      }
      // ... rest of table config ...
    />
  );
}
```

### 6. Session Reset Enhancement

**Enhanced handleCreateNewChat:**
```typescript
const handleCreateNewChat = async () => {
  try {
    console.log('🔄 RESET: Clearing all catalog state...');
    
    // Generate new sessionId
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
    
    // Clear localStorage for old session
    if (typeof window !== 'undefined') {
      const oldSessionId = localStorage.getItem('catalog_session_id');
      if (oldSessionId) {
        localStorage.removeItem(`catalog_messages_${oldSessionId}`);
        console.log('🗑️ Cleared messages for old session:', oldSessionId);
      }
      
      // Save new sessionId
      localStorage.setItem('catalog_session_id', newSessionId);
      console.log('🔄 Generated new sessionId:', newSessionId);
    }
    
    // Reset all state
    setMessages([]);
    setAnalysisData(null);
    setFilteredData(null);
    setFilterStats(null);
    setChainOfThoughtMessageCount(0);
    setChainOfThoughtAutoScroll(true);
    
    // ... rest of reset logic ...
    
    console.log('✅ RESET: All catalog state cleared successfully');
  } catch (error) {
    console.error("❌ RESET: Error resetting catalog:", error);
    alert("Failed to reset catalog. Please refresh the page.");
  }
}
```

## Data Models

### Message Model (Enhanced)
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
  // Enhanced fields
  thoughtSteps?: any[];
  stats?: {
    wellCount: number;
    totalWells?: number; // NEW: Total before filtering
    wellboreCount?: number;
    welllogCount?: number;
    curveCount?: number;
    isFiltered?: boolean; // NEW: Indicates if this is filtered data
    filterCriteria?: string; // NEW: What filter was applied
  };
  files?: {
    metadata?: string;
    geojson?: string;
  };
}
```

### Filter Stats Model
```typescript
interface FilterStats {
  filteredCount: number;
  totalCount: number;
  isFiltered: boolean;
  filterCriteria?: string;
}
```

### Session State Model
```typescript
interface SessionState {
  sessionId: string;
  messages: Message[];
  analysisData: any;
  filteredData: any | null;
  filterStats: FilterStats | null;
  mapState: {
    center: [number, number];
    zoom: number;
    bounds: any;
    wellData: any;
    hasSearchResults: boolean;
  };
  timestamp: string;
}
```

## Error Handling

### Message Restoration Errors
```typescript
// Graceful degradation if message restoration fails
try {
  const storedMessages = localStorage.getItem(`catalog_messages_${sessionId}`);
  if (storedMessages) {
    const parsedMessages = JSON.parse(storedMessages);
    setMessages(parsedMessages);
  }
} catch (error) {
  console.error('Failed to restore messages:', error);
  // Continue with empty messages - don't block user
  setMessages([]);
}
```

### Filter Operation Errors
```typescript
// If filter fails, show error but keep original data
try {
  const searchResponse = await amplifyClient.mutations.catalogSearch({...});
  // Process response
} catch (error) {
  console.error('Filter operation failed:', error);
  
  // Show error message
  const errorMessage: Message = {
    id: uuidv4(),
    role: 'ai',
    content: {
      text: `❌ Filter operation failed: ${error.message}\n\nShowing original unfiltered data.`
    },
    responseComplete: true,
    createdAt: new Date().toISOString(),
    chatSessionId: '',
    owner: ''
  };
  
  setMessages(prev => [...prev, errorMessage]);
  
  // Keep original data visible
  setFilteredData(null);
  setFilterStats(null);
}
```

### S3 Data Loading Errors
```typescript
// If S3 data loading fails on reload, start fresh
try {
  const metadata = await fetch(files.metadata);
  const data = await metadata.json();
  setAnalysisData(data);
} catch (error) {
  console.error('Failed to load data from S3:', error);
  
  // Show warning but allow user to continue
  const warningMessage: Message = {
    id: uuidv4(),
    role: 'ai',
    content: {
      text: `⚠️ Could not restore previous data. Please run a new search.`
    },
    responseComplete: true,
    createdAt: new Date().toISOString(),
    chatSessionId: '',
    owner: ''
  };
  
  setMessages(prev => [...prev, warningMessage]);
}
```

## Testing Strategy

### Unit Tests
1. Test message persistence to/from localStorage
2. Test filter detection logic with various query patterns
3. Test filter stats calculation
4. Test session reset clearing all state

### Integration Tests
1. Test full filter flow: query → backend → response → table update
2. Test message restoration on page reload
3. Test switching between filtered and unfiltered views
4. Test filter operation with polygon filters

### End-to-End Tests
1. User performs initial search → sees results in table
2. User types filter query → table updates to show filtered results
3. User reloads browser → sees full conversation and filtered state
4. User clicks "New Chat" → all state cleared, fresh session started
5. User applies multiple filters in sequence → each filter works correctly

## Performance Considerations

### localStorage Size Limits
- localStorage has ~5-10MB limit per domain
- Messages are text-based and compress well
- Typical session: 20 messages × 2KB = 40KB (well within limits)
- If approaching limits, implement message pruning (keep last 100 messages)

### Table Rendering Performance
- Filtered data is typically smaller than full dataset
- Pagination already implemented (10 items per page)
- Expandable rows load on-demand
- No performance impact expected

### S3 Data Loading
- Metadata files are already cached by browser
- Signed URLs have 1-hour expiration
- If URL expires, backend generates new one
- Typical metadata file: 100 wells × 5KB = 500KB (fast to load)

## Migration Strategy

### Phase 1: Message Persistence (Low Risk)
1. Add localStorage save/load for messages
2. Test with existing functionality
3. Deploy and monitor

### Phase 2: Filter Detection (Medium Risk)
1. Enhance filter keyword detection
2. Add filter stats to backend response
3. Test with various query patterns
4. Deploy and monitor

### Phase 3: Table Filtering (Medium Risk)
1. Add filteredData and filterStats state
2. Update table component to use filtered data
3. Update header to show filter stats
4. Test with real queries
5. Deploy and monitor

### Phase 4: Full Integration (Low Risk)
1. Verify all components work together
2. Test edge cases (reload during filter, multiple filters, etc.)
3. Monitor error rates and user feedback
4. Iterate based on feedback

## Rollback Plan

If issues arise:
1. **Message persistence issues**: Clear localStorage key, users start fresh (no data loss)
2. **Filter detection issues**: Backend falls back to fresh search (slower but works)
3. **Table rendering issues**: Show unfiltered data (users see all data, can manually filter)
4. **Critical issues**: Revert to previous version, all functionality still works (just no persistence)

## Success Metrics

1. **Filter Success Rate**: % of filter queries that correctly update the table
2. **Message Restoration Rate**: % of page reloads that successfully restore messages
3. **User Satisfaction**: Reduced support tickets about "lost work" or "filter not working"
4. **Performance**: No increase in page load time or table rendering time
5. **Error Rate**: < 1% of filter operations result in errors
