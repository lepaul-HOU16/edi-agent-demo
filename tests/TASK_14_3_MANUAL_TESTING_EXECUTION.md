# Task 14.3: Manual Testing Execution Report

## Overview

This document provides the execution results for comprehensive manual testing of the OSDU Visual Query Builder, covering all templates with real OSDU data, responsive design on mobile and desktop, and error handling edge cases.

**Testing Date:** 2024-01-XX  
**Tester:** [To be filled during execution]  
**Environment:** [Local/Deployed]  
**Browser:** [Chrome/Firefox/Safari/Edge]

## Test Execution Summary

| Category | Total Tests | Passed | Failed | Blocked | Notes |
|----------|-------------|--------|--------|---------|-------|
| Template Testing | 5 | - | - | - | All templates with real OSDU data |
| Responsive Design | 8 | - | - | - | Mobile, tablet, desktop layouts |
| Error Handling | 12 | - | - | - | Edge cases and validation |
| **TOTAL** | **25** | **-** | **-** | **-** | |

## 1. Template Testing with Real OSDU Data

### Test 1.1: Wells by Operator Template
**Objective:** Verify template works with real OSDU operator data

**Steps:**
1. Open query builder
2. Select "Wells by Operator" template
3. Enter real operator: "Shell"
4. Execute query
5. Verify results returned
6. Check map updates with well locations

**Expected Results:**
- ✓ Template applies correctly
- ✓ Data type set to "well"
- ✓ Operator field pre-selected
- ✓ Query executes successfully
- ✓ Real OSDU wells returned
- ✓ Map shows well locations
- ✓ Results display in OSDUSearchResponse component

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

**Notes:**
```
[Record any observations, issues, or unexpected behavior]
```

---

### Test 1.2: Wells by Location Template
**Objective:** Verify template works with real OSDU country data

**Steps:**
1. Open query builder
2. Select "Wells by Location" template
3. Enter real country: "Norway"
4. Execute query
5. Verify results returned
6. Check geographic filtering

**Expected Results:**
- ✓ Template applies correctly
- ✓ Country field pre-selected
- ✓ Autocomplete shows country suggestions
- ✓ Query executes successfully
- ✓ Only Norwegian wells returned
- ✓ Map centers on Norway region

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

**Notes:**
```
[Record any observations]
```

---

### Test 1.3: Wells by Depth Range Template
**Objective:** Verify template works with real depth data

**Steps:**
1. Open query builder
2. Select "Wells by Depth Range" template
3. Enter min depth: 1000
4. Enter max depth: 5000
5. Execute query
6. Verify depth filtering

**Expected Results:**
- ✓ Template applies with two criteria
- ✓ Both depth criteria pre-populated
- ✓ Query uses > and < operators
- ✓ Query executes successfully
- ✓ Only wells within depth range returned
- ✓ Result count matches filter

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

**Notes:**
```
[Record depth range statistics from results]
```

---

### Test 1.4: Logs by Type Template
**Objective:** Verify template works with real log type data

**Steps:**
1. Open query builder
2. Select "Logs by Type" template
3. Verify data type changes to "log"
4. Enter real log type: "Gamma Ray" or "GR"
5. Execute query
6. Verify log records returned

**Expected Results:**
- ✓ Template applies correctly
- ✓ Data type changes to "log"
- ✓ Log type field pre-selected
- ✓ Autocomplete shows log types
- ✓ Query executes successfully
- ✓ Only specified log type returned

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

**Notes:**
```
[Record log types available in autocomplete]
```

---

### Test 1.5: Active Production Wells Template
**Objective:** Verify template works with real status and type data

**Steps:**
1. Open query builder
2. Select "Active Production Wells" template
3. Verify two criteria pre-populated
4. Execute query without modification
5. Verify filtering by status AND type

**Expected Results:**
- ✓ Template applies with two criteria
- ✓ Status = "Active" pre-filled
- ✓ Well Type = "Production" pre-filled
- ✓ AND logic between criteria
- ✓ Query executes successfully
- ✓ Only active production wells returned

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

