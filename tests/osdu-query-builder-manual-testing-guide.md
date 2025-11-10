# OSDU Query Builder - Manual Testing Guide

This comprehensive manual testing guide covers all functionality of the OSDU Visual Query Builder to ensure it meets all requirements and works correctly in real-world scenarios.

## Prerequisites

- Application running locally or deployed
- Access to catalog page with OSDU integration
- Test OSDU data available
- Browser developer tools open (for debugging)

## Test Categories

### 1. Basic Query Building

#### Test 1.1: Open Query Builder
**Steps:**
1. Navigate to catalog page
2. Click "Query Builder" button in chat header
3. Verify modal opens with smooth transition
4. Verify all sections are visible

**Expected Results:**
- ✓ Modal opens without errors
- ✓ Template selector visible
- ✓ Data type selector visible
- ✓ Criteria builder visible
- ✓ Query preview visible
- ✓ Execute button visible

#### Test 1.2: Select Data Type
**Steps:**
1. Open query builder
2. Click data type dropdown
3. Select each data type: Well, Wellbore, Log, Seismic
4. Verify field options update for each type

**Expected Results:**
- ✓ Well: Shows operator, country, basin, wellName, depth, status, wellType fields
- ✓ Wellbore: Shows wellboreName, wellboreType, md, tvd fields
- ✓ Log: Shows logType, logName, curveCount, topDepth, bottomDepth fields
- ✓ Seismic: Shows surveyName, surveyType, acquisitionDate fields

#### Test 1.3: Add Criterion
**Steps:**
1. Open query builder
2. Click "Add Criterion" button
3. Verify new criterion appears
4. Add multiple criteria (up to 10)

**Expected Results:**
- ✓ New criterion added with default values
- ✓ Can add up to 10 criteria
- ✓ Each criterion has field, operator, value, logic selectors
- ✓ Remove button appears for each criterion

#### Test 1.4: Remove Criterion
**Steps:**
1. Add 3 criteria
2. Click "Remove" on middle criterion
3. Verify criterion is removed
4. Verify remaining criteria are intact

**Expected Results:**
- ✓ Selected criterion removed
- ✓ Other criteria unchanged
- ✓ Query preview updates
- ✓ No errors in console

### 2. Hierarchical Field Selection

#### Test 2.1: Field Selection Updates Operators
**Steps:**
1. Add criterion
2. Select string field (e.g., data.operator)
3. Note available operators
4. Select number field (e.g., data.depth)
5. Note available operators
6. Select date field (e.g., data.acquisitionDate)
7. Note available operators

**Expected Results:**
- ✓ String field: =, !=, LIKE, IN, NOT IN, NOT LIKE operators
- ✓ Number field: =, !=, >, <, >=, <=, BETWEEN operators
- ✓ Date field: =, >, <, >=, <=, BETWEEN operators
- ✓ Operator list updates automatically

#### Test 2.2: Operator Selection Updates Value Input
**Steps:**
1. Add criterion with string field
2. Select "=" operator → verify text input
3. Select "IN" operator → verify multi-value input
4. Select "BETWEEN" operator → verify range input
5. Select "LIKE" operator → verify text input with wildcard help

**Expected Results:**
- ✓ Input type matches operator
- ✓ Help text shows appropriate guidance
- ✓ Placeholder text is relevant
- ✓ Validation rules match operator

#### Test 2.3: Autocomplete for Common Fields
**Steps:**
1. Add criterion with data.operator field
2. Click value input
3. Start typing "sh"
4. Verify autocomplete suggestions appear
5. Select "Shell" from suggestions
6. Repeat for data.country, data.basin, data.wellType, data.logType

**Expected Results:**
- ✓ Autocomplete dropdown appears
- ✓ Suggestions filtered by input
- ✓ At least 10 suggestions shown
- ✓ Can select from suggestions
- ✓ Can type custom value
- ✓ Case-insensitive filtering

### 3. Query Generation

#### Test 3.1: Simple Equality Query
**Steps:**
1. Add criterion: data.operator = "Shell"
2. Verify query preview shows: `data.operator = "Shell"`
3. Click "Execute Query"

