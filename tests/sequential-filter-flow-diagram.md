# Sequential Filter Flow Diagram

## Visual Representation of Sequential Filtering

```
┌─────────────────────────────────────────────────────────────────────┐
│                     OSDU SEARCH RESULTS                              │
│                                                                      │
│  User Query: "show me osdu wells"                                   │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  osduContext.records = [100 wells]                          │    │
│  │  osduContext.filteredRecords = undefined                    │    │
│  │  osduContext.activeFilters = []                             │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     FIRST FILTER APPLIED                             │
│                                                                      │
│  User Query: "filter by location Norway"                            │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  baseRecords = osduContext.records (100 wells)              │    │
│  │  ↓ Apply filter: location contains "Norway"                │    │
│  │  filteredRecords = [45 wells in Norway]                     │    │
│  │                                                              │    │
│  │  osduContext.records = [100 wells] ← PRESERVED              │    │
│  │  osduContext.filteredRecords = [45 wells]                   │    │
│  │  osduContext.activeFilters = [                              │    │
│  │    { type: 'location', value: 'Norway', operator: 'contains' }  │
│  │  ]                                                           │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Display: "Applied filter: location containing 'Norway'"            │
│           "Found 45 of 100 records"                                 │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SECOND FILTER APPLIED                             │
│                                                                      │
│  User Query: "show only operator Shell"                             │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  baseRecords = osduContext.filteredRecords (45 wells) ←KEY │    │
│  │  ↓ Apply filter: operator contains "Shell"                 │    │
│  │  filteredRecords = [18 Shell wells in Norway]              │    │
│  │                                                              │    │
│  │  osduContext.records = [100 wells] ← STILL PRESERVED        │    │
│  │  osduContext.filteredRecords = [18 wells]                   │    │
│  │  osduContext.activeFilters = [                              │    │
│  │    { type: 'location', value: 'Norway', operator: 'contains' }, │
│  │    { type: 'operator', value: 'Shell', operator: 'contains' }   │
│  │  ]                                                           │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Display: "Applied 2 filters: location containing 'Norway',         │
│            operator containing 'Shell'"                             │
│           "Found 18 of 100 records"                                 │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     THIRD FILTER APPLIED                             │
│                                                                      │
│  User Query: "filter depth greater than 3500"                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  baseRecords = osduContext.filteredRecords (18 wells) ←KEY │    │
│  │  ↓ Apply filter: depth > 3500                              │    │
│  │  filteredRecords = [7 deep Shell wells in Norway]          │    │
│  │                                                              │    │
│  │  osduContext.records = [100 wells] ← STILL PRESERVED        │    │
│  │  osduContext.filteredRecords = [7 wells]                    │    │
│  │  osduContext.activeFilters = [                              │    │
│  │    { type: 'location', value: 'Norway', operator: 'contains' }, │
│  │    { type: 'operator', value: 'Shell', operator: 'contains' },  │
│  │    { type: 'depth', value: '3500', operator: '>' }          │    │
│  │  ]                                                           │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Display: "Applied 3 filters: location containing 'Norway',         │
│            operator containing 'Shell', depth > '3500'"             │
│           "Found 7 of 100 records"                                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        RESET FILTERS                                 │
│                                                                      │
│  User Query: "show all"                                             │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  osduContext.records = [100 wells] ← RESTORED               │    │
│  │  osduContext.filteredRecords = undefined                    │    │
│  │  osduContext.activeFilters = []                             │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Display: "Filters Reset"                                           │
│           "Showing all 100 original results"                        │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Implementation Details

### 1. Base Records Selection (Line 866)
```typescript
const baseRecords = osduContext.filteredRecords || osduContext.records;
```
- **First filter**: Uses `osduContext.records` (original 100 wells)
- **Second filter**: Uses `osduContext.filteredRecords` (45 filtered wells)
- **Third filter**: Uses `osduContext.filteredRecords` (18 filtered wells)
- **Result**: Each filter builds on the previous results

### 2. Filter History Accumulation (Line 884)
```typescript
activeFilters: [...(osduContext.activeFilters || []), newFilter]
```
- **First filter**: `activeFilters = [filter1]`
- **Second filter**: `activeFilters = [filter1, filter2]`
- **Third filter**: `activeFilters = [filter1, filter2, filter3]`
- **Result**: Complete history of all applied filters

### 3. Cumulative Display (Lines 903-909)
```typescript
const filterSummary = allFilters.length > 1 
  ? `Applied ${allFilters.length} filters: ${allFilters.map(f => ...).join(', ')}`
  : `Applied filter: ${filterDescription}`;
```
- **First filter**: "Applied filter: location containing 'Norway'"
- **Second filter**: "Applied 2 filters: location containing 'Norway', operator containing 'Shell'"
- **Third filter**: "Applied 3 filters: location containing 'Norway', operator containing 'Shell', depth > '3500'"
- **Result**: Users always see all active filters

### 4. Original Preservation
```typescript
osduContext.records = [100 wells]  // Never modified
```
- Original records always preserved in `osduContext.records`
- Filtered results stored separately in `osduContext.filteredRecords`
- "show all" restores original by clearing `filteredRecords`

## Progressive Narrowing Example

```
100 wells (original)
  ↓ location = Norway
45 wells (45% of original)
  ↓ operator = Shell
18 wells (40% of previous, 18% of original)
  ↓ depth > 3500m
7 wells (39% of previous, 7% of original)
```

## Why This Matters

### ❌ Without Sequential Filtering
```
User: "show me osdu wells"
AI: 100 wells

User: "filter by location Norway"
AI: 45 wells

User: "show only operator Shell"
AI: 30 wells ← WRONG! Applied to original 100, not filtered 45
```

### ✅ With Sequential Filtering
```
User: "show me osdu wells"
AI: 100 wells

User: "filter by location Norway"
AI: 45 wells

User: "show only operator Shell"
AI: 18 wells ← CORRECT! Applied to filtered 45, not original 100
```

## Benefits

1. **Natural Conversation**: Users can refine results step-by-step
2. **Predictable Behavior**: Each filter narrows down results further
3. **Transparency**: Users see all active filters at once
4. **Flexibility**: Easy to reset and start over
5. **Efficiency**: No need to specify all criteria in one query
