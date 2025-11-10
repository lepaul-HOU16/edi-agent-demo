# Manual Test Guide: Filter Reset Functionality (Task 8)

## Overview
This guide helps you manually test the filter reset functionality in the browser.

## Prerequisites
- Application running locally or deployed
- Access to the Data Catalog page
- OSDU search functionality working

## Test Scenario 1: Basic Filter Reset with "show all"

### Steps:
1. Navigate to the Data Catalog page
2. Enter an OSDU search query:
   ```
   show me osdu wells
   ```
3. Wait for results to display (should show multiple OSDU records)
4. Apply a filter:
   ```
   filter by operator Shell
   ```
5. Verify filtered results are displayed (fewer records)
6. Reset filters:
   ```
   show all
   ```

### Expected Results:
- ✅ Original unfiltered results are displayed
- ✅ Message shows "🔄 **Filters Reset**"
- ✅ Message indicates "Showing all X original results"
- ✅ Record count matches original search count
- ✅ Map updates to show all original wells
- ✅ No filters are active

## Test Scenario 2: Basic Filter Reset with "reset"

### Steps:
1. Navigate to the Data Catalog page
2. Enter an OSDU search query:
   ```
   show me osdu wells
   ```
3. Apply a depth filter:
   ```
   show only depth > 3000
   ```
4. Verify filtered results are displayed
5. Reset filters:
   ```
   reset filters
   ```

### Expected Results:
- ✅ Original unfiltered results are displayed
- ✅ Message shows "🔄 **Filters Reset**"
- ✅ All original records are shown
- ✅ Map displays all original well locations

## Test Scenario 3: Reset After Multiple Filters

### Steps:
1. Navigate to the Data Catalog page
2. Enter an OSDU search query:
   ```
   show me osdu wells
   ```
3. Apply first filter:
   ```
   filter by operator Shell
   ```
4. Apply second filter:
   ```
   show only depth > 3000
   ```
5. Verify cumulative filtering (fewer records)
6. Reset all filters:
   ```
   show all
   ```

### Expected Results:
- ✅ All filters are cleared
- ✅ Original unfiltered results are displayed
- ✅ Record count matches original search
- ✅ Both filters are removed from context

## Test Scenario 4: Case Insensitivity

### Steps:
1. Navigate to the Data Catalog page
2. Perform OSDU search and apply a filter
3. Try different case variations:
   - `SHOW ALL`
   - `Show All`
   - `show ALL`
   - `RESET`
   - `Reset`
   - `reset`

### Expected Results:
- ✅ All case variations trigger filter reset
- ✅ Original results are displayed for each variation

## Test Scenario 5: Reset in Longer Queries

### Steps:
1. Navigate to the Data Catalog page
2. Perform OSDU search and apply a filter
3. Try reset with natural language:
   - `can you show all the results please`
   - `I want to reset the filters`
   - `please show all records`
   - `reset everything and start over`

### Expected Results:
- ✅ Reset is detected in longer queries
- ✅ Filters are cleared
- ✅ Original results are displayed

## Test Scenario 6: No Reset Without OSDU Context

### Steps:
1. Navigate to the Data Catalog page (fresh session)
2. Try reset without any OSDU search:
   ```
   show all
   ```

### Expected Results:
- ✅ No error occurs
- ✅ System handles gracefully (no OSDU context to reset)
- ✅ May perform a new search or show appropriate message

## Test Scenario 7: Reset After Zero Results Filter

### Steps:
1. Navigate to the Data Catalog page
2. Perform OSDU search
3. Apply a filter that returns zero results:
   ```
   filter by operator NonExistentOperator
   ```
4. Verify "No Results Found" message
5. Reset filters:
   ```
   show all
   ```

### Expected Results:
- ✅ Original results are restored
- ✅ All records are displayed again
- ✅ Map shows all original well locations

## Test Scenario 8: Map Updates After Reset

### Steps:
1. Navigate to the Data Catalog page
2. Perform OSDU search with geographic results
3. Switch to Map panel (seg-1)
4. Verify wells are displayed on map
5. Switch back to Chat panel
6. Apply a location filter:
   ```
   filter by location Norway
   ```
7. Switch to Map panel
8. Verify filtered wells on map
9. Switch back to Chat panel
10. Reset filters:
    ```
    show all
    ```
11. Switch to Map panel

### Expected Results:
- ✅ Map shows filtered wells after filter
- ✅ Map shows all original wells after reset
- ✅ Map bounds update correctly
- ✅ All well markers are visible

## Test Scenario 9: Apply New Filter After Reset

### Steps:
1. Navigate to the Data Catalog page
2. Perform OSDU search
3. Apply a filter
4. Reset filters:
   ```
   show all
   ```
5. Apply a different filter:
   ```
   filter by type production
   ```

### Expected Results:
- ✅ New filter is applied to original records
- ✅ Filtered results are displayed
- ✅ System works correctly after reset

## Test Scenario 10: Multiple Resets

### Steps:
1. Navigate to the Data Catalog page
2. Perform OSDU search
3. Apply filter → Reset → Apply filter → Reset → Apply filter → Reset

### Expected Results:
- ✅ Each reset works correctly
- ✅ Original results are restored each time
- ✅ No errors or state corruption
- ✅ System remains stable

## Verification Checklist

After completing all test scenarios, verify:

- [ ] "show all" keyword triggers reset
- [ ] "reset" keyword triggers reset
- [ ] Case-insensitive detection works
- [ ] filteredRecords is cleared from context
- [ ] activeFilters is cleared from context
- [ ] Original records are preserved
- [ ] Original record count is displayed
- [ ] Reset confirmation message is shown
- [ ] Map updates with original results
- [ ] No new search is triggered after reset
- [ ] System handles reset without OSDU context
- [ ] Multiple resets work correctly
- [ ] New filters can be applied after reset

## Requirements Coverage

This test guide covers all requirements for Task 8:

- ✅ **Requirement 7.1**: System maintains both filtered and original OSDU results
- ✅ **Requirement 7.2**: Filter application doesn't modify original results array
- ✅ **Requirement 7.3**: "show all" or "reset" displays original unfiltered results
- ✅ **Requirement 7.4**: Reset clears active filter state
- ✅ **Requirement 7.5**: Original results preserved until new OSDU search

## Notes

- The reset functionality only works when OSDU context exists (after an OSDU search)
- Reset clears ALL active filters, not just the most recent one
- Original records are always preserved in the context
- Map automatically updates to show original well locations after reset
- The system prevents a new search from being triggered after reset

## Troubleshooting

If reset doesn't work:
1. Check browser console for errors
2. Verify OSDU context exists (perform OSDU search first)
3. Check that filters were applied before reset
4. Verify message format in chat
5. Check map updates correctly

## Success Criteria

✅ Task 8 is complete when:
- All test scenarios pass
- All verification checklist items are checked
- No errors in browser console
- User experience is smooth and intuitive
- Original results are always preserved and can be restored