**Notes:**
```
[Record count of active production wells]
```

---

## 2. Responsive Design Testing

### Test 2.1: Desktop Layout (1920x1080)
**Objective:** Verify optimal layout on large desktop screens

**Steps:**
1. Set browser window to 1920x1080
2. Open query builder
3. Verify all elements visible without scrolling
4. Check spacing and alignment
5. Verify 4-column grid for criteria

**Expected Results:**
- ✓ All elements visible
- ✓ Proper spacing between elements
- ✓ 4-column grid layout for criteria
- ✓ No horizontal scroll
- ✓ Query preview readable
- ✓ Buttons properly sized

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

**Screenshot:** [Attach desktop screenshot]

---

### Test 2.2: Laptop Layout (1366x768)
**Objective:** Verify layout adapts to standard laptop screen

**Steps:**
1. Set browser window to 1366x768
2. Open query builder
3. Verify all elements accessible
4. Check if any elements overlap
5. Verify query preview readable

**Expected Results:**
- ✓ All elements accessible
- ✓ No overlapping elements
- ✓ Proper text wrapping
- ✓ Query preview readable
- ✓ Buttons accessible

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

**Screenshot:** [Attach laptop screenshot]

---

### Test 2.3: Tablet Portrait (768x1024)
**Objective:** Verify layout adapts to tablet portrait orientation

**Steps:**
1. Set browser window to 768x1024
2. Open query builder
3. Verify layout stacks appropriately
4. Check touch target sizes (minimum 44px)
5. Test all interactive elements

**Expected Results:**
- ✓ Layout stacks vertically
- ✓ All elements accessible
- ✓ Touch targets ≥ 44px
- ✓ No horizontal scroll
- ✓ Buttons full-width or adequate size
- ✓ Dropdowns work with touch

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

**Screenshot:** [Attach tablet screenshot]

---

### Test 2.4: Tablet Landscape (1024x768)
**Objective:** Verify layout adapts to tablet landscape orientation

**Steps:**
1. Set browser window to 1024x768
2. Open query builder
3. Verify layout uses available width
4. Check element spacing
5. Test all interactive elements

**Expected Results:**
- ✓ Layout uses full width
- ✓ Proper spacing maintained
- ✓ All elements accessible
- ✓ Touch targets adequate
- ✓ Query preview readable

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

**Screenshot:** [Attach tablet landscape screenshot]

---

### Test 2.5: Mobile Portrait (375x667 - iPhone SE)
**Objective:** Verify layout works on small mobile screens

**Steps:**
1. Set browser window to 375x667
2. Open query builder
3. Verify all elements accessible
4. Check advanced options collapsed by default
5. Test touch interactions
6. Verify native controls used (date, number)

**Expected Results:**
- ✓ Layout fully responsive
- ✓ All elements accessible via scroll
- ✓ Advanced options collapsed
- ✓ Touch targets ≥ 44px
- ✓ Native date picker on date fields
- ✓ Native number input on number fields
- ✓ Buttons full-width
- ✓ Text readable (≥ 16px)

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

**Screenshot:** [Attach mobile portrait screenshot]

---

### Test 2.6: Mobile Landscape (667x375)
**Objective:** Verify layout works in mobile landscape

**Steps:**
1. Set browser window to 667x375
2. Open query builder
3. Verify elements accessible
4. Check if layout adapts appropriately
5. Test scrolling behavior

**Expected Results:**
- ✓ Layout adapts to landscape
- ✓ All elements accessible
- ✓ Proper scrolling behavior
- ✓ Touch targets adequate
- ✓ Query preview readable

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

**Screenshot:** [Attach mobile landscape screenshot]

---

### Test 2.7: Collapsible Sections on Mobile
**Objective:** Verify advanced options collapse on mobile

