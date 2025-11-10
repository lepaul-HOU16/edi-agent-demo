# Filter Help Command Workflow

## Complete Filtering Workflow with Help

```
┌─────────────────────────────────────────────────────────────┐
│                    User Performs OSDU Search                 │
│                  "show me osdu wells"                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              OSDU Results Displayed (50 records)             │
│              OSDU Context Stored in State                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   User Types Query                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
              ┌──────────┴──────────┐
              │  Query Analysis     │
              └──────────┬──────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌────────┐     ┌─────────┐    ┌──────────┐
    │ "help" │     │ "filter"│    │"show all"│
    └────┬───┘     └────┬────┘    └────┬─────┘
         │              │              │
         ▼              ▼              ▼
┌─────────────┐  ┌──────────────┐  ┌──────────┐
│ TASK 10:    │  │ TASK 5:      │  │ TASK 8:  │
│ Display     │  │ Apply Filter │  │ Reset    │
│ Help        │  │              │  │ Filters  │
└─────┬───────┘  └──────┬───────┘  └────┬─────┘
      │                 │                │
      ▼                 ▼                ▼
┌─────────────────────────────────────────────┐
│         Help Message Displayed              │
│                                             │
│  📖 OSDU Filtering Help                    │
│                                             │
│  🏢 By Operator:                           │
│     - "filter by operator Shell"           │
│     - "show only operator BP"              │
│                                             │
│  📍 By Location/Country:                   │
│     - "filter by location Norway"          │
│     - "show only country USA"              │
│                                             │
│  📏 By Depth:                              │
│     - "depth greater than 3000"            │
│     - "filter depth > 5000"                │
│     - "depth < 2000"                       │
│                                             │
│  🔧 By Type:                               │
│     - "filter by type production"          │
│     - "show only type exploration"         │
│                                             │
│  📊 By Status:                             │
│     - "filter by status active"            │
│     - "show only status producing"         │
│                                             │
│  🔄 Reset Filters:                         │
│     - "show all"                           │
│     - "reset filters"                      │
│                                             │
│  💡 Tips:                                  │
│     - Apply multiple filters in sequence   │
│     - Use "show all" to reset              │
│                                             │
│  📊 Current Context:                       │
│     - Total OSDU records: 50               │
│     - Active filters: 0                    │
│     - Currently showing: 50 records        │
└─────────────────────────────────────────────┘
```

## Help Command Integration Points

### 1. Entry Point
```
User Query → Check OSDU Context → Check for "help" keyword
```

### 2. Execution Flow
```
Detect "help" or "how to filter"
    ↓
Verify OSDU context exists
    ↓
Build help message with:
    - All filter type examples
    - Reset instructions
    - Current context info
    ↓
Display message in chat
    ↓
Early return (no search)
```

### 3. Context Awareness
```
Help message adapts to current state:

No Filters Applied:
- Active filters: 0
- Currently showing: 50 records (all)

With Filters Applied:
- Active filters: 2
- Currently showing: 15 records (filtered)

After Reset:
- Active filters: 0
- Currently showing: 50 records (all)
```

## Example User Workflows

### Workflow 1: Help Before Filtering
```
1. User: "show me osdu wells"
   → 50 OSDU records displayed

2. User: "help"
   → Help message shows all filter examples
   → Context: 0 filters, showing 50 records

3. User: "filter by operator Shell"
   → Filtered to 15 records
   → Context updated

4. User: "help"
   → Help message shows all filter examples
   → Context: 1 filter, showing 15 records
```

### Workflow 2: Help After Filtering
```
1. User: "show me osdu wells"
   → 50 OSDU records displayed

2. User: "filter by operator Shell"
   → Filtered to 15 records

3. User: "show only depth > 3000"
   → Filtered to 8 records

4. User: "help"
   → Help message shows all filter examples
   → Context: 2 filters, showing 8 records
   → User sees they can apply more filters or reset
```

### Workflow 3: Help After Reset
```
1. User: "show me osdu wells"
   → 50 OSDU records displayed

2. User: "filter by operator Shell"
   → Filtered to 15 records

3. User: "show all"
   → Reset to 50 records

4. User: "help"
   → Help message shows all filter examples
   → Context: 0 filters, showing 50 records
   → User can start fresh filtering
```

## Help Command Characteristics

### ✅ Advantages
- **Always Available**: Can be requested at any time
- **Context-Aware**: Shows current filter state
- **Comprehensive**: All filter types covered
- **Non-Destructive**: Doesn't change any state
- **Instant**: No API calls or loading
- **Educational**: Teaches filter syntax

### 🎯 Use Cases
1. **First-time users**: Learn available filters
2. **Forgotten syntax**: Quick reference
3. **After errors**: See correct examples
4. **Complex filtering**: Understand options
5. **Mid-workflow**: Check what's possible

### 🔒 Constraints
- Only works with OSDU context (after OSDU search)
- Read-only operation (no state changes)
- Static examples (not data-driven)
- No interactive elements (text-only)

## Integration with Other Tasks

```
Task 1-2: OSDU Context Storage
    ↓
Task 3: Filter Intent Detection
    ↓
Task 4: Filter Application
    ↓
Task 5: Filter Integration
    ↓
Task 6: Filter Display
    ↓
Task 7: Zero Results Handling
    ↓
Task 8: Filter Reset
    ↓
Task 9: Sequential Filters
    ↓
Task 10: Filter Help ← YOU ARE HERE
    ↓
Task 11: Error Handling (Missing Context)
    ↓
Task 12: Error Handling (Invalid Filters)
```

## Success Indicators

When help command is working correctly:

✅ User types "help" → Help displays immediately
✅ All 5 filter types have examples
✅ Reset instructions are clear
✅ Current context is accurate
✅ No state changes occur
✅ User can immediately try examples
✅ Works at any point in workflow

## Next Steps

After Task 10 completion:
1. **Task 11**: Add error handling for missing context
2. **Task 12**: Add error handling for invalid filters
3. **Task 13**: Add filter hints to OSDU results
4. **Task 17-20**: Implement pagination
5. **Task 21**: Test pagination functionality
