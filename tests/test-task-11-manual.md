# Task 11: Error Handling for Missing OSDU Context - Manual Testing Guide

## Overview
This guide provides step-by-step instructions for manually testing the error handling when users attempt to filter OSDU results without having performed an OSDU search first.

## Test Environment
- **Page**: Data Catalog (`/catalog`)
- **Feature**: OSDU Conversational Filtering
- **Task**: Task 11 - Error handling for missing context

## Prerequisites
- Application running locally or deployed
- Access to Data Catalog page
- No existing OSDU search results in session

## Test Scenarios

### Scenario 1: Operator Filter Without Context

**Steps:**
1. Open Data Catalog page
2. Clear any existing chat (click reset button)
3. Enter query: `filter by operator Shell`
4. Press Enter

**Expected Result:**
```
⚠️ No OSDU Results to Filter

I detected that you want to filter data, but there are no OSDU search results available to filter.

To use filtering:
1. First perform an OSDU search
2. Then apply filters to refine those results

Example OSDU search queries:
- "show me osdu wells"
- "search osdu for production wells"
- "find osdu wells in Norway"
- "osdu exploration wells"

After getting OSDU results, you can filter them:
- "filter by operator Shell"
- "show only depth > 3000m"
- "where location is Gulf of Mexico"

💡 Tip: OSDU searches require the keyword "osdu" in your query to access external data sources.
```

**Verification:**
- [ ] Error message displays immediately
- [ ] Message includes warning icon (⚠️)
- [ ] Instructions are clear and actionable
- [ ] Example OSDU queries are provided
- [ ] Example filter queries are provided
- [ ] Tip about "osdu" keyword is included
- [ ] No filter is applied (no results shown)
- [ ] No errors in browser console

---

### Scenario 2: Depth Filter Without Context

**Steps:**
1. Ensure no OSDU context exists (reset if needed)
2. Enter query: `show only depth > 3000`
3. Press Enter

**Expected Result:**
- Same error message as Scenario 1
- No attempt to filter catalog data
- Clear guidance on how to proceed

**Verification:**
- [ ] Error message displays
- [ ] No filter applied to catalog data
- [ ] Message is consistent with Scenario 1

---

### Scenario 3: Location Filter Without Context

**Steps:**
1. Ensure no OSDU context exists
2. Enter query: `where location is Norway`
3. Press Enter

**Expected Result:**
- Same error message as previous scenarios
- No filtering attempted

**Verification:**
- [ ] Error message displays
- [ ] Consistent messaging
- [ ] No side effects

---

### Scenario 4: Type Filter Without Context

**Steps:**
1. Ensure no OSDU context exists
2. Enter query: `filter by type production`
3. Press Enter

**Expected Result:**
- Same error message
- No filtering attempted

**Verification:**
- [ ] Error message displays
- [ ] Consistent behavior

---

### Scenario 5: Status Filter Without Context

**Steps:**
1. Ensure no OSDU context exists
2. Enter query: `show only status active`
3. Press Enter

**Expected Result:**
- Same error message
- No filtering attempted

**Verification:**
- [ ] Error message displays
- [ ] Consistent behavior

---

## Positive Flow Test: Filter After OSDU Search

### Scenario 6: Complete Workflow

**Steps:**
1. Reset chat to clear any context
2. Enter query: `show me osdu wells`
3. Wait for OSDU results to load
4. Verify OSDU results are displayed
5. Enter query: `filter by operator Shell`
6. Verify filter is applied successfully

**Expected Result:**
- OSDU search returns results
- Filter query is recognized
- Filter is applied to OSDU results
- Filtered results are displayed
- No error message shown

**Verification:**
- [ ] OSDU search completes successfully
- [ ] Results are displayed in table
- [ ] Filter query is processed
- [ ] Filtered results show only matching records
- [ ] No error messages
- [ ] Filter description is shown
- [ ] Record count is updated

---

## Edge Cases

### Edge Case 1: Multiple Filter Attempts Without Context