**Steps:**
1. Open query builder on mobile (375x667)
2. Verify "Advanced Options" collapsed by default
3. Expand "Advanced Options"
4. Verify all options accessible
5. Collapse section again

**Expected Results:**
- ✓ Advanced options collapsed by default
- ✓ Can expand section
- ✓ All options accessible when expanded
- ✓ Can collapse section
- ✓ Smooth animation

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

**Notes:**
```
[Record which sections are collapsible]
```

---

### Test 2.8: Touch-Friendly Controls
**Objective:** Verify all controls are touch-friendly on mobile

**Steps:**
1. Open query builder on mobile
2. Test all buttons (minimum 44px height)
3. Test all dropdowns
4. Test all input fields
5. Verify no accidental taps

**Expected Results:**
- ✓ All buttons ≥ 44px height
- ✓ Adequate spacing between elements
- ✓ Dropdowns easy to tap
- ✓ Input fields easy to focus
- ✓ No accidental taps
- ✓ Native controls used where appropriate

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

**Notes:**
```
[Record any touch interaction issues]
```

---

## 3. Error Handling and Edge Cases

### Test 3.1: Empty Value Validation
**Objective:** Verify validation prevents empty values

**Steps:**
1. Add criterion
2. Select field and operator
3. Leave value empty
4. Verify error message appears
5. Verify execute button disabled
6. Enter value
7. Verify error clears

**Expected Results:**
- ✓ Error message: "Value is required"
- ✓ Red badge (✗) shown
- ✓ Execute button disabled
- ✓ Error clears when value entered
- ✓ Execute button enables

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test 3.2: Invalid Number Validation
**Objective:** Verify validation catches invalid numbers

**Steps:**
1. Add criterion with number field (e.g., depth)
2. Enter text: "abc"
3. Verify error message
4. Enter valid number: 3000
5. Verify error clears

**Expected Results:**
- ✓ Error message: "Must be a valid number"
- ✓ Red badge shown
- ✓ Execute button disabled
- ✓ Error clears with valid number

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test 3.3: Invalid Date Format Validation
**Objective:** Verify validation enforces YYYY-MM-DD format

**Steps:**
1. Add criterion with date field
2. Enter wrong format: "01/15/2024"
3. Verify error message
4. Enter correct format: "2024-01-15"
5. Verify error clears

**Expected Results:**
- ✓ Error message: "Date must be in YYYY-MM-DD format"
- ✓ Red badge shown
- ✓ Execute button disabled
- ✓ Error clears with correct format

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test 3.4: IN Operator Validation
**Objective:** Verify IN operator requires comma-separated values

**Steps:**
1. Add criterion with IN operator
2. Enter single value without comma: "Shell"
3. Verify error message
4. Add comma and second value: "Shell, BP"
5. Verify error clears

**Expected Results:**
- ✓ Error message: "Use comma to separate multiple values"
- ✓ Red badge shown
- ✓ Execute button disabled
- ✓ Error clears with comma-separated values

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test 3.5: BETWEEN Operator Validation
**Objective:** Verify BETWEEN requires exactly two values

**Steps:**
1. Add criterion with BETWEEN operator
2. Enter single value: "1000"
3. Verify error message
4. Enter two values: "1000, 5000"
5. Verify error clears
6. Enter reversed values: "5000, 1000"
7. Verify error message

**Expected Results:**
- ✓ Error for single value: "BETWEEN requires exactly two values"
- ✓ Error clears with two values
- ✓ Error for reversed values: "First value must be less than second value"
- ✓ Execute button disabled for errors

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test 3.6: Negative Number Validation
**Objective:** Verify negative numbers are rejected for depth fields

**Steps:**
1. Add criterion with depth field
2. Enter negative number: -1000
3. Verify error message
4. Enter positive number: 1000
5. Verify error clears

**Expected Results:**
- ✓ Error message: "Must be a positive number"
- ✓ Red badge shown
- ✓ Execute button disabled
- ✓ Error clears with positive number

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test 3.7: Maximum Criteria Limit
**Objective:** Verify maximum of 10 criteria enforced

