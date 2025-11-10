# Manual Test: Sequential Filter Support (Task 9)

## Overview
This test verifies that multiple filters can be applied in sequence to OSDU search results, with each new filter applied to the already-filtered results.

## Requirements Tested
- **8.1**: System updates context with filtered results
- **8.2**: Second filter applied to already-filtered results  
- **8.3**: System maintains filter history
- **8.5**: System displays cumulative filter criteria

## Prerequisites
- Access to the Data Catalog page
- OSDU search functionality working
- Sample OSDU data available with multiple operators, locations, and depths

## Test Steps

### Step 1: Perform Initial OSDU Search
1. Navigate to the Data Catalog page
2. Enter query: `show me osdu wells`
3. Wait for results to load

**Expected Result:**
- OSDU search results displayed in table format
- Multiple wells shown with various operators, locations, and depths
- Message indicates total number of records found

### Step 2: Apply First Filter (Location)
1. In the chat input, enter: `filter by location Norway`
2. Submit the query

**Expected Result:**
- ✅ Results filtered to show only wells in Norway
- ✅ Message displays: "Applied filter: location containing 'Norway'"
- ✅ Shows count like "Found X of Y records matching your criteria"
- ✅ Table updates to show only filtered results
- ✅ Map updates to show only filtered well locations
- ✅ Tip message suggests: "You can apply additional filters or use 'show all' to reset"

**Verification:**
- Count all displayed wells - should only show wells with location = Norway
- Original total count should still be visible in the message

### Step 3: Apply Second Filter (Operator) - Sequential
1. In the chat input, enter: `show only operator Shell`
2. Submit the query

**Expected Result:**
- ✅ Results filtered further to show only Shell wells in Norway
- ✅ Message displays: "Applied 2 filters: location containing 'Norway', operator containing 'Shell'"
- ✅ Shows count like "Found X of Y records" (X should be less than previous count)
- ✅ Table shows only wells matching BOTH filters
- ✅ Map shows only wells matching BOTH filters

**Verification:**
- All displayed wells should have:
  - Location = Norway
  - Operator = Shell
- Count should be less than or equal to the count after first filter
- Message should show "Applied 2 filters" with both filter descriptions

### Step 4: Apply Third Filter (Depth) - Sequential
1. In the chat input, enter: `filter depth greater than 3500`
2. Submit the query

**Expected Result:**
- ✅ Results filtered further to show only Shell wells in Norway with depth > 3500m
- ✅ Message displays: "Applied 3 filters: location containing 'Norway', operator containing 'Shell', depth > '3500'"
- ✅ Shows count like "Found X of Y records" (X should be less than or equal to previous count)
- ✅ Table shows only wells matching ALL THREE filters
- ✅ Map shows only wells matching ALL THREE filters

**Verification:**
- All displayed wells should have:
  - Location = Norway
  - Operator = Shell
  - Depth > 3500m
- Count should be less than or equal to the count after second filter
- Message should show "Applied 3 filters" with all three filter descriptions
- Original total count should still be visible

### Step 5: Verify Filter History
1. Scroll through the chat messages
2. Review each filter application message

**Expected Result:**
- ✅ Each filter message shows cumulative filter count
- ✅ First filter: "Applied filter: location containing 'Norway'"
- ✅ Second filter: "Applied 2 filters: location containing 'Norway', operator containing 'Shell'"
- ✅ Third filter: "Applied 3 filters: location containing 'Norway', operator containing 'Shell', depth > '3500'"
- ✅ Each message shows progressively fewer results

### Step 6: Reset Filters
1. In the chat input, enter: `show all`
2. Submit the query

**Expected Result:**
- ✅ All original OSDU results displayed again
- ✅ Message displays: "Filters Reset"
- ✅ Shows original total count
- ✅ Table shows all original wells
- ✅ Map shows all original well locations

**Verification:**
- Count should match the original OSDU search count
- All wells from original search should be visible

### Step 7: Apply Different Sequential Filters
1. Enter: `filter by operator BP`
2. Wait for results
3. Enter: `show only type exploration`
4. Wait for results

**Expected Result:**
- ✅ After first filter: Only BP wells shown
- ✅ After second filter: Only BP exploration wells shown
- ✅ Message shows: "Applied 2 filters: operator containing 'BP', type containing 'exploration'"
- ✅ Each filter narrows down the results further

## Success Criteria

### ✅ All tests pass if:
1. **Sequential Application**: Each new filter is applied to the already-filtered results, not the original results
2. **Cumulative Display**: Filter messages show all active filters, not just the latest one
3. **Filter History**: activeFilters array grows with each filter application
4. **Context Update**: osduContext is updated with filteredRecords and activeFilters after each filter
5. **Progressive Narrowing**: Result count decreases or stays the same with each filter (never increases)
6. **Original Preservation**: Original records are preserved and can be restored with "show all"

### ❌ Test fails if:
1. Second filter is applied to original results instead of filtered results
2. Filter messages don't show cumulative filter criteria
3. Result count increases after applying a filter
4. Original records are lost or modified
5. "show all" doesn't restore original results

## Edge Cases to Test

### Edge Case 1: Filter That Returns Zero Results
1. Apply filter: `filter by location Antarctica`
2. **Expected**: Message shows "No results found" with suggestions
3. Apply another filter: `show only operator Shell`
4. **Expected**: Still shows zero results with cumulative filter description

### Edge Case 2: Filter That Doesn't Change Results
1. Apply filter: `filter by location Norway`
2. Note the count (e.g., 7 wells)
3. Apply filter: `show only depth > 0`
4. **Expected**: Same count (all wells have depth > 0), but message shows 2 filters applied

### Edge Case 3: Many Sequential Filters
1. Apply 5+ filters in sequence
2. **Expected**: All filters shown in cumulative message
3. **Expected**: Results progressively narrow down
4. **Expected**: Original count still visible

## Notes
- Sequential filters should feel natural and conversational
- Each filter should build on the previous results
- Users should be able to progressively narrow down to exactly what they need
- The cumulative filter display helps users understand what filters are active
- "show all" provides an easy way to start over

## Automated Test
Run the automated test to verify the logic:
```bash
node tests/test-sequential-filters.js
```

This test verifies the core filtering logic with mock data.