**Steps:**
1. Clear context
2. Try: `filter by operator Shell`
3. Try: `show only depth > 3000`
4. Try: `where location is Norway`

**Expected Result:**
- Each query shows the same error message
- No cumulative errors
- Consistent behavior

**Verification:**
- [ ] Each query handled independently
- [ ] No error accumulation
- [ ] Consistent messaging

---

### Edge Case 2: Mixed Keywords

**Steps:**
1. Clear context
2. Try: `show me wells with operator Shell`

**Expected Result:**
- Should detect filter intent (contains "operator")
- Should show error message
- Should not attempt catalog search

**Verification:**
- [ ] Filter intent detected
- [ ] Error message shown
- [ ] No catalog search performed

---

## Browser Console Checks

During all tests, monitor the browser console for:

**Expected Console Logs:**
```
🔍 Filter intent: No OSDU context, skipping filter detection
⚠️ Filter intent detected but no OSDU context available
✅ No context error message displayed
```

**Should NOT See:**
- JavaScript errors
- Unhandled promise rejections
- Network errors
- React warnings

---

## Requirements Verification

### Requirement 6.2 Checklist

- [ ] **Check if osduContext exists before processing filter**
  - Verified by: Filter intent detection checks context
  - Test: All scenarios above

- [ ] **Display error message if filter attempted without OSDU context**
  - Verified by: Error message appears in all scenarios
  - Test: Scenarios 1-5

- [ ] **Suggest performing OSDU search first**
  - Verified by: Message includes step-by-step instructions
  - Test: Check message content

- [ ] **Provide example OSDU search queries**
  - Verified by: Message includes 4 example queries
  - Test: Check message content

---

## Success Criteria

Task 11 is complete when:

1. ✅ All test scenarios pass
2. ✅ Error message displays correctly
3. ✅ Example queries are helpful and accurate
4. ✅ No errors in browser console
5. ✅ Positive flow (Scenario 6) works correctly
6. ✅ Edge cases handled properly
7. ✅ User experience is clear and helpful
8. ✅ Requirements 6.2 fully satisfied

---

## Troubleshooting

### Issue: Error message not showing

**Check:**
- Is filter intent detection working?
- Is osduContext null/undefined?
- Are there console errors?

**Debug:**
```javascript
// In browser console:
// Check if filter keywords are detected
console.log('Query:', yourQuery);
console.log('Has filter keyword:', ['filter', 'operator', 'depth'].some(k => yourQuery.includes(k)));
```

---

### Issue: Filter applied to catalog data instead

**Check:**
- Is filter intent detection running before catalog search?
- Is early return working?

**Debug:**
- Check console logs for execution order
- Verify "Early return to prevent further processing" log appears

---

## Test Results Template

```
Date: ___________
Tester: ___________

Scenario 1: [ ] Pass [ ] Fail
Scenario 2: [ ] Pass [ ] Fail
Scenario 3: [ ] Pass [ ] Fail
Scenario 4: [ ] Pass [ ] Fail
Scenario 5: [ ] Pass [ ] Fail
Scenario 6: [ ] Pass [ ] Fail
Edge Case 1: [ ] Pass [ ] Fail
Edge Case 2: [ ] Pass [ ] Fail

Console Errors: [ ] None [ ] Found (describe below)

Notes:
_________________________________
_________________________________
_________________________________

Overall Result: [ ] PASS [ ] FAIL
```

---

## Next Steps After Testing

If all tests pass:
1. Mark Task 11 as complete
2. Update task status in tasks.md
3. Proceed to Task 12 (error handling for invalid filters)

If tests fail:
1. Document specific failures
2. Review implementation
3. Fix issues
4. Re-test

---

## Related Documentation

- Requirements: `.kiro/specs/osdu-conversational-filtering/requirements.md` (Requirement 6.2)
- Design: `.kiro/specs/osdu-conversational-filtering/design.md` (Error Handling section)
- Implementation: `src/app/catalog/page.tsx` (handleChatSearch function)