**Steps:**
1. Add 10 criteria
2. Verify "Add Criterion" button disabled
3. Verify warning message shown
4. Remove one criterion
5. Verify "Add Criterion" button enabled

**Expected Results:**
- ✓ Can add up to 10 criteria
- ✓ "Add Criterion" disabled at 10
- ✓ Warning message: "Maximum of 10 criteria reached"
- ✓ Button enables when criterion removed

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test 3.8: Special Characters in String Values
**Objective:** Verify special characters are properly escaped

**Steps:**
1. Add criterion with string field
2. Enter value with quotes: Well "A-1"
3. Verify query preview shows escaped quotes
4. Execute query
5. Verify query executes successfully

**Expected Results:**
- ✓ Query preview shows: `data.wellName = "Well \"A-1\""`
- ✓ Quotes properly escaped
- ✓ Query executes successfully
- ✓ No syntax errors

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test 3.9: Wildcard Pattern Validation
**Objective:** Verify wildcard patterns work correctly

**Steps:**
1. Add criterion with LIKE operator
2. Enter pattern: "North*"
3. Verify query converts * to %
4. Execute query
5. Verify results match pattern

**Expected Results:**
- ✓ Query shows: `data.wellName LIKE "%North%"`
- ✓ * converted to %
- ✓ Query executes successfully
- ✓ Results match wildcard pattern

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test 3.10: Empty Criteria List
**Objective:** Verify validation prevents execution with no criteria

**Steps:**
1. Open query builder
2. Do not add any criteria
3. Verify execute button disabled
4. Verify info message shown
5. Add criterion
6. Verify execute button enables

**Expected Results:**
- ✓ Execute button disabled with no criteria
- ✓ Info message: "Add criteria to build your query"
- ✓ Button enables when criterion added

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test 3.11: Multiple Validation Errors
**Objective:** Verify enhanced error alert for multiple errors

**Steps:**
1. Add 3 criteria with empty values
2. Verify enhanced error alert appears
3. Verify error count shown
4. Verify "Get Help" button shown
5. Click "Get Help"
6. Verify help modal opens

**Expected Results:**
- ✓ Enhanced error alert shown
- ✓ Error count: "Your query has 3 errors"
- ✓ Common causes listed
- ✓ "Get Help" button present
- ✓ Help modal opens to troubleshooting section

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test 3.12: Query Execution with No Results
**Objective:** Verify graceful handling of zero results

**Steps:**
1. Build query that returns no results
   - Example: data.operator = "NonexistentOperator123"
2. Execute query
3. Verify appropriate message shown
4. Verify no errors thrown
5. Verify can build new query

**Expected Results:**
- ✓ Message indicates no results found
- ✓ No JavaScript errors
- ✓ Query builder remains functional
- ✓ Can build and execute new query

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

## 4. Cross-Browser Testing

### Test 4.1: Chrome (Latest)
**Browser Version:** _______________

**Test Results:**
- [ ] All features work correctly
- [ ] No console errors
- [ ] Responsive design works
- [ ] Touch interactions work (if applicable)

**Issues Found:**
```
[List any Chrome-specific issues]
```

---

### Test 4.2: Firefox (Latest)
**Browser Version:** _______________

**Test Results:**
- [ ] All features work correctly
- [ ] No console errors
- [ ] Responsive design works
- [ ] Touch interactions work (if applicable)

**Issues Found:**
```
[List any Firefox-specific issues]
```

---

### Test 4.3: Safari (Latest)
**Browser Version:** _______________

**Test Results:**
- [ ] All features work correctly
- [ ] No console errors
- [ ] Responsive design works
- [ ] Touch interactions work (if applicable)

**Issues Found:**
```
[List any Safari-specific issues]
```

---

### Test 4.4: Edge (Latest)
**Browser Version:** _______________

