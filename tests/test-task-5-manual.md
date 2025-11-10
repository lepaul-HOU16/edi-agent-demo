# Manual Testing Guide for Task 5: Filter Detection Integration

## Overview
This guide provides step-by-step instructions for manually testing the filter detection integration in the catalog page.

## Prerequisites
- Application running locally or deployed
- Access to the catalog page
- OSDU search functionality enabled

## Test Scenarios

### Scenario 1: Basic Filter Detection with OSDU Context

**Steps:**
1. Navigate to the catalog page
2. Enter query: `show me osdu wells`
3. Wait for OSDU search results to load
4. Verify you see a list of OSDU records
5. Enter query: `filter by operator Shell`
6. Verify:
   - ✅ Results are filtered (no new search performed)
   - ✅ Only wells with operator "Shell" are shown
   - ✅ Record count updates to show filtered count
   - ✅ Map updates to show only filtered wells

**Expected Behavior:**
- Filter is applied instantly without making a new OSDU API call
- Console shows: `✅ Filter intent detected, applying filter`
- Console shows: `✅ Filter applied: { originalCount: X, filteredCount: Y }`

---

### Scenario 2: Depth Filter with Numeric Operator

**Steps:**
1. Start with OSDU search results from Scenario 1
2. Enter query: `show wells with depth greater than 3000`
3. Verify:
   - ✅ Results are filtered to wells with depth > 3000m
   - ✅ Numeric comparison works correctly
   - ✅ Map updates to show only filtered wells

**Expected Behavior:**
- Filter detects depth filter with `>` operator
- Console shows: `filterType: 'depth', filterValue: '3000', filterOperator: '>'`

---

### Scenario 3: Sequential Filtering

**Steps:**
1. Start with OSDU search results
2. Enter query: `filter by operator Shell`
3. Verify filtered results (e.g., 15 wells)
4. Enter query: `show only depth > 3000`
5. Verify:
   - ✅ Second filter applies to already-filtered results
   - ✅ Record count decreases further (e.g., 15 → 8)
   - ✅ Both filters are active
   - ✅ Map shows only wells matching BOTH filters

**Expected Behavior:**
- Second filter uses `filteredRecords` as base
- Console shows: `Applying filter to already-filtered results`
- `activeFilters` array contains both filters

---

### Scenario 4: No Filter Intent (Should Proceed to Search)

**Steps:**
1. Start with OSDU search results
2. Enter query: `tell me about these wells`
3. Verify:
   - ✅ No filter is applied
   - ✅ Query proceeds to normal search intent detection
   - ✅ Results remain unchanged or new search is performed

**Expected Behavior:**
- Console shows: `No filter intent detected, continuing to search intent detection`
- No filter is applied

---

### Scenario 5: Filter Without OSDU Context (Should Not Filter)

**Steps:**
1. Start with a fresh catalog page (no OSDU search performed)
2. Enter query: `filter by operator Shell`
3. Verify:
   - ✅ Filter detection is skipped (no context)
   - ✅ Query proceeds to normal search intent
   - ✅ May trigger a new catalog search

**Expected Behavior:**
- Console shows: `No OSDU context - filter detection skipped`
- No filter is applied, proceeds to search

---

### Scenario 6: Location Filter

**Steps:**
1. Start with OSDU search results
2. Enter query: `show only location Norway`
3. Verify:
   - ✅ Results filtered to wells in Norway
   - ✅ Case-insensitive matching works
   - ✅ Map updates to show only Norwegian wells

**Expected Behavior:**
- Filter detects location filter
- Console shows: `filterType: 'location', filterValue: 'norway'`

---

### Scenario 7: Type Filter

**Steps:**
1. Start with OSDU search results
2. Enter query: `show me type production`
3. Verify:
   - ✅ Results filtered to production wells
   - ✅ Type matching works correctly

**Expected Behavior:**
- Filter detects type filter
- Console shows: `filterType: 'type', filterValue: 'production'`

---

## Console Debugging

### Key Console Messages to Look For

**When filter is detected:**
```
🔍 OSDU context exists, checking for filter intent...
✅ Filter intent detected, applying filter: { filterType, filterValue, filterOperator }
🔧 Applying filter: { filterType, filterValue, filterOperator, recordCount }
✅ Filter applied: { originalCount, filteredCount }
```

**When filter is NOT detected:**
```
🔍 OSDU context exists, checking for filter intent...
🔍 No filter intent detected, continuing to search intent detection
🎯 Search intent: osdu
```

**When no OSDU context:**
```
🚀 PROCESSING CATALOG SEARCH: [query]
🎯 Search intent: catalog
```

## Validation Checklist

After testing all scenarios, verify:

- [ ] Filter detection only works when OSDU context exists
- [ ] Filter intent is checked BEFORE search intent
- [ ] Filters apply instantly without new API calls
- [ ] Sequential filters work on already-filtered results
- [ ] Map updates correctly with filtered results
- [ ] Record counts update correctly
- [ ] Console logs show correct filter detection
- [ ] No TypeScript errors in browser console
- [ ] No infinite loops or performance issues

## Troubleshooting

### Issue: Filter not detected
**Check:**
- Is there OSDU context? (Did you perform an OSDU search first?)
- Does the query contain filter keywords? (filter, show only, where, with, operator, location, depth, type, status)
- Check console for: `No filter intent detected`

### Issue: Filter applied but no results
**Check:**
- Are the filter criteria too restrictive?
- Check console for: `filteredCount: 0`
- Try broadening the filter criteria

### Issue: Map not updating
**Check:**
- Are you on the map panel (seg-1)?
- Do filtered wells have coordinates?
- Check console for: `Updating map with filtered results`

## Success Criteria

✅ All 7 scenarios work as expected
✅ Console logs show correct filter detection flow
✅ No errors in browser console
✅ Filters apply instantly without new searches
✅ Sequential filtering works correctly
✅ Map updates reflect filtered results

## Notes

- Filter detection uses case-insensitive matching for text fields
- Depth filters support >, <, and = operators
- Filters are cumulative (sequential filters narrow results further)
- Original unfiltered results are preserved in `osduContext.records`