**Expected Results:**
- ✓ Query preview correct
- ✓ Syntax highlighting applied
- ✓ Query executes successfully
- ✓ Results displayed in chat

#### Test 3.2: Numeric Comparison Query
**Steps:**
1. Add criterion: data.depth > 3000
2. Verify query preview shows: `data.depth > 3000`
3. Execute query

**Expected Results:**
- ✓ Query preview correct
- ✓ Number not quoted
- ✓ Query executes successfully

#### Test 3.3: LIKE Query with Wildcards
**Steps:**
1. Add criterion: data.wellName LIKE "North"
2. Verify query preview shows: `data.wellName LIKE "%North%"`
3. Execute query

**Expected Results:**
- ✓ Wildcards added automatically
- ✓ Query preview correct
- ✓ Query executes successfully

#### Test 3.4: IN Query with Multiple Values
**Steps:**
1. Add criterion: data.operator IN "Shell, BP, Equinor"
2. Verify query preview shows: `data.operator IN ("Shell", "BP", "Equinor")`
3. Execute query

**Expected Results:**
- ✓ Values split by comma
- ✓ Each value quoted
- ✓ Parentheses added
- ✓ Query executes successfully

#### Test 3.5: BETWEEN Query for Range
**Steps:**
1. Add criterion: data.depth BETWEEN "1000, 5000"
2. Verify query preview shows: `data.depth BETWEEN 1000 AND 5000`
3. Execute query

**Expected Results:**
- ✓ Range values parsed correctly
- ✓ AND keyword added
- ✓ Numbers not quoted
- ✓ Query executes successfully

#### Test 3.6: Multiple Criteria with AND Logic
**Steps:**
1. Add criterion: data.operator = "Shell"
2. Add criterion: data.country = "Norway" (logic: AND)
3. Verify query preview shows both criteria with AND
4. Execute query

**Expected Results:**
- ✓ Both criteria in query
- ✓ AND keyword between criteria
- ✓ Query executes successfully

#### Test 3.7: Multiple Criteria with OR Logic
**Steps:**
1. Add criterion: data.operator = "Shell"
2. Add criterion: data.operator = "BP" (logic: OR)
3. Verify query preview shows both criteria with OR
4. Execute query

**Expected Results:**
- ✓ Both criteria in query
- ✓ OR keyword between criteria
- ✓ Query executes successfully

#### Test 3.8: Mixed AND/OR Logic
**Steps:**
1. Add criterion: data.operator = "Shell"
2. Add criterion: data.operator = "BP" (logic: OR)
3. Add criterion: data.country = "Norway" (logic: AND)
4. Verify query preview shows proper grouping
5. Execute query

**Expected Results:**
- ✓ Parentheses for OR group
- ✓ AND applied to group
- ✓ Query executes successfully

#### Test 3.9: Special Characters Escaping
**Steps:**
1. Add criterion: data.wellName = 'Well "A-1"'
2. Verify query preview shows: `data.wellName = "Well \"A-1\""`
3. Execute query

**Expected Results:**
- ✓ Quotes escaped
- ✓ Query executes successfully

### 4. Query Templates

#### Test 4.1: Apply Wells by Operator Template
**Steps:**
1. Open query builder
2. Click "Wells by Operator" template
3. Verify criterion pre-populated
4. Enter operator value: "Shell"
5. Execute query

**Expected Results:**
- ✓ Template applied
- ✓ Data type set to "well"
- ✓ Criterion has data.operator field
- ✓ Can modify value
- ✓ Query executes successfully

#### Test 4.2: Apply Wells by Location Template
**Steps:**
1. Click "Wells by Location" template
2. Verify criterion pre-populated with data.country
3. Enter country: "Norway"
4. Execute query

**Expected Results:**
- ✓ Template applied
- ✓ Criterion has data.country field
- ✓ Query executes successfully

#### Test 4.3: Apply Wells by Depth Range Template
**Steps:**
1. Click "Wells by Depth Range" template
2. Verify two criteria pre-populated
3. Enter min depth: 1000
4. Enter max depth: 5000
5. Execute query

**Expected Results:**
- ✓ Template applied
- ✓ Two criteria for depth range
- ✓ Query executes successfully