**Test Results:**
- [ ] All features work correctly
- [ ] No console errors
- [ ] Responsive design works
- [ ] Touch interactions work (if applicable)

**Issues Found:**
```
[List any Edge-specific issues]
```

---

## 5. Performance Testing

### Test 5.1: Query Generation Performance
**Objective:** Verify query generation is fast

**Steps:**
1. Add 10 criteria
2. Measure time from last input to query preview update
3. Verify < 100ms

**Actual Results:**
- Query generation time: _____ ms
- [ ] PASS (< 100ms)
- [ ] FAIL (≥ 100ms)

---

### Test 5.2: Query Execution Performance
**Objective:** Verify query execution is fast

**Steps:**
1. Execute simple query
2. Measure time from click to results displayed
3. Verify < 2 seconds

**Actual Results:**
- Execution time: _____ seconds
- [ ] PASS (< 2 seconds)
- [ ] FAIL (≥ 2 seconds)

---

### Test 5.3: Large Result Set Handling
**Objective:** Verify handling of 100+ results

**Steps:**
1. Execute query that returns 100+ results
2. Verify all results display
3. Verify no performance issues
4. Check map rendering

**Actual Results:**
- Result count: _____
- [ ] PASS (no performance issues)
- [ ] FAIL (lag or freeze)

**Notes:**
```
[Record any performance observations]
```

---

## 6. Accessibility Testing

### Test 6.1: Keyboard Navigation
**Objective:** Verify full keyboard accessibility

**Steps:**
1. Open query builder
2. Use Tab key to navigate all elements
3. Use Enter to activate buttons
4. Use Escape to close modal
5. Verify focus indicators visible

**Expected Results:**
- ✓ All elements keyboard accessible
- ✓ Tab order logical
- ✓ Enter activates buttons
- ✓ Escape closes modal
- ✓ Focus indicators visible

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test 6.2: Screen Reader Compatibility
**Objective:** Verify screen reader announces all elements

**Screen Reader Used:** _______________

**Steps:**
1. Enable screen reader
2. Navigate query builder
3. Verify all elements announced
4. Verify labels descriptive

**Expected Results:**
- ✓ All elements announced
- ✓ Labels clear and descriptive
- ✓ Instructions provided
- ✓ Error messages announced

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test 6.3: Color Contrast
**Objective:** Verify WCAG AA compliance

**Steps:**
1. Check all text contrast ratios
2. Verify syntax highlighting colors
3. Check error message colors
4. Use browser contrast checker

**Expected Results:**
- ✓ All text contrast ≥ 4.5:1
- ✓ Syntax colors distinguishable
- ✓ Error colors meet standards
- ✓ WCAG AA compliant

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Elements with issues: _______________

---

## 7. Integration Testing

### Test 7.1: Chat Integration
**Objective:** Verify query builder integrates with chat

**Steps:**
1. Execute query from query builder
2. Verify modal closes
3. Verify user message appears in chat
4. Verify AI message with results appears
5. Verify conversation context maintained

**Expected Results:**
- ✓ Modal closes after execution
- ✓ User message shows query
- ✓ AI message shows results
- ✓ Results use OSDUSearchResponse component
- ✓ Can continue conversation

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test 7.2: Map Integration
**Objective:** Verify map updates with query results

**Steps:**
1. Execute query that returns wells with coordinates
2. Verify map updates
3. Verify wells plotted correctly
4. Verify map bounds fit results

**Expected Results:**
- ✓ Map updates automatically
- ✓ Wells plotted at correct locations
- ✓ Map bounds fit all results
- ✓ Can interact with map markers

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test 7.3: Query History Integration
**Objective:** Verify queries saved to history

**Steps:**
1. Execute query
2. Open query history
3. Verify query appears in history
4. Verify timestamp and result count shown
5. Load query from history
6. Verify query loads correctly

