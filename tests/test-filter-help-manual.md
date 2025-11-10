# Manual Test Guide: Filter Help Command

## Test Overview
This guide validates the filter help command implementation for OSDU conversational filtering.

## Prerequisites
1. Navigate to the Data Catalog page
2. Perform an OSDU search first (e.g., "show me osdu wells")
3. Wait for OSDU results to load

## Test Scenarios

### Scenario 1: Basic Help Request
**Steps:**
1. After OSDU results are displayed, type: `help`
2. Press Enter

**Expected Result:**
- ✅ Help message displays immediately
- ✅ Message includes "OSDU Filtering Help" header
- ✅ Shows examples for all filter types:
  - Operator examples (Shell, BP, Chevron)
  - Location/Country examples (Norway, USA, Gulf of Mexico)
  - Depth examples (> 3000, < 5000, equals 4500)
  - Type examples (production, exploration, development)
  - Status examples (active, producing, completed)
- ✅ Shows reset instructions ("show all", "reset filters")
- ✅ Shows current context:
  - Total OSDU records count
  - Active filters count
  - Currently showing count

### Scenario 2: "How to Filter" Phrase
**Steps:**
1. After OSDU results are displayed, type: `how to filter`
2. Press Enter

**Expected Result:**
- ✅ Same comprehensive help message displays
- ✅ All filter type examples shown
- ✅ Current context information displayed

### Scenario 3: Help with Filters Applied
**Steps:**
1. After OSDU results are displayed, apply a filter: `filter by operator Shell`
2. Wait for filtered results
3. Type: `help`
4. Press Enter

**Expected Result:**
- ✅ Help message displays
- ✅ Current context shows:
  - Total OSDU records: [original count]
  - Active filters: 1
  - Currently showing: [filtered count]
- ✅ All filter examples still shown

### Scenario 4: Help After Multiple Filters
**Steps:**
1. After OSDU results are displayed, apply first filter: `filter by operator Shell`
2. Apply second filter: `show only depth > 3000`
3. Type: `help`
4. Press Enter

**Expected Result:**
- ✅ Help message displays
- ✅ Current context shows:
  - Total OSDU records: [original count]
  - Active filters: 2
  - Currently showing: [filtered count after both filters]

### Scenario 5: Case Insensitive Detection
**Steps:**
1. After OSDU results are displayed, type: `HELP` (all caps)
2. Press Enter

**Expected Result:**
- ✅ Help message displays correctly
- ✅ Case doesn't affect detection

### Scenario 6: Help Without OSDU Context
**Steps:**
1. On fresh catalog page (no OSDU search yet)
2. Type: `help`
3. Press Enter

**Expected Result:**
- ✅ Help command is NOT triggered (no OSDU context)
- ✅ Query is processed as regular catalog search or general query

## Content Validation Checklist

When help message displays, verify it includes:

### Filter Type Examples
- [ ] **Operator filters**: "filter by operator Shell", "show only operator BP"
- [ ] **Location filters**: "filter by location Norway", "show only country USA"
- [ ] **Depth filters**: "depth greater than 3000", "filter depth > 5000", "depth < 2000"
- [ ] **Type filters**: "filter by type production", "show only type exploration"
- [ ] **Status filters**: "filter by status active", "show only status producing"

### Reset Instructions
- [ ] "show all" - Display all original results
- [ ] "reset filters" - Clear all applied filters

### Tips Section
- [ ] Mentions applying multiple filters in sequence
- [ ] Mentions filters apply to current result set
- [ ] Mentions using "show all" to see original results

### Current Context
- [ ] Total OSDU records count displayed
- [ ] Active filters count displayed
- [ ] Currently showing count displayed

## Integration Tests

### Test 1: Help → Filter → Help
**Steps:**
1. Display OSDU results
2. Type: `help` → Verify help displays
3. Type: `filter by operator Shell` → Verify filter applies
4. Type: `help` → Verify help displays with updated context

**Expected:**
- ✅ Help works before and after filtering
- ✅ Context updates correctly

### Test 2: Filter → Help → Reset → Help
**Steps:**
1. Display OSDU results
2. Type: `filter by operator Shell` → Verify filter applies
3. Type: `help` → Verify help shows 1 active filter
4. Type: `show all` → Verify filters reset
5. Type: `help` → Verify help shows 0 active filters

**Expected:**
- ✅ Help reflects current filter state
- ✅ Context updates after reset

### Test 3: Multiple Filters → Help
**Steps:**
1. Display OSDU results
2. Apply 3 filters in sequence
3. Type: `help`

**Expected:**
- ✅ Help shows correct active filter count (3)
- ✅ Currently showing count reflects all filters

## Success Criteria

All scenarios must pass:
- ✅ Help keyword detection works ("help", "how to filter")
- ✅ Comprehensive help message displays
- ✅ All filter type examples included
- ✅ Reset instructions included
- ✅ Current context information accurate
- ✅ Works with and without active filters
- ✅ Case insensitive detection
- ✅ Only triggers when OSDU context exists

## Requirements Coverage

This test validates:
- ✅ **Requirement 10.1**: Detect "help" or "how to filter" keywords
- ✅ **Requirement 10.2**: Display comprehensive filter help message
- ✅ **Requirement 10.3**: Include examples for all filter types
- ✅ **Requirement 10.4**: Include reset filter instructions
- ✅ **Requirement 10.5**: Show current context information

## Notes

- Help command only works after OSDU search (requires OSDU context)
- Help message is static but context section is dynamic
- Help does not modify any state (read-only operation)
- Help can be requested at any time during filtering workflow