#### Test 4.4: Apply Logs by Type Template
**Steps:**
1. Click "Logs by Type" template
2. Verify data type changed to "log"
3. Verify criterion has data.logType field
4. Enter log type: "GR"
5. Execute query

**Expected Results:**
- ✓ Template applied
- ✓ Data type changed
- ✓ Query executes successfully

#### Test 4.5: Apply Recent Data Template
**Steps:**
1. Click "Recent Data" template
2. Verify criterion has data.createdDate field
3. Enter date: "2024-01-01"
4. Execute query

**Expected Results:**
- ✓ Template applied
- ✓ Date field used
- ✓ Query executes successfully

#### Test 4.6: Modify Template Parameters
**Steps:**
1. Apply any template
2. Modify field selection
3. Modify operator
4. Modify value
5. Add additional criteria
6. Execute query

**Expected Results:**
- ✓ Can modify all parameters
- ✓ Template serves as starting point
- ✓ Query executes successfully

### 5. Query Validation

#### Test 5.1: Empty Value Validation
**Steps:**
1. Add criterion
2. Leave value empty
3. Verify validation error appears
4. Verify execute button disabled

**Expected Results:**
- ✓ Error message: "Value is required"
- ✓ Red badge or error indicator
- ✓ Execute button disabled
- ✓ Error count shown in summary

#### Test 5.2: Invalid Number Validation
**Steps:**
1. Add criterion with number field
2. Enter "abc" as value
3. Verify validation error

**Expected Results:**
- ✓ Error message: "Must be a valid number"
- ✓ Execute button disabled

#### Test 5.3: Invalid Date Validation
**Steps:**
1. Add criterion with date field
2. Enter "01/15/2024" (wrong format)
3. Verify validation error

**Expected Results:**
- ✓ Error message: "Date must be in YYYY-MM-DD format"
- ✓ Execute button disabled

#### Test 5.4: IN Operator Validation
**Steps:**
1. Add criterion with IN operator
2. Enter single value (no comma)
3. Verify validation error

**Expected Results:**
- ✓ Error message: "Use comma to separate multiple values"
- ✓ Execute button disabled

#### Test 5.5: BETWEEN Operator Validation
**Steps:**
1. Add criterion with BETWEEN operator
2. Enter single value
3. Verify validation error
4. Enter two values with min > max
5. Verify validation error

**Expected Results:**
- ✓ Error for single value: "BETWEEN requires exactly two values"
- ✓ Error for invalid range: "First value must be less than second value"
- ✓ Execute button disabled

#### Test 5.6: Real-time Validation
**Steps:**
1. Add criterion with empty value
2. Start typing value
3. Verify error clears as you type
4. Delete value
5. Verify error reappears

**Expected Results:**
- ✓ Validation updates in real-time
- ✓ Error appears/disappears appropriately
- ✓ Execute button enables/disables accordingly

### 6. Query Preview

#### Test 6.1: Live Preview Updates
**Steps:**
1. Add criterion
2. Change field → verify preview updates
3. Change operator → verify preview updates
4. Change value → verify preview updates
5. Add criterion → verify preview updates
6. Remove criterion → verify preview updates

**Expected Results:**
- ✓ Preview updates immediately
- ✓ No lag or delay
- ✓ Syntax correct at all times

#### Test 6.2: Syntax Highlighting
**Steps:**
1. Build complex query with multiple criteria
2. Verify syntax highlighting in preview:
   - Keywords (AND/OR) in purple/magenta
   - Field names (data.*) in teal
   - String values in orange
   - Numbers in light green
   - Operators in default color
   - Parentheses in gold

**Expected Results:**
- ✓ All syntax elements highlighted
- ✓ Colors distinct and readable
- ✓ Highlighting consistent

#### Test 6.3: Query Formatting
**Steps:**
1. Build query with 5+ criteria
2. Verify query preview has proper formatting:
   - Each criterion on new line
   - Proper indentation
   - Parentheses for grouping
   - Readable structure

**Expected Results:**
- ✓ Query formatted for readability
- ✓ Indentation consistent
- ✓ Structure clear

#### Test 6.4: Copy Query to Clipboard
**Steps:**
1. Build valid query
2. Click "Copy Query" button
3. Paste into text editor
4. Verify query copied correctly

