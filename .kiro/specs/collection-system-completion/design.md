# Design Document

## Overview

The Collection System Completion design addresses critical functionality gaps in the existing beta collection system. The design focuses on fixing pagination issues, implementing proper data context inheritance, enhancing modal responsiveness, and integrating collection management into the main navigation. The system will maintain OSDU compatibility while supporting diverse data sources, and will eventually replace the /listChats interface with a unified collection-centric workspace management system.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Top Navigation                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Data Catalog │  │  Workspace   │  │    Tools     │      │
│  │ - View All   │  │ - View All   │  │              │      │
│  │   Data       │  │   Canvases   │  │              │      │
│  │ - View All   │  │ - Create New │  │              │      │
│  │   Collections│  │   Canvas     │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
           │                    │
           ▼                    ▼
┌──────────────────┐  ┌──────────────────────────┐
│  Data Catalog    │  │  Collection Manager      │
│  - Map View      │  │  - Collections Grid      │
│  - Table View    │  │  - Canvas List           │
│  - Filter/Search │  │  - Pagination (10/page)  │
│  - Create        │  └──────────────────────────┘
│    Collection    │            │
│    Modal         │            ▼
└──────────────────┘  ┌──────────────────────────┐
           │          │  Canvas View (All)       │
           │          │  - Filter by Collection  │
           │          │  - Pagination (25/page)  │
           │          │  - /listChats styling    │
           │          └──────────────────────────┘
           │                    │
           └────────┬───────────┘
                    ▼
          ┌──────────────────────┐
          │  Canvas/Chat Session │
          │  - Linked Collection │
          │  - Data Context      │
          │  - AI Agent Access   │
          └──────────────────────┘
```

### Data Flow

```
User Query in Catalog
    ↓
Filter/Search Data
    ↓
"Create Collection" Prompt
    ↓
Modal Opens (60% width, centered, 100px margins)
    ↓
User Enters Title/Description
    ↓
User Deselects Unwanted Data Points
    ↓
Collection Created in DynamoDB
    ↓
Navigate to Collection Detail Page
    ↓
User Creates Canvas from Collection
    ↓
Canvas Inherits Collection Data Context
    ↓
AI Agent Queries Limited to Collection Data
    ↓
(Optional) User Approves Expanded Data Access
```

## Components and Interfaces

### 1. Collection Creation Modal Component

**Location:** `src/components/CollectionCreationModal.tsx`

**Purpose:** Responsive modal for creating collections from catalog data

**Props:**
```typescript
interface CollectionCreationModalProps {
  visible: boolean;
  onDismiss: () => void;
  dataItems: DataItem[];
  onCreateCollection: (collection: CollectionInput) => Promise<void>;
  creating: boolean;
}

interface DataItem {
  id: string;
  name: string;
  type: string;
  location: string;
  depth: string;
  operator: string;
  coordinates: [number, number];
}

interface CollectionInput {
  name: string;
  description: string;
  selectedItems: DataItem[];
}
```

**Styling:**
- Width: 60% of viewport width (90% on mobile)
- Position: Centered horizontally
- Top margin: 100px from viewport top
- Bottom margin: 100px from viewport bottom
- Max height: `calc(100vh - 200px)`
- Overflow: Auto scroll for content

**Implementation:**
```typescript
const modalStyles = {
  width: isMobile ? '90vw' : '60vw',
  maxHeight: 'calc(100vh - 200px)',
  position: 'fixed',
  top: '100px',
  left: '50%',
  transform: 'translateX(-50%)',
  overflow: 'auto'
};
```

### 2. Collection Manager Page Enhancement

**Location:** `src/app/collections/page.tsx`

**Current Issues:**
- Only shows 3 collections at a time
- New collection replaces existing one
- No proper pagination

**Fixes:**
```typescript
// State management
const [collections, setCollections] = useState<Collection[]>([]);
const [currentPage, setCurrentPage] = useState(1);
const [totalCollections, setTotalCollections] = useState(0);
const ITEMS_PER_PAGE = 10;

// Pagination calculation
const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
const endIndex = startIndex + ITEMS_PER_PAGE;
const paginatedCollections = collections.slice(startIndex, endIndex);

// Load collections with proper state management
const loadCollections = async () => {
  const response = await amplifyClient.queries.collectionQuery({
    operation: 'listCollections'
  });
  
  if (response.data) {
    const result = JSON.parse(response.data);
    // CRITICAL: Replace entire array, don't splice
    setCollections(result.collections || []);
    setTotalCollections(result.collections?.length || 0);
  }
};
```

### 3. Canvas List Page (View All Canvases)

**Location:** `src/app/canvases/page.tsx` (new file)

**Purpose:** Unified view of all canvases with collection filtering

**Features:**
- Display all canvases across collections
- Dropdown filter to show canvases by collection
- "All Collections" option to show everything
- Pagination: 25 canvases per page
- Card styling matching /listChats

**Component Structure:**
```typescript
interface CanvasListPageProps {}