**Expected Results:**
- ✓ Query saved to history
- ✓ Timestamp accurate
- ✓ Result count shown
- ✓ Can load query from history
- ✓ Loaded query matches original

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test 7.4: Analytics Integration
**Objective:** Verify analytics tracking works

**Steps:**
1. Open browser console
2. Execute query
3. Verify analytics events logged
4. Open analytics dashboard
5. Verify metrics updated

**Expected Results:**
- ✓ Events logged to console
- ✓ Events saved to localStorage
- ✓ Analytics dashboard shows data
- ✓ Metrics accurate

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

## 8. User Experience Testing

### Test 8.1: First-Time User Experience
**Objective:** Verify intuitive for new users

**Steps:**
1. Ask someone unfamiliar with the tool to use it
2. Observe without providing instructions
3. Note any confusion or difficulties
4. Record time to complete first query

**Observations:**
```
[Record user observations and feedback]
```

**Time to First Query:** _____ minutes

**User Feedback:**
```
[Record user comments]
```

---

### Test 8.2: Help Documentation Effectiveness
**Objective:** Verify help documentation is useful

**Steps:**
1. Open help modal
2. Review all sections
3. Verify examples clear
4. Verify troubleshooting helpful
5. Test following instructions

**Expected Results:**
- ✓ All sections comprehensive
- ✓ Examples clear and relevant
- ✓ Troubleshooting addresses common issues
- ✓ Instructions easy to follow

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

**Suggestions for Improvement:**
```
[Record any suggestions]
```

---

## Final Test Summary

### Overall Results

**Total Tests Executed:** _____  
**Tests Passed:** _____  
**Tests Failed:** _____  
**Tests Blocked:** _____  
**Pass Rate:** _____%

### Critical Issues Found

1. **Issue:** _______________
   - **Severity:** Critical/High/Medium/Low
   - **Impact:** _______________
   - **Steps to Reproduce:** _______________

2. **Issue:** _______________
   - **Severity:** Critical/High/Medium/Low
   - **Impact:** _______________
   - **Steps to Reproduce:** _______________

### Non-Critical Issues Found

1. **Issue:** _______________
   - **Severity:** Low
   - **Impact:** _______________

2. **Issue:** _______________
   - **Severity:** Low
   - **Impact:** _______________

### Recommendations

1. _______________
2. _______________
3. _______________

### Sign-Off

- [ ] All critical tests passed
- [ ] No critical issues found
- [ ] Performance acceptable
- [ ] Accessibility compliant
- [ ] Ready for production

**Tester Name:** ___________________  
**Date:** ___________________  
**Signature:** ___________________

**Reviewer Name:** ___________________  
**Date:** ___________________  
**Signature:** ___________________

---

## Appendix A: Test Data Used

### OSDU Operators Tested
- Shell
- BP
- Equinor
- TotalEnergies
- [Add others used]

### Countries Tested
- Norway
- United States
- United Kingdom
- Brazil
- [Add others used]

### Depth Ranges Tested
- 1000-5000m
- 2000-4000m
- [Add others used]

### Log Types Tested
- Gamma Ray (GR)
- Resistivity
- Density
- [Add others used]

---

## Appendix B: Screenshots

### Desktop View
[Attach screenshot]

### Tablet View
[Attach screenshot]

### Mobile View
[Attach screenshot]

### Error States
[Attach screenshots of various error states]

### Query Preview
[Attach screenshot of complex query preview]

---

## Appendix C: Browser Console Logs

### Sample Query Execution Log
```
[Paste relevant console logs]
```

### Sample Error Log
```
[Paste any error logs encountered]
```

---

## Appendix D: Performance Metrics

### Query Generation Times
| Criteria Count | Time (ms) |
|----------------|-----------|
| 1 | ___ |
| 5 | ___ |
| 10 | ___ |

### Query Execution Times
| Query Type | Time (seconds) |
|------------|----------------|
| Simple | ___ |
| Complex | ___ |
| Large Result Set | ___ |

---

**End of Manual Testing Execution Report**