**Expected Results:**
- ✓ Query copied to clipboard
- ✓ Formatting preserved
- ✓ No extra characters
- ✓ Success message shown

### 7. Query Execution

#### Test 7.1: Execute Valid Query
**Steps:**
1. Build valid query: data.operator = "Shell"
2. Click "Execute Query"
3. Verify modal closes
4. Verify user message appears in chat
5. Verify results appear in chat
6. Verify map updates (if applicable)

**Expected Results:**
- ✓ Modal closes automatically
- ✓ User message shows query
- ✓ AI message shows results
- ✓ Results use OSDUSearchResponse component
- ✓ Map updates with results
- ✓ No errors in console

#### Test 7.2: Execute Query with No Results
**Steps:**
1. Build query that returns no results
2. Execute query
3. Verify appropriate message shown

**Expected Results:**
- ✓ Message indicates no results found
- ✓ No errors thrown
- ✓ Can build new query

#### Test 7.3: Execute Query with Error
**Steps:**
1. Build query (may need to manually trigger error)
2. Execute query
3. Verify error handled gracefully

**Expected Results:**
- ✓ Error message shown
- ✓ User can retry
- ✓ Query builder remains functional

#### Test 7.4: Execute Multiple Queries in Sequence
**Steps:**
1. Execute query 1
2. Wait for results
3. Open query builder again
4. Execute query 2
5. Verify both results in chat history

**Expected Results:**
- ✓ Both queries in chat history
- ✓ Both results displayed
- ✓ Conversation context maintained

### 8. Query History

#### Test 8.1: Save Query to History
**Steps:**
1. Execute query
2. Open query builder again
3. Click "Query History" tab/section
4. Verify executed query appears in history

**Expected Results:**
- ✓ Query saved to history
- ✓ Timestamp shown
- ✓ Result count shown
- ✓ Query text shown

#### Test 8.2: Load Query from History
**Steps:**
1. Execute query
2. Open query builder
3. Open query history
4. Click on previous query
5. Verify query loaded into builder

**Expected Results:**
- ✓ Criteria loaded
- ✓ Data type set
- ✓ Values populated
- ✓ Can modify and re-execute

#### Test 8.3: Delete Query from History
**Steps:**
1. Execute query
2. Open query history
3. Click delete on query
4. Verify query removed

**Expected Results:**
- ✓ Query removed from history
- ✓ Other queries intact
- ✓ No errors

#### Test 8.4: Search Query History
**Steps:**
1. Execute multiple queries with different criteria
2. Open query history
3. Use search to filter queries
4. Verify filtered results

**Expected Results:**
- ✓ Search filters queries
- ✓ Matching queries shown
- ✓ Non-matching queries hidden

#### Test 8.5: History Limit (20 queries)
**Steps:**
1. Execute 25 queries
2. Open query history
3. Verify only 20 most recent queries shown

**Expected Results:**
- ✓ Maximum 20 queries in history
- ✓ Oldest queries removed
- ✓ Most recent queries retained

### 9. Advanced Features

#### Test 9.1: Wildcard Support
**Steps:**
1. Add criterion with LIKE operator
2. Enter value with * wildcard: "North*"
3. Verify query converts * to %
4. Execute query

**Expected Results:**
- ✓ * converted to %
- ✓ Query executes successfully
- ✓ Results match wildcard pattern

#### Test 9.2: Range Input for Numbers
**Steps:**
1. Add criterion with BETWEEN operator
2. Use range input component (if available)
3. Set min and max values
4. Verify query generated correctly

**Expected Results:**
- ✓ Range input works
- ✓ Min and max values set
- ✓ Query uses BETWEEN syntax

#### Test 9.3: Date Range Picker
**Steps:**
1. Add criterion with date field and BETWEEN operator
2. Use date range picker (if available)
3. Select start and end dates
4. Verify query generated correctly

**Expected Results:**
- ✓ Date picker works
- ✓ Dates formatted correctly
- ✓ Query uses BETWEEN syntax

#### Test 9.4: Multi-Value Selection
**Steps:**
1. Add criterion with IN operator
2. Use multi-select dropdown (if available)
3. Select multiple values
4. Verify query generated correctly