interface CanvasCard {
  id: string;
  name: string;
  createdAt: string;
  linkedCollectionId?: string;
  collectionName?: string;
}

const CanvasListPage = () => {
  const [canvases, setCanvases] = useState<CanvasCard[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 25;
  
  // Filter canvases by collection
  const filteredCanvases = selectedCollection === 'all'
    ? canvases
    : canvases.filter(c => c.linkedCollectionId === selectedCollection);
  
  // Pagination
  const paginatedCanvases = filteredCanvases.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  return (
    <ContentLayout>
      <Select
        selectedOption={{ value: selectedCollection }}
        onChange={({ detail }) => {
          setSelectedCollection(detail.selectedOption.value);
          setCurrentPage(1); // Reset to first page
        }}
        options={[
          { value: 'all', label: 'All Collections' },
          ...collections.map(c => ({ value: c.id, label: c.name }))
        ]}
      />
      <Cards
        items={paginatedCanvases}
        cardDefinition={canvasCardDefinition}
        cardsPerRow={[{ cards: 1 }, { minWidth: 300, cards: 5 }]}
      />
      <Pagination
        currentPageIndex={currentPage}
        pagesCount={Math.ceil(filteredCanvases.length / ITEMS_PER_PAGE)}
        onChange={({ detail }) => setCurrentPage(detail.currentPageIndex)}
      />
    </ContentLayout>
  );
};
```

### 4. Top Navigation Integration

**Location:** `src/app/layout.tsx`

**Changes:**
```typescript
// Data Catalog menu
{
  type: 'menu-dropdown',
  text: 'Data Catalog',
  iconName: 'map',
  items: [
    {
      id: 'catalog-main',
      text: 'View All Data',
      href: '/catalog',
    },
    {
      id: 'view-collections',
      text: 'View All Collections',
      href: '/collections',
      iconName: 'folder'
    },
    // ... existing items
  ],
}

// Workspace menu
{
  type: 'menu-dropdown',
  text: 'Workspace',
  iconName: 'gen-ai',
  items: [
    {
      id: 'view-all-canvases',
      text: 'View All Canvases',
      href: '/canvases',
      iconName: 'view-full'
    },
    {
      id: 'ws-new',
      text: 'Create New Canvas',
      iconName: 'add-plus',
      href: '/create-new-chat',
    },
    // ... existing items
  ],
}
```

### 5. Data Context Inheritance Service

**Location:** `src/services/collectionContextLoader.ts` (enhance existing)

**Purpose:** Ensure canvases inherit and respect collection data context

**Key Functions:**

```typescript
interface DataContextConfig {
  collectionId: string;
  dataItems: DataItem[];
  strictMode: boolean; // Hard limit vs soft limit
  allowExpansion: boolean; // Can user approve expanded access
}

class CollectionContextService {
  /**
   * Load context for canvas with collection linkage
   */
  async loadCanvasContext(
    chatSessionId: string,
    collectionId?: string
  ): Promise<DataContextConfig | null> {
    if (!collectionId) {
      return null; // No collection, full data access
    }
    
    const collection = await this.getCollection(collectionId);
    
    return {
      collectionId,
      dataItems: collection.dataItems,
      strictMode: true, // Hard limit by default
      allowExpansion: true // User can approve expansion
    };
  }
  
  /**
   * Validate if data access is within collection context
   */
  validateDataAccess(
    requestedData: string[],
    context: DataContextConfig
  ): {
    allowed: boolean;
    requiresApproval: boolean;
    outOfScopeItems: string[];
  } {
    const collectionDataIds = new Set(
      context.dataItems.map(item => item.id)
    );
    
    const outOfScope = requestedData.filter(
      id => !collectionDataIds.has(id)
    );
    
    if (outOfScope.length === 0) {
      return { allowed: true, requiresApproval: false, outOfScopeItems: [] };
    }
    
    if (context.strictMode && !context.allowExpansion) {
      return { allowed: false, requiresApproval: false, outOfScopeItems: outOfScope };
    }
    
    return { allowed: false, requiresApproval: true, outOfScopeItems: outOfScope };
  }
  
  /**
   * Prompt user for expanded data access
   */
  async promptUserForExpansion(
    outOfScopeItems: string[]
  ): Promise<boolean> {
    // Return a message to the chat interface
    return {
      requiresUserApproval: true,
      message: `This query requires access to ${outOfScopeItems.length} data points outside your collection. Do you want to proceed?`,
      outOfScopeItems
    };
  }
}
```

### 6. Agent Data Access Control

**Location:** `amplify/functions/agents/handler.ts`

**Integration:**

```typescript
// In agent handler, before processing query
const chatSession = await getChatSession(chatSessionId);

if (chatSession.linkedCollectionId) {
  const context = await collectionContextLoader.loadCanvasContext(
    chatSessionId,
    chatSession.linkedCollectionId
  );
  
  // Pass context to agent
  const agentConfig = {
    ...baseConfig,
    dataContext: context,
    onDataAccessViolation: async (requestedData) => {
      const validation = collectionContextLoader.validateDataAccess(
        requestedData,
        context
      );
      
      if (validation.requiresApproval) {
        // Send message to user requesting approval
        return await promptUserForApproval(validation.outOfScopeItems);
      }
      
      return validation.allowed;
    }
  };
  
  const response = await agent.invoke(query, agentConfig);
}
```

## Data Models

### Collection Model (DynamoDB)

```typescript
interface Collection {
  id: string; // UUID
  owner: string; // User ID
  name: string;
  description: string;
  dataSourceType: 'OSDU' | 'S3' | 'Mixed';
  
  // Data items in collection
  dataItems: DataItem[];
  
  // Metadata
  previewMetadata: {
    wellCount: number;
    dataPointCount: number;
    createdFrom: 'catalog_search' | 'manual' | 'import';
    dataSources: string[];
  };
  
  // Geographic context
  geographicBounds?: {
    minLon: number;
    maxLon: number;
    minLat: number;
    maxLat: number;
  };
  
  // Query context (for restoration)
  queryMetadata?: {
    originalQuery: string;
    queryType: string;
    filters: any;
  };
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string;
}

interface DataItem {
  id: string;
  name: string;
  type: string;
  location: string;
  depth: string;
  operator: string;
  coordinates: [number, number];
  
  // OSDU compatibility
  osduId?: string;
  osduKind?: string;
  
  // Additional metadata
  metadata?: Record<string, any>;
}
```

### ChatSession Model Enhancement

```typescript
// Existing model in amplify/data/resource.ts
ChatSession: a.model({
  name: a.string(),
  messages: a.hasMany("ChatMessage", "chatSessionId"),
  workSteps: a.ref("WorkStep").array(),
  
  // ENHANCED: Collection integration
  linkedCollectionId: a.string(),
  collectionContext: a.json(), // Cached collection data
  
  // NEW: Data access tracking
  dataAccessLog: a.json().array(), // Track when user approves expanded access
})
```

### Canvas-Collection Link Tracking

```typescript
interface CanvasCollectionLink {
  canvasId: string; // ChatSession ID
  collectionId: string;
  linkedAt: string;
  dataContextMode: 'strict' | 'soft';
  expansionApprovals: {
    timestamp: string;
    requestedData: string[];
    approved: boolean;
  }[];
}
```

## Error Handling

### Collection Creation Errors

```typescript
try {
  const response = await amplifyClient.mutations.collectionManagement({
    operation: 'createCollection',
    name: collectionName,
    description: collectionDescription,
    dataSourceType: 'Mixed',
    previewMetadata: JSON.stringify(metadata)
  });
  
  if (!response.data) {
    throw new Error('No response from collection service');
  }
  
  const result = JSON.parse(response.data);
  
  if (!result.success) {
    throw new Error(result.error || 'Collection creation failed');
  }
  
  // Navigate to collection detail page
  router.push(`/collections/${result.collectionId}`);
  
} catch (error) {
  console.error('Collection creation error:', error);
  
  // User-friendly error messages
  if (error.message.includes('DynamoDB')) {
    alert('Database error. Please try again.');
  } else if (error.message.includes('timeout')) {
    alert('Request timed out. Please check your connection.');
  } else {
    alert(`Failed to create collection: ${error.message}`);
  }
}
```

### Pagination Errors

```typescript
// Prevent pagination state corruption
const loadCollections = async () => {
  try {
    setLoading(true);
    const response = await amplifyClient.queries.collectionQuery({
      operation: 'listCollections'
    });
    
    if (response.data) {
      const result = JSON.parse(response.data);
      
      // CRITICAL: Always replace entire array
      setCollections(result.collections || []);
      
      // Reset to page 1 if current page is now out of bounds
      const maxPage = Math.ceil(result.collections.length / ITEMS_PER_PAGE);
      if (currentPage > maxPage) {
        setCurrentPage(1);
      }
    }
  } catch (error) {
    console.error('Error loading collections:', error);
    // Don't clear existing collections on error
    alert('Failed to load collections. Showing cached data.');
  } finally {
    setLoading(false);
  }
};
```

### Data Context Violations

```typescript
// When agent attempts to access out-of-scope data
const handleDataAccessViolation = async (
  outOfScopeItems: string[],
  context: DataContextConfig
) => {
  // Create approval request message
  const approvalMessage: Message = {
    id: uuidv4(),
    role: 'system',
    content: {
      text: `⚠️ **Data Access Request**\n\nThis query requires access to ${outOfScopeItems.length} data points outside your collection "${context.collectionName}".\n\n**Out of scope items:**\n${outOfScopeItems.slice(0, 5).join(', ')}${outOfScopeItems.length > 5 ? '...' : ''}\n\n**Options:**\n1. Approve expanded access (one-time)\n2. Rephrase query to use collection data only\n3. Cancel query\n\nReply "approve" to proceed with expanded access.`
    },
    requiresApproval: true,
    approvalContext: {
      type: 'data_access_expansion',
      outOfScopeItems,
      collectionId: context.collectionId
    }
  };
  
  return approvalMessage;
};
```

## Testing Strategy

### Unit Tests

1. **Collection Creation Modal**
   - Test modal sizing at different viewport widths
   - Test data item selection/deselection
   - Test form validation
   - Test responsive behavior

2. **Pagination Logic**
   - Test page calculation with various item counts
   - Test boundary conditions (0 items, 1 item, exact page size)
   - Test page reset on filter change
   - Test state preservation on navigation

3. **Data Context Service**
   - Test context loading for linked canvases
   - Test data access validation
   - Test approval flow
   - Test context caching

### Integration Tests

1. **Collection Creation Flow**
   - User filters data in catalog
   - User prompts "create collection"
   - Modal opens with correct sizing
   - User creates collection
   - Navigation to collection detail page
   - Collection appears in list

2. **Canvas-Collection Linking**
   - User creates canvas from collection
   - Canvas inherits collection data context
   - Agent queries respect data context
   - User approves expanded access
   - Access logged correctly

3. **Navigation Integration**
   - "View All Collections" link works
   - "View All Canvases" link works
   - Collection filter dropdown works
   - Pagination works across all views

### End-to-End Tests

1. **Complete User Workflow**
   - Login
   - Navigate to catalog
   - Search/filter data
   - Create collection
   - View collection in manager
   - Create canvas from collection
   - Query with AI agent
   - Verify data context limits
   - Approve expanded access
   - Verify access logged

2. **Pagination Stress Test**
   - Create 50+ collections
   - Verify all show correctly
   - Navigate through all pages
   - Create new collection
   - Verify it appears without dropping others

## Performance Considerations

### Collection List Loading

- Implement virtual scrolling for large collection lists
- Cache collection metadata in browser localStorage
- Lazy load collection preview images
- Paginate backend queries (don't load all collections at once)

### Data Context Caching

- Cache collection data context in ChatSession model
- Refresh cache only when collection is modified
- Use TTL of 30 minutes for context cache
- Invalidate cache on collection update

### Modal Rendering

- Use React.memo for modal components
- Lazy load modal content until opened
- Debounce search/filter in data item table
- Virtualize data item list for large collections

## Security Considerations

### Data Access Control

- Verify user owns collection before allowing access
- Validate collection ID in all backend operations
- Log all data access expansions for audit
- Implement rate limiting on collection creation

### Input Validation

- Sanitize collection names and descriptions
- Validate data item IDs before adding to collection
- Prevent XSS in collection metadata
- Limit collection size (max 10,000 items)

## Migration Strategy

### Phase 1: Fix Existing Issues (Week 1)
- Fix pagination in collection manager
- Fix modal responsiveness
- Add navigation links
- Deploy and test

### Phase 2: Canvas Integration (Week 2)
- Create "View All Canvases" page
- Implement collection filtering
- Add canvas-collection linking
- Deploy and test

### Phase 3: Data Context (Week 3)
- Implement data context inheritance
- Add agent access control
- Implement approval flow
- Deploy and test

### Phase 4: Replace /listChats (Week 4)
- Redirect /listChats to collection manager
- Migrate existing canvases
- Update documentation
- Final deployment

## Rollback Plan

If issues arise:
1. Revert navigation changes (keep old links)
2. Disable collection filtering (show all canvases)
3. Disable data context enforcement (allow all access)
4. Keep /listChats as primary interface
5. Fix issues in development environment
6. Redeploy when stable