**Expected Results:**
- ✓ Multi-select works
- ✓ All values included in query
- ✓ Query uses IN syntax

#### Test 9.5: NOT Operator
**Steps:**
1. Add criterion with NOT IN operator
2. Enter values
3. Verify query uses NOT IN
4. Execute query

**Expected Results:**
- ✓ NOT IN in query
- ✓ Query executes successfully
- ✓ Results exclude specified values

### 10. Responsive Design

#### Test 10.1: Desktop Layout
**Steps:**
1. Open query builder on desktop (1920x1080)
2. Verify all elements visible
3. Verify proper spacing
4. Verify no horizontal scroll

**Expected Results:**
- ✓ All elements visible
- ✓ Layout uses full width
- ✓ Proper spacing
- ✓ No scroll needed

#### Test 10.2: Tablet Layout
**Steps:**
1. Resize browser to tablet size (768x1024)
2. Verify layout adapts
3. Verify all elements accessible

**Expected Results:**
- ✓ Layout stacks appropriately
- ✓ All elements accessible
- ✓ Touch targets adequate (44px min)

#### Test 10.3: Mobile Layout
**Steps:**
1. Resize browser to mobile size (375x667)
2. Verify layout adapts
3. Verify all elements accessible
4. Verify touch-friendly controls

**Expected Results:**
- ✓ Layout stacks vertically
- ✓ All elements accessible
- ✓ Touch targets adequate
- ✓ Native controls used (date, number)

#### Test 10.4: Collapsible Sections on Mobile
**Steps:**
1. Open query builder on mobile
2. Verify advanced options collapsed by default
3. Expand sections
4. Verify content accessible

**Expected Results:**
- ✓ Sections collapsed by default
- ✓ Can expand sections
- ✓ Content accessible when expanded

### 11. Contextual Help

#### Test 11.1: Field Tooltips
**Steps:**
1. Hover over field label
2. Verify tooltip appears with description
3. Verify examples shown
4. Repeat for multiple fields

**Expected Results:**
- ✓ Tooltip appears on hover
- ✓ Description clear and helpful
- ✓ Examples relevant
- ✓ Tooltip dismisses on mouse out

#### Test 11.2: Operator Tooltips
**Steps:**
1. Hover over operator label
2. Verify tooltip appears with usage info
3. Verify examples shown
4. Repeat for multiple operators

**Expected Results:**
- ✓ Tooltip appears on hover
- ✓ Usage info clear
- ✓ Examples show syntax

#### Test 11.3: Help Documentation
**Steps:**
1. Click help button (info icon)
2. Verify help modal opens
3. Verify all sections present:
   - Overview
   - Getting Started
   - Field Types
   - Operator Reference
   - Combining Criteria
   - Troubleshooting
   - Tips and Tricks
   - Syntax Reference
4. Verify content comprehensive

**Expected Results:**
- ✓ Help modal opens
- ✓ All sections present
- ✓ Content comprehensive
- ✓ Examples clear

#### Test 11.4: Guided Help for Multiple Errors
**Steps:**
1. Add 3+ criteria with validation errors
2. Verify enhanced error alert appears
3. Verify "Get Help" button shown
4. Click "Get Help"
5. Verify help modal opens to troubleshooting section

**Expected Results:**
- ✓ Enhanced error alert shown
- ✓ Error count displayed
- ✓ Common causes listed
- ✓ "Get Help" button works
- ✓ Help modal opens to relevant section

### 12. Analytics

#### Test 12.1: Event Tracking
**Steps:**
1. Open browser console
2. Open query builder
3. Verify "Query Builder Opened" event logged
4. Close query builder
5. Verify "Query Builder Closed" event logged

**Expected Results:**
- ✓ Events logged to console
- ✓ Events saved to localStorage
- ✓ Metadata included

#### Test 12.2: Query Execution Tracking
**Steps:**
1. Execute query
2. Open analytics dashboard
3. Verify execution recorded
4. Verify metrics shown:
   - Execution time
   - Result count
   - Success/failure

**Expected Results:**
- ✓ Execution recorded
- ✓ All metrics captured
- ✓ Timestamp recorded

#### Test 12.3: Template Usage Tracking
**Steps:**
1. Apply template
2. Execute query
3. Open analytics dashboard
4. Verify template usage recorded

**Expected Results:**
- ✓ Template usage tracked
- ✓ Usage count incremented
- ✓ Statistics updated

#### Test 12.4: Analytics Dashboard
**Steps:**
1. Execute multiple queries
2. Open analytics dashboard
3. Verify all sections populated:
   - Overall statistics
   - Template usage
   - Field usage
   - Error analysis

**Expected Results:**
- ✓ All sections populated
- ✓ Data accurate
- ✓ Charts/tables readable

#### Test 12.5: Export Analytics Data
**Steps:**
1. Open analytics dashboard
2. Click "Export Data"
3. Verify JSON file downloaded
4. Open file and verify data

**Expected Results:**
- ✓ File downloads
- ✓ JSON format valid
- ✓ All data included

#### Test 12.6: Clear Analytics Data
**Steps:**
1. Open analytics dashboard
2. Click "Clear All Data"
3. Confirm action
4. Verify data cleared

**Expected Results:**
- ✓ Confirmation dialog shown
- ✓ Data cleared after confirmation
- ✓ Dashboard shows empty state

## Performance Testing

### Test P.1: Query Generation Performance
**Steps:**
1. Add 10 criteria
2. Measure time to generate query
3. Verify < 100ms

**Expected Results:**
- ✓ Query generated in < 100ms
- ✓ No lag or delay
- ✓ UI remains responsive

### Test P.2: Query Execution Performance
**Steps:**
1. Execute simple query
2. Measure time from click to results
3. Verify < 2 seconds

**Expected Results:**
- ✓ Results in < 2 seconds
- ✓ No AI processing delay
- ✓ Direct OSDU API call

### Test P.3: Large Result Set Handling
**Steps:**
1. Execute query that returns 100+ results
2. Verify results display correctly
3. Verify no performance issues

**Expected Results:**
- ✓ All results displayed
- ✓ No lag or freeze
- ✓ Pagination works (if applicable)

## Accessibility Testing

### Test A.1: Keyboard Navigation
**Steps:**
1. Open query builder
2. Use Tab key to navigate
3. Verify all elements accessible
4. Use Enter to activate buttons
5. Use Escape to close modal

**Expected Results:**
- ✓ All elements keyboard accessible
- ✓ Tab order logical
- ✓ Enter activates buttons
- ✓ Escape closes modal

### Test A.2: Screen Reader Compatibility
**Steps:**
1. Enable screen reader
2. Navigate query builder
3. Verify all elements announced
4. Verify labels clear

**Expected Results:**
- ✓ All elements announced
- ✓ Labels descriptive
- ✓ Instructions clear

### Test A.3: Color Contrast
**Steps:**
1. Verify all text meets WCAG AA standards
2. Check syntax highlighting colors
3. Check error messages

**Expected Results:**
- ✓ All text readable
- ✓ Contrast ratio ≥ 4.5:1
- ✓ Colors distinguishable

## Browser Compatibility

Test all functionality in:
- ✓ Chrome (latest)
- ✓ Firefox (latest)
- ✓ Safari (latest)
- ✓ Edge (latest)

## Test Results Summary

| Category | Tests | Passed | Failed | Notes |
|----------|-------|--------|--------|-------|
| Basic Query Building | 4 | | | |
| Hierarchical Field Selection | 3 | | | |
| Query Generation | 9 | | | |
| Query Templates | 6 | | | |
| Query Validation | 6 | | | |
| Query Preview | 4 | | | |
| Query Execution | 4 | | | |
| Query History | 5 | | | |
| Advanced Features | 5 | | | |
| Responsive Design | 4 | | | |
| Contextual Help | 4 | | | |
| Analytics | 6 | | | |
| Performance | 3 | | | |
| Accessibility | 3 | | | |
| **TOTAL** | **66** | | | |

## Sign-off

- [ ] All tests passed
- [ ] No critical issues found
- [ ] Performance acceptable
- [ ] Accessibility compliant
- [ ] Ready for production

**Tester:** ___________________  
**Date:** ___________________  
**Signature:** ___________________
